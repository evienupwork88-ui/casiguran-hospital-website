import { getCsrfToken } from "./auth";

export type AdminChangeRequest = {
  id: string;
  requesterId: string;
  requesterName: string;
  resource: string;
  action: string;
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  requestPath: string;
  contentType: string | null;
  requestBody: Record<string, unknown>;
  files: { fieldName: string; originalName: string; mimeType: string; size: number }[];
  status: "pending" | "approved" | "rejected" | "applying" | "applied";
  rejectionReason: string | null;
  applicationError: string | null;
  createdAt: string;
  decidedAt: string | null;
  appliedAt: string | null;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Approval request failed.");
  return data as T;
}

function csrfHeaders(): Record<string, string> {
  const token = getCsrfToken();
  return token ? { "x-csrf-token": token } : {};
}

export async function approveAndApplyChangeRequest(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/change-requests/${id}/approve`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
  });
  const { item } = await parseJson<{ item: AdminChangeRequest }>(response);
  const headers: Record<string, string> = {
    ...csrfHeaders(),
    "x-admin-change-request-id": item.id,
  };
  let body: BodyInit | undefined;

  if (item.contentType?.startsWith("multipart/form-data")) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(item.requestBody)) {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === "string" ? value : JSON.stringify(value));
      }
    }

    for (const [index, file] of item.files.entries()) {
      const fileResponse = await fetch(`${API_BASE_URL}/api/admin/change-requests/${item.id}/files/${index}`, {
        credentials: "include",
        cache: "no-store",
      });
      if (!fileResponse.ok) throw new Error("Unable to retrieve a staged file for approval.");
      const blob = await fileResponse.blob();
      formData.append(file.fieldName, new File([blob], file.originalName, { type: file.mimeType }));
    }
    body = formData;
  } else if (item.contentType?.includes("application/json")) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(item.requestBody);
  } else if (item.contentType?.includes("application/x-www-form-urlencoded")) {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(item.requestBody)) {
      if (value !== undefined && value !== null) formData.append(key, typeof value === "string" ? value : JSON.stringify(value));
    }
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = formData;
  } else if (item.method !== "DELETE") {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(item.requestBody);
  }

  const applyResponse = await fetch(`${API_BASE_URL}${item.requestPath}`, {
    method: item.method,
    credentials: "include",
    headers,
    body,
  });
  if (!applyResponse.ok) {
    const data = await applyResponse.json().catch(() => null);
    throw new Error(data?.error?.message ?? "Approval was recorded, but applying the change failed.");
  }
}

export async function rejectChangeRequest(id: string, reason: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/change-requests/${id}/reject`, {
    method: "POST",
    credentials: "include",
    headers: { ...csrfHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  await parseJson<{ item: AdminChangeRequest }>(response);
}
