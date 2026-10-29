"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import { getAdminContactMessages, getContactMessageAssignees, updateContactMessage, type ContactMessageItem } from "@/lib/api/contact-messages";

type Filter = "all" | "new" | "flagged" | "archived";
const actionOptions = ["Called", "FB Messaged", "Forwarded to GC", "Done"] as const;

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-PH", { timeZone: "Asia/Manila" });
}

function maskContact(value: string) {
  if (value.includes("@")) {
    const [name, domain] = value.split("@");
    return `${name.slice(0, 1)}••••@${domain}`;
  }
  const digits = value.replace(/\D/g, "");
  return `${digits.slice(0, 4)}${"x".repeat(Math.max(0, digits.length - 6))}${digits.slice(-2)}`;
}

function senderName(item: ContactMessageItem) {
  return [item.firstName, item.middleName, item.lastName, item.nameExtension].filter(Boolean).join(" ") || item.name;
}

export default function AdminContactMessagesPage() {
  const [items, setItems] = useState<ContactMessageItem[]>([]);
  const [assignees, setAssignees] = useState<{ id: string; name: string }[]>([]);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  const loadMessages = useCallback(async () => {
    try {
      const [messages, staff] = await Promise.all([getAdminContactMessages(), getContactMessageAssignees()]);
      setItems(messages);
      setAssignees(staff);
      setRemarks(Object.fromEntries(messages.map((item) => [item.id, item.remarks])));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contact messages.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.departmentTag))].sort(), [items]);
  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (filter === "new" && item.status !== "new") return false;
      if (filter === "flagged" && !item.isFlagged) return false;
      if (filter === "archived" && !item.isArchived) return false;
      if (filter !== "archived" && item.isArchived) return false;
      if (category !== "all" && item.departmentTag !== category) return false;
      return !normalized || [senderName(item), item.contactInfo, item.subject, item.message, item.assignedTo ?? ""].some((value) => value.toLocaleLowerCase().includes(normalized));
    });
  }, [category, filter, items, search]);

  async function saveUpdate(item: ContactMessageItem, updates: Parameters<typeof updateContactMessage>[1], success: string) {
    try {
      const updated = await updateContactMessage(item.id, updates);
      setItems((current) => current.map((message) => message.id === updated.id ? updated : message));
      window.dispatchEvent(new Event("contact-messages-updated"));
      showSuccess(success, "Updated");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to update message.", "Update failed");
    }
  }

  async function copyContact(item: ContactMessageItem) {
    try {
      await navigator.clipboard.writeText(item.contactInfo);
      showSuccess("Email or number copied.", "Copied");
    } catch {
      showError("Could not copy contact information. Check browser clipboard permissions.", "Copy failed");
    }
  }

  return (
    <AdminShell title="Contact Messages">
      <p className="mb-2 text-slate-600">Triage and log public inquiries. Do not provide medical advice in this console; forward inquiries to the appropriate staff.</p>
      <p className="mb-6 text-xs text-slate-500">Contact details are hidden until revealed. Messages and contact details are confidential.</p>
      {error ? <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div> : null}
      <section className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <label className="relative flex-1 text-sm font-medium text-slate-700">Search
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, contact, subject or message" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
          </label>
          <label className="text-sm font-medium text-slate-700">Category
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal">
              <option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter contact messages">
          {(["all", "new", "flagged", "archived"] as const).map((value) => (
            <button type="button" role="tab" aria-selected={filter === value} key={value} onClick={() => setFilter(value)} className={`rounded-full border px-4 py-2 text-sm font-semibold capitalize ${filter === value ? "border-violet-700 bg-violet-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-violet-50"}`}>{value}</button>
          ))}
        </div>
        {isLoading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading messages...</div>
          : filteredItems.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No matching contact messages.</div>
            : filteredItems.map((item) => {
              const isRevealed = revealed.includes(item.id);
              const contact = item.contactInfo;
              return (
                <article key={item.id} className={`space-y-4 rounded-2xl border bg-white p-5 shadow-sm ${item.isFlagged ? "border-amber-300" : item.status === "new" ? "border-violet-300" : "border-slate-200"}`}>
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">{item.subject}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{item.status}</span>
                        {item.isFlagged ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">Flagged</span> : null}
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-800">{item.departmentTag}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">From <strong>{senderName(item)}</strong> · {formatDate(item.createdAt)}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Contact: <span className="font-mono">{isRevealed ? contact : maskContact(contact)}</span>{" "}
                        <button type="button" onClick={() => setRevealed((current) => isRevealed ? current.filter((id) => id !== item.id) : [...current, item.id])} className="font-semibold text-violet-800 underline">{isRevealed ? "Hide" : "Show"}</button>
                      </p>
                    </div>
                    <div className="flex h-fit flex-wrap gap-2">
                      <button type="button" onClick={() => void copyContact(item)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Copy Email/Number</button>
                      {!item.isArchived ? <button type="button" onClick={() => void saveUpdate(item, { status: "replied" }, "Marked as replied; add action details below.")} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">Mark as Replied</button>
                        : <button type="button" onClick={() => void saveUpdate(item, { isArchived: false }, "Message restored.")} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">Restore</button>}
                      {!item.isArchived ? <button type="button" onClick={() => void saveUpdate(item, { isArchived: true }, "Message archived.")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Archive</button> : null}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{item.message}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm font-medium text-slate-700">Assign to
                      <select value={item.assignedTo ?? ""} onChange={(event) => void saveUpdate(item, { assignedTo: event.target.value || null }, "Assignment updated.")} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2">
                        <option value="">Unassigned</option>{assignees.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700">Action taken
                      <select value={item.actionTaken ?? ""} onChange={(event) => void saveUpdate(item, { actionTaken: event.target.value ? event.target.value as ContactMessageItem["actionTaken"] : null }, "Action log updated.")} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2">
                        <option value="">Select action</option>{actionOptions.map((action) => <option key={action}>{action}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-slate-700 md:col-span-2">Internal remarks — do not enter medical advice
                      <textarea value={remarks[item.id] ?? ""} onChange={(event) => setRemarks((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={2000} rows={2} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 font-normal" />
                      <button type="button" onClick={() => void saveUpdate(item, { remarks: remarks[item.id] ?? "" }, "Internal remarks saved.")} className="mt-2 rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-50">Save remarks</button>
                    </label>
                  </div>
                </article>
              );
            })}
      </section>
    </AdminShell>
  );
}
