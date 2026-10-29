import { getCsrfToken } from "./auth";

export type RadiologyHighlight = {
  title: string;
  description: string;
};

export type RadiologySchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type RadiologyContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: RadiologyHighlight[];
  clinicSchedule: RadiologySchedule[];
  organizationalStructureDescription: string;
  updatedAt: string;
  updatedBy: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicRadiology(): Promise<RadiologyContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/radiology`, { cache: "no-store" });
  return (await parseJson<{ item: RadiologyContent }>(response)).item;
}

export async function getAdminRadiology(): Promise<RadiologyContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/radiology`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: RadiologyContent }>(response)).item;
}

export async function updateRadiology(input: Pick<RadiologyContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<RadiologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/radiology`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: RadiologyContent }>(response)).item;
}

export async function uploadRadiologyImages(files: File[]): Promise<RadiologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/radiology/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: RadiologyContent }>(response)).item;
}

export async function removeRadiologyImage(index: number): Promise<RadiologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/radiology/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: RadiologyContent }>(response)).item;
}

export async function uploadRadiologyOrganizationalChart(file: File): Promise<RadiologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/radiology/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: RadiologyContent }>(response)).item;
}
