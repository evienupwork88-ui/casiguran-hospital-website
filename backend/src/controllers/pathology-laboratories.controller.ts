import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addPathologyAndLaboratoriesCoverImages, getPathologyAndLaboratoriesContent, removePathologyAndLaboratoriesCoverImage, replacePathologyAndLaboratoriesOrganizationalChart, updatePathologyAndLaboratoriesContent } from "../services/pathology-laboratories.service";
import type { UpdatePathologyAndLaboratoriesInput } from "../validation/pathology-laboratories.schema";

export async function getPublicPathologyAndLaboratories(_req: Request, res: Response) {
  res.status(200).json({ item: await getPathologyAndLaboratoriesContent() });
}

export async function getAdminPathologyAndLaboratories(_req: Request, res: Response) {
  res.status(200).json({ item: await getPathologyAndLaboratoriesContent() });
}

export async function updateAdminPathologyAndLaboratories(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updatePathologyAndLaboratoriesContent(req.body as UpdatePathologyAndLaboratoriesInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminPathologyAndLaboratoriesImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!Array.isArray(req.files) || req.files.length === 0) {
    throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  }
  const item = await addPathologyAndLaboratoriesCoverImages(req.files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminPathologyAndLaboratoriesImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removePathologyAndLaboratoriesCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminPathologyAndLaboratoriesOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose a Pathology and Laboratories organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replacePathologyAndLaboratoriesOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
