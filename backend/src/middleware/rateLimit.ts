import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { consumeProgressiveThrottle } from "../services/progressive-rate-limit.service";
import { AppError } from "../utils/AppError";

type ThrottleKey = {
  scope: "password_reset_ip" | "password_reset_account" | "contact_ip";
  value: string;
};

function createProgressiveLimiter(options: {
  limit: number;
  windowSeconds: number;
  keys: (req: Request) => ThrottleKey[];
  message: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      for (const key of options.keys(req)) {
        const lockedUntil = await consumeProgressiveThrottle(
          key.scope,
          key.value,
          options.limit,
          options.windowSeconds,
        );
        if (lockedUntil && lockedUntil.getTime() > Date.now()) {
          res.setHeader("Retry-After", String(Math.ceil((lockedUntil.getTime() - Date.now()) / 1000)));
          return next(new AppError(429, options.message, "RATE_LIMITED"));
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export const passwordResetRateLimiter = createProgressiveLimiter({
  limit: env.rateLimitPasswordResetMax,
  windowSeconds: env.rateLimitPasswordResetWindowMinutes * 60,
  keys: (req) => [
    { scope: "password_reset_ip", value: req.ip ?? req.socket.remoteAddress ?? "unknown" },
    { scope: "password_reset_account", value: String(req.body.email) },
  ],
  message: "Too many password-reset attempts. Please wait before trying again.",
});

export const contactMessageRateLimiter = createProgressiveLimiter({
  limit: 1,
  windowSeconds: 5 * 60,
  keys: (req) => [{
    scope: "contact_ip",
    value: req.ip ?? req.socket.remoteAddress ?? "unknown",
  }],
  message: "Too many contact submissions. Please wait before trying again.",
});
