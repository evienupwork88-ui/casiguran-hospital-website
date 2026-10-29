"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminAuditLogs, type AuditLogItem } from "@/lib/api/audit-logs";

type AuditFilter = "all" | "login" | "edits" | "password_reset" | "access_denied";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function eventLabel(eventType: AuditLogItem["eventType"]): string {
  if (eventType === "auth_event") return "Authentication";
  if (eventType === "access_denied") return "Access denied";
  return "Admin action";
}

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      setItems(await getAdminAuditLogs());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit history.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "login" && item.eventType === "auth_event" && item.action.startsWith("login")) ||
        (filter === "edits" && item.eventType === "admin_action") ||
        (filter === "password_reset" && item.eventType === "auth_event" && item.action.includes("password_reset")) ||
        (filter === "access_denied" && item.eventType === "access_denied");
      if (!matchesFilter) return false;
      if (!query) return true;

      return [
        item.actorEmail,
        item.action,
        item.route,
        item.method,
        item.ipAddress,
        item.statusCode,
        item.eventType,
      ]
        .some((value) => String(value ?? "").toLowerCase().includes(query));
    });
  }, [items, search, filter]);

  return (
    <AdminShell title="Audit History">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mb-5 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Recent admin changes, authentication events, and denied admin API requests. Request contents, passwords, and tokens are not recorded.
            </p>
            <p className="mt-1 text-xs text-slate-500">Showing {filteredItems.length} of the latest {items.length} events.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as AuditFilter)}
              aria-label="Filter audit event type"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 sm:w-44"
            >
              <option value="all">Overall</option>
              <option value="login">Login</option>
              <option value="edits">Edits</option>
              <option value="password_reset">Password reset</option>
              <option value="access_denied">Access denied</option>
            </select>
            <input
              type="search"
              maxLength={200}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter history"
              aria-label="Search audit history"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 sm:w-56"
            />
            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={isLoading}
              className="shrink-0 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 hover:bg-violet-50 disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? <div role="alert" className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {isLoading ? (
            <div role="status" aria-busy="true" className="flex flex-1 items-center justify-center p-8 text-center text-slate-600">Loading audit history...</div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-600">{items.length ? "No events match this filter." : "No audit events recorded yet."}</div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Actor</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Action / route</th>
                    <th className="px-4 py-3 font-semibold">Result</th>
                    <th className="px-4 py-3 font-semibold">IP address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.occurredAt)}</td>
                      <td className="px-4 py-3 text-slate-800">{item.actorEmail ?? "Unknown / unauthenticated"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.eventType === "access_denied" ? "bg-red-100 text-red-800"
                            : item.eventType === "auth_event" ? "bg-amber-100 text-amber-800"
                              : "bg-violet-100 text-violet-800"
                        }`}>{eventLabel(item.eventType)}</span>
                        <div className="mt-1 text-xs text-slate-500">{item.action}</div>
                      </td>
                      <td className="max-w-[420px] px-4 py-3">
                        <div className="font-medium text-slate-800">{item.method} <span className="break-all font-normal text-slate-600">{item.route}</span></div>
                        {item.userAgent ? <div title={item.userAgent} className="mt-1 max-w-sm truncate text-xs text-slate-500">{item.userAgent}</div> : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`font-semibold ${item.statusCode >= 400 ? "text-red-700" : "text-emerald-700"}`}>{item.statusCode}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{item.ipAddress ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
