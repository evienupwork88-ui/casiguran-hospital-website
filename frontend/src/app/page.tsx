"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Building2, CalendarDays, FileText, HeartPulse, Mail, MapPin, Megaphone, Menu, Newspaper, Phone, Settings, X } from "lucide-react";
import { getPublicAnnouncements, type AnnouncementItem } from "@/lib/api/announcements";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";
import { getPublicEvents, type EventItem } from "@/lib/api/events";
import { getPublicNews, type NewsItem } from "@/lib/api/news";
import { getPublicPage, type PageItem } from "@/lib/api/pages";
import { getPublicServices, type ServiceItem } from "@/lib/api/services";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";
import { publicNavItems } from "@/components/public/site-shell";
import { formatOfficeHours } from "@/lib/format-office-hours";

const navItems = publicNavItems;

const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/news", label: "News" },
  { href: "/announcements", label: "Announcements" },
  { href: "/events", label: "Events" },
  { href: "/contact", label: "Contact" },
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatEventDate(dateStr: string | null | undefined): { month: string; day: string } {
  if (!dateStr) return { month: "EVENT", day: "TBD" };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { month: "EVENT", day: "TBD" };
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
}

export default function Home() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [aboutPage, setAboutPage] = useState<PageItem | null>(null);
  const [homeError, setHomeError] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      const results = await Promise.allSettled([
        getPublicServices(),
        getPublicSettings(),
        getPublicAnnouncements(),
        getPublicNews(),
        getPublicEvents(),
        getPublicDocuments(),
        getPublicPage("about"),
      ]);

      const [servicesResult, settingsResult, announcementsResult, newsResult, eventsResult, documentsResult, aboutPageResult] = results;
      setHomeError(results.some((result) => result.status === "rejected"));
      if (servicesResult.status === "fulfilled") setServices(servicesResult.value);
      if (settingsResult.status === "fulfilled") setSettings(settingsResult.value);
      if (announcementsResult.status === "fulfilled") setAnnouncements(announcementsResult.value);
      if (newsResult.status === "fulfilled") setNews(newsResult.value);
      if (eventsResult.status === "fulfilled") setEvents(eventsResult.value);
      if (documentsResult.status === "fulfilled") setDocuments(documentsResult.value);
      if (aboutPageResult.status === "fulfilled") setAboutPage(aboutPageResult.value);
    }

    loadHomeData();
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

  const featuredAnnouncements = announcements.slice(0, 3);
  const featuredServices = services.slice(0, 3);
  const featuredNews = news.slice(0, 3);
  const featuredEvents = events.slice(0, 3);
  const featuredDocuments = documents.filter((doc) => doc.status === "published").slice(0, 3);

  return (
    <main className="public-theme min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="relative sticky top-0 z-30 overflow-hidden border-b border-slate-200/90 bg-white/95 shadow-[0_8px_24px_rgba(37,27,88,0.06)] backdrop-blur-xl">
        <HeartPulse aria-hidden="true" className="pointer-events-none absolute -right-2 top-3 h-20 w-28 text-violet-700 opacity-10" strokeWidth={1.2} />
        <div className="relative mx-auto flex min-h-[84px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:min-h-[116px]">
          <Link href="/" className="flex min-w-0 items-center gap-3 transition-opacity hover:opacity-80">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-200 bg-violet-50 shadow-sm lg:h-20 lg:w-20">
              <Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill sizes="80px" className="object-cover" />
            </div>
            <div className="min-w-0 border-l border-slate-200 pl-4 text-left leading-tight">
              <p className="max-w-[250px] text-lg font-bold leading-tight tracking-[-0.02em] text-violet-950 sm:text-xl lg:text-2xl">
                <span className="block">Casiguran District</span>
                <span className="block">Hospital PGA</span>
              </p>
              <p className="mt-2 text-sm font-medium text-violet-500 lg:text-base">Official portal</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 text-[0.82rem] font-medium text-slate-600 lg:flex">
            {navItems.map((item) => {
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
                        ? "text-violet-700"
                        : "text-violet-700"
                      : isAdmin
                        ? "ml-2 rounded-full bg-violet-600 px-5 text-white shadow-[0_8px_18px_rgba(124,58,237,0.25)] hover:bg-violet-700"
                        : "hover:text-violet-700",
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
            aria-controls="home-mobile-navigation"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center border border-slate-200 bg-white text-violet-700 transition hover:bg-violet-50 lg:hidden"
          >
            <span className="sr-only">Toggle menu</span>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen && (
          <div id="home-mobile-navigation" ref={mobileMenuRef} className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">
            <nav aria-label="Mobile navigation" className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto text-sm font-medium">
              {navItems.map((item) => {
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
                      "border-b border-slate-100 px-2 py-3 transition-colors",
                      isActive
                        ? isAdmin
                          ? "text-violet-700"
                          : "text-slate-700"
                        : isAdmin
                          ? "text-violet-700"
                          : "hover:text-violet-700",
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

      {homeError ? (
        <div role="alert" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-900 sm:px-8">
          Some hospital information is temporarily unavailable. Please try again later.
        </div>
      ) : null}

      <section className="relative isolate overflow-hidden border-b border-violet-200 bg-[#24164f]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/cdh-hero.jpg")',
            backgroundPosition: "center center",
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(24,15,55,0.95)_0%,rgba(38,24,82,0.82)_42%,rgba(38,24,82,0.28)_72%,rgba(38,24,82,0.08)_100%)]" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="relative z-10 max-w-2xl py-4">
            <span className="inline-flex items-center border-l-2 border-violet-300 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-100 backdrop-blur-sm">
              Hospital information
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl">
              Casiguran District Hospital
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-violet-100 sm:text-lg sm:leading-8">
              Compassionate, accessible, and community-centered care for the people of Casiguran and nearby communities.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/about"
                className="inline-flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-violet-900 shadow-lg transition hover:bg-violet-50"
              >
                About us <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Contact hospital <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-5 pb-12 pt-14 sm:px-8 sm:pt-20">
        <div className="grid gap-10 border-y border-slate-200 py-10 md:grid-cols-[0.8fr_1.2fr] md:py-14">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">About the hospital</p>
            <h3 className="mt-4 max-w-md text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              {aboutPage?.title || "Trusted care in our local community"}
            </h3>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-violet-700 hover:text-violet-900">
              Learn more <ArrowRight size={15} />
            </Link>
          </div>
          <p className="max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            {aboutPage?.body || "Official hospital profile information will appear here once published."}
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-16 sm:px-8 md:grid-cols-[1.35fr_0.65fr]">
        <div className="relative min-h-[260px] overflow-hidden bg-[#24164f]">
          <Image src="/cdh-facade.png" alt="Casiguran District Hospital facility" fill className="object-cover opacity-70" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(36,22,79,0.92),rgba(36,22,79,0.2))]" />
          <div className="relative flex min-h-[260px] max-w-md flex-col justify-end p-7 text-white sm:p-9">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-200">Photo highlights</p>
            <h3 className="mt-3 text-2xl font-semibold">A place prepared for community care</h3>
            <p className="mt-3 text-sm leading-6 text-violet-100/80">Approved hospital photography can be featured here as it becomes available.</p>
          </div>
        </div>
        <div className="flex min-h-[260px] flex-col justify-between border border-violet-200 bg-white p-7 shadow-[0_16px_36px_rgba(37,27,88,0.06)] sm:p-9">
          <Building2 className="text-violet-700" size={26} strokeWidth={1.5} />
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">Future gallery space</p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">Facilities, people, and activities</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">This visual structure is ready for approved institutional images without inventing people or events.</p>
          </div>
        </div>
      </section>

      <section id="announcements" className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Announcements</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Important updates</h3>
          </div>
          <Link href="/announcements" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            View all →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredAnnouncements.length > 0 ? (
            featuredAnnouncements.map((item) => (
              <article key={item.id} className="rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
                    {formatDate(item.publishAt || item.createdAt)}
                  </p>
                  {item.priority === "urgent" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-red-700">
                      Urgent
                    </span>
                  ) : null}
                </div>
                <h4 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h4>
                <p className="mt-3 text-base leading-7 text-slate-600">{item.body}</p>
              </article>
            ))
          ) : (
            <div className="border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600 md:col-span-3">
              <Megaphone className="mx-auto text-violet-500" size={26} strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">No public announcements at this time</p>
              <p className="mt-2 text-sm">Official hospital bulletins and advisories will be published here.</p>
            </div>
          )}
        </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 pb-16 pt-16 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Services</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
              Core healthcare services
            </h3>
          </div>
          <Link href="/services" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            Explore all →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredServices.length > 0 ? (
            featuredServices.map((service) => (
              <div key={service.id} className="rounded-[24px] border border-violet-200 bg-white p-5 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-lg font-medium text-violet-700">
                  {service.iconOrImageUrl ? (
                    <img src={service.iconOrImageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    "+"
                  )}
                </div>
                <p className="text-lg font-semibold text-slate-900">{service.name}</p>
                {service.department ? <p className="mt-1 text-sm font-medium text-violet-700">{service.department}</p> : null}
                <p className="mt-3 text-sm leading-7 text-slate-600">{service.description}</p>
              </div>
            ))
          ) : (
            <div className="border border-dashed border-violet-200 bg-white p-10 text-center text-sm text-slate-600 md:col-span-3">
              <HeartPulse className="mx-auto text-violet-500" size={28} strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">No services have been published yet</p>
              <p className="mt-2">The official service directory will appear here once published.</p>
            </div>
          )}
        </div>
      </section>

      <section id="news" className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">News</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Latest updates</h3>
          </div>
          <Link href="/news" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            See more →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredNews.length > 0 ? (
            featuredNews.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
                <div
                  className="h-32 bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)] bg-cover bg-center"
                  style={item.coverImageUrl ? { backgroundImage: `url('${item.coverImageUrl}')` } : undefined}
                />
                <div className="p-6">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
                    {formatDate(item.publishedAt || item.createdAt)}
                  </p>
                  <h4 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h4>
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {item.excerpt || (item.body.length > 140 ? `${item.body.slice(0, 140)}...` : item.body)}
                  </p>
                  <Link
                    href={`/news/${encodeURIComponent(item.slug)}`}
                    className="mt-4 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-800"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div className="border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600 md:col-span-3">
              <Newspaper className="mx-auto text-violet-500" size={28} strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">No news articles published yet</p>
              <p className="mt-2 text-sm">Official updates and health advisories will appear here.</p>
            </div>
          )}
        </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Events</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Upcoming activities</h3>
          </div>
          <Link href="/events" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            View calendar →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredEvents.length > 0 ? (
            featuredEvents.map((item) => {
              const eventDate = formatEventDate(item.startAt);
              return (
                <div key={item.id} className="rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
                  <div className="flex h-16 w-16 flex-col items-center justify-center rounded-[18px] bg-violet-100 text-center text-violet-800">
                    <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em]">{eventDate.month}</span>
                    <span className="text-lg font-semibold">{eventDate.day}</span>
                  </div>
                  <h4 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h4>
                  {item.location ? <p className="mt-2 text-sm font-medium text-violet-700">{item.location}</p> : null}
                  {item.description ? <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p> : null}
                </div>
              );
            })
          ) : (
            <div className="border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600 md:col-span-3">
              <CalendarDays className="mx-auto text-violet-500" size={28} strokeWidth={1.5} />
              <p className="font-semibold text-slate-900">No upcoming events scheduled</p>
              <p className="mt-2 text-sm">Hospital activities and community health schedules will be listed here.</p>
            </div>
          )}
        </div>
      </section>

      <section id="resources" className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Resources</p>
            <h3 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Documents and reports</h3>
          </div>
          <Link href="/documents" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            View all →
          </Link>
        </div>

            <div className="border border-violet-200 bg-[#fbfaff] p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {featuredDocuments.length > 0 ? (
              featuredDocuments.map((item) => (
                <a
                  key={item.id}
                  href={item.viewUrl ?? item.downloadUrl ?? "/documents"}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-[20px] border border-violet-200 bg-violet-50/50 p-5 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-100/60"
                >
                  <span className="truncate pr-2">{item.title}</span>
                  <span className="shrink-0 text-xs font-semibold text-violet-700">
                    {(item.fileExtension ?? item.mimeType ?? "DOC").toUpperCase().slice(0, 4)} →
                  </span>
                </a>
              ))
            ) : (
              <div className="border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center text-sm font-medium text-slate-600 md:col-span-3">
                <FileText className="mx-auto mb-3 text-violet-500" size={28} strokeWidth={1.5} />
                Official public documents and reports will be listed here once published.
              </div>
            )}
          </div>
        </div>
        </div>
      </section>

      <section id="contact" className="bg-[#24164f] py-16 text-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 md:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-300">Contact</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">Get in touch</h3>
          </div>

          <div className="grid gap-5 text-sm leading-7 text-violet-100 sm:grid-cols-2 sm:text-base">
            <p className="flex gap-3"><MapPin className="mt-1 shrink-0 text-violet-300" size={17} />{settings?.address || "Official Address — To be provided"}</p>
            <p className="flex gap-3"><Phone className="mt-1 shrink-0 text-violet-300" size={17} />{settings?.phone || "Official Contact Number — To be provided"}</p>
            <p className="flex gap-3"><Mail className="mt-1 shrink-0 text-violet-300" size={17} />{settings?.email || "Official Email — To be provided"}</p>
            <div>
              <p className="font-semibold text-white">Administrative Office Hours</p>
              <p>{settings?.officeHours || "Administrative office hours — to be provided"}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Emergency Services</p>
              <p>{settings?.emergencyServices24Hours ? "Open 24 hours, 7 days a week" : "Emergency services schedule — to be provided"}</p>
            </div>
            <div>
              <p className="font-semibold text-white">Connect With Us</p>
              {settings?.facebookUrl ? (
                <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-violet-300 underline-offset-2 hover:text-white">
                  Official Facebook Page
                </a>
              ) : (
                <p>Official Facebook URL — To be provided</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="relative isolate overflow-hidden border-t border-violet-400/30 bg-[#21164f] text-white">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 overflow-hidden opacity-80">
          <div className="absolute -left-24 bottom-[-8rem] h-52 w-[32rem] rounded-[50%] bg-violet-800/70" /><div className="absolute -right-28 bottom-[-7rem] h-56 w-[34rem] rounded-[50%] bg-violet-800/70" />
          <div className="absolute -left-16 bottom-[-10rem] h-52 w-[34rem] rounded-[50%] border-t border-violet-400/30 bg-violet-950/40" /><div className="absolute -right-16 bottom-[-9rem] h-52 w-[34rem] rounded-[50%] border-t border-violet-400/30 bg-violet-950/40" />
        </div>
        <div className="relative mx-auto grid max-w-7xl gap-9 px-5 py-12 sm:px-8 md:grid-cols-[1.35fr_0.75fr_1fr_0.95fr] md:gap-0 md:py-14">
          <div className="space-y-5 md:pr-10"><div className="flex items-center gap-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-violet-300 bg-white shadow-lg"><Image src="/cdh-logo-circle.png" alt="Casiguran District Hospital logo" fill sizes="64px" unoptimized className="object-cover" /></div><div className="leading-tight"><p className="text-xl font-bold text-white">Casiguran District</p><p className="text-2xl font-bold text-violet-300">Hospital</p></div></div><div className="h-1 w-14 rounded-full bg-violet-400" /><p className="max-w-md whitespace-pre-line text-sm leading-7 text-violet-100/85">{aboutPage?.body || "Official hospital profile information will appear here once published."}</p></div>
          <div className="border-violet-400/35 md:border-l md:px-8"><h4 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Quick Links</h4><ul className="grid grid-cols-2 gap-x-5 gap-y-2 text-sm text-violet-100/90 md:grid-cols-1">{footerQuickLinks.map((item) => <li key={`${item.label}-${item.href}`}><Link href={item.href} className="transition hover:text-white">{item.label}</Link></li>)}</ul></div>
          <div className="border-violet-400/35 md:border-l md:px-8"><h4 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Hospital Information</h4><ul className="space-y-4 text-sm leading-6 text-violet-100/90"><li>{settings?.address || "Official Address — To be provided"}</li><li>{settings?.phone || "Official Contact Number — To be provided"}</li><li>{settings?.email || "Official Email — To be provided"}</li><li className="whitespace-pre-line">{formatOfficeHours(settings?.administrativeOfficeHours, settings?.officeHours)}</li></ul></div>
          <div className="border-violet-400/35 md:border-l md:px-8"><h4 className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-violet-300">Connect With Us</h4><p className="mb-5 text-sm text-violet-100/90">Official Facebook Page</p>{settings?.facebookUrl ? <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-violet-500"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-lg font-bold text-violet-700">f</span>Official Facebook Page -&gt;</a> : <span className="text-sm text-violet-100/75">Official Facebook URL — To be provided</span>}</div>
        </div>
        <div className="relative border-t border-violet-400/35 bg-[#19113d]/80"><div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-4 text-xs text-violet-200/80 sm:flex-row sm:items-center sm:px-8"><Activity size={42} strokeWidth={1.5} className="text-violet-400" aria-hidden="true" /><p className="flex-1">Official Website of Casiguran District Hospital.</p><p>© 2026 Casiguran District Hospital. All Rights Reserved.</p></div></div>
      </footer>
    </main>
  );
}
