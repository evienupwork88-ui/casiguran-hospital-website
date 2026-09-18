import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    console.error(`Missing required environment variable: ${name}`);
    console.error("Check backend/.env — see backend/.env.example for the full list.");
    process.exit(1);
  }
  return value;
}

function envString(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const nodeEnv = envString("NODE_ENV", "development");
const isProduction = nodeEnv === "production";

export const env = {
  nodeEnv,
  isProduction,
  port: envNumber("PORT", 4000),

  corsAllowedOrigins: envString("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),

  sessionCookieName: envString("SESSION_COOKIE_NAME", "cdh_session"),
  sessionSecret: requireEnv("SESSION_SECRET"),
  sessionTtlHours: envNumber("SESSION_TTL_HOURS", 8),

  csrfCookieName: "cdh_csrf",

  rateLimitLoginMax: envNumber("RATE_LIMIT_LOGIN_MAX", 5),
  rateLimitLoginWindowMinutes: envNumber("RATE_LIMIT_LOGIN_WINDOW_MINUTES", 15),
};