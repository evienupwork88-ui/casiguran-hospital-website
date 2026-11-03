"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicCitizensCharterSlideshow } from "@/lib/api/citizens-charter-slideshow";
import { getPublicNews, type NewsItem } from "@/lib/api/news";
import { getPublicAnnouncements, type AnnouncementItem } from "@/lib/api/announcements";

type FeedItem =
  | { type: "news"; item: NewsItem; date: string }
  | { type: "announcement"; item: AnnouncementItem; date: string };

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T12:00:00` : dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hasSlideshowError, setHasSlideshowError] = useState(false);

  useEffect(() => {
    async function loadNews() {
      try {
        const [newsItems, announcementItems] = await Promise.all([getPublicNews(), getPublicAnnouncements()]);
        setNews(newsItems);
        setAnnouncements(announcementItems);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPublicCitizensCharterSlideshow()
      .then((slideshow) => {
        if (!cancelled) setHeroImages(slideshow.coverImages.map((image) => image.url));
      })
      .catch(() => {
        if (!cancelled) setHasSlideshowError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const feed: FeedItem[] = [
    ...news.map((item) => ({ type: "news" as const, item, date: item.displayDate || item.publishedAt || item.createdAt })),
    ...announcements.map((item) => ({ type: "announcement" as const, item, date: item.displayDate || item.publishAt || item.createdAt })),
  ].sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime());
  const currentYear = Math.max(2026, new Date().getFullYear());
  const years = Array.from({ length: currentYear - 2026 + 1 }, (_, index) => currentYear - index);
  const selectedFeed = feed.filter((entry) => {
    const year = Number(entry.date.slice(0, 4));
    return Number.isFinite(year) && year === selectedYear;
  });
  const monthCounts = selectedFeed.reduce<Record<number, number>>((counts, entry) => {
    const month = Number(entry.date.slice(5, 7));
    if (month >= 1 && month <= 12) counts[month] = (counts[month] ?? 0) + 1;
    return counts;
  }, {});
  const visibleFeed = selectedMonth === null
    ? selectedFeed
    : selectedFeed.filter((entry) => Number(entry.date.slice(5, 7)) === selectedMonth);

  return (
    <PublicShell
      title="News and Updates"
      subtitle="Official hospital news, announcements, and public advisories."
      heroImages={heroImages}
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {hasSlideshowError ? (
          <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Header photos could not be loaded. News and updates are still available.
          </p>
        ) : null}
        {isLoading ? (
          <div className="rounded-[26px] border border-violet-200 bg-white p-8 text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            Loading news...
          </div>
        ) : hasError ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            <p className="font-semibold text-slate-900">News is temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter news and updates by year">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  aria-pressed={selectedYear === year}
                  onClick={() => {
                    setSelectedYear(year);
                    setSelectedMonth(null);
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selectedYear === year
                      ? "border-violet-700 bg-violet-700 text-white"
                      : "border-violet-200 bg-white text-violet-800 hover:bg-violet-50"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
            <aside className="mb-6 rounded-2xl border border-violet-200 bg-white p-4 min-[1500px]:fixed min-[1500px]:left-0 min-[1500px]:top-[130px] min-[1500px]:z-20 min-[1500px]:mb-0 min-[1500px]:max-h-[calc(100dvh-9rem)] min-[1500px]:w-[190px] min-[1500px]:overflow-y-auto">
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Browse by month</h2>
                <div className="flex gap-2 overflow-x-auto pb-1 min-[1500px]:flex-col min-[1500px]:overflow-visible min-[1500px]:pb-0" role="group" aria-label={`Filter ${selectedYear} news and updates by month`}>
                  <button
                    type="button"
                    aria-pressed={selectedMonth === null}
                    onClick={() => setSelectedMonth(null)}
                    className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                      selectedMonth === null ? "bg-violet-700 text-white" : "text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                    }`}
                  >
                    <span>All months</span>
                    <span className={`text-xs ${selectedMonth === null ? "text-violet-100" : "text-slate-400"}`}>{selectedFeed.length}</span>
                  </button>
                  {months.map((month, index) => {
                    const monthNumber = index + 1;
                    const isSelected = selectedMonth === monthNumber;
                    return (
                      <button
                        key={month}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={!monthCounts[monthNumber]}
                        onClick={() => setSelectedMonth(monthNumber)}
                        className={`flex shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          isSelected ? "bg-violet-700 text-white" : "text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                        }`}
                      >
                        <span>{month}</span>
                        <span className={`text-xs ${isSelected ? "text-violet-100" : "text-slate-400"}`}>{monthCounts[monthNumber] ?? 0}</span>
                      </button>
                    );
                  })}
                </div>
            </aside>
            {visibleFeed.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
                <p className="font-semibold text-slate-900">
                  {feed.length === 0
                    ? "No news or updates published yet"
                    : selectedFeed.length === 0
                      ? `No news or updates from ${selectedYear} yet`
                      : `No news or updates from ${months[(selectedMonth ?? 1) - 1]} ${selectedYear}`}
                </p>
                <p className="mt-2 text-sm">Official hospital news and advisories will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {visibleFeed.map((entry) => {
                  const isNews = entry.type === "news";
                  const title = entry.item.title;
                  const body = entry.item.body;
                  const preview = entry.item.excerpt || (body.length > 140 ? `${body.slice(0, 140)}...` : body);
                  const externalUrl = entry.item.externalUrl;
                  const coverImageUrl = entry.item.coverImageUrl;
                  const card = (
                    <>
                      {coverImageUrl ? (
                        <div className="bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverImageUrl} alt={`${title} cover`} className="block h-auto w-full" loading="lazy" />
                        </div>
                      ) : (
                        <div className="h-52 bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)]" />
                      )}
                      <div className="border-t-2 border-violet-100 p-6">
                        <div className="flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-violet-700">
                          <span>{isNews ? "News" : "Update"}</span>
                          <span>{formatDate(entry.date)}</span>
                        </div>
                        <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{title}</h2>
                        <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-600">{preview}</p>
                        {externalUrl ? (
                          <span className="mt-5 inline-flex text-sm font-semibold text-violet-700">
                            Open original post ↗
                          </span>
                        ) : !isNews && entry.item.priority === "urgent" ? (
                          <span className="mt-4 inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-red-700">Urgent</span>
                        ) : null}
                      </div>
                    </>
                  );

                  return isNews && !externalUrl ? (
                    <Link
                      key={`news-${entry.item.id}`}
                      href={`/news/${encodeURIComponent(entry.item.slug)}`}
                      className="group overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(37,27,88,0.05)] transition hover:border-violet-300"
                    >
                      {card}
                    </Link>
                  ) : externalUrl ? (
                    <a
                      key={`${entry.type}-${entry.item.id}`}
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(37,27,88,0.05)] transition hover:border-violet-300"
                    >
                      {card}
                    </a>
                  ) : (
                    <article key={`announcement-${entry.item.id}`} className="overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(37,27,88,0.05)]">
                      {card}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </PublicShell>
  );
}