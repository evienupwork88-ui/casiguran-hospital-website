import { getCsrfToken } from "./auth";

export type DocumentItem = {
  id: string;
  title: string;
  description: string | null;
  category: "report" | "org_chart" | "policy" | "citizens_charter" | "development_plan" | "patient_rights" | "other";
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

export async function uploadDocument(
  formData: FormData,
  onProgress?: (percentage: number | null) => void,
): Promise<DocumentItem> {
  const csrfToken = getCsrfToken();

  const file = formData.get("file");
  const isOrgChartImage =
    formData.get("category") === "org_chart" &&
    file instanceof File &&
    /\.(jpe?g|png|webp|svg)$/i.test(file.name);
  const uploadPath = isOrgChartImage ? "/api/admin/documents/org-chart-image" : "/api/admin/documents";

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}${uploadPath}`);
    request.withCredentials = true;

    if (csrfToken) {
      request.setRequestHeader("x-csrf-token", csrfToken);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(Math.min(100, Math.floor((event.loaded / event.total) * 100)));
      } else {
        onProgress?.(null);
      }
    };
    request.onerror = () => reject(new Error("Network error while uploading the file."));
    request.onabort = () => reject(new Error("File upload was canceled."));
    request.onload = () => {
      let responseData: { item?: DocumentItem; error?: { message?: string } } | null;
      try {
        responseData = JSON.parse(request.responseText || "null");
      } catch {
        reject(new Error("The server returned an invalid upload response."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(responseData?.error?.message ?? "Request failed"));
        return;
      }

      if (!responseData?.item) {
        reject(new Error("The server returned an invalid upload response."));
        return;
      }

      resolve(responseData.item);
    };

    onProgress?.(0);
    request.send(formData);
  });
}

export async function updateDocument(id: string, input: Partial<{
  title: string;
  description: string;
  category: "report" | "org_chart" | "policy" | "citizens_charter" | "development_plan" | "patient_rights" | "other";
  status: "draft" | "published";
  publishedAt: string;
}>): Promise<DocumentItem> {
  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
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
  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {};

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
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
  category?: "report" | "org_chart" | "policy" | "citizens_charter" | "development_plan" | "patient_rights" | "other";
  filePath: string;
  fileSize?: number;
  mimeType?: string;
  status?: "draft" | "published";
  publishedAt?: string;
}): Promise<DocumentItem> {
  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (csrfToken) {
    headers["x-csrf-token"] = csrfToken;
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
