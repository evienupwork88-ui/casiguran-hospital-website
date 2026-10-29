import { getCsrfToken } from "./auth";

export const CMS_BULK_RESOURCES = [
  "news",
  "announcements",
  "events",
  "faqs",
  "trainings",
  "rate-fees",
  "documents",
] as const;

export type CmsBulkResource = (typeof CMS_BULK_RESOURCES)[number];
export type CmsBulkResult = {
  succeeded: number;
  failures: { row: number; message: string }[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function postBatch<T>(path: string, input: unknown): Promise<T> {
  const csrfToken = getCsrfToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/cms-bulk/${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
    },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "The batch request failed.");
  return data as T;
}

export function importCmsRecords(resource: CmsBulkResource, items: Record<string, unknown>[], rowNumbers: number[]): Promise<CmsBulkResult> {
  return postBatch("import", { resource, items, rowNumbers });
}

export function bulkDeleteCmsRecords(resource: CmsBulkResource, ids: string[]): Promise<CmsBulkResult> {
  return postBatch("delete", { resource, ids });
}
