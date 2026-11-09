import crypto from "node:crypto";
import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const MFA_ISSUER = "Casiguran District Hospital";

function encryptionKey(): Buffer {
  return Buffer.from(crypto.hkdfSync(
    "sha256",
    env.sessionSecret,
    Buffer.from("casiguran-hospital-mfa"),
    Buffer.from("totp-secret-encryption"),
    32
  ));
}

function encryptSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return `v1.${iv.toString("hex")}.${cipher.getAuthTag().toString("hex")}.${ciphertext.toString("hex")}`;
}

function decryptSecret(encrypted: string): string {
  const [version, ivHex, tagHex, ciphertextHex] = encrypted.split(".");
  if (version !== "v1" || !ivHex || !tagHex || !ciphertextHex) {
    throw new Error("Stored MFA secret has an unsupported format");
  }

  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("Unable to decrypt stored MFA secret; verify SESSION_SECRET configuration");
  }
}

function generateBase32Secret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = 0;
  let value = 0;
  let encoded = "";

  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      encoded += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) encoded += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return encoded;
}

function decodeBase32(secret: string): Buffer {
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const character of secret.replace(/=+$/, "").toUpperCase()) {
    const digit = BASE32_ALPHABET.indexOf(character);
    if (digit < 0) throw new Error("Stored MFA secret is invalid");
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

function totpAtCounter(secret: string, counter: number): string {
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", decodeBase32(secret)).update(message).digest();
  const offset = digest[digest.length - 1] & 15;
  const binary = ((digest[offset] & 127) << 24)
    | ((digest[offset + 1] & 255) << 16)
    | ((digest[offset + 2] & 255) << 8)
    | (digest[offset + 3] & 255);
  return String(binary % 1_000_000).padStart(6, "0");
}

function matchingTotpCounter(secret: string, code: string): number | null {
  if (!/^\d{6}$/.test(code)) return null;
  const currentCounter = Math.floor(Date.now() / 30_000);
  const supplied = Buffer.from(code);

  for (const counter of [currentCounter - 1, currentCounter, currentCounter + 1]) {
    if (counter < 0) continue;
    const expected = Buffer.from(totpAtCounter(secret, counter));
    if (crypto.timingSafeEqual(supplied, expected)) return counter;
  }
  return null;
}

function hashRecoveryCode(code: string): string {
  return crypto.createHmac("sha256", env.sessionSecret)
    .update(code.replace(/[\s-]/g, "").toUpperCase())
    .digest("hex");
}

function createSessionToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  return {
    rawToken,
    tokenHash: crypto.createHash("sha256").update(rawToken).digest("hex"),
  };
}

function generateRecoveryCodes(): string[] {
  return Array.from({ length: 10 }, () => crypto.randomBytes(8).toString("hex").toUpperCase());
}

export async function beginMfaSetup(
  admin: { id: string; email: string; mfaEnabled: boolean },
  sessionId: string
): Promise<{ secret: string; otpauthUrl: string }> {
  if (admin.mfaEnabled) throw new AppError(409, "MFA is already enrolled", "MFA_ALREADY_ENABLED");

  const secret = generateBase32Secret();
  const expiresAt = new Date(Date.now() + env.preAuthSessionTtlMinutes * 60_000);
  const { data, error } = await supabase.rpc("save_admin_mfa_setup_secret", {
    p_session_id: sessionId,
    p_secret: encryptSecret(secret),
    p_expires_at: expiresAt.toISOString(),
  });

  if (error) throw new Error(`Failed to save MFA setup state: ${error.message}`);
  if (data !== true) throw new AppError(401, "MFA setup session has expired", "MFA_SETUP_EXPIRED");

  const label = `${MFA_ISSUER}:${admin.email}`;
  const query = new URLSearchParams({
    secret,
    issuer: MFA_ISSUER,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });

  return {
    secret,
    otpauthUrl: `otpauth://totp/${encodeURIComponent(label)}?${query.toString()}`,
  };
}

export async function completeMfaSetup(
  admin: { id: string },
  session: { id: string; mfaSetupSecretEncrypted: string | null; mfaSetupExpiresAt: string | null },
  code: string
): Promise<{ recoveryCodes: string[]; rawToken: string }> {
  if (!session.mfaSetupSecretEncrypted || !session.mfaSetupExpiresAt
    || new Date(session.mfaSetupExpiresAt).getTime() <= Date.now()) {
    throw new AppError(400, "MFA setup expired. Start setup again.", "MFA_SETUP_EXPIRED");
  }

  const secret = decryptSecret(session.mfaSetupSecretEncrypted);
  const counter = matchingTotpCounter(secret, code);
  if (counter === null) throw new AppError(400, "Invalid authenticator code", "INVALID_MFA_CODE");

  const recoveryCodes = generateRecoveryCodes();
  const newSessionToken = createSessionToken();
  const { data, error } = await supabase.rpc("complete_admin_mfa_enrollment", {
    p_admin_user_id: admin.id,
    p_session_id: session.id,
    p_secret: session.mfaSetupSecretEncrypted,
    p_counter: counter,
    p_recovery_hashes: recoveryCodes.map(hashRecoveryCode),
    p_ttl_hours: env.sessionTtlHours,
    p_new_token_hash: newSessionToken.tokenHash,
  });

  if (error) throw new Error(`Failed to complete MFA enrollment: ${error.message}`);
  if (data !== true) throw new AppError(400, "MFA setup expired. Start setup again.", "MFA_SETUP_EXPIRED");
  return { recoveryCodes, rawToken: newSessionToken.rawToken };
}

export async function verifyMfaLogin(
  adminId: string,
  sessionId: string,
  code: string,
  useRecoveryCode: boolean
): Promise<string> {
  if (useRecoveryCode) {
    const newSessionToken = createSessionToken();
    const { data, error } = await supabase.rpc("consume_admin_mfa_recovery_code", {
      p_admin_user_id: adminId,
      p_session_id: sessionId,
      p_code_hash: hashRecoveryCode(code),
      p_ttl_hours: env.sessionTtlHours,
      p_new_token_hash: newSessionToken.tokenHash,
    });

    if (error) throw new Error(`Failed to verify MFA recovery code: ${error.message}`);
    if (data !== true) throw new AppError(401, "Invalid or used recovery code", "INVALID_MFA_CODE");
    return newSessionToken.rawToken;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("mfa_secret_encrypted")
    .eq("id", adminId)
    .eq("mfa_enabled", true)
    .maybeSingle();

  if (error) throw new Error(`Failed to load MFA state: ${error.message}`);
  if (!data?.mfa_secret_encrypted) {
    throw new AppError(401, "MFA is not configured for this account", "MFA_NOT_CONFIGURED");
  }

  const counter = matchingTotpCounter(decryptSecret(data.mfa_secret_encrypted), code);
  if (counter === null) throw new AppError(401, "Invalid authenticator code", "INVALID_MFA_CODE");

  const newSessionToken = createSessionToken();
  const result = await supabase.rpc("verify_admin_mfa_counter", {
    p_admin_user_id: adminId,
    p_session_id: sessionId,
    p_counter: counter,
    p_ttl_hours: env.sessionTtlHours,
    p_new_token_hash: newSessionToken.tokenHash,
  });

  if (result.error) throw new Error(`Failed to verify MFA code: ${result.error.message}`);
  if (result.data !== true) throw new AppError(401, "Invalid or already used authenticator code", "INVALID_MFA_CODE");
  return newSessionToken.rawToken;
}

export async function verifyMfaStepUp(
  adminId: string,
  sessionId: string,
  code: string,
): Promise<void> {
  const { data: admin, error: loadError } = await supabase
    .from("admin_users")
    .select("mfa_secret_encrypted")
    .eq("id", adminId)
    .eq("is_active", true)
    .eq("mfa_enabled", true)
    .maybeSingle();

  if (loadError) throw new Error(`Failed to load MFA state for sensitive account update: ${loadError.message}`);
  if (!admin?.mfa_secret_encrypted) {
    throw new AppError(403, "MFA is not configured for this account.", "MFA_NOT_CONFIGURED");
  }

  const counter = matchingTotpCounter(decryptSecret(admin.mfa_secret_encrypted), code);
  if (counter === null) {
    throw new AppError(401, "Enter a valid, current authenticator code.", "INVALID_MFA_CODE");
  }

  const { data, error } = await supabase.rpc("verify_admin_mfa_step_up", {
    p_admin_user_id: adminId,
    p_session_id: sessionId,
    p_counter: counter,
  });
  if (error) throw new Error(`Failed to verify MFA for sensitive account update: ${error.message}`);
  if (data !== true) {
    throw new AppError(401, "That authenticator code was already used or the session is no longer valid. Enter a new code.", "INVALID_MFA_CODE");
  }
}
