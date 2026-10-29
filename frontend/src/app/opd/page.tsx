"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ClipboardList, Stethoscope } from "lucide-react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicOpd, type OpdContent } from "@/lib/api/opd";

export default function OutpatientDepartmentPage() {
  const [content, setContent] = useState<OpdContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const data = await getPublicOpd();
        if (active) setContent(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load OPD information.");
      } finally {
        if (active) setIsLoading(false);
      }

    }

    loadPage();
    return () => {
      active = false;
    };
  }, []);

  const title = content?.title || "Out-Patient Department";

  return (
    <PublicShell title={title} heroImages={content?.coverImages.map((image) => image.url)}>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 md:py-12">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading OPD information...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
            <p className="font-semibold">OPD information is temporarily unavailable.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : content ? (
          <div className="space-y-10">
            <div className="flex flex-wrap gap-3">
              {content.generalInformation || content.highlights.length ? (
                <Link href="#general-information" className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">
                  Explore OPD services
                </Link>
              ) : null}
              <Link href="#clinic-schedule" className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50">
                <CalendarDays size={16} aria-hidden="true" />
                Clinic schedule
              </Link>
            </div>

            {content.generalInformation || content.highlights.length ? (
              <section id="general-information" className="scroll-mt-28">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Stethoscope size={21} aria-hidden="true" />
                  </span>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">General Information</h2>
                </div>
                {content.generalInformation ? <p className="whitespace-pre-line text-base leading-7 text-slate-600">{content.generalInformation}</p> : null}
                {content.highlights.length ? (
                  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {content.highlights.map((highlight, index) => (
                      <article key={`${highlight.title}-${index}`} className="rounded-2xl border border-violet-200 bg-white p-5 shadow-[0_10px_26px_rgba(37,27,88,0.04)]">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <ClipboardList size={19} aria-hidden="true" />
                        </div>
                        <h3 className="mt-4 font-semibold text-slate-900">{highlight.title}</h3>
                        {highlight.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{highlight.description}</p> : null}
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section id="clinic-schedule" className="scroll-mt-28">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-700">Plan your visit</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">Clinic Schedule</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">Check the schedule of outpatient clinics and consultation services.</p>
              </div>
              {content.clinicSchedule.length ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-[0_10px_26px_rgba(37,27,88,0.04)]">
                  <table className="w-full min-w-[640px] divide-y divide-slate-200 text-left">
                    <thead className="bg-violet-50/70">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Clinic / Service</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Days</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Clinic hours</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {content.clinicSchedule.map((item, index) => (
                        <tr key={`${item.clinic}-${index}`} className="align-top">
                          <td className="px-5 py-4 text-sm font-semibold text-slate-900">{item.clinic}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{item.days || "—"}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{item.hours || "—"}</td>
                          <td className="px-5 py-4 text-sm text-slate-600">{item.notes || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-7 text-center text-sm text-slate-600">
                  The clinic schedule will be posted once official clinic times are confirmed.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-violet-200 bg-violet-50/60 p-6 sm:p-8">
              <div className="mx-auto max-w-6xl text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
                  <ClipboardList size={20} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">OPD Organizational Structure</h2>
                {content.organizationalStructureDescription ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{content.organizationalStructureDescription}</p>
                ) : null}
                {content.organizationalChartImageUrl ? (
                  <a href={content.organizationalChartImageUrl} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-2xl border border-violet-200 bg-white p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={content.organizationalChartImageUrl} alt="Out-Patient Department organizational chart" className="mx-auto max-h-[720px] w-full object-contain" />
                    <span className="mt-2 block text-xs text-slate-500">Select the chart to view it at full size.</span>
                  </a>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">The OPD organizational chart will appear here once uploaded.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </PublicShell>
  );
}
