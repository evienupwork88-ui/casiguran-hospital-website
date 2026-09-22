"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function VisionMissionPage() {
  const [vmPage, setVmPage] = useState<PageItem | null>(null);
  const [cvPage, setCvPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [vmData, cvData] = await Promise.all([
          getPublicPage("vision-mission").catch(() => null),
          getPublicPage("core-values").catch(() => null),
        ]);
        setVmPage(vmData);
        setCvPage(cvData);
      } catch {
        setVmPage(null);
        setCvPage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const coreValues = cvPage?.body
    ? cvPage.body.split(/\n+/).map((v) => v.trim()).filter(Boolean)
    : [];

  const vmParagraphs = vmPage?.body
    ? vmPage.body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title={vmPage?.title || "Vision, Mission & Core Values"}
      subtitle="Official institutional statements and guiding principles."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Institutional Mandate</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
            {vmPage?.title || "Vision & Mission"}
          </h2>
          {isLoading ? (
            <p className="mt-4 text-base leading-8 text-slate-500">Loading vision and mission...</p>
          ) : vmParagraphs.length > 0 ? (
            <div className="mt-4 space-y-4">
              {vmParagraphs.map((paragraph, index) => (
                <p key={index} className="text-base leading-8 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-base leading-8 text-slate-600">
              Official vision and mission statements will appear here once published.
            </p>
          )}
        </div>

        <div className="mt-12 rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Core Values</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
            {cvPage?.title || "Guiding principles of service"}
          </h3>
          {isLoading ? (
            <p className="mt-4 text-slate-500">Loading core values...</p>
          ) : coreValues.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {coreValues.map((item, index) => (
                <div key={index} className="rounded-[22px] border border-violet-200 bg-violet-50/50 p-5">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                    {index + 1}
                  </div>
                  <p className="text-base font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[22px] border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center text-sm font-medium text-slate-600">
              Official core values will appear here once published.
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
