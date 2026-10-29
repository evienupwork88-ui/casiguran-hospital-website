"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicTrainings, type TrainingItem } from "@/lib/api/trainings";

export default function TrainingsPage() {
  const [items, setItems] = useState<TrainingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadTrainings() {
      try {
        setItems(await getPublicTrainings());
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }
    void loadTrainings();
  }, []);

  return (
    <PublicShell title="Trainings" subtitle="Training opportunities and information from Casiguran District Hospital.">
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        {isLoading ? (
          <div role="status" aria-busy="true" className="rounded-[26px] border border-violet-200 bg-white p-8 text-slate-600">Loading trainings...</div>
        ) : hasError ? (
          <div role="alert" className="rounded-[26px] border border-red-200 bg-red-50 p-8 text-center text-red-800">
            <p className="font-semibold">Trainings are temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600">
            <p className="font-semibold text-slate-900">No trainings published yet</p>
            <p className="mt-2 text-sm">Training information will appear here once published.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const content = (
                <>
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.imageUrl} alt="" className="aspect-[16/10] w-full object-cover" />
                  ) : (
                    <div aria-hidden="true" className="flex aspect-[16/10] items-center justify-center bg-violet-50 text-sm font-semibold uppercase tracking-[0.18em] text-violet-500">Training</div>
                  )}
                  <div className="p-5">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-900">{item.title}</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.description}</p>
                    {item.externalUrl ? <span className="mt-4 inline-flex text-sm font-semibold text-violet-700">Open training link →</span> : null}
                  </div>
                </>
              );

              return item.externalUrl ? (
                <a key={item.id} href={item.externalUrl} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg">
                  {content}
                </a>
              ) : (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-violet-200 bg-white shadow-sm">
                  {content}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
