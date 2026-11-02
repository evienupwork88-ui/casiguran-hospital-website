import { z } from "zod";

const announcementFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().max(20000).optional().or(z.literal("")),
  excerpt: z.string().trim().max(300).optional().or(z.literal("")),
  coverImageUrl: z.string().trim().max(2048).url("Cover image URL must be valid").optional().or(z.literal("")),
  externalUrl: z.string().trim().max(2048).url("External link must be valid").refine((value) => /^https?:\/\//i.test(value), "External link must use HTTP or HTTPS").optional().or(z.literal("")),
  priority: z.enum(["normal", "urgent"]).default("normal"),
  status: z.enum(["draft", "published"]).default("draft"),
  publishAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  displayDate: z.string().date().optional().or(z.literal("")),
});

export const createAnnouncementSchema = announcementFieldsSchema.superRefine((input, context) => {
  if (!input.externalUrl && !input.body) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "Content is required when no external link is set." });
  }
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export const updateAnnouncementSchema = announcementFieldsSchema.partial().superRefine((input, context) => {
  if (input.body === "" && input.externalUrl === "") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["body"], message: "Content is required when no external link is set." });
  }
});
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
