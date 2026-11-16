"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Stethoscope } from "lucide-react";
import Link from "next/link";
import { PublicShell } from "@/components/public/site-shell";
import { OrganizationalChartImageViewer } from "@/components/public/organizational-chart-image-viewer";
import { getPublicRadiology, type RadiologyContent } from "@/lib/api/radiology";

export default function RadiologyPage() {
  const [content, setContent] = useState<RadiologyContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadPage() {
      try {
        const data = await getPublicRadiology();
        if (active) setContent(data);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load Radiology information.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadPage();
    return () => { active = false; };
  }, []);

  const title = content?.title || "Radiology";

  return (
    <PublicShell title={title} heroImages={content?.coverImages.map((image) => image.url)}>
      <section className="w-full px-5 py-8 sm:px-8 md:py-12 lg:px-12">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading Radiology information...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
            <p className="font-semibold">Radiology information is temporarily unavailable.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : content ? (
          <div className="space-y-10">
            <div className="flex flex-wrap gap-3">
              {content.radiologyServiceGroups.some((group) => group.services.length) ? (
                <button
                  type="button"
                  onClick={() => {
                    const section = document.getElementById("radiology-services");
                    if (!section) return;
                    section.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800"
                >
                  View Radiology services
                </button>
              ) : null}
              <Link
                href="/rate-fees?category=radiology#rate-fees-content"
                className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 text-sm font-semibold text-violet-900 transition hover:bg-amber-100"
              >
                Inquire About Radiology Fees
              </Link>
            </div>

            {content.generalInformation ? (
              <section id="general-information" className="scroll-mt-28">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <Stethoscope size={21} aria-hidden="true" />
                  </span>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">General Information</h2>
                </div>
                <p className="whitespace-pre-line text-base leading-7 text-slate-600">{content.generalInformation}</p>
              </section>
            ) : null}

            {content.radiologyServiceGroups.some((group) => group.services.length) ? (
              <section id="radiology-services" className="scroll-mt-28">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <ClipboardList size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Available imaging tests</p>
                    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Radiology Services</h2>
                  </div>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  {content.radiologyServiceGroups.filter((group) => group.services.length).map((group) => (
                    <article key={group.category} className="rounded-2xl border border-violet-200 bg-white p-5 shadow-[0_10px_26px_rgba(37,27,88,0.04)] sm:p-6">
                      <h3 className="text-lg font-semibold text-slate-900">{group.category}</h3>
                      <ul className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                        {group.services.map((service, index) => (
                          <li key={`${service}-${index}`} className="flex items-start gap-2.5 text-sm leading-6 text-slate-700">
                            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-600" />
                            <span>{service}</span>
                          </li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <section id="clinic-schedule" className="scroll-mt-28">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                  <CalendarDays size={21} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Service availability</p>
                  <h2 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Schedule</h2>
                </div>
              </div>
              {content.clinicSchedule.length ? (
                <div className="overflow-x-auto rounded-2xl border border-violet-200 bg-white">
                  <table className="w-full min-w-[680px] text-left">
                    <thead className="bg-violet-50">
                      <tr>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Service</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Days</th>
                        <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Hours</th>
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
                  Radiology service hours will be posted once confirmed.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-violet-200 bg-violet-50/60 p-6 sm:p-8">
              <div className="mx-auto max-w-6xl text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm">
                  <ClipboardList size={20} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">Radiology Organizational Structure</h2>
                {content.organizationalStructureDescription ? (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{content.organizationalStructureDescription}</p>
                ) : null}
                {content.organizationalChartImageUrl ? (
                  <div className="mt-5 rounded-2xl border border-violet-200 bg-white p-3">
                    <OrganizationalChartImageViewer
                      src={content.organizationalChartImageUrl}
                      alt="Radiology organizational chart"
                      title="Radiology Organizational Chart"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={content.organizationalChartImageUrl}
                        alt="Radiology organizational chart"
                        className="mx-auto max-h-[720px] w-full object-contain"
                        draggable={false}
                      />
                    </OrganizationalChartImageViewer>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-600">The Radiology organizational chart will appear here once uploaded.</p>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </section>
    </PublicShell>
  );
}
