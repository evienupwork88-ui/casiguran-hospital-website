import { z } from "zod";

export const documentCategorySchema = z.enum(["report", "org_chart", "policy", "citizens_charter", "development_plan", "patient_rights", "other"]);

export const createDocumentSchema = z.object({
  title: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  category: documentCategorySchema.default("other"),
  filePath: z.string().trim().min(1, "File path is required").max(1000),
  fileSize: z.number().int().nonnegative().optional(),
  mimeType: z.string().trim().max(150).optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
  publishedAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
});

export const updateDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  category: documentCategorySchema.optional(),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
