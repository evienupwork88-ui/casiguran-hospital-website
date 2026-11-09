import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";

function hashIdentifier(value: string): string {
  return crypto.createHmac("sha256", env.sessionSecret)
    .update(value.trim().toLowerCase())
    .digest("hex");
}

function identifiers(email: string, ipAddress: string) {
  return {
    emailHash: hashIdentifier(`account:${email}`),
    ipHash: hashIdentifier(`ip:${ipAddress}`),
  };
}

export async function getLoginLock(email: string, ipAddress: string): Promise<Date | null> {
  const { emailHash, ipHash } = identifiers(email, ipAddress);
  const { data, error } = await supabase.rpc("check_admin_login_throttle", {
    p_email_hash: emailHash,
    p_ip_hash: ipHash,
  });

  if (error) throw new Error(`Failed to check login cooldown: ${error.message}`);
  return data ? new Date(data as string) : null;
}

export async function recordLoginFailure(email: string, ipAddress: string): Promise<Date | null> {
  const { emailHash, ipHash } = identifiers(email, ipAddress);
  const { data, error } = await supabase.rpc("record_admin_login_failure", {
    p_email_hash: emailHash,
    p_ip_hash: ipHash,
  });

  if (error) throw new Error(`Failed to record login failure: ${error.message}`);
  return data ? new Date(data as string) : null;
}

export async function clearLoginFailures(email: string, ipAddress: string): Promise<void> {
  const { emailHash, ipHash } = identifiers(email, ipAddress);
  const { error } = await supabase.rpc("clear_admin_login_throttle", {
    p_email_hash: emailHash,
    p_ip_hash: ipHash,
  });

  if (error) throw new Error(`Failed to clear login failures: ${error.message}`);
}
