"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;

type OrganizationalChartImageViewerProps = {
  src: string;
  alt: string;
  title: string;
  children: ReactNode;
};

export function OrganizationalChartImageViewer({
  src,
  alt,
  title,
  children,
}: OrganizationalChartImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const dragStart = useRef<{
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

  useEffect(() => {
    if (!isViewerOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsViewerOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isViewerOpen]);

  function startPan(event: PointerEvent<HTMLDivElement>) {
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

  function pan(event: PointerEvent<HTMLDivElement>) {
    const start = dragStart.current;
    if (!start || start.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = start.scrollLeft - (event.clientX - start.x);
    event.currentTarget.scrollTop = start.scrollTop - (event.clientY - start.y);
  }

  function stopPan(event: PointerEvent<HTMLDivElement>) {
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
    <>
      <div className="mb-5 flex justify-end gap-2">
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
      </div>
      {children}
      {isViewerOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-2 sm:p-5"
          onClick={closeViewer}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${title} viewer`}
            className="flex h-full w-full flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex min-h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 sm:px-5">
              <span className="truncate text-sm font-semibold text-slate-800">{title}</span>
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
                src={src}
                alt={alt}
                className="block h-auto max-w-none"
                style={{ width: `${zoom * 100}%` }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
