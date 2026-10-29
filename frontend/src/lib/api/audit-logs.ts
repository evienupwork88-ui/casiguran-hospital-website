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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getAdminAuditLogs(): Promise<AuditLogItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/admin/audit-logs`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error?.message ?? "Unable to load audit history.");
  }

  return data.items as AuditLogItem[];
}
