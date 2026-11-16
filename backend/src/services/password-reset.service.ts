import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CompletePasswordResetInput } from "../validation/auth.schema";
import { hashPassword } from "./password-hash.service";

const TOKEN_LIFETIME_MINUTES = 10;
const PWNED_PASSWORDS_TIMEOUT_MS = 5000;
const COMMON_PASSWORDS = new Set([
  "password",
  "password123",
  "123456789012",
  "qwerty123456",
  "letmein123456",
  "admin1234567",
]);

function getTransporter() {
  if (!env.gmailSmtpUser || !env.gmailSmtpAppPassword || !env.passwordResetEmailFrom) {
    throw new AppError(503, "Password reset email is not configured. Contact the site administrator.", "PASSWORD_RESET_EMAIL_NOT_CONFIGURED");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.gmailSmtpUser,
      pass: env.gmailSmtpAppPassword.replace(/\s/g, ""),
    },
  });
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function getFrontendOrigin(): string {
  const frontendUrl = new URL(env.frontendUrl);
  if (!["http:", "https:"].includes(frontendUrl.protocol) || (env.isProduction && frontendUrl.protocol !== "https:")) {
    throw new AppError(503, "The password reset website URL is not configured securely.", "PASSWORD_RESET_URL_NOT_CONFIGURED");
  }
  return frontendUrl.origin;
}

function buildResetUrl(token: string): string {
  const resetUrl = new URL("/admin/reset-password", getFrontendOrigin());
  resetUrl.hash = `token=${token}`;
  return resetUrl.toString();
}

function makePasswordResetHtml(accountName: string, resetUrl: string): string {
  const safeName = escapeHtml(accountName || "staff member");
  const safeUrl = escapeHtml(resetUrl);
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px">
      <tr><td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #e2e8f0;border-radius:16px">
          <tr><td style="padding:32px">
            <p style="margin:0;color:#6d28d9;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase">Casiguran District Hospital</p>
            <h1 style="margin:16px 0 8px;font-size:24px">Password reset request</h1>
            <p style="font-size:15px;line-height:1.6">Hello ${safeName}, we received a request to reset the password for your CMS account.</p>
            <p style="margin:28px 0;text-align:center">
              <a href="${safeUrl}" style="display:inline-block;padding:14px 24px;border-radius:10px;background:#6d28d9;color:#fff;font-weight:bold;text-decoration:none">Reset password</a>
            </p>
            <p style="font-size:14px;line-height:1.6"><strong>This single-use link expires in ${TOKEN_LIFETIME_MINUTES} minutes.</strong> Your password will remain unchanged unless you complete the reset.</p>
            <p style="font-size:14px;line-height:1.6">If you did not request this reset, ignore this email. Do not forward this link or share it with anyone.</p>
            <hr style="margin:24px 0;border:0;border-top:1px solid #e2e8f0">
            <p style="margin:0;color:#64748b;font-size:12px">Casiguran District Hospital · Admin CMS</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function requestPasswordReset(emailInput: string): Promise<void> {
  const transporter = getTransporter();
  getFrontendOrigin();
  const email = emailInput.trim().toLowerCase();
  const { data: user, error: lookupError } = await supabase
    .from("admin_users")
    .select("id, email, first_name, middle_name, last_name, name_extension, full_name, is_active")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(`Failed to look up password-reset account: ${lookupError.message}`);
  if (!user || !user.is_active) return;

  const token = crypto.randomBytes(32).toString("hex");
  const { data: issued, error: issueError } = await supabase.rpc("issue_password_reset_token", {
    p_user_id: user.id,
    p_token_hash: hashToken(token),
  });
  if (issueError) throw new Error(`Failed to create password-reset token: ${issueError.message}`);
  if (issued !== true) return;

  const accountName = [
    user.first_name,
    user.middle_name,
    user.last_name,
    user.name_extension,
  ].filter(Boolean).join(" ") || user.full_name;
  const resetUrl = buildResetUrl(token);

  try {
    await transporter.sendMail({
      from: env.passwordResetEmailFrom,
      to: email,
      subject: "Reset your Casiguran District Hospital CMS password",
      text: [
        `Hello ${accountName || "staff member"},`,
        "",
        "We received a request to reset the password for your Casiguran District Hospital CMS account.",
        `Reset your password using this secure link: ${resetUrl}`,
        "",
        `This single-use link expires in ${TOKEN_LIFETIME_MINUTES} minutes.`,
        "Your password will remain unchanged unless you complete the reset.",
        "If you did not request this reset, ignore this email. Your account remains secure.",
      ].join("\n"),
      html: makePasswordResetHtml(accountName, resetUrl),
    });
  } catch (sendError) {
    console.error("[password reset] Email delivery failed:", sendError instanceof Error ? sendError.message : "unknown error");
    const { error: invalidateError } = await supabase.rpc("invalidate_password_reset_token", {
      p_user_id: user.id,
      p_token_hash: hashToken(token),
    });
    if (invalidateError) console.error("[password reset] Failed to invalidate an undelivered reset token:", invalidateError.message);
  }
}

async function assertPasswordNotCompromised(password: string): Promise<void> {
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new AppError(400, "Choose a password that is not commonly used or exposed in known data breaches.", "PASSWORD_COMPROMISED");
  }

  const digest = crypto.createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = digest.slice(0, 5);
  let response: Response;
  try {
    response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true",
        "User-Agent": "Casiguran-District-Hospital-Password-Reset",
      },
      signal: AbortSignal.timeout(PWNED_PASSWORDS_TIMEOUT_MS),
    });
  } catch {
    throw new AppError(503, "Password safety checks are temporarily unavailable. Please try again later.", "PASSWORD_CHECK_UNAVAILABLE");
  }

  if (!response.ok) {
    throw new AppError(503, "Password safety checks are temporarily unavailable. Please try again later.", "PASSWORD_CHECK_UNAVAILABLE");
  }

  const suffix = digest.slice(5);
  const breached = (await response.text()).split(/\r?\n/).some((line) => {
    const [candidate, count] = line.trim().split(":");
    return candidate?.toUpperCase() === suffix && Number(count) > 0;
  });
  if (breached) {
    throw new AppError(400, "Choose a password that is not commonly used or exposed in known data breaches.", "PASSWORD_COMPROMISED");
  }
}

export async function completePasswordReset(
  input: CompletePasswordResetInput,
  meta: { ipAddress: string | null; userAgent: string | null },
): Promise<void> {
  const tokenHash = hashToken(input.token);
  const { data: token, error: tokenError } = await supabase
    .from("password_reset_tokens")
    .select("user_id")
    .eq("token_hash", tokenHash)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (tokenError) throw new Error(`Failed to validate password-reset token: ${tokenError.message}`);
  if (!token) {
    throw new AppError(400, "This reset link is invalid or expired. Request a new one.", "INVALID_OR_EXPIRED_RESET_TOKEN");
  }

  await assertPasswordNotCompromised(input.password);
  const passwordHash = await hashPassword(input.password);
  const { data: completed, error } = await supabase.rpc("consume_password_reset_token", {
    p_token_hash: tokenHash,
    p_password_hash: passwordHash,
    p_ip_address: meta.ipAddress,
    p_user_agent: meta.userAgent,
  });

  if (error) throw new Error(`Failed to complete password reset: ${error.message}`);
  if (completed !== true) {
    throw new AppError(400, "This reset link is invalid or expired. Request a new one.", "INVALID_OR_EXPIRED_RESET_TOKEN");
  }
}
