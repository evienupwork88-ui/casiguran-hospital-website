import crypto from "node:crypto";
import type { Request, Response } from "express";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

type StagedFile = {
  fieldName: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  storagePath: string;
};

type ChangeRequestRow = {
  id: string;
  requester_id: string;
  requester_name: string;
  resource: string;
  action: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  request_path: string;
  content_type: string | null;
  request_body: Record<string, unknown>;
  files: StagedFile[];
  status: "pending" | "approved" | "rejected" | "applying" | "applied";
  reviewer_id: string | null;
  rejection_reason: string | null;
  application_error: string | null;
  created_at: string;
  decided_at: string | null;
  applied_at: string | null;
};

export type AdminChangeRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  resource: string;
  action: string;
  method: ChangeRequestRow["method"];
  requestPath: string;
  contentType: string | null;
  requestBody: Record<string, unknown>;
  files: { fieldName: string; originalName: string; mimeType: string; size: number }[];
  status: ChangeRequestRow["status"];
  rejectionReason: string | null;
  applicationError: string | null;
  createdAt: string;
  decidedAt: string | null;
  appliedAt: string | null;
};

const REQUEST_COLUMNS = "id, requester_id, requester_name, resource, action, method, request_path, content_type, request_body, files, status, reviewer_id, rejection_reason, application_error, created_at, decided_at, applied_at";

function mapRequest(row: ChangeRequestRow): AdminChangeRequest {
  return {
    id: row.id,
    requesterId: row.requester_id,
    requesterName: row.requester_name,
    resource: row.resource,
    action: row.action,
    method: row.method,
    requestPath: row.request_path,
    contentType: row.content_type,
    requestBody: row.request_body ?? {},
    files: (row.files ?? []).map(({ fieldName, originalName, mimeType, size }) => ({ fieldName, originalName, mimeType, size })),
    status: row.status,
    rejectionReason: row.rejection_reason,
    applicationError: row.application_error,
    createdAt: row.created_at,
    decidedAt: row.decided_at,
    appliedAt: row.applied_at,
  };
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => [key, sortJson(item)]));
  }
  return value;
}

function hashJson(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}

function requestFiles(req: Request): Express.Multer.File[] {
  if (req.file) return [req.file];
  if (Array.isArray(req.files)) return req.files;
  if (req.files) return Object.values(req.files).flat();
  return [];
}

async function removeStagedFiles(files: StagedFile[]) {
  if (files.length === 0) return;
  const { error } = await supabase.storage.from(env.approvalStagingBucketName).remove(files.map((file) => file.storagePath));
  if (error) console.error("Failed to remove staged change-request files:", error.message);
}

export async function createAdminChangeRequest(req: Request, resource: string, action: string): Promise<string> {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");

  const id = crypto.randomUUID();
  const stagedFiles: StagedFile[] = [];
  const uploads = requestFiles(req);
  try {
    for (const [index, file] of uploads.entries()) {
      const storagePath = `${id}/${index}`;
      const { error } = await supabase.storage.from(env.approvalStagingBucketName).upload(storagePath, file.buffer, {
        contentType: file.mimetype || "application/octet-stream",
        upsert: false,
      });
      if (error) throw new Error(`Failed to stage an approval upload: ${error.message}`);
      stagedFiles.push({
        fieldName: file.fieldname,
        originalName: file.originalname,
        mimeType: file.mimetype || "application/octet-stream",
        size: file.size,
        sha256: crypto.createHash("sha256").update(file.buffer).digest("hex"),
        storagePath,
      });
    }

    const { error } = await supabase.from("admin_change_requests").insert({
      id,
      requester_id: req.user.id,
      requester_name: req.user.fullName,
      resource,
      action,
      method: req.method,
      request_path: req.originalUrl,
      content_type: req.get("content-type")?.split(";")[0] ?? null,
      request_body: req.approvalRequestBody ?? req.body ?? {},
      files: stagedFiles,
    });
    if (error) throw new Error(`Failed to save approval request: ${error.message}`);
    return id;
  } catch (error) {
    await removeStagedFiles(stagedFiles);
    throw error;
  }
}

export async function listAdminChangeRequests(limit = 12): Promise<AdminChangeRequest[]> {
  const staleApplyingBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { error: recoveryError } = await supabase.from("admin_change_requests")
    .update({ status: "approved", application_error: "Previous apply attempt did not finish." })
    .eq("status", "applying")
    .lt("updated_at", staleApplyingBefore);
  if (recoveryError) throw new Error(`Failed to recover interrupted approval requests: ${recoveryError.message}`);

  const { data, error } = await supabase
    .from("admin_change_requests")
    .select(REQUEST_COLUMNS)
    .in("status", ["pending", "approved"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load approval requests: ${error.message}`);
  return ((data ?? []) as ChangeRequestRow[]).map(mapRequest);
}

export async function getAdminChangeRequestCount(): Promise<number> {
  const { count, error } = await supabase
    .from("admin_change_requests")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "approved"]);
  if (error) throw new Error(`Failed to count approval requests: ${error.message}`);
  if (count === null) throw new Error("Failed to count approval requests.");
  return count;
}

async function getRequestRow(id: string): Promise<ChangeRequestRow> {
  const { data, error } = await supabase.from("admin_change_requests").select(REQUEST_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load approval request: ${error.message}`);
  if (!data) throw new AppError(404, "Approval request not found.", "CHANGE_REQUEST_NOT_FOUND");
  return data as ChangeRequestRow;
}

export async function reviewAdminChangeRequest(id: string, reviewerId: string, decision: "approved" | "rejected", reason?: string): Promise<AdminChangeRequest> {
  const current = await getRequestRow(id);
  if (current.status === "approved" && decision === "approved") return mapRequest(current);
  if (current.status !== "pending") throw new AppError(409, "This request has already been reviewed.", "CHANGE_REQUEST_ALREADY_REVIEWED");

  const update = {
    status: decision,
    reviewer_id: reviewerId,
    decided_at: new Date().toISOString(),
    rejection_reason: decision === "rejected" ? reason?.trim() || null : null,
  };
  const { data, error } = await supabase.from("admin_change_requests")
    .update(update)
    .eq("id", id)
    .eq("status", "pending")
    .select(REQUEST_COLUMNS)
    .maybeSingle();
  if (error) throw new Error(`Failed to review approval request: ${error.message}`);
  if (!data) throw new AppError(409, "This request has already been reviewed.", "CHANGE_REQUEST_ALREADY_REVIEWED");

  const updated = data as ChangeRequestRow;
  if (decision === "rejected") await removeStagedFiles(updated.files);
  return mapRequest(updated);
}

export async function downloadStagedChangeRequestFile(id: string, index: number) {
  const row = await getRequestRow(id);
  if (row.status !== "approved") throw new AppError(409, "Approve the request before applying its files.", "CHANGE_REQUEST_NOT_APPROVED");
  const file = row.files[index];
  if (!file) throw new AppError(404, "Approval file not found.", "CHANGE_REQUEST_FILE_NOT_FOUND");
  const { data, error } = await supabase.storage.from(env.approvalStagingBucketName).download(file.storagePath);
  if (error) throw new Error(`Failed to read staged approval file: ${error.message}`);
  return { file, buffer: Buffer.from(await data.arrayBuffer()) };
}

export async function authorizeApprovedChangeRequest(req: Request, res: Response, id: string): Promise<void> {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");
  const row = await getRequestRow(id);
  const files = requestFiles(req);
  const filesMatch = row.files.length === files.length && row.files.every((staged, index) => {
    const file = files[index];
    return file
      && staged.fieldName === file.fieldname
      && staged.originalName === file.originalname
      && staged.mimeType === (file.mimetype || "application/octet-stream")
      && staged.size === file.size
      && staged.sha256 === crypto.createHash("sha256").update(file.buffer).digest("hex");
  });
  if (
    row.status !== "approved"
    || (req.user.role !== "admin" && row.requester_id !== req.user.id)
    || row.method !== req.method
    || row.request_path !== req.originalUrl
    || hashJson(row.request_body) !== hashJson(req.approvalRequestBody ?? req.body ?? {})
    || !filesMatch
  ) {
    throw new AppError(403, "This approved change does not match the submitted request.", "CHANGE_REQUEST_MISMATCH");
  }

  const { data, error } = await supabase.from("admin_change_requests")
    .update({ status: "applying", application_error: null })
    .eq("id", id)
    .eq("status", "approved")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(`Failed to start approved change: ${error.message}`);
  if (!data) throw new AppError(409, "This request is already being applied or has been completed.", "CHANGE_REQUEST_ALREADY_APPLYING");

  res.once("finish", () => {
    const applied = res.statusCode >= 200 && res.statusCode < 300;
    void supabase.from("admin_change_requests")
      .update({
        status: applied ? "applied" : "approved",
        applied_at: applied ? new Date().toISOString() : null,
        application_error: applied ? null : `Apply request returned HTTP ${res.statusCode}.`,
      })
      .eq("id", id)
      .eq("status", "applying")
      .then(async ({ error: updateError }) => {
        if (updateError) console.error("Failed to finalize approved change request:", updateError.message);
        else if (applied) await removeStagedFiles(row.files);
      });
  });
}
