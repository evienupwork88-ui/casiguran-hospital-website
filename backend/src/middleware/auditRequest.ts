import type { NextFunction, Request, Response } from "express";
import { createAuditLog } from "../services/audit-logs.service";

const authActions: Record<string, string> = {
  "/api/auth/login": "login",
  "/api/auth/logout": "logout",
  "/api/auth/forgot-password": "password_reset_requested",
  "/api/auth/reset-password": "password_reset_completed",
};

function getAuditDetails(req: Request, statusCode: number) {
  const method = req.method.toUpperCase();
  const route = req.originalUrl.split("?")[0].slice(0, 500);
  const authAction = method === "POST" ? authActions[route] : undefined;
  const isAdminRoute = route.startsWith("/api/admin/");
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  if (authAction) {
    return {
      eventType: "auth_event" as const,
      action: statusCode >= 400 ? `${authAction}_failed` : authAction,
      method,
      route,
    };
  }

  if (!isAdminRoute) return null;

  if (statusCode === 401 || statusCode === 403) {
    return { eventType: "access_denied" as const, action: "admin_access_denied", method, route };
  }

  if (isMutation) {
    const operation = method === "POST" ? "create" : method === "DELETE" ? "delete" : "update";
    const resource = route.split("/")[3] || "unknown";
    return {
      eventType: "admin_action" as const,
      action: statusCode >= 400 ? `${resource}.${operation}_failed` : `${resource}.${operation}`,
      method,
      route,
    };
  }

  return null;
}

export function auditRequest(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    const details = getAuditDetails(req, res.statusCode);
    if (!details) return;

    void createAuditLog({
      ...details,
      actorId: req.user?.id ?? null,
      actorEmail: req.user?.email ?? null,
      statusCode: res.statusCode,
      ipAddress: (req.ip ?? req.socket.remoteAddress)?.slice(0, 64) ?? null,
      userAgent: req.get("user-agent")?.slice(0, 500) ?? null,
    }).catch((error: unknown) => {
      console.error("[audit log write failed]", error);
    });
  });

  next();
}
