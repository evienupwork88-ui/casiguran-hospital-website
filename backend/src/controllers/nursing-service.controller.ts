import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addNursingServiceCoverImages, getNursingServiceContent, removeNursingServiceCoverImage, replaceNursingServiceOrganizationalChart, updateNursingServiceContent } from "../services/nursing-service.service";
import type { UpdateNursingServiceInput } from "../validation/nursing-service.schema";

export async function getPublicNursingService(_req: Request, res: Response) {
  res.status(200).json({ item: await getNursingServiceContent() });
}

export async function getAdminNursingService(_req: Request, res: Response) {
  res.status(200).json({ item: await getNursingServiceContent() });
}

export async function updateAdminNursingService(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateNursingServiceContent(req.body as UpdateNursingServiceInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminNursingServiceImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addNursingServiceCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminNursingServiceImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeNursingServiceCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminNursingServiceOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Nursing Service organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceNursingServiceOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
