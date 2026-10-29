import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { listKeyOfficials, updateKeyOfficial } from "../services/key-officials.service";
import type { UpdateKeyOfficialInput } from "../validation/key-officials.schema";

export async function listPublicKeyOfficials(_req: Request, res: Response) {
  res.status(200).json({ items: await listKeyOfficials() });
}

export async function listAdminKeyOfficials(_req: Request, res: Response) {
  res.status(200).json({ items: await listKeyOfficials() });
}

export async function updateAdminKeyOfficial(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");

  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const input = req.body as UpdateKeyOfficialInput;
  const item = await updateKeyOfficial(slug, {
    ...input,
    photo: req.file,
    updatedById: req.user.id,
  });

  res.status(200).json({ item });
}
