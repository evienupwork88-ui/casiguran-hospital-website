import { z } from "zod";

const highlightSchema = z.object({
  title: z.string().trim().min(1, "Highlight title is required").max(200),
  description: z.string().trim().max(1000),
});

const clinicScheduleSchema = z.object({
  clinic: z.string().trim().min(1, "Service name is required").max(200),
  days: z.string().trim().max(200),
  hours: z.string().trim().max(200),
  notes: z.string().trim().max(500),
});

export const updateFamilyCommunityMedicineSchema = z.object({
  title: z.string().trim().min(1, "Page title is required").max(200),
  generalInformation: z.string().trim().max(10000),
  highlights: z.array(highlightSchema).max(30),
  clinicSchedule: z.array(clinicScheduleSchema).max(100),
  organizationalStructureDescription: z.string().trim().max(3000),
});

export type UpdateFamilyCommunityMedicineInput = z.infer<typeof updateFamilyCommunityMedicineSchema>;
