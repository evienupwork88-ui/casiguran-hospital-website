import { getCsrfToken } from "./auth";

export type HomeGallery = { images: { url: string }[] };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

export async function getPublicHomeGallery(): Promise<HomeGallery> {
  const response = await fetch(`${API_BASE_URL}/api/public/home-gallery`, { cache: "no-store" });
  return (await parseJson<{ item: HomeGallery }>(response)).item;
}

export async function getAdminHomeGallery(): Promise<HomeGallery> {
  const response = await fetch(`${API_BASE_URL}/api/admin/home-gallery`, { credentials: "include", cache: "no-store" });
  return (await parseJson<{ item: HomeGallery }>(response)).item;
}

export async function uploadHomeGalleryImages(files: File[]): Promise<HomeGallery> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const response = await fetch(`${API_BASE_URL}/api/admin/home-gallery/images`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });
  return (await parseJson<{ item: HomeGallery }>(response)).item;
}

export async function removeHomeGalleryImage(index: number): Promise<HomeGallery> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/home-gallery/images/${index}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
  return (await parseJson<{ item: HomeGallery }>(response)).item;
}

export async function reorderHomeGalleryImages(order: number[]): Promise<HomeGallery> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = await fetch(`${API_BASE_URL}/api/admin/home-gallery/images/order`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify({ order }),
  });
  return (await parseJson<{ item: HomeGallery }>(response)).item;
}
