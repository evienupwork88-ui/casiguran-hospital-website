"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function HospitalHistoryPage() {
  const [historyPage, setHistoryPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistoryData() {
      try {
        const data = await getPublicPage("hospital-history");
        setHistoryPage(data);
      } catch {
        setHistoryPage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistoryData();
  }, []);

  const paragraphs = historyPage?.body
    ? historyPage.body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title={historyPage?.title || "Kasaysayan ng Ospital"}
      subtitle="Official institutional history and milestones."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Hospital history</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              {historyPage?.title || "Kasaysayan ng Ospital"}
            </h2>
            {isLoading ? (
              <p className="mt-4 text-base leading-8 text-slate-500">Loading hospital history...</p>
            ) : paragraphs.length > 0 ? (
              <div className="mt-4 space-y-4">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className="text-base leading-8 text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-base leading-8 text-slate-600">
                Official hospital history will appear here once the approved content is published.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-violet-50/60 p-4">
            <div className="h-full min-h-[220px] rounded-[18px] bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(255,255,255,0.8)),url('/cdh-hero.jpg')] bg-cover bg-center" />
          </div>
        </div>

        <div className="mt-12 rounded-[28px] border border-violet-200 bg-violet-50/60 p-7 text-center">
          <Link href="/about" className="inline-flex rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">
            Back to About
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
