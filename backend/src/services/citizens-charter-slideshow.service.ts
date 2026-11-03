import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;
const PHOTO_TYPES = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

export type CitizensCharterSlideshow = { coverImages: { url: string }[] };
type UploadedImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };

async function getImagePaths(): Promise<string[]> {
  const { data, error } = await supabase
    .from("citizens_charter_slideshow")
    .select("cover_image_paths")
    .eq("id", 1)
    .single();
  if (error) throw new Error(`Failed to load Citizen's Charter slideshow: ${error.message}`);
  return data.cover_image_paths ?? [];
}

async function mapSlideshow(paths: string[]): Promise<CitizensCharterSlideshow> {
  const coverImages = await Promise.all(paths.map(async (path) => {
    const { data, error } = await supabase.storage
      .from(env.storageBucketName)
      .createSignedUrl(path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create Citizen's Charter slideshow image link: ${error.message}`);
    return { url: data.signedUrl };
  }));
  return { coverImages };
}

export async function getCitizensCharterSlideshow(): Promise<CitizensCharterSlideshow> {
  return mapSlideshow(await getImagePaths());
}

export async function addCitizensCharterSlideshowImages(
  files: UploadedImage[],
  updatedById: string,
): Promise<CitizensCharterSlideshow> {
  if (files.length === 0) throw new AppError(400, "Choose at least one Citizen's Charter header photo.", "COVER_IMAGE_REQUIRED");
  if (files.some((file) => file.size > PHOTO_MAX_BYTES)) {
    throw new AppError(400, "Citizen's Charter header photos must be 5MB or smaller.", "CITIZENS_CHARTER_SLIDESHOW_IMAGE_TOO_LARGE");
  }
  const validated = files.map((file) => {
    const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    const expected = PHOTO_TYPES[extension as keyof typeof PHOTO_TYPES];
    if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
      throw new AppError(400, "Upload valid JPG, PNG, or WebP photos.", "INVALID_CITIZENS_CHARTER_SLIDESHOW_IMAGE");
    }
    return { extension, mimeType: expected.mime };
  });

  const existingPaths = await getImagePaths();
  if (existingPaths.length + files.length > MAX_PHOTOS) {
    throw new AppError(400, "The Citizen's Charter header slideshow can contain up to 10 photos.", "TOO_MANY_COVER_IMAGES");
  }

  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const path = `citizens-charter/header/${crypto.randomUUID()}.${validated[index].extension}`;
    const { error } = await supabase.storage.from(env.storageBucketName).upload(path, file.buffer, {
      contentType: validated[index].mimeType,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload Citizen's Charter photos and clean up earlier uploads: ${error.message}; ${cleanupError.message}`);
      }
      throw new Error(`Failed to upload Citizen's Charter slideshow photo: ${error.message}`);
    }
    uploadedPaths.push(path);
  }

  const nextPaths = [...existingPaths, ...uploadedPaths];
  const { error } = await supabase.from("citizens_charter_slideshow")
    .update({ cover_image_paths: nextPaths, updated_by: updatedById })
    .eq("id", 1);
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save Citizen's Charter slideshow and clean up uploads: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Citizen's Charter slideshow: ${error.message}`);
  }
  return mapSlideshow(nextPaths);
}

export async function removeCitizensCharterSlideshowImage(
  index: number,
  updatedById: string,
): Promise<CitizensCharterSlideshow> {
  const paths = await getImagePaths();
  if (!Number.isInteger(index) || index < 0 || index >= paths.length) {
    throw new AppError(404, "Citizen's Charter slideshow photo not found.", "COVER_IMAGE_NOT_FOUND");
  }
  const [removedPath] = paths.splice(index, 1);
  const { error } = await supabase.from("citizens_charter_slideshow")
    .update({ cover_image_paths: paths, updated_by: updatedById })
    .eq("id", 1);
  if (error) throw new Error(`Failed to remove Citizen's Charter slideshow photo: ${error.message}`);
  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`Citizen's Charter slideshow photo removed from the page, but its stored file could not be deleted: ${storageError.message}`);
  return mapSlideshow(paths);
}
