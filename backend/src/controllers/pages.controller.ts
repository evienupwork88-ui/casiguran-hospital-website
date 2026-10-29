import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  addHospitalHistoryCoverImagesFromUpload,
  getPageBySlug,
  listAllPages,
  removeHospitalHistoryCoverImage,
  updateHospitalHistoryCover,
  upsertPage,
} from "../services/pages.service";
import type { UpdatePageInput } from "../validation/pages.schema";

export async function listPublicPages(_req: Request, res: Response) {
  const pages = await listAllPages();
  res.status(200).json({ items: pages });
}

export async function getPublicPageBySlug(req: Request, res: Response) {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const page = await getPageBySlug(slug);

  if (!page) {
    throw new AppError(404, "Page not found", "PAGE_NOT_FOUND");
  }

  res.status(200).json({ item: page });
}

export async function listAdminPages(_req: Request, res: Response) {
  const pages = await listAllPages();
  res.status(200).json({ items: pages });
}

export async function updateAdminPage(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const input = req.body as UpdatePageInput;

  const page = await upsertPage(slug, input, req.user.id);
  res.status(200).json({ item: page });
}

export async function updateAdminHospitalHistoryCover(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }
  if (!req.file) {
    throw new AppError(400, "Choose a cover image to upload.", "COVER_IMAGE_REQUIRED");
  }

  const page = await updateHospitalHistoryCover(req.file);
  res.status(200).json({ item: page });
}

export async function addAdminHospitalHistoryCoverImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one Hospital History photo.", "COVER_IMAGE_REQUIRED");
  }
  const page = await addHospitalHistoryCoverImagesFromUpload(req.files);
  res.status(200).json({ item: page });
}

export async function removeAdminHospitalHistoryCoverImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const page = await removeHospitalHistoryCoverImage(index);
  res.status(200).json({ item: page });
}
