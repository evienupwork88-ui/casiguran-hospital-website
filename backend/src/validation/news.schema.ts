import { z } from "zod";

const newsFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(200, "Slug must be 200 characters or less")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().trim().max(300, "Excerpt must be 300 characters or less").optional().or(z.literal("")),
  body: z.string().trim().max(20000).optional().or(z.literal("")),
  coverImageUrl: z.string().trim().max(2048).url("Cover image URL must be valid").optional().or(z.literal("")),
  externalUrl: z.string().trim().max(2048).url("Facebook post URL must be valid").refine((value) => /^https?:\/\//i.test(value), "Facebook post URL must use HTTP or HTTPS").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).optional(),
  publishedAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
});

export const createNewsSchema = newsFieldsSchema.superRefine((input, context) => {
  if (!input.externalUrl && !input.body) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "Body is required for internal articles." });
  }
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export const updateNewsSchema = newsFieldsSchema.partial().superRefine((input, context) => {
  if (input.externalUrl === "" && input.body === "") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "Body is required for internal articles." });
  }
});
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
