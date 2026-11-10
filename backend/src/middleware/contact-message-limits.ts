import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export function rejectHoneypot(req: Request, res: Response, next: NextFunction) {
  const website = req.body && typeof req.body.website === "string" ? req.body.website.trim() : "";
  if (!website) {
    next();
    return;
  }
  next(new AppError(400, "Unable to submit your message. Please try again.", "CONTACT_SPAM_REJECTED"));
}
