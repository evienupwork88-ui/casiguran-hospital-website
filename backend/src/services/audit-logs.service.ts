import { supabase } from "../config/supabase";

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

type AuditLogInput = Omit<AuditLogItem, "id" | "occurredAt">;

function mapAuditLog(row: Record<string, unknown>): AuditLogItem {
  return {
    id: String(row.id),
    actorId: typeof row.actor_id === "string" ? row.actor_id : null,
    actorEmail: typeof row.actor_email === "string" ? row.actor_email : null,
    eventType: row.event_type as AuditLogItem["eventType"],
    action: String(row.action),
    method: String(row.method),
    route: String(row.route),
    statusCode: Number(row.status_code),
    ipAddress: typeof row.ip_address === "string" ? row.ip_address : null,
    userAgent: typeof row.user_agent === "string" ? row.user_agent : null,
    occurredAt: String(row.occurred_at),
  };
}

export async function createAuditLog(input: AuditLogInput): Promise<void> {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actorId,
    actor_email: input.actorEmail,
    event_type: input.eventType,
    action: input.action,
    method: input.method,
    route: input.route,
    status_code: input.statusCode,
    ip_address: input.ipAddress,
    user_agent: input.userAgent,
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
}

export async function listAuditLogs(limit = 100): Promise<AuditLogItem[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, actor_id, actor_email, event_type, action, method, route, status_code, ip_address, user_agent, occurred_at")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load audit logs: ${error.message}`);
  }

  return (data ?? []).map((row) => mapAuditLog(row as Record<string, unknown>));
}
