import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  addKeyOfficialsSlideshowImages,
  getKeyOfficialsSlideshow,
  listKeyOfficials,
  removeKeyOfficialsSlideshowImage,
  updateKeyOfficial,
} from "../services/key-officials.service";
import type { UpdateKeyOfficialInput } from "../validation/key-officials.schema";

export async function listPublicKeyOfficials(_req: Request, res: Response) {
  res.status(200).json({ items: await listKeyOfficials() });
}

export async function listAdminKeyOfficials(_req: Request, res: Response) {
  res.status(200).json({ items: await listKeyOfficials() });
}

export async function getPublicKeyOfficialsSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getKeyOfficialsSlideshow() });
}

export async function getAdminKeyOfficialsSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getKeyOfficialsSlideshow() });
}

export async function addAdminKeyOfficialsSlideshowImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one Key Officials header photo.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addKeyOfficialsSlideshowImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminKeyOfficialsSlideshowImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeKeyOfficialsSlideshowImage(index, req.user.id);
  res.status(200).json({ item });
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
