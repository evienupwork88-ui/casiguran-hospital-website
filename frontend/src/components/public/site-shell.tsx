"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Activity, HeartPulse, Menu, X } from "lucide-react";
import { getPublicPage, type PageItem } from "@/lib/api/pages";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";
import { formatOfficeHours } from "@/lib/format-office-hours";
import { PublicDesktopNavigation, PublicMobileNavigation } from "@/components/public/public-navigation";

type PublicShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  headerOverImage?: boolean;
};

const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/mandate", label: "Mandate" },
  { href: "/about", label: "About" },
  { href: "/hospital-history", label: "Hospital History" },
  { href: "/vision-mission", label: "Vision & Mission" },
  { href: "/key-officials", label: "Key Officials" },
  { href: "/services", label: "Services" },
  { href: "/news", label: "News" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/documents", label: "Documents" },
  { href: "/organizational-chart", label: "Organizational Chart" },
  { href: "/contact", label: "Contact" },
];

const headerLogoClass = "relative h-12 w-12 shrink-0 sm:h-16 sm:w-16 lg:h-24 lg:w-24";

export function PublicShell({ title, subtitle, children, headerOverImage = false }: PublicShellProps) {
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
      <header className="sticky top-0 z-30 overflow-visible border-b-2 border-[var(--gold-400)] bg-white/95 shadow-[0_8px_24px_rgba(37,27,88,0.06)] backdrop-blur-xl">
        <div className="relative flex min-h-[84px] w-full items-center justify-between gap-3 px-2 sm:px-3 lg:min-h-[116px] lg:gap-6">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3">
            <div className="flex shrink-0 items-center -space-x-1 lg:-space-x-3">
              <div className={headerLogoClass}>
                <Image src="/pga-logo.png" alt="Provincial Government of Aurora logo" fill sizes="96px" className="scale-[1.15] object-contain" />
              </div>
              <div className={headerLogoClass}>
                <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill sizes="96px" className="object-contain" />
              </div>
            </div>
            <div className="min-w-0 text-left leading-tight">
              <p className="text-base font-bold leading-tight tracking-[-0.02em] text-violet-950 sm:text-xl lg:text-2xl">
                <span className="block">Casiguran District</span>
                <span className="block">Hospital PGA</span>
              </p>
              <p className="mt-1 text-xs font-medium text-violet-500 sm:text-sm lg:text-base">Official portal</p>
            </div>
          </Link>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <PublicDesktopNavigation headerOverImage={headerOverImage} />
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <HeartPulse aria-hidden="true" className="hidden h-12 w-16 text-violet-700 opacity-30 2xl:block" strokeWidth={1.4} />
            <button
              type="button"
              ref={mobileMenuTriggerRef}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-violet-700 transition hover:bg-violet-50 lg:hidden"
            >
              <span className="sr-only">Toggle menu</span>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div
            id="public-mobile-navigation"
            ref={mobileMenuRef}
            className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden"
          >
            <PublicMobileNavigation headerOverImage={headerOverImage} onNavigate={() => setMobileOpen(false)} />
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

        <div className="relative mx-auto grid w-full max-w-[1800px] gap-7 px-5 py-9 sm:px-8 lg:px-12 md:grid-cols-[1.5fr_0.7fr_1fr_0.9fr] md:gap-0 md:py-9">
          <div className="space-y-4 md:pr-10 lg:pr-16">
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-300 bg-white shadow-lg">
                <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill sizes="64px" unoptimized className="object-cover" />
              </div>
              <div className="leading-tight">
                <p className="text-2xl font-bold tracking-[-0.02em] text-white">Casiguran District</p>
                <p className="text-2xl font-bold tracking-[-0.02em] text-white">Hospital</p>
              </div>
            </div>
            <div className="h-1 w-14 rounded-full bg-[var(--gold-400)]" />
            <p className="max-w-2xl whitespace-pre-line text-sm leading-6 text-violet-100/85">
              {aboutPage?.body || "Official hospital profile information will appear here once published."}
            </p>
          </div>

          <div className="border-violet-400/35 md:border-l md:px-8 lg:px-10">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Quick Links</h4>
            <ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-violet-100/90 md:grid-cols-1">
              {footerQuickLinks.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className="transition hover:text-white">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-violet-400/35 md:border-l md:px-8 lg:px-10">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Hospital Information</h4>
            <ul className="space-y-2 text-sm leading-5 text-violet-100/90">
              <li>{settings?.address || "Official Address — To be provided"}</li>
              <li>{settings?.phone || "Official Contact Number — To be provided"}</li>
              <li>{settings?.email || "Official Email — To be provided"}</li>
              <li className="whitespace-pre-line pt-1 text-[0.8rem] leading-5 text-violet-100/80">{formatOfficeHours(settings?.administrativeOfficeHours, settings?.officeHours)}</li>
            </ul>
          </div>

          <div className="border-violet-400/35 md:border-l md:px-8 lg:px-10">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Connect With Us</h4>
            <p className="mb-4 text-sm text-violet-100/90">Follow us on Facebook</p>
            {settings?.facebookUrl ? (
              <a
                href={settings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold text-violet-700">f</span>
                Official Facebook Page →
              </a>
            ) : (
              <span className="text-sm text-violet-100/75">Official Facebook URL — To be provided</span>
            )}

            <div className="mt-6">
              <p className="mb-1 text-sm text-violet-100/90">Under the</p>
              <a
                href="https://auroraprovince.gov.ph/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-[var(--gold-400)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--gold-300)]"
              >
                Provincial Government of Aurora →
              </a>
            </div>
          </div>
        </div>

        <div className="relative border-t border-violet-400/35 bg-[#19113d]/80">
          <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-3 px-5 py-3 text-xs text-violet-200/80 sm:flex-row sm:items-center sm:px-8 lg:px-12">
            <Activity size={42} strokeWidth={1.5} className="text-violet-400" aria-hidden="true" />
            <p className="flex-1">Official Website of Casiguran District Hospital.</p>
            <p>© 2026 Casiguran District Hospital. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
