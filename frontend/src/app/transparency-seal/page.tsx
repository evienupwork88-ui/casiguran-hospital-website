"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

function isHospitalDevelopmentPlan(document: DocumentItem) {
  return document.status === "published" && (
    document.category === "development_plan" ||
    (document.category !== "org_chart" && document.title.trim().toLowerCase() === "hospital development plan")
  );
}

export default function TransparencySealPage() {
  const [plan, setPlan] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        const documents = await getPublicDocuments();
        setPlan(documents.find(isHospitalDevelopmentPlan) ?? null);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadPlan();
  }, []);

  const fileUrl = plan?.viewUrl ?? plan?.downloadUrl ?? null;
  const isPdf = plan?.mimeType === "application/pdf" || plan?.fileExtension?.toLowerCase() === "pdf";

  return (
    <PublicShell
      title="Transparency Seal"
      subtitle="Official transparency documents and institutional information published by Casiguran District Hospital."
    >
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <div className="mb-6 rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-violet-700">Official transparency documents</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Hospital Development Plan</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">The official plan will appear here after it is uploaded and published through the hospital CMS.</p>
        </div>

        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600">Loading document...</div>
        ) : hasError ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-10 text-center text-red-800">Unable to load the Hospital Development Plan. Please try again later.</div>
        ) : !plan ? (
          <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">Hospital Development Plan not published yet</p>
            <p className="mt-2 text-sm">The official PDF will be available here once provided by the hospital.</p>
          </div>
        ) : !fileUrl ? (
          <div role="alert" className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-10 text-center text-red-800">The Hospital Development Plan file is temporarily unavailable.</div>
        ) : (
          <article className="rounded-2xl border border-violet-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Published document</p>
                <h3 className="mt-2 text-2xl font-semibold text-slate-900">{plan.title}</h3>
                {plan.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{plan.description}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {isPdf ? <button type="button" onClick={() => setIsViewerOpen(true)} className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800">View PDF</button> : null}
                <a href={plan.downloadUrl ?? fileUrl} download className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100">Download</a>
              </div>
            </div>
          </article>
        )}
      </section>

      {isViewerOpen && fileUrl ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="development-plan-viewer-title">
          <div className="flex h-[min(90vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <h2 id="development-plan-viewer-title" className="text-base font-semibold text-slate-900">Hospital Development Plan</h2>
              <button type="button" onClick={() => setIsViewerOpen(false)} aria-label="Close PDF viewer" className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
            </div>
            <iframe src={fileUrl} title="Hospital Development Plan PDF" className="min-h-0 flex-1 border-0 bg-slate-100" />
          </div>
        </div>
      ) : null}
    </PublicShell>
  );
}
