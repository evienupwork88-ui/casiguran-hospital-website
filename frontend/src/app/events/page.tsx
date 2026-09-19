import { PublicShell } from "@/components/public/site-shell";

const events = [
  {
    id: "event-1",
    date: "[Date]",
    title: "[Event Title]",
    location: "[Location]",
    description: "[Official event description to be provided]",
  },
  {
    id: "event-2",
    date: "[Date]",
    title: "[Event Title]",
    location: "[Location]",
    description: "[Official event description to be provided]",
  },
  {
    id: "event-3",
    date: "[Date]",
    title: "[Event Title]",
    location: "[Location]",
    description: "[Official event description to be provided]",
  },
];

export default function EventsPage() {
  return (
    <PublicShell
      title="Events"
      subtitle="[Official hospital events and activities to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Upcoming events</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Community and institutional activities</h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <article key={event.id} className="rounded-[28px] border border-violet-200 bg-white p-6 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-[18px] bg-violet-100 text-center text-violet-800">
                <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">{event.date.split(" ")[0] || "Date"}</span>
                <span className="text-lg font-semibold">{event.date.split(" ")[1] || "TBD"}</span>
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{event.title}</h3>
              <p className="mt-2 text-sm font-medium text-violet-700">{event.location}</p>
              <p className="mt-3 text-base leading-7 text-slate-600">{event.description}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-[28px] border border-violet-200 bg-violet-50/60 p-7">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Past events</p>
          <p className="mt-3 text-base leading-8 text-slate-700">[Official past events archive to be provided]</p>
        </div>
      </section>
    </PublicShell>
  );
}
