import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128, "Password must be 128 characters or less"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address"),
});

export const completePasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address"),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email"),
  password: z.string().min(12, "Password must be at least 12 characters long").max(128, "Password must be 128 characters or less"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type CompletePasswordResetInput = z.infer<typeof completePasswordResetSchema>;
