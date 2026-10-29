"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Activity, Clock3, HeartPulse, Menu, X } from "lucide-react";
import { getPublicPage, type PageItem } from "@/lib/api/pages";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";
import { formatOfficeHours } from "@/lib/format-office-hours";
import { PublicDesktopNavigation, PublicMobileNavigation } from "@/components/public/public-navigation";
import { useServerClock } from "@/lib/hooks/use-server-clock";

type PublicShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerOverImage?: boolean;
  heroImages?: string[];
};

const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/vision-mission", label: "Vision & Mission" },
  { href: "/patient-rights", label: "Patient Rights" },
  { href: "/opd", label: "Out-Patient Department" },
  { href: "/emergency-department", label: "Emergency Department" },
  { href: "/trainings", label: "Trainings" },
  { href: "/contact", label: "Contact" },
];

const headerLogoClass = "relative h-10 w-10 shrink-0 sm:h-16 sm:w-16 lg:h-24 lg:w-24";

export function PublicShell({ title, subtitle, children, headerOverImage = false, heroImages = [] }: PublicShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [aboutPage, setAboutPage] = useState<PageItem | null>(null);
  const { time: serverClockTime, error: clockError, sync: syncServerClock } = useServerClock();
  const heroImageCount = heroImages.length;

  useEffect(() => {
    if (heroImageCount === 0) return;
    setActiveHeroImageIndex((index) => index % heroImageCount);
    if (heroImageCount < 2) return;
    const timer = window.setInterval(() => {
      setActiveHeroImageIndex((index) => (index + 1) % heroImageCount);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [heroImageCount]);

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
        <div className="relative flex min-h-[76px] w-full items-center justify-between gap-2 px-2 sm:min-h-[84px] sm:gap-3 sm:px-3 lg:min-h-[116px] lg:gap-6">
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
            <div className="hidden items-center gap-4 2xl:flex">
              <HeartPulse aria-hidden="true" className="h-12 w-16 shrink-0 text-violet-700 opacity-30" strokeWidth={1.4} />
              <div className="flex items-center gap-2.5 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-2.5 text-violet-950 shadow-sm">
                <Clock3 size={20} aria-hidden="true" className="shrink-0 text-violet-700" />
                <div className="leading-tight">
                  {serverClockTime ? (
                    <>
                      <time dateTime={serverClockTime.toISOString()} className="block whitespace-nowrap text-base font-semibold tabular-nums">
                        {serverClockTime.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                      </time>
                      <span className="mt-1 block whitespace-nowrap text-sm font-medium text-violet-700">
                        {serverClockTime.toLocaleDateString("en-PH", { timeZone: "Asia/Manila", weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        {" · PHT"}
                      </span>
                    </>
                  ) : (
                    <span className="block whitespace-nowrap text-sm font-medium">
                      {clockError ? "Server time unavailable" : "Syncing server time..."}
                    </span>
                  )}
                  {clockError ? <button type="button" onClick={() => void syncServerClock()} className="mt-1 text-xs font-semibold text-red-700 hover:underline">Retry clock sync</button> : null}
                </div>
              </div>
            </div>
            <button
              type="button"
              ref={mobileMenuTriggerRef}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="public-mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center border border-slate-200 bg-white text-violet-700 transition hover:bg-violet-50 lg:hidden"
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

      <section className={`relative isolate overflow-hidden border-b border-slate-200 ${heroImageCount ? "min-h-[240px] sm:min-h-[280px] md:min-h-[320px]" : "bg-white"}`}>
        {heroImageCount ? (
          <>
            <div className="absolute inset-0 -z-10 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img key={heroImages[activeHeroImageIndex]} src={heroImages[activeHeroImageIndex]} alt="" aria-hidden="true" className="opd-slide-image h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/75 via-slate-950/50 to-slate-950/35" />
            </div>
            {heroImageCount > 1 ? (
              <>
                <button type="button" aria-label="Show previous header image" onClick={() => setActiveHeroImageIndex((index) => (index - 1 + heroImageCount) % heroImageCount)} className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-xl text-white transition hover:bg-slate-950/75 sm:left-6">
                  <span aria-hidden="true">‹</span>
                </button>
                <button type="button" aria-label="Show next header image" onClick={() => setActiveHeroImageIndex((index) => (index + 1) % heroImageCount)} className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/55 text-xl text-white transition hover:bg-slate-950/75 sm:right-6">
                  <span aria-hidden="true">›</span>
                </button>
                <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-2" role="group" aria-label="Choose header image">
                  {heroImages.map((image, index) => (
                    <button key={image} type="button" aria-label={`Show header image ${index + 1}`} aria-current={index === activeHeroImageIndex ? "true" : undefined} onClick={() => setActiveHeroImageIndex(index)} className={`h-2.5 rounded-full shadow transition-all ${index === activeHeroImageIndex ? "w-7 bg-white" : "w-2.5 bg-white/65 hover:bg-white"}`} />
                  ))}
                </div>
              </>
            ) : null}
          </>
        ) : null}
        <div className={`mx-auto flex max-w-7xl items-center px-5 py-12 sm:px-8 md:py-16 ${heroImageCount ? "min-h-[240px] sm:min-h-[280px] md:min-h-[320px]" : ""}`}>
          <div className={heroImageCount ? "min-w-0 max-w-4xl py-5 pr-12 sm:pr-16" : ""}>
          <p className={`text-[0.7rem] font-bold uppercase tracking-[0.22em] ${heroImageCount ? "inline-flex border-l-2 border-violet-200/90 bg-[#21164f]/75 px-3.5 py-1.5 text-white/95" : "text-violet-700"}`}>
            Hospital information
          </p>
          <h1 className={`mt-3 max-w-4xl break-words text-4xl font-semibold leading-[1.05] sm:text-5xl ${heroImageCount ? "image-overlay-heading text-4xl font-normal leading-tight sm:text-6xl" : "text-slate-950"}`}>
            {title}
          </h1>
          {subtitle ? (
            <p className={`mt-4 max-w-2xl text-base leading-7 sm:text-lg ${heroImageCount ? "text-white/90" : "text-slate-600"}`}>
              {subtitle}
            </p>
          ) : null}
          </div>
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
