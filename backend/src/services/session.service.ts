import crypto from "node:crypto";
import { supabase } from "../config/supabase";
import { env } from "../config/env";

/**
 * Server-side opaque sessions (see docs/blueprint.md, Section 6) —
 * deliberately NOT JWTs. The raw token goes to the browser in an
 * httpOnly cookie; only its hash is ever stored, so a database leak
 * alone can't be used to impersonate a session. Revocation is a single
 * UPDATE, unlike a JWT, which stays valid until it naturally expires.
 */

export interface SessionRecord {
  id: string;
  adminUserId: string;
  expiresAt: string;
}

function hashToken(rawToken: string): string {
  // SHA-256, not bcrypt: this hash exists purely for fast equality
  // lookup on every request, not to resist offline guessing of a
  // human-chosen secret (that's what bcrypt is for, on passwords).
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createSession(
  adminUserId: string,
  meta: { userAgent?: string; ipAddress?: string }
): Promise<{ rawToken: string; expiresAt: Date }> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + env.sessionTtlHours * 60 * 60 * 1000);

  const { error } = await supabase.from("sessions").insert({
    token_hash: tokenHash,
    admin_user_id: adminUserId,
    user_agent: meta.userAgent ?? null,
    ip_address: meta.ipAddress ?? null,
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return { rawToken, expiresAt };
}

/**
 * Looks up a session by its raw (cookie) token. Returns null for
 * anything invalid, expired, or revoked — callers don't need to
 * distinguish why, they just get "not authenticated" either way.
 */
export async function findValidSession(rawToken: string): Promise<SessionRecord | null> {
  const tokenHash = hashToken(rawToken);

  const { data, error } = await supabase
    .from("sessions")
    .select("id, admin_user_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !data) return null;

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return null;
  }

  return {
    id: data.id,
    adminUserId: data.admin_user_id,
    expiresAt: data.expires_at,
  };
}

export async function revokeSession(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await supabase
    .from("sessions")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", tokenHash);
}
