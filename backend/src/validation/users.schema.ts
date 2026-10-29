import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().max(254).email("Email must be valid"),
  firstName: z.string().trim().min(1, "First name is required").max(100),
  middleName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  nameExtension: z.string().trim().max(30).optional().or(z.literal("")),
  password: z.string().min(12, "Password must be at least 12 characters long").max(128, "Password must be 128 characters or less"),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  email: z.string().trim().max(254).email("Email must be valid").optional(),
  firstName: z.string().trim().min(1, "First name is required").max(100).optional(),
  middleName: z.string().trim().max(100).optional().or(z.literal("")),
  lastName: z.string().trim().min(1, "Last name is required").max(100).optional(),
  nameExtension: z.string().trim().max(30).optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  password: z.string().min(12, "Password must be at least 12 characters long").max(128, "Password must be 128 characters or less").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
