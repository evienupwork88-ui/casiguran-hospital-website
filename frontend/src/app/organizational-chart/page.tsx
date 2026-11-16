"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { OrganizationalChartImageViewer } from "@/components/public/organizational-chart-image-viewer";
import { getPublicCitizensCharterSlideshow } from "@/lib/api/citizens-charter-slideshow";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

export default function OrganizationalChartPage() {
  const [chart, setChart] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hasSlideshowError, setHasSlideshowError] = useState(false);

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

  const chartFileUrl = chart?.viewUrl ?? chart?.downloadUrl ?? null;
  const isImage = chart?.mimeType?.startsWith("image/") ?? false;

  return (
    <PublicShell
      title="Organizational Chart"
      subtitle="View the hospital's current chart."
      heroImages={heroImages}
    >
      <section className="mx-auto w-full max-w-none px-1 pb-16 sm:px-3 lg:px-5">
        {hasSlideshowError ? (
          <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Header photos could not be loaded. The organizational chart is still available.
          </p>
        ) : null}
        {isLoading ? (
          <div className="rounded-[26px] border border-violet-200 bg-white p-10 text-center text-slate-600">
            Loading chart...
          </div>
        ) : !chart ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600 shadow-[0_16px_30px_rgba(76,29,149,0.04)]">
            <p className="text-lg font-semibold text-slate-900">Organizational chart will be available once the official document is provided.</p>
          </div>
        ) : !chartFileUrl ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600 shadow-[0_16px_30px_rgba(76,29,149,0.04)]">
            <p className="text-lg font-semibold text-slate-900">The organizational chart file is temporarily unavailable.</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : (
          <div className="rounded-[28px] border border-violet-200 bg-white p-2 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-4 lg:p-5">
            {isImage ? (
              <OrganizationalChartImageViewer
                src={chartFileUrl}
                alt="Official organizational chart"
                title="Organizational Chart"
              >
                {chart.description?.trim() &&
                chart.description.trim().toLowerCase() !== "current official organizational chart for the public website." ? (
                  <p className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{chart.description}</p>
                ) : null}
                <div className="overflow-hidden rounded-[22px] border border-violet-200 bg-slate-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={chartFileUrl}
                    alt="Official organizational chart"
                    className="block h-auto w-full"
                    draggable={false}
                  />
                </div>
              </OrganizationalChartImageViewer>
            ) : (
              <>
                <div className="mb-5 flex justify-end gap-2">
                <a href={chartFileUrl} target="_blank" rel="noreferrer" className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
                  View
                </a>
                </div>
                {chart.description?.trim() &&
                chart.description.trim().toLowerCase() !== "current official organizational chart for the public website." ? (
                  <p className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{chart.description}</p>
                ) : null}
                <div className="overflow-hidden rounded-[22px] border border-violet-200 bg-slate-50 p-3">
                  <iframe src={chartFileUrl} title="Official organizational chart" className="h-[75vh] w-full rounded-xl border-0 bg-white" />
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
