import { getCsrfToken } from "./auth";

export type TrainingItem = {
  id: string;
  title: string;
  description: string;
  externalUrl: string | null;
  imageUrl: string | null;
  status: "draft" | "published";
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Request failed");
  return data as T;
}

function csrfHeaders(): Record<string, string> {
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  return headers;
}

export async function getPublicTrainings(): Promise<TrainingItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/trainings`, { cache: "no-store" });
  const data = await parseJson<{ items: TrainingItem[] }>(response);
  return data.items;
}

export async function getAdminTrainings(): Promise<TrainingItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/trainings`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await parseJson<{ items: TrainingItem[] }>(response);
  return data.items;
}

export async function createTraining(formData: FormData): Promise<TrainingItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/trainings`, {
    method: "POST",
    credentials: "include",
    headers: csrfHeaders(),
    body: formData,
  });
  const data = await parseJson<{ item: TrainingItem }>(response);
  return data.item;
}

export async function updateTraining(id: string, formData: FormData): Promise<TrainingItem> {
  const response = await fetch(`${API_BASE_URL}/api/admin/trainings/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: csrfHeaders(),
    body: formData,
  });
  const data = await parseJson<{ item: TrainingItem }>(response);
  return data.item;
}

export async function deleteTraining(id: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/trainings/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: csrfHeaders(),
  });
  await parseJson<{ ok: boolean }>(response);
}
