import type { Request, Response } from "express";
import { listAuditLogs } from "../services/audit-logs.service";

export async function listAdminAuditLogs(_req: Request, res: Response) {
  const items = await listAuditLogs();
  res.status(200).json({ items });
}
