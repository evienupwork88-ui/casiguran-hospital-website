import { z } from "zod";
import { sanitizePlainText } from "../utils/sanitize-plain-text";

export const faqCategories = [
  "Patient Care",
  "Billing & PhilHealth",
  "Documents",
  "Emergency",
  "General",
] as const;

export const faqCategorySchema = z.enum(faqCategories);

export const createFaqSchema = z.object({
  question: z.string().max(800).transform(sanitizePlainText).pipe(z.string().min(1).max(200)),
  answer: z.string().max(4000).transform(sanitizePlainText).pipe(z.string().min(1).max(1000)),
  category: faqCategorySchema,
  displayOrder: z.number().int().min(0).max(10000),
  isActive: z.boolean(),
});

export const updateFaqSchema = createFaqSchema.partial();
export type CreateFaqInput = z.infer<typeof createFaqSchema>;
export type UpdateFaqInput = z.infer<typeof updateFaqSchema>;
