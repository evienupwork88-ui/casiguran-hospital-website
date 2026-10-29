import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addNutritionAndDieteticsCoverImages, getNutritionAndDieteticsContent, removeNutritionAndDieteticsCoverImage, replaceNutritionAndDieteticsOrganizationalChart, updateNutritionAndDieteticsContent } from "../services/nutrition-and-dietetics.service";
import type { UpdateNutritionAndDieteticsInput } from "../validation/nutrition-and-dietetics.schema";

export async function getPublicNutritionAndDietetics(_req: Request, res: Response) {
  res.status(200).json({ item: await getNutritionAndDieteticsContent() });
}

export async function getAdminNutritionAndDietetics(_req: Request, res: Response) {
  res.status(200).json({ item: await getNutritionAndDieteticsContent() });
}

export async function updateAdminNutritionAndDietetics(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateNutritionAndDieteticsContent(req.body as UpdateNutritionAndDieteticsInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminNutritionAndDieteticsImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addNutritionAndDieteticsCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminNutritionAndDieteticsImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeNutritionAndDieteticsCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminNutritionAndDieteticsOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Nutrition and Dietetics Department organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceNutritionAndDieteticsOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
