import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

const BUCKET_NAME = "cdh-public-media";
const IMAGE_TYPES = {
  jpg: {
    mimeType: "image/jpeg",
    matches: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  png: {
    mimeType: "image/png",
    matches: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  webp: {
    mimeType: "image/webp",
    matches: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
  },
} as const;

export type UploadedImage = Pick<Express.Multer.File, "buffer" | "originalname" | "mimetype" | "size">;

function validateImage(file: UploadedImage) {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Image exceeds the configured upload size limit.", "FILE_TOO_LARGE");
  }

  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const normalizedExtension = extension === "jpeg" ? "jpg" : extension;
  const imageType = IMAGE_TYPES[normalizedExtension as keyof typeof IMAGE_TYPES];
  if (!imageType || file.mimetype.toLowerCase() !== imageType.mimeType || !imageType.matches(file.buffer)) {
    throw new AppError(400, "Upload a valid JPG, PNG, or WebP image.", "INVALID_COVER_IMAGE");
  }

  return { extension: normalizedExtension, mimeType: imageType.mimeType };
}

export async function uploadPublicContentImage(file: UploadedImage): Promise<string> {
  const { extension, mimeType } = validateImage(file);
  const imagePath = `news-updates/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(imagePath, file.buffer, {
    contentType: mimeType,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(`Failed to upload cover image: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(imagePath);
  return data.publicUrl;
}

function getManagedImagePath(imageUrl: string): string | null {
  let url: URL;
  let supabaseUrl: URL;
  try {
    url = new URL(imageUrl);
    supabaseUrl = new URL(env.supabaseUrl);
  } catch {
    return null;
  }

  const prefix = `/storage/v1/object/public/${BUCKET_NAME}/news-updates/`;
  if (url.origin !== supabaseUrl.origin || !url.pathname.startsWith(prefix)) return null;
  const path = url.pathname.slice(`/storage/v1/object/public/${BUCKET_NAME}/`.length);
  if (!/^news-updates\/[0-9a-f-]+\.(jpg|png|webp)$/i.test(path)) return null;
  return path;
}

export async function removePublicContentImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  const imagePath = getManagedImagePath(imageUrl);
  if (!imagePath) return;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([imagePath]);
  if (error) throw new Error(`Failed to remove replaced cover image: ${error.message}`);
}
