export type ServiceItem = {
  id: string;
  name: string;
  description: string;
  department: string | null;
  iconOrImageUrl: string | null;
  displayOrder: number;
  isActive: boolean;
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

export async function getPublicServices(): Promise<ServiceItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/services`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ items: ServiceItem[] }>(response);
  return data.items;
}

export async function getAdminServices(): Promise<ServiceItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: ServiceItem[] }>(response);
  return data.items;
}

export async function createService(input: {
  name: string;
  description: string;
  department?: string;
  iconOrImageUrl?: string;
  displayOrder?: number;
  isActive?: boolean;
}): Promise<ServiceItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/services`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: ServiceItem }>(response);
  return data.item;
}

function csrfHeaders() {
  const csrfToken = document.cookie.split("; ").find((cookie) => cookie.startsWith("cdh_csrf="));
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (csrfToken) headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  return headers;
}

export async function updateService(id: string, input: Partial<Parameters<typeof createService>[0]>): Promise<ServiceItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/services/${id}`, { method: "PUT", credentials: "include", headers: csrfHeaders(), body: JSON.stringify(input) });
  const data = await parseJson<{ item: ServiceItem }>(response);
  return data.item;
}

export async function deleteService(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/services/${id}`, { method: "DELETE", credentials: "include", headers: csrfHeaders() });
  await parseJson<{ ok: boolean }>(response);
}
