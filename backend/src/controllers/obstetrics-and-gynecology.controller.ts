import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addObstetricsAndGynecologyCoverImages, getObstetricsAndGynecologyContent, removeObstetricsAndGynecologyCoverImage, replaceObstetricsAndGynecologyOrganizationalChart, updateObstetricsAndGynecologyContent } from "../services/obstetrics-and-gynecology.service";
import type { UpdateObstetricsAndGynecologyInput } from "../validation/obstetrics-and-gynecology.schema";

export async function getPublicObstetricsAndGynecology(_req: Request, res: Response) {
  res.status(200).json({ item: await getObstetricsAndGynecologyContent() });
}

export async function getAdminObstetricsAndGynecology(_req: Request, res: Response) {
  res.status(200).json({ item: await getObstetricsAndGynecologyContent() });
}

export async function updateAdminObstetricsAndGynecology(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateObstetricsAndGynecologyContent(req.body as UpdateObstetricsAndGynecologyInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminObstetricsAndGynecologyImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addObstetricsAndGynecologyCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminObstetricsAndGynecologyImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeObstetricsAndGynecologyCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminObstetricsAndGynecologyOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose an Obstetrics and Gynecology organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceObstetricsAndGynecologyOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
