import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addFamilyCommunityMedicineCoverImages, getFamilyCommunityMedicineContent, removeFamilyCommunityMedicineCoverImage, replaceFamilyCommunityMedicineOrganizationalChart, updateFamilyCommunityMedicineContent } from "../services/family-community-medicine.service";
import type { UpdateFamilyCommunityMedicineInput } from "../validation/family-community-medicine.schema";

export async function getPublicFamilyCommunityMedicine(_req: Request, res: Response) {
  res.status(200).json({ item: await getFamilyCommunityMedicineContent() });
}

export async function getAdminFamilyCommunityMedicine(_req: Request, res: Response) {
  res.status(200).json({ item: await getFamilyCommunityMedicineContent() });
}

export async function updateAdminFamilyCommunityMedicine(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateFamilyCommunityMedicineContent(req.body as UpdateFamilyCommunityMedicineInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminFamilyCommunityMedicineImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addFamilyCommunityMedicineCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminFamilyCommunityMedicineImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeFamilyCommunityMedicineCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminFamilyCommunityMedicineOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Family and Community Medicine organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceFamilyCommunityMedicineOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
