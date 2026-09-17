import dotenv from "dotenv";

dotenv.config();

/**
 * Centralized environment config.
 *
 * For this increment, nothing here is a true secret yet (no DB, no auth),
 * so we use sensible defaults instead of failing hard on a missing var.
 * Strict fail-fast validation (e.g. via Zod) will be introduced once real
 * secrets — SESSION_SECRET, SUPABASE_SERVICE_ROLE_KEY, etc. — are actually
 * read at startup. See docs/blueprint.md, Section 9.
 */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4000),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export const isProduction = env.nodeEnv === "production";
