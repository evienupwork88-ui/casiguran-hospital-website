import type { Request, Response } from "express";
import { env } from "../config/env";

/**
 * Simple liveness check. Intentionally has no dependencies on the
 * database or any other service yet — this increment only proves the
 * backend process itself starts up and responds.
 */
export function getHealth(_req: Request, res: Response) {
  res.status(200).json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}

export function getServerTime(_req: Request, res: Response) {
  res.status(200).json({ timestamp: new Date().toISOString(), timezone: env.timezone });
}
