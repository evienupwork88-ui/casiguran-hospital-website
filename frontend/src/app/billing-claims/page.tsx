"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, CreditCard, FileCheck2, Stethoscope } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PublicShell } from "@/components/public/site-shell";
import { billingClaimsLabels, billingClaimsSections, getPublicBillingClaims, type BillingClaimsContent, type BillingClaimsSection } from "@/lib/api/billing-claims";

const sectionDetails: Record<BillingClaimsSection, { description: string; Icon: typeof CreditCard }> = {
  billing: { description: "Hospital billing information and payment guidance", Icon: CreditCard },
  claims: { description: "Insurance and benefit claim assistance", Icon: FileCheck2 },
};

export default function BillingClaimsPage() {
  const [sections, setSections] = useState<Partial<Record<BillingClaimsSection, BillingClaimsContent>>>({});
  const [activeSection, setActiveSection] = useState<BillingClaimsSection>("billing");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSections() {
      try {
        const items = await Promise.all(billingClaimsSections.map((section) => getPublicBillingClaims(section)));
        if (active) setSections(Object.fromEntries(items.map((item) => [item.section, item])));
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load Billing and Claims information.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadSections();
    return () => { active = false; };
  }, []);

  const content = sections[activeSection];

  return (
    <PublicShell title="Billing and Claims" heroImages={content?.coverImages.map((image) => image.url)}>
      <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 md:py-12">
        <div className="mb-8 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-indigo-50 p-4 shadow-[0_18px_50px_rgba(47,32,104,0.07)] sm:p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Patient support</p>
              <p className="mt-1 text-sm text-slate-600">Choose a service area to view information and assistance.</p>
            </div>
            <span className="hidden text-xs font-medium text-slate-400 sm:block">02 sections</span>
          </div>
          <div role="tablist" aria-label="Billing and Claims sections" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {billingClaimsSections.map((section, index) => {
              const { Icon, description } = sectionDetails[section];
              const isActive = activeSection === section;
              return (
                <button
                  key={section}
                  id={`billing-claims-tab-${section}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`billing-claims-panel-${section}`}
                  onClick={() => setActiveSection(section)}
                  className={`group relative flex min-h-[92px] items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:min-h-[104px] sm:px-5 ${isActive ? "border-violet-700 bg-gradient-to-br from-violet-700 via-violet-700 to-indigo-800 text-white shadow-[0_12px_24px_rgba(76,29,149,0.24)]" : "border-white/80 bg-white/80 text-slate-800 shadow-sm hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"}`}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${isActive ? "bg-white/15 text-white" : "bg-violet-50 text-violet-700 group-hover:bg-violet-100"}`}>
                    <Icon size={22} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-base font-bold ${isActive ? "text-white" : "text-slate-900"}`}>{billingClaimsLabels[section]}</span>
                    <span className={`mt-1 block text-xs leading-5 ${isActive ? "text-violet-100" : "text-slate-500"}`}>{description}</span>
                  </span>
                  <span className={`absolute right-3 top-3 text-[10px] font-bold tracking-widest ${isActive ? "text-violet-200" : "text-slate-300"}`}>0{index + 1}</span>
                  {isActive ? <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-white/70" /> : null}
                </button>
              );
            })}
          </div>
        </div>
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600">Loading Billing and Claims information...</div>
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-800">
            <p className="font-semibold">Billing and Claims information is temporarily unavailable.</p>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        ) : content ? (
          <div id={`billing-claims-panel-${activeSection}`} role="tabpanel" aria-labelledby={`billing-claims-tab-${activeSection}`} className="space-y-10">
            <header>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">{billingClaimsLabels[activeSection]}</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-900">{content.title}</h2>
            </header>
            <div className="flex flex-wrap gap-3">
              {content.generalInformation || content.highlights.length ? (
                <Link href="#billing-claims-general-information" className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800">Explore information</Link>
              ) : null}
              <Link href="#billing-claims-schedule" className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-50">
                <CalendarDays size={16} aria-hidden="true" />
                Service schedule
              </Link>
            </div>
            {content.generalInformation || content.highlights.length ? (
              <section id="billing-claims-general-information" className="scroll-mt-28">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><Stethoscope size={21} aria-hidden="true" /></span>
                  <h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">General Information</h3>
                </div>
                {content.generalInformation ? <p className="whitespace-pre-line text-base leading-7 text-slate-600">{content.generalInformation}</p> : null}
                {content.highlights.length ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{content.highlights.map((highlight, index) => <article key={`${highlight.title}-${index}`} className="rounded-2xl border border-violet-200 bg-white p-5 shadow-[0_10px_26px_rgba(37,27,88,0.04)]"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ClipboardList size={19} aria-hidden="true" /></div><h4 className="mt-4 font-semibold text-slate-900">{highlight.title}</h4>{highlight.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{highlight.description}</p> : null}</article>)}</div> : null}
              </section>
            ) : null}
            <section id="billing-claims-schedule" className="scroll-mt-28">
              <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700"><CalendarDays size={21} aria-hidden="true" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Service availability</p><h3 className="text-2xl font-semibold tracking-[-0.04em] text-slate-900">Schedule</h3></div></div>
              {content.clinicSchedule.length ? <div className="overflow-x-auto rounded-2xl border border-violet-200 bg-white"><table className="w-full min-w-[680px] text-left"><thead className="bg-violet-50"><tr><th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Service</th><th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Days</th><th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Hours</th><th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600">Notes</th></tr></thead><tbody className="divide-y divide-slate-100">{content.clinicSchedule.map((item, index) => <tr key={`${item.clinic}-${index}`} className="align-top"><td className="px-5 py-4 text-sm font-semibold text-slate-900">{item.clinic}</td><td className="px-5 py-4 text-sm text-slate-600">{item.days || "—"}</td><td className="px-5 py-4 text-sm text-slate-600">{item.hours || "—"}</td><td className="px-5 py-4 text-sm text-slate-600">{item.notes || "—"}</td></tr>)}</tbody></table></div> : <div className="rounded-2xl border border-dashed border-violet-200 bg-white p-7 text-center text-sm text-slate-600">Service hours will be posted once confirmed.</div>}
            </section>
            <section className="rounded-3xl border border-violet-200 bg-violet-50/60 p-6 sm:p-8">
              <div className="mx-auto max-w-6xl text-center"><div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-violet-700 shadow-sm"><ClipboardList size={20} aria-hidden="true" /></div><h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{billingClaimsLabels[activeSection]} Organizational Chart</h3>{content.organizationalStructureDescription ? <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{content.organizationalStructureDescription}</p> : null}{content.organizationalChartImageUrl ? <a href={content.organizationalChartImageUrl} target="_blank" rel="noreferrer" className="mt-5 block overflow-hidden rounded-2xl border border-violet-200 bg-white p-3"><Image src={content.organizationalChartImageUrl} alt={`${billingClaimsLabels[activeSection]} organizational chart`} width={1600} height={900} unoptimized className="mx-auto max-h-[720px] w-full object-contain" /><span className="mt-2 block text-xs text-slate-500">Select the chart to view it at full size.</span></a> : <p className="mt-4 text-sm text-slate-600">The {billingClaimsLabels[activeSection]} organizational chart will appear here once uploaded.</p>}</div>
            </section>
          </div>
        ) : null}
      </section>
    </PublicShell>
  );
}
