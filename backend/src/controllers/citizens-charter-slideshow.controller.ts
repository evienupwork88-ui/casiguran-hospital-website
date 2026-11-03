import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  addCitizensCharterSlideshowImages,
  getCitizensCharterSlideshow,
  removeCitizensCharterSlideshowImage,
} from "../services/citizens-charter-slideshow.service";

export async function getPublicCitizensCharterSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getCitizensCharterSlideshow() });
}

export async function getAdminCitizensCharterSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getCitizensCharterSlideshow() });
}

export async function addAdminCitizensCharterSlideshowImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one Citizen's Charter header photo.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addCitizensCharterSlideshowImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminCitizensCharterSlideshowImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeCitizensCharterSlideshowImage(index, req.user.id);
  res.status(200).json({ item });
}
