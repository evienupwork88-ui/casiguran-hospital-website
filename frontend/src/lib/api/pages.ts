export type PageItem = {
  id: string;
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
  updatedBy: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }

  return data as T;
}

export async function getPublicPages(): Promise<PageItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/pages`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ items: PageItem[] }>(response);
  return data.items;
}

export async function getPublicPage(slug: string): Promise<PageItem> {
  const response = await fetch(`${API_BASE_URL}/api/public/pages/${slug}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ item: PageItem }>(response);
  return data.item;
}

export async function getAdminPages(): Promise<PageItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/pages`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: PageItem[] }>(response);
  return data.items;
}

export async function updatePage(slug: string, input: { title: string; body: string }): Promise<PageItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/pages/${slug}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: PageItem }>(response);
  return data.item;
}
