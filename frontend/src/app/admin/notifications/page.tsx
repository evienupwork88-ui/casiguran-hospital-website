"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChangeRequestSummary } from "@/components/admin/change-request-summary";
import {
  approveAndApplyChangeRequest,
  listAdminChangeRequests,
  listMyRejectedChangeRequests,
  markRejectedChangeRequestRead,
  rejectChangeRequest,
  type AdminChangeRequest,
} from "@/lib/api/admin-change-requests";
import { getAdminNotifications, type AdminNotificationSummary } from "@/lib/api/admin-notifications";
import { getMe, type AuthUser } from "@/lib/api/auth";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
}

export default function AdminNotificationsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<AdminNotificationSummary | null>(null);
  const [requests, setRequests] = useState<AdminChangeRequest[]>([]);
  const [rejectedRequests, setRejectedRequests] = useState<AdminChangeRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async (currentUser: AuthUser) => {
    const [nextSummary, changeRequests] = await Promise.all([
      getAdminNotifications(),
      currentUser.role === "admin" ? listAdminChangeRequests() : listMyRejectedChangeRequests(),
    ]);
    setSummary(nextSummary);
    if (currentUser.role === "admin") setRequests(changeRequests);
    else setRejectedRequests(changeRequests);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const currentUser = await getMe();
        if (!active) return;
        setUser(currentUser);
        await refresh(currentUser);
        if (active) setError("");
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [refresh]);

  async function reload() {
    if (!user) return;
    try {
      await refresh(user);
      setError("");
      window.dispatchEvent(new Event("admin-notifications-updated"));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to refresh notifications.");
    }
  }

  async function approve(id: string) {
    setBusyId(id);
    setError("");
    try {
      await approveAndApplyChangeRequest(id);
      await reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to approve and apply the request.");
      await reload();
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const reason = window.prompt("Optional reason for rejecting this change:");
    if (reason === null) return;
    setBusyId(id);
    setError("");
    try {
      await rejectChangeRequest(id, reason);
      await reload();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to reject the request.");
    } finally {
      setBusyId(null);
    }
  }

  async function markAsRead(item: AdminChangeRequest) {
    setBusyId(item.id);
    setError("");
    try {
      await markRejectedChangeRequestRead(item.id);
      setRejectedRequests((current) => current.map((request) =>
        request.id === item.id ? { ...request, requesterReadAt: new Date().toISOString() } : request
      ));
      setSummary((current) => current ? {
        ...current,
        rejectedChangeRequestUnreadCount: Math.max(0, current.rejectedChangeRequestUnreadCount - (item.requesterReadAt ? 0 : 1)),
      } : current);
      window.dispatchEvent(new Event("admin-notifications-updated"));
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to mark the notification as read.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell title="Notifications" user={user ?? undefined}>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Notification center</h2>
          <p className="mt-1 text-sm text-slate-600">Review approvals and security alerts relevant to your role.</p>
        </div>
        {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
        {isLoading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">Loading notifications...</div> : null}

        {!isLoading && user?.role === "admin" ? (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">Editor change requests <span className="text-sm font-normal text-slate-500">({summary?.pendingRequestCount ?? 0} pending)</span></h3>
                <button type="button" onClick={() => void reload()} className="text-sm font-semibold text-violet-800 hover:underline">Refresh</button>
              </div>
              {requests.length ? requests.map((item) => (
                <article key={item.id} className="space-y-3 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.resource} · {item.action}</h4>
                      <p className="mt-1 text-sm text-slate-600">Requested by {item.requesterName} · {formatDate(item.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-900">{item.status}</span>
                  </div>
                  <ChangeRequestSummary item={item} />
                  {item.applicationError ? <p role="alert" className="text-sm text-red-700">{item.applicationError}</p> : null}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" disabled={busyId === item.id} onClick={() => void approve(item.id)} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                      {busyId === item.id ? "Applying..." : item.status === "approved" ? "Retry apply" : "Approve & apply"}
                    </button>
                    {item.status === "pending" ? <button type="button" disabled={busyId === item.id} onClick={() => void reject(item.id)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Reject</button> : null}
                  </div>
                </article>
              )) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No pending editor requests.</p>}
            </section>

            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-slate-900">Security alerts <span className="text-sm font-normal text-slate-500">({summary?.securityAlertCount ?? 0} in the last 24 hours)</span></h3>
              {summary?.securityAlerts.length ? summary.securityAlerts.map((alert) => (
                <article key={alert.id} className="rounded-2xl border border-red-200 bg-white p-5">
                  <h4 className="font-semibold text-slate-900">{alert.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{alert.summary}</p>
                  <p className="mt-2 text-xs text-slate-500">IP {alert.sourceIp} · {alert.eventCount} events · {formatDate(alert.createdAt)}</p>
                  <Link href="/admin/audit-logs" className="mt-3 inline-block text-sm font-semibold text-violet-800 hover:underline">Review audit history</Link>
                </article>
              )) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No recent security alerts.</p>}
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              <h3 className="font-semibold">Email and security service status</h3>
              <p className="mt-2">{summary?.approvalEmailEnabled ? "Editor change-request email is configured." : "Editor change-request email is not configured; requests remain in this console."}</p>
              {summary && summary.pendingApprovalEmailCount > 0 ? <p className="mt-1">{summary.pendingApprovalEmailCount} Editor approval email(s) queued or retrying.</p> : null}
              <p className="mt-2">{summary?.securityAlertEmailEnabled ? "Security alert email is configured." : "Security alert email is not configured; alerts remain in this console."}</p>
              {summary && summary.pendingEmailCount > 0 ? <p className="mt-1">{summary.pendingEmailCount} security alert email(s) queued or retrying.</p> : null}
              {summary?.auditArchiveEnabled ? <p className="mt-1">{summary.pendingArchiveCount} audit event(s) awaiting archive upload or retry.</p> : <p className="mt-1">R2 audit archive is disabled.</p>}
            </section>
          </>
        ) : null}

        {!isLoading && user?.role === "editor" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">Rejected change requests <span className="text-sm font-normal text-slate-500">({summary?.rejectedChangeRequestUnreadCount ?? 0} unread)</span></h3>
              <button type="button" onClick={() => void reload()} className="text-sm font-semibold text-violet-800 hover:underline">Refresh</button>
            </div>
            {rejectedRequests.length ? rejectedRequests.map((item) => (
              <article key={item.id} className={`space-y-3 rounded-2xl border bg-white p-5 shadow-sm ${item.requesterReadAt ? "border-slate-200" : "border-red-300"}`}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.resource} · {item.action}</h4>
                    <p className="mt-1 text-sm text-slate-600">Rejected {formatDate(item.decidedAt ?? item.createdAt)}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.requesterReadAt ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-800"}`}>
                    {item.requesterReadAt ? "Read" : "Unread"}
                  </span>
                </div>
                {item.rejectionReason ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900"><strong>Admin’s reason:</strong> {item.rejectionReason}</p> : <p className="text-sm text-slate-600">No rejection reason was provided.</p>}
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-violet-800">View your submitted change</summary>
                  <ChangeRequestSummary item={item} />
                </details>
                {!item.requesterReadAt ? <button type="button" disabled={busyId === item.id} onClick={() => void markAsRead(item)} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60">Mark as read</button> : null}
              </article>
            )) : <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-600">No rejected change requests.</p>}
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}
