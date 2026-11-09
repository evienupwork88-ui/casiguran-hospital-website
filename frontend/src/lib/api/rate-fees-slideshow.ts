import { getCsrfToken } from "./auth";

export type RateFeesSlideshow = { coverImages: { url: string }[] };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicRateFeesSlideshow(): Promise<RateFeesSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/public/rate-fees/slideshow`, { cache: "no-store" });
  return (await parseJson<{ item: RateFeesSlideshow }>(response)).item;
}

export async function getAdminRateFeesSlideshow(): Promise<RateFeesSlideshow> {
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees/slideshow`, {
    credentials: "include",
    cache: "no-store",
  });
  return (await parseJson<{ item: RateFeesSlideshow }>(response)).item;
}

export async function addRateFeesSlideshowImages(files: File[]): Promise<RateFeesSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees/slideshow/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: RateFeesSlideshow }>(response)).item;
}

export async function removeRateFeesSlideshowImage(index: number): Promise<RateFeesSlideshow> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/rate-fees/slideshow/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: RateFeesSlideshow }>(response)).item;
}
