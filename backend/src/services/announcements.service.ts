import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateAnnouncementInput } from "../validation/announcements.schema";

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
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at")
    .eq("status", "published")
    .order("publish_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(`Failed to load published announcements: ${error.message}`);
  }

  return (data ?? []).map(mapAnnouncementRow);
}

export async function getPublishedAnnouncementById(id: string): Promise<AnnouncementRecord | null> {
  const { data, error } = await supabase
    .from("announcements")
    .select("id, title, body, priority, status, publish_at, expires_at, author_id, created_at, updated_at")
    .eq("id", id)
    .eq("status", "published")
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
