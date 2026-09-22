"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicServices, type ServiceItem } from "@/lib/api/services";

export default function ServicesPage() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const data = await getPublicServices();
        setServices(data);
      } catch {
        setHasError(true);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadServices();
  }, []);

  return (
    <PublicShell
      title="Our Services"
      subtitle="[Official service directory to be provided]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Service Directory</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-slate-900">Hospital service categories</h2>
          </div>
          <div className="border-l-2 border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800">
            Published CMS services
          </div>
        </div>

        {isLoading ? (
          <div className="border border-slate-200 bg-white p-10 text-slate-600">
            Loading services...
          </div>
        ) : hasError ? (
          <div className="border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
            <p className="font-semibold text-slate-900">Services are temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : services.length === 0 ? (
          <div className="border border-dashed border-slate-200 bg-white p-10 text-center text-slate-600">
            <p className="font-semibold text-slate-900">No services have been published yet</p>
            <p className="mt-2 text-sm">The official service directory will appear here once published.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {services.map((service) => (
              <article key={service.id} className="border border-slate-200 bg-white p-6 shadow-[0_12px_28px_rgba(37,27,88,0.05)] transition hover:border-violet-300">
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-xl text-violet-700">
                  {service.iconOrImageUrl ? (
                    <img src={service.iconOrImageUrl} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    "+"
                  )}
                </div>
                <h3 className="text-xl font-semibold text-slate-900">{service.name}</h3>
                {service.department ? <p className="mt-2 text-sm font-medium text-violet-700">{service.department}</p> : null}
                <p className="mt-3 text-base leading-7 text-slate-600">{service.description}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
