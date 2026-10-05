"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function MandatePage() {
  const [page, setPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const paragraphs = page?.body
    ? page.body.split(/\n+/).map((paragraph) => paragraph.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title={page?.title || "Mandate"}
      subtitle="The official mandate of Casiguran District Hospital."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
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
        </article>
      </section>
    </PublicShell>
  );
}
