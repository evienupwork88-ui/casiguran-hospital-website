"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Users,
  X,
} from "lucide-react";

const navigation = [
  {
    section: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/news", label: "News", icon: Newspaper },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/services", label: "Services", icon: HeartPulse },
      { href: "/admin/documents", label: "Documents", icon: FileText },
      { href: "/admin/organizational-chart", label: "Organizational Chart", icon: FolderOpen },
      { href: "/admin/pages", label: "Pages", icon: FileText },
    ],
  },
  {
    section: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
];

type AdminUserMeta = {
  fullName?: string;
  role?: string;
};

export function AdminShell({
  title,
  children,
  user,
  onLogout,
  isLoggingOut = false,
}: {
  title: string;
  children: React.ReactNode;
  user?: AdminUserMeta;
  onLogout?: () => void | Promise<void>;
  isLoggingOut?: boolean;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

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

  return (
    <div className="admin-theme min-h-screen overflow-x-hidden bg-[#f5f3ff] text-slate-900">
      <div className="flex h-screen overflow-hidden">
        <div
          aria-hidden={mobileOpen ? "false" : "true"}
          className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-200 lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setMobileOpen(false)}
        />

        <aside
          ref={mobileMenuRef}
          id="admin-sidebar-navigation"
          aria-label="Admin navigation"
          className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-violet-400/20 bg-[linear-gradient(180deg,#2e1065_0%,#1f1635_100%)] text-slate-100 shadow-[0_20px_50px_rgba(46,16,101,0.26)] transition-all duration-200 lg:relative ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${isCollapsed ? "lg:w-[84px]" : "lg:w-[260px]"} ${isCollapsed ? "w-[84px]" : "w-[260px]"}`}
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

          <nav className="flex-1 overflow-y-auto px-3 py-4">
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
                      const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          title={isCollapsed ? item.label : undefined}
                          aria-label={isCollapsed ? item.label : undefined}
                          className={[
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                            isCollapsed ? "justify-center px-2.5" : "",
                            isActive
                              ? "bg-violet-100 text-violet-900 shadow-sm ring-1 ring-violet-200"
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

        <main className="flex-1 overflow-y-auto bg-[#f5f3ff]">
          <div className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pt-6">
            <header className="mb-8 rounded-[24px] border border-violet-200 bg-white/90 p-4 shadow-[0_18px_45px_rgba(91,33,182,0.05)] backdrop-blur-sm sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileOpen((current) => !current)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-700 lg:hidden"
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
                    <h1 className="mt-1 text-xl font-semibold tracking-[-0.04em] text-slate-900 sm:text-2xl">{title}</h1>
                  </div>
                </div>

                <div className="flex items-center gap-3">
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
