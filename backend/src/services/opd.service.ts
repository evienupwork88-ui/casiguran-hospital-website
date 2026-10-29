import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { sanitizeSvgUpload } from "../utils/sanitize-svg";
import type { UpdateOpdInput } from "../validation/opd.schema";

export type OpdHighlight = {
  title: string;
  description: string;
};

export type OpdClinicSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type OpdContentRecord = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: OpdHighlight[];
  clinicSchedule: OpdClinicSchedule[];
  organizationalStructureDescription: string;
  updatedAt: string;
  updatedBy: string | null;
};

async function mapOpdRow(row: any): Promise<OpdContentRecord> {
  const coverImages = await Promise.all(
    (row.cover_image_paths ?? []).map(async (path: string) => {
      const { data, error } = await supabase.storage
        .from(env.storageBucketName)
        .createSignedUrl(path, 60 * 60 * 24);
      if (error) throw new Error(`Failed to create OPD cover image link: ${error.message}`);
      return { url: data.signedUrl };
    }),
  );
  let organizationalChartImageUrl: string | null = null;
  if (row.organizational_chart_image_path) {
    const { data, error } = await supabase.storage
      .from(env.storageBucketName)
      .createSignedUrl(row.organizational_chart_image_path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create OPD organizational chart image link: ${error.message}`);
    organizationalChartImageUrl = data.signedUrl;
  }

  return {
    title: row.title,
    coverImages,
    organizationalChartImageUrl,
    generalInformation: row.general_information,
    highlights: row.highlights ?? [],
    clinicSchedule: row.clinic_schedule ?? [],
    organizationalStructureDescription: row.organizational_structure_description,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

async function getOpdRow() {
  const { data, error } = await supabase
    .from("opd_content")
    .select("title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Failed to load OPD content: ${error.message}`);
  return data;
}

export async function getOpdContent(): Promise<OpdContentRecord> {
  return mapOpdRow(await getOpdRow());
}

export async function updateOpdContent(input: UpdateOpdInput, updatedById: string): Promise<OpdContentRecord> {
  const { data, error } = await supabase
    .from("opd_content")
    .update({
      title: input.title,
      general_information: input.generalInformation,
      highlights: input.highlights,
      clinic_schedule: input.clinicSchedule,
      organizational_structure_description: input.organizationalStructureDescription,
      updated_by: updatedById,
    })
    .eq("id", 1)
    .select("title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by")
    .single();

  if (error) throw new Error(`Failed to save OPD content: ${error.message}`);
  return mapOpdRow(data);
}

type UploadedOpdImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };

const imageFormats = {
  jpg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  jpeg: { mime: "image/jpeg", signature: (buffer: Buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff },
  png: { mime: "image/png", signature: (buffer: Buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  webp: { mime: "image/webp", signature: (buffer: Buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP" },
} as const;

function validateOpdImage(file: UploadedOpdImage): { extension: string; mime: string; buffer?: Buffer } {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Each OPD image must be within the configured image size limit.", "FILE_TOO_LARGE");
  }

  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = imageFormats[extension as keyof typeof imageFormats];
  if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
    throw new AppError(400, "Upload valid JPG, PNG, or WebP images.", "INVALID_COVER_IMAGE");
  }
  return { extension, mime: expected.mime };
}

export async function addOpdCoverImages(
  files: UploadedOpdImage[],
  updatedById: string,
): Promise<OpdContentRecord> {
  if (files.length === 0) throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  const validated = files.map((file) => validateOpdImage(file));

  const existing = await getOpdRow();
  const existingPaths: string[] = existing.cover_image_paths ?? [];
  if (existingPaths.length + files.length > 10) {
    throw new AppError(400, "The OPD gallery can contain up to 10 images.", "TOO_MANY_COVER_IMAGES");
  }

  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const storagePath = `opd/${crypto.randomUUID()}.${validated[index].extension}`;
    const { error } = await supabase.storage.from(env.storageBucketName).upload(storagePath, file.buffer, {
      contentType: validated[index].mime,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload OPD images and clean up earlier uploads: ${error.message}; ${cleanupError.message}`);
      }
      throw new Error(`Failed to upload OPD image: ${error.message}`);
    }
    uploadedPaths.push(storagePath);
  }

  const { data, error: updateError } = await supabase
    .from("opd_content")
    .update({ cover_image_paths: [...existingPaths, ...uploadedPaths], updated_by: updatedById })
    .eq("id", 1)
    .select("title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by")
    .single();
  if (updateError) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save OPD images and clean up uploaded images: ${updateError.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save OPD images: ${updateError.message}`);
  }

  return mapOpdRow(data);
}

export async function removeOpdCoverImage(index: number, updatedById: string): Promise<OpdContentRecord> {
  if (!Number.isInteger(index) || index < 0) throw new AppError(400, "Invalid OPD image index.", "INVALID_IMAGE_INDEX");
  const existing = await getOpdRow();
  const paths: string[] = existing.cover_image_paths ?? [];
  if (index >= paths.length) throw new AppError(404, "OPD image not found.", "IMAGE_NOT_FOUND");

  const [removedPath] = paths.splice(index, 1);
  const { data, error } = await supabase
    .from("opd_content")
    .update({ cover_image_paths: paths, updated_by: updatedById })
    .eq("id", 1)
    .select("title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by")
    .single();
  if (error) throw new Error(`Failed to remove OPD image: ${error.message}`);

  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`OPD image removed from the page, but its stored file could not be deleted: ${storageError.message}`);
  return mapOpdRow(data);
}

export async function replaceOpdOrganizationalChart(
  file: UploadedOpdImage,
  updatedById: string,
): Promise<OpdContentRecord> {
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const validated = extension === "svg"
    ? sanitizeSvgUpload(file, env.maxOrgChartImageBytes, "OPD organizational chart")
    : validateOpdImage(file);
  const existing = await getOpdRow();
  const storagePath = `opd/organizational-chart-${crypto.randomUUID()}.${validated.extension}`;
  const { error: uploadError } = await supabase.storage.from(env.storageBucketName).upload(storagePath, validated.buffer ?? file.buffer, {
    contentType: validated.mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error(`Failed to upload OPD organizational chart: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("opd_content")
    .update({ organizational_chart_image_path: storagePath, updated_by: updatedById })
    .eq("id", 1)
    .select("title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by")
    .single();
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove([storagePath]);
    if (cleanupError) throw new Error(`Failed to save OPD organizational chart and clean up uploaded image: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save OPD organizational chart: ${error.message}`);
  }

  if (existing.organizational_chart_image_path) {
    const { error: removeError } = await supabase.storage.from(env.storageBucketName).remove([existing.organizational_chart_image_path]);
    if (removeError) throw new Error(`OPD chart saved, but the previous chart image could not be removed: ${removeError.message}`);
  }

  return mapOpdRow(data);
}
