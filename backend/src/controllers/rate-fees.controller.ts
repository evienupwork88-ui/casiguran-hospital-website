import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { createRateFeeItem, deleteRateFeeItem, listRateFeeItems, updateRateFeeItem } from "../services/rate-fees.service";
import type { RateFeeItemInput } from "../validation/rate-fees.schema";

export async function listPublicRateFees(_req: Request, res: Response) {
  res.status(200).json({ items: await listRateFeeItems(true) });
}

export async function listAdminRateFees(_req: Request, res: Response) {
  res.status(200).json({ items: await listRateFeeItems(false) });
}

export async function createAdminRateFee(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  const item = await createRateFeeItem(req.body as RateFeeItemInput);
  res.status(201).json({ item });
}

export async function updateAdminRateFee(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  res.status(200).json({ item: await updateRateFeeItem(id, req.body) });
}

export async function deleteAdminRateFee(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteRateFeeItem(id);
  res.status(200).json({ ok: true });
}
