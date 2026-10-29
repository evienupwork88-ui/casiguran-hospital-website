import { getCsrfToken } from "./auth";

export type PediatricsHighlight = {
  title: string;
  description: string;
};

export type PediatricsSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type PediatricsContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: PediatricsHighlight[];
  clinicSchedule: PediatricsSchedule[];
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

export async function getPublicPediatrics(): Promise<PediatricsContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/pediatrics`, { cache: "no-store" });
  return (await parseJson<{ item: PediatricsContent }>(response)).item;
}

export async function getAdminPediatrics(): Promise<PediatricsContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/pediatrics`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: PediatricsContent }>(response)).item;
}

export async function updatePediatrics(input: Pick<PediatricsContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<PediatricsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/pediatrics`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: PediatricsContent }>(response)).item;
}

export async function uploadPediatricsImages(files: File[]): Promise<PediatricsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/pediatrics/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: PediatricsContent }>(response)).item;
}

export async function removePediatricsImage(index: number): Promise<PediatricsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/pediatrics/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: PediatricsContent }>(response)).item;
}

export async function uploadPediatricsOrganizationalChart(file: File): Promise<PediatricsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/pediatrics/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: PediatricsContent }>(response)).item;
}
