"use client";

import { useEffect, useState } from "react";
import { Clock3, Mail, MapPin, Phone, Siren } from "lucide-react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";

const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const dayLabels: Record<(typeof dayOrder)[number], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatTime(value: string) {
  if (!value) {
    return "";
  }

  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minutes} ${suffix}`;
}

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

  const officeHours = settings?.administrativeOfficeHours ?? [];
  const emergencyLabel = settings?.emergencyServices24Hours ? "Open 24 hours, 7 days a week" : "Emergency services schedule not configured";

  const contactInfo = [
    { label: "Address", value: settings?.address || "Official address - to be provided", icon: MapPin },
    { label: "Telephone", value: settings?.phone || "Official telephone - to be provided", icon: Phone },
    { label: "Email", value: settings?.email || "Official email - to be provided", icon: Mail },
  ];

  return (
    <PublicShell
      title="Contact Us"
      subtitle="Get in touch with Casiguran District Hospital. We are here to assist you."
    >
      <section className="relative overflow-hidden bg-[linear-gradient(135deg,#fbfbff_0%,#f5f7fc_58%,#f1edff_100%)] px-5 py-8 sm:px-8 md:py-10">
        <div className="pointer-events-none absolute -right-20 top-0 h-48 w-72 rounded-full bg-violet-100/60 blur-3xl" />
        {isLoading ? (
          <div role="status" aria-busy="true" className="mx-auto max-w-6xl rounded-2xl border border-violet-200 bg-white p-8 text-slate-600 shadow-sm">
            Loading contact details...
          </div>
        ) : (
          <div className="relative mx-auto max-w-6xl space-y-4">
            <div className="grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
              <div className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-[0_16px_35px_rgba(76,29,149,0.06)]">
                <div className="border-b border-violet-100 bg-violet-50/80 px-5 py-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Contact information</p>
                </div>
                <div className="px-5 sm:px-6">
                {contactInfo.map((info) => (
                  <div key={info.label} className="flex items-center gap-4 border-b border-violet-100 py-4 last:border-b-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                      <info.icon size={19} strokeWidth={2.4} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-violet-700">{info.label}</p>
                      <p className="mt-1 break-words text-sm font-medium leading-5 text-slate-800">{info.value}</p>
                    </div>
                  </div>
                ))}
                {settings?.facebookUrl ? (
                  <a href={settings.facebookUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 border-t border-violet-100 py-4 text-violet-800 transition hover:text-violet-950">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-700 text-lg font-bold text-white">f</span>
                    <span><span className="block text-[0.62rem] font-bold uppercase tracking-[0.2em] text-violet-700">Facebook page</span><span className="mt-1 block text-sm font-medium">Official Facebook Page -&gt;</span></span>
                  </a>
                ) : null}
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-violet-200 bg-white p-3 shadow-[0_16px_35px_rgba(76,29,149,0.06)] sm:p-4">
                <div className="border-b border-violet-100 bg-violet-50/80 px-3 py-3">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Find us</p>
                </div>
                <div className="mt-1 h-[218px] overflow-hidden rounded-b-xl border border-violet-100 bg-[linear-gradient(135deg,#f3e8ff,#e2e8f0)] sm:h-[250px]">
                {settings?.mapEmbedUrl ? (
                  <iframe
                    src={settings.mapEmbedUrl}
                    className="h-full w-full border-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Hospital location map"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-4">
                    <div className="flex h-full w-full items-center justify-center rounded-[18px] border border-dashed border-violet-300 bg-white/60 text-center text-sm font-medium text-violet-800">
                      Map / location placeholder<br />
                      [Official location map — TO BE PROVIDED]
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-[0_16px_35px_rgba(76,29,149,0.05)]">
              <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/80 px-5 py-3">
                <Clock3 size={18} className="text-violet-700" />
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Administrative office hours</p>
              </div>
              <div className="grid gap-0 px-5 py-2 sm:grid-cols-2 lg:grid-cols-4">
                {officeHours.length > 0 ? officeHours.map((entry) => (
                  <div key={entry.day} className="border-b border-violet-100 px-2 py-3 last:border-b-0 sm:nth-[n+5]:border-b-0 lg:nth-[n+4]:border-b-0 lg:border-r lg:nth-[4n]:border-r-0">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-violet-700">{dayLabels[entry.day as (typeof dayOrder)[number]]}</p>
                    <p className="mt-1 text-xs font-medium text-slate-700">{entry.isOpen ? entry.startTime && entry.endTime ? `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}` : "Open" : "Closed"}</p>
                  </div>
                )) : <p className="px-2 py-4 text-sm text-slate-600">Administrative office hours not configured yet.</p>}
              </div>
            </div>

            <div className="flex items-center gap-4 overflow-hidden rounded-xl border border-violet-200 bg-violet-50/80 px-5 py-4 shadow-[0_16px_35px_rgba(76,29,149,0.04)]">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700"><Siren size={23} /></span>
              <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Emergency services</p><p className="mt-1 text-sm font-medium text-slate-800">{emergencyLabel}</p></div>
            </div>
          </div>
        )}
      </section>
    </PublicShell>
  );
}
