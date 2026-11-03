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

export type KeyOfficialsSlideshow = { coverImages: { url: string }[] };

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

export async function getPublicKeyOfficialsSlideshow(): Promise<KeyOfficialsSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/public/key-officials/slideshow`, { cache: "no-store" });
  const data = await parseJson<{ item: KeyOfficialsSlideshow }>(response);
  return data.item;
}

export async function getAdminKeyOfficials(): Promise<KeyOfficialItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/key-officials`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ items: KeyOfficialItem[] }>(response);
  return data.items;
}

export async function getAdminKeyOfficialsSlideshow(): Promise<KeyOfficialsSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/admin/key-officials/slideshow`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ item: KeyOfficialsSlideshow }>(response);
  return data.item;
}

export async function addKeyOfficialsSlideshowImages(files: File[]): Promise<KeyOfficialsSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/key-officials/slideshow/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  const data = await parseJson<{ item: KeyOfficialsSlideshow }>(response);
  return data.item;
}

export async function removeKeyOfficialsSlideshowImage(index: number): Promise<KeyOfficialsSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/key-officials/slideshow/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  const data = await parseJson<{ item: KeyOfficialsSlideshow }>(response);
  return data.item;
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
