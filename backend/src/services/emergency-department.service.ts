import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { sanitizeSvgUpload } from "../utils/sanitize-svg";
import type { UpdateEmergencyDepartmentInput } from "../validation/emergency-department.schema";

type UploadedImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };

export type EmergencyDepartmentContentRecord = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: { title: string; description: string }[];
  clinicSchedule: { clinic: string; days: string; hours: string; notes: string }[];
  organizationalStructureDescription: string;
  updatedAt: string;
  updatedBy: string | null;
};

const imageFormats = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

const columns = "title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by";

async function mapRow(row: any): Promise<EmergencyDepartmentContentRecord> {
  const coverImages = await Promise.all(
    (row.cover_image_paths ?? []).map(async (path: string) => {
      const { data, error } = await supabase.storage.from(env.storageBucketName).createSignedUrl(path, 60 * 60 * 24);
      if (error) throw new Error(`Failed to create Emergency Department photo link: ${error.message}`);
      return { url: data.signedUrl };
    }),
  );
  let organizationalChartImageUrl: string | null = null;
  if (row.organizational_chart_image_path) {
    const { data, error } = await supabase.storage.from(env.storageBucketName).createSignedUrl(row.organizational_chart_image_path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create Emergency Department chart link: ${error.message}`);
    organizationalChartImageUrl = data.signedUrl;
  }
  return {
    title: row.title,
    coverImages,
    organizationalChartImageUrl,
    generalInformation: row.general_information,
    highlights: row.highlights ?? [],
    clinicSchedule: row.clinic_schedule ?? [],
    organizationalStructureDescription: row.organizational_structure_description ?? "",
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

async function getRow() {
  const { data, error } = await supabase.from("emergency_department_content").select(columns).eq("id", 1).single();
  if (error) throw new Error(`Failed to load Emergency Department content: ${error.message}`);
  return data;
}

export async function getEmergencyDepartmentContent(): Promise<EmergencyDepartmentContentRecord> {
  return mapRow(await getRow());
}

export async function updateEmergencyDepartmentContent(input: UpdateEmergencyDepartmentInput, updatedById: string): Promise<EmergencyDepartmentContentRecord> {
  const { data, error } = await supabase
    .from("emergency_department_content")
    .update({
      title: input.title,
      general_information: input.generalInformation,
      highlights: input.highlights,
      clinic_schedule: input.clinicSchedule,
      organizational_structure_description: input.organizationalStructureDescription,
      updated_by: updatedById,
    })
    .eq("id", 1)
    .select(columns)
    .single();
  if (error) throw new Error(`Failed to save Emergency Department content: ${error.message}`);
  return mapRow(data);
}

function validateImage(file: UploadedImage): { extension: string; mime: string; buffer?: Buffer } {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Each Emergency Department image must be within the configured image size limit.", "FILE_TOO_LARGE");
  }
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = imageFormats[extension as keyof typeof imageFormats];
  if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
    throw new AppError(400, "Upload valid JPG, PNG, or WebP images.", "INVALID_COVER_IMAGE");
  }
  return { extension, mime: expected.mime };
}

async function uploadImage(file: UploadedImage, pathPrefix: string) {
  const { extension, mime } = validateImage(file);
  const path = `${pathPrefix}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(env.storageBucketName).upload(path, file.buffer, {
    contentType: mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`Failed to upload Emergency Department image: ${error.message}`);
  return path;
}

export async function addEmergencyDepartmentImages(files: UploadedImage[], updatedById: string): Promise<EmergencyDepartmentContentRecord> {
  if (files.length === 0) throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  const existing = await getRow();
  const existingPaths: string[] = existing.cover_image_paths ?? [];
  if (existingPaths.length + files.length > 10) throw new AppError(400, "The Emergency Department gallery can contain up to 10 images.", "TOO_MANY_COVER_IMAGES");

  const uploadedPaths: string[] = [];
  for (const file of files) {
    try {
      uploadedPaths.push(await uploadImage(file, "emergency-department"));
    } catch (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload Emergency Department photos and clean up earlier uploads: ${error instanceof Error ? error.message : "Upload failed"}; ${cleanupError.message}`);
      }
      throw error;
    }
  }

  const { data, error } = await supabase.from("emergency_department_content")
    .update({ cover_image_paths: [...existingPaths, ...uploadedPaths], updated_by: updatedById })
    .eq("id", 1).select(columns).single();
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save Emergency Department photos and clean up uploads: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Emergency Department photos: ${error.message}`);
  }
  return mapRow(data);
}

export async function removeEmergencyDepartmentImage(index: number, updatedById: string): Promise<EmergencyDepartmentContentRecord> {
  if (!Number.isInteger(index) || index < 0) throw new AppError(400, "Invalid Emergency Department image index.", "INVALID_IMAGE_INDEX");
  const existing = await getRow();
  const paths: string[] = existing.cover_image_paths ?? [];
  if (index >= paths.length) throw new AppError(404, "Emergency Department image not found.", "IMAGE_NOT_FOUND");
  const [removedPath] = paths.splice(index, 1);
  const { data, error } = await supabase.from("emergency_department_content")
    .update({ cover_image_paths: paths, updated_by: updatedById })
    .eq("id", 1).select(columns).single();
  if (error) throw new Error(`Failed to remove Emergency Department photo: ${error.message}`);
  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`Emergency Department photo removed from the page, but its stored file could not be deleted: ${storageError.message}`);
  return mapRow(data);
}

export async function replaceEmergencyDepartmentChart(file: UploadedImage, updatedById: string): Promise<EmergencyDepartmentContentRecord> {
  const existing = await getRow();
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const validated = extension === "svg"
    ? sanitizeSvgUpload(file, env.maxOrgChartImageBytes, "Emergency Department organizational chart")
    : validateImage(file);
  const path = `emergency-department/organizational-chart/${crypto.randomUUID()}.${validated.extension}`;
  const { error: uploadError } = await supabase.storage.from(env.storageBucketName).upload(path, validated.buffer ?? file.buffer, {
    contentType: validated.mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error(`Failed to upload Emergency Department chart: ${uploadError.message}`);
  const { data, error } = await supabase.from("emergency_department_content")
    .update({ organizational_chart_image_path: path, updated_by: updatedById })
    .eq("id", 1).select(columns).single();
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove([path]);
    if (cleanupError) throw new Error(`Failed to save Emergency Department chart and clean up upload: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Emergency Department chart: ${error.message}`);
  }
  if (existing.organizational_chart_image_path) {
    const { error: removeError } = await supabase.storage.from(env.storageBucketName).remove([existing.organizational_chart_image_path]);
    if (removeError) throw new Error(`Emergency Department chart saved, but the previous chart image could not be removed: ${removeError.message}`);
  }
  return mapRow(data);
}
