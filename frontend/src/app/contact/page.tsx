"use client";

import { useEffect, useState } from "react";
import { Clock3, Mail, MapPin, Phone, Send, Siren } from "lucide-react";
import { PublicShell } from "@/components/public/site-shell";
import { submitContactMessage } from "@/lib/api/contact-messages";
import { getPublicSettings, type SiteSettings } from "@/lib/api/settings";
import { FaqCmsAccordion } from "@/components/public/faq-cms-accordion";
import { containsProfanity } from "@/lib/profanity-filter";

const dayLabels = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const contactSubjects = ["Appointment/OPD", "Billing/PhilHealth", "Medical Records", "Job/Application", "Other"] as const;
type ContactSubject = (typeof contactSubjects)[number];
const emptyMessage = { lastName: "", firstName: "", middleName: "", nameExtension: "", contactInfo: "", subject: "" as ContactSubject | "", message: "", website: "" };

function isContactSubject(value: string): value is ContactSubject {
  return contactSubjects.some((subject) => subject === value);
}

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
  const [messageForm, setMessageForm] = useState(emptyMessage);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [respectfulUseAccepted, setRespectfulUseAccepted] = useState(false);

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

  async function handleMessageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = {
      ...messageForm,
      lastName: messageForm.lastName.trim(),
      firstName: messageForm.firstName.trim(),
      middleName: messageForm.middleName.trim(),
      nameExtension: messageForm.nameExtension.trim(),
      contactInfo: messageForm.contactInfo.trim(),
      message: messageForm.message.trim(),
    };
    if (trimmed.lastName.length > 200 || trimmed.firstName.length > 200 || trimmed.middleName.length > 200 || trimmed.nameExtension.length > 200) {
      setSubmitError("Each name field must be 200 characters or less.");
      return;
    }
    if (trimmed.message.length < 20 || trimmed.message.length > 1000) {
      setSubmitError("Message must be between 20 and 1000 characters.");
      return;
    }
    if ([trimmed.lastName, trimmed.firstName, trimmed.middleName, trimmed.nameExtension, trimmed.message].some(containsProfanity)) {
      setSubmitError("Please use respectful language.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed.contactInfo) && !(/^[+\d().\-\s]+$/.test(trimmed.contactInfo) && trimmed.contactInfo.replace(/\D/g, "").length >= 7 && trimmed.contactInfo.replace(/\D/g, "").length <= 15)) {
      setSubmitError("Enter a valid email address or cellphone number.");
      return;
    }
    if (!respectfulUseAccepted) {
      setSubmitError("Please agree to use respectful language and not include sensitive medical information.");
      return;
    }
    if (!isContactSubject(trimmed.subject)) {
      setSubmitError("Choose a message category.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess(false);
    try {
      const message = await submitContactMessage({
        ...trimmed,
        subject: trimmed.subject,
        respectfulUseAccepted: true,
      });
      setMessageForm(emptyMessage);
      setRespectfulUseAccepted(false);
      setSuccessMessage(message);
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

            <form onSubmit={handleMessageSubmit} className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-[0_16px_35px_rgba(76,29,149,0.05)]">
              <div className="border-b border-violet-100 bg-violet-50/80 px-5 py-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Get in touch</p>
                <h2 className="mt-1 text-xl font-semibold text-slate-900">Contact our team</h2>
                <p className="mt-1 text-sm text-slate-600">Send us a message and our team will review it.</p>
              </div>
              <div className="grid gap-x-5 gap-y-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-6">
                <label className="block text-sm font-medium text-slate-700">
                  Last name
                  <input required maxLength={200} autoComplete="family-name" value={messageForm.lastName} onChange={(event) => setMessageForm((current) => ({ ...current, lastName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  First name
                  <input required maxLength={200} autoComplete="given-name" value={messageForm.firstName} onChange={(event) => setMessageForm((current) => ({ ...current, firstName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Middle name <span className="font-normal text-slate-500">(optional)</span>
                  <input maxLength={200} autoComplete="additional-name" value={messageForm.middleName} onChange={(event) => setMessageForm((current) => ({ ...current, middleName: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white" />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Extension <span className="font-normal text-slate-500">(optional)</span>
                  <input maxLength={200} autoComplete="honorific-suffix" placeholder="Jr., III" value={messageForm.nameExtension} onChange={(event) => setMessageForm((current) => ({ ...current, nameExtension: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white" />
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  Email address or cellphone number
                  <input required type="text" maxLength={254} autoComplete="on" placeholder="Email address or cellphone number" value={messageForm.contactInfo} onChange={(event) => setMessageForm((current) => ({ ...current, contactInfo: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white" />
                  <span className="mt-1 block text-xs font-normal text-slate-500">Enter either one so we can contact you.</span>
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
                  Subject
                  <select required value={messageForm.subject} onChange={(event) => setMessageForm((current) => ({ ...current, subject: event.target.value as ContactSubject | "" }))} className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white">
                    <option value="">Choose a category</option>
                    <option>Appointment/OPD</option><option>Billing/PhilHealth</option><option>Medical Records</option><option>Job/Application</option><option>Other</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700 sm:col-span-2 lg:col-span-4">
                  Message
                  <textarea required minLength={20} maxLength={1000} rows={5} value={messageForm.message} onChange={(event) => setMessageForm((current) => ({ ...current, message: event.target.value }))} className="mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white" />
                  <span className="mt-1 block text-xs text-slate-500">{messageForm.message.length}/1000 characters</span>
                </label>
                <label className="sr-only" aria-hidden="true">Website<input tabIndex={-1} autoComplete="off" name="website" value={messageForm.website} onChange={(event) => setMessageForm((current) => ({ ...current, website: event.target.value }))} /></label>
                <label className="flex items-start gap-3 text-sm text-slate-700 sm:col-span-2 lg:col-span-4">
                  <input type="checkbox" required checked={respectfulUseAccepted} onChange={(event) => setRespectfulUseAccepted(event.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300 text-violet-700 focus:ring-violet-500" />
                  <span>I agree to use respectful language and not include sensitive medical information.</span>
                </label>
                {submitError ? <p role="alert" className="sm:col-span-2 lg:col-span-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">{submitError}</p> : null}
                {submitSuccess ? <p role="status" className="sm:col-span-2 lg:col-span-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{successMessage}</p> : null}
                <div className="sm:col-span-2 lg:col-span-4">
                  <button type="submit" disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400">
                    <Send size={16} aria-hidden="true" />
                    {isSubmitting ? "Sending..." : "Send message"}
                  </button>
                  <p className="mt-3 text-xs leading-5 text-slate-500">This form is for general inquiries only. Staff can forward messages but cannot provide medical advice through this page.</p>
                </div>
              </div>
            </form>

            <FaqCmsAccordion />

            <div className="overflow-hidden rounded-xl border border-violet-200 bg-white shadow-[0_16px_35px_rgba(76,29,149,0.05)]">
              <div className="flex items-center gap-2 border-b border-violet-100 bg-violet-50/80 px-5 py-3">
                <Clock3 size={18} className="text-violet-700" />
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-violet-700">Administrative office hours</p>
              </div>
              <div className="grid gap-0 px-5 py-2 sm:grid-cols-2 lg:grid-cols-4">
                {officeHours.length > 0 ? officeHours.map((entry) => (
                  <div key={entry.day} className="border-b border-violet-100 px-2 py-3 last:border-b-0 sm:nth-[n+5]:border-b-0 lg:nth-[n+4]:border-b-0 lg:border-r lg:nth-[4n]:border-r-0">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-violet-700">{dayLabels[entry.day]}</p>
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
