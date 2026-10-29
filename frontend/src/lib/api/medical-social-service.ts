import { getCsrfToken } from "./auth";

export type MedicalSocialServiceHighlight = {
  title: string;
  description: string;
};

export type MedicalSocialServiceSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type MedicalSocialServiceContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: MedicalSocialServiceHighlight[];
  clinicSchedule: MedicalSocialServiceSchedule[];
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

export async function getPublicMedicalSocialService(): Promise<MedicalSocialServiceContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/medical-social-service`, { cache: "no-store" });
  return (await parseJson<{ item: MedicalSocialServiceContent }>(response)).item;
}

export async function getAdminMedicalSocialService(): Promise<MedicalSocialServiceContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/medical-social-service`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: MedicalSocialServiceContent }>(response)).item;
}

export async function updateMedicalSocialService(input: Pick<MedicalSocialServiceContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<MedicalSocialServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/medical-social-service`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: MedicalSocialServiceContent }>(response)).item;
}

export async function uploadMedicalSocialServiceImages(files: File[]): Promise<MedicalSocialServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/medical-social-service/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: MedicalSocialServiceContent }>(response)).item;
}

export async function removeMedicalSocialServiceImage(index: number): Promise<MedicalSocialServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/medical-social-service/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: MedicalSocialServiceContent }>(response)).item;
}

export async function uploadMedicalSocialServiceOrganizationalChart(file: File): Promise<MedicalSocialServiceContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/medical-social-service/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: MedicalSocialServiceContent }>(response)).item;
}
