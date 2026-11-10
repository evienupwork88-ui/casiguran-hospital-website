import type { AdminChangeRequest } from "./admin-change-requests";

export type AdminNotificationSummary = {
  pendingRequestCount: number;
  changeRequests: AdminChangeRequest[];
  rejectedChangeRequestUnreadCount: number;
  rejectedChangeRequests: AdminChangeRequest[];
  securityAlertCount: number;
  auditArchiveEnabled: boolean;
  pendingArchiveCount: number;
  securityAlertEmailEnabled: boolean;
  pendingEmailCount: number;
  approvalEmailEnabled: boolean;
  pendingApprovalEmailCount: number;
  securityAlerts: {
    id: string;
    category: "failed_authentication" | "repeated_access_denied";
    severity: "medium" | "high";
    title: string;
    summary: string;
    sourceIp: string;
    eventCount: number;
    createdAt: string;
  }[];
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getAdminNotifications(): Promise<AdminNotificationSummary> {
  const response = await fetch(`${API_BASE_URL}/api/admin/notifications`, {
    credentials: "include",
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error?.message || "Unable to load notifications.");
  return data as AdminNotificationSummary;
}
