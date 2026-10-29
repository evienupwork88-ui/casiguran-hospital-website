import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import { sanitizeSvgUpload } from "../utils/sanitize-svg";
import type { UpdateFamilyCommunityMedicineInput } from "../validation/family-community-medicine.schema";

type UploadedFamilyCommunityMedicineImage = { buffer: Buffer; originalname: string; mimetype: string; size: number };
type FamilyCommunityMedicineHighlight = { title: string; description: string };
type FamilyCommunityMedicineSchedule = { clinic: string; days: string; hours: string; notes: string };

export type FamilyCommunityMedicineContentRecord = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: FamilyCommunityMedicineHighlight[];
  clinicSchedule: FamilyCommunityMedicineSchedule[];
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

const familyCommunityMedicineColumns = "title, cover_image_paths, organizational_chart_image_path, general_information, highlights, clinic_schedule, organizational_structure_description, updated_at, updated_by";

async function mapFamilyCommunityMedicineRow(row: any): Promise<FamilyCommunityMedicineContentRecord> {
  const coverImages = await Promise.all(
    (row.cover_image_paths ?? []).map(async (path: string) => {
      const { data, error } = await supabase.storage.from(env.storageBucketName).createSignedUrl(path, 60 * 60 * 24);
      if (error) throw new Error(`Failed to create Family and Community Medicine cover image link: ${error.message}`);
      return { url: data.signedUrl };
    }),
  );
  let organizationalChartImageUrl: string | null = null;
  if (row.organizational_chart_image_path) {
    const { data, error } = await supabase.storage.from(env.storageBucketName).createSignedUrl(row.organizational_chart_image_path, 60 * 60 * 24);
    if (error) throw new Error(`Failed to create Family and Community Medicine organizational chart image link: ${error.message}`);
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

async function getFamilyCommunityMedicineRow() {
  const { data, error } = await supabase.from("family_community_medicine_content").select(familyCommunityMedicineColumns).eq("id", 1).single();
  if (error) throw new Error(`Failed to load Family and Community Medicine content: ${error.message}`);
  return data;
}

export async function getFamilyCommunityMedicineContent(): Promise<FamilyCommunityMedicineContentRecord> {
  return mapFamilyCommunityMedicineRow(await getFamilyCommunityMedicineRow());
}

export async function updateFamilyCommunityMedicineContent(input: UpdateFamilyCommunityMedicineInput, updatedById: string): Promise<FamilyCommunityMedicineContentRecord> {
  const { data, error } = await supabase
    .from("family_community_medicine_content")
    .update({
      title: input.title,
      general_information: input.generalInformation,
      highlights: input.highlights,
      clinic_schedule: input.clinicSchedule,
      organizational_structure_description: input.organizationalStructureDescription,
      updated_by: updatedById,
    })
    .eq("id", 1)
    .select(familyCommunityMedicineColumns)
    .single();
  if (error) throw new Error(`Failed to save Family and Community Medicine content: ${error.message}`);
  return mapFamilyCommunityMedicineRow(data);
}

function validateFamilyCommunityMedicineImage(file: UploadedFamilyCommunityMedicineImage): { extension: string; mime: string; buffer?: Buffer } {
  if (file.size > env.maxUploadImageBytes) {
    throw new AppError(400, "Each Family and Community Medicine image must be within the configured image size limit.", "FILE_TOO_LARGE");
  }
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const expected = imageFormats[extension as keyof typeof imageFormats];
  if (!expected || file.mimetype.toLowerCase() !== expected.mime || !expected.signature(file.buffer)) {
    throw new AppError(400, "Upload valid JPG, PNG, or WebP images.", "INVALID_COVER_IMAGE");
  }
  return { extension, mime: expected.mime };
}

export async function addFamilyCommunityMedicineCoverImages(files: UploadedFamilyCommunityMedicineImage[], updatedById: string): Promise<FamilyCommunityMedicineContentRecord> {
  if (files.length === 0) throw new AppError(400, "Choose at least one image to upload.", "COVER_IMAGE_REQUIRED");
  const validated = files.map(validateFamilyCommunityMedicineImage);
  const existing = await getFamilyCommunityMedicineRow();
  const existingPaths: string[] = existing.cover_image_paths ?? [];
  if (existingPaths.length + files.length > 10) {
    throw new AppError(400, "The Family and Community Medicine gallery can contain up to 10 images.", "TOO_MANY_COVER_IMAGES");
  }

  const uploadedPaths: string[] = [];
  for (const [index, file] of files.entries()) {
    const storagePath = `family_community_medicine/${crypto.randomUUID()}.${validated[index].extension}`;
    const { error } = await supabase.storage.from(env.storageBucketName).upload(storagePath, file.buffer, {
      contentType: validated[index].mime,
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      if (uploadedPaths.length) {
        const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
        if (cleanupError) throw new Error(`Failed to upload Family and Community Medicine images and clean up earlier uploads: ${error.message}; ${cleanupError.message}`);
      }
      throw new Error(`Failed to upload Family and Community Medicine image: ${error.message}`);
    }
    uploadedPaths.push(storagePath);
  }

  const { data, error } = await supabase
    .from("family_community_medicine_content")
    .update({ cover_image_paths: [...existingPaths, ...uploadedPaths], updated_by: updatedById })
    .eq("id", 1)
    .select(familyCommunityMedicineColumns)
    .single();
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove(uploadedPaths);
    if (cleanupError) throw new Error(`Failed to save Family and Community Medicine images and clean up uploaded images: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Family and Community Medicine images: ${error.message}`);
  }
  return mapFamilyCommunityMedicineRow(data);
}

export async function removeFamilyCommunityMedicineCoverImage(index: number, updatedById: string): Promise<FamilyCommunityMedicineContentRecord> {
  if (!Number.isInteger(index) || index < 0) throw new AppError(400, "Invalid Family and Community Medicine image index.", "INVALID_IMAGE_INDEX");
  const existing = await getFamilyCommunityMedicineRow();
  const paths: string[] = existing.cover_image_paths ?? [];
  if (index >= paths.length) throw new AppError(404, "Family and Community Medicine image not found.", "IMAGE_NOT_FOUND");

  const [removedPath] = paths.splice(index, 1);
  const { data, error } = await supabase
    .from("family_community_medicine_content")
    .update({ cover_image_paths: paths, updated_by: updatedById })
    .eq("id", 1)
    .select(familyCommunityMedicineColumns)
    .single();
  if (error) throw new Error(`Failed to remove Family and Community Medicine image: ${error.message}`);

  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([removedPath]);
  if (storageError) throw new Error(`Family and Community Medicine image removed from the page, but its stored file could not be deleted: ${storageError.message}`);
  return mapFamilyCommunityMedicineRow(data);
}

export async function replaceFamilyCommunityMedicineOrganizationalChart(
  file: UploadedFamilyCommunityMedicineImage,
  updatedById: string,
): Promise<FamilyCommunityMedicineContentRecord> {
  const extension = file.originalname.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
  const validated = extension === "svg"
    ? sanitizeSvgUpload(file, env.maxOrgChartImageBytes, "Family and Community Medicine organizational chart")
    : validateFamilyCommunityMedicineImage(file);
  const existing = await getFamilyCommunityMedicineRow();
  const storagePath = `family_community_medicine/organizational-chart-${crypto.randomUUID()}.${validated.extension}`;
  const { error: uploadError } = await supabase.storage.from(env.storageBucketName).upload(storagePath, validated.buffer ?? file.buffer, {
    contentType: validated.mime,
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) throw new Error(`Failed to upload Family and Community Medicine organizational chart: ${uploadError.message}`);

  const { data, error } = await supabase
    .from("family_community_medicine_content")
    .update({ organizational_chart_image_path: storagePath, updated_by: updatedById })
    .eq("id", 1)
    .select(familyCommunityMedicineColumns)
    .single();
  if (error) {
    const { error: cleanupError } = await supabase.storage.from(env.storageBucketName).remove([storagePath]);
    if (cleanupError) throw new Error(`Failed to save Family and Community Medicine organizational chart and clean up uploaded image: ${error.message}; ${cleanupError.message}`);
    throw new Error(`Failed to save Family and Community Medicine organizational chart: ${error.message}`);
  }

  if (existing.organizational_chart_image_path) {
    const { error: removeError } = await supabase.storage.from(env.storageBucketName).remove([existing.organizational_chart_image_path]);
    if (removeError) throw new Error(`Family and Community Medicine chart saved, but the previous chart image could not be removed: ${removeError.message}`);
  }

  return mapFamilyCommunityMedicineRow(data);
}
