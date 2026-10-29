import { getCsrfToken } from "./auth";

export const RATE_FEE_CATEGORIES = {
  pharmacy: { label: "Pharmacy Pricelist", columns: ["Reg. Price", "Senior/PWD", "Discount"] },
  dental: { label: "Dental Examination", columns: ["OPD/MAIP", "PHIC"] },
  himd: { label: "HIMD Services", columns: ["Price"] },
  laboratory: { label: "Laboratory Services", columns: ["OPD/MAIP", "PHIC"] },
  radiology: { label: "Radiology Services", columns: ["Price"] },
} as const;

export type RateFeeCategory = keyof typeof RATE_FEE_CATEGORIES;

export type RateFeeItem = {
  id: string;
  category: RateFeeCategory;
  section: string | null;
  itemName: string;
  price1: string;
  price2: string;
  price3: string;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string;
};

export type RateFeeInput = Omit<RateFeeItem, "id" | "updatedAt">;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }
  return data as T;
}

export async function getPublicRateFees(): Promise<RateFeeItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/rate-fees`, { cache: "no-store" });
  const data = await parseJson<{ items: RateFeeItem[] }>(response);
  return data.items;
}

export async function getAdminRateFees(): Promise<RateFeeItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ items: RateFeeItem[] }>(response);
  return data.items;
}

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "Content-Type": "application/json", "x-csrf-token": token } : { "Content-Type": "application/json" };
}

export async function createRateFee(input: Omit<RateFeeInput, "isActive">): Promise<RateFeeItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ item: RateFeeItem }>(response);
  return data.item;
}

export async function updateRateFee(id: string, input: Partial<RateFeeInput>): Promise<RateFeeItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: csrfHeaders(),
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ item: RateFeeItem }>(response);
  return data.item;
}

export async function deleteRateFee(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: csrfHeaders(),
  });
  await parseJson<{ ok: boolean }>(response);
}
