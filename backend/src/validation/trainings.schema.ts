import { z } from "zod";

const externalUrl = z.string().trim().max(2048).url("Enter a valid link").refine(
  (value) => value.startsWith("https://") || value.startsWith("http://"),
  "Link must start with http:// or https://",
).optional().or(z.literal(""));

export const trainingSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(5000),
  externalUrl,
  status: z.enum(["draft", "published"]).optional(),
  removeImage: z.enum(["true", "false"]).optional(),
});

export const updateTrainingSchema = trainingSchema.partial();
export type TrainingInput = z.infer<typeof trainingSchema>;
export type UpdateTrainingInput = z.infer<typeof updateTrainingSchema>;
