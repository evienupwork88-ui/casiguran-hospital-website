"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicPage, type PageItem } from "@/lib/api/pages";

export default function AboutPage() {
  const [aboutPage, setAboutPage] = useState<PageItem | null>(null);
  const [coreValuesPage, setCoreValuesPage] = useState<PageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAboutData() {
      try {
        const [aboutData, cvData] = await Promise.all([
          getPublicPage("about").catch(() => null),
          getPublicPage("core-values").catch(() => null),
        ]);
        setAboutPage(aboutData);
        setCoreValuesPage(cvData);
      } catch {
        setAboutPage(null);
        setCoreValuesPage(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadAboutData();
  }, []);

  const coreValues = coreValuesPage?.body
    ? coreValuesPage.body.split(/\n+/).map((v) => v.trim()).filter(Boolean)
    : [];

  const aboutParagraphs = aboutPage?.body
    ? aboutPage.body.split(/\n+/).map((p) => p.trim()).filter(Boolean)
    : [];

  return (
    <PublicShell
      title={aboutPage?.title || "About Casiguran District Hospital"}
      subtitle="Official hospital profile and institutional information."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">About the Hospital</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">
              {aboutPage?.title || "A trusted community health partner"}
            </h2>
            {isLoading ? (
              <p className="mt-4 text-base leading-8 text-slate-500">Loading hospital profile...</p>
            ) : aboutParagraphs.length > 0 ? (
              <div className="mt-4 space-y-4">
                {aboutParagraphs.map((paragraph, index) => (
                  <p key={index} className="text-base leading-8 text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-base leading-8 text-slate-600">
                Official hospital profile and institutional details will appear here once published.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-violet-50/70 p-4">
            <div className="h-full min-h-[220px] rounded-[18px] bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(255,255,255,0.7)),url('/cdh-hero.jpg')] bg-cover bg-center" />
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Hospital History</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">Explore the institutional story and milestones of the hospital.</p>
            <Link href="/hospital-history" className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800">
              Read hospital history →
            </Link>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Vision & Mission</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">View our institutional mandate, vision, and mission statements.</p>
            <Link href="/vision-mission" className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800">
              View vision and mission →
            </Link>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Organizational Chart</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">View the official leadership and organizational structure.</p>
            <Link href="/organizational-chart" className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800">
              View chart →
            </Link>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Core Values</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">
              {coreValuesPage?.title || "Our guiding principles"}
            </h3>
          </div>

          {isLoading ? (
            <div className="rounded-[24px] border border-violet-200 bg-white p-6 text-slate-500">
              Loading core values...
            </div>
          ) : coreValues.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {coreValues.map((value, index) => (
                <div key={index} className="rounded-[24px] border border-violet-200 bg-violet-50/50 p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                    {index + 1}
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900">{value}</h4>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center text-sm font-medium text-slate-600">
              Official core values will appear here once published.
            </div>
          )}
        </div>
      </section>
    </PublicShell>
  );
}
