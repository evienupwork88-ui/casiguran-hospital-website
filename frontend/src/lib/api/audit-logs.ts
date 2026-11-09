export type AuditLogItem = {
  id: string;
  actorId: string | null;
  actorEmail: string | null;
  eventType: "admin_action" | "auth_event" | "access_denied";
  action: string;
  method: string;
  route: string;
  statusCode: number;
  ipAddress: string | null;
  userAgent: string | null;
  occurredAt: string;
};

export type AuditMonthlyStats = {
  month: string;
  total: number;
  adminActions: number;
  authEvents: number;
  accessDenied: number;
  failures: number;
  authFailures: number;
  unauthorizedResponses: number;
  forbiddenResponses: number;
  otherClientErrors: number;
  serverErrors: number;
  daily: Array<{ date: string; count: number }>;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getApiError(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);
  return data?.error?.message ?? fallback;
}

export async function getAdminAuditLogs(month: string): Promise<AuditLogItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs?month=${encodeURIComponent(month)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getApiError(response, "Unable to load audit history."));
  }

  const data = await response.json();
  return data.items as AuditLogItem[];
}

export async function getAdminAuditMonthlyStats(month: string): Promise<AuditMonthlyStats> {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs/stats?month=${encodeURIComponent(month)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getApiError(response, "Unable to load audit statistics."));
  }
  const data = await response.json();
  return data.stats as AuditMonthlyStats;
}

export async function downloadAdminAuditLogsPdf(month: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs/export?month=${encodeURIComponent(month)}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(await getApiError(response, "Unable to export audit history as PDF."));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `audit-history-${month}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
