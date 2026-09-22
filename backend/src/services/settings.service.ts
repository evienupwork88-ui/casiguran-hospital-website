import { supabase } from "../config/supabase";
import { AppError } from "../utils/AppError";
import type { UpdateSettingsInput } from "../validation/settings.schema";

export type AdministrativeOfficeHoursDay = {
  day: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
  isOpen: boolean;
  startTime: string;
  endTime: string;
};

export interface SiteSettingsRecord {
  id: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  facebookUrl: string | null;
  officeHours: string | null;
  administrativeOfficeHours: AdministrativeOfficeHoursDay[];
  emergencyServices24Hours: boolean;
  mapEmbedUrl: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

const defaultAdministrativeSchedule: AdministrativeOfficeHoursDay[] = [
  { day: "monday", isOpen: false, startTime: "", endTime: "" },
  { day: "tuesday", isOpen: false, startTime: "", endTime: "" },
  { day: "wednesday", isOpen: false, startTime: "", endTime: "" },
  { day: "thursday", isOpen: false, startTime: "", endTime: "" },
  { day: "friday", isOpen: false, startTime: "", endTime: "" },
  { day: "saturday", isOpen: false, startTime: "", endTime: "" },
  { day: "sunday", isOpen: false, startTime: "", endTime: "" },
];

function normalizeAdministrativeOfficeHours(value: unknown): AdministrativeOfficeHoursDay[] {
  if (!Array.isArray(value)) {
    return defaultAdministrativeSchedule;
  }

  const schedule = value.filter((entry): entry is AdministrativeOfficeHoursDay => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const item = entry as { day?: string; isOpen?: boolean; startTime?: string; endTime?: string };
    return typeof item.day === "string" && typeof item.isOpen === "boolean";
  });

  const byDay = new Map(schedule.map((item) => [item.day, item]));

  return defaultAdministrativeSchedule.map((day) => {
    const selected = byDay.get(day.day);
    return {
      day: day.day,
      isOpen: selected?.isOpen ?? false,
      startTime: selected?.startTime ?? "",
      endTime: selected?.endTime ?? "",
    };
  });
}

function mapSettingsRow(row: any): SiteSettingsRecord {
  return {
    id: row.id,
    address: row.address ?? null,
    phone: row.phone ?? null,
    email: row.email ?? null,
    facebookUrl: row.facebook_url ?? null,
    officeHours: row.office_hours ?? null,
    administrativeOfficeHours: normalizeAdministrativeOfficeHours(row.administrative_office_hours),
    emergencyServices24Hours: Boolean(row.emergency_services_24_7),
    mapEmbedUrl: row.map_embed_url ?? null,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by ?? null,
  };
}

export async function getPublicSettings(): Promise<SiteSettingsRecord> {
  const { data, error } = await supabase
    .from("site_settings")
    .select(
      "id, address, phone, email, facebook_url, office_hours, administrative_office_hours, emergency_services_24_7, map_embed_url, updated_at, updated_by",
    )
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
  const payload: Record<string, unknown> = {};

  if (input.address !== undefined) payload.address = input.address.trim() || null;
  if (input.phone !== undefined) payload.phone = input.phone.trim() || null;
  if (input.email !== undefined) payload.email = input.email.trim() || null;
  if (input.facebookUrl !== undefined) payload.facebook_url = input.facebookUrl.trim() || null;
  if (input.officeHours !== undefined) payload.office_hours = input.officeHours.trim() || null;
  if (Array.isArray(input.administrativeOfficeHours)) {
    payload.administrative_office_hours = input.administrativeOfficeHours.map((day) => ({
      day: day.day,
      isOpen: Boolean(day.isOpen),
      startTime: day.startTime?.trim() ?? "",
      endTime: day.endTime?.trim() ?? "",
    }));
  }
  if (input.emergencyServices24Hours !== undefined) {
    payload.emergency_services_24_7 = input.emergencyServices24Hours;
  }
  if (input.mapEmbedUrl !== undefined) payload.map_embed_url = input.mapEmbedUrl.trim() || null;
  if (updatedById !== undefined) payload.updated_by = updatedById;

  const { data, error } = await supabase
    .from("site_settings")
    .update(payload)
    .eq("id", 1)
    .select(
      "id, address, phone, email, facebook_url, office_hours, administrative_office_hours, emergency_services_24_7, map_embed_url, updated_at, updated_by",
    )
    .single();

  if (error) {
    throw new Error(`Failed to update settings: ${error.message}`);
  }

  if (!data) {
    throw new AppError(500, "Could not update site settings", "SETTINGS_UPDATE_FAILED");
  }

  return mapSettingsRow(data);
}
