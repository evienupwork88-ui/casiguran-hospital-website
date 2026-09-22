export type DocumentItem = {
  id: string;
  title: string;
  description: string | null;
  category: "report" | "org_chart" | "policy" | "other";
  filePath: string;
  fileSize: number | null;
  mimeType: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
  viewUrl?: string | null;
  downloadUrl?: string | null;
  fileExtension?: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Request failed");
  }

  return data as T;
}

export async function getPublicDocuments(category?: string): Promise<DocumentItem[]> {
  const url = category ? `${API_BASE_URL}/api/public/documents?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/public/documents`;
  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  const data = await parseJson<{ items: DocumentItem[] }>(response);
  return data.items;
}

export async function getAdminDocuments(): Promise<DocumentItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/documents`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await parseJson<{ items: DocumentItem[] }>(response);
  return data.items;
}

export async function uploadDocument(formData: FormData): Promise<DocumentItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {};

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/documents`, {
    method: "POST",
    credentials: "include",
    headers,
    body: formData,
  });

  const data = await parseJson<{ item: DocumentItem }>(response);
  return data.item;
}

export async function updateDocument(id: string, input: Partial<{
  title: string;
  description: string;
  category: "report" | "org_chart" | "policy" | "other";
  status: "draft" | "published";
  publishedAt: string;
}>): Promise<DocumentItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/documents/${id}`, {
    method: "PUT",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: DocumentItem }>(response);
  return data.item;
}

export async function deleteDocument(id: string): Promise<void> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {};

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/documents/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });

  await parseJson<{ ok: boolean; message: string }>(response);
}

export async function createDocument(input: {
  title: string;
  description?: string;
  category?: "report" | "org_chart" | "policy" | "other";
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  status?: "draft" | "published";
  publishedAt?: string;
}): Promise<DocumentItem> {
  const csrfToken = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("cdh_csrf="));

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = decodeURIComponent(csrfToken.split("=")[1] ?? "");
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/documents/legacy`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify(input),
  });

  const data = await parseJson<{ item: DocumentItem }>(response);
  return data.item;
}

