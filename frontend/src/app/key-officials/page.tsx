"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function KeyOfficialsPage() {
  const [page, setPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPage() {
      try {
        setPage(await getPublicPage("key-officials"));
      } catch {
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadPage();
  }, []);

  const officials = page?.body
    ? page.body.split(/\n+/).map((entry) => entry.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title={page?.title || "Key Officials"}
      subtitle="Hospital leadership and key officials."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8">
          {isLoading ? (
            <p className="text-base leading-8 text-slate-500">Loading key officials...</p>
          ) : officials.length > 0 ? (
            <div className="space-y-4">
              {officials.map((official, index) => (
                <p key={index} className="text-base leading-8 text-slate-600">
                  {official}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-base leading-8 text-slate-600">
              Official key officials information will appear here once provided by the hospital.
            </p>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
