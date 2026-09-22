"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { deleteDocument, getAdminDocuments, type DocumentItem, updateDocument, uploadDocument } from "@/lib/api/documents";
import { useNotifications } from "@/components/providers/notification-provider";

const emptyForm = {
  title: "",
  description: "",
  category: "other" as DocumentItem["category"],
  status: "draft" as "draft" | "published",
};

export default function AdminDocumentsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<DocumentItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showSuccess, showError } = useNotifications();

  async function loadItems() {
    try {
      const data = await getAdminDocuments();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load documents.");
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

    if (!editingId && !selectedFile) {
      setError("Please choose a document file.");
      return;
    }

    if (!editingId && selectedFile) {
      const extension = selectedFile.name.toLowerCase().split(".").pop();
      const limit = ["jpg", "jpeg", "png", "webp"].includes(extension ?? "") ? 5 : 15;
      if (selectedFile.size > limit * 1024 * 1024) {
        setError(`File exceeds the ${limit}MB limit for this file type.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await updateDocument(editingId, form);
        showSuccess("Document metadata updated.", "Saved");
      } else {
        const formData = new FormData();
        formData.append("title", form.title);
        formData.append("description", form.description);
        formData.append("category", form.category);
        formData.append("status", form.status);
        formData.append("file", selectedFile as File);
        await uploadDocument(formData);
        showSuccess("Document uploaded.", "Saved");
      }
      setForm(emptyForm);
      setEditingId(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save document.";
      setError(message);
      showError(message, "Unable to save document");
    } finally {
      setIsSubmitting(false);
    }
  }

  function beginEdit(item: DocumentItem) {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description ?? "", category: item.category, status: item.status });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setError("");
  }

  async function handleDelete(item: DocumentItem) {
    if (!window.confirm(`Delete "${item.title}" and its stored file?`)) return;
    try {
      await deleteDocument(item.id);
      if (editingId === item.id) { setEditingId(null); setForm(emptyForm); }
      showSuccess("Document deleted.", "Deleted");
      await loadItems();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to delete document.", "Delete failed");
    }
  }

  return (
    <AdminShell title="Documents">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-slate-600">Manage public documents, reports, policies, and the org chart.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Title
            <input
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
              required={!editingId}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Category
            <select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as DocumentItem["category"] }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="report">Report</option>
              <option value="org_chart">Org chart</option>
              <option value="policy">Policy</option>
              <option value="other">Other</option>
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

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            File
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-violet-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              required={!editingId}
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Description
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
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
            {isSubmitting ? "Saving..." : editingId ? "Update document" : "Save document"}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[720px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Category</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">Loading documents...</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No documents yet.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.title}</td>
                  <td className="px-5 py-4 text-sm text-slate-700">{item.category}</td>
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
