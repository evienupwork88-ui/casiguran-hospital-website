import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

const CONTACT_COOLDOWN_MS = 5 * 60 * 1000;
const lastSubmissionByIp = new Map<string, number>();

export function rejectHoneypot(req: Request, res: Response, next: NextFunction) {
  const website = req.body && typeof req.body.website === "string" ? req.body.website.trim() : "";
  if (!website) {
    next();
    return;
  }
  res.status(202).json({ message: "Your message has been received." });
}

export function limitContactSubmissions(req: Request, _res: Response, next: NextFunction) {
  const now = Date.now();
  const ip = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const lastSubmission = lastSubmissionByIp.get(ip);
  if (lastSubmission !== undefined && now - lastSubmission < CONTACT_COOLDOWN_MS) {
    next(new AppError(429, "Please wait five minutes before sending another message.", "CONTACT_RATE_LIMITED"));
    return;
  }

  // Replace this Map with shared Upstash Redis storage when using multiple backend instances.
  if (lastSubmissionByIp.size > 10000) {
    for (const [address, timestamp] of lastSubmissionByIp) {
      if (now - timestamp >= CONTACT_COOLDOWN_MS) lastSubmissionByIp.delete(address);
    }
  }
  lastSubmissionByIp.set(ip, now);
  next();
}
