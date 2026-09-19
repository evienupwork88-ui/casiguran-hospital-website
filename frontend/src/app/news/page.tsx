"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public/site-shell";

const placeholderNews = [
  {
    id: "official-hospital-update",
    title: "[Official hospital update title]",
    date: "[Date to be provided]",
    category: "Announcement",
    excerpt: "[Official news excerpt to be provided]",
  },
  {
    id: "public-health-guidance",
    title: "[Official public health update title]",
    date: "[Date to be provided]",
    category: "Health Information",
    excerpt: "[Official health information summary to be provided]",
  },
  {
    id: "community-service-news",
    title: "[Official community service title]",
    date: "[Date to be provided]",
    category: "Community",
    excerpt: "[Official community service detail to be provided]",
  },
];

export default function NewsPage() {
  return (
    <PublicShell
      title="Latest News"
      subtitle="[Official hospital news and updates to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-[24px] border border-violet-200 bg-white p-5 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-violet-700">Section</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">News</p>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-5 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-violet-700">Status</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">Placeholder content</p>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-5 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-violet-700">Future use</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">Official articles</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {placeholderNews.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
              <div className="h-40 bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)]" />
              <div className="p-6">
                <div className="flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-violet-700">
                  <span>{item.category}</span>
                  <span>{item.date}</span>
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{item.excerpt}</p>
                <Link href="/news/official-hospital-update" className="mt-5 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-800">
                  Read more →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
