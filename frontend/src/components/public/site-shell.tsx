"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type PublicShellProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

const navItems = [
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
  { href: "/services", label: "Services" },
  { href: "/news", label: "News" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

export function PublicShell({ title, subtitle, children }: PublicShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_24%),linear-gradient(180deg,#faf7ff_0%,#fff_30%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-violet-200/80 bg-white/85 backdrop-blur-xl shadow-[0_14px_32px_rgba(76,29,149,0.06)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-white px-3 py-2 shadow-[0_8px_20px_rgba(124,58,237,0.08)] transition hover:border-violet-300 sm:px-4">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-violet-200 bg-white sm:h-11 sm:w-11">
              <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill className="object-cover" />
            </div>
            <div className="min-w-0 text-left leading-tight">
              <p className="truncate text-[8.5px] font-semibold uppercase tracking-[0.22em] text-violet-700 sm:text-[9.5px]">
                Casiguran District Hospital PGA
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-[0.95rem]">Official portal</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              const isAdmin = item.href.startsWith("/admin");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-full px-3.5 py-2 transition-all duration-200",
                    isActive
                      ? isAdmin
                        ? "border border-violet-200 bg-violet-100 text-violet-900 shadow-sm"
                        : "bg-violet-100 text-violet-900 shadow-sm"
                      : isAdmin
                        ? "border border-violet-200 bg-violet-700 text-violet-50 shadow-[0_10px_18px_rgba(124,58,237,0.24)] hover:bg-violet-800"
                        : "text-violet-700 hover:bg-violet-50 hover:text-violet-900",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 transition hover:bg-violet-100 md:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            <div className="flex w-4.5 flex-col items-center gap-1.25">
              <span className={`h-0.5 w-full rounded-full bg-current transition ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
              <span className={`h-0.5 w-full rounded-full bg-current transition ${mobileOpen ? "opacity-0" : "opacity-100"}`} />
              <span className={`h-0.5 w-full rounded-full bg-current transition ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
            </div>
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-violet-200 bg-white/95 px-4 py-3 shadow-[0_12px_24px_rgba(91,33,182,0.08)] md:hidden">
            <nav className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto text-sm font-medium">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                const isAdmin = item.href.startsWith("/admin");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "rounded-xl px-3 py-3 transition-all duration-200",
                      isActive
                        ? isAdmin
                          ? "bg-violet-700 text-white"
                          : "bg-violet-100 text-violet-900"
                        : isAdmin
                          ? "border border-violet-200 bg-violet-700 text-violet-50"
                          : "text-violet-700 hover:bg-violet-50 hover:text-violet-900",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="rounded-[30px] border border-violet-200 bg-white/85 p-8 shadow-[0_20px_50px_rgba(91,33,182,0.08)] backdrop-blur-sm md:p-10">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">
            Hospital information
          </p>
          <h1 className="mt-4 text-3xl font-semibold leading-[1.04] tracking-[-0.06em] text-slate-900 sm:text-4xl md:text-[3.2rem]">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            {subtitle}
          </p>
        </div>
      </section>

      {children}

      <footer className="border-t border-violet-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Hospital</h4>
            <p className="text-sm leading-7 text-slate-600">Casiguran District Hospital</p>
            <p className="text-sm leading-7 text-slate-600">[Short official hospital description placeholder — to be approved by Dra.]</p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Quick Links</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {footerQuickLinks.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link href={item.href} className="transition hover:text-violet-700">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Hospital Information</h4>
            <ul className="space-y-2 text-sm leading-7 text-slate-600">
              <li>Official Address — To be provided</li>
              <li>Official Contact Number — To be provided</li>
              <li>Official Email — To be provided</li>
              <li>Official Service / Office Hours — To be provided</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Connect With Us</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <a href="#" className="transition hover:text-violet-700">
                  Official Facebook Page
                </a>
              </li>
              <li>Official Facebook URL — To be provided</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-violet-200 bg-violet-50/50">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>Official Website of Casiguran District Hospital</p>
            <p>© 2026 Casiguran District Hospital. All Rights Reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
