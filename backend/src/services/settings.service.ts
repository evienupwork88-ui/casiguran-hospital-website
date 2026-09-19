import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { UpdateSettingsInput } from "../validation/settings.schema";

export interface SiteSettingsRecord {
  id: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  facebookUrl: string | null;
  officeHours: string | null;
  mapEmbedUrl: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

function mapSettingsRow(row: any): SiteSettingsRecord {
  return {
    id: row.id,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    facebookUrl: row.facebook_url ?? null,
    officeHours: row.office_hours ?? null,
    mapEmbedUrl: row.map_embed_url ?? null,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

export async function getPublicSettings(): Promise<SiteSettingsRecord> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("id, address, phone, email, facebook_url, office_hours, map_embed_url, updated_at, updated_by")
    .eq("id", 1)
    .single();

  if (error) {
    throw new Error(`Failed to load site settings: ${error.message}`);
  }

  return mapSettingsRow(data);
}

export async function getAdminSettings(): Promise<SiteSettingsRecord> {
  return getPublicSettings();
}

export async function updateSettings(input: UpdateSettingsInput, updatedById?: string): Promise<SiteSettingsRecord> {
  const payload = {
    address: input.address?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    facebook_url: input.facebookUrl?.trim() || null,
    office_hours: input.officeHours?.trim() || null,
    map_embed_url: input.mapEmbedUrl?.trim() || null,
    updated_by: updatedById ?? null,
  };

  const { data, error } = await supabase
    .from("site_settings")
    .update(payload)
    .eq("id", 1)
    .select("id, address, phone, email, facebook_url, office_hours, map_embed_url, updated_at, updated_by")
    .single();

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not update site settings", "SETTINGS_UPDATE_FAILED");
  }

  return mapSettingsRow(data);
}
