"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import { getAdminOpd, removeOpdImage, updateOpd, uploadOpdImages, uploadOpdOrganizationalChart, type OpdContent } from "@/lib/api/opd";

type OpdForm = Pick<OpdContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">;

const emptyForm: OpdForm = {
  title: "Out-Patient Department",
  generalInformation: "",
  highlights: [],
  clinicSchedule: [],
  organizationalStructureDescription: "",
};
const inputClassName = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white";
const labelClassName = "block text-sm font-medium text-slate-700";

export default function AdminOpdPage() {
  const [content, setContent] = useState<OpdContent | null>(null);
  const [form, setForm] = useState<OpdForm>(emptyForm);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedChartImage, setSelectedChartImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingChart, setIsUploadingChart] = useState(false);
  const [removingImage, setRemovingImage] = useState<number | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    let active = true;
    async function loadContent() {
      try {
        const data = await getAdminOpd();
        if (!active) return;
        setContent(data);
        setForm({
          title: data.title,
          generalInformation: data.generalInformation,
          highlights: data.highlights,
          clinicSchedule: data.clinicSchedule,
          organizationalStructureDescription: data.organizationalStructureDescription,
        });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load OPD content.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadContent();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isPhotoModalOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isUploading && !isUploadingChart && removingImage === null) setIsPhotoModalOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isPhotoModalOpen, isUploading, isUploadingChart, removingImage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const saved = await updateOpd(form);
      setContent(saved);
      setForm({
        title: saved.title,
        generalInformation: saved.generalInformation,
        highlights: saved.highlights,
        clinicSchedule: saved.clinicSchedule,
        organizationalStructureDescription: saved.organizationalStructureDescription,
      });
      showSuccess("OPD page updated.", "Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save OPD content.";
      setError(message);
      showError(message, "Unable to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpload() {
    if (!selectedImages.length) return;
    setError("");
    setIsUploading(true);
    try {
      const saved = await uploadOpdImages(selectedImages);
      setContent(saved);
      setSelectedImages([]);
      showSuccess("OPD photos uploaded.", "Gallery updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload OPD photos.";
      setError(message);
      showError(message, "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleChartImageUpload() {
    if (!selectedChartImage) return;
    setError("");
    setIsUploadingChart(true);
    try {
      const saved = await uploadOpdOrganizationalChart(selectedChartImage);
      setContent(saved);
      setSelectedChartImage(null);
      showSuccess("OPD organizational chart uploaded.", "Chart updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload the OPD organizational chart.";
      setError(message);
      showError(message, "Chart upload failed");
    } finally {
      setIsUploadingChart(false);
    }
  }

  async function handleRemoveImage(index: number) {
    if (!window.confirm("Remove this photo from the OPD slideshow?")) return;
    setError("");
    setRemovingImage(index);
    try {
      setContent(await removeOpdImage(index));
      showSuccess("Photo removed from the OPD gallery.", "Photo removed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove the photo.";
      setError(message);
      showError(message, "Unable to remove photo");
    } finally {
      setRemovingImage(null);
    }
  }

  function updateHighlight(index: number, field: "title" | "description", value: string) {
    setForm((current) => ({
      ...current,
      highlights: current.highlights.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  function updateSchedule(index: number, field: "clinic" | "days" | "hours" | "notes", value: string) {
    setForm((current) => ({
      ...current,
      clinicSchedule: current.clinicSchedule.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item),
    }));
  }

  return (
    <AdminShell title="Out-Patient Department">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Edit OPD information and clinic schedules here. Use Manage photos to update the slideshow.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/opd" target="_blank" className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">
            Preview public page
          </Link>
          <button type="button" onClick={() => { setSelectedImages([]); setError(""); setIsPhotoModalOpen(true); }} disabled={!content} className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">
            Manage photos ({content?.coverImages.length ?? 0}/10)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading OPD content...</div>
      ) : error && !content ? (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : content ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Page title</h2>
            <label className={`${labelClassName} mt-4`}>
              Title
              <input required maxLength={200} value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={inputClassName} />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">General information</h2>
            <label className={`${labelClassName} mt-4`}>
              Information text
              <textarea maxLength={10000} rows={5} value={form.generalInformation} onChange={(event) => setForm((current) => ({ ...current, generalInformation: event.target.value }))} className={inputClassName} />
            </label>
            <div className="mt-5 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">Services and highlights</h3>
              <button type="button" onClick={() => setForm((current) => ({ ...current, highlights: [...current.highlights, { title: "", description: "" }] }))} disabled={form.highlights.length >= 30} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-40">Add highlight</button>
            </div>
            {form.highlights.map((item, index) => (
              <div key={index} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-[1fr_1.5fr_auto]">
                <label className={labelClassName}>Service / highlight<input required maxLength={200} value={item.title} onChange={(event) => updateHighlight(index, "title", event.target.value)} className={inputClassName} /></label>
                <label className={labelClassName}>Description<input maxLength={1000} value={item.description} onChange={(event) => updateHighlight(index, "description", event.target.value)} className={inputClassName} /></label>
                <button type="button" onClick={() => setForm((current) => ({ ...current, highlights: current.highlights.filter((_, itemIndex) => itemIndex !== index) }))} className="self-end rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-semibold text-slate-900">Clinic schedule</h2><p className="mt-1 text-sm text-slate-600">Add only confirmed clinic and consultation times.</p></div>
              <button type="button" onClick={() => setForm((current) => ({ ...current, clinicSchedule: [...current.clinicSchedule, { clinic: "", days: "", hours: "", notes: "" }] }))} disabled={form.clinicSchedule.length >= 100} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-40">Add schedule</button>
            </div>
            {form.clinicSchedule.map((item, index) => (
              <div key={index} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 md:grid-cols-2">
                <label className={labelClassName}>Clinic / service<input required maxLength={200} value={item.clinic} onChange={(event) => updateSchedule(index, "clinic", event.target.value)} className={inputClassName} /></label>
                <label className={labelClassName}>Days<input maxLength={200} value={item.days} onChange={(event) => updateSchedule(index, "days", event.target.value)} className={inputClassName} /></label>
                <label className={labelClassName}>Clinic hours<input maxLength={200} value={item.hours} onChange={(event) => updateSchedule(index, "hours", event.target.value)} className={inputClassName} /></label>
                <label className={labelClassName}>Notes<input maxLength={500} value={item.notes} onChange={(event) => updateSchedule(index, "notes", event.target.value)} className={inputClassName} /></label>
                <div className="md:col-span-2 md:text-right"><button type="button" onClick={() => setForm((current) => ({ ...current, clinicSchedule: current.clinicSchedule.filter((_, itemIndex) => itemIndex !== index) }))} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove schedule</button></div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Organizational structure</h2>
            <label className={`${labelClassName} mt-4`}>
              Section description
              <textarea maxLength={3000} rows={3} value={form.organizationalStructureDescription} onChange={(event) => setForm((current) => ({ ...current, organizationalStructureDescription: event.target.value }))} className={inputClassName} />
            </label>
            <p className="mt-3 text-sm text-slate-600">Upload the OPD-specific chart separately using Manage photos. The hospital-wide organizational chart remains under Documents.</p>
          </section>

          {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isSaving ? "Saving..." : "Save OPD content"}</button>
          </div>
        </form>
      ) : null}

      {isPhotoModalOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 sm:p-5" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isUploading && !isUploadingChart && removingImage === null) setIsPhotoModalOpen(false);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="opd-photos-title" className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Slideshow gallery</p>
                <h2 id="opd-photos-title" className="mt-2 text-2xl font-semibold text-slate-950">Manage OPD photos</h2>
              </div>
              <button type="button" onClick={() => setIsPhotoModalOpen(false)} disabled={isUploading || isUploadingChart || removingImage !== null} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50 disabled:opacity-40">&times;</button>
            </div>
            <section className="mb-6 rounded-xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900">OPD organizational chart</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">This is the chart for the Out-Patient Department only. It is separate from the hospital-wide chart in Documents.</p>
              {content?.organizationalChartImageUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={content.organizationalChartImageUrl} alt="Current OPD organizational chart" className="mx-auto max-h-64 w-full object-contain" />
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No OPD organizational chart uploaded yet.</p>
              )}
              <label className={`${labelClassName} mt-4`}>
                {content?.organizationalChartImageUrl ? "Replace chart image" : "Upload chart image"}
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml" disabled={isUploadingChart} onChange={(event) => { setSelectedChartImage(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800`} />
                <span className="mt-2 block text-xs font-normal text-slate-500">JPG, PNG, WebP, or SVG. SVG stays sharp when enlarged. Uploading replaces only the OPD chart.</span>
              </label>
              {selectedChartImage ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm">
                  <span className="text-violet-900">{selectedChartImage.name}</span>
                  <button type="button" onClick={() => void handleChartImageUpload()} disabled={isUploadingChart || isUploading} className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isUploadingChart ? "Uploading..." : "Upload OPD chart"}</button>
                </div>
              ) : null}
            </section>
            <p className="text-sm leading-6 text-slate-600">Upload up to 10 JPG, PNG, or WebP photos. They rotate automatically on the public page. Uploads add photos without replacing existing ones.</p>
            <label className={`${labelClassName} mt-4`}>
              Add photos
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple disabled={isUploading || (content?.coverImages.length ?? 0) >= 10} onChange={(event) => setSelectedImages(Array.from(event.target.files ?? []))} className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800`} />
              <span className="mt-2 block text-xs font-normal text-slate-500">Each image follows the configured image upload size limit.</span>
            </label>
            {selectedImages.length ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm">
                <span className="text-violet-900">{selectedImages.length} photo(s) selected</span>
                <button type="button" onClick={() => void handleUpload()} disabled={isUploading || selectedImages.length + (content?.coverImages.length ?? 0) > 10} className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isUploading ? "Uploading..." : "Upload photos"}</button>
              </div>
            ) : null}
            {selectedImages.length + (content?.coverImages.length ?? 0) > 10 ? <p role="alert" className="mt-2 text-sm text-red-700">Remove existing photos or select fewer files. Maximum is 10.</p> : null}
            {content?.coverImages.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {content.coverImages.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={`OPD slideshow image ${index + 1}`} className="h-28 w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-slate-950/70 px-2 py-1 text-xs font-semibold text-white">{index + 1}</span>
                    <button type="button" onClick={() => void handleRemoveImage(index)} disabled={removingImage !== null || isUploading} className="absolute right-2 top-2 rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50">{removingImage === index ? "Removing..." : "Remove"}</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No photos uploaded.</p>
            )}
            {error ? <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
              <button type="button" onClick={() => setIsPhotoModalOpen(false)} disabled={isUploading || isUploadingChart || removingImage !== null} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Done</button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminShell>
  );
}
