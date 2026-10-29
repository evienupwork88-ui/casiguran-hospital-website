import { z } from "zod";

export const updateKeyOfficialSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  nameExtension: z.string().trim().max(30).optional().or(z.literal("")),
  position: z.string().trim().min(1, "Position is required").max(200),
  officialPosition: z.string().trim().max(200).optional().or(z.literal("")),
  removePhoto: z.enum(["true", "false"]).optional(),
});

export type UpdateKeyOfficialInput = z.infer<typeof updateKeyOfficialSchema>;
