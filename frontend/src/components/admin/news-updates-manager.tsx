"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  updateAnnouncement,
  type AnnouncementItem,
} from "@/lib/api/announcements";
import {
  createNews,
  deleteNews,
  getAdminNews,
  updateNews,
  type NewsItem,
} from "@/lib/api/news";
import {
  createEvent,
  deleteEvent,
  getAdminEvents,
  updateEvent,
  type EventItem,
} from "@/lib/api/events";
import { useNotifications } from "@/components/providers/notification-provider";
import { toDateTimeLocalValue, toIsoDateTime } from "@/lib/date-time";
import { CmsSpreadsheetImport } from "@/components/admin/cms-bulk-tools";
import { bulkDeleteCmsRecords } from "@/lib/api/cms-bulk";

const emptyNewsForm = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  externalUrl: "",
  status: "draft" as "draft" | "published",
};

const emptyAnnouncementForm = {
  title: "",
  body: "",
  priority: "normal" as "normal" | "urgent",
  status: "draft" as "draft" | "published",
  publishAt: "",
  expiresAt: "",
};

const emptyEventForm = {
  title: "",
  description: "",
  location: "",
  startAt: "",
  endAt: "",
  coverImageUrl: "",
  status: "draft" as "draft" | "published",
};

type NewsForm = typeof emptyNewsForm;
type AnnouncementForm = typeof emptyAnnouncementForm;
type EventForm = typeof emptyEventForm;
type ContentType = "news" | "announcement" | "event";
type ManagedItem =
  | { type: "news"; item: NewsItem }
  | { type: "announcement"; item: AnnouncementItem }
  | { type: "event"; item: EventItem };

function itemDate(item: ManagedItem): string {
  if (item.type === "news") return item.item.publishedAt || item.item.createdAt;
  if (item.type === "announcement") return item.item.publishAt || item.item.createdAt;
  return item.item.startAt || item.item.createdAt;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function NewsFormFields({
  form,
  setForm,
}: {
  form: NewsForm;
  setForm: React.Dispatch<React.SetStateAction<NewsForm>>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Title
        <input
          maxLength={200}
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
          required
        />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Slug
        <input
          maxLength={200}
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
          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as NewsForm["status"] }))}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Facebook post URL
        <input
          type="url"
          maxLength={2048}
          value={form.externalUrl}
          onChange={(event) => setForm((current) => ({ ...current, externalUrl: event.target.value }))}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
          placeholder="https://www.facebook.com/..."
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Preview caption
        <textarea
          maxLength={300}
          value={form.excerpt}
          onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
          className="mt-2 min-h-24 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
        />
      </label>
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Article body
        <textarea
          maxLength={20000}
          value={form.body}
          onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
          className="mt-2 min-h-36 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
          required={!form.externalUrl.trim()}
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">Optional when a Facebook post URL is set.</span>
      </label>
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Cover image URL
        <input
          maxLength={2048}
          value={form.coverImageUrl}
          onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))}
          className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
          placeholder="https://example.com/image.jpg"
        />
      </label>
    </div>
  );
}

function AnnouncementFormFields({
  form,
  setForm,
}: {
  form: AnnouncementForm;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementForm>>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Title
        <input
          maxLength={200}
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
          onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as AnnouncementForm["priority"] }))}
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
          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AnnouncementForm["status"] }))}
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
          maxLength={5000}
          value={form.body}
          onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
          className="mt-2 min-h-36 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
          required
        />
      </label>
    </div>
  );
}

function EventFormFields({
  form,
  setForm,
}: {
  form: EventForm;
  setForm: React.Dispatch<React.SetStateAction<EventForm>>;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Title
        <input maxLength={200} required value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Start date & time
        <input type="datetime-local" required value={form.startAt} onChange={(event) => setForm((current) => ({ ...current, startAt: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        End date & time
        <input type="datetime-local" value={form.endAt} onChange={(event) => setForm((current) => ({ ...current, endAt: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Location
        <input maxLength={200} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        Status
        <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as EventForm["status"] }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900">
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Cover image URL
        <input type="url" maxLength={2048} value={form.coverImageUrl} onChange={(event) => setForm((current) => ({ ...current, coverImageUrl: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" placeholder="https://example.com/event.jpg" />
      </label>
      <label className="block text-sm font-medium text-slate-700 md:col-span-2">
        Description
        <textarea maxLength={5000} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="mt-2 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900" />
      </label>
    </div>
  );
}

export function NewsUpdatesManager() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [contentType, setContentType] = useState<ContentType>("news");
  const [newsForm, setNewsForm] = useState(emptyNewsForm);
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncementForm);
  const [eventForm, setEventForm] = useState(emptyEventForm);
  const [editing, setEditing] = useState<ManagedItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  const loadItems = useCallback(async () => {
    try {
      const [newsItems, announcementItems, eventItems] = await Promise.all([getAdminNews(), getAdminAnnouncements(), getAdminEvents()]);
      setNews(newsItems);
      setAnnouncements(announcementItems);
      setEvents(eventItems);
      setSelectedItems([]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load news and updates.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const items: ManagedItem[] = [
    ...news.map((item) => ({ type: "news" as const, item })),
    ...announcements.map((item) => ({ type: "announcement" as const, item })),
    ...events.map((item) => ({ type: "event" as const, item })),
  ].sort((left, right) => new Date(itemDate(right)).getTime() - new Date(itemDate(left)).getTime());

  function resetEditor() {
    setEditing(null);
    setNewsForm(emptyNewsForm);
    setAnnouncementForm(emptyAnnouncementForm);
    setEventForm(emptyEventForm);
    setError("");
  }

  function beginEdit(item: ManagedItem) {
    setEditing(item);
    setContentType(item.type);
    if (item.type === "news") {
      setNewsForm({
        title: item.item.title,
        slug: item.item.slug,
        excerpt: item.item.excerpt ?? "",
        body: item.item.body,
        coverImageUrl: item.item.coverImageUrl ?? "",
        externalUrl: item.item.externalUrl ?? "",
        status: item.item.status,
      });
    } else if (item.type === "announcement") {
      setAnnouncementForm({
        title: item.item.title,
        body: item.item.body,
        priority: item.item.priority,
        status: item.item.status,
        publishAt: toDateTimeLocalValue(item.item.publishAt),
        expiresAt: toDateTimeLocalValue(item.item.expiresAt),
      });
    } else {
      setEventForm({
        title: item.item.title,
        description: item.item.description ?? "",
        location: item.item.location ?? "",
        startAt: toDateTimeLocalValue(item.item.startAt),
        endAt: toDateTimeLocalValue(item.item.endAt),
        coverImageUrl: item.item.coverImageUrl ?? "",
        status: item.item.status,
      });
    }
    setError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (contentType === "news") {
        if (editing?.type === "news") {
          await updateNews(editing.item.id, newsForm);
          showSuccess("News post updated.", "Saved");
        } else if (editing) {
          throw new Error("The selected content type does not match the item being edited.");
        } else {
          await createNews(newsForm);
          showSuccess("News post created.", "Saved");
        }
      } else if (contentType === "announcement") {
        const payload = {
          ...announcementForm,
          publishAt: announcementForm.publishAt ? toIsoDateTime(announcementForm.publishAt) : "",
          expiresAt: announcementForm.expiresAt ? toIsoDateTime(announcementForm.expiresAt) : "",
        };
        if (editing?.type === "announcement") {
          await updateAnnouncement(editing.item.id, payload);
          showSuccess("Update saved.", "Saved");
        } else if (editing) {
          throw new Error("The selected content type does not match the item being edited.");
        } else {
          await createAnnouncement(payload);
          showSuccess("Update created.", "Saved");
        }
      } else {
        const payload = {
          ...eventForm,
          startAt: toIsoDateTime(eventForm.startAt),
          endAt: eventForm.endAt ? toIsoDateTime(eventForm.endAt) : "",
        };
        if (editing?.type === "event") {
          await updateEvent(editing.item.id, payload);
          showSuccess("Event updated.", "Saved");
        } else if (editing) {
          throw new Error("The selected content type does not match the item being edited.");
        } else {
          await createEvent(payload);
          showSuccess("Event created.", "Saved");
        }
      }

      resetEditor();
      await loadItems();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to save news and updates.";
      setError(message);
      showError(message, "Unable to save");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: ManagedItem) {
    if (!window.confirm(`Delete "${item.item.title}"?`)) return;
    try {
      if (item.type === "news") await deleteNews(item.item.id);
      else if (item.type === "announcement") await deleteAnnouncement(item.item.id);
      else await deleteEvent(item.item.id);
      showSuccess("Item deleted.", "Deleted");
      await loadItems();
    } catch (deleteError) {
      showError(deleteError instanceof Error ? deleteError.message : "Unable to delete item.", "Delete failed");
    }
  }

  async function handleBulkDelete() {
    const selected = items.filter((item) => selectedItems.includes(`${item.type}:${item.item.id}`));
    if (!selected.length || !window.confirm(`Delete ${selected.length} selected item${selected.length === 1 ? "" : "s"}?`)) return;
    const groups = [
      { resource: "news" as const, ids: selected.filter((item) => item.type === "news").map((item) => item.item.id) },
      { resource: "announcements" as const, ids: selected.filter((item) => item.type === "announcement").map((item) => item.item.id) },
      { resource: "events" as const, ids: selected.filter((item) => item.type === "event").map((item) => item.item.id) },
    ].filter((group) => group.ids.length > 0);
    if (groups.some((group) => group.ids.length > 100)) {
      showError("Select no more than 100 items of each type per bulk action.", "Too many items selected");
      return;
    }
    setIsDeleting(true);
    try {
      const results = await Promise.allSettled(groups.map((group) => bulkDeleteCmsRecords(group.resource, group.ids)));
      const succeeded = results.reduce((sum, result) => sum + (result.status === "fulfilled" ? result.value.succeeded : 0), 0);
      const failed = selected.length - succeeded;
      const failures = results.flatMap((result, index) => {
        const resource = groups[index].resource;
        if (result.status === "rejected") {
          return [`${resource}: ${result.reason instanceof Error ? result.reason.message : "Request failed"}`];
        }
        return result.value.failures.map((failure) => `${resource} item ${failure.row - 1}: ${failure.message}`);
      });
      if (editing && selected.some((item) => item.type === editing.type && item.item.id === editing.item.id)) resetEditor();
      setSelectedItems([]);
      if (failed) {
        showError(`${succeeded} deleted; ${failed} failed.\n${failures.join("\n")}`, "Some items were not deleted");
      } else {
        showSuccess(`${succeeded} item${succeeded === 1 ? "" : "s"} deleted.`, "Deleted");
      }
      await loadItems();
    } finally {
      setIsDeleting(false);
    }
  }

  function renderForm(mode: "create" | "edit") {
    return (
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {mode === "create" ? (
          <label className="mb-5 block max-w-sm text-sm font-medium text-slate-700">
            Type
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value as ContentType)}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            >
              <option value="news">News post</option>
              <option value="announcement">Update / announcement</option>
              <option value="event">Event</option>
            </select>
          </label>
        ) : null}
        {contentType === "news"
          ? <NewsFormFields form={newsForm} setForm={setNewsForm} />
          : contentType === "announcement"
            ? <AnnouncementFormFields form={announcementForm} setForm={setAnnouncementForm} />
            : <EventFormFields form={eventForm} setForm={setEventForm} />}
        {error ? (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}
        <div className="mt-6 flex justify-end gap-3">
          {mode === "edit" ? (
            <button type="button" onClick={resetEditor} disabled={isSubmitting} className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              Cancel
            </button>
          ) : null}
          <button type="submit" disabled={isSubmitting} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">
            {isSubmitting ? "Saving..." : mode === "edit" ? "Save changes" : "Publish / save"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <AdminShell title="News and Updates">
      <div className="mb-6">
        <p className="text-slate-600">Manage news, announcements, and events from one place. Events remain listed on the public Events page.</p>
      </div>

      <div className="mb-8">
        {renderForm("create")}
      </div>

        <CmsSpreadsheetImport
          resource={contentType === "news" ? "news" : contentType === "announcement" ? "announcements" : "events"}
          onImported={loadItems}
        />
        {selectedItems.length > 0 ? (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-violet-50 px-4 py-3">
          <span className="text-sm font-medium text-violet-900">{selectedItems.length} selected</span>
          <button type="button" onClick={() => void handleBulkDelete()} disabled={isDeleting} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete selected"}</button>
        </div>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-[760px] divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label="Select all news, updates, and events"
                  checked={items.length > 0 && selectedItems.length === items.length}
                  onChange={(event) => setSelectedItems(event.target.checked ? items.map((item) => `${item.type}:${item.item.id}`) : [])}
                />
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Title</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Type</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Date</th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">Loading news and updates...</td></tr>
            ) : error && items.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-red-700">{error}</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">No news, updates, or events yet.</td></tr>
            ) : items.map((item) => (
              <tr key={`${item.type}-${item.item.id}`} className="hover:bg-slate-50">
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    aria-label={`Select ${item.item.title}`}
                    checked={selectedItems.includes(`${item.type}:${item.item.id}`)}
                    onChange={(event) => setSelectedItems((current) => event.target.checked ? [...current, `${item.type}:${item.item.id}`] : current.filter((id) => id !== `${item.type}:${item.item.id}`))}
                  />
                </td>
                <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.item.title}</td>
                <td className="px-5 py-4 text-sm text-slate-700">{item.type === "news" ? "News post" : item.type === "event" ? "Event" : item.item.priority === "urgent" ? "Urgent update" : "Update"}</td>
                <td className="px-5 py-4 text-sm text-slate-700">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.item.status}</span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-700">{formatDate(itemDate(item))}</td>
                <td className="px-5 py-4 text-right text-sm">
                  <button type="button" onClick={() => beginEdit(item)} className="font-semibold text-violet-700 hover:text-violet-900">Edit</button>
                  <button type="button" onClick={() => void handleDelete(item)} className="ml-4 font-semibold text-red-700 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) resetEditor();
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="edit-news-updates-title" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-t-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="edit-news-updates-title" className="text-xl font-semibold text-slate-900">
                Edit {editing.type === "news" ? "news post" : editing.type === "event" ? "event" : "update"}
              </h2>
              <button type="button" onClick={resetEditor} disabled={isSubmitting} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60">Close</button>
            </div>
            {renderForm("edit")}
          </section>
        </div>
      ) : null}

      <div className="mt-6">
        <Link href="/admin/content" className="text-sm font-medium text-violet-700 hover:text-violet-800">← Back to content overview</Link>
      </div>
    </AdminShell>
  );
}
