"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { createAnnouncement, deleteAnnouncement, getAdminAnnouncements, updateAnnouncement, type AnnouncementItem } from "@/lib/api/announcements";
import { useNotifications } from "@/components/providers/notification-provider";
import { toDateTimeLocalValue, toIsoDateTime } from "@/lib/date-time";

const emptyForm = {
  title: "",
  body: "",
  priority: "normal" as "normal" | "urgent",
  status: "draft" as "draft" | "published",
  publishAt: "",
  expiresAt: "",
};

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  async function loadItems() {
    try {
      const data = await getAdminAnnouncements();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load announcements.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadItems();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        publishAt: form.publishAt ? toIsoDateTime(form.publishAt) : "",
        expiresAt: form.expiresAt ? toIsoDateTime(form.expiresAt) : "",
      };

      if (editingId) {
        await updateAnnouncement(editingId, payload);
        showSuccess("Announcement updated.", "Saved");
      } else {
        await createAnnouncement(form);
        showSuccess("Announcement created.", "Saved");
      }
      setForm(emptyForm);
      setEditingId(null);
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save announcement.";
      setError(message);
      showError(message, "Unable to save announcement");
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(item: AnnouncementItem) {
    setEditingId(item.id);
    setForm({ title: item.title, body: item.body, priority: item.priority, status: item.status, publishAt: toDateTimeLocalValue(item.publishAt), expiresAt: toDateTimeLocalValue(item.expiresAt) });
    setError("");
  }

  async function handleDelete(item: AnnouncementItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteAnnouncement(item.id);
      if (editingId === item.id) { setEditingId(null); setForm(emptyForm); }
      showSuccess("Announcement deleted.", "Deleted");
      await loadItems();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to delete announcement.", "Delete failed");
    }
  }

  return (
    <AdminShell title="Announcements">
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
            Priority
            <select
              value={form.priority}
              onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as "normal" | "urgent" }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
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

          <label className="block text-sm font-medium text-slate-700">
            Publish date
            <input
              type="datetime-local"
              value={form.publishAt}
              onChange={(event) => setForm((current) => ({ ...current, publishAt: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Expiration date
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={(event) => setForm((current) => ({ ...current, expiresAt: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Content
            <textarea
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required
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
            {isSubmitting ? "Saving..." : editingId ? "Update announcement" : "Save announcement"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Priority</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">Loading announcements...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No announcements yet.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-700">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {item.status}
                    </span>
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
