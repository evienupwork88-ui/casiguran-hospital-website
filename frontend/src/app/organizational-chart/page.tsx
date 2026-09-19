"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

export default function OrganizationalChartPage() {
  const [chart, setChart] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadChart() {
      try {
        const items = await getPublicDocuments();
        const current = items.find((item) => item.category === "org_chart" && item.status === "published") ?? null;
        setChart(current);
      } catch {
        setChart(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadChart();
  }, []);

  return (
    <PublicShell
      title="Organizational Chart"
      subtitle="The official hospital organizational chart is published here when made available by the institution."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Hospital structure</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Official organizational chart</h2>
        </div>

        {isLoading ? (
          <div className="rounded-[26px] border border-violet-200 bg-white p-10 text-center text-slate-600">
            Loading chart...
          </div>
        ) : !chart ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600 shadow-[0_16px_30px_rgba(76,29,149,0.04)]">
            <p className="text-lg font-semibold text-slate-900">Organizational chart will be available once the official document is provided.</p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">Current official chart</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">{chart.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={chart.viewUrl ?? chart.downloadUrl ?? "#"} target="_blank" rel="noreferrer" className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
                  View
                </a>
                <a href={chart.downloadUrl ?? chart.viewUrl ?? "#"} download className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">
                  Download
                </a>
              </div>
            </div>

            {chart.description ? (
              <p className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{chart.description}</p>
            ) : null}

            <div className="overflow-hidden rounded-[22px] border border-violet-200 bg-slate-50 p-3">
              {chart.mimeType?.startsWith("image/") ? (
                <img src={chart.viewUrl ?? chart.downloadUrl ?? ""} alt="Official organizational chart" className="max-h-[80vh] w-full rounded-xl object-contain bg-white" />
              ) : (
                <iframe src={chart.viewUrl ?? chart.downloadUrl ?? ""} title="Official organizational chart" className="h-[75vh] w-full rounded-xl border-0 bg-white" />
              )}
            </div>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
