import { getCsrfToken } from "./auth";

export type NutritionAndDieteticsHighlight = {
  title: string;
  description: string;
};

export type NutritionAndDieteticsSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type NutritionAndDieteticsContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: NutritionAndDieteticsHighlight[];
  clinicSchedule: NutritionAndDieteticsSchedule[];
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

export async function getPublicNutritionAndDietetics(): Promise<NutritionAndDieteticsContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/nutrition-and-dietetics`, { cache: "no-store" });
  return (await parseJson<{ item: NutritionAndDieteticsContent }>(response)).item;
}

export async function getAdminNutritionAndDietetics(): Promise<NutritionAndDieteticsContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/nutrition-and-dietetics`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: NutritionAndDieteticsContent }>(response)).item;
}

export async function updateNutritionAndDietetics(input: Pick<NutritionAndDieteticsContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<NutritionAndDieteticsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/nutrition-and-dietetics`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: NutritionAndDieteticsContent }>(response)).item;
}

export async function uploadNutritionAndDieteticsImages(files: File[]): Promise<NutritionAndDieteticsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/nutrition-and-dietetics/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: NutritionAndDieteticsContent }>(response)).item;
}

export async function removeNutritionAndDieteticsImage(index: number): Promise<NutritionAndDieteticsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/nutrition-and-dietetics/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: NutritionAndDieteticsContent }>(response)).item;
}

export async function uploadNutritionAndDieteticsOrganizationalChart(file: File): Promise<NutritionAndDieteticsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/nutrition-and-dietetics/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: NutritionAndDieteticsContent }>(response)).item;
}
