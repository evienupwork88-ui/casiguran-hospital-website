import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  createAnnouncement,
  getPublishedAnnouncementById,
  listAllAnnouncements,
  listPublishedAnnouncements,
} from "../services/announcements.service";
import type { CreateAnnouncementInput } from "../validation/announcements.schema";

export async function listPublicAnnouncements(_req: Request, res: Response) {
  const announcements = await listPublishedAnnouncements();
  res.status(200).json({ items: announcements });
}

export async function getPublicAnnouncementById(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const announcement = await getPublishedAnnouncementById(id);

  if (!announcement) {
    throw new AppError(404, "Announcement not found", "ANNOUNCEMENT_NOT_FOUND");
  }

  res.status(200).json({ item: announcement });
}

export async function listAdminAnnouncements(_req: Request, res: Response) {
  const announcements = await listAllAnnouncements();
  res.status(200).json({ items: announcements });
}

export async function createAdminAnnouncement(req: Request, res: Response) {
  const input = req.body as CreateAnnouncementInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const announcement = await createAnnouncement(input, req.user.id);
  res.status(201).json({ item: announcement });
}
