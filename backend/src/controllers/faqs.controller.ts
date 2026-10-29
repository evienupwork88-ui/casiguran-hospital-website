import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { archiveFaq, createFaq, listFaqs, updateFaq } from "../services/faqs.service";
import type { CreateFaqInput, UpdateFaqInput } from "../validation/faqs.schema";

export async function listPublicFaqs(req: Request, res: Response) {
  const active = req.query.active !== "false";
  const items = await listFaqs(active);
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=60");
  res.status(200).json({ items });
}

export async function listAdminFaqs(_req: Request, res: Response) {
  res.status(200).json({ items: await listFaqs() });
}

export async function createAdminFaq(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");
  const item = await createFaq(req.body as CreateFaqInput, req.user.id);
  res.status(201).json({ item });
}

export async function updateAdminFaq(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = await updateFaq(id, req.body as UpdateFaqInput, req.user.id);
  res.status(200).json({ item });
}

export async function archiveAdminFaq(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const item = await archiveFaq(id, req.user.id);
  res.status(200).json({ item });
}
