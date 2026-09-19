"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminPages, updatePage, type PageItem } from "@/lib/api/pages";

const pageConfig = [
  { slug: "about", label: "About the Hospital" },
  { slug: "hospital-history", label: "Hospital History" },
  { slug: "vision-mission", label: "Vision, Mission & Core Values" },
];

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState(pageConfig[0].slug);
  const [form, setForm] = useState({ title: "", body: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPages() {
      try {
        const data = await getAdminPages();
        setPages(data);

        const firstPage = data.find((page) => page.slug === selectedSlug) ?? data[0];
        if (firstPage) {
          setSelectedSlug(firstPage.slug);
          setForm({ title: firstPage.title, body: firstPage.body });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load pages.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPages();
  }, []);

  useEffect(() => {
    const selectedPage = pages.find((page) => page.slug === selectedSlug);
    if (selectedPage) {
      setForm({ title: selectedPage.title, body: selectedPage.body });
    }
  }, [selectedSlug, pages]);

  async function handleSave() {
    setError("");
    setIsSaving(true);

    try {
      const saved = await updatePage(selectedSlug, form);
      setPages((current) =>
        current.map((page) => (page.slug === saved.slug ? saved : page))
      );
      setForm({ title: saved.title, body: saved.body });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save page.");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedPage = pages.find((page) => page.slug === selectedSlug);

  return (
    <AdminShell title="Pages">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(91,33,182,0.05)]">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">Institutional pages</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Seeded public pages</h2>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_1fr]">
          <aside className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Pages</p>
            <div className="space-y-2">
              {pageConfig.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setSelectedSlug(item.slug)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    selectedSlug === item.slug
                      ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                      : "text-slate-700 hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </aside>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 md:p-6">
            {isLoading ? (
              <p className="text-slate-500">Loading page content...</p>
            ) : selectedPage ? (
              <>
                <div className="mb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-700">{selectedPage.slug}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">{selectedPage.title}</h3>
                </div>

                <div className="space-y-5">
                  <label className="block text-sm font-medium text-slate-700">
                    Page title
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Page content
                    <textarea
                      value={form.body}
                      onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
                      className="mt-2 min-h-[220px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
                    />
                  </label>
                </div>

                {error ? (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
                  >
                    {isSaving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </>
            ) : (
              <p className="text-slate-500">No page content available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Link href="/admin/content" className="text-sm font-medium text-violet-700 hover:text-violet-800">
          ← Back to content overview
        </Link>
      </div>
    </AdminShell>
  );
}
