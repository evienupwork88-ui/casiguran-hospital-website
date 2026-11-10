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
  category: "General Hospital Inquiry" | "Hospital Services and Facilities" | "HIMS / Medical Records" | "Employment Opportunities" | "Website Technical Concerns" | "Feedback and Suggestions" | "Other Administrative Concerns";
  message: string;
  privacyNoticeAccepted: true;
  website: string;
  turnstileToken: string;
}): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ message: string }>(response);
  return data.message;
}
