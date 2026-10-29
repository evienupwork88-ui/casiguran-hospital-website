import { getCsrfToken } from "./auth";

export type OpdHighlight = {
  title: string;
  description: string;
};

export type OpdClinicSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type OpdContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: OpdHighlight[];
  clinicSchedule: OpdClinicSchedule[];
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

export async function getPublicOpd(): Promise<OpdContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/opd`, { cache: "no-store" });
  const data = await parseJson<{ item: OpdContent }>(response);
  return data.item;
}

export async function getAdminOpd(): Promise<OpdContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/opd`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ item: OpdContent }>(response);
  return data.item;
}

export async function updateOpd(input: Pick<OpdContent,
  "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription"
>): Promise<OpdContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const response = await fetch(`${API_BASE_URL}/api/admin/opd`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ item: OpdContent }>(response);
  return data.item;
}

export async function uploadOpdImages(files: File[]): Promise<OpdContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await fetch(`${API_BASE_URL}/api/admin/opd/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  const data = await parseJson<{ item: OpdContent }>(response);
  return data.item;
}

export async function removeOpdImage(index: number): Promise<OpdContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/opd/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  const data = await parseJson<{ item: OpdContent }>(response);
  return data.item;
}

export async function uploadOpdOrganizationalChart(file: File): Promise<OpdContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/opd/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  const data = await parseJson<{ item: OpdContent }>(response);
  return data.item;
}
