"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import {
  addHospitalHistoryCoverImages,
  getAdminPages,
  removeHospitalHistoryCoverImage,
  updatePage,
  type PageItem,
} from "@/lib/api/pages";

export default function AdminHospitalHistoryPage() {
  const [page, setPage] = useState<PageItem | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [coverImages, setCoverImages] = useState<File[]>([]);
  const [coverPreviews, setCoverPreviews] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingContent, setSavingContent] = useState(false);
  const [savingCover, setSavingCover] = useState(false);
  const [removingCoverIndex, setRemovingCoverIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    async function loadHistory() {
      try {
        const pages = await getAdminPages();
        const history = pages.find((item) => item.slug === "hospital-history");
        if (!history) throw new Error("Hospital History page is missing from the database.");
        setPage(history);
        setTitle(history.title);
        setBody(history.body);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load Hospital History.");
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  useEffect(() => {
    if (coverImages.length === 0) {
      setCoverPreviews([]);
      return;
    }
    const previewUrls = coverImages.map((file) => URL.createObjectURL(file));
    setCoverPreviews(previewUrls);
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [coverImages]);

  async function saveContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingContent(true);
    setError("");
    try {
      const saved = await updatePage("hospital-history", { title, body });
      setPage((current) => current ? { ...current, ...saved } : saved);
      setTitle(saved.title);
      setBody(saved.body);
      showSuccess("Hospital History content saved.", "Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save Hospital History.";
      setError(message);
      showError(message, "Unable to save Hospital History");
    } finally {
      setSavingContent(false);
    }
  }

  async function saveCoverImages(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!coverImages.length) {
      setError("Choose at least one photo before uploading.");
      return;
    }
    setSavingCover(true);
    setError("");
    try {
      const saved = await addHospitalHistoryCoverImages(coverImages);
      setPage((current) => current ? { ...current, ...saved } : saved);
      setCoverImages([]);
      showSuccess("Hospital History slideshow photos uploaded.", "Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload the slideshow photos.";
      setError(message);
      showError(message, "Unable to upload photos");
    } finally {
      setSavingCover(false);
    }
  }

  async function removeCoverImage(index: number) {
    if (!window.confirm("Remove this photo from the Hospital History slideshow?")) return;
    setRemovingCoverIndex(index);
    setError("");
    try {
      const saved = await removeHospitalHistoryCoverImage(index);
      setPage((current) => current ? { ...current, ...saved } : saved);
      showSuccess("Slideshow photo removed.", "Removed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove the slideshow photo.";
      setError(message);
      showError(message, "Unable to remove photo");
    } finally {
      setRemovingCoverIndex(null);
    }
  }

  const existingCoverImages = page?.coverImages ?? (page?.coverImageUrl ? [{ url: page.coverImageUrl }] : []);
  const remainingSlots = Math.max(0, 10 - existingCoverImages.length);

  return (
    <AdminShell title="Hospital History">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-slate-600">Edit the hospital history story and the rotating header photos on the public page.</p>
        <Link href="/admin/documents" className="text-sm font-medium text-violet-700 hover:text-violet-800">Back to Documents</Link>
      </div>

      {error ? <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {isLoading ? (
        <div role="status" aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading Hospital History...</div>
      ) : page ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={saveContent} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-semibold text-slate-900">History content</h2>
            <label className="mb-5 block text-sm font-medium text-slate-700">
              Page title
              <input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Hospital history story
              <textarea required maxLength={20000} value={body} onChange={(event) => setBody(event.target.value)} className="mt-2 min-h-[420px] w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 leading-7 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
              <span className="mt-1 block text-xs font-normal text-slate-500">Separate paragraphs with a blank line.</span>
            </label>
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={savingContent} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:bg-violet-400">
                {savingContent ? "Saving..." : "Save history"}
              </button>
            </div>
          </form>

          <form onSubmit={saveCoverImages} className="h-fit rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-slate-900">Header slideshow photos</h2>
            <p className="mb-5 text-sm leading-6 text-slate-600">Photos rotate automatically in the Hospital History header. Upload up to 10 photos total; new photos are added to the slideshow.</p>
            {existingCoverImages.length ? (
              <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {existingCoverImages.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={`Hospital History slideshow photo ${index + 1}`} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => void removeCoverImage(index)}
                      disabled={savingCover || removingCoverIndex !== null}
                      className="absolute right-2 top-2 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {removingCoverIndex === index ? "Removing..." : "Remove"}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mb-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No Hospital History photos uploaded yet.</p>
            )}
            <label className="block text-sm font-medium text-slate-700">
              Add photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                multiple
                disabled={remainingSlots === 0 || savingCover}
                onChange={(event) => setCoverImages(Array.from(event.target.files ?? []).slice(0, remainingSlots))}
                className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-800 disabled:opacity-60"
              />
            </label>
            <p className="mt-2 text-xs leading-5 text-slate-500">JPG, PNG, or WebP; maximum 5MB each. {remainingSlots} photo slot{remainingSlots === 1 ? "" : "s"} remaining.</p>
            {coverPreviews.length ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {coverPreviews.map((url, index) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={url} src={url} alt={`Selected Hospital History photo ${index + 1}`} className="h-24 w-full rounded-lg border border-violet-200 object-cover" />
                ))}
              </div>
            ) : null}
            <div className="mt-5 flex justify-end">
              <button type="submit" disabled={!coverImages.length || savingCover || coverImages.length > remainingSlots} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">
                {savingCover ? "Uploading..." : `Upload ${coverImages.length || ""} photo${coverImages.length === 1 ? "" : "s"}`}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
