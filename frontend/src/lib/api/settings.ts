export type SiteSettings = {
  id: number;
  address: string | null;
  phone: string | null;
  email: string | null;
  facebookUrl: string | null;
  officeHours: string | null;
  mapEmbedUrl: string | null;
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

export async function getPublicSettings(): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE_URL}/api/public/settings`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ item: SiteSettings }>(response);
  return data.item;
}

export async function getAdminSettings(): Promise<SiteSettings> {
  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ item: SiteSettings }>(response);
  return data.item;
}

export async function updateSettings(input: {
  address?: string;
  phone?: string;
  email?: string;
  facebookUrl?: string;
  officeHours?: string;
  mapEmbedUrl?: string;
}): Promise<SiteSettings> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: SiteSettings }>(response);
  return data.item;
}
