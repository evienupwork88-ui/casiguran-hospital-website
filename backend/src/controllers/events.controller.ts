import type { Request, Response } from "express";
import { AppError } from "../utils/AppError";
import {
  createEvent,
  getPublishedEventById,
  listAllEvents,
  listPublishedEvents,
} from "../services/events.service";
import type { CreateEventInput } from "../validation/events.schema";

export async function listPublicEvents(_req: Request, res: Response) {
  const events = await listPublishedEvents();
  res.status(200).json({ items: events });
}

export async function getPublicEventById(req: Request, res: Response) {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const event = await getPublishedEventById(id);

  if (!event) {
    throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
  }

  res.status(200).json({ item: event });
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
