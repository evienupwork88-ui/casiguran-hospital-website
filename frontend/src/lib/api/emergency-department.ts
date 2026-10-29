import { getCsrfToken } from "./auth";

export type EmergencyDepartmentHighlight = {
  title: string;
  description: string;
};

export type EmergencyDepartmentSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type EmergencyDepartmentContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: EmergencyDepartmentHighlight[];
  clinicSchedule: EmergencyDepartmentSchedule[];
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

export async function getPublicEmergencyDepartment(): Promise<EmergencyDepartmentContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/emergency-department`, { cache: "no-store" });
  return (await parseJson<{ item: EmergencyDepartmentContent }>(response)).item;
}

export async function getAdminEmergencyDepartment(): Promise<EmergencyDepartmentContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/emergency-department`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: EmergencyDepartmentContent }>(response)).item;
}

export async function updateEmergencyDepartment(input: Pick<EmergencyDepartmentContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<EmergencyDepartmentContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/emergency-department`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: EmergencyDepartmentContent }>(response)).item;
}

export async function uploadEmergencyDepartmentImages(files: File[]): Promise<EmergencyDepartmentContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/emergency-department/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: EmergencyDepartmentContent }>(response)).item;
}

export async function removeEmergencyDepartmentImage(index: number): Promise<EmergencyDepartmentContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/emergency-department/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: EmergencyDepartmentContent }>(response)).item;
}

export async function uploadEmergencyDepartmentChart(file: File): Promise<EmergencyDepartmentContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/emergency-department/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: EmergencyDepartmentContent }>(response)).item;
}
