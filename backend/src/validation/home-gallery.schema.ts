import { z } from "zod";

export const reorderHomeGalleryImagesSchema = z.object({
  order: z.array(z.number().int().min(0)).max(30),
});

export type ReorderHomeGalleryImagesInput = z.infer<typeof reorderHomeGalleryImagesSchema>;
