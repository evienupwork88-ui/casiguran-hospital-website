import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateEventInput, UpdateEventInput } from "../validation/events.schema";
import { removePublicContentImage, uploadPublicContentImage, type UploadedImage } from "./public-media.service";

export interface EventRecord {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  externalUrl: string | null;
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
    excerpt: row.excerpt ?? null,
    coverImageUrl: row.cover_image_url ?? null,
    externalUrl: row.external_url ?? null,
    status: row.status,
    authorId: row.author_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedEvents(): Promise<EventRecord[]> {
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, location, start_at, end_at, excerpt, cover_image_url, external_url, status, author_id, created_at, updated_at")
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
    .select("id, title, description, location, start_at, end_at, excerpt, cover_image_url, external_url, status, author_id, created_at, updated_at")
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
    .select("id, title, description, location, start_at, end_at, excerpt, cover_image_url, external_url, status, author_id, created_at, updated_at")
    .order("start_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin events: ${error.message}`);
  }

  return (data ?? []).map(mapEventRow);
}

export async function createEvent(input: CreateEventInput, authorId: string, coverImage?: UploadedImage): Promise<EventRecord> {
  const coverImageUrl = coverImage ? await uploadPublicContentImage(coverImage) : input.coverImageUrl?.trim() || null;
  const payload = {
    title: input.title,
    description: input.description?.trim() || null,
    location: input.location?.trim() || null,
    start_at: input.startAt,
    end_at: input.endAt && input.endAt.trim() !== "" ? input.endAt : null,
    excerpt: input.excerpt?.trim() || null,
    cover_image_url: coverImageUrl,
    external_url: input.externalUrl?.trim() || null,
    status: input.status ?? "draft",
    author_id: authorId,
  };

  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select("id, title, description, location, start_at, end_at, excerpt, cover_image_url, external_url, status, author_id, created_at, updated_at")
    .single();

  if (error) {
    await removePublicContentImage(coverImageUrl);
    throw new Error(`Failed to create event: ${error.message}`);
  }

  if (!data) {
    await removePublicContentImage(coverImageUrl);
    throw new AppError(500, "Could not create event", "EVENT_CREATE_FAILED");
  }

  return mapEventRow(data);
}

export async function updateEvent(id: string, input: UpdateEventInput, coverImage?: UploadedImage): Promise<EventRecord> {
  const payload: Record<string, unknown> = {};
  let previousCoverImageUrl: string | null = null;
  if (coverImage || input.coverImageUrl !== undefined) {
    const { data: existing, error: existingError } = await supabase
      .from("events")
      .select("cover_image_url")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw new Error(`Failed to load event before replacing its cover: ${existingError.message}`);
    if (!existing) throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
    previousCoverImageUrl = existing.cover_image_url ?? null;
  }
  const coverImageUrl = coverImage ? await uploadPublicContentImage(coverImage) : undefined;
  const nextCoverImageUrl = coverImageUrl ?? (input.coverImageUrl === undefined ? undefined : input.coverImageUrl.trim() || null);
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description.trim() || null;
  if (input.location !== undefined) payload.location = input.location.trim() || null;
  if (input.startAt !== undefined) payload.start_at = input.startAt;
  if (input.endAt !== undefined) payload.end_at = input.endAt || null;
  if (input.excerpt !== undefined) payload.excerpt = input.excerpt.trim() || null;
  if (nextCoverImageUrl !== undefined) payload.cover_image_url = nextCoverImageUrl;
  if (input.externalUrl !== undefined) payload.external_url = input.externalUrl.trim() || null;
  if (input.status !== undefined) payload.status = input.status;
  const { data, error } = await supabase.from("events").update(payload).eq("id", id)
    .select("id, title, description, location, start_at, end_at, excerpt, cover_image_url, external_url, status, author_id, created_at, updated_at").single();
  if (error) {
    await removePublicContentImage(coverImageUrl);
    throw new Error(`Failed to update event: ${error.message}`);
  }
  if (!data) {
    await removePublicContentImage(coverImageUrl);
    throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
  }
  if (nextCoverImageUrl !== undefined && previousCoverImageUrl !== nextCoverImageUrl) await removePublicContentImage(previousCoverImageUrl);
  return mapEventRow(data);
}

export async function deleteEvent(id: string): Promise<void> {
  const { data: existing, error: loadError } = await supabase.from("events").select("cover_image_url").eq("id", id).maybeSingle();
  if (loadError) throw new Error(`Failed to load event before deleting it: ${loadError.message}`);
  if (!existing) throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
  const { data, error } = await supabase.from("events").delete().eq("id", id).select("id").single();
  if (error) throw new Error(`Failed to delete event: ${error.message}`);
  if (!data) throw new AppError(404, "Event not found", "EVENT_NOT_FOUND");
  await removePublicContentImage(existing.cover_image_url);
}
