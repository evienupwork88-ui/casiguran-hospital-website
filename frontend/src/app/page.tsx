"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getPublicServices, type ServiceItem } from "@/lib/api/services";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
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

export default function Home() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [serviceData, settingsData] = await Promise.all([getPublicServices(), getPublicSettings()]);
        setServices(serviceData);
        setSettings(settingsData);
      } catch {
        setServices([]);
        setSettings(null);
      }
    }

    loadHomeData();
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const featuredServices = services.length > 0 ? services.slice(0, 3) : [
    { id: "1", name: "Emergency Care", description: "[Official emergency service description to be provided]" },
    { id: "2", name: "Outpatient Services", description: "[Official consultation and follow-up service description to be provided]" },
    { id: "3", name: "Community Health Programs", description: "[Official community health support description to be provided]" },
  ];

  const featuredAnnouncements = [
    {
      id: "announcement-1",
      title: "[Official hospital announcement]",
      date: "[Date to be provided]",
      summary: "[Official announcement summary to be provided]",
    },
    {
      id: "announcement-2",
      title: "[Official public update]",
      date: "[Date to be provided]",
      summary: "[Official update summary to be provided]",
    },
    {
      id: "announcement-3",
      title: "[Official health advisory]",
      date: "[Date to be provided]",
      summary: "[Official advisory summary to be provided]",
    },
  ];

  const latestNews = [
    {
      id: "news-1",
      title: "[Official hospital news title]",
      date: "[Date to be provided]",
      summary: "[Official news summary to be provided]",
    },
    {
      id: "news-2",
      title: "[Official hospital feature]",
      date: "[Date to be provided]",
      summary: "[Official feature summary to be provided]",
    },
    {
      id: "news-3",
      title: "[Official community update]",
      date: "[Date to be provided]",
      summary: "[Official community update summary to be provided]",
    },
  ];

  const upcomingEvents = [
    {
      id: "event-1",
      title: "[Official event title]",
      date: "[Date]",
      location: "[Location]",
    },
    {
      id: "event-2",
      title: "[Official event title]",
      date: "[Date]",
      location: "[Location]",
    },
    {
      id: "event-3",
      title: "[Official event title]",
      date: "[Date]",
      location: "[Location]",
    },
  ];

  const resourceLinks = [
    "[Official Annual Report]",
    "[Official Hospital Document]",
    "[Official Public Report]",
  ];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.12),_transparent_20%),linear-gradient(180deg,#faf7ff_0%,#fff_34%,#f8fafc_100%)] text-slate-900">
      <header className="sticky top-0 z-30 border-b border-violet-200/80 bg-white/85 backdrop-blur-xl shadow-[0_14px_32px_rgba(76,29,149,0.06)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 rounded-full border border-violet-200 bg-gradient-to-r from-violet-50 to-white px-3 py-2 shadow-[0_8px_20px_rgba(124,58,237,0.08)] transition hover:border-violet-300 sm:px-4">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-violet-200 bg-white sm:h-11 sm:w-11">
              <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill className="object-cover" />
            </div>
            <div className="min-w-0 text-left leading-tight">
              <p className="truncate text-[8.5px] font-semibold uppercase tracking-[0.22em] text-violet-700 sm:text-[9.5px]">
                Casiguran District Hospital PGA
              </p>
              <h1 className="mt-1 text-sm font-semibold text-slate-900 sm:text-[0.95rem]">Official portal</h1>
            </div>
          </div>

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
                        ? "border border-violet-200 bg-gradient-to-r from-violet-700 to-violet-800 text-violet-50 shadow-[0_12px_26px_rgba(124,58,237,0.26)] hover:from-violet-800 hover:to-violet-900"
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

      <section className="relative isolate overflow-hidden border-b border-violet-200 bg-[#f5f2ff]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/cdh-hero.jpg")',
            backgroundPosition: "center center",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(245,242,255,0.94)_0%,rgba(245,242,255,0.9)_20%,rgba(245,242,255,0.78)_36%,rgba(245,242,255,0.32)_58%,rgba(255,255,255,0)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_28%)]" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-white/90" style={{ clipPath: "ellipse(74% 100% at 50% 100%)" }} />

        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="relative z-10 max-w-xl py-4 sm:py-8 lg:max-w-[38rem]">
            <span className="inline-flex items-center rounded-full border border-violet-200 bg-white/80 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-violet-700 shadow-sm backdrop-blur-sm">
              Hospital information
            </span>
            <h2 className="mt-5 text-[2.35rem] font-semibold leading-[0.94] tracking-[-0.06em] text-slate-900 sm:text-[3.25rem] lg:text-[4.2rem]">
              Casiguran District Hospital
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
              Compassionate, accessible, and community-centered care for the people of Casiguran and nearby communities.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-full bg-violet-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(109,40,217,0.26)] transition hover:bg-violet-800"
              >
                About us
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-white/85 px-6 py-3 text-sm font-semibold text-violet-800 shadow-[0_10px_18px_rgba(124,58,237,0.08)] transition hover:border-violet-300 hover:bg-violet-50"
              >
                Contact hospital
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl px-6 pb-10 pt-8 sm:pt-12">
        <div className="grid gap-8 rounded-[30px] border border-violet-200 bg-white/90 p-7 shadow-[0_20px_50px_rgba(76,29,149,0.06)] md:grid-cols-[1fr_1.4fr] md:p-9">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">About</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              Trusted care in our local community
            </h3>
          </div>
          <p className="text-base leading-8 text-slate-600">
            [Short hospital description placeholder — to be approved by Dra. and finalized later.]
          </p>
        </div>
      </section>

      <section id="announcements" className="mx-auto max-w-6xl px-6 pb-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Announcements</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">Important updates</h3>
          </div>
          <Link href="/announcements" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            View all →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredAnnouncements.map((item) => (
            <article key={item.id} className="rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">{item.date}</p>
              <h4 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h4>
              <p className="mt-3 text-base leading-7 text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="services" className="mx-auto max-w-6xl px-6 pb-14 pt-2">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Services</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              Core healthcare services
            </h3>
          </div>
          <Link href="/services" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            Explore all →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredServices.map((service) => (
            <div key={service.id} className="rounded-[24px] border border-violet-200 bg-white p-5 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-lg font-medium text-violet-700">
                +
              </div>
              <p className="text-lg font-semibold text-slate-900">{service.name}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="news" className="mx-auto max-w-6xl px-6 pb-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">News</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">Latest updates</h3>
          </div>
          <Link href="/news" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            See more →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {latestNews.map((item) => (
            <article key={item.id} className="rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
              <div className="h-32 rounded-[18px] bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)]" />
              <p className="mt-4 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">{item.date}</p>
              <h4 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h4>
              <p className="mt-3 text-base leading-7 text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="events" className="mx-auto max-w-6xl px-6 pb-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Events</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">Upcoming activities</h3>
          </div>
          <Link href="/events" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            View calendar →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {upcomingEvents.map((item) => (
            <div key={item.id} className="rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-[18px] bg-violet-100 text-center text-violet-800">
                <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em]">{item.date.split(" ")[0] || "Date"}</span>
                <span className="text-lg font-semibold">{item.date.split(" ")[1] || "TBD"}</span>
              </div>
              <h4 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h4>
              <p className="mt-2 text-sm font-medium text-violet-700">{item.location}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="resources" className="mx-auto max-w-6xl px-6 pb-14">
        <div className="mb-6">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Resources</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">Documents and reports</h3>
        </div>

        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
          <div className="grid gap-4 md:grid-cols-3">
            {resourceLinks.map((item) => (
              <div key={item} className="rounded-[20px] border border-violet-200 bg-violet-50/50 p-5 text-sm font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="mt-2 bg-[linear-gradient(135deg,#2e1065_0%,#4c1d95_100%)] py-14 text-slate-100">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-200">Contact</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Get in touch</h3>
          </div>

          <div className="space-y-3 text-sm leading-7 text-violet-100 sm:text-base">
            <p>{settings?.address || "Official Address — To be provided"}</p>
            <p>{settings?.phone || "Official Contact Number — To be provided"}</p>
            <p>{settings?.officeHours || "Official Service / Office Hours — To be provided"}</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-violet-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 md:grid-cols-4">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Hospital</h4>
            <p className="text-sm leading-7 text-slate-600">
              Casiguran District Hospital
            </p>
            <p className="text-sm leading-7 text-slate-600">
              [Short official hospital description placeholder — to be approved by Dra.]
            </p>
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
