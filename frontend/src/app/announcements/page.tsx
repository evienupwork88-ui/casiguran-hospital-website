import Link from "next/link";
import { PublicShell } from "@/components/public/site-shell";

const announcements = [
  {
    id: "announcement-1",
    title: "[Official announcement title]",
    date: "[Date to be provided]",
    summary: "[Official announcement summary to be provided]",
  },
  {
    id: "announcement-2",
    title: "[Official announcement title]",
    date: "[Date to be provided]",
    summary: "[Official announcement summary to be provided]",
  },
  {
    id: "announcement-3",
    title: "[Official announcement title]",
    date: "[Date to be provided]",
    summary: "[Official announcement summary to be provided]",
  },
];

export default function AnnouncementsPage() {
  return (
    <PublicShell
      title="Announcements"
      subtitle="[Official hospital announcements to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Latest update</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">[Featured announcement title]</h2>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">[Official featured announcement summary to be provided]</p>
        </div>

        <div className="space-y-5">
          {announcements.map((item) => (
            <article key={item.id} className="rounded-[26px] border border-violet-200 bg-white p-6 shadow-[0_16px_30px_rgba(76,29,149,0.04)]">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">{item.date}</p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{item.title}</h3>
                </div>
                <Link href="/announcements" className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 hover:bg-violet-100">
                  View details
                </Link>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-600">{item.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
