import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Body is required"),
  priority: z.enum(["normal", "urgent"]).default("normal"),
  status: z.enum(["draft", "published"]).default("draft"),
  publishAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export const updateAnnouncementSchema = createAnnouncementSchema.partial();
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
