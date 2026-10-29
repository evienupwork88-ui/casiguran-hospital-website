import { getCsrfToken } from "./auth";
import type { AdminChangeRequest } from "./admin-change-requests";

export type ContactMessageItem = {
  id: string;
  name: string;
  lastName: string | null;
  firstName: string | null;
  middleName: string | null;
  nameExtension: string | null;
  email: string | null;
  phoneNumber: string | null;
  subject: string;
  departmentTag: string;
  message: string;
  contactInfo: string;
  assignedTo: string | null;
  actionTaken: "Called" | "FB Messaged" | "Forwarded to GC" | "Done" | null;
  remarks: string;
  ipAddress: string | null;
  userAgent: string | null;
  isFlagged: boolean;
  isArchived: boolean;
  status: "new" | "read" | "flagged" | "replied" | "archived";
  createdAt: string;
  readAt: string | null;
};

export type ContactMessageNotificationSummary = {
  unreadCount: number;
  items: Pick<ContactMessageItem, "id" | "name" | "subject" | "createdAt">[];
  pendingRequestCount: number;
  changeRequests: AdminChangeRequest[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const details = Array.isArray(data?.error?.details)
      ? data.error.details
          .map((detail: { path?: string; message?: string }) => [detail.path, detail.message].filter(Boolean).join(": "))
          .filter(Boolean)
          .join("; ")
      : "";
    throw new Error(details || data?.error?.message || "Request failed");
  }
  return data as T;
}

export async function submitContactMessage(input: {
  lastName: string;
  firstName: string;
  middleName: string;
  nameExtension: string;
  contactInfo: string;
  subject: "Appointment/OPD" | "Billing/PhilHealth" | "Medical Records" | "Job/Application" | "Other";
  message: string;
  respectfulUseAccepted: true;
  website: string;
}): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ message: string }>(response);
  return data.message;
}

export async function getAdminContactMessages(): Promise<ContactMessageItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/contact-messages`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ items: ContactMessageItem[] }>(response);
  return data.items;
}

export async function getAdminContactMessageNotifications(): Promise<ContactMessageNotificationSummary> {
  const response = await fetch(`${API_BASE_URL}/api/admin/contact-messages/notifications`, {
    credentials: "include",
    cache: "no-store",
  });
  return parseJson<ContactMessageNotificationSummary>(response);
}

function csrfHeaders(): Record<string, string> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  return headers;
}

export async function markContactMessageRead(id: string): Promise<ContactMessageItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/contact-messages/${id}/read`, {
    method: "PATCH",
    credentials: "include",
    headers: csrfHeaders(),
  });
  const data = await parseJson<{ item: ContactMessageItem }>(response);
  return data.item;
}

export async function updateContactMessage(id: string, input: {
  assignedTo?: string | null;
  actionTaken?: ContactMessageItem["actionTaken"];
  remarks?: string;
  status?: ContactMessageItem["status"];
  isArchived?: boolean;
}): Promise<ContactMessageItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/contact-messages/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { ...csrfHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ item: ContactMessageItem }>(response);
  return data.item;
}

export async function getContactMessageAssignees(): Promise<{ id: string; name: string }[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/contact-messages/assignees`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ items: { id: string; name: string }[] }>(response);
  return data.items;
}
