import type { Request, Response } from "express";
import { exportAuditLogsPdf, getAuditMonthlyStats, listAuditLogs } from "../services/audit-logs.service";
import { AppError } from "../utils/AppError";

function requestedMonth(req: Request) {
  const month = req.query.month;
  if (typeof month !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(400, "A valid month is required (YYYY-MM).", "INVALID_AUDIT_MONTH");
  }
  return month;
}

export async function listAdminAuditLogs(req: Request, res: Response) {
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  if (month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new AppError(400, "A valid month is required (YYYY-MM).", "INVALID_AUDIT_MONTH");
  }
  const items = await listAuditLogs(month);
  res.status(200).json({ items });
}

export async function getAdminAuditMonthlyStats(req: Request, res: Response) {
  const stats = await getAuditMonthlyStats(requestedMonth(req));
  res.setHeader("Cache-Control", "private, no-store");
  res.status(200).json({ stats });
}

export async function exportAdminAuditLogs(req: Request, res: Response) {
  const month = requestedMonth(req);
  const pdf = await exportAuditLogsPdf(month);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="audit-history-${month}.pdf"`);
  res.status(200).send(pdf);
}
