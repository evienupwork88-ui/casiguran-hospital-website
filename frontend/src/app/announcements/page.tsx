"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicAnnouncements, type AnnouncementItem } from "@/lib/api/announcements";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadAnnouncements() {
      try {
        const data = await getPublicAnnouncements();
        setAnnouncements(data);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadAnnouncements();
  }, []);

  const [featured, ...rest] = announcements;

  return (
    <PublicShell
      title="Announcements"
      subtitle="Official hospital announcements and public advisories."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {isLoading ? (
          <div className="border border-slate-200 bg-white p-10 text-slate-600 shadow-[0_12px_28px_rgba(37,27,88,0.04)]">
            Loading announcements...
          </div>
        ) : hasError ? (
          <div className="border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600">
            <p className="font-semibold text-slate-900">Announcements are temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            <p className="font-semibold text-slate-900">No announcements at this time</p>
            <p className="mt-2 text-sm">Official hospital bulletins and advisories will be published here.</p>
          </div>
        ) : (
          <>
            {featured ? (
              <div className="mb-8 border-l-4 border-violet-500 bg-white p-7 shadow-[0_12px_28px_rgba(37,27,88,0.05)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Latest update</p>
                  {featured.priority === "urgent" ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-red-700">
                      Urgent
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">{featured.title}</h2>
                <p className="mt-2 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
                  {formatDate(featured.publishAt || featured.createdAt)}
                </p>
                <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-600">{featured.body}</p>
              </div>
            ) : null}

            {rest.length > 0 ? (
              <div className="space-y-5">
                {rest.map((item) => (
                  <article key={item.id} className="border border-slate-200 bg-white p-6 shadow-[0_12px_26px_rgba(37,27,88,0.04)]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">
                          {formatDate(item.publishAt || item.createdAt)}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h3>
                      </div>
                      {item.priority === "urgent" ? (
                        <span className="inline-flex shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-red-700">
                          Urgent
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-4 whitespace-pre-line text-base leading-7 text-slate-600">{item.body}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </>
        )}
      </section>
    </PublicShell>
  );
}