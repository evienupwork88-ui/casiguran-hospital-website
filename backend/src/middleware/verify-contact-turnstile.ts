import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

type TurnstileResponse = {
  success?: unknown;
  hostname?: unknown;
  action?: unknown;
};

const allowedHostnames = new Set(
  env.corsAllowedOrigins.flatMap((origin) => {
    try {
      return [new URL(origin).hostname.toLowerCase()];
    } catch {
      return [];
    }
  }),
);

export async function verifyContactTurnstile(req: Request, _res: Response, next: NextFunction) {
  if (!env.turnstileSecretKey) {
    next(new AppError(503, "Security verification is not configured. Please try again later.", "TURNSTILE_NOT_CONFIGURED"));
    return;
  }

  try {
    const body = new URLSearchParams({
      secret: env.turnstileSecretKey,
      response: req.body.turnstileToken,
    });
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`[contact turnstile] verification endpoint returned HTTP ${response.status}`);
      throw new AppError(503, "Security verification is temporarily unavailable. Please try again.", "TURNSTILE_UNAVAILABLE");
    }

    const result = await response.json() as TurnstileResponse;
    if (
      result.success !== true
      || result.action !== "contact_inquiry"
      || typeof result.hostname !== "string"
      || !allowedHostnames.has(result.hostname.toLowerCase())
    ) {
      next(new AppError(400, "Please complete the security check and try again.", "TURNSTILE_REJECTED"));
      return;
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    console.error("[contact turnstile] verification request failed:", error instanceof Error ? error.name : "Unknown error");
    next(new AppError(503, "Security verification is temporarily unavailable. Please try again.", "TURNSTILE_UNAVAILABLE"));
  }
}
