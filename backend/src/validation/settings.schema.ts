import { z } from "zod";

export const updateSettingsSchema = z.object({
  address: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z.string().trim().email("Email must be valid").optional().or(z.literal("")),
  facebookUrl: z.string().trim().url("Facebook URL must be valid").optional().or(z.literal("")),
  officeHours: z.string().trim().optional().or(z.literal("")),
  mapEmbedUrl: z.string().trim().url("Map embed URL must be valid").optional().or(z.literal("")),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
