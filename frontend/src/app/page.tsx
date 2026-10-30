"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Building2, CalendarDays, FileText, HeartPulse, Mail, MapPin, Menu, Newspaper, Phone, X } from "lucide-react";
import { getPublicAnnouncements, type AnnouncementItem } from "@/lib/api/announcements";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";
import { getPublicEvents, type EventItem } from "@/lib/api/events";
import { getPublicNews, type NewsItem } from "@/lib/api/news";
import { getPublicPage, type PageItem } from "@/lib/api/pages";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";
import { PublicDesktopNavigation, PublicMobileNavigation } from "@/components/public/public-navigation";
import { formatOfficeHours } from "@/lib/format-office-hours";

const PGA_WEBSITE_URL = "https://auroraprovince.gov.ph/";

const footerQuickLinks = [
  { href: "/", label: "Home" },
  { href: "/vision-mission", label: "Vision & Mission" },
  { href: "/patient-rights", label: "Patient Rights" },
  { href: "/trainings", label: "Trainings" },
  { href: "/contact", label: "Contact" },
];

// Same class for both header logos so they are always equal
const headerLogoClass =
  "relative h-10 w-10 shrink-0 sm:h-16 sm:w-16 lg:h-24 lg:w-24";

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

function getDocumentPreviewKind(doc: DocumentItem): "pdf" | "image" | "other" {
  const extension = (doc.fileExtension ?? "").toLowerCase().replace(".", "");
  const mimeType = (doc.mimeType ?? "").toLowerCase();

  if (extension === "pdf" || mimeType.includes("pdf")) return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(extension) || mimeType.startsWith("image/")) return "image";
  return "other";
}

function getDocumentPageHref(doc: DocumentItem): string {
  switch (doc.category) {
    case "patient_rights":
      return "/patient-rights";
    case "development_plan":
      return "/transparency-seal";
    case "org_chart":
      return "/organizational-chart";
    default:
      return `/documents?category=${encodeURIComponent(doc.category)}`;
  }
}

export default function Home() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
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
        getPublicSettings(),
        getPublicAnnouncements(),
        getPublicNews(),
        getPublicEvents(),
        getPublicDocuments(),
        getPublicPage("about"),
      ]);

      const [settingsResult, announcementsResult, newsResult, eventsResult, documentsResult, aboutPageResult] = results;
      setHomeError(results.some((result) => result.status === "rejected"));
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

  const featuredUpdates = [
    ...announcements.map((item) => ({ type: "announcement" as const, item, date: item.publishAt || item.createdAt })),
    ...news.map((item) => ({ type: "news" as const, item, date: item.publishedAt || item.createdAt })),
  ]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 3);
  const featuredEvents = events.slice(0, 3);
  const featuredDocuments = documents.filter((doc) => doc.status === "published").slice(0, 3);

  return (
    <main className="public-theme min-h-screen bg-[#f8f9fc] text-slate-900">
      <header className="sticky top-0 z-30 overflow-visible border-b-2 border-[var(--gold-400)] bg-white/95 shadow-[0_8px_24px_rgba(37,27,88,0.06)] backdrop-blur-xl">

        <div className="relative flex min-h-[76px] w-full items-center justify-between gap-2 px-2 sm:min-h-[84px] sm:gap-3 sm:px-3 lg:min-h-[116px] lg:gap-6">
          {/* LEFT: PGA logo + CDH logo + title */}
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3">
            {/* PGA image has built-in white padding, so scale it up to match the CDH logo's visual size.
                Adjust scale-[1.15] (try 1.1 to 1.3) if it needs to be bigger or smaller. */}
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

          {/* CENTER: navigation */}
          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <PublicDesktopNavigation />
          </div>

          {/* RIGHT: mobile menu button */}
          <div className="flex shrink-0 items-center gap-3">
            <HeartPulse aria-hidden="true" className="hidden h-12 w-16 text-violet-700 opacity-30 2xl:block" strokeWidth={1.4} />
            <button
              type="button"
              ref={mobileMenuTriggerRef}
              aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileOpen}
              aria-controls="home-mobile-navigation"
              onClick={() => setMobileOpen((open) => !open)}
              className="inline-flex h-11 w-11 items-center justify-center border border-slate-200 bg-white text-violet-700 transition hover:bg-violet-50 lg:hidden"
            >
              <span className="sr-only">Toggle menu</span>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="home-mobile-navigation" ref={mobileMenuRef} className="border-t border-slate-200 bg-white px-5 py-4 shadow-lg lg:hidden">
            <PublicMobileNavigation onNavigate={() => setMobileOpen(false)} />
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

        <div className="relative mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-24">
          <div className="relative z-10 max-w-2xl py-4">
            <span className="inline-flex items-center border-l-2 border-violet-300 bg-white/10 px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-100 backdrop-blur-sm">
              Hospital information
            </span>
            <h1 className="image-overlay-heading mt-6 max-w-xl break-words text-4xl font-semibold leading-[1.02] tracking-[-0.03em] sm:text-6xl">
              Casiguran District Hospital
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-violet-100 sm:text-lg sm:leading-8">
              Compassionate, accessible, and community-centered care for the people of Casiguran and nearby communities.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/vision-mission"
                className="inline-flex items-center justify-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-violet-900 shadow-lg transition-colors duration-200 hover:bg-violet-600 hover:text-white"
              >
                About us <ArrowRight size={15} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 border border-white/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:border-[var(--gold-400)] hover:bg-[var(--gold-400)] hover:text-violet-950"
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
            <h2 className="mt-4 max-w-md text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              {aboutPage?.title || "Trusted care in our local community"}
            </h2>
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
            <h2 className="mt-3 text-2xl font-semibold text-white">A place prepared for community care</h2>
            <p className="mt-3 text-sm leading-6 text-violet-100/80">Approved hospital photography can be featured here as it becomes available.</p>
          </div>
        </div>
        <div className="flex min-h-[260px] flex-col justify-between border border-violet-200 bg-white p-7 shadow-[0_16px_36px_rgba(37,27,88,0.06)] sm:p-9">
          <Building2 className="text-violet-700" size={26} strokeWidth={1.5} />
          <div>
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">Future gallery space</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">Facilities, people, and activities</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">This visual structure is ready for approved institutional images without inventing people or events.</p>
          </div>
        </div>
      </section>

      <section id="news-updates" className="border-y border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">CDH News and Updates</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Latest from the hospital</h2>
            </div>
            <Link href="/news" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
              View all →
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {featuredUpdates.length > 0 ? (
              featuredUpdates.map((entry) => {
                const isNews = entry.type === "news";
                const content = (
                  <>
                    {isNews && entry.item.coverImageUrl ? (
                      <div className="h-32 bg-cover bg-center" style={{ backgroundImage: `url('${entry.item.coverImageUrl}')` }} />
                    ) : null}
                    <div className="p-6">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
                          {isNews ? "News" : "Update"} · {formatDate(entry.date)}
                        </p>
                        {!isNews && entry.item.priority === "urgent" ? (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-red-700">Urgent</span>
                        ) : null}
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{entry.item.title}</h3>
                      <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-600">
                        {isNews
                          ? entry.item.excerpt || (entry.item.body.length > 140 ? `${entry.item.body.slice(0, 140)}...` : entry.item.body)
                          : entry.item.body}
                      </p>
                      {isNews ? (
                        <span className="mt-4 inline-flex text-sm font-semibold text-violet-700">
                          {entry.item.externalUrl ? "Open original post ↗" : "Read more →"}
                        </span>
                      ) : null}
                    </div>
                  </>
                );
                const cardClass = "overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-[0_12px_28px_rgba(76,29,149,0.04)]";

                return isNews ? (
                  <Link
                    key={`news-${entry.item.id}`}
                    href={entry.item.externalUrl || `/news/${encodeURIComponent(entry.item.slug)}`}
                    target={entry.item.externalUrl ? "_blank" : undefined}
                    rel={entry.item.externalUrl ? "noopener noreferrer" : undefined}
                    className={cardClass}
                  >
                    {content}
                  </Link>
                ) : (
                  <article key={`announcement-${entry.item.id}`} className={cardClass}>{content}</article>
                );
              })
            ) : (
              <div className="border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600 md:col-span-3">
                <Newspaper className="mx-auto text-violet-500" size={26} strokeWidth={1.5} />
                <p className="font-semibold text-slate-900">No news or updates at this time</p>
                <p className="mt-2 text-sm">Official hospital news and advisories will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Events</p>
            <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Upcoming activities</h2>
          </div>
          <Link href="/events" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
            View calendar →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {featuredEvents.length > 0 ? (
            featuredEvents.map((item) => {
              const eventDate = formatEventDate(item.startAt);
              const content = (
                <>
                  {item.coverImageUrl ? (
                    <div
                      aria-label={`${item.title} thumbnail`}
                      className="h-36 bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url('${item.coverImageUrl}')` }}
                    />
                  ) : null}
                  <div className="p-6">
                    <div className="flex h-16 w-16 flex-col items-center justify-center rounded-[18px] bg-violet-100 text-center text-violet-800">
                      <span className="text-[0.64rem] font-semibold uppercase tracking-[0.14em]">{eventDate.month}</span>
                      <span className="text-lg font-semibold">{eventDate.day}</span>
                    </div>
                    <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h3>
                    {item.location ? <p className="mt-2 text-sm font-medium text-violet-700">{item.location}</p> : null}
                    {item.description ? <p className="mt-3 text-base leading-7 text-slate-600">{item.description}</p> : null}
                    {item.externalUrl ? <span className="mt-4 inline-flex text-sm font-semibold text-violet-700">Open event link ↗</span> : null}
                  </div>
                </>
              );
              const className = "overflow-hidden rounded-[26px] border border-violet-200 bg-white shadow-[0_12px_28px_rgba(76,29,149,0.04)]";
              return item.externalUrl ? (
                <a key={item.id} href={item.externalUrl} target="_blank" rel="noopener noreferrer" className={`${className} block`}>
                  {content}
                </a>
              ) : (
                <article key={item.id} className={className}>{content}</article>
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
              <h2 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">Documents and reports</h2>
            </div>
            <Link href="/documents" className="hidden text-sm font-semibold text-violet-700 hover:text-violet-800 md:inline-flex">
              View all →
            </Link>
          </div>

          <div className="border border-violet-200 bg-[#fbfaff] p-6">
            <div className="grid gap-4 md:grid-cols-3">
              {featuredDocuments.length > 0 ? (
                featuredDocuments.map((item) => {
                  const previewUrl = item.viewUrl ?? item.downloadUrl;
                  const previewKind = getDocumentPreviewKind(item);

                  return (
                    <a
                      key={item.id}
                      href={getDocumentPageHref(item)}
                      className="group overflow-hidden rounded-[20px] border border-violet-200 bg-white text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:shadow-[0_8px_24px_rgba(76,29,149,0.10)]"
                    >
                      <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-white">
                        {previewUrl && previewKind === "pdf" ? (
                          <iframe
                            src={previewUrl}
                            title={`Preview of ${item.title}`}
                            aria-hidden="true"
                            tabIndex={-1}
                            loading="lazy"
                            className="pointer-events-none absolute -left-4 -top-12 h-[calc(100%+3rem)] w-[calc(100%+2rem)] border-0 bg-white"
                          />
                        ) : previewUrl && previewKind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previewUrl} alt="" loading="lazy" className="h-full w-full object-contain" />
                        ) : (
                          <FileText aria-hidden="true" className="text-violet-400" size={36} strokeWidth={1.4} />
                        )}
                        <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-violet-700 shadow-sm">
                          {(item.fileExtension ?? item.mimeType ?? "DOC").replace(".", "").toUpperCase().slice(0, 4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3 p-4">
                        <span className="truncate">{item.title}</span>
                        <span aria-hidden="true" className="shrink-0 text-xs font-semibold text-violet-700 group-hover:text-violet-900">
                          View →
                        </span>
                      </div>
                    </a>
                  );
                })
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

      <section id="contact" className="bg-white py-12 sm:py-14">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-8 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Contact</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-4xl">Get in touch</h2>
            <p className="mt-3 max-w-sm text-base leading-7 text-slate-600">
              Reach the hospital using the details here, or visit our contact page for the full information.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-flex items-center gap-2 bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-violet-700"
            >
              Go to contact page <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-4 rounded-[20px] border border-violet-200 bg-[#fbfaff] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><MapPin size={18} strokeWidth={1.8} /></div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">Address</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{settings?.address || "Official Address — To be provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[20px] border border-violet-200 bg-[#fbfaff] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Phone size={18} strokeWidth={1.8} /></div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">Phone</p>
                <p className="mt-1 text-sm leading-6 text-slate-700">{settings?.phone || "Official Contact Number — To be provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[20px] border border-violet-200 bg-[#fbfaff] p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Mail size={18} strokeWidth={1.8} /></div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">Email</p>
                <p className="mt-1 break-words text-sm leading-6 text-slate-700">{settings?.email || "Official Email — To be provided"}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 rounded-[20px] border border-red-200 bg-red-50 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600"><HeartPulse size={18} strokeWidth={1.8} /></div>
              <div className="min-w-0">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-red-700">Emergency</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-900">
                  {settings?.emergencyServices24Hours ? "Open 24 hours, 7 days a week" : "Schedule — to be provided"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                href={PGA_WEBSITE_URL}
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