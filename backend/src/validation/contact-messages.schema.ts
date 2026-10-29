import { z } from "zod";
import { sanitizePlainText } from "../utils/sanitize-plain-text";

export const contactMessageTopics = [
  "Appointment/OPD",
  "Billing/PhilHealth",
  "Medical Records",
  "Job/Application",
  "Other",
] as const;

const plainText = (max: number, message: string, requiredMessage: string) =>
  z.string().max(max * 4).transform(sanitizePlainText).pipe(z.string().trim().min(1, requiredMessage).max(max, message));

export const createContactMessageSchema = z.object({
  lastName: plainText(200, "Last name must be 200 characters or less.", "Last name is required."),
  firstName: plainText(200, "First name must be 200 characters or less.", "First name is required."),
  middleName: z.string().max(800).transform(sanitizePlainText).pipe(z.string().trim().max(200)).optional().or(z.literal("")),
  nameExtension: z.string().max(800).transform(sanitizePlainText).pipe(z.string().trim().max(200)).optional().or(z.literal("")),
  contactInfo: z.string().trim().min(1, "Email address or cellphone number is required").max(254)
    .refine((value) => {
      if (z.string().email().safeParse(value).success) return true;
      const digits = value.replace(/\D/g, "");
      return /^[+\d().\-\s]+$/.test(value) && digits.length >= 7 && digits.length <= 15;
    }, "Enter a valid email address or cellphone number."),
  subject: z.enum(contactMessageTopics),
  message: plainText(1000, "Message must be 1000 characters or less.", "Message is required.").refine((value) => value.length >= 20, "Message must be at least 20 characters."),
  respectfulUseAccepted: z.literal(true, "Please confirm respectful use and avoid sensitive medical information."),
  website: z.string().max(500).optional(),
});

export type CreateContactMessageInput = z.infer<typeof createContactMessageSchema>;

export const contactMessageStatusSchema = z.enum(["new", "read", "flagged", "replied", "archived"]);
export const contactActionTakenSchema = z.enum(["Called", "FB Messaged", "Forwarded to GC", "Done"]);

export const updateContactMessageSchema = z.object({
  assignedTo: z.string().trim().max(120).nullable().optional(),
  actionTaken: contactActionTakenSchema.nullable().optional(),
  remarks: z.string().max(8000).transform(sanitizePlainText).pipe(z.string().max(2000)).optional(),
  status: contactMessageStatusSchema.optional(),
  isArchived: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "Provide at least one field to update.");

export type UpdateContactMessageInput = z.infer<typeof updateContactMessageSchema>;
