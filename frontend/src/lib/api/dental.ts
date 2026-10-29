import { getCsrfToken } from "./auth";

export type DentalHighlight = {
  title: string;
  description: string;
};

export type DentalSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type DentalContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: DentalHighlight[];
  clinicSchedule: DentalSchedule[];
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

export async function getPublicDental(): Promise<DentalContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/dental`, { cache: "no-store" });
  return (await parseJson<{ item: DentalContent }>(response)).item;
}

export async function getAdminDental(): Promise<DentalContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/dental`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: DentalContent }>(response)).item;
}

export async function updateDental(input: Pick<DentalContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<DentalContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/dental`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: DentalContent }>(response)).item;
}

export async function uploadDentalImages(files: File[]): Promise<DentalContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/dental/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: DentalContent }>(response)).item;
}

export async function removeDentalImage(index: number): Promise<DentalContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/dental/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: DentalContent }>(response)).item;
}

export async function uploadDentalOrganizationalChart(file: File): Promise<DentalContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/dental/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: DentalContent }>(response)).item;
}
