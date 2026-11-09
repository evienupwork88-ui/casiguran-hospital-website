import { createHash } from "node:crypto";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { supabase } from "../config/supabase";

const ALERT_WINDOW_MS = 15 * 60 * 1000;
const FAILED_AUTH_THRESHOLD = 5;
const ACCESS_DENIED_THRESHOLD = 10;
const ARCHIVE_BATCH_SIZE = 25;
const AUDIT_SCAN_PAGE_SIZE = 1000;

type AuditEvent = {
  id: string;
  event_type: string;
  action: string;
  status_code: number;
  ip_address: string | null;
  occurred_at: string;
};

type ArchiveOutboxItem = {
  id: string;
  audit_log_id: string | null;
  database_audit_log_id: number | null;
  attempts: number;
};

type SecurityAlertRow = {
  id: string;
  category: "failed_authentication" | "repeated_access_denied";
  severity: "medium" | "high";
  title: string;
  summary: string;
  source_ip: string;
  event_count: number;
  created_at: string;
  email_attempts: number;
};

export type AdminSecurityAlert = {
  id: string;
  category: SecurityAlertRow["category"];
  severity: SecurityAlertRow["severity"];
  title: string;
  summary: string;
  sourceIp: string;
  eventCount: number;
  createdAt: string;
};

const r2Client = env.r2ArchiveEnabled
  ? new S3Client({
    region: "auto",
    endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.r2AccessKeyId,
      secretAccessKey: env.r2SecretAccessKey,
    },
  })
  : null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function errorStatusCode(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("$metadata" in error)) return undefined;
  const metadata = error.$metadata;
  if (typeof metadata !== "object" || metadata === null || !("httpStatusCode" in metadata)) return undefined;
  return typeof metadata.httpStatusCode === "number" ? metadata.httpStatusCode : undefined;
}

async function updateArchiveOutbox(
  outboxId: string,
  values: {
    attempts: number;
    next_attempt_at: string;
    last_error: string | null;
    archived_at?: string;
  },
): Promise<void> {
  const { error } = await supabase
    .from("audit_archive_outbox")
    .update(values)
    .eq("id", outboxId);
  if (error) throw new Error(`Failed to update audit archive queue: ${error.message}`);
}

async function archiveAuditLog(
  event: Record<string, unknown>,
  auditLogId: string,
  stream: "request" | "database",
): Promise<void> {
  if (!r2Client) throw new Error("Cloudflare R2 audit archive is not configured.");

  const body = JSON.stringify(event);
  const checksum = createHash("sha256").update(body).digest("hex");
  const timestamp = new Date(String(event.occurred_at));
  if (Number.isNaN(timestamp.getTime())) throw new Error(`Audit event ${auditLogId} has an invalid timestamp.`);
  const key = `audit-logs/${stream}/${timestamp.toISOString().slice(0, 7)}/${auditLogId}.json`;

  try {
    await r2Client.send(new PutObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
      Body: body,
      ContentType: "application/json",
      Metadata: { sha256: checksum },
      IfNoneMatch: "*",
    }));
  } catch (error) {
    if (errorStatusCode(error) !== 412) throw error;

    const existing = await r2Client.send(new HeadObjectCommand({
      Bucket: env.r2BucketName,
      Key: key,
    }));
    if (existing.Metadata?.sha256 !== checksum) {
      throw new Error(`Audit archive integrity check failed for event ${auditLogId}.`);
    }
  }
}

async function archivePendingAuditLogs(): Promise<void> {
  if (!r2Client) return;

  const { data: outbox, error: outboxError } = await supabase
    .from("audit_archive_outbox")
    .select("id, audit_log_id, database_audit_log_id, attempts")
    .is("archived_at", null)
    .lte("next_attempt_at", new Date().toISOString())
    .order("created_at", { ascending: true })
    .limit(ARCHIVE_BATCH_SIZE);
  if (outboxError) throw new Error(`Failed to read audit archive queue: ${outboxError.message}`);
  const queue = (outbox ?? []) as ArchiveOutboxItem[];
  if (!queue.length) return;

  const requestIds = queue.flatMap((item) => item.audit_log_id ? [item.audit_log_id] : []);
  const databaseIds = queue.flatMap((item) => item.database_audit_log_id === null ? [] : [item.database_audit_log_id]);
  const eventById = new Map<string, Record<string, unknown>>();
  if (requestIds.length) {
    const { data, error } = await supabase.from("audit_logs").select("*").in("id", requestIds);
    if (error) throw new Error(`Failed to load queued request audit events: ${error.message}`);
    for (const event of data ?? []) eventById.set(`request:${event.id}`, event as Record<string, unknown>);
  }
  if (databaseIds.length) {
    const { data, error } = await supabase.from("database_audit_logs").select("*").in("id", databaseIds);
    if (error) throw new Error(`Failed to load queued database audit events: ${error.message}`);
    for (const event of data ?? []) eventById.set(`database:${event.id}`, event as Record<string, unknown>);
  }

  for (const item of queue) {
    const attempts = item.attempts + 1;
    try {
      const requestId = item.audit_log_id;
      const databaseId = item.database_audit_log_id;
      if ((requestId === null) === (databaseId === null)) {
        throw new Error(`Archive queue entry ${item.id} must reference exactly one audit event.`);
      }
      const stream = requestId === null ? "database" : "request";
      const auditLogId = String(requestId ?? databaseId);
      const event = eventById.get(`${stream}:${auditLogId}`);
      if (!event) throw new Error(`Queued ${stream} audit event ${auditLogId} was not found.`);
      await archiveAuditLog(event, auditLogId, stream);
      await updateArchiveOutbox(item.id, {
        attempts,
        next_attempt_at: new Date().toISOString(),
        last_error: null,
        archived_at: new Date().toISOString(),
      });
    } catch (error) {
      const delayMs = Math.min(24 * 60 * 60 * 1000, 15_000 * (2 ** Math.min(attempts - 1, 12)));
      const message = errorMessage(error).slice(0, 1000);
      await updateArchiveOutbox(item.id, {
        attempts,
        next_attempt_at: new Date(Date.now() + delayMs).toISOString(),
        last_error: message,
      });
      console.error(`[audit archive] queue entry ${item.id} upload failed: ${message}`);
    }
  }
}

async function createSecurityAlert(input: {
  category: SecurityAlertRow["category"];
  ipAddress: string;
  count: number;
  windowStart: string;
  bucket: number;
}): Promise<void> {
  const fingerprint = createHash("sha256")
    .update(`${input.category}:${input.ipAddress}:${input.bucket}`)
    .digest("hex");
  const isFailedAuth = input.category === "failed_authentication";
  const { error } = await supabase.from("security_alerts").upsert({
    fingerprint,
    category: input.category,
    severity: isFailedAuth ? "high" : "medium",
    title: isFailedAuth ? "Repeated sign-in or MFA failures" : "Repeated denied admin requests",
    summary: isFailedAuth
      ? `${input.count} failed sign-in or MFA attempts came from this IP within 15 minutes. This can also be caused by legitimate login mistakes.`
      : `${input.count} admin requests received HTTP 401 or 403 from this IP within 15 minutes. Expired sessions can also cause these responses.`,
    source_ip: input.ipAddress,
    event_count: input.count,
    window_start: input.windowStart,
  }, {
    onConflict: "fingerprint",
    ignoreDuplicates: true,
  });
  if (error) throw new Error(`Failed to create security alert: ${error.message}`);
}

async function fetchRecentFailedAuthEvents(windowStart: string): Promise<AuditEvent[]> {
  const events: AuditEvent[] = [];
  for (let offset = 0; ; offset += AUDIT_SCAN_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, event_type, action, status_code, ip_address, occurred_at")
      .eq("event_type", "auth_event")
      .in("action", ["login_failed", "mfa_verification_failed"])
      .gte("occurred_at", windowStart)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + AUDIT_SCAN_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to scan authentication failures: ${error.message}`);
    const page = (data ?? []) as AuditEvent[];
    events.push(...page);
    if (page.length < AUDIT_SCAN_PAGE_SIZE) return events;
  }
}

async function fetchRecentDeniedEvents(windowStart: string): Promise<AuditEvent[]> {
  const events: AuditEvent[] = [];
  for (let offset = 0; ; offset += AUDIT_SCAN_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, event_type, action, status_code, ip_address, occurred_at")
      .eq("event_type", "access_denied")
      .in("status_code", [401, 403])
      .gte("occurred_at", windowStart)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + AUDIT_SCAN_PAGE_SIZE - 1);
    if (error) throw new Error(`Failed to scan denied admin requests: ${error.message}`);
    const page = (data ?? []) as AuditEvent[];
    events.push(...page);
    if (page.length < AUDIT_SCAN_PAGE_SIZE) return events;
  }
}

async function scanSecurityActivity(): Promise<void> {
  const now = Date.now();
  const windowStartMs = now - ALERT_WINDOW_MS;
  const windowStart = new Date(windowStartMs).toISOString();
  const [failedAuthEvents, deniedEvents] = await Promise.all([
    fetchRecentFailedAuthEvents(windowStart),
    fetchRecentDeniedEvents(windowStart),
  ]);

  const failedAuth = new Map<string, number>();
  const deniedRequests = new Map<string, number>();
  for (const event of failedAuthEvents) {
    if (!event.ip_address) continue;
    failedAuth.set(event.ip_address, (failedAuth.get(event.ip_address) ?? 0) + 1);
  }
  for (const event of deniedEvents) {
    if (!event.ip_address) continue;
    deniedRequests.set(event.ip_address, (deniedRequests.get(event.ip_address) ?? 0) + 1);
  }

  const bucket = Math.floor(now / ALERT_WINDOW_MS);
  for (const [ipAddress, count] of failedAuth) {
    if (count >= FAILED_AUTH_THRESHOLD) {
      await createSecurityAlert({
        category: "failed_authentication",
        ipAddress,
        count,
        windowStart,
        bucket,
      });
    }
  }
  for (const [ipAddress, count] of deniedRequests) {
    if (count >= ACCESS_DENIED_THRESHOLD) {
      await createSecurityAlert({
        category: "repeated_access_denied",
        ipAddress,
        count,
        windowStart,
        bucket,
      });
    }
  }
}

let missingSmtpWarningLogged = false;

async function sendPendingSecurityAlertEmails(): Promise<void> {
  if (!env.gmailSmtpUser || !env.gmailSmtpAppPassword || !env.passwordResetEmailFrom) {
    if (!missingSmtpWarningLogged) {
      console.warn("[security alerts] Gmail SMTP is not configured; email notifications remain queued.");
      missingSmtpWarningLogged = true;
    }
    return;
  }

  const { data: alerts, error: claimError } = await supabase
    .rpc("claim_pending_security_alert_emails", { p_limit: 20 });
  if (claimError) throw new Error(`Failed to claim security alert emails: ${claimError.message}`);
  const claimed = (alerts ?? []) as SecurityAlertRow[];
  if (!claimed.length) return;

  const { data: admins, error: adminError } = await supabase
    .from("admin_users")
    .select("email")
    .eq("role", "admin")
    .eq("is_active", true);
  if (adminError) throw new Error(`Failed to load security alert recipients: ${adminError.message}`);
  const recipients = [...new Set((admins ?? []).map((admin) => admin.email).filter((email): email is string => Boolean(email)))];
  if (!recipients.length) throw new Error("No active Admin email address is available for security alerts.");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailSmtpUser,
      pass: env.gmailSmtpAppPassword.replace(/\s/g, ""),
    },
  });
  for (const alert of claimed) {
    try {
      await transporter.sendMail({
        from: env.passwordResetEmailFrom,
        to: recipients,
        subject: `[${alert.severity.toUpperCase()}] Casiguran Hospital CMS security alert`,
        text: `${alert.title}\n\n${alert.summary}\nSource IP: ${alert.source_ip}\nEvents: ${alert.event_count}\nTime: ${alert.created_at}\n\nReview Admin → Audit History. This alert is a signal for review, not proof of an attack.`,
      });
      const { error: updateError } = await supabase
        .from("security_alerts")
        .update({ email_sent_at: new Date().toISOString(), email_last_error: null })
        .eq("id", alert.id)
        .eq("email_attempts", alert.email_attempts);
      if (updateError) throw new Error(`Failed to mark security alert email sent: ${updateError.message}`);
    } catch (error) {
      const message = errorMessage(error).slice(0, 1000);
      const { error: updateError } = await supabase
        .from("security_alerts")
        .update({ email_last_error: message })
        .eq("id", alert.id)
        .eq("email_attempts", alert.email_attempts);
      if (updateError) {
        console.error(`[security alerts] failed to persist email delivery error for ${alert.id}:`, updateError.message);
      }
      console.error(`[security alerts] email delivery failed for ${alert.id}: ${message}`);
    }
  }
}

export async function getAdminSecurityAlertSummary(): Promise<{
  count: number;
  items: AdminSecurityAlert[];
  auditArchiveEnabled: boolean;
  pendingArchiveCount: number;
  securityAlertEmailEnabled: boolean;
  pendingEmailCount: number;
}> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [alertsResult, archiveResult, pendingEmailResult] = await Promise.all([
    supabase
      .from("security_alerts")
      .select("id, category, severity, title, summary, source_ip, event_count, created_at", { count: "exact" })
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("audit_archive_outbox")
      .select("audit_log_id", { count: "exact", head: true })
      .is("archived_at", null),
    supabase
      .from("security_alerts")
      .select("id", { count: "exact", head: true })
      .is("email_sent_at", null),
  ]);
  if (alertsResult.error) throw new Error(`Failed to load security alerts: ${alertsResult.error.message}`);
  if (alertsResult.count === null) throw new Error("Failed to load security alert count.");
  if (archiveResult.error) throw new Error(`Failed to load audit archive status: ${archiveResult.error.message}`);
  if (archiveResult.count === null) throw new Error("Failed to load audit archive queue count.");
  if (pendingEmailResult.error) throw new Error(`Failed to load pending security alert email count: ${pendingEmailResult.error.message}`);
  if (pendingEmailResult.count === null) throw new Error("Failed to load pending security alert email count.");
  return {
    count: alertsResult.count,
    items: ((alertsResult.data ?? []) as Omit<SecurityAlertRow, "email_attempts">[]).map((alert) => ({
      id: alert.id,
      category: alert.category,
      severity: alert.severity,
      title: alert.title,
      summary: alert.summary,
      sourceIp: alert.source_ip,
      eventCount: alert.event_count,
      createdAt: alert.created_at,
    })),
    auditArchiveEnabled: env.r2ArchiveEnabled,
    pendingArchiveCount: archiveResult.count,
    securityAlertEmailEnabled: Boolean(
      env.gmailSmtpUser && env.gmailSmtpAppPassword && env.passwordResetEmailFrom,
    ),
    pendingEmailCount: pendingEmailResult.count,
  };
}

let workerRunning = false;
let workerStarted = false;

export function startSecurityMonitoringWorkers(): void {
  if (workerStarted) return;
  workerStarted = true;

  if (!r2Client) {
    console.warn("[audit archive] Cloudflare R2 is not configured; archive delivery is disabled.");
  }

  const run = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
      const jobs: Promise<void>[] = [scanSecurityActivity(), sendPendingSecurityAlertEmails()];
      if (r2Client) jobs.push(archivePendingAuditLogs());
      const results = await Promise.allSettled(jobs);
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("[security monitoring worker failed]", result.reason);
        }
      }
    } finally {
      workerRunning = false;
    }
  };

  void run();
  setInterval(() => void run(), 60_000);
}
