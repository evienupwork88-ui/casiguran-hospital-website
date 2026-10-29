import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { addOpdCoverImages, getOpdContent, removeOpdCoverImage, replaceOpdOrganizationalChart, updateOpdContent } from "../services/opd.service";
import type { UpdateOpdInput } from "../validation/opd.schema";

export async function getPublicOpd(_req: Request, res: Response) {
  res.status(200).json({ item: await getOpdContent() });
}

export async function getAdminOpd(_req: Request, res: Response) {
  res.status(200).json({ item: await getOpdContent() });
}

export async function updateAdminOpd(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await updateOpdContent(req.body as UpdateOpdInput, req.user.id);
  res.status(200).json({ item });
}

export async function addAdminOpdImages(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  const item = await addOpdCoverImages(files, req.user.id);
  res.status(200).json({ item });
}

export async function removeAdminOpdImage(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  const item = await removeOpdCoverImage(index, req.user.id);
  res.status(200).json({ item });
}

export async function uploadAdminOpdOrganizationalChart(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  if (!req.file) throw new AppError(400, "Choose an OPD organizational chart image.", "CHART_IMAGE_REQUIRED");
  const item = await replaceOpdOrganizationalChart(req.file, req.user.id);
  res.status(200).json({ item });
}
