import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addHimdCoverImages, getHimdContent, getHimdSlideshow, removeHimdCoverImage, replaceHimdOrganizationalChart, updateHimdContent } from "../services/himd.service";
import { himdSectionSchema, type UpdateHimdContentInput } from "../validation/himd.schema";

function getSection(req: Request) {
  const parsed = himdSectionSchema.safeParse(Array.isArray(req.params.section) ? req.params.section[0] : req.params.section);
  if (!parsed.success) throw new AppError(404, "HIMD section not found.", "HIMD_SECTION_NOT_FOUND");
  return parsed.data;
}

export async function getPublicHimd(req: Request, res: Response) {
  res.status(200).json({ item: await getHimdContent(getSection(req)) });
}

export async function getPublicHimdSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getHimdSlideshow() });
}

export async function getAdminHimd(req: Request, res: Response) {
  res.status(200).json({ item: await getHimdContent(getSection(req)) });
}

export async function getAdminHimdSlideshow(_req: Request, res: Response) {
  res.status(200).json({ item: await getHimdSlideshow() });
}

export async function updateAdminHimd(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateHimdContent(getSection(req), req.body as UpdateHimdContentInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminHimdImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  const item = await addHimdCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminHimdImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeHimdCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminHimdOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose an organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceHimdOrganizationalChart(getSection(req), req.file, req.user.id);
  res.status(200).json({ item });
}
