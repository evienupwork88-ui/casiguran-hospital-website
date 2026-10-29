import { getCsrfToken } from "./auth";

export type NursingServiceHighlight = {
  title: string;
  description: string;
};

export type NursingServiceSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type NursingServiceContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: NursingServiceHighlight[];
  clinicSchedule: NursingServiceSchedule[];
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

export async function getPublicNursingService(): Promise<NursingServiceContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/nursing-service`, { cache: "no-store" });
  return (await parseJson<{ item: NursingServiceContent }>(response)).item;
}

export async function getAdminNursingService(): Promise<NursingServiceContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/nursing-service`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: NursingServiceContent }>(response)).item;
}

export async function updateNursingService(input: Pick<NursingServiceContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<NursingServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/nursing-service`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: NursingServiceContent }>(response)).item;
}

export async function uploadNursingServiceImages(files: File[]): Promise<NursingServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/nursing_service/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: NursingServiceContent }>(response)).item;
}

export async function removeNursingServiceImage(index: number): Promise<NursingServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/nursing_service/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: NursingServiceContent }>(response)).item;
}

export async function uploadNursingServiceOrganizationalChart(file: File): Promise<NursingServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/nursing_service/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: NursingServiceContent }>(response)).item;
}
