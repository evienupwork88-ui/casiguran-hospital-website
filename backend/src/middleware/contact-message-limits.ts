import type { NextFunction, Request, Response } from "express";

export function rejectHoneypot(req: Request, res: Response, next: NextFunction) {
  const website = req.body && typeof req.body.website === "string" ? req.body.website.trim() : "";
  if (!website) {
    next();
    return;
  }
  res.status(202).json({ message: "Your message has been received." });
}
