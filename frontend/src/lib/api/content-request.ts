import { getCsrfToken } from "./auth";

export function createContentRequest(input: Record<string, unknown> & { coverImage?: File | null }) {
  const { coverImage, ...fields } = input;
  const csrfToken = getCsrfToken();
  const headers: Record<string, string> = {};
  if (csrfToken) headers["x-csrf-token"] = csrfToken;

  if (!coverImage) {
    headers["Content-Type"] = "application/json";
    return { headers, body: JSON.stringify(fields) };
  }

  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== null) body.append(key, String(value));
  }
  body.append("coverImage", coverImage);
  return { headers, body };
}
