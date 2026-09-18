import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

/**
 * The ONLY Supabase client in the app. Uses the service_role/secret key,
 * which bypasses Row Level Security by design — see docs/blueprint.md,
 * Section 3 ("Express is the only thing that talks to Postgres/Storage").
 *
 * Never imported by anything that could end up in frontend code.
 */
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    // We are not using Supabase Auth (see docs/blueprint.md, Section 6) —
    // this client is a plain Postgres/Storage tool, not an auth session.
    persistSession: false,
    autoRefreshToken: false,
  },
});
