import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addRadiologyCoverImages, getRadiologyContent, removeRadiologyCoverImage, replaceRadiologyOrganizationalChart, updateRadiologyContent } from "../services/radiology.service";
import type { UpdateRadiologyInput } from "../validation/radiology.schema";

export async function getPublicRadiology(_req: Request, res: Response) {
  res.status(200).json({ item: await getRadiologyContent() });
}

export async function getAdminRadiology(_req: Request, res: Response) {
  res.status(200).json({ item: await getRadiologyContent() });
}

export async function updateAdminRadiology(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateRadiologyContent(req.body as UpdateRadiologyInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminRadiologyImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addRadiologyCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminRadiologyImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeRadiologyCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminRadiologyOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Radiology organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceRadiologyOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
