import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateDocumentInput, UpdateDocumentInput } from "../validation/documents.schema";

const ALLOWED_EXTENSIONS = new Map([
  ["jpg", { mime: ["image/jpeg"], kind: "image" }],
  ["jpeg", { mime: ["image/jpeg"], kind: "image" }],
  ["png", { mime: ["image/png"], kind: "image" }],
  ["webp", { mime: ["image/webp"], kind: "image" }],
  ["pdf", { mime: ["application/pdf"], kind: "document" }],
  ["doc", { mime: ["application/msword", "application/octet-stream"], kind: "document" }],
  ["docx", { mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/zip"], kind: "document" }],
  ["xls", { mime: ["application/vnd.ms-excel", "application/octet-stream"], kind: "spreadsheet" }],
  ["xlsx", { mime: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/zip"], kind: "spreadsheet" }],
  ["ppt", { mime: ["application/vnd.ms-powerpoint", "application/octet-stream"], kind: "presentation" }],
  ["pptx", { mime: ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/zip"], kind: "presentation" }],
]);

const ORG_CHART_ALLOWED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg", "webp"]);

export interface DocumentRecord {
  id: string;
  title: string;
  description: string | null;
  category: "report" | "org_chart" | "policy" | "other";
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
  fileExtension?: string | null;
}

export type UploadDocumentInput = {
  title: string;
  description?: string;
  category?: "report" | "org_chart" | "policy" | "other";
  status?: "draft" | "published";
  publishedAt?: string | null;
  file: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
};

function fileExtensionFromName(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : "";
}

function fileTypeLabelFromCategory(category: string): string {
  switch (category) {
    case "org_chart":
      return "Organizational Chart";
    case "report":
      return "Report";
    case "policy":
      return "Policy";
    default:
      return "Document";
  }
}

function looksExecutable(buffer: Buffer): boolean {
  if (buffer.length < 2) return false;

  const signatures = [
    [0x4d, 0x5a],
    [0x7f, 0x45, 0x4c, 0x46],
    [0xfe, 0xed],
    [0xfe, 0xff],
    [0xcf, 0xfa],
    [0x23, 0x21],
  ];

  return signatures.some((sig) => buffer.slice(0, sig.length).every((byte, index) => byte === sig[index]));
}

function detectMimeFromMagic(buffer: Buffer): string | null {
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf";
  }

  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return "image/png";
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (buffer.length >= 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return "image/webp";
  }

  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return "application/zip";
  }

  if (buffer.length >= 8 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0 && buffer[4] === 0xa1 && buffer[5] === 0xb1 && buffer[6] === 0x1a && buffer[7] === 0xe1) {
    return "application/octet-stream";
  }

  return null;
}

function resolveAcceptedMimeType(file: UploadDocumentInput["file"], extension: string): string {
  const normalizedExtension = extension.toLowerCase();
  const configuredMime = ALLOWED_EXTENSIONS.get(normalizedExtension)?.mime ?? [];
  const magicMime = detectMimeFromMagic(file.buffer);

  if (magicMime && configuredMime.includes(magicMime)) {
    return magicMime;
  }

  if (configuredMime.length > 0) {
    return configuredMime[0];
  }

  return file.mimetype || "application/octet-stream";
}

function validateDocumentFile(file: UploadDocumentInput["file"], category?: string) {
  const extension = fileExtensionFromName(file.originalname);
  if (!extension) {
    throw new AppError(400, "File extension is required.", "INVALID_FILE_EXTENSION");
  }

  const normalized = extension.toLowerCase();
  const allowedForCategory = category === "org_chart" ? ORG_CHART_ALLOWED_EXTENSIONS : new Set(ALLOWED_EXTENSIONS.keys());

  if (!allowedForCategory.has(normalized)) {
    throw new AppError(400, "Unsupported file type. Please upload one of the approved hospital document formats.", "UNSUPPORTED_FILE_TYPE");
  }

  const allowedMimeList = ALLOWED_EXTENSIONS.get(normalized)?.mime ?? [];
  const providedMime = file.mimetype?.toLowerCase();

  if (providedMime && allowedMimeList.length > 0 && !allowedMimeList.includes(providedMime)) {
    throw new AppError(400, "File MIME type does not match the approved document type.", "INVALID_MIME_TYPE");
  }

  const magicMime = detectMimeFromMagic(file.buffer);
  if (!magicMime) {
    throw new AppError(400, "File signature could not be verified.", "INVALID_FILE_SIGNATURE");
  }

  if (magicMime && allowedMimeList.length > 0 && !allowedMimeList.includes(magicMime)) {
    throw new AppError(400, "File signature does not match the expected file format.", "INVALID_FILE_SIGNATURE");
  }

  if (looksExecutable(file.buffer)) {
    throw new AppError(400, "Executable files are not allowed.", "EXECUTABLE_UPLOAD_REJECTED");
  }

  const allowedSize = (normalized === "jpg" || normalized === "jpeg" || normalized === "png" || normalized === "webp")
    ? env.maxUploadImageBytes
    : env.maxUploadDocBytes;

  if (file.size > allowedSize) {
    throw new AppError(400, `File exceeds the ${allowedSize / (1024 * 1024)}MB size limit.`, "FILE_TOO_LARGE");
  }

  const safeMime = resolveAcceptedMimeType(file, normalized);
  if (safeMime.startsWith("application/") && safeMime.includes("script")) {
    throw new AppError(400, "Script-type uploads are not allowed.", "SCRIPT_UPLOAD_REJECTED");
  }

  return {
    extension: normalized,
    mimeType: safeMime,
  };
}

function mapDocumentRow(row: any): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    category: row.category,
    filePath: row.file_path,
    fileSize: row.file_size ?? null,
    mimeType: row.mime_type ?? null,
    status: row.status,
    publishedAt: row.published_at ?? null,
    uploadedBy: row.uploaded_by ?? null,
    createdAt: row.created_at,
    fileExtension: row.file_path ? row.file_path.split(".").pop()?.toLowerCase() ?? null : null,
    viewUrl: row.view_url ?? null,
    downloadUrl: row.download_url ?? null,
  };
}

async function resolveStorageLink(filePath: string): Promise<{ viewUrl: string | null; downloadUrl: string | null }> {
  const bucketName = env.storageBucketName;

  try {
    const { data: signed, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60 * 24);

    if (!signedError && signed?.signedUrl) {
      return {
        viewUrl: signed.signedUrl,
        downloadUrl: signed.signedUrl,
      };
    }
  } catch {
    return { viewUrl: null, downloadUrl: null };
  }

  return { viewUrl: null, downloadUrl: null };
}

export async function listPublishedDocuments(category?: string): Promise<DocumentRecord[]> {
  let query = supabase
    .from("documents")
    .select("id, title, description, category, file_path, file_size, mime_type, status, published_at, uploaded_by, created_at")
    .eq("status", "published");

  if (category) {
    query = query.eq("category", category);
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  const records = (data ?? []).map(mapDocumentRow);

  for (const record of records) {
    const urls = await resolveStorageLink(record.filePath);
    record.viewUrl = urls.viewUrl;
    record.downloadUrl = urls.downloadUrl;
  }

  return records;
}

export async function listAllDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, description, category, file_path, file_size, mime_type, status, published_at, uploaded_by, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load admin documents: ${error.message}`);
  }

  const records = (data ?? []).map(mapDocumentRow);

  for (const record of records) {
    const urls = await resolveStorageLink(record.filePath);
    record.viewUrl = urls.viewUrl;
    record.downloadUrl = urls.downloadUrl;
  }

  return records;
}

export async function createDocument(input: CreateDocumentInput, uploadedById: string): Promise<DocumentRecord> {
  const payload = {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    category: input.category,
    file_path: input.filePath.trim(),
    file_size: input.fileSize ?? null,
    mime_type: input.mimeType?.trim() || null,
    status: input.status ?? "draft",
    published_at: input.publishedAt && input.publishedAt.trim() !== "" ? input.publishedAt : null,
    uploaded_by: uploadedById,
  };

  const { data, error } = await supabase
    .from("documents")
    .insert(payload)
    .select("id, title, description, category, file_path, file_size, mime_type, status, published_at, uploaded_by, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to create document: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not create document", "DOCUMENT_CREATE_FAILED");
  }

  const record = mapDocumentRow(data);
  const urls = await resolveStorageLink(record.filePath);
  record.viewUrl = urls.viewUrl;
  record.downloadUrl = urls.downloadUrl;
  return record;
}

export async function updateDocument(id: string, input: UpdateDocumentInput): Promise<DocumentRecord> {
  const payload: Record<string, any> = {};

  if (input.title) payload.title = input.title.trim();
  if (typeof input.description !== "undefined") payload.description = input.description?.trim() || null;
  if (input.category) payload.category = input.category;
  if (input.status) payload.status = input.status;
  if (typeof input.publishedAt !== "undefined") {
    payload.published_at = input.publishedAt && input.publishedAt.trim() !== "" ? input.publishedAt : null;
  }

  const { data, error } = await supabase
    .from("documents")
    .update(payload)
    .eq("id", id)
    .select("id, title, description, category, file_path, file_size, mime_type, status, published_at, uploaded_by, created_at")
    .single();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  if (!data) {
    throw new AppError(404, "Document not found", "DOCUMENT_NOT_FOUND");
  }

  const record = mapDocumentRow(data);
  const urls = await resolveStorageLink(record.filePath);
  record.viewUrl = urls.viewUrl;
  record.downloadUrl = urls.downloadUrl;
  return record;
}

export async function deleteDocument(id: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from("documents")
    .select("id, file_path")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    throw new AppError(404, "Document not found", "DOCUMENT_NOT_FOUND");
  }

  const { error: storageError } = await supabase.storage.from(env.storageBucketName).remove([existing.file_path]);
  if (storageError) {
    throw new Error(`Failed to delete document from storage: ${storageError.message}`);
  }

  const { error: dbError } = await supabase.from("documents").delete().eq("id", id);
  if (dbError) {
    throw new Error(`Failed to delete document metadata: ${dbError.message}`);
  }
}

export function validateDocumentUpload(file: UploadDocumentInput["file"], category?: string) {
  return validateDocumentFile(file, category ?? "report");
}

export async function uploadDocument(input: UploadDocumentInput, uploadedById: string): Promise<DocumentRecord> {
  const validation = validateDocumentFile(input.file, input.category ?? "report");
  const safeCategory = input.category ?? "report";
  const safeTitle = (input.title ?? "").trim();

  if (!safeTitle) {
    throw new AppError(400, "Document title is required.", "TITLE_REQUIRED");
  }

  const safeDescription = input.description?.trim() || null;
  const extension = validation.extension;
  const fileNameBase = safeTitle.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase().replace(/-+/g, "-").slice(0, 60) || "document";
  const storagePath = `${safeCategory}/${crypto.randomUUID()}/${fileNameBase}.${extension}`;

  const { error: uploadError } = await supabase.storage.from(env.storageBucketName).upload(storagePath, input.file.buffer, {
    contentType: validation.mimeType,
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Failed to upload document to storage: ${uploadError.message}`);
  }

  const payload = {
    title: safeTitle,
    description: safeDescription,
    category: safeCategory,
    file_path: storagePath,
    file_size: input.file.size,
    mime_type: validation.mimeType,
    status: input.status ?? "draft",
    published_at: input.publishedAt && input.publishedAt.trim() !== "" ? input.publishedAt : null,
    uploaded_by: uploadedById,
  };

  const { data, error } = await supabase
    .from("documents")
    .insert(payload)
    .select("id, title, description, category, file_path, file_size, mime_type, status, published_at, uploaded_by, created_at")
    .single();

  if (error) {
    await supabase.storage.from(env.storageBucketName).remove([storagePath]).catch(() => undefined);
    throw new Error(`Failed to save document metadata: ${error.message}`);
  }

  const record = mapDocumentRow(data);
  const urls = await resolveStorageLink(record.filePath);
  record.viewUrl = urls.viewUrl;
  record.downloadUrl = urls.downloadUrl;
  return record;
}

export function getDocumentCategoryLabel(category?: string): string {
  return fileTypeLabelFromCategory(category ?? "report");
}
