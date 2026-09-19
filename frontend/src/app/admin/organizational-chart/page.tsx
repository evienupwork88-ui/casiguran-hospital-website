"use client";

import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminDocuments, type DocumentItem, uploadDocument } from "@/lib/api/documents";

const ALLOWED = ["PDF", "PNG", "JPG", "JPEG", "WEBP"];

export default function AdminOrganizationalChartPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [chart, setChart] = useState<DocumentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function loadChart() {
    try {
      const docs = await getAdminDocuments();
      const current = docs.find((doc) => doc.category === "org_chart") ?? null;
      setChart(current);
    } catch {
      setChart(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadChart();
  }, []);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!selectedFile) {
      setError("Please choose an official chart file.");
      return;
    }

    const name = selectedFile.name.toLowerCase();
    const allowed = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
    const isAllowed = allowed.some((ext) => name.endsWith(ext));

    if (!isAllowed) {
      setError("Unsupported file type. Allowed formats: PDF, PNG, JPG, JPEG, WEBP.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError("File too large. Maximum size is 15MB.");
      return;
    }

    setIsUploading(true);

    try {
      const form = new FormData();
      form.append("title", "Official Organizational Chart");
      form.append("description", "Current official organizational chart for the public website.");
      form.append("category", "org_chart");
      form.append("status", "published");
      form.append("file", selectedFile);

      const uploaded = await uploadDocument(form);
      setChart(uploaded);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload the organizational chart.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AdminShell title="Organizational Chart">
      <div className="space-y-6">
        <div className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Official hospital document</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Current organizational chart</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-800">
              {ALLOWED.join(" • ")}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-violet-300 bg-violet-50/50 p-5 text-sm text-slate-700">
            Supported formats: PDF, PNG, JPG, JPEG, WEBP. Maximum size: 15MB.
          </div>
        </div>

        <form onSubmit={handleUpload} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <label className="block text-sm font-medium text-slate-700">
              Upload official chart
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp,application/pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-violet-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </label>

            <button
              type="submit"
              disabled={isUploading || !selectedFile}
              className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isUploading ? "Uploading..." : "Upload chart"}
            </button>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
        </form>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
          {isLoading ? (
            <div className="text-sm text-slate-600">Loading chart...</div>
          ) : chart ? (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-violet-700">Uploaded</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">{chart.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={chart.viewUrl ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-violet-700 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-800"
                  >
                    View
                  </a>
                  <a
                    href={chart.downloadUrl ?? chart.viewUrl ?? "#"}
                    download
                    className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    Download
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                {chart.description || "Current official chart for the public website."}
              </div>

              <div className="overflow-hidden rounded-[22px] border border-violet-200 bg-white p-3">
                {chart.mimeType?.startsWith("image/") ? (
                  <img src={chart.viewUrl ?? chart.downloadUrl ?? ""} alt="Official organizational chart" className="max-h-[80vh] w-full rounded-xl object-contain shadow-sm" />
                ) : (
                  <iframe src={chart.viewUrl ?? chart.downloadUrl ?? ""} title="Official organizational chart" className="h-[75vh] w-full rounded-xl border-0 bg-slate-100" />
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-600">
              <p className="text-lg font-semibold text-slate-900">Organizational chart will be available once the official document is provided.</p>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
