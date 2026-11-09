import PDFDocument from "pdfkit";
import { supabase } from "../config/supabase";

export type AuditLogItem = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  eventType: "admin_action" | "auth_event" | "access_denied";
  action: string;
  method: string;
  route: string;
  statusCode: number;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
};

export type AuditMonthlyStats = {
  month: string;
  total: number;
  adminActions: number;
  authEvents: number;
  accessDenied: number;
  failures: number;
  authFailures: number;
  unauthorizedResponses: number;
  forbiddenResponses: number;
  otherClientErrors: number;
  serverErrors: number;
  daily: Array<{ date: string; count: number }>;
};

type AuditLogInput = Omit<AuditLogItem, "id" | "occurredAt">;

const AUDIT_LOG_COLUMNS = "id, actor_id, actor_email, event_type, action, method, route, status_code, ip_address, user_agent, occurred_at";
const PAGE_SIZE = 1000;
const AUDIT_TIME_ZONE = "Asia/Manila";

function mapAuditLog(row: Record<string, unknown>): AuditLogItem {
  return {
    id: String(row.id),
    actorId: typeof row.actor_id === "string" ? row.actor_id : null,
    actorEmail: typeof row.actor_email === "string" ? row.actor_email : null,
    eventType: row.event_type as AuditLogItem["eventType"],
    action: String(row.action),
    method: String(row.method),
    route: String(row.route),
    statusCode: Number(row.status_code),
    ipAddress: typeof row.ip_address === "string" ? row.ip_address : null,
    userAgent: typeof row.user_agent === "string" ? row.user_agent : null,
    occurredAt: String(row.occurred_at),
  };
}

function getMonthBounds(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new Error("Invalid audit month");
  }
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const start = new Date(`${month}-01T00:00:00+08:00`);
  const end = new Date(monthNumber === 12
    ? `${year + 1}-01-01T00:00:00+08:00`
    : `${year}-${String(monthNumber + 1).padStart(2, "0")}-01T00:00:00+08:00`);
  return { start: start.toISOString(), end: end.toISOString() };
}

function manilaDate(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: AUDIT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function fetchAuditLogPage(from: string, to: string, offset: number) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_LOG_COLUMNS)
    .gte("occurred_at", from)
    .lt("occurred_at", to)
    .order("occurred_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) throw new Error(`Failed to load monthly audit logs: ${error.message}`);
  return (data ?? []).map((row) => mapAuditLog(row as Record<string, unknown>));
}

async function fetchAllAuditLogsForMonth(month: string): Promise<AuditLogItem[]> {
  const { start, end } = getMonthBounds(month);
  const items: AuditLogItem[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const page = await fetchAuditLogPage(start, end, offset);
    items.push(...page);
    if (page.length < PAGE_SIZE) return items;
  }
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    event_type: input.eventType,
    action: input.action,
    method: input.method,
    route: input.route,
    status_code: input.statusCode,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
}

export async function listAuditLogs(month?: string, limit = 100): Promise<AuditLogItem[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_LOG_COLUMNS)
    .gte("occurred_at", month ? getMonthBounds(month).start : "1970-01-01T00:00:00.000Z")
    .lt("occurred_at", month ? getMonthBounds(month).end : new Date().toISOString())
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load audit logs: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAuditLog(row as Record<string, unknown>));
}

export async function getAuditMonthlyStats(month: string): Promise<AuditMonthlyStats> {
  const dailyCounts = new Map<string, number>();
  const { start, end } = getMonthBounds(month);
  let total = 0;
  let adminActions = 0;
  let authEvents = 0;
  let accessDenied = 0;
  let failures = 0;
  let authFailures = 0;
  let unauthorizedResponses = 0;
  let forbiddenResponses = 0;
  let otherClientErrors = 0;
  let serverErrors = 0;

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("event_type, action, status_code, occurred_at")
      .gte("occurred_at", start)
      .lt("occurred_at", end)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`Failed to load monthly audit statistics: ${error.message}`);
    const page = data ?? [];

    for (const item of page) {
      total += 1;
      if (item.event_type === "admin_action") adminActions += 1;
      if (item.event_type === "auth_event") authEvents += 1;
      if (item.event_type === "access_denied") accessDenied += 1;
      if (item.status_code >= 400) failures += 1;
      if (item.event_type === "auth_event" && ["login_failed", "mfa_verification_failed"].includes(item.action)) {
        authFailures += 1;
      }
      if (item.status_code === 401) unauthorizedResponses += 1;
      else if (item.status_code === 403) forbiddenResponses += 1;
      else if (item.status_code >= 400 && item.status_code < 500) otherClientErrors += 1;
      else if (item.status_code >= 500) serverErrors += 1;

      const date = manilaDate(item.occurred_at);
      dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1);
    }

    if (page.length < PAGE_SIZE) break;
  }

  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const daily = Array.from({ length: daysInMonth }, (_, index) => {
    const date = `${year}-${String(monthNumber).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`;
    return { date, count: dailyCounts.get(date) ?? 0 };
  });

  return {
    month,
    total,
    adminActions,
    authEvents,
    accessDenied,
    failures,
    authFailures,
    unauthorizedResponses,
    forbiddenResponses,
    otherClientErrors,
    serverErrors,
    daily,
  };
}

function pdfText(value: string | number | null): string {
  return String(value ?? "-")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\xff]/g, "?");
}

function formatAuditTimestamp(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    timeZone: AUDIT_TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

export function renderAuditLogsPdf(month: string, items: AuditLogItem[]): Promise<Buffer> {
  const document = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 34, right: 32, bottom: 38, left: 32 },
    bufferPages: true,
    info: {
      Title: `Audit History ${month}`,
      Author: "Casiguran District Hospital",
      Subject: "Monthly Admin audit history",
    },
  });
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("error", reject);
    document.on("end", () => resolve(Buffer.concat(chunks)));

    const columns = [
      { label: "Timestamp (Manila)", width: 100 },
      { label: "Actor", width: 95 },
      { label: "Event / action", width: 116 },
      { label: "Method / route", width: 155 },
      { label: "Status", width: 42 },
      { label: "IP address", width: 80 },
      { label: "User agent", width: 188 },
    ] as const;
    const tableWidth = columns.reduce((total, column) => total + column.width, 0);
    const pageBottom = () => document.page.height - document.page.margins.bottom;

    function drawTableHeader() {
      let x = document.page.margins.left;
      const y = document.y;
      document.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff");
      document.rect(x, y, tableWidth, 20).fill("#4c1d95");
      for (const column of columns) {
        document.text(column.label, x + 4, y + 6, {
          width: column.width - 8,
          height: 10,
          lineBreak: false,
        });
        x += column.width;
      }
      document.y = y + 24;
      document.font("Helvetica").fontSize(7).fillColor("#1e293b");
    }

    document.font("Helvetica-Bold").fontSize(16).fillColor("#1e1b4b")
      .text("Casiguran District Hospital — Audit History");
    document.moveDown(0.35);
    document.font("Helvetica").fontSize(9).fillColor("#475569")
      .text(`Month: ${month} · Timezone: Asia/Manila · Events: ${items.length}`);
    document.moveDown(0.9);
    drawTableHeader();

    for (const [rowIndex, item] of items.entries()) {
      const values = [
        pdfText(formatAuditTimestamp(item.occurredAt)),
        pdfText(item.actorEmail ?? item.actorId ?? "Unknown / unauthenticated"),
        pdfText(`${item.eventType}\n${item.action}`),
        pdfText(`${item.method} ${item.route}`),
        pdfText(item.statusCode),
        pdfText(item.ipAddress),
        pdfText(item.userAgent),
      ];
      const rowHeight = Math.max(...values.map((value, index) =>
        document.heightOfString(value, { width: columns[index].width - 8 }),
      )) + 8;

      if (document.y + rowHeight > pageBottom()) {
        document.addPage();
        document.font("Helvetica-Bold").fontSize(10).fillColor("#1e1b4b")
          .text(`Audit History — ${month}`, { continued: false });
        document.moveDown(0.6);
        drawTableHeader();
      }

      const rowY = document.y;
      if (rowIndex % 2 === 1) {
        document.rect(document.page.margins.left, rowY - 2, tableWidth, rowHeight).fill("#f8fafc");
      }
      let x = document.page.margins.left;
      document.font("Helvetica").fontSize(7).fillColor("#1e293b");
      values.forEach((value, index) => {
        document.text(value, x + 4, rowY + 2, {
          width: columns[index].width - 8,
          height: rowHeight - 4,
        });
        x += columns[index].width;
      });
      document.y = rowY + rowHeight;
      document.moveTo(document.page.margins.left, document.y)
        .lineTo(document.page.margins.left + tableWidth, document.y)
        .strokeColor("#e2e8f0")
        .lineWidth(0.4)
        .stroke();
    }

    const pages = document.bufferedPageRange();
    for (let index = 0; index < pages.count; index += 1) {
      document.switchToPage(index);
      document.font("Helvetica").fontSize(7).fillColor("#64748b")
        .text(`Confidential · Generated ${formatAuditTimestamp(new Date().toISOString())}`, 32, pageBottom() + 8, {
          width: 500,
          lineBreak: false,
        })
        .text(`Page ${index + 1} of ${pages.count}`, 0, pageBottom() + 8, {
          align: "right",
          lineBreak: false,
        });
    }

    document.end();
  });
}

export async function exportAuditLogsPdf(month: string): Promise<Buffer> {
  return renderAuditLogsPdf(month, await fetchAllAuditLogsForMonth(month));
}
