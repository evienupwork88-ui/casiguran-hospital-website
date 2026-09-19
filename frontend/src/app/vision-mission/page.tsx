import { PublicShell } from "@/components/public/site-shell";

const values = [
  "[Official Core Value — TO BE PROVIDED]",
  "[Official Core Value — TO BE PROVIDED]",
  "[Official Core Value — TO BE PROVIDED]",
  "[Official Core Value — TO BE PROVIDED]",
];

export default function VisionMissionPage() {
  return (
    <PublicShell
      title="Vision, Mission & Core Values"
      subtitle="[Official institutional statements to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Vision</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">[Official Vision — TO BE PROVIDED]</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This section is reserved for the approved vision statement of Casiguran District Hospital.
            </p>
          </div>

          <div className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Mission</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">[Official Mission — TO BE PROVIDED]</h2>
            <p className="mt-4 text-base leading-8 text-slate-600">
              This section is reserved for the approved mission statement of Casiguran District Hospital.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)]">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Core Values</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Guiding principles of service</h3>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {values.map((item, index) => (
              <div key={item + index} className="rounded-[22px] border border-violet-200 bg-violet-50/50 p-5">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
                  {index + 1}
                </div>
                <p className="text-base font-semibold text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
