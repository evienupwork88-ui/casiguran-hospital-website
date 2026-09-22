"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Activity, HeartPulse, Menu, Settings, X } from "lucide-react";
import { getPublicPage, type PageItem } from "@/lib/api/pages";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";
import { formatOfficeHours } from "@/lib/format-office-hours";

type PublicShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  headerOverImage?: boolean;
};

export const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/organizational-chart", label: "Organizational Chart" },
  { href: "/services", label: "Services" },
  { href: "/news", label: "News" },
  { href: "/contact", label: "Contact" },
  { href: "/admin/dashboard", label: "Admin Console" },
];

const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/hospital-history", label: "Hospital History" },
  { href: "/vision-mission", label: "Vision & Mission" },
  { href: "/services", label: "Services" },
  { href: "/news", label: "News" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/documents", label: "Documents" },
  { href: "/organizational-chart", label: "Organizational Chart" },
  { href: "/contact", label: "Contact" },
];

export function PublicShell({ title, subtitle, children, headerOverImage = false }: PublicShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [aboutPage, setAboutPage] = useState<PageItem | null>(null);

  useEffect(() => {
    async function loadSettings() {
      const [settingsData, aboutData] = await Promise.all([
        getPublicSettings().catch(() => null),
        getPublicPage("about").catch(() => null),
      ]);
      setSettings(settingsData);
      setAboutPage(aboutData);
    }

    loadSettings();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
    <main className="public-theme min-h-screen bg-[#f8f9fc] text-slate-900">
      <header
        className={[
          "sticky top-0 z-30 overflow-hidden border-b shadow-[0_8px_24px_rgba(37,27,88,0.06)] backdrop-blur-xl",
          headerOverImage
            ? "border-white/20 bg-[#24164f]/75 text-[#f2f3f4]"
            : "border-slate-200/90 bg-white/95",
        ].join(" ")}
      >
          <HeartPulse aria-hidden="true" className={["pointer-events-none absolute -right-2 top-3 h-20 w-28 opacity-10", headerOverImage ? "text-white" : "text-violet-700"].join(" ")} strokeWidth={1.2} />
          <div className="relative mx-auto flex min-h-[84px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:min-h-[116px]">
          <Link href="/" className={[
            "flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80",
            headerOverImage ? "text-[#f2f3f4]" : "",
          ].join(" ")}>
            <div className={[
              "relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 shadow-sm lg:h-20 lg:w-20",
              headerOverImage ? "border-white/40 bg-white/10" : "border-violet-200 bg-violet-50",
            ].join(" ")}>
              <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill sizes="80px" className="object-cover" />
            </div>
            <div className={[
              "min-w-0 border-l pl-4 text-left leading-tight",
              headerOverImage ? "border-white/30" : "border-slate-200",
            ].join(" ")}>
              <p className={[
                "max-w-[250px] text-lg font-bold leading-tight tracking-[-0.02em] sm:text-xl lg:text-2xl",
                headerOverImage ? "text-[#f2f3f4]" : "text-violet-700",
              ].join(" ")}>
                <span className="block">Casiguran District</span>
                <span className="block">Hospital PGA</span>
              </p>
              <p className={[
                "mt-2 text-sm font-medium lg:text-base",
                headerOverImage ? "text-[#f2f3f4]" : "text-slate-500",
              ].join(" ")}>Official portal</p>
            </div>
          </Link>

          <nav className={[
            "hidden items-center gap-1 text-[0.82rem] font-medium lg:flex",
            headerOverImage ? "text-[#f2f3f4]" : "text-slate-600",
          ].join(" ")}>
            {publicNavItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const isAdmin = item.href.startsWith("/admin");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={isAdmin ? "_blank" : undefined}
                  rel={isAdmin ? "noopener noreferrer" : undefined}
                  className={[
                    "inline-flex items-center gap-2 px-3 py-2 transition-colors duration-200",
                    isActive
                      ? isAdmin
                        ? headerOverImage ? "rounded-full bg-white/15 text-[#f2f3f4]" : "text-violet-700"
                        : headerOverImage ? "text-[#f2f3f4]" : "text-violet-700"
                      : isAdmin
                        ? "ml-2 rounded-full bg-violet-600 px-5 text-white shadow-[0_8px_18px_rgba(124,58,237,0.25)] hover:bg-violet-700"
                        : headerOverImage ? "hover:text-white" : "hover:text-violet-700",
                  ].join(" ")}
                >
                  {isAdmin ? <Settings size={16} aria-hidden="true" /> : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            ref={mobileMenuTriggerRef}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className={[
              "inline-flex h-10 w-10 items-center justify-center border transition lg:hidden",
              headerOverImage
                ? "border-white/30 bg-white/10 text-[#f2f3f4] hover:bg-white/20"
                : "border-slate-200 bg-white text-violet-700 hover:bg-violet-50",
            ].join(" ")}
          >
            <span className="sr-only">Toggle menu</span>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen && (
          <div
            id="public-mobile-navigation"
            ref={mobileMenuRef}
            className={[
            "border-t px-5 py-4 shadow-lg lg:hidden",
            headerOverImage ? "border-white/20 bg-[#24164f]" : "border-slate-200 bg-white",
          ].join(" ")}>
            <nav aria-label="Mobile navigation" className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto text-sm font-medium">
              {publicNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const isAdmin = item.href.startsWith("/admin");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    target={isAdmin ? "_blank" : undefined}
                    rel={isAdmin ? "noopener noreferrer" : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "border-b px-2 py-3 transition-colors",
                      headerOverImage ? "border-white/10" : "border-slate-100",
                      isActive
                        ? isAdmin
                          ? headerOverImage ? "text-[#f2f3f4]" : "text-violet-700"
                          : headerOverImage ? "text-[#f2f3f4]" : "text-slate-700"
                          : isAdmin
                            ? headerOverImage ? "text-[#f2f3f4]" : "text-violet-700"
                          : headerOverImage ? "hover:text-white" : "hover:text-violet-700",
                    ].join(" ")}
                  >
                    <span className="inline-flex items-center gap-2">{isAdmin ? <Settings size={16} aria-hidden="true" /> : null}{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">
            Hospital information
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.05] text-slate-950 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </section>

      {children}

      <footer className="relative isolate overflow-hidden border-t border-violet-400/30 bg-[#21164f] text-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden opacity-80">
          <div className="absolute -left-24 bottom-[-8rem] h-52 w-[32rem] rounded-[50%] bg-violet-800/70" />
          <div className="absolute -right-28 bottom-[-7rem] h-56 w-[34rem] rounded-[50%] bg-violet-800/70" />
          <div className="absolute -left-16 bottom-[-10rem] h-52 w-[34rem] rounded-[50%] border-t border-violet-400/30 bg-violet-950/40" />
          <div className="absolute -right-16 bottom-[-9rem] h-52 w-[34rem] rounded-[50%] border-t border-violet-400/30 bg-violet-950/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-9 px-5 py-12 sm:px-8 md:grid-cols-[1.35fr_0.75fr_1fr_0.95fr] md:gap-0 md:py-14">
          <div className="space-y-5 md:pr-10">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-300 bg-white shadow-lg">
                <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill sizes="64px" unoptimized className="object-cover" />
              </div>
              <div className="leading-tight">
                <p className="text-xl font-bold text-white">Casiguran District</p>
                <p className="text-2xl font-bold text-violet-300">Hospital</p>
              </div>
            </div>
            <div className="h-1 w-14 rounded-full bg-violet-400" />
            <p className="max-w-md whitespace-pre-line text-sm leading-7 text-violet-100/85">
              {aboutPage?.body || "Official hospital profile information will appear here once published."}
            </p>
          </div>

          <div className="border-violet-400/35 md:border-l md:px-8">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Quick Links</h4>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-violet-100/90 md:grid-cols-1">
              {footerQuickLinks.map((item) => <li key={`${item.label}-${item.href}`}><Link href={item.href} className="transition hover:text-white">{item.label}</Link></li>)}
            </ul>
          </div>

          <div className="border-violet-400/35 md:border-l md:px-8">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Hospital Information</h4>
            <ul className="space-y-4 text-sm leading-6 text-violet-100/90">
              <li>{settings?.address || "Official Address — To be provided"}</li>
              <li>{settings?.phone || "Official Contact Number — To be provided"}</li>
              <li>{settings?.email || "Official Email — To be provided"}</li>
              <li className="whitespace-pre-line">{formatOfficeHours(settings?.administrativeOfficeHours, settings?.officeHours)}</li>
            </ul>
          </div>

          <div className="border-violet-400/35 md:border-l md:px-8">
            <h4 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Connect With Us</h4>
            <p className="mb-5 text-sm text-violet-100/90">Official Facebook Page</p>
            {settings?.facebookUrl ? <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold text-violet-700">f</span>Official Facebook Page -&gt;</a> : <span className="text-sm text-violet-100/75">Official Facebook URL — To be provided</span>}
          </div>
        </div>

        <div className="relative border-t border-violet-400/35 bg-[#19113d]/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-xs text-violet-200/80 sm:flex-row sm:items-center sm:px-8">
            <Activity size={42} strokeWidth={1.5} className="text-violet-400" aria-hidden="true" />
            <p className="flex-1">Official Website of Casiguran District Hospital.</p>
            <p>© 2026 Casiguran District Hospital. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
