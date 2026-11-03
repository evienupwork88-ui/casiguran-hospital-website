"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicCitizensCharterSlideshow } from "@/lib/api/citizens-charter-slideshow";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function MandatePage() {
  const [page, setPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [hasSlideshowError, setHasSlideshowError] = useState(false);

  useEffect(() => {
    async function loadMandate() {
      try {
        setPage(await getPublicPage("mandate"));
      } catch {
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadMandate();
  }, []);

  useEffect(() => {
    let cancelled = false;
    getPublicCitizensCharterSlideshow()
      .then((slideshow) => {
        if (!cancelled) setHeroImages(slideshow.coverImages.map((image) => image.url));
      })
      .catch(() => {
        if (!cancelled) setHasSlideshowError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const paragraphs = page?.body
    ? page.body.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title={page?.title || "Mandate"}
      subtitle="The official mandate of Casiguran District Hospital."
      heroImages={heroImages}
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {hasSlideshowError ? (
          <p role="alert" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Header photos could not be loaded. The mandate is still available.
          </p>
        ) : null}
        <article className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8">
          {isLoading ? (
            <p className="text-base leading-8 text-slate-500">Loading mandate...</p>
          ) : paragraphs.length > 0 ? (
            <div className="space-y-4">
              {paragraphs.map((paragraph, index) => (
                <p key={index} className="text-base leading-8 text-slate-600">
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-base leading-8 text-slate-600">
              The official hospital mandate will appear here once provided by Casiguran District Hospital.
            </p>
          )}
          <a
            href="https://lawphil.net/statutes/repacts/ra1971/ra_6332_1971.html"
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800"
          >
            Read Republic Act No. 6332 on Lawphil
          </a>
        </article>
      </section>
    </PublicShell>
  );
}
