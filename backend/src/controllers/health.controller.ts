import type { Request, Response } from "express";

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
