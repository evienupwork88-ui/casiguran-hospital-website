"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleDollarSign,
  Activity,
  Bell,
  BookOpen,
  ChevronDown,
  Clock3,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { getAdminContactMessageNotifications, type ContactMessageNotificationSummary } from "@/lib/api/contact-messages";
import { approveAndApplyChangeRequest, rejectChangeRequest } from "@/lib/api/admin-change-requests";
import { useServerClock } from "@/lib/hooks/use-server-clock";

const navigation = [
  {
    section: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/content", label: "Public Site Content", icon: FileText },
      { href: "/admin/news", label: "News and Updates", icon: Newspaper },
      { href: "/admin/trainings", label: "Trainings", icon: FileText },
      { href: "/admin/contact-messages", label: "Contact messages", icon: Mail },
      { href: "/admin/faqs", label: "FAQs", icon: BookOpen },
      {
        label: "Patient Care",
        icon: HeartPulse,
        children: [
          { href: "/admin/opd", label: "OPD page", icon: Activity },
          { href: "/admin/emergency-department", label: "Emergency Department", icon: HeartPulse },
          { href: "/admin/radiology", label: "Radiology page", icon: HeartPulse },
          { href: "/admin/general-medicine", label: "General Medicine", icon: HeartPulse },
          { href: "/admin/obstetrics-and-gynecology", label: "Obstetrics and Gynecology", icon: HeartPulse },
          { href: "/admin/pediatrics", label: "Pediatrics", icon: HeartPulse },
          { href: "/admin/dental", label: "Dental page", icon: HeartPulse },
          { href: "/admin/family-community-medicine", label: "Family & Community Medicine", icon: HeartPulse },
          { href: "/admin/medical-social-service", label: "Medical Social Service", icon: HeartPulse },
          { href: "/admin/nutrition-and-dietetics", label: "Nutrition and Dietetics", icon: HeartPulse },
          { href: "/admin/pharmacy", label: "Pharmacy", icon: HeartPulse },
          { href: "/admin/pathology-laboratories", label: "Pathology and Laboratories", icon: HeartPulse },
          { href: "/admin/nursing-service", label: "Nursing Service", icon: HeartPulse },
          { href: "/admin/himd", label: "Health Information Management Department", icon: HeartPulse },
          { href: "/admin/billing-claims", label: "Billing and Claims", icon: HeartPulse },
        ],
      },
      { href: "/admin/rate-fees", label: "Rate & Fees", icon: CircleDollarSign },
      { href: "/admin/documents", label: "Documents", icon: FileText },
      { href: "/admin/key-officials", label: "Key Officials", icon: Users },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/audit-logs", label: "Audit history", icon: ShieldCheck },
    ],
  },
];

type AdminUserMeta = {
  fullName?: string;
  role?: string;
};

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function AdminShell({
  title,
  children,
  user,
  onLogout,
  onNavigationAttempt,
  isLoggingOut = false,
}: {
  title: string;
  children: React.ReactNode;
  user?: AdminUserMeta;
  onLogout?: () => void | Promise<void>;
  onNavigationAttempt?: (href: string) => boolean;
  isLoggingOut?: boolean;
}) {
  const pathname = usePathname();
  const isAuditHistory = pathname.startsWith("/admin/audit-logs");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { time: serverClockTime, error: clockError, sync: syncServerClock } = useServerClock();
  const [contactNotifications, setContactNotifications] = useState<ContactMessageNotificationSummary | null>(null);
  const [notificationError, setNotificationError] = useState("");
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [patientCareOpen, setPatientCareOpen] = useState(() =>
    pathname.startsWith("/admin/opd") || pathname.startsWith("/admin/radiology") || pathname.startsWith("/admin/general-medicine") || pathname.startsWith("/admin/obstetrics-and-gynecology") || pathname.startsWith("/admin/pediatrics") || pathname.startsWith("/admin/emergency-department") || pathname.startsWith("/admin/dental") || pathname.startsWith("/admin/family-community-medicine") || pathname.startsWith("/admin/medical-social-service") || pathname.startsWith("/admin/nutrition-and-dietetics") || pathname.startsWith("/admin/pharmacy") || pathname.startsWith("/admin/pathology-laboratories") || pathname.startsWith("/admin/nursing-service") || pathname.startsWith("/admin/himd") || pathname.startsWith("/admin/billing-claims"),
  );
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const refreshContactNotifications = useCallback(async () => {
    try {
      setContactNotifications(await getAdminContactMessageNotifications());
      setNotificationError("");
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Unable to load contact message notifications.");
    }
  }, []);

  async function handleApproveChangeRequest(id: string) {
    setApprovalBusyId(id);
    setNotificationError("");
    try {
      await approveAndApplyChangeRequest(id);
      await refreshContactNotifications();
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Unable to apply the approved change.");
      await refreshContactNotifications();
    } finally {
      setApprovalBusyId(null);
    }
  }

  async function handleRejectChangeRequest(id: string) {
    const reason = window.prompt("Optional reason for rejecting this change:");
    if (reason === null) return;
    setApprovalBusyId(id);
    setNotificationError("");
    try {
      await rejectChangeRequest(id, reason);
      await refreshContactNotifications();
    } catch (error) {
      setNotificationError(error instanceof Error ? error.message : "Unable to reject the change request.");
    } finally {
      setApprovalBusyId(null);
    }
  }

  useEffect(() => {
    void refreshContactNotifications();
    const interval = window.setInterval(() => void refreshContactNotifications(), 30_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshContactNotifications();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("contact-messages-updated", refreshWhenVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("contact-messages-updated", refreshWhenVisible);
    };
  }, [refreshContactNotifications]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      mobileMenuTriggerRef.current?.focus();
      return;
    }

    const menu = mobileMenuRef.current;
    const focusable = menu?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [];
    focusable[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        return;
      }

      if (event.key !== "Tab" || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const totalNotifications = (contactNotifications?.unreadCount ?? 0) + (contactNotifications?.pendingRequestCount ?? 0);

  return (
    <div className="admin-theme min-h-dvh overflow-x-hidden bg-[#f5f3ff] text-slate-900">
      <div className="flex h-dvh overflow-hidden">
        <div
          aria-hidden={mobileOpen ? "false" : "true"}
          className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setMobileOpen(false)}
        />

        <aside
          ref={mobileMenuRef}
          id="admin-sidebar-navigation"
          aria-label="Admin navigation"
          className={`fixed inset-y-0 left-0 z-50 flex h-dvh flex-col border-r border-violet-400/20 bg-[linear-gradient(180deg,#2e1065_0%,#1f1635_100%)] text-slate-100 shadow-[0_20px_50px_rgba(46,16,101,0.26)] transition-all duration-200 lg:relative ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isCollapsed ? "lg:w-[84px]" : "lg:w-[260px]"} ${isCollapsed ? "w-[84px]" : "w-[260px]"}`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-violet-400/20 px-3 py-4">
            <div className={`flex items-center gap-3 ${isCollapsed ? "lg:justify-center lg:w-full" : ""}`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-200/15 ring-1 ring-violet-200/30">
                <span className="text-xs font-bold tracking-[0.22em] text-violet-100">CDH</span>
              </div>

              {!isCollapsed && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200">CDH CMS</p>
                  <h2 className="mt-1 text-base font-semibold text-white">Admin Console</h2>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed((current) => !current)}
              className="hidden h-9 w-9 items-center justify-center rounded-xl border border-violet-300/25 bg-white/5 text-violet-100 transition hover:bg-white/10 lg:inline-flex"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <button
              type="button"
              ref={mobileMenuTriggerRef}
              onClick={() => setMobileOpen((current) => !current)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-violet-300/25 bg-white/5 text-violet-100 transition hover:bg-white/10 lg:hidden"
              aria-label="Toggle navigation"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <nav className="flex-1 overscroll-contain overflow-y-auto px-3 py-4">
            <div className="space-y-5">
              {navigation.map((group) => (
                <div key={group.section}>
                  {!isCollapsed && (
                    <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
                      {group.section}
                    </p>
                  )}

                  <div className="space-y-1.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const children = "children" in item ? item.children : undefined;
                      const isPatientCareActive = children?.some((child) => pathname === child.href || pathname.startsWith(child.href)) ?? false;
                      const isActive = isPatientCareActive || (item.href ? pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href)) : false);

                      if (children) {
                        return (
                          <div key={item.label}>
                            <button
                              type="button"
                              onClick={() => {
                                if (isCollapsed) {
                                  setIsCollapsed(false);
                                  setPatientCareOpen(true);
                                  return;
                                }
                                setPatientCareOpen((open) => !open);
                              }}
                              title={isCollapsed ? item.label : undefined}
                              aria-label={isCollapsed ? item.label : undefined}
                              aria-expanded={patientCareOpen}
                              className={[
                                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200",
                                isCollapsed ? "justify-center px-2.5" : "",
                                isActive
                                  ? "bg-violet-100 text-violet-900 shadow-sm ring-2 ring-[var(--gold-400)]"
                                  : "text-violet-50/85 hover:bg-white/8 hover:text-white",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent",
                                  isActive ? "bg-violet-700 text-white" : "bg-white/6 text-violet-100 group-hover:bg-white/10",
                                ].join(" ")}
                              >
                                <Icon size={16} />
                              </span>
                              {!isCollapsed ? (
                                <>
                                  <span className="flex-1">{item.label}</span>
                                  <ChevronDown size={16} className={`transition-transform ${patientCareOpen ? "rotate-180" : ""}`} />
                                </>
                              ) : null}
                            </button>
                            {patientCareOpen && !isCollapsed ? (
                              <div className="ml-6 mt-1.5 space-y-1 border-l border-violet-300/25 pl-3">
                                {children.map((child) => {
                                  const ChildIcon = child.icon;
                                  const childActive = pathname === child.href || pathname.startsWith(child.href);
                                  return (
                                    <Link
                                      key={child.href}
                                      href={child.href}
                                      onClick={(event) => {
                                        if (onNavigationAttempt?.(child.href)) {
                                          event.preventDefault();
                                          setMobileOpen(false);
                                          return;
                                        }
                                        setMobileOpen(false);
                                      }}
                                      className={[
                                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                                        childActive
                                          ? "bg-violet-100/95 font-semibold text-violet-950"
                                          : "text-violet-50/80 hover:bg-white/8 hover:text-white",
                                      ].join(" ")}
                                    >
                                      <ChildIcon size={15} />
                                      <span>{child.label}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        );
                      }
                      if (!item.href) return null;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={(event) => {
                            if (onNavigationAttempt?.(item.href)) {
                              event.preventDefault();
                              setMobileOpen(false);
                              return;
                            }
                            setMobileOpen(false);
                          }}
                          title={isCollapsed ? item.label : undefined}
                          aria-label={isCollapsed ? item.label : undefined}
                          className={[
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isCollapsed ? "justify-center px-2.5" : "",
                            isActive
                              ? "bg-violet-100 text-violet-900 shadow-sm ring-2 ring-[var(--gold-400)]"
                              : "text-violet-50/85 hover:bg-white/8 hover:text-white",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-transparent",
                              isActive ? "bg-violet-700 text-white" : "bg-white/6 text-violet-100 group-hover:bg-white/10",
                            ].join(" ")}
                          >
                            <Icon size={16} />
                          </span>

                          {!isCollapsed && <span>{item.label}</span>}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="shrink-0 border-t border-violet-400/20 px-3 py-4">
            <div className="rounded-[20px] border border-violet-300/20 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
              <div className={`flex items-center gap-3 ${isCollapsed ? "justify-center" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-200 via-violet-100 to-white text-sm font-bold text-violet-900 shadow-inner">
                  {(user?.fullName ?? "A").charAt(0).toUpperCase()}
                </div>

                {!isCollapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">{user?.fullName ?? "Admin"}</p>
                    <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-violet-200">
                      {user?.role ?? "Administrator"}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (onLogout) {
                    await onLogout();
                    return;
                  }

                  if (typeof window !== "undefined") {
                    window.location.href = "/admin/login";
                  }
                }}
                disabled={isLoggingOut}
                className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-200 to-violet-100 px-3 py-2.5 text-sm font-semibold text-violet-900 shadow-[0_10px_24px_rgba(196,181,253,0.25)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 ${isCollapsed ? "lg:px-2" : ""}`}
              >
                <LogOut size={16} />
                {!isCollapsed && <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>}
              </button>
            </div>
          </div>
        </aside>

        <main className={`min-h-0 min-w-0 flex-1 bg-[#f5f3ff] ${isAuditHistory ? "overflow-hidden" : "overflow-y-auto"}`}>
          <div className={`mx-auto min-w-0 max-w-7xl px-3 pb-8 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6 ${isAuditHistory ? "flex h-full flex-col overflow-hidden" : ""}`}>
            <header className={`relative z-50 rounded-[24px] border border-violet-200 bg-white/90 p-4 shadow-[0_18px_45px_rgba(91,33,182,0.05)] backdrop-blur-sm sm:p-5 ${isAuditHistory ? "mb-5 shrink-0" : "mb-8"}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen((current) => !current)}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 lg:hidden"
                    aria-label="Open sidebar navigation"
                    aria-expanded={mobileOpen}
                    aria-controls="admin-sidebar-navigation"
                  >
                    <Menu size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCollapsed((current) => !current)}
                    className="hidden h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 transition hover:bg-violet-100 lg:inline-flex"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  >
                    {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                  </button>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-700">Operations</p>
                    <h1 className="mt-1 break-words text-lg font-semibold tracking-[-0.04em] text-slate-900 sm:text-2xl">{title}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-violet-900 md:flex">
                    <Clock3 size={17} className="shrink-0 text-violet-700" />
                    <div className="leading-tight">
                      <p className="text-sm font-semibold tabular-nums" aria-label="Philippine time">
                        {serverClockTime?.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) ?? "Syncing server time..."}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-violet-700">
                        {serverClockTime?.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric", year: "numeric" }) ?? (clockError ? "Server time unavailable" : "Philippine time")}
                      </p>
                      {clockError ? <button type="button" onClick={() => void syncServerClock()} title={clockError} className="mt-0.5 text-[10px] font-semibold text-red-600 hover:underline">{serverClockTime ? "Sync issue · retry" : "Retry server sync"}</button> : null}
                    </div>
                  </div>

                  <div className="relative" ref={notificationsRef}>
                    <button
                      type="button"
                      onClick={() => setIsNotificationsOpen((current) => !current)}
                      className={`relative inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${totalNotifications ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"}`}
                      aria-label={totalNotifications ? `Notifications, ${totalNotifications} items need attention` : "Notifications"}
                      aria-expanded={isNotificationsOpen}
                      aria-controls="admin-notifications-panel"
                      title="Notifications"
                    >
                      <Bell size={19} className={totalNotifications ? "animate-pulse" : ""} />
                      {totalNotifications ? (
                        <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
                          {totalNotifications > 99 ? "99+" : totalNotifications}
                        </span>
                      ) : null}
                    </button>
                    {isNotificationsOpen ? (
                      <section id="admin-notifications-panel" aria-label="Notifications" className="absolute right-0 z-50 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-[0_20px_55px_rgba(46,16,101,0.2)]">
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
                          <div>
                            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
                            <p className="mt-1 text-xs text-slate-500">
                              {totalNotifications
                                ? [
                                  contactNotifications?.pendingRequestCount ? `${contactNotifications.pendingRequestCount} change request${contactNotifications.pendingRequestCount === 1 ? "" : "s"}` : "",
                                  contactNotifications?.unreadCount ? `${contactNotifications.unreadCount} unread message${contactNotifications.unreadCount === 1 ? "" : "s"}` : "",
                                ].filter(Boolean).join(" · ")
                                : "You’re all caught up"}
                            </p>
                          </div>
                          <Link href="/admin/contact-messages" onClick={() => setIsNotificationsOpen(false)} className="shrink-0 text-xs font-semibold text-violet-700 hover:text-violet-900">
                            View all
                          </Link>
                        </div>
                        {notificationError ? (
                          <div role="alert" className="m-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                            <p>{notificationError}</p>
                            <button type="button" onClick={() => void refreshContactNotifications()} className="mt-2 font-semibold underline">Try again</button>
                          </div>
                        ) : contactNotifications === null ? (
                          <p role="status" className="px-4 py-5 text-sm text-slate-500">Loading notifications...</p>
                        ) : (
                          <div className="max-h-[min(70vh,36rem)] overflow-y-auto">
                          {contactNotifications.changeRequests.length ? (
                            <ul className="divide-y divide-amber-100 border-b border-slate-100 bg-amber-50/50">
                              {contactNotifications.changeRequests.map((item) => (
                                <li key={item.id} className="px-4 py-3">
                                  <div className="flex items-start gap-3">
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-semibold text-slate-900">{item.resource} · {item.action}</p>
                                      <p className="mt-0.5 text-xs text-slate-600">Requested by {item.requesterName} · {formatNotificationTime(item.createdAt)}</p>
                                      <details className="mt-2">
                                        <summary className="cursor-pointer text-xs font-semibold text-violet-800">Review proposed change</summary>
                                        <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-2 text-[10px] text-slate-700">{JSON.stringify(item.requestBody, null, 2)}</pre>
                                        {item.files.length ? <ul className="mt-2 space-y-1 text-xs text-slate-600">{item.files.map((file, index) => <li key={`${file.fieldName}-${index}`}>{file.fieldName}: {file.originalName} ({Math.ceil(file.size / 1024)} KB)</li>)}</ul> : null}
                                      </details>
                                      {item.applicationError ? <p role="alert" className="mt-2 text-xs text-red-700">{item.applicationError}</p> : null}
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button type="button" disabled={approvalBusyId === item.id} onClick={() => void handleApproveChangeRequest(item.id)} className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-60">
                                          {approvalBusyId === item.id ? "Applying..." : item.status === "approved" ? "Retry apply" : "Approve & apply"}
                                        </button>
                                        {item.status === "pending" ? <button type="button" disabled={approvalBusyId === item.id} onClick={() => void handleRejectChangeRequest(item.id)} className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">Reject</button> : null}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {contactNotifications.items.length ? (
                          <ul className="divide-y divide-slate-100">
                            {contactNotifications.items.map((item) => (
                              <li key={item.id}>
                                <Link href="/admin/contact-messages" onClick={() => setIsNotificationsOpen(false)} className="block px-4 py-3 transition hover:bg-violet-50">
                                  <span className="flex items-start gap-3">
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden="true" />
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate text-sm font-semibold text-slate-800">{item.subject}</span>
                                      <span className="mt-0.5 block truncate text-xs text-slate-600">From {item.name}</span>
                                      <span className="mt-1 block text-[11px] text-slate-400">{formatNotificationTime(item.createdAt)}</span>
                                    </span>
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                          ) : null}
                          {!contactNotifications.changeRequests.length && !contactNotifications.items.length ? (
                          <p className="px-4 py-5 text-sm text-slate-500">No new contact messages.</p>
                          ) : null}
                          </div>
                        )}
                        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">New messages are checked automatically every 30 seconds.</div>
                      </section>
                    ) : null}
                  </div>

                  <div className="hidden items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-sm text-violet-800 sm:flex">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-700 text-xs font-semibold text-white">
                      {(user?.fullName ?? "A").charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium">{user?.fullName ?? "Admin"}</span>
                  </div>
                </div>
              </div>
            </header>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
