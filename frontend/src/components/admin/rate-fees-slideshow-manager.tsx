"use client";

import { useEffect, useState } from "react";
import {
  addRateFeesSlideshowImages,
  getAdminRateFeesSlideshow,
  removeRateFeesSlideshowImage,
  type RateFeesSlideshow,
} from "@/lib/api/rate-fees-slideshow";
import { useNotifications } from "@/components/providers/notification-provider";

export function RateFeesSlideshowManager() {
  const [slideshow, setSlideshow] = useState<RateFeesSlideshow | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    getAdminRateFeesSlideshow()
      .then(setSlideshow)
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load slideshow photos.");
      })
      .finally(() => setIsLoading(false));
  }, []);

  async function uploadPhotos() {
    if (!files.length) return;
    setError("");
    setIsUploading(true);
    try {
      setSlideshow(await addRateFeesSlideshowImages(files));
      setFiles([]);
      showSuccess("Rate and Fees header slideshow updated.", "Photos uploaded");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Unable to upload header photos.";
      setError(message);
      showError(message, "Unable to upload photos");
    } finally {
      setIsUploading(false);
    }
  }

  async function removePhoto(index: number) {
    if (!window.confirm("Remove this photo from the Rate and Fees header slideshow?")) return;
    setError("");
    setRemovingIndex(index);
    try {
      setSlideshow(await removeRateFeesSlideshowImage(index));
      showSuccess("Rate and Fees header photo removed.", "Photo removed");
    } catch (removeError) {
      const message = removeError instanceof Error ? removeError.message : "Unable to remove the header photo.";
      setError(message);
      showError(message, "Unable to remove photo");
    } finally {
      setRemovingIndex(null);
    }
  }

  return (
    <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Rate and Fees header slideshow</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Upload photos to rotate behind the public Rate and Fees title. Maximum 10 JPG, PNG, or WebP photos, 5MB each.
      </p>
      {error ? <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
      {isLoading ? (
        <div role="status" aria-busy="true" className="mt-4 rounded-xl border border-slate-200 p-5 text-center text-sm text-slate-600">
          Loading slideshow photos...
        </div>
      ) : (
        <>
          <label className="mt-4 block text-sm font-medium text-slate-700">
            Choose header photos
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              multiple
              disabled={isUploading || !slideshow || slideshow.coverImages.length >= 10}
              onChange={(event) => {
                setFiles(Array.from(event.currentTarget.files ?? []));
                event.currentTarget.value = "";
              }}
              className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-100 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-violet-800"
            />
          </label>
          {files.length > 0 && slideshow ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-3 py-2 text-sm">
              <span className="text-violet-900">{files.length} photo(s) selected</span>
              <button
                type="button"
                onClick={() => void uploadPhotos()}
                disabled={isUploading || files.length + slideshow.coverImages.length > 10}
                className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
              >
                {isUploading ? "Uploading..." : "Upload photos"}
              </button>
            </div>
          ) : null}
          {files.length > 0 && slideshow && files.length + slideshow.coverImages.length > 10 ? (
            <p role="alert" className="mt-2 text-sm text-red-700">Remove existing photos or choose fewer files. Maximum is 10 photos.</p>
          ) : null}
          {slideshow?.coverImages.length ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {slideshow.coverImages.map((image, index) => (
                <div key={`${image.url}-${index}`} className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={`Rate and Fees header photo ${index + 1}`} className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => void removePhoto(index)}
                    disabled={isUploading || removingIndex !== null}
                    className="absolute right-2 top-2 rounded-lg bg-slate-950/75 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    {removingIndex === index ? "Removing..." : "Remove"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">No header photos uploaded yet.</p>
          )}
        </>
      )}
    </section>
  );
}
