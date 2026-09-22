"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicNews, type NewsItem } from "@/lib/api/news";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadNews() {
      try {
        const data = await getPublicNews();
        setNews(data);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadNews();
  }, []);

  return (
    <PublicShell
      title="Latest News"
      subtitle="Official hospital news, updates, and public information."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {isLoading ? (
          <div className="rounded-[26px] border border-violet-200 bg-white p-8 text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            Loading news...
          </div>
        ) : hasError ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            <p className="font-semibold text-slate-900">News is temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : news.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            <p className="font-semibold text-slate-900">No news articles published yet</p>
            <p className="mt-2 text-sm">Official updates and health advisories will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {news.map((item) => (
              <article key={item.id} className="overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(37,27,88,0.05)] transition hover:border-violet-300">
                <div
                  className="h-40 bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)] bg-cover bg-center"
                  style={item.coverImageUrl ? { backgroundImage: `url('${item.coverImageUrl}')` } : undefined}
                />
                <div className="border-t-2 border-violet-100 p-6">
                  <div className="flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-violet-700">
                    <span>News</span>
                    <span>{formatDate(item.publishedAt || item.createdAt)}</span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h2>
                  <p className="mt-3 text-base leading-7 text-slate-600">
                    {item.excerpt || (item.body.length > 140 ? `${item.body.slice(0, 140)}...` : item.body)}
                  </p>
                  <Link
                    href={`/news/${encodeURIComponent(item.slug)}`}
                    className="mt-5 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-800"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}