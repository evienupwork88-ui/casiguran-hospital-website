import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { UpdateKeyOfficialInput } from "../validation/key-officials.schema";

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

export type KeyOfficialInput = UpdateKeyOfficialInput & {
  photo?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
  updatedById: string;
};

export interface KeyOfficialRecord {
  id: string;
  slug: string;
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  position: string;
  officialPosition: string | null;
  photoUrl: string | null;
  displayOrder: number;
  updatedAt: string;
}

export type KeyOfficialsSlideshowRecord = { coverImages: { url: string }[] };

type KeyOfficialRow = {
  id: string;
  slug: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  name_extension: string;
  position: string;
  official_position: string | null;
  photo_path: string | null;
  display_order: number;
  updated_at: string;
};

function validatePhoto(photo: NonNullable<KeyOfficialInput["photo"]>) {
  if (photo.size > PHOTO_MAX_BYTES) {
    throw new AppError(400, "Profile photos must be 5MB or smaller.", "KEY_OFFICIAL_PHOTO_TOO_LARGE");
  }

  const extension = photo.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = PHOTO_TYPES[extension as keyof typeof PHOTO_TYPES];

  if (!expected || photo.mimetype.toLowerCase() !== expected.mime || !expected.signature(photo.buffer)) {
    throw new AppError(400, "Upload a valid JPG, PNG, or WebP profile photo.", "INVALID_KEY_OFFICIAL_PHOTO");
  }

  return { extension, mimeType: expected.mime };
}

async function mapRow(row: KeyOfficialRow): Promise<KeyOfficialRecord> {
  let photoUrl: string | null = null;
  if (row.photo_path) {
    const { data, error } = await supabase.storage
      .from(env.storageBucketName)
      .createSignedUrl(row.photo_path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create Key Officials photo link: ${error.message}`);
    photoUrl = data.signedUrl;
  }

  return {
    id: row.id,
    slug: row.slug,
    name: [row.first_name, row.middle_name, row.last_name, row.name_extension].filter(Boolean).join(" ") || row.name,
    firstName: row.first_name ?? "",
    middleName: row.middle_name ?? "",
    lastName: row.last_name ?? "",
    nameExtension: row.name_extension ?? "",
    position: row.position,
    officialPosition: row.official_position,
    photoUrl,
    displayOrder: row.display_order,
    updatedAt: row.updated_at,
  };
}

async function getRows(): Promise<KeyOfficialRow[]> {
  const { data, error } = await supabase
    .from("key_officials")
    .select("id, slug, name, first_name, middle_name, last_name, name_extension, position, official_position, photo_path, display_order, updated_at")
    .order("display_order", { ascending: true });

  if (error) throw new Error(`Failed to load Key Officials: ${error.message}`);
  return (data ?? []) as KeyOfficialRow[];
}

async function getSlideshowPaths(): Promise<string[]> {
  const { data, error } = await supabase
    .from("key_officials_slideshow")
    .select("cover_image_paths")
    .eq("id", 1)
    .single();
  if (error) throw new Error(`Failed to load Key Officials slideshow: ${error.message}`);
  return data.cover_image_paths ?? [];
}

async function mapSlideshow(paths: string[]): Promise<KeyOfficialsSlideshowRecord> {
  const coverImages = await Promise.all(paths.map(async (path) => {
    const { data, error } = await supabase.storage
      .from(env.storageBucketName)
      .createSignedUrl(path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create Key Officials slideshow image link: ${error.message}`);
    return { url: data.signedUrl };
  }));
  return { coverImages };
}

export async function getKeyOfficialsSlideshow(): Promise<KeyOfficialsSlideshowRecord> {
  return mapSlideshow(await getSlideshowPaths());
}

type UploadedSlideshowImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };

export async function addKeyOfficialsSlideshowImages(
  files: UploadedSlideshowImage[],
  updatedById: string,
): Promise<KeyOfficialsSlideshowRecord> {
  if (files.length === 0) throw new AppError(400, "Choose at least one Key Officials header photo.", "COVER_IMAGE_REQUIRED");
  if (files.some((file) => file.size > PHOTO_MAX_BYTES)) {
    throw new AppError(400, "Key Officials header photos must be 5MB or smaller.", "KEY_OFFICIALS_SLIDESHOW_IMAGE_TOO_LARGE");
  }
  const validated = files.map((file) => {
    const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    const expected = PHOTO_TYPES[extension as keyof typeof PHOTO_TYPES];
    if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
      throw new AppError(400, "Upload valid JPG, PNG, or WebP photos.", "INVALID_KEY_OFFICIALS_SLIDESHOW_IMAGE");
    }
    return { extension, mimeType: expected.mime };
  });

  const existingPaths = await getSlideshowPaths();
  if (existingPaths.length + files.length > 10) {
    throw new AppError(400, "The Key Officials header slideshow can contain up to 10 photos.", "TOO_MANY_COVER_IMAGES");
  }
  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const path = `key-officials/header/${crypto.randomUUID()}.${validated[index].extension}`;
    const { error } = await supabase.storage.from(env.storageBucketName).upload(path, file.buffer, {
      contentType: validated[index].mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload Key Officials photos and clean up earlier uploads: ${error.message}; ${cleanupError.message}`);
      }
      throw new Error(`Failed to upload Key Officials slideshow photo: ${error.message}`);
    }
    uploadedPaths.push(path);
  }

  const nextPaths = [...existingPaths, ...uploadedPaths];
  const { error } = await supabase.from("key_officials_slideshow")
    .update({ cover_image_paths: nextPaths, updated_by: updatedById })
    .eq("id", 1);
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save Key Officials slideshow and clean up uploads: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Key Officials slideshow: ${error.message}`);
  }
  return mapSlideshow(nextPaths);
}

export async function removeKeyOfficialsSlideshowImage(index: number, updatedById: string): Promise<KeyOfficialsSlideshowRecord> {
  const paths = await getSlideshowPaths();
  if (!Number.isInteger(index) || index < 0 || index >= paths.length) {
    throw new AppError(404, "Key Officials slideshow photo not found.", "COVER_IMAGE_NOT_FOUND");
  }
  const [removedPath] = paths.splice(index, 1);
  const { error } = await supabase.from("key_officials_slideshow")
    .update({ cover_image_paths: paths, updated_by: updatedById })
    .eq("id", 1);
  if (error) throw new Error(`Failed to remove Key Officials slideshow photo: ${error.message}`);
  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`Key Officials slideshow photo removed from the page, but its stored file could not be deleted: ${storageError.message}`);
  return mapSlideshow(paths);
}

export async function listKeyOfficials(): Promise<KeyOfficialRecord[]> {
  return Promise.all((await getRows()).map(mapRow));
}

export async function updateKeyOfficial(
  slug: string,
  input: KeyOfficialInput,
): Promise<KeyOfficialRecord> {
  const { data: existing, error: fetchError } = await supabase
    .from("key_officials")
    .select("id, slug, name, first_name, middle_name, last_name, name_extension, position, official_position, photo_path, display_order, updated_at")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchError) throw new Error(`Failed to load Key Official: ${fetchError.message}`);
  if (!existing) throw new AppError(404, "Key Official slot not found.", "KEY_OFFICIAL_NOT_FOUND");
  if (slug !== "chief-of-hospital" && !input.officialPosition?.trim()) {
    throw new AppError(400, "Official position is required for this profile.", "OFFICIAL_POSITION_REQUIRED");
  }

  let photoPath = existing.photo_path as string | null;
  let replacementPath: string | null = null;
  let removeExistingPhoto = false;

  if (input.photo) {
    const { extension, mimeType } = validatePhoto(input.photo);
    replacementPath = `key-officials/${slug}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage
      .from(env.storageBucketName)
      .upload(replacementPath, input.photo.buffer, {
        contentType: mimeType,
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw new Error(`Failed to upload Key Officials photo: ${error.message}`);
    photoPath = replacementPath;
    removeExistingPhoto = Boolean(existing.photo_path);
  } else if (input.removePhoto === "true" && existing.photo_path) {
    photoPath = null;
    removeExistingPhoto = true;
  }

  const { data, error: updateError } = await supabase
    .from("key_officials")
    .update({
      name: [input.firstName, input.middleName, input.lastName, input.nameExtension].filter(Boolean).join(" ").trim(),
      first_name: input.firstName.trim(),
      middle_name: input.middleName?.trim() ?? "",
      last_name: input.lastName.trim(),
      name_extension: input.nameExtension?.trim() ?? "",
      position: input.position.trim(),
      official_position: slug === "chief-of-hospital" ? null : input.officialPosition?.trim() ?? null,
      photo_path: photoPath,
      updated_by: input.updatedById,
    })
    .eq("slug", slug)
    .select("id, slug, name, first_name, middle_name, last_name, name_extension, position, official_position, photo_path, display_order, updated_at")
    .single();

  if (updateError) {
    if (replacementPath) {
      const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove([replacementPath]);
      if (cleanupError) throw new Error(`Failed to save Key Official and clean up the uploaded photo: ${updateError.message}; ${cleanupError.message}`);
    }
    throw new Error(`Failed to save Key Official: ${updateError.message}`);
  }

  if (removeExistingPhoto && existing.photo_path) {
    const { error: removeError } = await supabase.storage.from(env.storageBucketName).remove([existing.photo_path]);
    if (removeError) throw new Error(`Key Official saved, but the previous photo could not be removed: ${removeError.message}`);
  }

  return mapRow(data as KeyOfficialRow);
}
