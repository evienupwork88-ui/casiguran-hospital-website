import { z } from "zod";

const highlightSchema = z.object({
  title: z.string().trim().min(1, "Service title is required").max(200),
  description: z.string().trim().max(1000),
});

const scheduleSchema = z.object({
  clinic: z.string().trim().min(1, "Service name is required").max(200),
  days: z.string().trim().max(200),
  hours: z.string().trim().max(200),
  notes: z.string().trim().max(500),
});

export const updateEmergencyDepartmentSchema = z.object({
  title: z.string().trim().min(1, "Page title is required").max(200),
  generalInformation: z.string().trim().max(10000),
  highlights: z.array(highlightSchema).max(30),
  clinicSchedule: z.array(scheduleSchema).max(100),
  organizationalStructureDescription: z.string().trim().max(3000),
});

export type UpdateEmergencyDepartmentInput = z.infer<typeof updateEmergencyDepartmentSchema>;
