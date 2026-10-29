"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import { createTraining, deleteTraining, getAdminTrainings, updateTraining, type TrainingItem } from "@/lib/api/trainings";
import { CmsBulkDeleteButton, CmsSpreadsheetImport } from "@/components/admin/cms-bulk-tools";

const emptyForm = {
  title: "",
  description: "",
  externalUrl: "",
  status: "draft" as "draft" | "published",
};

export default function AdminTrainingsPage() {
  const [items, setItems] = useState<TrainingItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  const loadItems = useCallback(async () => {
    try {
      setItems(await getAdminTrainings());
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load trainings.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function resetForm() {
    setForm(emptyForm);
    setImage(null);
    setRemoveImage(false);
    setEditingId(null);
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("description", form.description);
    payload.append("externalUrl", form.externalUrl);
    payload.append("status", form.status);
    payload.append("removeImage", String(removeImage));
    if (image) payload.append("image", image);

    try {
      if (editingId) {
        await updateTraining(editingId, payload);
        showSuccess("Training updated.", "Saved");
      } else {
        await createTraining(payload);
        showSuccess("Training created.", "Saved");
      }
      resetForm();
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save training.";
      setError(message);
      showError(message, "Unable to save training");
    } finally {
      setIsSaving(false);
    }
  }

  function beginEdit(item: TrainingItem) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      externalUrl: item.externalUrl ?? "",
      status: item.status,
    });
    setImage(null);
    setRemoveImage(false);
    setError("");
  }

  async function handleDelete(item: TrainingItem) {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await deleteTraining(item.id);
      if (editingId === item.id) resetForm();
      showSuccess("Training deleted.", "Deleted");
      await loadItems();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to delete training.", "Delete failed");
    }
  }

  return (
    <AdminShell title="Trainings">
      <p className="mb-6 text-slate-600">Publish training information with a description, optional image, and optional external link.</p>

      <form onSubmit={handleSubmit} className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Title
            <input required maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
          </label>
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Description
            <textarea required maxLength={5000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            External link <span className="font-normal text-slate-500">(optional)</span>
            <input type="url" maxLength={2048} value={form.externalUrl} onChange={(event) => setForm((current) => ({ ...current, externalUrl: event.target.value }))} placeholder="https://example.com/training" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Status
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as "draft" | "published" }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700">
              Image <span className="font-normal text-slate-500">(optional; JPG, PNG, or WebP, max 5MB)</span>
              <input type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp" onChange={(event) => { setImage(event.target.files?.[0] ?? null); setRemoveImage(false); }} className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-800" />
            </label>
            {editingId && items.find((item) => item.id === editingId)?.imageUrl && !removeImage ? (
              <div className="mt-3 flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={items.find((item) => item.id === editingId)?.imageUrl ?? ""} alt="Current training" className="h-20 w-32 rounded-lg border border-slate-200 object-cover" />
                <button type="button" onClick={() => { setRemoveImage(true); setImage(null); }} className="text-sm font-semibold text-red-700 hover:text-red-800">Remove current image</button>
              </div>
            ) : null}
            {image ? <p className="mt-2 text-xs text-slate-500">Selected: {image.name}</p> : null}
            {removeImage ? <p className="mt-2 text-xs text-slate-500">Current image will be removed.</p> : null}
          </div>
        </div>

        {error ? <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
        <div className="mt-6 flex justify-end gap-3">
          {editingId ? <button type="button" onClick={resetForm} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button> : null}
          <button type="submit" disabled={isSaving} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isSaving ? "Saving..." : editingId ? "Update training" : "Save training"}</button>
        </div>
      </form>

      <CmsSpreadsheetImport resource="trainings" onImported={loadItems} />
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={items.length > 0 && selectedIds.length === items.length} onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])} />
          Select all trainings
        </label>
        <CmsBulkDeleteButton resource="trainings" ids={selectedIds} itemLabel="training" onDeleted={async () => {
          if (editingId && selectedIds.includes(editingId)) resetForm();
          await loadItems();
        }} />
      </div>
      <div className="space-y-3">
        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading trainings...</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No training entries yet.</div>
        ) : items.map((item) => (
          <article key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
            <input type="checkbox" aria-label={`Select training ${item.title}`} checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt="" className="h-24 w-full rounded-xl object-cover sm:w-36" />
            ) : null}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-semibold text-slate-900">{item.title}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{item.status}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.description}</p>
              {item.externalUrl ? <p className="mt-1 truncate text-xs text-violet-700">{item.externalUrl}</p> : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => beginEdit(item)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
              <button type="button" onClick={() => void handleDelete(item)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}
