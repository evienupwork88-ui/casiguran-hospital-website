"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import { archiveFaq, FAQ_CATEGORIES, getAdminFaqs, saveFaq, type FaqCategory, type FaqItem } from "@/lib/api/faqs";
import { containsProfanity } from "@/lib/profanity-filter";
import { CmsBulkDeleteButton, CmsSpreadsheetImport } from "@/components/admin/cms-bulk-tools";

type FaqForm = { question: string; answer: string; category: FaqCategory; displayOrder: number; isActive: boolean };
const emptyForm: FaqForm = { question: "", answer: "", category: "General", displayOrder: 0, isActive: true };

export default function AdminFaqsPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [form, setForm] = useState<FaqForm>(emptyForm);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  const loadFaqs = useCallback(async () => {
    try {
      setItems(await getAdminFaqs());
      setSelectedIds([]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load FAQs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadFaqs(); }, [loadFaqs]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm, displayOrder: items.length });
    setIsModalOpen(true);
  }

  function openEdit(item: FaqItem) {
    setEditing(item);
    setForm({ question: item.question, answer: item.answer, category: item.category, displayOrder: item.displayOrder, isActive: item.isActive });
    setIsModalOpen(true);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (containsProfanity(form.question) || containsProfanity(form.answer)) {
      setError("Please use respectful language.");
      return;
    }
    setIsSaving(true);
    try {
      await saveFaq(form, editing?.id);
      setIsModalOpen(false);
      showSuccess(editing ? "FAQ updated." : "FAQ created.", "Saved");
      await loadFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save FAQ.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleArchive(item: FaqItem) {
    try {
      await archiveFaq(item.id);
      showSuccess("FAQ archived from the public website.", "Archived");
      await loadFaqs();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to archive FAQ.", "Archive failed");
    }
  }

  async function toggleActive(item: FaqItem) {
    try {
      await saveFaq({ isActive: !item.isActive }, item.id);
      await loadFaqs();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to update FAQ status.", "Update failed");
    }
  }

  async function moveItem(item: FaqItem, direction: -1 | 1) {
    const ordered = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
    const index = ordered.findIndex((faq) => faq.id === item.id);
    const neighborIndex = index + direction;
    if (neighborIndex < 0 || neighborIndex >= ordered.length) return;
    [ordered[index], ordered[neighborIndex]] = [ordered[neighborIndex], ordered[index]];
    try {
      await Promise.all(ordered.map((faq, displayOrder) => saveFaq({ displayOrder }, faq.id)));
      await loadFaqs();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to reorder FAQs.", "Reorder failed");
      await loadFaqs();
    }
  }

  return (
    <AdminShell title="FAQs">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div><p className="text-slate-600">Manage the published answers shown below the public contact form.</p><p className="mt-1 text-xs text-slate-500">Answers are informational. Do not publish personal medical advice.</p></div>
        <button type="button" onClick={openCreate} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">Add FAQ</button>
      </div>
      <CmsSpreadsheetImport resource="faqs" onImported={loadFaqs} />
      {error ? <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={items.length > 0 && selectedIds.length === items.length} onChange={(event) => setSelectedIds(event.target.checked ? items.map((item) => item.id) : [])} />
          Select all FAQs
        </label>
        <CmsBulkDeleteButton resource="faqs" ids={selectedIds} itemLabel="FAQ" onDeleted={async () => {
          if (editing && selectedIds.includes(editing.id)) {
            setIsModalOpen(false);
            setEditing(null);
          }
          await loadFaqs();
        }} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-violet-50 text-xs uppercase tracking-wide text-violet-900"><tr><th className="px-4 py-3">Select</th><th className="px-4 py-3">Order</th><th className="px-4 py-3">Question</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Last updated</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading FAQs...</td></tr>
              : items.length === 0 ? <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No FAQs yet. Add one to publish the first answer.</td></tr>
                : items.map((item, index) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4"><input type="checkbox" aria-label={`Select FAQ ${item.question}`} checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></td>
                    <td className="px-4 py-4 font-medium text-slate-700">{item.displayOrder}</td>
                    <td className="max-w-sm px-4 py-4"><p className="font-semibold text-slate-900">{item.question}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.answer}</p></td>
                    <td className="px-4 py-4 text-slate-700">{item.category}</td>
                    <td className="px-4 py-4"><button type="button" onClick={() => void toggleActive(item)} aria-pressed={item.isActive} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{item.isActive ? "Active" : "Inactive"}</button></td>
                    <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">{new Date(item.updatedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => void moveItem(item, -1)} disabled={index === 0} aria-label="Move up" className="rounded-md border px-2 py-1 disabled:opacity-40">↑</button>
                        <button type="button" onClick={() => void moveItem(item, 1)} disabled={index === items.length - 1} aria-label="Move down" className="rounded-md border px-2 py-1 disabled:opacity-40">↓</button>
                        <button type="button" onClick={() => openEdit(item)} className="rounded-md border border-violet-200 px-2.5 py-1 font-semibold text-violet-800">Edit</button>
                        {item.isActive ? <button type="button" onClick={() => void handleArchive(item)} className="rounded-md border border-slate-300 px-2.5 py-1 font-semibold text-slate-700">Archive</button> : null}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {isModalOpen ? (
        <div role="presentation" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsModalOpen(false); }}>
          <form role="dialog" aria-modal="true" aria-labelledby="faq-form-title" onSubmit={(event) => void handleSave(event)} className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4"><div><h2 id="faq-form-title" className="text-xl font-bold text-slate-900">{editing ? "Edit FAQ" : "Add FAQ"}</h2><p className="mt-1 text-sm text-slate-500">Changes publish without a website redeploy.</p></div><button type="button" aria-label="Close dialog" onClick={() => setIsModalOpen(false)} className="rounded-lg border px-3 py-1.5">Close</button></div>
            <label className="block text-sm font-semibold text-slate-700">Question<input required maxLength={200} value={form.question} onChange={(event) => setForm((current) => ({ ...current, question: event.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /><span className="text-xs font-normal text-slate-500">{form.question.length}/200</span></label>
            <label className="block text-sm font-semibold text-slate-700">Answer<textarea required maxLength={1000} rows={6} value={form.answer} onChange={(event) => setForm((current) => ({ ...current, answer: event.target.value }))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /><span className="text-xs font-normal text-slate-500">{form.answer.length}/1000</span></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">Category<select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as FaqCategory }))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal">{FAQ_CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label className="block text-sm font-semibold text-slate-700">Display order<input type="number" min={0} max={10000} required value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) }))} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-violet-700" />Publish this FAQ</label>
            <div className="flex justify-end gap-3 border-t pt-4"><button type="button" onClick={() => setIsModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold">Cancel</button><button type="submit" disabled={isSaving} className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving..." : "Save FAQ"}</button></div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
