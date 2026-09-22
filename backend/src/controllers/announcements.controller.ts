import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  createAnnouncement,
  deleteAnnouncement,
  getPublishedAnnouncementById,
  listAllAnnouncements,
  listPublishedAnnouncements,
  updateAnnouncement,
} from "../services/announcements.service";
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from "../validation/announcements.schema";

export async function listPublicAnnouncements(_req: Request, res: Response) {
  const announcements = await listPublishedAnnouncements();
  res.status(200).json({ items: announcements });
}

export async function getPublicAnnouncementById(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!isUuid(id)) {
    throw new AppError(404, "Announcement not found", "ANNOUNCEMENT_NOT_FOUND");
  }

  const announcement = await getPublishedAnnouncementById(id);

  if (!announcement) {
    throw new AppError(404, "Announcement not found", "ANNOUNCEMENT_NOT_FOUND");
  }

  res.status(200).json({ item: announcement });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

export async function updateAdminAnnouncement(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const announcement = await updateAnnouncement(id, req.body as UpdateAnnouncementInput);
  res.status(200).json({ item: announcement });
}

export async function deleteAdminAnnouncement(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteAnnouncement(id);
  res.status(200).json({ ok: true, message: "Announcement deleted successfully." });
}
