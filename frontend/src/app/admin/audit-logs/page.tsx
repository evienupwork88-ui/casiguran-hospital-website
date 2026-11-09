"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  downloadAdminAuditLogsPdf,
  getAdminAuditLogs,
  getAdminAuditMonthlyStats,
  type AuditLogItem,
  type AuditMonthlyStats,
} from "@/lib/api/audit-logs";

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

function currentManilaMonth(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

function dayLabel(date: string): string {
  return String(Number(date.slice(-2)));
}

export default function AdminAuditLogsPage() {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditMonthlyStats | null>(null);
  const [month, setMonth] = useState(currentManilaMonth);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const [logs, monthlyStats] = await Promise.all([
        getAdminAuditLogs(month),
        getAdminAuditMonthlyStats(month),
      ]);
      setItems(logs);
      setStats(monthlyStats);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load audit history.");
    } finally {
      setIsLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  async function exportMonth() {
    setIsExporting(true);
    setError("");
    try {
      await downloadAdminAuditLogsPdf(month);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to export audit history.");
    } finally {
      setIsExporting(false);
    }
  }

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
              Admin changes, authentication events, and denied admin API requests. Responses are grouped by status; 4xx and 5xx errors are not automatically signs of an attack. Request contents, passwords, and tokens are not recorded.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Showing {filteredItems.length} of {items.length} loaded events for {month}{stats && stats.total > items.length ? `; newest 100 of ${stats.total}` : ""}.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="audit-month">Audit month</label>
            <input
              id="audit-month"
              type="month"
              value={month}
              max={currentManilaMonth()}
              onChange={(event) => {
                if (event.target.value) {
                  setMonth(event.target.value);
                  setSearch("");
                  setFilter("all");
                }
              }}
              aria-label="Select audit month"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-violet-500 sm:w-44"
            />
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
            <button
              type="button"
              onClick={() => void exportMonth()}
              disabled={isLoading || isExporting || !stats?.total}
              className="shrink-0 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Export monthly PDF"}
            </button>
          </div>
        </div>

        {error ? <div role="alert" className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        {stats ? (
          <section aria-label={`${month} audit statistics`} className="mb-5 shrink-0 space-y-4">
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
              {[
                { label: "Total events", value: stats.total, tone: "text-slate-900" },
                { label: "Auth failures", value: stats.authFailures, tone: "text-amber-800" },
                { label: "HTTP 401", value: stats.unauthorizedResponses, tone: "text-red-700" },
                { label: "HTTP 403", value: stats.forbiddenResponses, tone: "text-orange-700" },
                { label: "Other 4xx", value: stats.otherClientErrors, tone: "text-slate-700" },
                { label: "HTTP 5xx", value: stats.serverErrors, tone: "text-rose-700" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className={`mt-1 text-2xl font-bold ${stat.tone}`}>{stat.value.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Daily activity</h2>
                    <p className="mt-1 text-xs text-slate-500">Events by day, Manila time</p>
                  </div>
                  <span className="text-xs text-slate-500">Peak: {Math.max(0, ...stats.daily.map((day) => day.count))}</span>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <svg
                    role="img"
                    aria-label={`Daily audit events for ${month}`}
                    viewBox={`0 0 ${Math.max(stats.daily.length * 18, 360)} 150`}
                    className="h-36"
                    style={{ width: `${Math.max(stats.daily.length * 18, 360)}px` }}
                    preserveAspectRatio="none"
                  >
                    <line x1="0" y1="118" x2={Math.max(stats.daily.length * 18, 360)} y2="118" stroke="#cbd5e1" strokeWidth="1" />
                    {stats.daily.map((day, index) => {
                      const maxCount = Math.max(1, ...stats.daily.map((entry) => entry.count));
                      const height = day.count ? Math.max(3, (day.count / maxCount) * 92) : 0;
                      const x = index * 18 + 4;
                      return (
                        <g key={day.date}>
                          <title>{`${day.date}: ${day.count} events`}</title>
                          <rect x={x} y={118 - height} width="10" height={height} rx="3" fill="#6d28d9" />
                          {(index === 0 || (index + 1) % 5 === 0 || index === stats.daily.length - 1) ? (
                            <text x={x + 5} y="140" textAnchor="middle" fill="#64748b" fontSize="9">{dayLabel(day.date)}</text>
                          ) : null}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Event breakdown</h2>
                <p className="mt-1 text-xs text-slate-500">Only failed sign-in/MFA and denied requests are security signals.</p>
                <div className="mt-4 space-y-4">
                  {[
                    { label: "Admin actions", value: stats.adminActions, color: "bg-violet-600" },
                    { label: "Authentication events", value: stats.authEvents, color: "bg-amber-500" },
                    { label: "Access denied", value: stats.accessDenied, color: "bg-red-600" },
                    { label: "Other 4xx responses", value: stats.otherClientErrors, color: "bg-slate-400" },
                    { label: "5xx responses", value: stats.serverErrors, color: "bg-rose-500" },
                  ].map((entry) => (
                    <div key={entry.label}>
                      <div className="mb-1 flex justify-between gap-3 text-xs">
                        <span className="text-slate-600">{entry.label}</span>
                        <span className="font-semibold text-slate-800">{entry.value.toLocaleString()}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${entry.color}`}
                          style={{ width: `${stats.total ? Math.max(entry.value ? 2 : 0, (entry.value / stats.total) * 100) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}

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
