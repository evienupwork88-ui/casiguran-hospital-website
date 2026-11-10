import type { Request, Response } from "express";
import {
  getAdminChangeRequestCount,
  getAdminChangeRequestEmailStatus,
  getUnreadRejectedChangeRequestCount,
  listAdminChangeRequests,
  listRejectedChangeRequestNotifications,
} from "../services/admin-change-requests.service";
import { getAdminSecurityAlertSummary } from "../services/security-monitoring.service";

export async function getAdminNotifications(req: Request, res: Response) {
  if (req.user?.role === "admin") {
    const [pendingRequestCount, changeRequests, securityAlerts, approvalEmailStatus] = await Promise.all([
      getAdminChangeRequestCount(),
      listAdminChangeRequests(5),
      getAdminSecurityAlertSummary(),
      getAdminChangeRequestEmailStatus(),
    ]);
    res.status(200).json({
      pendingRequestCount,
      changeRequests,
      rejectedChangeRequestUnreadCount: 0,
      rejectedChangeRequests: [],
      securityAlertCount: securityAlerts.count,
      securityAlerts: securityAlerts.items,
      auditArchiveEnabled: securityAlerts.auditArchiveEnabled,
      pendingArchiveCount: securityAlerts.pendingArchiveCount,
      securityAlertEmailEnabled: securityAlerts.securityAlertEmailEnabled,
      pendingEmailCount: securityAlerts.pendingEmailCount,
      approvalEmailEnabled: approvalEmailStatus.enabled,
      pendingApprovalEmailCount: approvalEmailStatus.pendingCount,
    });
    return;
  }

  const [rejectedChangeRequestUnreadCount, rejectedChangeRequests] = req.user
    ? await Promise.all([
      getUnreadRejectedChangeRequestCount(req.user.id),
      listRejectedChangeRequestNotifications(req.user.id, 5),
    ])
    : [0, []];

  res.status(200).json({
    pendingRequestCount: 0,
    changeRequests: [],
    rejectedChangeRequestUnreadCount,
    rejectedChangeRequests,
    securityAlertCount: 0,
    securityAlerts: [],
    auditArchiveEnabled: false,
    pendingArchiveCount: 0,
    securityAlertEmailEnabled: false,
    pendingEmailCount: 0,
    approvalEmailEnabled: false,
    pendingApprovalEmailCount: 0,
  });
}
