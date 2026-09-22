import { z } from "zod";

export const createNewsSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().trim().max(300, "Excerpt must be 300 characters or less").optional().or(z.literal("")),
  body: z.string().trim().min(1, "Body is required"),
  coverImageUrl: z.string().trim().url("Cover image URL must be valid").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export const updateNewsSchema = createNewsSchema.partial();
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
