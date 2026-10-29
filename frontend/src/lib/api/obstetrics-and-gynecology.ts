import { getCsrfToken } from "./auth";

export type ObstetricsAndGynecologyHighlight = {
  title: string;
  description: string;
};

export type ObstetricsAndGynecologySchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type ObstetricsAndGynecologyContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: ObstetricsAndGynecologyHighlight[];
  clinicSchedule: ObstetricsAndGynecologySchedule[];
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

export async function getPublicObstetricsAndGynecology(): Promise<ObstetricsAndGynecologyContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/obstetrics-and-gynecology`, { cache: "no-store" });
  return (await parseJson<{ item: ObstetricsAndGynecologyContent }>(response)).item;
}

export async function getAdminObstetricsAndGynecology(): Promise<ObstetricsAndGynecologyContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/obstetrics-and-gynecology`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: ObstetricsAndGynecologyContent }>(response)).item;
}

export async function updateObstetricsAndGynecology(input: Pick<ObstetricsAndGynecologyContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<ObstetricsAndGynecologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/obstetrics-and-gynecology`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: ObstetricsAndGynecologyContent }>(response)).item;
}

export async function uploadObstetricsAndGynecologyImages(files: File[]): Promise<ObstetricsAndGynecologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/obstetrics-and-gynecology/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: ObstetricsAndGynecologyContent }>(response)).item;
}

export async function removeObstetricsAndGynecologyImage(index: number): Promise<ObstetricsAndGynecologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/obstetrics-and-gynecology/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: ObstetricsAndGynecologyContent }>(response)).item;
}

export async function uploadObstetricsAndGynecologyOrganizationalChart(file: File): Promise<ObstetricsAndGynecologyContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/obstetrics-and-gynecology/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: ObstetricsAndGynecologyContent }>(response)).item;
}
