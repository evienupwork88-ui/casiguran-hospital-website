import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateEventInput } from "../validation/events.schema";

export interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published";
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapEventRow(row: any): EventRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    location: row.location ?? null,
    startAt: row.start_at,
    endAt: row.end_at ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    status: row.status,
    authorId: row.author_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, start_at, end_at, cover_image_url, status, author_id, created_at, updated_at")
    .eq("status", "published")
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load published events: ${error.message}`);
  }

  return (data ?? []).map(mapEventRow);
}

export async function getPublishedEventById(id: string): Promise<EventRecord | null> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, start_at, end_at, cover_image_url, status, author_id, created_at, updated_at")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load event: ${error.message}`);
  }

  return data ? mapEventRow(data) : null;
}

export async function listAllEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, start_at, end_at, cover_image_url, status, author_id, created_at, updated_at")
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin events: ${error.message}`);
  }

  return (data ?? []).map(mapEventRow);
}

export async function createEvent(input: CreateEventInput, authorId: string): Promise<EventRecord> {
  const payload = {
    title: input.title,
    description: input.description?.trim() || null,
    location: input.location?.trim() || null,
    start_at: input.startAt,
    end_at: input.endAt && input.endAt.trim() !== "" ? input.endAt : null,
    cover_image_url: input.coverImageUrl?.trim() || null,
    status: input.status ?? "draft",
    author_id: authorId,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id, title, description, location, start_at, end_at, cover_image_url, status, author_id, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create event: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not create event", "EVENT_CREATE_FAILED");
  }

  return mapEventRow(data);
}
