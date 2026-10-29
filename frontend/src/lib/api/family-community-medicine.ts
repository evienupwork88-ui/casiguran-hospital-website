import { getCsrfToken } from "./auth";

export type FamilyCommunityMedicineHighlight = {
  title: string;
  description: string;
};

export type FamilyCommunityMedicineSchedule = {
  clinic: string;
  days: string;
  hours: string;
  notes: string;
};

export type FamilyCommunityMedicineContent = {
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: FamilyCommunityMedicineHighlight[];
  clinicSchedule: FamilyCommunityMedicineSchedule[];
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

export async function getPublicFamilyCommunityMedicine(): Promise<FamilyCommunityMedicineContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/family-community-medicine`, { cache: "no-store" });
  return (await parseJson<{ item: FamilyCommunityMedicineContent }>(response)).item;
}

export async function getAdminFamilyCommunityMedicine(): Promise<FamilyCommunityMedicineContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/family-community-medicine`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: FamilyCommunityMedicineContent }>(response)).item;
}

export async function updateFamilyCommunityMedicine(input: Pick<FamilyCommunityMedicineContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">): Promise<FamilyCommunityMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/family-community-medicine`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: FamilyCommunityMedicineContent }>(response)).item;
}

export async function uploadFamilyCommunityMedicineImages(files: File[]): Promise<FamilyCommunityMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/family-community-medicine/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: FamilyCommunityMedicineContent }>(response)).item;
}

export async function removeFamilyCommunityMedicineImage(index: number): Promise<FamilyCommunityMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/family-community-medicine/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: FamilyCommunityMedicineContent }>(response)).item;
}

export async function uploadFamilyCommunityMedicineOrganizationalChart(file: File): Promise<FamilyCommunityMedicineContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/family-community-medicine/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: FamilyCommunityMedicineContent }>(response)).item;
}
