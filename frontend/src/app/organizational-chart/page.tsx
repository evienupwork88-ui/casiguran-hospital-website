"use client";

import { useEffect, useRef, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicCitizensCharterSlideshow } from "@/lib/api/citizens-charter-slideshow";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

export default function OrganizationalChartPage() {
  const [chart, setChart] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hasSlideshowError, setHasSlideshowError] = useState(false);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

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

  useEffect(() => {
    if (!isViewerOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsViewerOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isViewerOpen]);

  const chartFileUrl = chart?.viewUrl ?? chart?.downloadUrl ?? null;
  const isImage = chart?.mimeType?.startsWith("image/") ?? false;

  function startPan(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= 1 || !event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      scrollLeft: event.currentTarget.scrollLeft,
      scrollTop: event.currentTarget.scrollTop,
    };
    setIsDragging(true);
  }

  function pan(event: React.PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = start.scrollLeft - (event.clientX - start.x);
    event.currentTarget.scrollTop = start.scrollTop - (event.clientY - start.y);
  }

  function stopPan(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStart.current?.pointerId !== event.pointerId) return;
    dragStart.current = null;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function closeViewer() {
    setIsViewerOpen(false);
    setIsDragging(false);
    dragStart.current = null;
  }

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
            <div className="mb-5 flex justify-end gap-2">
              {isImage ? (
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setIsViewerOpen(true);
                  }}
                  className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
                >
                  View
                </button>
              ) : (
                <a href={chartFileUrl} target="_blank" rel="noreferrer" className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">
                  View
                </a>
              )}
            </div>

            {chart.description?.trim() &&
            chart.description.trim().toLowerCase() !== "current official organizational chart for the public website." ? (
              <p className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{chart.description}</p>
            ) : null}

            <div className="overflow-hidden rounded-[22px] border border-violet-200 bg-slate-50 p-3">
              {isImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={chartFileUrl}
                  alt="Official organizational chart"
                  className="block h-auto w-full"
                  draggable={false}
                />
              ) : (
                <iframe src={chartFileUrl} title="Official organizational chart" className="h-[75vh] w-full rounded-xl border-0 bg-white" />
              )}
            </div>
          </div>
        )}
      </section>
      {isViewerOpen && chartFileUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 sm:p-5"
          onClick={closeViewer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Organizational chart viewer"
            className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 sm:px-5">
              <span className="truncate text-sm font-semibold text-slate-800">Organizational Chart</span>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP))}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white text-lg font-semibold text-violet-800 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  −
                </button>
                <span className="min-w-12 text-center text-sm font-medium text-slate-700" aria-live="polite">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP))}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-violet-200 bg-white text-lg font-semibold text-violet-800 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  disabled={zoom === 1}
                  className="hidden rounded-full border border-violet-200 bg-white px-3 py-2 text-xs font-semibold text-violet-800 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40 sm:inline-flex"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={closeViewer}
                  aria-label="Close chart viewer"
                  className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-violet-700 text-xl font-semibold text-white hover:bg-violet-800"
                >
                  ×
                </button>
              </div>
            </div>
            <div
              onPointerDown={startPan}
              onPointerMove={pan}
              onPointerUp={stopPan}
              onPointerCancel={stopPan}
              onLostPointerCapture={stopPan}
              className={`min-h-0 flex-1 overflow-auto overscroll-contain bg-slate-100 ${
                zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
              }`}
              style={{ touchAction: zoom > 1 ? "none" : "auto" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chartFileUrl}
                alt="Official organizational chart"
                className="block h-auto max-w-none"
                style={{ width: `${zoom * 100}%` }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </PublicShell>
  );
}
