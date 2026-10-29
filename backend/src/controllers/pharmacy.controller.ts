import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addPharmacyCoverImages, getPharmacyContent, removePharmacyCoverImage, replacePharmacyOrganizationalChart, updatePharmacyContent } from "../services/pharmacy.service";
import type { UpdatePharmacyInput } from "../validation/pharmacy.schema";

export async function getPublicPharmacy(_req: Request, res: Response) {
  res.status(200).json({ item: await getPharmacyContent() });
}

export async function getAdminPharmacy(_req: Request, res: Response) {
  res.status(200).json({ item: await getPharmacyContent() });
}

export async function updateAdminPharmacy(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updatePharmacyContent(req.body as UpdatePharmacyInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminPharmacyImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addPharmacyCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminPharmacyImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removePharmacyCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminPharmacyOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Pharmacy Department organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replacePharmacyOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
