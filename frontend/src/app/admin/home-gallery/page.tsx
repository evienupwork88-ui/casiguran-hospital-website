"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import {
  getAdminHomeGallery,
  removeHomeGalleryImage,
  reorderHomeGalleryImages,
  uploadHomeGalleryImages,
  type HomeGallery,
} from "@/lib/api/home-gallery";

const labelClassName = "block text-sm font-medium text-slate-700";

export default function AdminHomeGalleryPage() {
  const [gallery, setGallery] = useState<HomeGallery | null>(null);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [removingImage, setRemovingImage] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    let active = true;
    getAdminHomeGallery()
      .then((item) => {
        if (active) setGallery(item);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load homepage gallery.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function handleUpload() {
    if (!selectedImages.length) return;
    setError("");
    setIsUploading(true);
    try {
      setGallery(await uploadHomeGalleryImages(selectedImages));
      setSelectedImages([]);
      showSuccess("Homepage gallery photos uploaded.", "Gallery updated");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unable to upload gallery photos.";
      setError(message);
      showError(message, "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove(index: number) {
    if (!window.confirm("Remove this photo from the homepage gallery?")) return;
    setError("");
    setRemovingImage(index);
    try {
      setGallery(await removeHomeGalleryImage(index));
      showSuccess("Photo removed from the homepage gallery.", "Photo removed");
    } catch (removeError) {
      const message = removeError instanceof Error ? removeError.message : "Unable to remove the photo.";
      setError(message);
      showError(message, "Unable to remove photo");
    } finally {
      setRemovingImage(null);
    }
  }

  async function moveImage(index: number, offset: -1 | 1) {
    if (!gallery) return;
    const target = index + offset;
    if (target < 0 || target >= gallery.images.length) return;
    const order = gallery.images.map((_, currentIndex) => currentIndex);
    [order[index], order[target]] = [order[target], order[index]];
    setError("");
    setIsReordering(true);
    try {
      setGallery(await reorderHomeGalleryImages(order));
    } catch (reorderError) {
      const message = reorderError instanceof Error ? reorderError.message : "Unable to reorder gallery photos.";
      setError(message);
      showError(message, "Unable to reorder photos");
    } finally {
      setIsReordering(false);
    }
  }

  if (isLoading) {
    return <AdminShell title="Homepage Gallery"><div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading homepage gallery...</div></AdminShell>;
  }

  return (
    <AdminShell title="Homepage Gallery">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          Manage the photos shown in the homepage gallery. Upload up to 30 JPG, PNG, or WebP images, then arrange them in display order.
        </p>
        <a href="/" target="_blank" rel="noreferrer" className="rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50">
          Preview homepage
        </a>
      </div>

      {error ? <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Homepage photos</h2>
        <p className="mt-1 text-sm text-slate-600">Photos appear on the public homepage in the order shown below. Maximum 30 photos.</p>
        <label className={`${labelClassName} mt-5`}>
          Add photos
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            multiple
            disabled={isUploading || !gallery || gallery.images.length >= 30}
            onChange={(event) => {
              setSelectedImages(Array.from(event.currentTarget.files ?? []));
              event.currentTarget.value = "";
            }}
            className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800"
          />
        </label>

        {selectedImages.length > 0 && gallery ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm">
            <span className="text-violet-900">{selectedImages.length} photo(s) selected</span>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || selectedImages.length + gallery.images.length > 30}
              className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
            >
              {isUploading ? "Uploading..." : "Upload photos"}
            </button>
          </div>
        ) : null}
        {selectedImages.length > 0 && gallery && selectedImages.length + gallery.images.length > 30 ? (
          <p role="alert" className="mt-2 text-sm text-red-700">Remove existing photos or choose fewer files. Maximum is 30 photos.</p>
        ) : null}

        {gallery?.images.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {gallery.images.map((image, index) => (
              <div key={`${image.url}-${index}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <Image
                  src={image.url}
                  alt={`Homepage gallery photo ${index + 1}`}
                  width={800}
                  height={600}
                  unoptimized
                  className="block h-auto w-full bg-slate-100"
                />
                <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">Photo {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => void moveImage(index, -1)} disabled={index === 0 || isReordering || removingImage !== null} aria-label={`Move photo ${index + 1} earlier`} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">↑</button>
                    <button type="button" onClick={() => void moveImage(index, 1)} disabled={index === gallery.images.length - 1 || isReordering || removingImage !== null} aria-label={`Move photo ${index + 1} later`} className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">↓</button>
                    <button type="button" onClick={() => void handleRemove(index)} disabled={removingImage !== null || isReordering} className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-40">{removingImage === index ? "Removing..." : "Remove"}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No homepage photos uploaded yet.</p>
        )}
      </section>
    </AdminShell>
  );
}
