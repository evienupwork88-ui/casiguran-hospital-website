"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function HospitalHistoryPage() {
  const [historyPage, setHistoryPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);

  useEffect(() => {
    async function loadHistoryData() {
      try {
        setHistoryPage(await getPublicPage("hospital-history"));
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistoryData();
  }, []);

  const paragraphs = historyPage?.body
    ? historyPage.body.split(/\n+| {2,}/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title="Hospital History"
      subtitle="The story and milestones of Casiguran District Hospital."
      heroImages={historyPage?.coverImages?.map((image) => image.url)}
    >
      <section className="mx-auto max-w-7xl space-y-8 px-5 pb-16 sm:px-8">
        <article className="rounded-[28px] border border-slate-200 bg-white px-6 py-8 shadow-[0_12px_34px_rgba(15,23,42,0.04)] sm:px-10 sm:py-11 lg:px-14">
          <div>
            <div className="mb-7 border-b border-violet-100 pb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-700">The story</p>
            </div>
            {isLoading ? (
              <p role="status" className="text-base leading-8 text-slate-600">Loading hospital history...</p>
            ) : hasError ? (
              <p role="alert" className="text-base leading-8 text-red-700">Unable to load the hospital history right now. Please try again later.</p>
            ) : paragraphs.length > 0 ? (
              <>
                <div
                  tabIndex={0}
                  aria-label="Hospital history story"
                  className={`relative ${
                    isStoryExpanded ? "max-h-none" : "max-h-72 overflow-hidden"
                  } md:max-h-none md:overflow-visible`}
                >
                  <div className="space-y-6">
                    {paragraphs.map((paragraph, index) => (
                      <p key={index} className="text-base leading-8 text-slate-700 sm:text-[1.05rem]">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {!isStoryExpanded && (
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden" />
                  )}
                </div>
                <button
                  type="button"
                  aria-expanded={isStoryExpanded}
                  onClick={() => setIsStoryExpanded((expanded) => !expanded)}
                  className="mt-4 font-semibold text-violet-700 hover:text-violet-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-700 md:hidden"
                >
                  {isStoryExpanded ? "Read less" : "Read more"}
                </button>
              </>
            ) : (
              <p className="text-base leading-8 text-slate-600">
                Official hospital history will appear here once the approved content is published.
              </p>
            )}
          </div>
        </article>
      </section>
    </PublicShell>
  );
}
