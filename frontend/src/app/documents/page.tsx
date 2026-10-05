"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicDocuments, type DocumentItem } from "@/lib/api/documents";

const CATEGORY_LABELS: Record<string, string> = {
  report: "Report",
  policy: "Policy",
  org_chart: "Org Chart",
  citizens_charter: "Citizen's Charter",
  development_plan: "Hospital Development Plan",
};

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg"];

function getFileKind(doc: DocumentItem): "pdf" | "image" | "other" {
  const ext = (doc.fileExtension ?? "").toLowerCase().replace(".", "");
  const mime = (doc.mimeType ?? "").toLowerCase();

  if (ext === "pdf" || mime.includes("pdf")) return "pdf";
  if (IMAGE_EXTENSIONS.includes(ext) || mime.startsWith("image/")) return "image";
  return "other";
}

function Preview({ doc }: { doc: DocumentItem }) {
  const viewUrl = doc.viewUrl ?? doc.downloadUrl;
  const kind = getFileKind(doc);

  if (!viewUrl) {
    return (
      <div className="flex h-full items-center justify-center p-10 text-center text-slate-500">
        File unavailable.
      </div>
    );
  }

  if (kind === "pdf") {
    return <iframe key={doc.id} src={viewUrl} title={doc.title} className="h-full w-full border-0" />;
  }

  if (kind === "image") {
    return (
      <div className="flex h-full items-center justify-center overflow-auto p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={viewUrl} alt={doc.title} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-10 text-center">
      <p className="text-lg font-semibold text-slate-900">Preview not available</p>
      <p className="text-sm text-slate-500">I-download na lang ang file para mabuksan.</p>
    </div>
  );
}

function DocumentsContent() {
  const searchParams = useSearchParams();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedCategory = searchParams.get("category") ?? undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      setIsLoading(true);
      setHasError(false);

      try {
        const items = await getPublicDocuments(selectedCategory);
        if (cancelled) return;
        const published = items.filter((item) => item.status === "published" && item.category !== "org_chart" && item.category !== "development_plan");

        // Citizen's Charter: iisang file lang ang ipinapakita (yung pinakabago)
        if (selectedCategory === "citizens_charter") {
          const latest = [...published].sort(
            (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
          );
          setDocuments(latest.slice(0, 1));
        } else {
          setDocuments(published);
        }
        setSelectedId(null);
      } catch {
        if (cancelled) return;
        setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDocuments();

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const isCharter = selectedCategory === "citizens_charter";
  const pageTitle = isCharter ? "Citizen's Charter" : "Documents & Reports";
  const pageSubtitle = isCharter
    ? "Official Citizen's Charter document and public service standards published by Casiguran District Hospital."
    : "Official downloadable resources and institutional reports published by Casiguran District Hospital.";

  const selected = documents.find((d) => d.id === selectedId) ?? documents[0];
  const selectedViewUrl = selected ? (selected.viewUrl ?? selected.downloadUrl) : undefined;
  const selectedDownloadUrl = selected ? (selected.downloadUrl ?? selected.viewUrl) : undefined;

  return (
    <PublicShell title={pageTitle} subtitle={pageSubtitle}>
      <section className="mx-auto max-w-6xl px-6 pb-16 pt-8">
        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading documents...
          </div>
        ) : hasError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-800">
            <p className="text-lg font-semibold">Unable to load documents</p>
            <p className="mt-2 text-sm">Please try again later.</p>
          </div>
        ) : !selected ? (
          <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">No public documents yet</p>
            <p className="mt-2 text-sm">Official documents will appear here once they are uploaded to the CMS.</p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            {/* Preview */}
            <div className="order-2 h-[75vh] min-h-[480px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-[0_12px_26px_rgba(37,27,88,0.06)] lg:order-1">
              <Preview doc={selected} />
            </div>

            {/* Side panel */}
            <aside className="order-1 space-y-4 lg:order-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_26px_rgba(37,27,88,0.04)]">
                <div className="flex items-center justify-between gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-700">
                  <span>{CATEGORY_LABELS[selected.category] ?? "Document"}</span>
                  <span>{selected.publishedAt ? new Date(selected.publishedAt).getFullYear() : "Latest"}</span>
                </div>
                <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-slate-900">{selected.title}</h3>
                {selected.description ? (
                  <p className="mt-2 text-sm leading-6 text-slate-600">{selected.description}</p>
                ) : null}

                <div className="mt-5 flex flex-col gap-2">
                  {selectedDownloadUrl ? (
                    <a
                      href={selectedDownloadUrl}
                      download
                      className="rounded-full bg-violet-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-violet-800"
                    >
                      Download {(selected.fileExtension ?? "").replace(".", "").toUpperCase()}
                    </a>
                  ) : (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-center text-sm font-semibold text-slate-500">
                      File unavailable
                    </span>
                  )}
                  {selectedViewUrl ? (
                    <a
                      href={selectedViewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2.5 text-center text-sm font-semibold text-violet-700 hover:bg-violet-100"
                    >
                      Open in new tab
                    </a>
                  ) : null}
                </div>
              </div>

              {/* Other documents (lalabas lang kung higit sa isa) */}
              {documents.length > 1 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="px-2 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    All documents
                  </p>
                  <ul className="max-h-72 space-y-1 overflow-y-auto">
                    {documents.map((doc) => {
                      const active = doc.id === selected.id;
                      return (
                        <li key={doc.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(doc.id)}
                            aria-current={active ? "true" : undefined}
                            className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                              active
                                ? "bg-violet-100 font-semibold text-violet-800"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            {doc.title}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </aside>
          </div>
        )}
      </section>
    </PublicShell>
  );
}

export default function DocumentsPage() {
  return (
    <Suspense
      fallback={
        <div role="status" aria-busy="true" className="p-10 text-center text-slate-600">
          Loading documents...
        </div>
      }
    >
      <DocumentsContent />
    </Suspense>
  );
}