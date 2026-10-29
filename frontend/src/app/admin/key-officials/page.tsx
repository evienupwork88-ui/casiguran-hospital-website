"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminKeyOfficials, updateKeyOfficial, type KeyOfficialItem } from "@/lib/api/key-officials";
import { useNotifications } from "@/components/providers/notification-provider";

const emptyOfficialSlots: KeyOfficialItem["slug"][] = [
  "chief-of-hospital",
  "medical-service",
  "nursing-services",
  "out-patient-service",
];

const slotLabels: Record<KeyOfficialItem["slug"], string> = {
  "chief-of-hospital": "Chief of Hospital",
  "medical-service": "Head of Medical Service",
  "nursing-services": "Head of Nursing Services",
  "out-patient-service": "Head of Out-Patient Service",
};

export default function AdminKeyOfficialsPage() {
  const [officials, setOfficials] = useState<KeyOfficialItem[]>([]);
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  const [removePhotos, setRemovePhotos] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    async function loadOfficials() {
      try {
        setOfficials(await getAdminKeyOfficials());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load Key Officials.");
      } finally {
        setIsLoading(false);
      }
    }
    loadOfficials();
  }, []);

  function updateField(slug: KeyOfficialItem["slug"], field: "firstName" | "middleName" | "lastName" | "nameExtension" | "position" | "officialPosition", value: string) {
    setOfficials((current) => current.map((official) => official.slug === slug ? { ...official, [field]: value } : official));
  }

  async function saveOfficial(official: KeyOfficialItem) {
    setError("");
    setSavingSlug(official.slug);
    try {
      const formData = new FormData();
      formData.append("firstName", official.firstName);
      formData.append("middleName", official.middleName);
      formData.append("lastName", official.lastName);
      formData.append("nameExtension", official.nameExtension);
      formData.append("position", official.position);
      if (official.slug !== "chief-of-hospital") {
        formData.append("officialPosition", official.officialPosition ?? "");
      }
      formData.append("removePhoto", String(removePhotos[official.slug] ?? false));
      const photo = photos[official.slug];
      if (photo) formData.append("photo", photo);

      const saved = await updateKeyOfficial(official.slug, formData);
      setOfficials((current) => current.map((item) => item.slug === saved.slug ? saved : item));
      setPhotos((current) => ({ ...current, [official.slug]: null }));
      setRemovePhotos((current) => ({ ...current, [official.slug]: false }));
      showSuccess(`${slotLabels[official.slug]} profile saved.`, "Saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save profile.";
      setError(message);
      showError(message, "Unable to save profile");
    } finally {
      setSavingSlug(null);
    }
  }

  return (
    <AdminShell title="Key Officials">
      <p className="mb-6 text-slate-600">
        Manage the four leadership profiles shown on the public Key Officials page. Upload a portrait and enter each official&apos;s name and position.
      </p>

      {error ? <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {isLoading ? (
        <div role="status" aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">Loading profiles...</div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {emptyOfficialSlots.map((slug) => {
            const official = officials.find((item) => item.slug === slug);
            if (!official) return null;
            const photo = photos[slug];
            const isRemovingPhoto = removePhotos[slug] ?? false;
            return (
              <form key={slug} onSubmit={(event) => { event.preventDefault(); void saveOfficial(official); }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-lg font-semibold text-slate-900">{slotLabels[slug]}</h2>
                <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                  <div>
                    <div className="flex h-48 items-center justify-center overflow-hidden rounded-xl bg-slate-50">
                      {official.photoUrl && !isRemovingPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={official.photoUrl} alt={`Current photo for ${slotLabels[slug]}`} className="h-full w-full object-contain" />
                      ) : (
                        <span className="px-3 text-center text-sm text-slate-500">{photo ? photo.name : "No photo uploaded"}</span>
                      )}
                    </div>
                    <label className="mt-3 block text-sm font-medium text-slate-700">
                      Profile photo
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                        onChange={(event) => {
                          setPhotos((current) => ({ ...current, [slug]: event.target.files?.[0] ?? null }));
                          setRemovePhotos((current) => ({ ...current, [slug]: false }));
                        }}
                        className="mt-2 block w-full text-xs text-slate-600 file:mr-2 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:font-semibold file:text-violet-800"
                      />
                    </label>
                    {official.photoUrl ? (
                      <button type="button" onClick={() => { setRemovePhotos((current) => ({ ...current, [slug]: !isRemovingPhoto })); setPhotos((current) => ({ ...current, [slug]: null })); }} className="mt-2 text-xs font-semibold text-red-700 hover:text-red-800">
                        {isRemovingPhoto ? "Keep current photo" : "Remove current photo"}
                      </button>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-slate-700">
                      First name
                      <input required maxLength={100} value={official.firstName} onChange={(event) => updateField(slug, "firstName", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Middle name <span className="font-normal text-slate-500">(optional)</span>
                      <input maxLength={100} value={official.middleName} onChange={(event) => updateField(slug, "middleName", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Last name
                      <input required maxLength={100} value={official.lastName} onChange={(event) => updateField(slug, "lastName", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Name extension <span className="font-normal text-slate-500">(optional)</span>
                      <input maxLength={30} value={official.nameExtension} onChange={(event) => updateField(slug, "nameExtension", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      {slug === "chief-of-hospital" ? "Position" : "Leadership role"}
                      <input required maxLength={200} value={official.position} onChange={(event) => updateField(slug, "position", event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
                    </label>
                    {slug !== "chief-of-hospital" ? (
                      <label className="block text-sm font-medium text-slate-700">
                        Official position
                        <input required maxLength={200} value={official.officialPosition ?? ""} onChange={(event) => updateField(slug, "officialPosition", event.target.value)} placeholder="e.g. Medical Specialist III" className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none focus:border-violet-500 focus:bg-white" />
                      </label>
                    ) : null}
                    <p className="text-xs leading-5 text-slate-500">JPG, PNG, or WebP, maximum 5MB. Saving a new photo replaces the current photo.</p>
                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={savingSlug === slug} className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">
                        {savingSlug === slug ? "Saving..." : "Save profile"}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
