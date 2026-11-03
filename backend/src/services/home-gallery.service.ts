import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { ReorderHomeGalleryImagesInput } from "../validation/home-gallery.schema";

type UploadedImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };
export type HomeGalleryRecord = { images: { url: string }[] };

const imageFormats = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

function validateImage(file: UploadedImage): { extension: string; mime: string } {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Each gallery image must be within the configured image size limit.", "FILE_TOO_LARGE");
  }
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = imageFormats[extension as keyof typeof imageFormats];
  if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
    throw new AppError(400, "Upload valid JPG, PNG, or WebP images.", "INVALID_GALLERY_IMAGE");
  }
  return { extension, mime: expected.mime };
}

async function getImagePaths(): Promise<string[]> {
  const { data, error } = await supabase.from("homepage_gallery").select("image_paths").eq("id", 1).single();
  if (error) throw new Error(`Failed to load homepage gallery: ${error.message}`);
  return data.image_paths ?? [];
}

async function mapImages(paths: string[]): Promise<HomeGalleryRecord> {
  const images = await Promise.all(paths.map(async (path) => {
    const { data, error } = await supabase.storage.from(env.storageBucketName).createSignedUrl(path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create homepage gallery image link: ${error.message}`);
    return { url: data.signedUrl };
  }));
  return { images };
}

export async function getHomeGallery(): Promise<HomeGalleryRecord> {
  return mapImages(await getImagePaths());
}

export async function addHomeGalleryImages(files: UploadedImage[], updatedById: string): Promise<HomeGalleryRecord> {
  if (!files.length) throw new AppError(400, "Choose at least one image to upload.", "GALLERY_IMAGE_REQUIRED");
  const validated = files.map(validateImage);
  const existingPaths = await getImagePaths();
  if (existingPaths.length + files.length > 30) {
    throw new AppError(400, "The homepage gallery can contain up to 30 images.", "TOO_MANY_GALLERY_IMAGES");
  }

  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const path = `homepage-gallery/${crypto.randomUUID()}.${validated[index].extension}`;
    const { error } = await supabase.storage.from(env.storageBucketName).upload(path, file.buffer, {
      contentType: validated[index].mime,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload gallery images and clean up earlier uploads: ${error.message}; ${cleanupError.message}`);
      }
      throw new Error(`Failed to upload homepage gallery image: ${error.message}`);
    }
    uploadedPaths.push(path);
  }

  const { error } = await supabase.from("homepage_gallery")
    .update({ image_paths: [...existingPaths, ...uploadedPaths], updated_by: updatedById })
    .eq("id", 1);
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save homepage gallery images and clean up uploaded files: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save homepage gallery images: ${error.message}`);
  }
  return mapImages([...existingPaths, ...uploadedPaths]);
}

export async function removeHomeGalleryImage(index: number, updatedById: string): Promise<HomeGalleryRecord> {
  const paths = await getImagePaths();
  if (!Number.isInteger(index) || index < 0 || index >= paths.length) {
    throw new AppError(404, "Homepage gallery image not found.", "GALLERY_IMAGE_NOT_FOUND");
  }
  const [removedPath] = paths.splice(index, 1);
  const { error } = await supabase.from("homepage_gallery")
    .update({ image_paths: paths, updated_by: updatedById })
    .eq("id", 1);
  if (error) throw new Error(`Failed to remove homepage gallery image: ${error.message}`);
  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`Gallery image removed from the page, but its stored file could not be deleted: ${storageError.message}`);
  return mapImages(paths);
}

export async function reorderHomeGalleryImages(input: ReorderHomeGalleryImagesInput, updatedById: string): Promise<HomeGalleryRecord> {
  const paths = await getImagePaths();
  if (input.order.length !== paths.length || new Set(input.order).size !== paths.length || input.order.some((index) => index >= paths.length)) {
    throw new AppError(400, "Image order must include every current gallery image exactly once.", "INVALID_GALLERY_ORDER");
  }
  const reorderedPaths = input.order.map((index) => paths[index]);
  const { error } = await supabase.from("homepage_gallery")
    .update({ image_paths: reorderedPaths, updated_by: updatedById })
    .eq("id", 1);
  if (error) throw new Error(`Failed to reorder homepage gallery images: ${error.message}`);
  return mapImages(reorderedPaths);
}
