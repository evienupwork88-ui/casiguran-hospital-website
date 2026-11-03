"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import {
  getPublicKeyOfficials,
  getPublicKeyOfficialsSlideshow,
  type KeyOfficialItem,
} from "@/lib/api/key-officials";

export default function KeyOfficialsPage() {
  const [officials, setOfficials] = useState<KeyOfficialItem[]>([]);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasSlideshowError, setHasSlideshowError] = useState(false);

  useEffect(() => {
    async function loadOfficials() {
      const [officialResult, slideshowResult] = await Promise.allSettled([
        getPublicKeyOfficials(),
        getPublicKeyOfficialsSlideshow(),
      ]);
      if (officialResult.status === "fulfilled") setOfficials(officialResult.value);
      else setHasError(true);
      if (slideshowResult.status === "fulfilled") {
        setHeroImages(slideshowResult.value.coverImages.map((image) => image.url));
      } else {
        setHasSlideshowError(true);
      }
      setIsLoading(false);
    }

    loadOfficials();
  }, []);

  return (
    <PublicShell
      title="Key Officials"
      subtitle="Meet the hospital officials responsible for leading our services."
      heroImages={heroImages}
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-[28px] border border-slate-200 bg-white p-10 text-center text-slate-600">
            Loading Key Officials...
          </div>
        ) : hasError ? (
          <div role="alert" className="rounded-[28px] border border-red-200 bg-red-50 p-10 text-center text-red-800">
            Unable to load Key Officials. Please try again later.
          </div>
        ) : (
          <>
          {hasSlideshowError ? (
            <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Header photos could not be loaded. Key Officials profiles are still available.
            </p>
          ) : null}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {officials.map((official) => (
              <article key={official.slug} className="overflow-hidden rounded-[28px] border border-violet-200 bg-white shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
                <div className="flex h-72 items-center justify-center bg-slate-50 p-5">
                  {official.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={official.photoUrl} alt={official.name || official.position} className="h-full w-full rounded-xl object-contain" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500">
                      Official photo pending
                    </div>
                  )}
                </div>
                <div className="p-5 text-center">
                  <h2 className="text-lg font-semibold leading-snug text-slate-900">{official.name || "Name to be announced"}</h2>
                  {official.officialPosition ? (
                    <>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{official.position}</p>
                      <p className="mt-1 text-sm leading-5 text-violet-700">{official.officialPosition}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-violet-700">{official.position}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
            </>
        )}
      </section>
    </PublicShell>
  );
}
