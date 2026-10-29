import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { UpdatePageInput } from "../validation/pages.schema";

export interface PageRecord {
  id: string;
  slug: string;
  title: string;
  body: string;
  coverImageUrl: string | null;
  coverImages: { url: string }[];
  updatedAt: string;
  updatedBy: string | null;
}

async function mapPageRow(row: any): Promise<PageRecord> {
  const coverImagePaths: string[] = row.cover_image_paths?.length
    ? row.cover_image_paths
    : row.cover_image_path ? [row.cover_image_path] : [];
  const coverImages = await Promise.all(coverImagePaths.map(async (path) => {
    const { data, error } = await supabase.storage
      .from(env.storageBucketName)
      .createSignedUrl(path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create hospital history image link: ${error.message}`);
    return { url: data.signedUrl };
  }));

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    body: row.body,
    coverImageUrl: coverImages[0]?.url ?? null,
    coverImages,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

export async function getPageBySlug(slug: string): Promise<PageRecord | null> {
  const { data, error } = await supabase
    .from("pages")
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
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
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
    .order("title", { ascending: true });

  if (error) {
    throw new Error(`Failed to load pages: ${error.message}`);
  }

  return Promise.all((data ?? []).map(mapPageRow));
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
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(`Failed to save page: ${error.message}`);
  }

  return mapPageRow(data);
}

export async function updateHospitalHistoryCover(
  file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
): Promise<PageRecord> {
  return addHospitalHistoryCoverImages([file], true);
}

type UploadedHistoryImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };

const historyImageFormats = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

function validateHistoryImage(file: UploadedHistoryImage) {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Each Hospital History photo must be within the configured image size limit.", "FILE_TOO_LARGE");
  }
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = historyImageFormats[extension as keyof typeof historyImageFormats];
  if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
    throw new AppError(400, "Upload valid JPG, PNG, or WebP photos.", "INVALID_COVER_IMAGE");
  }
  return { extension, mime: expected.mime };
}

async function addHospitalHistoryCoverImages(files: UploadedHistoryImage[], replaceExisting = false): Promise<PageRecord> {
  if (files.length === 0) throw new AppError(400, "Choose at least one Hospital History photo.", "COVER_IMAGE_REQUIRED");
  const validated = files.map(validateHistoryImage);
  const { data: existing, error: existingError } = await supabase
    .from("pages")
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
    .eq("slug", "hospital-history")
    .maybeSingle();
  if (existingError) throw new Error(`Failed to load Hospital History page: ${existingError.message}`);
  if (!existing) throw new AppError(404, "Hospital History page not found.", "PAGE_NOT_FOUND");

  const existingPaths: string[] = existing.cover_image_paths?.length
    ? existing.cover_image_paths
    : existing.cover_image_path ? [existing.cover_image_path] : [];
  const nextCount = (replaceExisting ? 0 : existingPaths.length) + files.length;
  if (nextCount > 10) throw new AppError(400, "The Hospital History slideshow can contain up to 10 photos.", "TOO_MANY_COVER_IMAGES");

  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const path = `hospital-history/${crypto.randomUUID()}.${validated[index].extension}`;
    const { error } = await supabase.storage.from(env.storageBucketName).upload(path, file.buffer, {
      contentType: validated[index].mime,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload Hospital History photos and clean up earlier uploads: ${error.message}; ${cleanupError.message}`);
      }
      throw new Error(`Failed to upload Hospital History photo: ${error.message}`);
    }
    uploadedPaths.push(path);
  }

  const nextPaths = replaceExisting ? uploadedPaths : [...existingPaths, ...uploadedPaths];
  const { data, error: updateError } = await supabase.from("pages")
    .update({ cover_image_paths: nextPaths, cover_image_path: nextPaths[0] ?? null })
    .eq("slug", "hospital-history")
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
    .single();
  if (updateError) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save Hospital History photos and clean up uploads: ${updateError.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Hospital History photos: ${updateError.message}`);
  }

  if (replaceExisting && existingPaths.length) {
    const { error: removeError } = await supabase.storage.from(env.storageBucketName).remove(existingPaths);
    if (removeError) throw new Error(`Photos saved, but previous Hospital History photos could not be removed: ${removeError.message}`);
  }
  return mapPageRow(data);
}

export async function addHospitalHistoryCoverImagesFromUpload(files: UploadedHistoryImage[]): Promise<PageRecord> {
  return addHospitalHistoryCoverImages(files);
}

export async function removeHospitalHistoryCoverImage(index: number): Promise<PageRecord> {
  if (!Number.isInteger(index) || index < 0) throw new AppError(400, "Invalid Hospital History photo index.", "INVALID_IMAGE_INDEX");
  const { data: existing, error: existingError } = await supabase.from("pages")
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
    .eq("slug", "hospital-history")
    .maybeSingle();
  if (existingError) throw new Error(`Failed to load Hospital History page: ${existingError.message}`);
  if (!existing) throw new AppError(404, "Hospital History page not found.", "PAGE_NOT_FOUND");

  const paths: string[] = existing.cover_image_paths?.length
    ? [...existing.cover_image_paths]
    : existing.cover_image_path ? [existing.cover_image_path] : [];
  if (index >= paths.length) throw new AppError(404, "Hospital History photo not found.", "IMAGE_NOT_FOUND");
  const [removedPath] = paths.splice(index, 1);
  const { data, error } = await supabase.from("pages")
    .update({ cover_image_paths: paths, cover_image_path: paths[0] ?? null })
    .eq("slug", "hospital-history")
    .select("id, slug, title, body, cover_image_path, cover_image_paths, updated_at, updated_by")
    .single();
  if (error) throw new Error(`Failed to remove Hospital History photo: ${error.message}`);

  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`Hospital History photo removed from the slideshow, but its stored file could not be deleted: ${storageError.message}`);
  return mapPageRow(data);
}
