import { supabase } from "../config/supabase";
import type { UpdatePageInput } from "../validation/pages.schema";

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
  updatedBy: string | null;
}

function mapPageRow(row: any): PageRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

export async function getPageBySlug(slug: string): Promise<PageRecord | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, body, updated_at, updated_by")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load page: ${error.message}`);
  }

  return data ? mapPageRow(data) : null;
}

export async function listAllPages(): Promise<PageRecord[]> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, body, updated_at, updated_by")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Failed to load pages: ${error.message}`);
  }

  return (data ?? []).map(mapPageRow);
}

export async function upsertPage(
  slug: string,
  input: UpdatePageInput,
  updatedById?: string
): Promise<PageRecord> {
  const payload = {
    slug,
    title: input.title.trim(),
    body: input.body.trim(),
    updated_by: updatedById ?? null,
  };

  const { data, error } = await supabase
    .from("pages")
    .upsert(payload, { onConflict: "slug" })
    .select("id, slug, title, body, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(`Failed to save page: ${error.message}`);
  }

  return mapPageRow(data);
}
