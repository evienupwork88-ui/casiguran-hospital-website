"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { createNews, deleteNews, getAdminNews, updateNews, type NewsItem } from "@/lib/api/news";
import { useNotifications } from "@/components/providers/notification-provider";

const emptyForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  status: "draft" as "draft" | "published",
};

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  async function loadArticles() {
    try {
      const data = await getAdminNews();
      setArticles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load news.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateNews(editingId, form);
        showSuccess("News article updated.", "Saved");
      } else {
        await createNews(form);
        showSuccess("News article created.", "Saved");
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadArticles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save article.";
      setError(message);
      showError(message, "Unable to save article");
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(item: NewsItem) {
    setEditingId(item.id);
    setForm({ title: item.title, slug: item.slug, excerpt: item.excerpt ?? "", body: item.body, coverImageUrl: item.coverImageUrl ?? "", status: item.status });
    setError("");
  }

  async function handleDelete(item: NewsItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteNews(item.id);
      if (editingId === item.id) { setEditingId(null); setForm(emptyForm); }
      showSuccess("News article deleted.", "Deleted");
      await loadArticles();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to delete article.", "Delete failed");
    }
  }

  return (
    <AdminShell title="News">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-slate-600">Create and manage hospital news articles.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Title
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Slug
            <input
              value={form.slug}
              onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              placeholder="health-update"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Status
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Excerpt
            <textarea
              value={form.excerpt}
              onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Body
            <textarea
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              className="mt-2 min-h-36 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Cover image URL
            <input
              value={form.coverImageUrl}
              onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              placeholder="https://example.com/image.jpg"
            />
          </label>
        </div>

        {error ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
          >
            {isSubmitting ? "Saving..." : editingId ? "Update article" : "Save article"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Title
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Status
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                  Loading articles...
                </td>
              </tr>
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                  No news articles yet.
                </td>
              </tr>
            ) : (
              articles.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-5 py-4 text-right text-sm">
                    <button type="button" onClick={() => beginEdit(item)} className="font-semibold text-violet-700 hover:text-violet-900">Edit</button>
                    <button type="button" onClick={() => handleDelete(item)} className="ml-4 font-semibold text-red-700 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link href="/admin/content" className="text-sm font-medium text-violet-700 hover:text-violet-800">
          ← Back to content overview
        </Link>
      </div>
    </AdminShell>
  );
}
