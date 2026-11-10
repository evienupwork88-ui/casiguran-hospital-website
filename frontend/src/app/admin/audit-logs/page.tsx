"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  downloadAdminAuditLogsPdf,
  getAdminAuditLogs,
  getAdminAuditMonthlyStats,
  getAvailableAuditMonths,
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
  const [availableMonths, setAvailableMonths] = useState<string[]>([currentManilaMonth()]);
  const [month, setMonth] = useState(currentManilaMonth);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AuditFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");

  const monthOptions = useMemo(() => {
    const merged = new Set([...availableMonths, month, currentManilaMonth()]);
    return [...merged].sort((a, b) => b.localeCompare(a));
  }, [availableMonths, month]);

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
    void getAvailableAuditMonths()
      .then((months) => {
        const normalized = months.filter((value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
        setAvailableMonths(normalized.length ? normalized : [currentManilaMonth()]);
      })
      .catch(() => {
        setAvailableMonths([currentManilaMonth()]);
      });
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  async function exportMonth() {
    setIsExporting(true);
    setError("");
    try {
      const requestedMonth = window.prompt(
        `Select month to export (YYYY-MM)\nAvailable months: ${monthOptions.join(", ")}`,
        month,
      );
      if (!requestedMonth) {
        return;
      }
      const normalizedMonth = requestedMonth.trim();
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(normalizedMonth)) {
        throw new Error("Use YYYY-MM format, for example 2026-10.");
      }
      if (!monthOptions.includes(normalizedMonth)) {
        throw new Error(`No audit history found for ${normalizedMonth}. Choose one of: ${monthOptions.join(", ")}`);
      }
      await downloadAdminAuditLogsPdf(normalizedMonth);
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

  const maxDailyCount = Math.max(1, ...(stats?.daily.map((day) => day.count) ?? []));
  const dailyChartWidth = Math.max((stats?.daily.length ?? 0) * 18 + 42, 390);
  const adminActionPercent = stats?.total ? (stats.adminActions / stats.total) * 100 : 0;
  const authEventPercent = stats?.total
    ? adminActionPercent + (stats.authEvents / stats.total) * 100
    : 0;

  return (
    <AdminShell title="Audit History">
      <div className="w-full min-w-0">
        <div className="mb-3 shrink-0 rounded-2xl border border-violet-100 bg-white p-3 shadow-sm sm:px-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <p className="text-xs text-slate-600">
              Monthly admin activity, sign-ins, and access outcomes. The PDF export contains every record for the selected month.
            </p>
            <p className="text-xs text-slate-500">
              Showing {filteredItems.length} of {items.length}{stats && stats.total > items.length ? ` · ${stats.total} total this month` : ""}.
            </p>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="audit-month">Audit month</label>
            <select
              id="audit-month"
              value={month}
              onChange={(event) => {
                const nextMonth = event.target.value;
                if (nextMonth) {
                  setMonth(nextMonth);
                  setSearch("");
                  setFilter("all");
                }
              }}
              aria-label="Select audit month"
              className="min-w-[180px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:flex-none"
            >
              {monthOptions.map((monthValue) => (
                <option key={monthValue} value={monthValue}>
                  {new Date(`${monthValue}-01T00:00:00+08:00`).toLocaleString("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "Asia/Manila",
                  })}
                </option>
              ))}
            </select>
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as AuditFilter)}
              aria-label="Filter audit event type"
              className="min-w-[150px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:flex-none"
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
              className="min-w-[180px] flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:flex-none sm:w-56"
            />
            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={isLoading}
              className="shrink-0 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => void exportMonth()}
              disabled={isLoading || isExporting || !stats?.total}
              className="shrink-0 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExporting ? "Exporting..." : "Export monthly PDF"}
            </button>
          </div>
        </div>

        {error ? <div role="alert" className="mb-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}

        {stats ? (
          <section aria-label={`${month} audit statistics`} className="mb-4 w-full shrink-0 space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">Monthly summary</h2>
                <p className="text-xs text-slate-500">
                  Full-month totals · {items.length < stats.total ? `latest ${items.length} records shown below` : "all records shown below"}
                </p>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Total records", value: stats.total, tone: "text-slate-900", accent: "border-l-violet-600" },
                  { label: "Admin changes", value: stats.adminActions, tone: "text-violet-800", accent: "border-l-violet-600" },
                  { label: "Authentication events", value: stats.authEvents, tone: "text-amber-800", accent: "border-l-amber-500" },
                  { label: "Access denied", value: stats.accessDenied, tone: "text-red-700", accent: "border-l-red-600" },
                ].map((stat) => (
                  <div key={stat.label} className={`flex min-h-[64px] items-center justify-between gap-3 rounded-xl border border-l-4 ${stat.accent} border-slate-200 bg-white px-4 py-3 shadow-sm`}>
                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                    <p className={`text-2xl font-bold tabular-nums ${stat.tone}`}>{stat.value.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,2.6fr)_minmax(360px,1fr)]">
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Daily activity</h2>
                    <p className="mt-1 text-xs text-slate-500">Audit records per day · Manila time</p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-800">
                    Peak: {Math.max(0, ...stats.daily.map((day) => day.count))}/day
                  </span>
                </div>
                <div className="mt-2 overflow-x-auto">
                  <svg
                    role="img"
                    aria-label={`Daily audit records for ${month}; vertical scale shows record count and horizontal scale shows day of month`}
                    viewBox={`0 0 ${dailyChartWidth} 150`}
                    className="h-[150px]"
                    style={{ width: `${dailyChartWidth}px`, minWidth: "100%" }}
                    preserveAspectRatio="none"
                  >
                    {[0, 0.5, 1].map((fraction) => {
                      const y = 118 - fraction * 90;
                      const count = Math.round(maxDailyCount * fraction);
                      return (
                        <g key={fraction}>
                          <line x1="34" y1={y} x2={dailyChartWidth} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                          <text x="28" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9">{count}</text>
                        </g>
                      );
                    })}
                    {stats.daily.map((day, index) => {
                      const height = day.count ? Math.max(3, (day.count / maxDailyCount) * 90) : 0;
                      const x = index * 18 + 38;
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
                <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-violet-700" /> Records per day</span>
                  <span>X-axis: day of month</span>
                  <span>Y-axis: record count</span>
                </div>
              </div>

              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">Activity breakdown</h2>
                    <p className="mt-1 text-xs text-slate-500">Monthly records by type</p>
                  </div>
                  <div
                    role="img"
                    aria-label={`Activity breakdown: ${stats.adminActions} admin changes, ${stats.authEvents} authentication events, ${stats.accessDenied} access denied`}
                    className="relative h-24 w-24 shrink-0 rounded-full"
                    style={{
                      background: `conic-gradient(#7c3aed 0% ${adminActionPercent}%, #f59e0b ${adminActionPercent}% ${authEventPercent}%, #ef4444 ${authEventPercent}% 100%)`,
                    }}
                  >
                    <div className="absolute inset-2 flex flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-base font-bold leading-none text-slate-900">{stats.total.toLocaleString()}</span>
                      <span className="mt-1 text-[9px] text-slate-500">records</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 space-y-4">
                  {[
                    { label: "Admin changes", value: stats.adminActions, color: "bg-violet-600" },
                    { label: "Authentication events", value: stats.authEvents, color: "bg-amber-500" },
                    { label: "Access denied", value: stats.accessDenied, color: "bg-red-500" },
                  ].map((entry) => (
                    <div key={entry.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex min-w-0 items-center gap-2 text-slate-600">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${entry.color}`} />
                        <span className="truncate">{entry.label}</span>
                      </span>
                      <span className="font-semibold tabular-nums text-slate-900">{entry.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <div className="flex min-h-[64px] flex-wrap items-center gap-x-6 gap-y-3 px-1">
                <div className="mr-auto">
                  <h2 className="text-xs font-semibold text-slate-800">HTTP error responses</h2>
                  <p className="text-[11px] text-slate-500">Status counts; errors are not automatically security incidents.</p>
                </div>
                {[
                  { label: "401 Unauthorized", value: stats.unauthorizedResponses, tone: "text-red-700", dot: "bg-red-600" },
                  { label: "403 Forbidden", value: stats.forbiddenResponses, tone: "text-orange-700", dot: "bg-orange-500" },
                  { label: "Other 4xx", value: stats.otherClientErrors, tone: "text-slate-700", dot: "bg-slate-400" },
                  { label: "5xx Server errors", value: stats.serverErrors, tone: "text-rose-700", dot: "bg-rose-500" },
                ].map((entry) => (
                  <span key={entry.label} className="inline-flex items-center gap-1.5 text-xs">
                    <span className={`h-2 w-2 rounded-full ${entry.dot}`} />
                    <span className="text-slate-600">{entry.label}</span>
                    <strong className={`font-semibold tabular-nums ${entry.tone}`}>{entry.value.toLocaleString()}</strong>
                  </span>
                ))}
                <span className="w-full border-t border-slate-100 pt-1 text-[11px] text-slate-500 sm:w-auto sm:border-0 sm:pt-0">
                  Failed sign-ins / MFA: <strong className="text-orange-800">{stats.authFailures}</strong>
                </span>
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="audit-records-title" className="min-w-0">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="audit-records-title" className="text-sm font-semibold text-slate-900">Audit records</h2>
              <p className="mt-1 text-xs text-slate-500">
                {filteredItems.length.toLocaleString()} records shown for {month}
                {stats && stats.total > items.length ? ` · latest ${items.length.toLocaleString()} of ${stats.total.toLocaleString()}` : ""}
              </p>
            </div>
            <span className="text-xs text-slate-500">Scroll the list to review records</span>
          </div>
          <div className="max-h-[65dvh] min-w-0 overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                  <div role="status" aria-busy="true" className="flex min-h-48 items-center justify-center p-8 text-center text-slate-600">Loading audit history...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex min-h-48 items-center justify-center p-8 text-center text-slate-600">
                    {items.length ? "No records match the selected filters." : "No audit records for this month."}
                  </div>
                ) : (
                  <table className="w-full min-w-[1200px] table-fixed text-left text-sm">
                    <colgroup>
                      <col className="w-[14%]" />
                      <col className="w-[16%]" />
                      <col className="w-[12%]" />
                      <col className="w-[24%]" />
                      <col className="w-[8%]" />
                      <col className="w-[12%]" />
                      <col className="w-[14%]" />
                    </colgroup>
                    <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Time</th>
                        <th className="px-4 py-3 font-semibold">Actor</th>
                        <th className="px-4 py-3 font-semibold">Event</th>
                        <th className="px-4 py-3 font-semibold">Action / route</th>
                        <th className="px-4 py-3 font-semibold">Result</th>
                        <th className="px-4 py-3 font-semibold">IP address</th>
                        <th className="px-4 py-3 font-semibold">User agent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="align-top hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(item.occurredAt)}</td>
                          <td className="break-words px-4 py-3 text-slate-800">{item.actorEmail ?? "Unknown / unauthenticated"}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              item.eventType === "access_denied" ? "bg-red-100 text-red-800"
                                : item.eventType === "auth_event" ? "bg-amber-100 text-amber-800"
                                  : "bg-violet-100 text-violet-800"
                            }`}>{eventLabel(item.eventType)}</span>
                            <div className="mt-1 text-xs text-slate-500">{item.action}</div>
                          </td>
                          <td className="break-words px-4 py-3">
                            <div className="font-medium text-slate-800">{item.method} <span className="break-all font-normal text-slate-600">{item.route}</span></div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`font-semibold ${item.statusCode >= 400 ? "text-red-700" : "text-emerald-700"}`}>{item.statusCode}</span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-600">{item.ipAddress ?? "—"}</td>
                          <td title={item.userAgent ?? undefined} className="break-words px-4 py-3 text-xs text-slate-500">{item.userAgent ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
