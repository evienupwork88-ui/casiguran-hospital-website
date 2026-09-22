"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadDocuments() {
      try {
        const items = await getPublicDocuments();
        setDocuments(items.filter((item) => item.status === "published"));
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadDocuments();
  }, []);

  return (
    <PublicShell
      title="Documents & Reports"
      subtitle="Official downloadable resources and institutional reports published by Casiguran District Hospital."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 border-b border-slate-200 bg-white p-6">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Public resources</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Official documents and reports</h2>
        </div>

        {isLoading ? (
          <div role="status" aria-busy="true" className="border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading documents...
          </div>
        ) : hasError ? (
          <div role="alert" className="border border-red-200 bg-red-50 p-10 text-center text-red-800">
            <p className="text-lg font-semibold">Unable to load documents</p>
            <p className="mt-2 text-sm">Please try again later.</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">No public documents yet</p>
            <p className="mt-2 text-sm">Official documents will appear here once they are uploaded to the CMS.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {documents.map((doc) => {
              const viewUrl = doc.viewUrl ?? doc.downloadUrl;
              const downloadUrl = doc.downloadUrl ?? doc.viewUrl;

              return (
                <article key={doc.id} className="border border-slate-200 bg-white p-6 shadow-[0_12px_26px_rgba(37,27,88,0.04)] transition hover:border-violet-300">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-lg font-semibold text-violet-700">
                    {(doc.fileExtension ?? doc.mimeType ?? "DOC").toUpperCase().slice(0, 4)}
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-700">
                    <span>{doc.category === "report" ? "Report" : doc.category === "policy" ? "Policy" : doc.category === "org_chart" ? "Org Chart" : "Document"}</span>
                    <span>{doc.publishedAt ? new Date(doc.publishedAt).getFullYear() : "Latest"}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{doc.title}</h3>
                  <p className="mt-3 min-h-[72px] text-base leading-7 text-slate-600">{doc.description || "No description provided."}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {viewUrl ? (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
                      >
                        View
                      </a>
                    ) : null}
                    {downloadUrl ? (
                      <a
                        href={downloadUrl}
                        download
                        className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-500">
                        File unavailable
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
