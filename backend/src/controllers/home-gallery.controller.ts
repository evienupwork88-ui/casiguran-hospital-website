import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addHomeGalleryImages, getHomeGallery, removeHomeGalleryImage, reorderHomeGalleryImages } from "../services/home-gallery.service";
import type { ReorderHomeGalleryImagesInput } from "../validation/home-gallery.schema";

export async function getPublicHomeGallery(_req: Request, res: Response) {
  res.status(200).json({ item: await getHomeGallery() });
}

export async function getAdminHomeGallery(_req: Request, res: Response) {
  res.status(200).json({ item: await getHomeGallery() });
}

export async function addAdminHomeGalleryImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) throw new AppError(400, "Choose at least one image to upload.", "GALLERY_IMAGE_REQUIRED");
  const item = await addHomeGalleryImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminHomeGalleryImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeHomeGalleryImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function reorderAdminHomeGalleryImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await reorderHomeGalleryImages(req.body as ReorderHomeGalleryImagesInput, req.user.id);
  res.status(200).json({ item });
}
