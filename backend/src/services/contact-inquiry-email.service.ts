import nodemailer from "nodemailer";
import { z } from "zod";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import { containsProfanity } from "../utils/profanity-filter";
import type { CreateContactMessageInput } from "../validation/contact-messages.schema";

function isConfiguredEmail(value: string): boolean {
  return z.string().email().safeParse(value).success;
}

function recipientAddress(recipient: string | { address: string }): string {
  return typeof recipient === "string" ? recipient : recipient.address;
}

function smtpErrorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return error instanceof Error ? error.name : "UNKNOWN";
}

export async function sendContactInquiryEmail(input: CreateContactMessageInput): Promise<void> {
  const flagged = [input.firstName, input.middleName, input.lastName, input.nameExtension, input.message]
    .filter((value): value is string => Boolean(value))
    .some((value) => containsProfanity(value));
  if (flagged) throw new AppError(400, "Please use respectful language.", "CONTACT_LANGUAGE_FLAGGED");

  const sender = env.contactGmailSmtpUser.trim();
  const recipient = env.contactInquiryEmailTo.trim();
  const password = env.contactGmailSmtpAppPassword.replace(/\s/g, "");
  if (!password || !isConfiguredEmail(sender) || !isConfiguredEmail(recipient)) {
    console.error("[contact inquiry email] Gmail SMTP credentials or recipient address are not configured.");
    throw new AppError(503, "The inquiry service is not available right now. Please try again later.", "CONTACT_EMAIL_NOT_CONFIGURED");
  }

  const replyTo = isConfiguredEmail(input.contactInfo) ? input.contactInfo : undefined;
  const fullName = [input.firstName, input.middleName, input.lastName, input.nameExtension].filter(Boolean).join(" ");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: sender, pass: password },
  });

  let acceptedRecipients: (string | { address: string })[] = [];
  try {
    const result = await transporter.sendMail({
      from: sender,
      to: recipient,
      ...(replyTo ? { replyTo } : {}),
      subject: `CDH General Inquiry - ${input.category}`,
      text: [
        "A general inquiry was submitted through the Casiguran District Hospital website.",
        "",
        `Category: ${input.category}`,
        `Name: ${fullName}`,
        `Contact: ${input.contactInfo}`,
        `Submitted: ${new Date().toISOString()}`,
        "",
        "Message:",
        input.message,
      ].join("\n"),
    });
    acceptedRecipients = result.accepted;
  } catch (error) {
    console.error("[contact inquiry email] Gmail SMTP submission failed:", smtpErrorCode(error));
    throw new AppError(502, "We could not submit your inquiry right now. Please try again later.", "CONTACT_EMAIL_FAILED");
  }

  const wasAccepted = acceptedRecipients.some(
    (accepted) => recipientAddress(accepted).toLowerCase() === recipient.toLowerCase(),
  );
  if (!wasAccepted) {
    console.error("[contact inquiry email] Gmail SMTP did not accept the configured recipient.");
    throw new AppError(502, "We could not submit your inquiry right now. Please try again later.", "CONTACT_EMAIL_REJECTED");
  }
}
