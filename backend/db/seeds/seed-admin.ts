import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcrypt";

/**
 * One-time (or occasional) script to create/update the seeded admin
 * account. Run manually — this is NOT called by the running app.
 *
 * Usage:
 *   npm run seed:admin
 *
 * Reads from backend/.env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  — required, connects as
 *     the service role (bypasses RLS by design — see docs/blueprint.md)
 *   ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME — required,
 *     the account being created. Never committed anywhere.
 *
 * Running this successfully also serves as the "can Express reach the
 * database" connectivity check for this increment.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SEED_EMAIL = process.env.ADMIN_SEED_EMAIL;
const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const ADMIN_SEED_NAME = process.env.ADMIN_SEED_NAME ?? "Admin";

const BCRYPT_SALT_ROUNDS = 12;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    console.error("Check backend/.env — see backend/.env.example for the full list.");
    process.exit(1);
  }
  return value;
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL", SUPABASE_URL);
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  const email = requireEnv("ADMIN_SEED_EMAIL", ADMIN_SEED_EMAIL);
  const password = requireEnv("ADMIN_SEED_PASSWORD", ADMIN_SEED_PASSWORD);

  if (password.length < 12) {
    console.error("ADMIN_SEED_PASSWORD is too short — use at least 12 characters.");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log(`Connecting to Supabase at ${supabaseUrl} ...`);
  const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

  const { data, error } = await supabase
    .from("admin_users")
    .upsert(
      {
        email,
        password_hash: passwordHash,
        full_name: ADMIN_SEED_NAME,
        role: "admin",
        is_active: true,
      },
      { onConflict: "email" }
    )
    .select("id, email, full_name, role, created_at")
    .single();

  if (error) {
    console.error("Failed to seed admin account:");
    console.error(error.message);
    process.exit(1);
  }

  console.log("\nConnectivity confirmed — Express can reach the database.");
  console.log("Admin account ready:");
  console.log(data);
}

main();
