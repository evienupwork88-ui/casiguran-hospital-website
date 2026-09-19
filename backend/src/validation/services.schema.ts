import { z } from "zod";

export const createServiceSchema = z.object({
  name: z.string().trim().min(1, "Service name is required"),
  description: z.string().trim().min(1, "Description is required"),
  department: z.string().trim().optional().or(z.literal("")),
  iconOrImageUrl: z.string().trim().url("Icon/image URL must be valid").optional().or(z.literal("")),
  displayOrder: z.number().int().nonnegative().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
