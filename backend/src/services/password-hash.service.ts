import crypto from "node:crypto";
import bcrypt from "bcrypt";

const BCRYPT_SHA256_PREFIX = "$bcrypt-sha256:";
const BCRYPT_SALT_ROUNDS = 12;

function bcryptInput(password: string): { value: string; prefix: string } {
  if (Buffer.byteLength(password, "utf8") <= 72) {
    return { value: password, prefix: "" };
  }

  // Keep the full password significant despite bcrypt's 72-byte input limit.
  return {
    value: crypto.createHash("sha256").update(password, "utf8").digest("hex"),
    prefix: BCRYPT_SHA256_PREFIX,
  };
}

export async function hashPassword(password: string): Promise<string> {
  const input = bcryptInput(password);
  return `${input.prefix}${await bcrypt.hash(input.value, BCRYPT_SALT_ROUNDS)}`;
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const isPrehashed = passwordHash.startsWith(BCRYPT_SHA256_PREFIX);
  const bcryptHash = isPrehashed ? passwordHash.slice(BCRYPT_SHA256_PREFIX.length) : passwordHash;
  const input = isPrehashed
    ? crypto.createHash("sha256").update(password, "utf8").digest("hex")
    : password;

  return bcrypt.compare(input, bcryptHash);
}
