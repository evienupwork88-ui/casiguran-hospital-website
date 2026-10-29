import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  addEmergencyDepartmentImages,
  getEmergencyDepartmentContent,
  removeEmergencyDepartmentImage,
  replaceEmergencyDepartmentChart,
  updateEmergencyDepartmentContent,
} from "../services/emergency-department.service";
import type { UpdateEmergencyDepartmentInput } from "../validation/emergency-department.schema";

export async function getPublicEmergencyDepartment(_req: Request, res: Response) {
  res.status(200).json({ item: await getEmergencyDepartmentContent() });
}

export async function getAdminEmergencyDepartment(_req: Request, res: Response) {
  res.status(200).json({ item: await getEmergencyDepartmentContent() });
}

export async function updateAdminEmergencyDepartment(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateEmergencyDepartmentContent(req.body as UpdateEmergencyDepartmentInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminEmergencyDepartmentImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addEmergencyDepartmentImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminEmergencyDepartmentImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeEmergencyDepartmentImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminEmergencyDepartmentChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose an Emergency Department organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceEmergencyDepartmentChart(req.file, req.user.id);
  res.status(200).json({ item });
}
