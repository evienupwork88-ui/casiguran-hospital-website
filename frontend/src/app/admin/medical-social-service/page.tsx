"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import {
  getAdminMedicalSocialService,
  removeMedicalSocialServiceImage,
  updateMedicalSocialService,
  uploadMedicalSocialServiceOrganizationalChart,
  uploadMedicalSocialServiceImages,
  type MedicalSocialServiceContent,
} from "@/lib/api/medical-social-service";

type MedicalSocialServiceForm = Pick<MedicalSocialServiceContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">;

const emptyForm: MedicalSocialServiceForm = {
  title: "Medical Social Service Department",
  generalInformation: "",
  highlights: [],
  clinicSchedule: [],
  organizationalStructureDescription: "",
};
const inputClassName = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white";
const labelClassName = "block text-sm font-medium text-slate-700";

export default function AdminMedicalSocialServicePage() {
  const [content, setContent] = useState<MedicalSocialServiceContent | null>(null);
  const [form, setForm] = useState<MedicalSocialServiceForm>(emptyForm);
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
        const data = await getAdminMedicalSocialService();
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
        if (active) setError(err instanceof Error ? err.message : "Unable to load Medical Social Service Department content.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadContent();
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
      const saved = await updateMedicalSocialService(form);
      setContent(saved);
      setForm({
        title: saved.title,
        generalInformation: saved.generalInformation,
        highlights: saved.highlights,
        clinicSchedule: saved.clinicSchedule,
        organizationalStructureDescription: saved.organizationalStructureDescription,
      });
      showSuccess("Medical Social Service Department page updated.", "Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save Medical Social Service Department content.";
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
      const saved = await uploadMedicalSocialServiceImages(selectedImages);
      setContent(saved);
      setSelectedImages([]);
      showSuccess("Medical Social Service Department photos uploaded.", "Gallery updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload Medical Social Service Department photos.";
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
      const saved = await uploadMedicalSocialServiceOrganizationalChart(selectedChartImage);
      setContent(saved);
      setSelectedChartImage(null);
      showSuccess("Medical Social Service Department organizational chart uploaded.", "Chart updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload the Medical Social Service Department organizational chart.";
      setError(message);
      showError(message, "Chart upload failed");
    } finally {
      setIsUploadingChart(false);
    }
  }

  async function handleRemoveImage(index: number) {
    if (!window.confirm("Remove this photo from the Medical Social Service Department slideshow?")) return;
    setError("");
    setRemovingImage(index);
    try {
      setContent(await removeMedicalSocialServiceImage(index));
      showSuccess("Photo removed from the Medical Social Service Department gallery.", "Photo removed");
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
    <AdminShell title="Medical Social Service Department">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Edit Medical Social Service Department information, services, and hours here. Use Manage photos to update the public slideshow.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/medical-social-service" target="_blank" className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">
            Preview public page
          </Link>
          <button type="button" onClick={() => { setSelectedImages([]); setSelectedChartImage(null); setError(""); setIsPhotoModalOpen(true); }} disabled={!content} className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">
            Manage photos ({content?.coverImages.length ?? 0}/10)
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading Medical Social Service Department content...</div>
      ) : error && !content ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{error}</div>
      ) : content ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">Page information</h2>
            <label className={`${labelClassName} mt-5`}>
              Page title
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} maxLength={200} required className={inputClassName} />
            </label>
            <label className={`${labelClassName} mt-5`}>
              General information
              <textarea value={form.generalInformation} onChange={(event) => setForm((current) => ({ ...current, generalInformation: event.target.value }))} maxLength={10000} rows={6} className={inputClassName} />
            </label>
            <label className={`${labelClassName} mt-5`}>
              Organizational structure description
              <textarea value={form.organizationalStructureDescription} onChange={(event) => setForm((current) => ({ ...current, organizationalStructureDescription: event.target.value }))} maxLength={3000} rows={3} className={inputClassName} />
            </label>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Medical Social Service Department services</h2>
                <p className="mt-1 text-sm text-slate-600">Add the services visitors should know about.</p>
              </div>
              <button type="button" onClick={() => setForm((current) => ({ ...current, highlights: [...current.highlights, { title: "", description: "" }] }))} disabled={form.highlights.length >= 30} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">Add service</button>
            </div>
            {form.highlights.length ? (
              <div className="mt-4 space-y-4">
                {form.highlights.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.5fr_auto] md:items-start">
                    <label className={labelClassName}>Service title<input value={item.title} onChange={(event) => updateHighlight(index, "title", event.target.value)} maxLength={200} required className={inputClassName} /></label>
                    <label className={labelClassName}>Description<textarea value={item.description} onChange={(event) => updateHighlight(index, "description", event.target.value)} maxLength={1000} rows={2} className={inputClassName} /></label>
                    <button type="button" onClick={() => setForm((current) => ({ ...current, highlights: current.highlights.filter((_, itemIndex) => itemIndex !== index) }))} className="mt-6 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No services added yet.</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Service schedule</h2>
                <p className="mt-1 text-sm text-slate-600">Publish Medical Social Service Department service days and hours.</p>
              </div>
              <button type="button" onClick={() => setForm((current) => ({ ...current, clinicSchedule: [...current.clinicSchedule, { clinic: "", days: "", hours: "", notes: "" }] }))} disabled={form.clinicSchedule.length >= 100} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">Add schedule</button>
            </div>
            {form.clinicSchedule.length ? (
              <div className="mt-4 space-y-4">
                {form.clinicSchedule.map((item, index) => (
                  <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {([
                      ["clinic", "Service"],
                      ["days", "Days"],
                      ["hours", "Hours"],
                      ["notes", "Notes"],
                    ] as const).map(([field, label]) => (
                      <label key={field} className={labelClassName}>{label}<input value={item[field]} onChange={(event) => updateSchedule(index, field, event.target.value)} className={inputClassName} maxLength={field === "notes" ? 500 : 200} required={field === "clinic"} /></label>
                    ))}
                    <button type="button" onClick={() => setForm((current) => ({ ...current, clinicSchedule: current.clinicSchedule.filter((_, itemIndex) => itemIndex !== index) }))} className="justify-self-start rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 lg:col-span-4">Remove schedule</button>
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No schedule added yet.</p>}
          </section>

          {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          <div className="flex justify-end">
            <button type="submit" disabled={isSaving} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isSaving ? "Saving..." : "Save Medical Social Service Department content"}</button>
          </div>
        </form>
      ) : null}

      {isPhotoModalOpen && content ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !isUploading && !isUploadingChart && removingImage === null) setIsPhotoModalOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="medical-social-service-photos-title" className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Slideshow gallery</p>
                <h2 id="medical-social-service-photos-title" className="mt-2 text-2xl font-semibold text-slate-950">Manage Medical Social Service Department photos</h2>
              </div>
              <button type="button" onClick={() => setIsPhotoModalOpen(false)} disabled={isUploading || isUploadingChart || removingImage !== null} aria-label="Close" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50 disabled:opacity-40">&times;</button>
            </div>
            <section className="mb-6 rounded-xl border border-slate-200 p-4 sm:p-5">
              <h3 className="font-semibold text-slate-900">Medical Social Service Department organizational chart</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">This chart is specific to Medical Social Service Department and is separate from the hospital-wide organizational chart.</p>
              {content.organizationalChartImageUrl ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={content.organizationalChartImageUrl} alt="Current Medical Social Service Department organizational chart" className="mx-auto max-h-64 w-full object-contain" />
                </div>
              ) : (
                <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No Medical Social Service Department organizational chart uploaded yet.</p>
              )}
              <label className={`${labelClassName} mt-4`}>
                {content.organizationalChartImageUrl ? "Replace chart image" : "Upload chart image"}
                <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml" disabled={isUploadingChart} onChange={(event) => { setSelectedChartImage(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800`} />
                <span className="mt-2 block text-xs font-normal text-slate-500">JPG, PNG, WebP, or SVG. SVG stays sharp when enlarged. Uploading replaces only the Medical Social Service Department chart.</span>
              </label>
              {selectedChartImage ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm">
                  <span className="text-violet-900">{selectedChartImage.name}</span>
                  <button type="button" onClick={() => void handleChartImageUpload()} disabled={isUploadingChart || isUploading} className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isUploadingChart ? "Uploading..." : "Upload chart"}</button>
                </div>
              ) : null}
            </section>
            <p className="mt-3 text-sm leading-6 text-slate-600">Upload up to 10 JPG, PNG, or WebP photos. They rotate automatically on the public page.</p>
            <label className={`${labelClassName} mt-4`}>
              Add photos
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple disabled={isUploading || content.coverImages.length >= 10} onChange={(event) => setSelectedImages(Array.from(event.target.files ?? []))} className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800`} />
              <span className="mt-2 block text-xs font-normal text-slate-500">Each image follows the configured image upload size limit.</span>
            </label>
            {selectedImages.length ? (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm">
                <span className="text-violet-900">{selectedImages.length} photo(s) selected</span>
                <button type="button" onClick={() => void handleUpload()} disabled={isUploading || selectedImages.length + content.coverImages.length > 10} className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isUploading ? "Uploading..." : "Upload photos"}</button>
              </div>
            ) : null}
            {selectedImages.length + content.coverImages.length > 10 ? <p role="alert" className="mt-2 text-sm text-red-700">Remove existing photos or select fewer files. Maximum is 10.</p> : null}
            {content.coverImages.length ? (
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {content.coverImages.map((image, index) => (
                  <div key={`${image.url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={`Medical Social Service Department slideshow image ${index + 1}`} className="h-28 w-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-slate-950/70 px-2 py-1 text-xs font-semibold text-white">{index + 1}</span>
                    <button type="button" onClick={() => void handleRemoveImage(index)} disabled={removingImage !== null || isUploading} className="absolute right-2 top-2 rounded-full bg-red-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-50">{removingImage === index ? "Removing..." : "Remove"}</button>
                  </div>
                ))}
              </div>
            ) : <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No photos uploaded.</p>}
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
