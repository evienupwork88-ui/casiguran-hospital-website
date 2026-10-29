import { z } from "zod";
import { createAnnouncementSchema } from "./announcements.schema";
import { createDocumentSchema } from "./documents.schema";
import { createEventSchema } from "./events.schema";
import { createFaqSchema } from "./faqs.schema";
import { createNewsSchema } from "./news.schema";
import { rateFeeItemSchema } from "./rate-fees.schema";
import { trainingSchema } from "./trainings.schema";

const batchSize = { min: 1, max: 25 };
const trainingImportSchema = trainingSchema.refine((item) => Boolean(item.externalUrl), {
  path: ["externalUrl"],
  message: "An external URL is required because spreadsheet imports cannot include an image.",
});
const importRowNumbers = { rowNumbers: z.array(z.number().int().min(2)).optional() };

export const cmsBulkImportSchema = z.discriminatedUnion("resource", [
  z.object({ ...importRowNumbers, resource: z.literal("news"), items: z.array(createNewsSchema).min(batchSize.min).max(batchSize.max) }),
  z.object({ ...importRowNumbers, resource: z.literal("announcements"), items: z.array(createAnnouncementSchema).min(batchSize.min).max(batchSize.max) }),
  z.object({ ...importRowNumbers, resource: z.literal("events"), items: z.array(createEventSchema).min(batchSize.min).max(batchSize.max) }),
  z.object({ ...importRowNumbers, resource: z.literal("faqs"), items: z.array(createFaqSchema).min(batchSize.min).max(batchSize.max) }),
  z.object({ ...importRowNumbers, resource: z.literal("trainings"), items: z.array(trainingImportSchema).min(batchSize.min).max(batchSize.max) }),
  z.object({ ...importRowNumbers, resource: z.literal("rate-fees"), items: z.array(rateFeeItemSchema).min(batchSize.min).max(batchSize.max) }),
  z.object({ ...importRowNumbers, resource: z.literal("documents"), items: z.array(createDocumentSchema).min(batchSize.min).max(batchSize.max) }),
]).superRefine((input, context) => {
  if (input.rowNumbers && input.rowNumbers.length !== input.items.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["rowNumbers"], message: "There must be one source row number per record." });
  }
});

export const cmsBulkDeleteSchema = z.object({
  resource: z.enum(["news", "announcements", "events", "faqs", "trainings", "rate-fees", "documents"]),
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type CmsBulkImportInput = z.infer<typeof cmsBulkImportSchema>;
export type CmsBulkDeleteInput = z.infer<typeof cmsBulkDeleteSchema>;
