import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().trim().email("Email must be valid"),
  fullName: z.string().trim().min(1, "Full name is required"),
  role: z.enum(["admin", "editor"]).default("editor"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  email: z.string().trim().email("Email must be valid").optional(),
  fullName: z.string().trim().min(1, "Full name is required").optional(),
  role: z.enum(["admin", "editor"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
