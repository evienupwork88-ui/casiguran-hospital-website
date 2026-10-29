import { z } from "zod";

const dayNameSchema = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);

const administrativeOfficeDaySchema = z.object({
  day: dayNameSchema,
  isOpen: z.boolean(),
  startTime: z.string().trim().max(5).regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:MM format").optional(),
  endTime: z.string().trim().max(5).regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:MM format").optional(),
});

export const updateSettingsSchema = z.object({
  address: z.string().trim().max(500).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().max(254).email("Email must be valid").optional().or(z.literal("")),
  facebookUrl: z.string().trim().max(2048).url("Facebook URL must be valid").optional().or(z.literal("")),
  officeHours: z.string().trim().max(1000).optional().or(z.literal("")),
  administrativeOfficeHours: z.array(administrativeOfficeDaySchema).optional(),
  emergencyServices24Hours: z.boolean().optional(),
  mapEmbedUrl: z.string().trim().max(2048).url("Map embed URL must be valid").optional().or(z.literal("")),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
