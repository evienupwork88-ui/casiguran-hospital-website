import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { createTraining, deleteTraining, listAdminTrainings, listPublicTrainings, updateTraining } from "../services/trainings.service";
import type { TrainingInput, UpdateTrainingInput } from "../validation/trainings.schema";

export async function listPublicTrainingItems(_req: Request, res: Response) {
  res.status(200).json({ items: await listPublicTrainings() });
}

export async function listAdminTrainingItems(_req: Request, res: Response) {
  res.status(200).json({ items: await listAdminTrainings() });
}

export async function createAdminTraining(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await createTraining(req.body as TrainingInput, req.user.id, req.file);
  res.status(201).json({ item });
}

export async function updateAdminTraining(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = await updateTraining(id, req.body as UpdateTrainingInput, req.file);
  res.status(200).json({ item });
}

export async function deleteAdminTraining(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteTraining(id);
  res.status(200).json({ ok: true, message: "Training deleted successfully." });
}
