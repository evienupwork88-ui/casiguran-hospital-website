"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

function PolicyDocument({ document }: { document: DocumentItem }) {
  const fileUrl = document.viewUrl ?? document.downloadUrl;
  const isPdf = document.mimeType === "application/pdf" || document.fileExtension?.toLowerCase() === "pdf";
  const isImage = document.mimeType?.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(document.fileExtension?.toLowerCase() ?? "");

  return (
    <article className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
      <h2 className="text-2xl font-semibold tracking-[-0.05em] text-slate-900">{document.title}</h2>
      {document.description ? (
        <p className="mb-5 mt-3 text-sm leading-7 text-slate-600">{document.description}</p>
      ) : null}
      {fileUrl ? (
        <>
          {isPdf ? (
            <iframe
              title={document.title}
              src={fileUrl}
              className="h-[75vh] min-h-[480px] w-full rounded-xl border-0 bg-slate-100"
            />
          ) : isImage ? (
            <div className="flex max-h-[75dvh] justify-center overflow-auto overscroll-contain rounded-xl bg-slate-50 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={document.title} className="max-h-full max-w-full object-contain" />
            </div>
          ) : (
            <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
              Preview is not available for this file type. Use the download button to view it.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <a
              href={document.downloadUrl ?? fileUrl}
              download
              className="rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800"
            >
              Download
            </a>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-violet-200 bg-violet-50 px-5 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
            >
              Open in new tab
            </a>
          </div>
        </>
      ) : (
        <p className="text-sm text-slate-600">The policy file is temporarily unavailable.</p>
      )}
    </article>
  );
}

export default function HospitalPolicyPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPolicies() {
      try {
        const items = await getPublicDocuments("policy");
        if (!cancelled) setDocuments(items.filter((item) => item.status === "published"));
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadPolicies();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicShell
      title="Hospital Policy"
      subtitle="Official policies and guidance published by Casiguran District Hospital."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading Hospital Policies...
          </div>
        ) : hasError ? (
          <div role="alert" className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-red-800">
            Unable to load Hospital Policies. Please try again later.
          </div>
        ) : documents.length ? (
          <div className="space-y-6">
            {documents.map((document) => <PolicyDocument key={document.id} document={document} />)}
          </div>
        ) : (
          <div className="rounded-[28px] border border-dashed border-violet-200 bg-white p-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">Hospital Policies are not published yet</p>
            <p className="mt-2 text-sm">Published policies will appear here once uploaded by the hospital.</p>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
