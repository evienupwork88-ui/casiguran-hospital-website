import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { TrainingInput, UpdateTrainingInput } from "../validation/trainings.schema";

const IMAGE_TYPES = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

type TrainingImage = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

type TrainingRow = {
  id: string;
  title: string;
  description: string;
  external_url: string | null;
  image_path: string | null;
  status: "draft" | "published";
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export interface TrainingRecord {
  id: string;
  title: string;
  description: string;
  externalUrl: string | null;
  imageUrl: string | null;
  status: "draft" | "published";
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
}

function validateImage(file: TrainingImage) {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Training images exceed the configured image size limit.", "FILE_TOO_LARGE");
  }

  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = IMAGE_TYPES[extension as keyof typeof IMAGE_TYPES];
  if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
    throw new AppError(400, "Upload a valid JPG, PNG, or WebP image.", "INVALID_TRAINING_IMAGE");
  }

  return { extension, mimeType: expected.mime };
}

async function mapTrainingRow(row: TrainingRow): Promise<TrainingRecord> {
  let imageUrl: string | null = null;
  if (row.image_path) {
    const { data, error } = await supabase.storage
      .from(env.storageBucketName)
      .createSignedUrl(row.image_path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create training image link: ${error.message}`);
    imageUrl = data.signedUrl;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    externalUrl: row.external_url,
    imageUrl,
    status: row.status,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const TRAINING_COLUMNS = "id, title, description, external_url, image_path, status, author_id, created_at, updated_at";

async function uploadImage(file: TrainingImage): Promise<string> {
  const { extension, mimeType } = validateImage(file);
  const imagePath = `trainings/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(env.storageBucketName).upload(imagePath, file.buffer, {
    contentType: mimeType,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Failed to upload training image: ${error.message}`);
  return imagePath;
}

async function removeImage(imagePath: string, context: string): Promise<void> {
  const { error } = await supabase.storage.from(env.storageBucketName).remove([imagePath]);
  if (error) throw new Error(`${context}: ${error.message}`);
}

export async function listPublicTrainings(): Promise<TrainingRecord[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select(TRAINING_COLUMNS)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load published trainings: ${error.message}`);
  return Promise.all(((data ?? []) as TrainingRow[]).map(mapTrainingRow));
}

export async function listAdminTrainings(): Promise<TrainingRecord[]> {
  const { data, error } = await supabase
    .from("trainings")
    .select(TRAINING_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load trainings: ${error.message}`);
  return Promise.all(((data ?? []) as TrainingRow[]).map(mapTrainingRow));
}

export async function createTraining(input: TrainingInput, authorId: string, file?: TrainingImage): Promise<TrainingRecord> {
  if (!input.externalUrl && !file) {
    throw new AppError(400, "Add an external link or upload an image.", "TRAINING_CONTENT_REQUIRED");
  }

  const imagePath = file ? await uploadImage(file) : null;
  const { data, error } = await supabase
    .from("trainings")
    .insert({
      title: input.title,
      description: input.description,
      external_url: input.externalUrl || null,
      image_path: imagePath,
      status: input.status ?? "draft",
      author_id: authorId,
    })
    .select(TRAINING_COLUMNS)
    .single();

  if (error) {
    if (imagePath) {
      const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove([imagePath]);
      if (cleanupError) throw new Error(`Failed to create training and clean up its uploaded image: ${error.message}; ${cleanupError.message}`);
    }
    throw new Error(`Failed to create training: ${error.message}`);
  }
  if (!data) throw new AppError(500, "Could not create training.", "TRAINING_CREATE_FAILED");
  return mapTrainingRow(data as TrainingRow);
}

export async function updateTraining(id: string, input: UpdateTrainingInput, file?: TrainingImage): Promise<TrainingRecord> {
  const { data: existing, error: loadError } = await supabase
    .from("trainings")
    .select(TRAINING_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load training: ${loadError.message}`);
  if (!existing) throw new AppError(404, "Training not found.", "TRAINING_NOT_FOUND");

  const current = existing as TrainingRow;
  const nextExternalUrl = input.externalUrl === undefined ? current.external_url : input.externalUrl || null;
  const nextImagePath = file ? await uploadImage(file) : input.removeImage === "true" ? null : current.image_path;
  if (!nextExternalUrl && !nextImagePath) {
    throw new AppError(400, "Add an external link or upload an image.", "TRAINING_CONTENT_REQUIRED");
  }

  const payload: Record<string, string | null> = {};
  if (input.title !== undefined) payload.title = input.title;
  if (input.description !== undefined) payload.description = input.description;
  if (input.externalUrl !== undefined) payload.external_url = nextExternalUrl;
  if (file || input.removeImage === "true") payload.image_path = nextImagePath;
  if (input.status !== undefined) payload.status = input.status;

  const { data, error } = await supabase
    .from("trainings")
    .update(payload)
    .eq("id", id)
    .select(TRAINING_COLUMNS)
    .single();

  if (error) {
    if (file && nextImagePath) {
      const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove([nextImagePath]);
      if (cleanupError) throw new Error(`Failed to update training and clean up its uploaded image: ${error.message}; ${cleanupError.message}`);
    }
    throw new Error(`Failed to update training: ${error.message}`);
  }
  if (!data) throw new AppError(404, "Training not found.", "TRAINING_NOT_FOUND");

  if (current.image_path && current.image_path !== nextImagePath) {
    await removeImage(current.image_path, "Training saved, but the previous image could not be removed");
  }
  return mapTrainingRow(data as TrainingRow);
}

export async function deleteTraining(id: string): Promise<void> {
  const { data: existing, error: loadError } = await supabase
    .from("trainings")
    .select("id, image_path")
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw new Error(`Failed to load training: ${loadError.message}`);
  if (!existing) throw new AppError(404, "Training not found.", "TRAINING_NOT_FOUND");

  const { error } = await supabase.from("trainings").delete().eq("id", id);
  if (error) throw new Error(`Failed to delete training: ${error.message}`);

  if (existing.image_path) {
    await removeImage(existing.image_path, "Training deleted, but its image could not be removed");
  }
}
