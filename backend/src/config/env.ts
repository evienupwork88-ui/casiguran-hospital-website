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
const r2AccountId = envString("R2_ACCOUNT_ID", "");
const r2AccessKeyId = envString("R2_ACCESS_KEY_ID", "");
const r2SecretAccessKey = envString("R2_SECRET_ACCESS_KEY", "");
const r2BucketName = envString("R2_BUCKET_NAME", "");
const r2Configuration = [r2AccountId, r2AccessKeyId, r2SecretAccessKey, r2BucketName];
if (r2Configuration.some(Boolean) && !r2Configuration.every(Boolean)) {
  throw new Error("R2 audit archive requires R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME.");
}

export const env = {
  nodeEnv,
  isProduction,
  port: envNumber("PORT", 4000),
  trustProxyHops: envNumber("TRUST_PROXY_HOPS", 0),
  timezone: envString("TIMEZONE", "Asia/Manila"),

  corsAllowedOrigins: envString("CORS_ALLOWED_ORIGINS", "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  supabaseUrl: requireEnv("SUPABASE_URL"),
  supabaseServiceRoleKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  googleCalendarApiKey: envString("GOOGLE_CALENDAR_API_KEY", ""),
  storageBucketName: envString("STORAGE_BUCKET_NAME", "cdh-documents"),
  approvalStagingBucketName: envString("APPROVAL_STAGING_BUCKET_NAME", "cdh-approval-staging"),
  maxUploadImageBytes: envNumber("MAX_UPLOAD_IMAGE_MB", 5) * 1024 * 1024,
  maxUploadDocBytes: envNumber("MAX_UPLOAD_DOC_MB", 15) * 1024 * 1024,
  maxOrgChartImageBytes: envNumber("ORG_CHART_IMAGE_MAX_UPLOAD_MB", 25) * 1024 * 1024,

  sessionCookieName: envString("SESSION_COOKIE_NAME", "cdh_session"),
  sessionCookieDomain: envString("SESSION_COOKIE_DOMAIN", ""),
  sessionSecret: requireEnv("SESSION_SECRET"),
  sessionTtlHours: envNumber("SESSION_TTL_HOURS", 8),
  preAuthSessionTtlMinutes: 10,

  csrfCookieName: "cdh_csrf",

  rateLimitPasswordResetMax: envNumber("RATE_LIMIT_PASSWORD_RESET_MAX", 5),
  rateLimitPasswordResetWindowMinutes: envNumber("RATE_LIMIT_PASSWORD_RESET_WINDOW_MINUTES", 15),
  gmailSmtpUser: envString("GMAIL_SMTP_USER", ""),
  gmailSmtpAppPassword: envString("GMAIL_SMTP_APP_PASSWORD", ""),
  passwordResetEmailFrom: envString("PASSWORD_RESET_EMAIL_FROM", ""),
  contactGmailSmtpUser: envString("CONTACT_GMAIL_SMTP_USER", ""),
  contactGmailSmtpAppPassword: envString("CONTACT_GMAIL_SMTP_APP_PASSWORD", ""),
  contactInquiryEmailTo: envString("CONTACT_INQUIRY_EMAIL_TO", ""),
  turnstileSecretKey: envString("TURNSTILE_SECRET_KEY", ""),
  r2ArchiveEnabled: r2Configuration.every(Boolean),
  r2AccountId,
  r2AccessKeyId,
  r2SecretAccessKey,
  r2BucketName,
};