import bcrypt from "bcrypt";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";

export interface AuthenticatedAdmin {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "editor";
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
    .select("id, email, password_hash, full_name, role, is_active")
    .eq("email", email)
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

  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
  };
}

export async function getAdminById(id: string): Promise<AuthenticatedAdmin | null> {
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role, is_active")
    .eq("id", id)
    .maybeSingle();

  if (!admin || !admin.is_active) return null;

  return {
    id: admin.id,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
  };
}
