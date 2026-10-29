import { getCsrfToken } from "./auth";

export type PathologyAndLaboratoriesHighlight = {
  title: string;
  description: string;
};

export type PathologyAndLaboratoriesSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type PathologyAndLaboratoriesContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: PathologyAndLaboratoriesHighlight[];
  clinicSchedule: PathologyAndLaboratoriesSchedule[];
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

export async function getPublicPathologyAndLaboratories(): Promise<PathologyAndLaboratoriesContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/pathology-laboratories`, { cache: "no-store" });
  return (await parseJson<{ item: PathologyAndLaboratoriesContent }>(response)).item;
}

export async function getAdminPathologyAndLaboratories(): Promise<PathologyAndLaboratoriesContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/pathology-laboratories`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: PathologyAndLaboratoriesContent }>(response)).item;
}

export async function updatePathologyAndLaboratories(input: Pick<PathologyAndLaboratoriesContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<PathologyAndLaboratoriesContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/pathology-laboratories`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: PathologyAndLaboratoriesContent }>(response)).item;
}

export async function uploadPathologyAndLaboratoriesImages(files: File[]): Promise<PathologyAndLaboratoriesContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/pathology_laboratories/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: PathologyAndLaboratoriesContent }>(response)).item;
}

export async function removePathologyAndLaboratoriesImage(index: number): Promise<PathologyAndLaboratoriesContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/pathology_laboratories/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: PathologyAndLaboratoriesContent }>(response)).item;
}

export async function uploadPathologyAndLaboratoriesOrganizationalChart(file: File): Promise<PathologyAndLaboratoriesContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/pathology_laboratories/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: PathologyAndLaboratoriesContent }>(response)).item;
}
