import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128, "Password must be 128 characters or less"),
});

export const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address"),
});

export const completePasswordResetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i, "This reset link is invalid or expired"),
  password: z.string().min(12, "Password must be at least 12 characters long").max(128, "Password must be 128 characters or less"),
  confirmPassword: z.string().min(1, "Confirm your new password").max(128, "Password must be 128 characters or less"),
}).refine((input) => input.password === input.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const mfaCodeSchema = z.object({
  code: z.string().trim().min(6).max(32),
  useRecoveryCode: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type CompletePasswordResetInput = z.infer<typeof completePasswordResetSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
