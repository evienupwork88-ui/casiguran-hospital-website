import nodemailer from "nodemailer";
import { env } from "../config/env";
import { supabase } from "../config/supabase";

type PendingChangeRequestEmail = {
  id: string;
  requester_name: string;
  resource: string;
  action: string;
  status: string;
  method: string;
  request_path: string;
  request_body: Record<string, unknown>;
  files: { fieldName: string; originalName: string; size: number }[];
  created_at: string;
  admin_email_attempts: number;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function formatEmail(request: PendingChangeRequestEmail) {
  const submittedFields = Object.entries(request.request_body ?? {});
  const details = submittedFields.length
    ? submittedFields.map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`).join("\n")
    : request.method === "DELETE"
      ? "No form fields were submitted; this is a deletion request."
      : "No form fields were submitted.";
  const files = request.files?.length
    ? `\n\nFiles:\n${request.files.map((file) => `- ${file.originalName} (${file.fieldName}, ${Math.ceil(file.size / 1024)} KB)`).join("\n")}`
    : "";
  const excerpt = `${details}${files}`.slice(0, 5000);
  return {
    subject: `Editor approval needed: ${request.resource} · ${request.action}`,
    text: [
      "A new Editor change request is waiting for your review.",
      "",
      `Requested by: ${request.requester_name}`,
      `Change: ${request.resource} · ${request.action}`,
      `Current status: ${request.status}`,
      `Submitted: ${request.created_at}`,
      `Request ID: ${request.id}`,
      `Target: ${request.method} ${request.request_path}`,
      "",
      "Submitted details:",
      excerpt,
      "",
      "Open the Admin Console → Notifications to approve or reject this request.",
    ].join("\n"),
  };
}

let missingSmtpWarningLogged = false;

export async function sendPendingAdminChangeRequestEmails(): Promise<void> {
  if (!env.gmailSmtpUser || !env.gmailSmtpAppPassword || !env.passwordResetEmailFrom) {
    if (!missingSmtpWarningLogged) {
      console.warn("[change request email] Gmail SMTP is not configured; approval emails remain queued.");
      missingSmtpWarningLogged = true;
    }
    return;
  }

  const { data: admins, error: adminsError } = await supabase
    .from("admin_users")
    .select("email")
    .eq("role", "admin")
    .eq("is_active", true);
  if (adminsError) throw new Error(`Failed to load Admin recipients for change-request emails: ${adminsError.message}`);
  const recipients = [...new Set((admins ?? []).map(({ email }) => email).filter((email): email is string => Boolean(email)))];
  if (!recipients.length) throw new Error("No active Admin email address is available for change-request notifications.");

  const { data, error } = await supabase.rpc("claim_pending_admin_change_request_emails", { p_limit: 20 });
  if (error) throw new Error(`Failed to claim change-request emails: ${error.message}`);
  const requests = (data ?? []) as PendingChangeRequestEmail[];
  if (!requests.length) return;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailSmtpUser,
      pass: env.gmailSmtpAppPassword.replace(/\s/g, ""),
    },
  });

  for (const request of requests) {
    try {
      const email = formatEmail(request);
      await transporter.sendMail({
        from: env.passwordResetEmailFrom,
        to: recipients,
        ...email,
      });
      const { error: updateError } = await supabase
        .from("admin_change_requests")
        .update({
          admin_email_sent_at: new Date().toISOString(),
          admin_email_next_attempt_at: null,
          admin_email_last_error: null,
        })
        .eq("id", request.id)
        .eq("admin_email_attempts", request.admin_email_attempts);
      if (updateError) throw new Error(`Failed to mark change-request email sent: ${updateError.message}`);
    } catch (error) {
      const message = errorMessage(error).slice(0, 1000);
      const { error: updateError } = await supabase
        .from("admin_change_requests")
        .update({ admin_email_last_error: message })
        .eq("id", request.id)
        .eq("admin_email_attempts", request.admin_email_attempts);
      if (updateError) {
        console.error(`[change request email] failed to persist delivery error for ${request.id}:`, updateError.message);
      }
      console.error(`[change request email] delivery failed for ${request.id}: ${message}`);
    }
  }
}

let workerStarted = false;
let workerRunning = false;

export function startAdminChangeRequestEmailWorker(): void {
  if (workerStarted) return;
  workerStarted = true;

  const run = async () => {
    if (workerRunning) return;
    workerRunning = true;
    try {
      await sendPendingAdminChangeRequestEmails();
    } catch (error) {
      console.error("[change request email worker failed]", error);
    } finally {
      workerRunning = false;
    }
  };

  void run();
  setInterval(() => void run(), 60_000);
}
