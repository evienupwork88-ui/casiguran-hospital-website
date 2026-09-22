import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateAnnouncementInput, UpdateAnnouncementInput } from "../validation/announcements.schema";

export interface AnnouncementRecord {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "urgent";
  status: "draft" | "published";
  publishAt: string | null;
  expiresAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapAnnouncementRow(row: any): AnnouncementRecord {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    priority: row.priority,
    status: row.status,
    publishAt: row.publish_at ?? null,
    expiresAt: row.expires_at ?? null,
    authorId: row.author_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedAnnouncements(): Promise<AnnouncementRecord[]> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at")
    .eq("status", "published")
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order("publish_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load published announcements: ${error.message}`);
  }

  return (data ?? []).map(mapAnnouncementRow);
}

export async function getPublishedAnnouncementById(id: string): Promise<AnnouncementRecord | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at")
    .eq("id", id)
    .eq("status", "published")
    .or(`publish_at.is.null,publish_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load announcement: ${error.message}`);
  }

  return data ? mapAnnouncementRow(data) : null;
}

export async function listAllAnnouncements(): Promise<AnnouncementRecord[]> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin announcements: ${error.message}`);
  }

  return (data ?? []).map(mapAnnouncementRow);
}

export async function createAnnouncement(
  input: CreateAnnouncementInput,
  authorId: string
): Promise<AnnouncementRecord> {
  const payload = {
    title: input.title,
    body: input.body,
    priority: input.priority ?? "normal",
    status: input.status ?? "draft",
    publish_at: input.publishAt && input.publishAt.trim() !== "" ? input.publishAt : null,
    expires_at: input.expiresAt && input.expiresAt.trim() !== "" ? input.expiresAt : null,
    author_id: authorId,
  };

  const { data, error } = await supabase
    .from("announcements")
    .insert(payload)
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create announcement: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not create announcement", "ANNOUNCEMENT_CREATE_FAILED");
  }

  return mapAnnouncementRow(data);
}

export async function updateAnnouncement(id: string, input: UpdateAnnouncementInput): Promise<AnnouncementRecord> {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.body !== undefined) payload.body = input.body;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.status !== undefined) payload.status = input.status;
  if (input.publishAt !== undefined) payload.publish_at = input.publishAt || null;
  if (input.expiresAt !== undefined) payload.expires_at = input.expiresAt || null;
  const { data, error } = await supabase.from("announcements").update(payload).eq("id", id)
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at").single();
  if (error) throw new Error(`Failed to update announcement: ${error.message}`);
  if (!data) throw new AppError(404, "Announcement not found", "ANNOUNCEMENT_NOT_FOUND");
  return mapAnnouncementRow(data);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { data, error } = await supabase.from("announcements").delete().eq("id", id).select("id").single();
  if (error) throw new Error(`Failed to delete announcement: ${error.message}`);
  if (!data) throw new AppError(404, "Announcement not found", "ANNOUNCEMENT_NOT_FOUND");
}
