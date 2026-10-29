import bcrypt from "bcrypt";
import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateUserInput, UpdateUserInput } from "../validation/users.schema";

export interface StaffUserRecord {
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  role: "admin" | "editor";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

function mapUserRow(row: any): StaffUserRecord {
  const firstName = row.first_name ?? "";
  const middleName = row.middle_name ?? "";
  const lastName = row.last_name ?? "";
  const nameExtension = row.name_extension ?? "";
  const fullName = [firstName, middleName, lastName, nameExtension].filter(Boolean).join(" ") || row.full_name;

  return {
    id: row.id,
    email: row.email,
    fullName,
    firstName,
    middleName,
    lastName,
    nameExtension,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
  };
}

export async function listStaffUsers(): Promise<StaffUserRecord[]> {
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, first_name, middle_name, last_name, name_extension, role, is_active, created_at, last_login_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load staff users: ${error.message}`);
  }

  return (data ?? []).map(mapUserRow);
}

export async function createStaffUser(input: CreateUserInput): Promise<StaffUserRecord> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(input.password, 12);
  const fullName = formatFullName(input);

  const { data, error } = await supabase
    .from("admin_users")
    .insert({
      email: normalizedEmail,
      full_name: fullName,
      first_name: input.firstName.trim(),
      middle_name: input.middleName?.trim() ?? "",
      last_name: input.lastName.trim(),
      name_extension: input.nameExtension?.trim() ?? "",
      role: "editor",
      is_active: input.isActive ?? true,
      password_hash: passwordHash,
    })
    .select("id, email, full_name, first_name, middle_name, last_name, name_extension, role, is_active, created_at, last_login_at")
    .single();

  if (error) {
    if (error.code === "23505") throw new AppError(409, "An account with that email already exists.", "USER_EMAIL_IN_USE");
    if (error.message.includes("admin_users_single_admin_idx")) {
      throw new AppError(409, "Only one admin account is allowed. New staff accounts must be editors.", "SINGLE_ADMIN_ONLY");
    }
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
  if (typeof input.firstName !== "undefined") payload.first_name = input.firstName.trim();
  if (typeof input.middleName !== "undefined") payload.middle_name = input.middleName.trim();
  if (typeof input.lastName !== "undefined") payload.last_name = input.lastName.trim();
  if (typeof input.nameExtension !== "undefined") payload.name_extension = input.nameExtension.trim();
  if (Object.keys(payload).some((key) => ["first_name", "middle_name", "last_name", "name_extension"].includes(key))) {
    const { data: existing, error: existingError } = await supabase
      .from("admin_users")
      .select("first_name, middle_name, last_name, name_extension, full_name")
      .eq("id", id)
      .maybeSingle();
    if (existingError) throw new Error(`Failed to load staff user: ${existingError.message}`);
    if (!existing) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    payload.full_name = formatFullName({
      firstName: payload.first_name ?? existing.first_name ?? "",
      middleName: payload.middle_name ?? existing.middle_name ?? "",
      lastName: payload.last_name ?? existing.last_name ?? "",
      nameExtension: payload.name_extension ?? existing.name_extension ?? "",
    }) || existing.full_name;
  }
  if (typeof input.isActive === "boolean") payload.is_active = input.isActive;
  if (input.password) payload.password_hash = await bcrypt.hash(input.password, 12);

  if (input.isActive === false) {
    const { data: current, error: currentError } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", id)
      .maybeSingle();
    if (currentError) throw new Error(`Failed to load staff user: ${currentError.message}`);
    if (!current) throw new AppError(404, "User not found", "USER_NOT_FOUND");
    if (current.role === "admin") {
      throw new AppError(409, "The sole admin account cannot be deactivated.", "SOLE_ADMIN_CANNOT_BE_DEACTIVATED");
    }
  }

  const { data, error } = await supabase
    .from("admin_users")
    .update(payload)
    .eq("id", id)
    .select("id, email, full_name, first_name, middle_name, last_name, name_extension, role, is_active, created_at, last_login_at")
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
  const { data: current, error: currentError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw new Error(`Failed to load staff user: ${currentError.message}`);
  if (!current) throw new AppError(404, "User not found", "USER_NOT_FOUND");
  if (current.role === "admin") {
    throw new AppError(409, "The sole admin account cannot be deactivated.", "SOLE_ADMIN_CANNOT_BE_DEACTIVATED");
  }

  const { data, error } = await supabase
    .from("admin_users")
    .update({ is_active: false })
    .eq("id", id)
    .select("id, email, full_name, first_name, middle_name, last_name, name_extension, role, is_active, created_at, last_login_at")
    .single();

  if (error) {
    throw new Error(`Failed to deactivate staff user: ${error.message}`);
  }

  if (!data) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }

  return mapUserRow(data);
}

function formatFullName(name: {
  firstName: string;
  middleName?: string;
  lastName: string;
  nameExtension?: string;
}): string {
  return [name.firstName, name.middleName, name.lastName, name.nameExtension]
    .map((part) => part?.trim() ?? "")
    .filter(Boolean)
    .join(" ");
}
