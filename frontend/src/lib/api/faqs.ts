import { getCsrfToken } from "./auth";

export const FAQ_CATEGORIES = ["Patient Care", "Billing & PhilHealth", "Documents", "Emergency", "General"] as const;
export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: FaqCategory;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "FAQ request failed.");
  return data as T;
}

export async function getPublicFaqs(): Promise<FaqItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/faqs?active=true`);
  const data = await parseJson<{ items: FaqItem[] }>(response);
  return data.items;
}

export async function getAdminFaqs(): Promise<FaqItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs`, { credentials: "include", cache: "no-store" });
  const data = await parseJson<{ items: FaqItem[] }>(response);
  return data.items;
}

function csrfHeaders(): Record<string, string> {
  const csrfToken = getCsrfToken();
  return { "Content-Type": "application/json", ...(csrfToken ? { "x-csrf-token": csrfToken } : {}) };
}

export async function saveFaq(input: Partial<Omit<FaqItem, "id" | "createdAt" | "updatedAt" | "updatedBy">>, id?: string): Promise<FaqItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs${id ? `/${id}` : ""}`, {
    method: id ? "PUT" : "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ item: FaqItem }>(response);
  return data.item;
}

export async function archiveFaq(id: string): Promise<FaqItem> {
  const token = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/faqs/${id}/archive`, {
    method: "PATCH",
    credentials: "include",
    headers: token ? { "x-csrf-token": token } : {},
  });
  const data = await parseJson<{ item: FaqItem }>(response);
  return data.item;
}
