const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getBackendTime(): Promise<number> {
  const response = await fetch(`${API_BASE_URL}/api/time`, { cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message ?? "Unable to sync with the server clock.");
  const timestamp = typeof data?.timestamp === "string" ? Date.parse(data.timestamp) : Number.NaN;
  if (!Number.isFinite(timestamp)) throw new Error("The server returned an invalid clock timestamp.");
  return timestamp;
}
