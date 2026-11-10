import { z } from "zod";
import { sanitizePlainText } from "../utils/sanitize-plain-text";

export const contactMessageTopics = [
  "General Hospital Inquiry",
  "Hospital Services and Facilities",
  "HIMS / Medical Records",
  "Employment Opportunities",
  "Website Technical Concerns",
  "Feedback and Suggestions",
  "Other Administrative Concerns",
] as const;

const plainText = (max: number, message: string, requiredMessage: string) =>
  z.string().max(max * 4).transform(sanitizePlainText).pipe(z.string().trim().min(1, requiredMessage).max(max, message));

export const createContactMessageSchema = z.object({
  lastName: plainText(200, "Last name must be 200 characters or less.", "Last name is required."),
  firstName: plainText(200, "First name must be 200 characters or less.", "First name is required."),
  middleName: z.string().max(800).transform(sanitizePlainText).pipe(z.string().trim().max(200)).optional().or(z.literal("")),
  nameExtension: z.string().max(800).transform(sanitizePlainText).pipe(z.string().trim().max(200)).optional().or(z.literal("")),
  contactInfo: z.string().max(254).transform(sanitizePlainText).pipe(z.string().trim().min(1, "Email address or cellphone number is required").max(254))
    .refine((value) => {
      if (z.string().email().safeParse(value).success) return true;
      const digits = value.replace(/\D/g, "");
      return /^[+\d().\-\s]+$/.test(value) && digits.length >= 10 && digits.length <= 15;
    }, "Enter a valid email address or cellphone number (10 to 15 digits)."),
  category: z.enum(contactMessageTopics),
  message: plainText(1000, "Message must be 1000 characters or less.", "Message is required."),
  privacyNoticeAccepted: z.literal(true, "Please read and accept the privacy notice."),
  website: z.string().max(500).optional(),
  turnstileToken: z.string().trim().min(1, "Complete the security check.").max(2048),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;
