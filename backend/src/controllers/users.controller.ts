import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { createStaffUser, deactivateStaffUser, listStaffUsers, updateStaffUser } from "../services/users.service";
import type { CreateUserInput, UpdateUserInput } from "../validation/users.schema";

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
  const input = req.body as UpdateUserInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  if (req.user.role !== "admin") {
    throw new AppError(403, "Only admins can update staff accounts", "FORBIDDEN");
  }

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
