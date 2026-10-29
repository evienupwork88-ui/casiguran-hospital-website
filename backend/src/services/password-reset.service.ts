import crypto from "node:crypto";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CompletePasswordResetInput } from "../validation/auth.schema";

const OTP_LIFETIME_MINUTES = 10;

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

function hashOtp(email: string, otp: string): string {
  return crypto
    .createHmac("sha256", env.sessionSecret)
    .update(`${email}:${otp}`)
    .digest("hex");
}

export async function requestPasswordReset(emailInput: string): Promise<void> {
  const transporter = getTransporter();
  const email = emailInput.trim().toLowerCase();
  const { data: user, error: lookupError } = await supabase
    .from("admin_users")
    .select("email, first_name, middle_name, last_name, name_extension, full_name, is_active")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) throw new Error(`Failed to look up password-reset account: ${lookupError.message}`);
  if (!user || !user.is_active) return;

  const { data: priorChallenge, error: challengeLookupError } = await supabase
    .from("password_reset_otps")
    .select("created_at")
    .eq("email", email)
    .maybeSingle();
  if (challengeLookupError) throw new Error(`Failed to check password-reset request limit: ${challengeLookupError.message}`);
  if (priorChallenge && Date.now() - new Date(priorChallenge.created_at).getTime() < 60_000) return;

  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_MINUTES * 60_000).toISOString();
  const { error: saveError } = await supabase.from("password_reset_otps").upsert({
    email,
    otp_hash: hashOtp(email, otp),
    expires_at: expiresAt,
    attempts: 0,
    created_at: new Date().toISOString(),
  }, { onConflict: "email" });

  if (saveError) throw new Error(`Failed to create password-reset code: ${saveError.message}`);

  const accountName = [
    user.first_name,
    user.middle_name,
    user.last_name,
    user.name_extension,
  ].filter(Boolean).join(" ") || user.full_name;

  try {
    await transporter.sendMail({
      from: env.passwordResetEmailFrom,
      to: email,
      subject: "Casiguran District Hospital CMS password reset code",
      text: `Hello ${accountName},\n\nYour password reset verification code is ${otp}. It expires in ${OTP_LIFETIME_MINUTES} minutes. If you did not request this, ignore this email.\n`,
    });
  } catch (sendError) {
    const { error: cleanupError } = await supabase.from("password_reset_otps").delete().eq("email", email);
    if (cleanupError) {
      throw new Error(`Email delivery failed and the OTP cleanup failed: ${cleanupError.message}`);
    }
    console.error("[password reset] Gmail SMTP delivery failed:", sendError);
    throw new AppError(502, "Unable to send a verification email right now. Please try again later.", "PASSWORD_RESET_EMAIL_FAILED");
  }
}

export async function completePasswordReset(input: CompletePasswordResetInput): Promise<void> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const { data, error } = await supabase.rpc("complete_password_reset", {
    p_email: email,
    p_otp_hash: hashOtp(email, input.code),
    p_password_hash: passwordHash,
  });

  if (error) throw new Error(`Failed to complete password reset: ${error.message}`);
  if (data !== true) {
    throw new AppError(400, "The verification code is invalid or expired. Request a new code and try again.", "INVALID_OR_EXPIRED_RESET_CODE");
  }
}
