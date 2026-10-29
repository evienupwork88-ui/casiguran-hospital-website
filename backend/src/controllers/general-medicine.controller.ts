import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addGeneralMedicineCoverImages, getGeneralMedicineContent, removeGeneralMedicineCoverImage, replaceGeneralMedicineOrganizationalChart, updateGeneralMedicineContent } from "../services/general-medicine.service";
import type { UpdateGeneralMedicineInput } from "../validation/general-medicine.schema";

export async function getPublicGeneralMedicine(_req: Request, res: Response) {
  res.status(200).json({ item: await getGeneralMedicineContent() });
}

export async function getAdminGeneralMedicine(_req: Request, res: Response) {
  res.status(200).json({ item: await getGeneralMedicineContent() });
}

export async function updateAdminGeneralMedicine(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateGeneralMedicineContent(req.body as UpdateGeneralMedicineInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminGeneralMedicineImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addGeneralMedicineCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminGeneralMedicineImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeGeneralMedicineCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminGeneralMedicineOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a General Medicine organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceGeneralMedicineOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
