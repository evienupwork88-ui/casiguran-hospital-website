import { getCsrfToken } from "./auth";

export const himdSections = ["admitting", "opd", "him-service"] as const;
export type HimdSection = (typeof himdSections)[number];

export const himdSectionLabels: Record<HimdSection, string> = {
  admitting: "Admitting",
  opd: "OPD",
  "him-service": "HIM Service",
};

export type HimdContent = {
  section: HimdSection;
  title: string;
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: { title: string; description: string }[];
  clinicSchedule: { clinic: string; days: string; hours: string; notes: string }[];
  organizationalStructureDescription: string;
  updatedAt: string;
  updatedBy: string | null;
};

export type HimdSlideshow = { coverImages: { url: string }[] };

type HimdContentInput = Pick<HimdContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicHimdContent(section: HimdSection): Promise<HimdContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/himd/${section}`, { cache: "no-store" });
  return (await parseJson<{ item: HimdContent }>(response)).item;
}

export async function getPublicHimdSlideshow(): Promise<HimdSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/public/himd/slideshow`, { cache: "no-store" });
  return (await parseJson<{ item: HimdSlideshow }>(response)).item;
}

export async function getAdminHimdContent(section: HimdSection): Promise<HimdContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/himd/${section}`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: HimdContent }>(response)).item;
}

export async function getAdminHimdSlideshow(): Promise<HimdSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/admin/himd/slideshow`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: HimdSlideshow }>(response)).item;
}

export async function updateHimdContent(section: HimdSection, input: HimdContentInput): Promise<HimdContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/himd/${section}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: HimdContent }>(response)).item;
}

export async function uploadHimdImages(files: File[]): Promise<HimdSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/himd/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: HimdSlideshow }>(response)).item;
}

export async function removeHimdImage(index: number): Promise<HimdSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/himd/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: HimdSlideshow }>(response)).item;
}

export async function uploadHimdOrganizationalChart(section: HimdSection, file: File): Promise<HimdContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/himd/${section}/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: HimdContent }>(response)).item;
}
