import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { getPageBySlug, listAllPages, upsertPage } from "../services/pages.service";
import type { UpdatePageInput } from "../validation/pages.schema";

export async function listPublicPages(_req: Request, res: Response) {
  const pages = await listAllPages();
  res.status(200).json({ items: pages });
}

export async function getPublicPageBySlug(req: Request, res: Response) {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const page = await getPageBySlug(slug);

  if (!page) {
    throw new AppError(404, "Page not found", "PAGE_NOT_FOUND");
  }

  res.status(200).json({ item: page });
}

export async function listAdminPages(_req: Request, res: Response) {
  const pages = await listAllPages();
  res.status(200).json({ items: pages });
}

export async function updateAdminPage(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const input = req.body as UpdatePageInput;

  const page = await upsertPage(slug, input, req.user.id);
  res.status(200).json({ item: page });
}
