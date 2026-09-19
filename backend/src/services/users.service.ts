import bcrypt from "bcrypt";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateUserInput, UpdateUserInput } from "../validation/users.schema";

export interface StaffUserRecord {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "editor";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

function mapUserRow(row: any): StaffUserRecord {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
  };
}

export async function listStaffUsers(): Promise<StaffUserRecord[]> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, role, is_active, created_at, last_login_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load staff users: ${error.message}`);
  }

  return (data ?? []).map(mapUserRow);
}

export async function createStaffUser(input: CreateUserInput): Promise<StaffUserRecord> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);

  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      email: normalizedEmail,
      full_name: input.fullName.trim(),
      role: input.role,
      is_active: input.isActive ?? true,
      password_hash: passwordHash,
    })
    .select("id, email, full_name, role, is_active, created_at, last_login_at")
    .single();

  if (error) {
    throw new Error(`Failed to create staff user: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not create staff user", "USER_CREATE_FAILED");
  }

  return mapUserRow(data);
}

export async function updateStaffUser(id: string, input: UpdateUserInput): Promise<StaffUserRecord> {
  const payload: Record<string, any> = {};

  if (input.email) payload.email = input.email.trim().toLowerCase();
  if (input.fullName) payload.full_name = input.fullName.trim();
  if (input.role) payload.role = input.role;
  if (typeof input.isActive === "boolean") payload.is_active = input.isActive;
  if (input.password) payload.password_hash = await bcrypt.hash(input.password, 12);

  const { data, error } = await supabase
    .from("admin_users")
    .update(payload)
    .eq("id", id)
    .select("id, email, full_name, role, is_active, created_at, last_login_at")
    .single();

  if (error) {
    throw new Error(`Failed to update staff user: ${error.message}`);
  }

  if (!data) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  return mapUserRow(data);
}

export async function deactivateStaffUser(id: string): Promise<StaffUserRecord> {
  const { data, error } = await supabase
    .from("admin_users")
    .update({ is_active: false })
    .eq("id", id)
    .select("id, email, full_name, role, is_active, created_at, last_login_at")
    .single();

  if (error) {
    throw new Error(`Failed to deactivate staff user: ${error.message}`);
  }

  if (!data) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  return mapUserRow(data);
}
