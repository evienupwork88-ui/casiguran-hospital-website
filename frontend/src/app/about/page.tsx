"use client";

import Link from "next/link";
import { PublicShell } from "@/components/public/site-shell";

const values = [
  {
    title: "Compassion",
    text: "[Official core value — TO BE PROVIDED]",
  },
  {
    title: "Excellence",
    text: "[Official core value — TO BE PROVIDED]",
  },
  {
    title: "Service",
    text: "[Official core value — TO BE PROVIDED]",
  },
  {
    title: "Integrity",
    text: "[Official core value — TO BE PROVIDED]",
  },
];

export default function AboutPage() {
  return (
    <PublicShell
      title="About Casiguran District Hospital"
      subtitle="[Official hospital profile to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:grid-cols-[1.2fr_0.8fr] md:p-8">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">About the Hospital</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">A trusted community health partner</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              Casiguran District Hospital serves as a local institutional healthcare provider committed to accessible,
              compassionate, and community-oriented medical services. This page is being prepared for the official hospital
              profile and institutional details once they are finalized by the hospital.
            </p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-violet-50/70 p-4">
            <div className="h-full min-h-[220px] rounded-[18px] bg-[linear-gradient(135deg,rgba(124,58,237,0.14),rgba(255,255,255,0.7)),url('/cdh-hero.jpg')] bg-cover bg-center" />
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Hospital Overview</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">[Official hospital overview — TO BE PROVIDED]</p>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Hospital History</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">[Official hospital history — TO BE PROVIDED]</p>
            <Link href="/hospital-history" className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800">
              Read hospital history →
            </Link>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Vision</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">[Official Vision — TO BE PROVIDED]</p>
            <Link href="/vision-mission" className="mt-4 inline-block text-sm font-semibold text-violet-700 hover:text-violet-800">
              View vision and mission →
            </Link>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Mission</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">[Official Mission — TO BE PROVIDED]</p>
          </div>
          <div className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)] md:col-span-2 xl:col-span-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-violet-700">Organizational Chart</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-slate-600">The official hospital organizational chart is available as an uploaded document or image.</p>
              <Link href="/organizational-chart" className="inline-flex items-center text-sm font-semibold text-violet-700 hover:text-violet-800">
                View chart →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-6">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Core Values</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Our guiding principles</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="rounded-[24px] border border-violet-200 bg-violet-50/50 p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                  {value.title.slice(0, 1)}
                </div>
                <h4 className="text-xl font-semibold text-slate-900">{value.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">{value.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
