import Link from "next/link";
import { PublicShell } from "@/components/public/site-shell";

const timeline = [
  {
    id: "milestone-1",
    year: "[Year]",
    title: "[Official historical milestone — TO BE PROVIDED]",
    text: "[Official hospital history narrative to be provided by CDH]",
  },
  {
    id: "milestone-2",
    year: "[Year]",
    title: "[Official historical milestone — TO BE PROVIDED]",
    text: "[Official hospital history narrative to be provided by CDH]",
  },
  {
    id: "milestone-3",
    year: "[Year]",
    title: "[Official historical milestone — TO BE PROVIDED]",
    text: "[Official hospital history narrative to be provided by CDH]",
  },
];

export default function HospitalHistoryPage() {
  return (
    <PublicShell
      title="Kasaysayan ng Ospital"
      subtitle="[Official hospital history to be provided by CDH]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-8 rounded-[30px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)] md:grid-cols-[1.15fr_0.85fr] md:p-8">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Hospital history</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">Institutional story in progress</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This page is intentionally structured for the official record of Casiguran District Hospital. Once Dra. provides the
              official historical narrative, the timeline and milestones can be replaced without changing the page layout.
            </p>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-violet-200 bg-violet-50/60 p-4">
            <div className="h-full min-h-[220px] rounded-[18px] bg-[linear-gradient(135deg,rgba(124,58,237,0.12),rgba(255,255,255,0.8)),url('/cdh-hero.jpg')] bg-cover bg-center" />
          </div>
        </div>

        <div className="mt-12 space-y-6">
          {timeline.map((item) => (
            <div key={item.id} className="relative rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_16px_30px_rgba(76,29,149,0.04)] md:p-7">
              <div className="absolute left-6 top-7 h-3 w-3 rounded-full bg-violet-600" />
              <div className="ml-8 md:ml-10">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-violet-700">{item.year}</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h3>
                <p className="mt-3 max-w-3xl text-base leading-8 text-slate-600">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-[28px] border border-violet-200 bg-violet-50/60 p-7 text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Closing note</p>
          <p className="mt-3 text-base leading-8 text-slate-700">
            [Official closing statement for the hospital history page — TO BE PROVIDED]
          </p>
          <Link href="/about" className="mt-5 inline-flex rounded-full bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-800">
            Back to About
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
