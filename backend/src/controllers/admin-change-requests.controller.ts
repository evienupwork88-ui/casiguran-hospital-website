import type { Request, Response } from "express";
import {
  downloadStagedChangeRequestFile,
  listAdminChangeRequests,
  reviewAdminChangeRequest,
} from "../services/admin-change-requests.service";
import { AppError } from "../utils/AppError";
import type { RejectAdminChangeRequestInput } from "../validation/admin-change-requests.schema";

function getId(req: Request) {
  return Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
}

export async function listAdminChangeRequestsController(_req: Request, res: Response) {
  res.status(200).json({ items: await listAdminChangeRequests() });
}

export async function approveAdminChangeRequest(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");
  const item = await reviewAdminChangeRequest(getId(req), req.user.id, "approved");
  res.status(200).json({ item });
}

export async function rejectAdminChangeRequest(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "Not authenticated.", "UNAUTHENTICATED");
  const input = req.body as RejectAdminChangeRequestInput;
  const item = await reviewAdminChangeRequest(getId(req), req.user.id, "rejected", input.reason);
  res.status(200).json({ item });
}

export async function getAdminChangeRequestFile(req: Request, res: Response) {
  const id = getId(req);
  const index = Number(Array.isArray(req.params.index) ? req.params.index[0] : req.params.index);
  if (!Number.isInteger(index) || index < 0) throw new AppError(400, "Invalid approval file index.", "INVALID_FILE_INDEX");
  const { file, buffer } = await downloadStagedChangeRequestFile(id, index);
  res.setHeader("Content-Type", file.mimeType);
  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(file.originalName)}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).send(buffer);
}
