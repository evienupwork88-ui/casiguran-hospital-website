"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import { getMe } from "@/lib/api/auth";
import {
  createRateFee,
  deleteRateFee,
  getAdminRateFees,
  RATE_FEE_CATEGORIES,
  updateRateFee,
  type RateFeeCategory,
  type RateFeeInput,
  type RateFeeItem,
} from "@/lib/api/rate-fees";
import { CmsBulkDeleteButton, CmsSpreadsheetImport } from "@/components/admin/cms-bulk-tools";

const categories = Object.keys(RATE_FEE_CATEGORIES) as RateFeeCategory[];
const emptyForm: Omit<RateFeeInput, "category"> = {
  section: "",
  itemName: "",
  price1: "",
  price2: "",
  price3: "",
  displayOrder: 0,
  isActive: true,
};

function RateFeeForm({
  form,
  setForm,
  columns,
  isEditing,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
}: {
  form: Omit<RateFeeInput, "category">;
  setForm: React.Dispatch<React.SetStateAction<Omit<RateFeeInput, "category">>>;
  columns: readonly string[];
  isEditing: boolean;
  isSubmitting: boolean;
  error: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {isEditing ? null : <h2 className="mb-4 text-lg font-semibold text-slate-900">Add rate or fee</h2>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Item or service
          <input required maxLength={200} value={form.itemName} onChange={(event) => setForm((current) => ({ ...current, itemName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
        </label>
        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Section <span className="font-normal text-slate-500">(optional, e.g. Oral Medication)</span>
          <input maxLength={100} value={form.section ?? ""} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
        </label>
        {columns.map((column, index) => {
          const key = (`price${index + 1}`) as "price1" | "price2" | "price3";
          return (
            <label key={key} className="block text-sm font-medium text-slate-700">
              {column}
              <input maxLength={50} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} placeholder="e.g. 150.00 or FREE" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
            </label>
          );
        })}
        <label className="block text-sm font-medium text-slate-700">
          Display order
          <input type="number" min={0} value={form.displayOrder} onChange={(event) => setForm((current) => ({ ...current, displayOrder: Number(event.target.value) || 0 }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
        </label>
        {isEditing ? (
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
            Published on public page
          </label>
        ) : null}
      </div>
      {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <div className="mt-5 flex justify-end gap-2">
        {isEditing && onCancel ? <button type="button" onClick={onCancel} disabled={isSubmitting} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60">Cancel</button> : null}
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{isSubmitting ? "Saving..." : isEditing ? "Update item" : "Add item"}</button>
      </div>
    </form>
  );
}

export default function AdminRateFeesPage() {
  const [items, setItems] = useState<RateFeeItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<RateFeeCategory>("pharmacy");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  async function loadItems() {
    try {
      setItems(await getAdminRateFees());
      setSelectedIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load rate and fee items.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
    void getMe().then((user) => setIsAdmin(user.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  const categoryItems = items.filter((item) => item.category === activeCategory);
  const columns = RATE_FEE_CATEGORIES[activeCategory].columns;

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  }

  function beginEdit(item: RateFeeItem) {
    setEditingId(item.id);
    setForm({
      section: item.section ?? "",
      itemName: item.itemName,
      price1: item.price1,
      price2: item.price2,
      price3: item.price3,
      displayOrder: item.displayOrder,
      isActive: item.isActive,
    });
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await updateRateFee(editingId, { ...form, category: activeCategory });
        showSuccess("Rate or fee updated.", "Saved");
      } else {
        await createRateFee({ ...form, category: activeCategory });
        showSuccess("Rate or fee added.", "Saved");
      }
      resetForm();
      await loadItems();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save rate or fee.";
      setError(message);
      showError(message, "Unable to save rate or fee");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: RateFeeItem) {
    if (!window.confirm(`Delete "${item.itemName}"?`)) return;
    try {
      await deleteRateFee(item.id);
      if (editingId === item.id) resetForm();
      showSuccess("Rate or fee deleted.", "Deleted");
      await loadItems();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to delete rate or fee.", "Delete failed");
    }
  }

  return (
    <AdminShell title="Rate & Fees">
      <p className="mb-6 text-slate-600">Manage the prices shown on the public Rate and Fees page. Changes are recorded in Audit History.</p>

      <div role="tablist" aria-label="Rate and fee categories" className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            role="tab"
            aria-selected={activeCategory === category}
            onClick={() => { setActiveCategory(category); setSelectedIds([]); resetForm(); }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${activeCategory === category ? "bg-violet-700 text-white" : "bg-white text-violet-800 ring-1 ring-violet-200 hover:bg-violet-50"}`}
          >
            {RATE_FEE_CATEGORIES[category].label}
          </button>
        ))}
      </div>

      <CmsSpreadsheetImport
        key={activeCategory}
        resource="rate-fees"
        rateFeeCategory={activeCategory}
        onImported={loadItems}
      />

      {!editingId ? (
        <div className="mb-8">
          <RateFeeForm form={form} setForm={setForm} columns={columns} isEditing={false} isSubmitting={isSubmitting} error={error} onSubmit={handleSubmit} />
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={categoryItems.length > 0 && selectedIds.length === categoryItems.length} onChange={(event) => setSelectedIds(event.target.checked ? categoryItems.map((item) => item.id) : [])} />
          Select all in {RATE_FEE_CATEGORIES[activeCategory].label}
        </label>
        <CmsBulkDeleteButton resource="rate-fees" ids={selectedIds} itemLabel="rate or fee item" onDeleted={async () => {
          if (editingId && selectedIds.includes(editingId)) resetForm();
          await loadItems();
        }} />
      </div>
      <div className="max-h-[65dvh] overflow-auto overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] divide-y divide-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all rate and fee items in this category" checked={categoryItems.length > 0 && selectedIds.length === categoryItems.length} onChange={(event) => setSelectedIds(event.target.checked ? categoryItems.map((item) => item.id) : [])} /></th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Section / Item</th>
              {columns.map((column) => <th key={column} className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">{column}</th>)}
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={columns.length + 4} className="px-4 py-8 text-center text-sm text-slate-500">Loading rate and fee items...</td></tr>
            ) : categoryItems.length === 0 ? (
              <tr><td colSpan={columns.length + 4} className="px-4 py-8 text-center text-sm text-slate-500">No items in this category yet.</td></tr>
            ) : categoryItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-4 py-3"><input type="checkbox" aria-label={`Select rate or fee ${item.itemName}`} checked={selectedIds.includes(item.id)} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /></td>
                <td className="px-4 py-3 text-sm text-slate-800">
                  {item.section ? <span className="mr-2 text-xs font-semibold uppercase text-violet-700">{item.section} /</span> : null}
                  <span className="font-medium">{item.itemName}</span>
                  <span className="ml-2 text-xs text-slate-400">Order {item.displayOrder}</span>
                </td>
                {[item.price1, item.price2, item.price3].slice(0, columns.length).map((price, index) => <td key={index} className="px-4 py-3 text-right text-sm tabular-nums text-slate-700">{price || "—"}</td>)}
                <td className="px-4 py-3 text-sm">{item.isActive ? "Published" : "Hidden"}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <button type="button" onClick={() => beginEdit(item)} className="font-semibold text-violet-700 hover:text-violet-900">Edit</button>
                  {isAdmin ? <button type="button" onClick={() => void handleDelete(item)} className="ml-3 font-semibold text-red-700 hover:text-red-900">Delete</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editingId ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) resetForm();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="edit-rate-fee-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="edit-rate-fee-title" className="text-xl font-semibold text-slate-900">Edit rate or fee</h2>
              <button type="button" onClick={resetForm} disabled={isSubmitting} aria-label="Close edit rate or fee modal" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60">Close</button>
            </div>
            <RateFeeForm form={form} setForm={setForm} columns={columns} isEditing isSubmitting={isSubmitting} error={error} onSubmit={handleSubmit} onCancel={resetForm} />
          </section>
        </div>
      ) : null}
      <p className="mt-4 text-sm text-slate-500">Editors can add, update, and hide items. Only Admin can permanently delete them.</p>
    </AdminShell>
  );
}
