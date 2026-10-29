import { getCsrfToken } from "./auth";

export type KeyOfficialItem = {
  id: string;
  slug: "chief-of-hospital" | "medical-service" | "nursing-services" | "out-patient-service";
  name: string;
  firstName: string;
  middleName: string;
  lastName: string;
  nameExtension: string;
  position: string;
  officialPosition: string | null;
  photoUrl: string | null;
  displayOrder: number;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicKeyOfficials(): Promise<KeyOfficialItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/key-officials`, { cache: "no-store" });
  const data = await parseJson<{ items: KeyOfficialItem[] }>(response);
  return data.items;
}

export async function getAdminKeyOfficials(): Promise<KeyOfficialItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/key-officials`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ items: KeyOfficialItem[] }>(response);
  return data.items;
}

export async function updateKeyOfficial(slug: KeyOfficialItem["slug"], formData: FormData): Promise<KeyOfficialItem> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  const response = await fetch(`${API_BASE_URL}/api/admin/key-officials/${slug}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: formData,
  });
  const data = await parseJson<{ item: KeyOfficialItem }>(response);
  return data.item;
}
