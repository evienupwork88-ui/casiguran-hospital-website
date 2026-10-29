import { z } from "zod";

export const updatePageSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Body is required").max(20000),
});

export type UpdatePageInput = z.infer<typeof updatePageSchema>;
