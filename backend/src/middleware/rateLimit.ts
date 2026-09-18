import rateLimit from "express-rate-limit";
import { env } from "../config/env";

/**
 * Strict limiter for the login endpoint specifically — brute-force
 * protection. A lighter, general limiter for the rest of /api/* is
 * applied globally in app.ts.
 */
export const loginRateLimiter = rateLimit({
  windowMs: env.rateLimitLoginWindowMinutes * 60 * 1000,
  limit: env.rateLimitLoginMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many login attempts. Please try again later.",
      code: "RATE_LIMITED",
    },
  },
});
