import { getCsrfToken } from "./auth";

export const billingClaimsSections = ["billing", "claims"] as const;
export type BillingClaimsSection = (typeof billingClaimsSections)[number];

export const billingClaimsLabels: Record<BillingClaimsSection, string> = {
  billing: "Billing",
  claims: "Claims",
};

export type BillingClaimsContent = {
  section: BillingClaimsSection;
  title: string;
  coverImages: { url: string }[];
  organizationalChartImageUrl: string | null;
  generalInformation: string;
  highlights: { title: string; description: string }[];
  clinicSchedule: { clinic: string; days: string; hours: string; notes: string }[];
  organizationalStructureDescription: string;
  updatedAt: string;
  updatedBy: string | null;
};

type BillingClaimsInput = Pick<BillingClaimsContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicBillingClaims(section: BillingClaimsSection): Promise<BillingClaimsContent> {
  const response = await fetch(`${API_BASE_URL}/api/public/billing-claims/${section}`, { cache: "no-store" });
  return (await parseJson<{ item: BillingClaimsContent }>(response)).item;
}

export async function getAdminBillingClaims(section: BillingClaimsSection): Promise<BillingClaimsContent> {
  const response = await fetch(`${API_BASE_URL}/api/admin/billing-claims/${section}`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: BillingClaimsContent }>(response)).item;
}

export async function updateBillingClaims(section: BillingClaimsSection, input: BillingClaimsInput): Promise<BillingClaimsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/billing-claims/${section}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });
  return (await parseJson<{ item: BillingClaimsContent }>(response)).item;
}

export async function uploadBillingClaimsImages(section: BillingClaimsSection, files: File[]): Promise<BillingClaimsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/billing-claims/${section}/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: BillingClaimsContent }>(response)).item;
}

export async function removeBillingClaimsImage(section: BillingClaimsSection, index: number): Promise<BillingClaimsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/billing-claims/${section}/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: BillingClaimsContent }>(response)).item;
}

export async function uploadBillingClaimsChart(section: BillingClaimsSection, file: File): Promise<BillingClaimsContent> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  formData.set("chartImage", file);
  const response = await fetch(`${API_BASE_URL}/api/admin/billing-claims/${section}/organizational-chart-image`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: BillingClaimsContent }>(response)).item;
}
