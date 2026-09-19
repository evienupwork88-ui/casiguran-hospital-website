import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateNewsInput } from "../validation/news.schema";

export interface NewsRecord {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapNewsRow(row: any): NewsRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt ?? null,
    body: row.body,
    coverImageUrl: row.cover_image_url ?? null,
    status: row.status,
    publishedAt: row.published_at ?? null,
    authorId: row.author_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedNews(): Promise<NewsRecord[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, body, cover_image_url, status, published_at, author_id, created_at, updated_at")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load published news: ${error.message}`);
  }

  return (data ?? []).map(mapNewsRow);
}

export async function getPublishedNewsBySlug(slug: string): Promise<NewsRecord | null> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, body, cover_image_url, status, published_at, author_id, created_at, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load news article: ${error.message}`);
  }

  return data ? mapNewsRow(data) : null;
}

export async function listAllNews(): Promise<NewsRecord[]> {
  const { data, error } = await supabase
    .from("news_posts")
    .select("id, title, slug, excerpt, body, cover_image_url, status, published_at, author_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin news: ${error.message}`);
  }

  return (data ?? []).map(mapNewsRow);
}

export async function createNews(input: CreateNewsInput, authorId: string): Promise<NewsRecord> {
  const payload = {
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt?.trim() || null,
    body: input.body,
    cover_image_url: input.coverImageUrl?.trim() || null,
    status: input.status ?? "draft",
    published_at: input.publishedAt && input.publishedAt.trim() !== "" ? input.publishedAt : null,
    author_id: authorId,
  };

  const { data, error } = await supabase
    .from("news_posts")
    .insert(payload)
    .select("id, title, slug, excerpt, body, cover_image_url, status, published_at, author_id, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create news article: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not create news article", "NEWS_CREATE_FAILED");
  }

  return mapNewsRow(data);
}
