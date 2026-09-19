import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  createNews,
  getPublishedNewsBySlug,
  listAllNews,
  listPublishedNews,
} from "../services/news.service";
import type { CreateNewsInput } from "../validation/news.schema";

export async function listPublicNews(_req: Request, res: Response) {
  const news = await listPublishedNews();
  res.status(200).json({ items: news });
}

export async function getPublicNewsBySlug(req: Request, res: Response) {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0] : req.params.slug;
  const article = await getPublishedNewsBySlug(slug);

  if (!article) {
    throw new AppError(404, "News article not found", "NEWS_NOT_FOUND");
  }

  res.status(200).json({ item: article });
}

export async function listAdminNews(_req: Request, res: Response) {
  const news = await listAllNews();
  res.status(200).json({ items: news });
}

export async function createAdminNews(req: Request, res: Response) {
  const input = req.body as CreateNewsInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const article = await createNews(input, req.user.id);
  res.status(201).json({ item: article });
}
