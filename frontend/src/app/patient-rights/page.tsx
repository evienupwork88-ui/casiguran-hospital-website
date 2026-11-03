"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicCitizensCharterSlideshow } from "@/lib/api/citizens-charter-slideshow";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

function PatientRightsDocument({ document }: { document: DocumentItem }) {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const fileUrl = document.viewUrl ?? document.downloadUrl;
  const isPdf = document.mimeType === "application/pdf" || document.fileExtension?.toLowerCase() === "pdf";
  const isImage = document.mimeType?.startsWith("image/") ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="order-2 h-[75vh] min-h-[480px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-[0_12px_26px_rgba(37,27,88,0.06)] lg:order-1">
        {!fileUrl ? (
          <div className="flex h-full items-center justify-center p-10 text-center text-slate-500">
            File unavailable.
          </div>
        ) : isPdf ? (
          <iframe title={document.title} src={fileUrl} className="h-full w-full border-0" />
        ) : isImage ? (
          <div className="flex h-full items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl} alt={document.title} className="max-h-full max-w-full object-contain" />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
            <p className="text-lg font-semibold text-slate-900">Preview not available</p>
            <p className="text-sm text-slate-500">This file type cannot be previewed in the browser.</p>
          </div>
        )}
      </div>

      <aside className="order-1 space-y-4 lg:order-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_26px_rgba(37,27,88,0.04)]">
          <div className="flex items-center justify-between gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-700">
            <span>Patient Rights</span>
            <span>{document.publishedAt ? new Date(document.publishedAt).getFullYear() : "Latest"}</span>
          </div>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900">{document.title}</h2>
          {document.description ? (
            <p className="mt-2 text-sm leading-6 text-slate-600">{document.description}</p>
          ) : null}
          <div className="mt-5 flex flex-col gap-2">
            {fileUrl ? (
              <button type="button" onClick={() => setIsViewerOpen(true)} className="rounded-full bg-violet-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-800">
                View
              </button>
            ) : (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-slate-500">
                File unavailable
              </span>
            )}
          </div>
        </div>
      </aside>

      {isViewerOpen && fileUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby={`patient-rights-viewer-${document.id}`}>
          <div className="flex h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <h2 id={`patient-rights-viewer-${document.id}`} className="text-base font-semibold text-slate-900">{document.title}</h2>
              <button type="button" onClick={() => setIsViewerOpen(false)} aria-label="Close Patient Rights viewer" className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
            </div>
            <div className="min-h-0 flex-1 bg-slate-100">
              {isPdf ? (
                <iframe title={document.title} src={fileUrl} className="h-full w-full border-0" />
              ) : isImage ? (
                <div className="flex h-full items-center justify-center overflow-auto p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl} alt={document.title} className="max-h-full max-w-full object-contain" />
                </div>
              ) : (
                <p className="flex h-full items-center justify-center p-10 text-center text-slate-600">
                  Preview is not available for this file type.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function PatientRightsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hasSlideshowError, setHasSlideshowError] = useState(false);

  useEffect(() => {
    async function loadPatientRights() {
      try {
        const items = await getPublicDocuments("patient_rights");
        setDocuments(items.filter((item) => item.status === "published"));
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadPatientRights();
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

  return (
    <PublicShell title="Patient Rights" subtitle="Official information about the rights of patients at Casiguran District Hospital." heroImages={heroImages}>
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {hasSlideshowError ? (
          <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Header photos could not be loaded. Patient Rights information is still available.
          </p>
        ) : null}
        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading Patient Rights...
          </div>
        ) : hasError ? (
          <div role="alert" className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-red-800">
            Unable to load the Patient Rights document. Please try again later.
          </div>
        ) : documents.length ? (
          <div className="space-y-6">
            {documents.map((document) => <PatientRightsDocument key={document.id} document={document} />)}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">Patient Rights information is not published yet</p>
            <p className="mt-2 text-sm">The official document will appear here once uploaded and published by the hospital.</p>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
