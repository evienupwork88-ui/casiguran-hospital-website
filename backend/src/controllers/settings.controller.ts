import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getAdminSettings, getPublicSettings, updateSettings } from "../services/settings.service";
import type { UpdateSettingsInput } from "../validation/settings.schema";

export async function listPublicSettings(_req: Request, res: Response) {
  const settings = await getPublicSettings();
  res.status(200).json({ item: settings });
}

export async function listAdminSettings(_req: Request, res: Response) {
  const settings = await getAdminSettings();
  res.status(200).json({ item: settings });
}

export async function updateAdminSettings(req: Request, res: Response) {
  const input = req.body as UpdateSettingsInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const settings = await updateSettings(input, req.user.id);
  res.status(200).json({ item: settings });
}
