import type { Request, Response } from "express";
import { exportAuditLogsPdf, getAuditMonthlyStats, getAvailableAuditMonths, listAuditLogs } from "../services/audit-logs.service";
import { AppError } from "../utils/AppError";

function requestedMonth(req: Request) {
  const month = req.query.month;
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(400, "A valid month is required (YYYY-MM).", "INVALID_AUDIT_MONTH");
  }
  return month;
}

function requestedAuditLogLimit(req: Request) {
  const limit = req.query.limit;
  if (limit === undefined || limit === null || limit === "") {
    return 100;
  }
  if (typeof limit !== "string" || !/^\d+$/.test(limit)) {
    throw new AppError(400, "A valid audit log limit is required.", "INVALID_AUDIT_LIMIT");
  }
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new AppError(400, "Audit log limit must be greater than zero.", "INVALID_AUDIT_LIMIT");
  }
  return Math.min(parsed, 5000);
}

export async function listAdminAuditLogs(req: Request, res: Response) {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(400, "A valid month is required (YYYY-MM).", "INVALID_AUDIT_MONTH");
  }
  const items = await listAuditLogs(month, requestedAuditLogLimit(req));
  res.status(200).json({ items });
}

export async function getAdminAuditMonthlyStats(req: Request, res: Response) {
  const stats = await getAuditMonthlyStats(requestedMonth(req));
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({ stats });
}

export async function listAdminAuditMonths(_req: Request, res: Response) {
  const months = await getAvailableAuditMonths();
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({ months });
}

export async function exportAdminAuditLogs(req: Request, res: Response) {
  const month = requestedMonth(req);
  const pdf = await exportAuditLogsPdf(month);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="audit-history-${month}.pdf"`);
  res.status(200).send(pdf);
}
