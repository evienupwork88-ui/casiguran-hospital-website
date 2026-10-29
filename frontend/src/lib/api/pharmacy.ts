import { getCsrfToken } from "./auth";

export type PharmacyHighlight = {
  title: string;
  description: string;
};

export type PharmacySchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type PharmacyContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: PharmacyHighlight[];
  clinicSchedule: PharmacySchedule[];
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

export async function getPublicPharmacy(): Promise<PharmacyContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/pharmacy`, { cache: "no-store" });
  return (await parseJson<{ item: PharmacyContent }>(response)).item;
}

export async function getAdminPharmacy(): Promise<PharmacyContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/pharmacy`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: PharmacyContent }>(response)).item;
}

export async function updatePharmacy(input: Pick<PharmacyContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<PharmacyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/pharmacy`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: PharmacyContent }>(response)).item;
}

export async function uploadPharmacyImages(files: File[]): Promise<PharmacyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/pharmacy/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: PharmacyContent }>(response)).item;
}

export async function removePharmacyImage(index: number): Promise<PharmacyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/pharmacy/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: PharmacyContent }>(response)).item;
}

export async function uploadPharmacyOrganizationalChart(file: File): Promise<PharmacyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/pharmacy/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: PharmacyContent }>(response)).item;
}
