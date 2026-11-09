import bcrypt from "bcrypt";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

export type AdminRole = "admin" | "editor";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  role: AdminRole;
  mfaEnabled: boolean;
}

function mapAuthenticatedAdmin(admin: Record<string, unknown>): AuthenticatedAdmin {
  if (admin.role !== "admin" && admin.role !== "editor") {
    throw new AppError(403, "This account has no valid staff role.", "INVALID_ACCOUNT_ROLE");
  }

  const firstName = typeof admin.first_name === "string" ? admin.first_name : "";
  const middleName = typeof admin.middle_name === "string" ? admin.middle_name : "";
  const lastName = typeof admin.last_name === "string" ? admin.last_name : "";
  const nameExtension = typeof admin.name_extension === "string" ? admin.name_extension : "";
  const fullName = [firstName, middleName, lastName, nameExtension].filter(Boolean).join(" ")
    || (typeof admin.full_name === "string" ? admin.full_name : "");

  return {
    id: String(admin.id),
    email: String(admin.email),
    fullName,
    firstName,
    middleName,
    lastName,
    nameExtension,
    role: admin.role,
    mfaEnabled: admin.mfa_enabled === true,
  };
}

/**
 * Verifies email/password against admin_users. Deliberately returns the
 * SAME generic error for "no such account" and "wrong password" — the
 * distinction is not the client's business, and revealing it would let
 * an attacker enumerate which emails have accounts.
 */
export async function verifyCredentials(
  email: string,
  password: string
): Promise<AuthenticatedAdmin> {
  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, email, password_hash, full_name, first_name, middle_name, last_name, name_extension, role, is_active, mfa_enabled")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    throw new Error(`Database error during login: ${error.message}`);
  }

  const invalidCredentialsError = new AppError(401, "Invalid email or password", "INVALID_CREDENTIALS");

  if (!admin || !admin.is_active) {
    // Still run a bcrypt compare against a dummy hash even when the
    // account doesn't exist, so the response time for "unknown email"
    // and "wrong password" is not distinguishably different.
    await bcrypt.compare(password, "$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidin");
    throw invalidCredentialsError;
  }

  const passwordMatches = await bcrypt.compare(password, admin.password_hash);
  if (!passwordMatches) {
    throw invalidCredentialsError;
  }

  await supabase
    .from("admin_users")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", admin.id);

  return mapAuthenticatedAdmin(admin);
}

export async function getAdminById(id: string): Promise<AuthenticatedAdmin | null> {
  const { data: admin, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, first_name, middle_name, last_name, name_extension, role, is_active, mfa_enabled")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load authenticated staff role: ${error.message}`);
  }
  if (!admin || !admin.is_active) return null;

  return mapAuthenticatedAdmin(admin);
}
