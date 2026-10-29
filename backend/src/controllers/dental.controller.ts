import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addDentalCoverImages, getDentalContent, removeDentalCoverImage, replaceDentalOrganizationalChart, updateDentalContent } from "../services/dental.service";
import type { UpdateDentalInput } from "../validation/dental.schema";

export async function getPublicDental(_req: Request, res: Response) {
  res.status(200).json({ item: await getDentalContent() });
}

export async function getAdminDental(_req: Request, res: Response) {
  res.status(200).json({ item: await getDentalContent() });
}

export async function updateAdminDental(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateDentalContent(req.body as UpdateDentalInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminDentalImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addDentalCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminDentalImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeDentalCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminDentalOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Dental organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceDentalOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
