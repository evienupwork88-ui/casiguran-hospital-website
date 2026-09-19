"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicServices, type ServiceItem } from "@/lib/api/services";

const fallbackServices = [
  {
    title: "Service Name",
    details: "[Official service description to be provided]",
  },
  {
    title: "Service Name",
    details: "[Official service description to be provided]",
  },
  {
    title: "Service Name",
    details: "[Official service description to be provided]",
  },
  {
    title: "Service Name",
    details: "[Official service description to be provided]",
  },
  {
    title: "Service Name",
    details: "[Official service description to be provided]",
  },
  {
    title: "Service Name",
    details: "[Official service description to be provided]",
  },
];

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await getPublicServices();
        setServices(data);
      } catch {
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, []);

  const items = services.length > 0 ? services : fallbackServices.map((service, index) => ({
    id: `${service.title}-${index}`,
    name: service.title,
    description: service.details,
    department: null,
    iconOrImageUrl: null,
    displayOrder: index,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  return (
    <PublicShell
      title="Our Services"
      subtitle="[Official service directory to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-violet-200 bg-white p-5 shadow-[0_18px_40px_rgba(76,29,149,0.04)] md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Service Directory</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Hospital service categories</h2>
          </div>
          <div className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800">
            Placeholder service listing
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600">
            Loading services...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((service) => (
              <article key={service.id} className="rounded-[24px] border border-violet-200 bg-white p-6 shadow-[0_12px_28px_rgba(76,29,149,0.04)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-xl text-violet-700">
                  +
                </div>
                <h2 className="text-xl font-semibold text-slate-900">{service.name}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
