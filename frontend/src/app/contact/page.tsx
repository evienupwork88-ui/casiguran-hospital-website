"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getPublicSettings();
        setSettings(data);
      } catch {
        setSettings(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  const contactInfo = [
    { label: "Address", value: settings?.address || "[Official Address — TO BE PROVIDED]" },
    { label: "Telephone", value: settings?.phone || "[Official Telephone — TO BE PROVIDED]" },
    { label: "Email", value: settings?.email || "[Official Email — TO BE PROVIDED]" },
    { label: "Office Hours", value: settings?.officeHours || "[Official Office Hours — TO BE PROVIDED]" },
  ];

  return (
    <PublicShell
      title="Contact Us"
      subtitle="[Official contact information to be provided by the hospital]"
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {isLoading ? (
          <div className="rounded-[26px] border border-violet-200 bg-white p-8 text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            Loading contact details...
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Reach the hospital</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900 sm:text-4xl">Official public information</h2>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
                Please refer to the official hospital contact information once it is released. This section is intentionally kept
                as a placeholder until Dra. provides the approved details.
              </p>

              <div className="mt-8 space-y-4">
                {contactInfo.map((info) => (
                  <div key={info.label} className="rounded-[18px] border border-violet-100 bg-violet-50/40 p-4">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-violet-700">{info.label}</p>
                    <p className="mt-2 text-base font-medium text-slate-900">{info.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-violet-200 bg-white p-7 shadow-[0_18px_40px_rgba(76,29,149,0.05)] sm:p-8">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Location</p>
              <div className="mt-4 h-[260px] overflow-hidden rounded-[22px] border border-violet-200 bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)] p-4">
                <div className="flex h-full items-center justify-center rounded-[18px] border border-dashed border-violet-300 bg-white/60 text-center text-sm font-medium text-violet-800">
                  Map / location placeholder<br />
                  [Official location map — TO BE PROVIDED]
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
