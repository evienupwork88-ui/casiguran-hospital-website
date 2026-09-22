import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  createEvent,
  deleteEvent,
  getPublishedEventById,
  listAllEvents,
  listPublishedEvents,
  updateEvent,
} from "../services/events.service";
import type { CreateEventInput, UpdateEventInput } from "../validation/events.schema";

export async function listPublicEvents(_req: Request, res: Response) {
  const events = await listPublishedEvents();
  res.status(200).json({ items: events });
}

export async function getPublicEventById(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!isUuid(id)) {
    throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
  }

  const event = await getPublishedEventById(id);

  if (!event) {
    throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
  }

  res.status(200).json({ item: event });
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function listAdminEvents(_req: Request, res: Response) {
  const events = await listAllEvents();
  res.status(200).json({ items: events });
}

export async function createAdminEvent(req: Request, res: Response) {
  const input = req.body as CreateEventInput;

  if (!req.user) {
    throw new AppError(401, "Not authenticated", "UNAUTHENTICATED");
  }

  const event = await createEvent(input, req.user.id);
  res.status(201).json({ item: event });
}

export async function updateAdminEvent(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const event = await updateEvent(id, req.body as UpdateEventInput);
  res.status(200).json({ item: event });
}

export async function deleteAdminEvent(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteEvent(id);
  res.status(200).json({ ok: true, message: "Event deleted successfully." });
}
