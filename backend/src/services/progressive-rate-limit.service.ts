import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";

function hashKey(scope: string, value: string): string {
  return crypto.createHmac("sha256", env.sessionSecret)
    .update(`${scope}:${value.trim().toLowerCase()}`)
    .digest("hex");
}

export async function consumeProgressiveThrottle(
  scope: "password_reset_ip" | "password_reset_account" | "contact_ip",
  value: string,
  limit: number,
  windowSeconds: number,
): Promise<Date | null> {
  const { data, error } = await supabase.rpc("consume_progressive_request_throttle", {
    p_scope: scope,
    p_key_hash: hashKey(scope, value),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) throw new Error(`Failed to check ${scope} rate limit: ${error.message}`);
  return data ? new Date(data as string) : null;
}

export async function clearProgressiveThrottle(
  scope: "password_reset_ip" | "password_reset_account",
  value: string,
): Promise<void> {
  const { error } = await supabase.rpc("clear_progressive_request_throttle", {
    p_scope: scope,
    p_key_hash: hashKey(scope, value),
  });
  if (error) throw new Error(`Failed to clear ${scope} rate limit: ${error.message}`);
}
