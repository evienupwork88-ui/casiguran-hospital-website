export type StaffUser = {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "editor";
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }

  return data as T;
}

export async function getAdminUsers(): Promise<StaffUser[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: StaffUser[] }>(response);
  return data.items;
}

export async function createUser(input: {
  email: string;
  fullName: string;
  role?: "admin" | "editor";
  password: string;
  isActive?: boolean;
}): Promise<StaffUser> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: StaffUser }>(response);
  return data.item;
}

export async function updateUser(id: string, input: {
  email?: string;
  fullName?: string;
  role?: "admin" | "editor";
  isActive?: boolean;
  password?: string;
}): Promise<StaffUser> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: StaffUser }>(response);
  return data.item;
}

export async function deactivateUser(id: string): Promise<StaffUser> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  const data = await parseJson<{ item: StaffUser }>(response);
  return data.item;
}
