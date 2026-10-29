import { getCsrfToken } from "./auth";

export type GeneralMedicineHighlight = {
  title: string;
  description: string;
};

export type GeneralMedicineSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type GeneralMedicineContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: GeneralMedicineHighlight[];
  clinicSchedule: GeneralMedicineSchedule[];
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

export async function getPublicGeneralMedicine(): Promise<GeneralMedicineContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/general-medicine`, { cache: "no-store" });
  return (await parseJson<{ item: GeneralMedicineContent }>(response)).item;
}

export async function getAdminGeneralMedicine(): Promise<GeneralMedicineContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/general-medicine`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: GeneralMedicineContent }>(response)).item;
}

export async function updateGeneralMedicine(input: Pick<GeneralMedicineContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<GeneralMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/general-medicine`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: GeneralMedicineContent }>(response)).item;
}

export async function uploadGeneralMedicineImages(files: File[]): Promise<GeneralMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/general-medicine/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: GeneralMedicineContent }>(response)).item;
}

export async function removeGeneralMedicineImage(index: number): Promise<GeneralMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/general-medicine/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: GeneralMedicineContent }>(response)).item;
}

export async function uploadGeneralMedicineOrganizationalChart(file: File): Promise<GeneralMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/general-medicine/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: GeneralMedicineContent }>(response)).item;
}
