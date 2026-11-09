import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { createStaffUser, deactivateStaffUser, listStaffUsers, updateStaffUser } from "../services/users.service";
import { verifyMfaStepUp } from "../services/mfa.service";
import { clearLoginFailures, getLoginLock, recordLoginFailure } from "../services/login-throttle.service";
import type { CreateUserInput, UpdateUserRequestInput } from "../validation/users.schema";

export async function listAdminUsers(_req: Request, res: Response) {
  const users = await listStaffUsers();
  res.status(200).json({ items: users });
}

export async function createAdminUser(req: Request, res: Response) {
  const input = req.body as CreateUserInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  if (req.user.role !== "admin") {
    throw new AppError(403, "Only admins can create staff accounts", "FORBIDDEN");
  }

  const user = await createStaffUser(input);
  res.status(201).json({ item: user });
}

export async function updateAdminUser(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { mfaCode, ...input } = req.body as UpdateUserRequestInput;

  if (!req.user || !req.session) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  if (req.user.role !== "admin") {
    throw new AppError(403, "Only admins can update staff accounts", "FORBIDDEN");
  }

  const ipAddress = req.ip ?? "unknown";
  const lockedUntil = await getLoginLock(req.user.email, ipAddress);
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    res.setHeader("Retry-After", String(Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)));
    throw new AppError(429, "Too many verification attempts. Try again later.", "LOGIN_COOLDOWN");
  }

  try {
    await verifyMfaStepUp(req.user.id, req.session.id, mfaCode);
  } catch (error) {
    if (error instanceof AppError && error.code === "INVALID_MFA_CODE") {
      const nextLock = await recordLoginFailure(req.user.email, ipAddress);
      if (nextLock && nextLock.getTime() > Date.now()) {
        res.setHeader("Retry-After", String(Math.ceil((nextLock.getTime() - Date.now()) / 1000)));
        throw new AppError(429, "Too many verification attempts. Try again later.", "LOGIN_COOLDOWN");
      }
    }
    throw error;
  }

  await clearLoginFailures(req.user.email, ipAddress);
  const user = await updateStaffUser(id, input);
  res.status(200).json({ item: user });
}

export async function deactivateAdminUser(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  if (req.user.role !== "admin") {
    throw new AppError(403, "Only admins can deactivate staff accounts", "FORBIDDEN");
  }

  const user = await deactivateStaffUser(id);
  res.status(200).json({ item: user });
}
