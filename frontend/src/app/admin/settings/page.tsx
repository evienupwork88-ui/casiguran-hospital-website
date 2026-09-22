"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { useNotifications } from "@/components/providers/notification-provider";
import { getAdminSettings, updateSettings, type AdministrativeOfficeHourDay, type SiteSettings } from "@/lib/api/settings";

const weekdayOrder: AdministrativeOfficeHourDay["day"][] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const dayLabels: Record<AdministrativeOfficeHourDay["day"], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const defaultAdministrativeSchedule: AdministrativeOfficeHourDay[] = weekdayOrder.map((day) => ({
  day,
  isOpen: false,
  startTime: "",
  endTime: "",
}));

const emptyForm = {
  address: "",
  phone: "",
  email: "",
  facebookUrl: "",
  officeHours: "",
  administrativeOfficeHours: defaultAdministrativeSchedule,
  emergencyServices24Hours: false,
  mapEmbedUrl: "",
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await getAdminSettings();
        setSettings(data);
        setForm({
          address: data.address ?? "",
          phone: data.phone ?? "",
          email: data.email ?? "",
          facebookUrl: data.facebookUrl ?? "",
          officeHours: data.officeHours ?? "",
          administrativeOfficeHours: data.administrativeOfficeHours?.length ? data.administrativeOfficeHours : defaultAdministrativeSchedule,
          emergencyServices24Hours: Boolean(data.emergencyServices24Hours),
          mapEmbedUrl: data.mapEmbedUrl ?? "",
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load settings.");
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, []);

  function applyWeekdayTemplate() {
    const mondaySchedule = form.administrativeOfficeHours.find((day) => day.day === "monday");

    if (!mondaySchedule) {
      return;
    }

    setForm((current) => ({
      ...current,
      administrativeOfficeHours: current.administrativeOfficeHours.map((day) =>
        weekdayOrder.slice(0, 5).includes(day.day)
          ? {
              ...day,
              isOpen: mondaySchedule.isOpen,
              startTime: mondaySchedule.startTime,
              endTime: mondaySchedule.endTime,
            }
          : day,
      ),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const saved = await updateSettings(form);
      setSettings(saved);
      setForm({
        address: saved.address ?? "",
        phone: saved.phone ?? "",
        email: saved.email ?? "",
        facebookUrl: saved.facebookUrl ?? "",
        officeHours: saved.officeHours ?? "",
        administrativeOfficeHours: saved.administrativeOfficeHours?.length ? saved.administrativeOfficeHours : defaultAdministrativeSchedule,
        emergencyServices24Hours: Boolean(saved.emergencyServices24Hours),
        mapEmbedUrl: saved.mapEmbedUrl ?? "",
      });
      showSuccess("Settings saved successfully.", "Success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save settings.";
      setError(message);
      showError(message, "Unable to save settings");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AdminShell title="Site Settings">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Address
            <input
              value={form.address}
              onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 md:col-span-2">
            Facebook URL
            <input
              value={form.facebookUrl}
              onChange={(event) => setForm((current) => ({ ...current, facebookUrl: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Administrative Office Hours</h3>
              <p className="text-sm text-slate-600">Configure the administrative schedule separately from emergency services.</p>
            </div>
            <button
              type="button"
              onClick={applyWeekdayTemplate}
              className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-100 px-3 py-2 text-sm font-semibold text-violet-800 transition hover:bg-violet-200"
            >
              Apply Monday to Friday
            </button>
          </div>

          <div className="space-y-3">
            {form.administrativeOfficeHours.map((day) => (
              <div key={day.day} className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[140px_120px_150px_150px] md:items-center">
                <div className="text-sm font-medium text-slate-700">{dayLabels[day.day]}</div>

                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={day.isOpen}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        administrativeOfficeHours: current.administrativeOfficeHours.map((entry) =>
                          entry.day === day.day ? { ...entry, isOpen: event.target.checked } : entry,
                        ),
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300 text-violet-700"
                  />
                  Open
                </label>

                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-500">Start</span>
                  <input
                    type="time"
                    value={day.startTime}
                    disabled={!day.isOpen}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        administrativeOfficeHours: current.administrativeOfficeHours.map((entry) =>
                          entry.day === day.day ? { ...entry, startTime: event.target.value } : entry,
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-1 block text-xs uppercase tracking-[0.14em] text-slate-500">End</span>
                  <input
                    type="time"
                    value={day.endTime}
                    disabled={!day.isOpen}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        administrativeOfficeHours: current.administrativeOfficeHours.map((entry) =>
                          entry.day === day.day ? { ...entry, endTime: event.target.value } : entry,
                        ),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-lg font-semibold text-slate-900">Emergency Services</h3>
          <label className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={form.emergencyServices24Hours}
              onChange={(event) => setForm((current) => ({ ...current, emergencyServices24Hours: event.target.checked }))}
              className="h-4 w-4 rounded border-slate-300 text-violet-700"
            />
            Open 24 hours, 7 days a week
          </label>
        </div>

        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Legacy office hours notes
          <input
            value={form.officeHours}
            onChange={(event) => setForm((current) => ({ ...current, officeHours: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
            placeholder="Optional legacy note for compatibility"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 md:col-span-2">
          Map embed URL
          <input
            value={form.mapEmbedUrl}
            onChange={(event) => setForm((current) => ({ ...current, mapEmbedUrl: event.target.value }))}
            className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 text-slate-900 outline-none transition focus:border-violet-500 focus:bg-white"
          />
        </label>

        {error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:bg-violet-400"
          >
            {isSubmitting ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>

      <div className="mt-6">
        <Link href="/admin/content" className="text-sm font-medium text-violet-700 hover:text-violet-800">
          ← Back to content overview
        </Link>
      </div>
    </AdminShell>
  );
}
