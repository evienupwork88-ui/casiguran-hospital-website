"use client";

import { useEffect, useState } from "react";
import { PublicShell } from "@/components/public/site-shell";
import { getPublicEvents, type EventItem } from "@/lib/api/events";

function formatEventDate(dateStr: string | null | undefined): { month: string; day: string } {
  if (!dateStr) return { month: "EVENT", day: "TBD" };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { month: "EVENT", day: "TBD" };
  return {
    month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: String(date.getDate()),
  };
}

function formatEventTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function EventCard({ event }: { event: EventItem }) {
  const badge = formatEventDate(event.startAt);
  const startTime = formatEventTime(event.startAt);
  const endTime = formatEventTime(event.endAt);

  return (
    <article className="border border-slate-200 bg-white p-6 shadow-[0_14px_30px_rgba(37,27,88,0.05)] transition hover:border-violet-300">
      <div className="flex h-16 w-16 flex-col items-center justify-center rounded-[18px] bg-violet-100 text-center text-violet-800">
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em]">{badge.month}</span>
        <span className="text-lg font-semibold">{badge.day}</span>
      </div>
      <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{event.title}</h3>
      {event.location ? <p className="mt-2 text-sm font-medium text-violet-700">{event.location}</p> : null}
      {startTime ? (
        <p className="mt-1 text-sm text-slate-500">
          {startTime}
          {endTime ? ` – ${endTime}` : ""}
        </p>
      ) : null}
      {event.description ? <p className="mt-3 whitespace-pre-line text-base leading-7 text-slate-600">{event.description}</p> : null}
    </article>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await getPublicEvents();
        setEvents(data);
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    }

    loadEvents();
  }, []);

  const now = Date.now();
  const upcomingEvents = events.filter((event) => {
    const reference = event.endAt || event.startAt;
    const time = new Date(reference).getTime();
    return isNaN(time) ? true : time >= now;
  });
  const pastEvents = events.filter((event) => {
    const reference = event.endAt || event.startAt;
    const time = new Date(reference).getTime();
    return !isNaN(time) && time < now;
  });

  return (
    <PublicShell
      title="Events"
      subtitle="Official hospital events and community activities."
    >
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Upcoming events</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-slate-900">Community and institutional activities</h2>
        </div>

        {isLoading ? (
          <div className="border border-slate-200 bg-white p-10 text-slate-600">
            Loading events...
          </div>
        ) : hasError ? (
          <div className="border border-dashed border-violet-200 bg-violet-50/50 p-10 text-center text-slate-600">
            <p className="font-semibold text-slate-900">Events are temporarily unavailable</p>
            <p className="mt-2 text-sm">Please check back again later.</p>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="rounded-[26px] border border-dashed border-violet-200 bg-white p-8 text-center text-slate-600 shadow-[0_18px_40px_rgba(76,29,149,0.04)]">
            <p className="font-semibold text-slate-900">No upcoming events scheduled</p>
            <p className="mt-2 text-sm">Hospital activities and community health schedules will be listed here.</p>
          </div>
        )}

        {!isLoading && !hasError && pastEvents.length > 0 ? (
          <div className="mt-12">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-violet-700">Past events</p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </PublicShell>
  );
}