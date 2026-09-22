import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { CreateServiceInput, UpdateServiceInput } from "../validation/services.schema";

export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  department: string | null;
  iconOrImageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

function mapServiceRow(row: any): ServiceRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    department: row.department ?? null,
    iconOrImageUrl: row.icon_or_image_url ?? null,
    displayOrder: row.display_order ?? 0,
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listActiveServices(): Promise<ServiceRecord[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, department, icon_or_image_url, display_order, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load services: ${error.message}`);
  }

  return (data ?? []).map(mapServiceRow);
}

export async function listAllServices(): Promise<ServiceRecord[]> {
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, department, icon_or_image_url, display_order, is_active, created_at, updated_at")
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load admin services: ${error.message}`);
  }

  return (data ?? []).map(mapServiceRow);
}

export async function createService(input: CreateServiceInput): Promise<ServiceRecord> {
  const payload = {
    name: input.name.trim(),
    description: input.description.trim(),
    department: input.department && input.department.trim() !== "" ? input.department.trim() : null,
    icon_or_image_url: input.iconOrImageUrl && input.iconOrImageUrl.trim() !== "" ? input.iconOrImageUrl.trim() : null,
    display_order: input.displayOrder ?? 0,
    is_active: input.isActive ?? true,
  };

  const { data, error } = await supabase
    .from("services")
    .insert(payload)
    .select("id, name, description, department, icon_or_image_url, display_order, is_active, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Failed to create service: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not create service", "SERVICE_CREATE_FAILED");
  }

  return mapServiceRow(data);
}

export async function updateService(id: string, input: UpdateServiceInput): Promise<ServiceRecord> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.department !== undefined) payload.department = input.department.trim() || null;
  if (input.iconOrImageUrl !== undefined) payload.icon_or_image_url = input.iconOrImageUrl.trim() || null;
  if (input.displayOrder !== undefined) payload.display_order = input.displayOrder;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  const { data, error } = await supabase.from("services").update(payload).eq("id", id)
    .select("id, name, description, department, icon_or_image_url, display_order, is_active, created_at, updated_at").single();
  if (error) throw new Error(`Failed to update service: ${error.message}`);
  if (!data) throw new AppError(404, "Service not found", "SERVICE_NOT_FOUND");
  return mapServiceRow(data);
}

export async function deleteService(id: string): Promise<void> {
  const { data, error } = await supabase.from("services").delete().eq("id", id).select("id").single();
  if (error) throw new Error(`Failed to delete service: ${error.message}`);
  if (!data) throw new AppError(404, "Service not found", "SERVICE_NOT_FOUND");
}
