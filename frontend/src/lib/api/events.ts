export type EventItem = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string | null;
  coverImageUrl: string | null;
  status: "draft" | "published";
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }

  return data as T;
}

export async function getPublicEvents(): Promise<EventItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/events`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ items: EventItem[] }>(response);
  return data.items;
}

export async function getAdminEvents(): Promise<EventItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: EventItem[] }>(response);
  return data.items;
}

export async function createEvent(input: {
  title: string;
  description?: string;
  location?: string;
  startAt: string;
  endAt?: string;
  coverImageUrl?: string;
  status?: "draft" | "published";
}): Promise<EventItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/events`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: EventItem }>(response);
  return data.item;
}
