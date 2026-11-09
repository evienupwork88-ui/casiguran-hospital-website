import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  addRateFeesSlideshowImages,
  getRateFeesSlideshow,
  removeRateFeesSlideshowImage,
} from "../services/rate-fees-slideshow.service";

export async function getPublicRateFeesSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getRateFeesSlideshow() });
}

export async function getAdminRateFeesSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getRateFeesSlideshow() });
}

export async function addAdminRateFeesSlideshowImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one Rate and Fees header photo.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addRateFeesSlideshowImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminRateFeesSlideshowImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeRateFeesSlideshowImage(index, req.user.id);
  res.status(200).json({ item });
}
