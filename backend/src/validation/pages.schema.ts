import { z } from "zod";

export const updatePageSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  body: z.string().trim().min(1, "Body is required"),
});

export type UpdatePageInput = z.infer<typeof updatePageSchema>;
