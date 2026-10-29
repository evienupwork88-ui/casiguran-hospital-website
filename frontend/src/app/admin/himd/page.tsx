"use client";

import Link from "next/link";
import Image from "next/image";
import { ClipboardPlus, Files, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import {
  getAdminHimdContent,
  getAdminHimdSlideshow,
  himdSectionLabels,
  himdSections,
  removeHimdImage,
  updateHimdContent,
  uploadHimdImages,
  uploadHimdOrganizationalChart,
  type HimdContent,
  type HimdSection,
  type HimdSlideshow,
} from "@/lib/api/himd";

type HimdForm = Pick<HimdContent, "title" | "generalInformation" | "highlights" | "clinicSchedule" | "organizationalStructureDescription">;
type HimdForms = Record<HimdSection, HimdForm>;
type HimdSections = Record<HimdSection, HimdContent>;

const sectionDetails: Record<HimdSection, { description: string; Icon: typeof ClipboardPlus }> = {
  admitting: { description: "Patient admission and registration", Icon: ClipboardPlus },
  opd: { description: "Outpatient records and services", Icon: Stethoscope },
  "him-service": { description: "Health information management", Icon: Files },
};

const inputClassName = "mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white";
const labelClassName = "block text-sm font-medium text-slate-700";

export default function AdminHimdPage() {
  const [sections, setSections] = useState<Partial<HimdSections>>({});
  const [forms, setForms] = useState<Partial<HimdForms>>({});
  const [slideshow, setSlideshow] = useState<HimdSlideshow | null>(null);
  const [activeSection, setActiveSection] = useState<HimdSection>("admitting");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedChartImage, setSelectedChartImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingChart, setIsUploadingChart] = useState(false);
  const [removingImage, setRemovingImage] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();
  const content = sections[activeSection];
  const form = forms[activeSection];

  useEffect(() => {
    let active = true;
    async function loadContent() {
      try {
        const [items, sharedSlideshow] = await Promise.all([
          Promise.all(himdSections.map((section) => getAdminHimdContent(section))),
          getAdminHimdSlideshow(),
        ]);
        if (!active) return;
        const nextSections = {} as HimdSections;
        const nextForms = {} as HimdForms;
        for (const item of items) {
          nextSections[item.section] = item;
          nextForms[item.section] = {
            title: item.title,
            generalInformation: item.generalInformation,
            highlights: item.highlights,
            clinicSchedule: item.clinicSchedule,
            organizationalStructureDescription: item.organizationalStructureDescription,
          };
        }
        setSections(nextSections);
        setForms(nextForms);
        setSlideshow(sharedSlideshow);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load HIMD content.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadContent();
    return () => { active = false; };
  }, []);

  function updateForm(patch: Partial<HimdForm>) {
    setForms((current) => ({
      ...current,
      [activeSection]: { ...current[activeSection], ...patch } as HimdForm,
    }));
  }

  function setSectionContent(item: HimdContent) {
    setSections((current) => ({ ...current, [item.section]: item }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setError("");
    setIsSaving(true);
    try {
      const saved = await updateHimdContent(activeSection, form);
      setSectionContent(saved);
      setForms((current) => ({ ...current, [activeSection]: {
        title: saved.title,
        generalInformation: saved.generalInformation,
        highlights: saved.highlights,
        clinicSchedule: saved.clinicSchedule,
        organizationalStructureDescription: saved.organizationalStructureDescription,
      } }));
      showSuccess(`${himdSectionLabels[activeSection]} content updated.`, "Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save HIMD content.";
      setError(message);
      showError(message, "Unable to save");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUploadImages() {
    if (!selectedImages.length) return;
    setError("");
    setIsUploading(true);
    try {
      setSlideshow(await uploadHimdImages(selectedImages));
      setSelectedImages([]);
      showSuccess("HIMD slideshow photos uploaded.", "Gallery updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload HIMD photos.";
      setError(message);
      showError(message, "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleUploadChart() {
    if (!selectedChartImage) return;
    setError("");
    setIsUploadingChart(true);
    try {
      setSectionContent(await uploadHimdOrganizationalChart(activeSection, selectedChartImage));
      setSelectedChartImage(null);
      showSuccess(`${himdSectionLabels[activeSection]} organizational chart uploaded.`, "Chart updated");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to upload HIMD organizational chart.";
      setError(message);
      showError(message, "Chart upload failed");
    } finally {
      setIsUploadingChart(false);
    }
  }

  async function handleRemoveImage(index: number) {
    if (!window.confirm("Remove this photo from the shared HIMD slideshow?")) return;
    setError("");
    setRemovingImage(index);
    try {
      setSlideshow(await removeHimdImage(index));
      showSuccess("Photo removed from the slideshow.", "Photo removed");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to remove the photo.";
      setError(message);
      showError(message, "Unable to remove photo");
    } finally {
      setRemovingImage(null);
    }
  }

  if (isLoading) {
    return <AdminShell title="Health Information Management Department"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading HIMD content...</div></AdminShell>;
  }

  return (
    <AdminShell title="Health Information Management Department">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">Manage one shared slideshow for the HIMD page, with separate information, schedules, and organizational charts for Admitting, OPD, and HIM Service.</p>
        <Link href="/himd" target="_blank" className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">Preview public page</Link>
      </div>
      {error && !content ? <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">HIMD slideshow</h2>
        <p className="mt-1 text-sm text-slate-600">One slideshow is shared across Admitting, OPD, and HIM Service. Upload up to 30 JPG, PNG, or WebP images.</p>
        <label className={`${labelClassName} mt-4`}>Add photos<input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" multiple disabled={isUploading || !slideshow || slideshow.coverImages.length >= 30} onChange={(event) => setSelectedImages(Array.from(event.target.files ?? []))} className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800`} /></label>
        {selectedImages.length && slideshow ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm"><span className="text-violet-900">{selectedImages.length} photo(s) selected</span><button type="button" onClick={() => void handleUploadImages()} disabled={isUploading || selectedImages.length + slideshow.coverImages.length > 30} className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isUploading ? "Uploading..." : "Upload photos"}</button></div> : null}
        {selectedImages.length && slideshow && selectedImages.length + slideshow.coverImages.length > 30 ? <p role="alert" className="mt-2 text-sm text-red-700">Remove existing photos or select fewer files. Maximum is 30 shared photos.</p> : null}
        {slideshow?.coverImages.length ? <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{slideshow.coverImages.map((image, index) => <div key={`${image.url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200"><Image src={image.url} alt={`HIMD slideshow image ${index + 1}`} width={500} height={300} unoptimized className="h-28 w-full object-cover" /><button type="button" onClick={() => void handleRemoveImage(index)} disabled={removingImage === index} className="w-full px-2 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{removingImage === index ? "Removing..." : "Remove photo"}</button></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No shared slideshow photos uploaded yet.</p>}
      </section>
      <div className="mb-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 shadow-[0_18px_50px_rgba(47,32,104,0.07)] sm:p-5">
        <div className="mb-4 px-1">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Department sections</p>
          <p className="mt-1 text-sm text-slate-600">Choose which HIMD content to manage. Each section saves independently.</p>
        </div>
        <div role="tablist" aria-label="HIMD sections" className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {himdSections.map((section, index) => {
            const { Icon, description } = sectionDetails[section];
            const isActive = activeSection === section;
            return (
              <button
                key={section}
                id={`admin-himd-tab-${section}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`admin-himd-panel-${section}`}
                onClick={() => { setActiveSection(section); setSelectedChartImage(null); setError(""); }}
                className={`group relative flex min-h-[88px] items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:min-h-[104px] sm:px-4 ${isActive ? "border-violet-700 bg-gradient-to-br from-violet-700 via-violet-700 to-indigo-800 text-white shadow-[0_12px_24px_rgba(76,29,149,0.24)]" : "border-white/80 bg-white/80 text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"}`}
              >
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition ${isActive ? "bg-white/15 text-white" : "bg-violet-50 text-violet-700 group-hover:bg-violet-100"}`}>
                  <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-bold sm:text-base ${isActive ? "text-white" : "text-slate-900"}`}>{himdSectionLabels[section]}</span>
                  <span className={`mt-1 block text-xs leading-5 ${isActive ? "text-violet-100" : "text-slate-500"}`}>{description}</span>
                </span>
                <span className={`absolute right-3 top-3 text-[10px] font-bold tracking-widest ${isActive ? "text-violet-200" : "text-slate-300"}`}>0{index + 1}</span>
                {isActive ? <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-white/70" /> : null}
              </button>
            );
          })}
        </div>
      </div>
      {!content || !form ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">{error || "HIMD content is unavailable."}</div>
      ) : (
        <section id={`admin-himd-panel-${activeSection}`} role="tabpanel" aria-labelledby={`admin-himd-tab-${activeSection}`} className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-slate-900">{himdSectionLabels[activeSection]} information</h2>
              <label className={`${labelClassName} mt-5`}>Page title<input value={form.title} onChange={(event) => updateForm({ title: event.target.value })} maxLength={200} required className={inputClassName} /></label>
              <label className={`${labelClassName} mt-5`}>General information<textarea value={form.generalInformation} onChange={(event) => updateForm({ generalInformation: event.target.value })} maxLength={10000} rows={6} className={inputClassName} /></label>
              <label className={`${labelClassName} mt-5`}>Organizational structure description<textarea value={form.organizationalStructureDescription} onChange={(event) => updateForm({ organizationalStructureDescription: event.target.value })} maxLength={3000} rows={3} className={inputClassName} /></label>
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Services</h2><p className="mt-1 text-sm text-slate-600">Add services for the {himdSectionLabels[activeSection]} section.</p></div><button type="button" onClick={() => updateForm({ highlights: [...form.highlights, { title: "", description: "" }] })} disabled={form.highlights.length >= 30} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">Add service</button></div>
              {form.highlights.length ? <div className="mt-4 space-y-4">{form.highlights.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-[1fr_1.5fr_auto] md:items-start"><label className={labelClassName}>Service title<input value={item.title} onChange={(event) => updateForm({ highlights: form.highlights.map((highlight, itemIndex) => itemIndex === index ? { ...highlight, title: event.target.value } : highlight) })} maxLength={200} required className={inputClassName} /></label><label className={labelClassName}>Description<textarea value={item.description} onChange={(event) => updateForm({ highlights: form.highlights.map((highlight, itemIndex) => itemIndex === index ? { ...highlight, description: event.target.value } : highlight) })} maxLength={1000} rows={2} className={inputClassName} /></label><button type="button" onClick={() => updateForm({ highlights: form.highlights.filter((_, itemIndex) => itemIndex !== index) })} className="mt-6 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No services added yet.</p>}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-900">Service schedule</h2><p className="mt-1 text-sm text-slate-600">Publish {himdSectionLabels[activeSection]} service days and hours.</p></div><button type="button" onClick={() => updateForm({ clinicSchedule: [...form.clinicSchedule, { clinic: "", days: "", hours: "", notes: "" }] })} disabled={form.clinicSchedule.length >= 100} className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">Add schedule</button></div>
              {form.clinicSchedule.length ? <div className="mt-4 space-y-4">{form.clinicSchedule.map((item, index) => <div key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 sm:grid-cols-2 lg:grid-cols-4">{([["clinic", "Service"], ["days", "Days"], ["hours", "Hours"], ["notes", "Notes"]] as const).map(([field, label]) => <label key={field} className={labelClassName}>{label}<input value={item[field]} onChange={(event) => updateForm({ clinicSchedule: form.clinicSchedule.map((schedule, itemIndex) => itemIndex === index ? { ...schedule, [field]: event.target.value } : schedule) })} className={inputClassName} maxLength={field === "notes" ? 500 : 200} required={field === "clinic"} /></label>)}<button type="button" onClick={() => updateForm({ clinicSchedule: form.clinicSchedule.filter((_, itemIndex) => itemIndex !== index) })} className="justify-self-start rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 lg:col-span-4">Remove schedule</button></div>)}</div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No schedule added yet.</p>}
            </section>
            {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
            <div className="flex justify-end"><button type="submit" disabled={isSaving} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isSaving ? "Saving..." : `Save ${himdSectionLabels[activeSection]} content`}</button></div>
          </form>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900">{himdSectionLabels[activeSection]} organizational chart</h2>
            <p className="mt-1 text-sm text-slate-600">This chart is stored separately for the selected HIMD section. JPG, PNG, WebP, or SVG are accepted.</p>
            {content.organizationalChartImageUrl ? <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2"><Image src={content.organizationalChartImageUrl} alt={`${himdSectionLabels[activeSection]} organizational chart`} width={1200} height={900} unoptimized className="mx-auto max-h-72 w-full object-contain" /></div> : <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">No chart uploaded yet.</p>}
            <label className={`${labelClassName} mt-4`}>{content.organizationalChartImageUrl ? "Replace chart image" : "Upload chart image"}<input type="file" accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml" disabled={isUploadingChart} onChange={(event) => { setSelectedChartImage(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} className={`${inputClassName} file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800`} /></label>
            {selectedChartImage ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm"><span className="text-violet-900">{selectedChartImage.name}</span><button type="button" onClick={() => void handleUploadChart()} disabled={isUploadingChart} className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">{isUploadingChart ? "Uploading..." : "Upload chart"}</button></div> : null}
          </section>
        </section>
      )}
    </AdminShell>
  );
}
