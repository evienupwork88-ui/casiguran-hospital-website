import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  location: z.string().trim().max(200).optional().or(z.literal("")),
  startAt: z.string().datetime({ offset: true }),
  endAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
  coverImageUrl: z.string().trim().max(2048).url("Cover image URL must be valid").optional().or(z.literal("")),
  status: z.enum(["draft", "published"]).default("draft"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;
