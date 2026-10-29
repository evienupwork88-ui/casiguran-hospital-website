import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addMedicalSocialServiceCoverImages, getMedicalSocialServiceContent, removeMedicalSocialServiceCoverImage, replaceMedicalSocialServiceOrganizationalChart, updateMedicalSocialServiceContent } from "../services/medical-social-service.service";
import type { UpdateMedicalSocialServiceInput } from "../validation/medical-social-service.schema";

export async function getPublicMedicalSocialService(_req: Request, res: Response) {
  res.status(200).json({ item: await getMedicalSocialServiceContent() });
}

export async function getAdminMedicalSocialService(_req: Request, res: Response) {
  res.status(200).json({ item: await getMedicalSocialServiceContent() });
}

export async function updateAdminMedicalSocialService(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateMedicalSocialServiceContent(req.body as UpdateMedicalSocialServiceInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminMedicalSocialServiceImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addMedicalSocialServiceCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminMedicalSocialServiceImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeMedicalSocialServiceCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminMedicalSocialServiceOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Medical Social Service Department organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceMedicalSocialServiceOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
