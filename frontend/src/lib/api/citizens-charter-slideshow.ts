import { getCsrfToken } from "./auth";

export type CitizensCharterSlideshow = { coverImages: { url: string }[] };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicCitizensCharterSlideshow(): Promise<CitizensCharterSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/public/documents/citizens-charter/slideshow`, { cache: "no-store" });
  const data = await parseJson<{ item: CitizensCharterSlideshow }>(response);
  return data.item;
}

export async function getAdminCitizensCharterSlideshow(): Promise<CitizensCharterSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/admin/documents/citizens-charter/slideshow`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ item: CitizensCharterSlideshow }>(response);
  return data.item;
}

export async function addCitizensCharterSlideshowImages(files: File[]): Promise<CitizensCharterSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/documents/citizens-charter/slideshow/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  const data = await parseJson<{ item: CitizensCharterSlideshow }>(response);
  return data.item;
}

export async function removeCitizensCharterSlideshowImage(index: number): Promise<CitizensCharterSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/documents/citizens-charter/slideshow/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  const data = await parseJson<{ item: CitizensCharterSlideshow }>(response);
  return data.item;
}
