import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addPediatricsCoverImages, getPediatricsContent, removePediatricsCoverImage, replacePediatricsOrganizationalChart, updatePediatricsContent } from "../services/pediatrics.service";
import type { UpdatePediatricsInput } from "../validation/pediatrics.schema";

export async function getPublicPediatrics(_req: Request, res: Response) {
  res.status(200).json({ item: await getPediatricsContent() });
}

export async function getAdminPediatrics(_req: Request, res: Response) {
  res.status(200).json({ item: await getPediatricsContent() });
}

export async function updateAdminPediatrics(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updatePediatricsContent(req.body as UpdatePediatricsInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminPediatricsImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addPediatricsCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminPediatricsImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removePediatricsCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminPediatricsOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Pediatrics organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replacePediatricsOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
