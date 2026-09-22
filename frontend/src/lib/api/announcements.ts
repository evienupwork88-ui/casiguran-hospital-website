export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  priority: "normal" | "urgent";
  status: "draft" | "published";
  publishAt: string | null;
  expiresAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }

  return data as T;
}

export async function getPublicAnnouncements(): Promise<AnnouncementItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/announcements`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ items: AnnouncementItem[] }>(response);
  return data.items;
}

export async function getAdminAnnouncements(): Promise<AnnouncementItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/announcements`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: AnnouncementItem[] }>(response);
  return data.items;
}

export async function createAnnouncement(input: {
  title: string;
  body: string;
  priority?: "normal" | "urgent";
  status?: "draft" | "published";
  publishAt?: string;
  expiresAt?: string;
}): Promise<AnnouncementItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/announcements`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: AnnouncementItem }>(response);
  return data.item;
}

function csrfHeaders() {
  const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("cdh_csrf="));
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  return headers;
}

export async function updateAnnouncement(id: string, input: Partial<Parameters<typeof createAnnouncement>[0]>): Promise<AnnouncementItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/announcements/${id}`, { method: "PUT", credentials: "include", headers: csrfHeaders(), body: JSON.stringify(input) });
  const data = await parseJson<{ item: AnnouncementItem }>(response);
  return data.item;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/announcements/${id}`, { method: "DELETE", credentials: "include", headers: csrfHeaders() });
  await parseJson<{ ok: boolean }>(response);
}
