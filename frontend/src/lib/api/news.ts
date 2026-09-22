export type NewsItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.error?.message ?? "Request failed") as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return data as T;
}

export async function getPublicNews(): Promise<NewsItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/news`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ items: NewsItem[] }>(response);
  return data.items;
}

export async function getPublicNewsBySlug(slug: string): Promise<NewsItem> {
  const response = await fetch(`${API_BASE_URL}/api/public/news/${encodeURIComponent(slug)}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ item: NewsItem }>(response);
  return data.item;
}

export async function getAdminNews(): Promise<NewsItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/news`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: NewsItem[] }>(response);
  return data.items;
}

export async function createNews(input: {
  title: string;
  slug: string;
  excerpt?: string;
  body: string;
  coverImageUrl?: string;
  status?: "draft" | "published";
  publishedAt?: string;
}): Promise<NewsItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/news`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: NewsItem }>(response);
  return data.item;
}

function csrfHeaders() {
  const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("cdh_csrf="));
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  return headers;
}

export async function updateNews(id: string, input: Partial<Parameters<typeof createNews>[0]>): Promise<NewsItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/news/${id}`, { method: "PUT", credentials: "include", headers: csrfHeaders(), body: JSON.stringify(input) });
  const data = await parseJson<{ item: NewsItem }>(response);
  return data.item;
}

export async function deleteNews(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/news/${id}`, { method: "DELETE", credentials: "include", headers: csrfHeaders() });
  await parseJson<{ ok: boolean }>(response);
}
