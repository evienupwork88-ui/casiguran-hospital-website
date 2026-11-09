"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import type { EventItem } from "@/lib/api/events";
import { getPhilippinePublicHolidays, type PhilippinePublicHoliday } from "@/lib/api/holidays";

const timeZone = "Asia/Manila";
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const weekdaysCompact = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type CalendarItem = Pick<EventItem, "id" | "title" | "description" | "location" | "startAt" | "endAt" | "excerpt" | "externalUrl"> & {
  isHoliday?: boolean;
};

function getDateParts(value: string): { year: number; month: number; day: number } | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-PH", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatFullDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en-PH", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}

export function HomeEventsCalendar({
  events,
  isLoading,
  hasError,
  onRetry,
}: {
  events: EventItem[];
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = getDateParts(new Date().toISOString());
    const year = today?.year ?? new Date().getFullYear();
    const month = today?.month ?? new Date().getMonth() + 1;
    return new Date(year, month - 1, 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = getDateParts(new Date().toISOString());
    return today ? dateKey(today.year, today.month, today.day) : dateKey(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
  });
  const [publicHolidays, setPublicHolidays] = useState<PhilippinePublicHoliday[]>([]);
  const [holidaysError, setHolidaysError] = useState(false);
  const [holidayRetry, setHolidayRetry] = useState(0);

  const monthLabel = new Intl.DateTimeFormat("en-PH", {
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(Date.UTC(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1, 12)));

  const days = useMemo(() => {
    const firstWeekday = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1).getDay();
    return Array.from({ length: 42 }, (_, index) =>
      new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - firstWeekday + 1),
    );
  }, [visibleMonth]);

  const calendarYearKey = useMemo(
    () => [...new Set(days.map((day) => day.getFullYear()))].join(","),
    [days],
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    const calendarYears = calendarYearKey.split(",").map(Number);

    setHolidaysError(false);
    void Promise.allSettled(calendarYears.map((year) => getPhilippinePublicHolidays(year, controller.signal)))
      .then((results) => {
        if (cancelled) return;
        const successfulResults = results.filter((result) => result.status === "fulfilled");
        setPublicHolidays(successfulResults.flatMap((result) => result.value));
        setHolidaysError(successfulResults.length !== results.length);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [calendarYearKey, holidayRetry]);

  const calendarItems = useMemo<CalendarItem[]>(() => [
    ...events,
    ...publicHolidays.map((holiday) => ({
      id: `ph-holiday-${holiday.date}-${holiday.name}`,
      title: holiday.name,
      description: "Philippine public holiday listed in Google Calendar.",
      location: null,
      startAt: `${holiday.date}T00:00:00+08:00`,
      endAt: null,
      excerpt: null,
      externalUrl: null,
      isHoliday: true,
    })),
  ], [events, publicHolidays]);

  const eventsByDate = useMemo(() => {
    const byDate = new Map<string, CalendarItem[]>();
    for (const day of days) {
      const key = dateKey(day.getFullYear(), day.getMonth() + 1, day.getDate());
      const dayEvents = calendarItems.filter((event) => {
        const start = getDateParts(event.startAt);
        const end = getDateParts(event.endAt || event.startAt);
        if (!start || !end) return false;
        const startKey = dateKey(start.year, start.month, start.day);
        const endKey = dateKey(end.year, end.month, end.day);
        return key >= startKey && key <= endKey;
      });
      if (dayEvents.length) byDate.set(key, dayEvents);
    }
    return byDate;
  }, [days, calendarItems]);

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  function moveMonth(amount: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + amount, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(dateKey(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 1));
  }

  function showToday() {
    const today = getDateParts(new Date().toISOString());
    if (!today) return;
    setVisibleMonth(new Date(today.year, today.month - 1, 1));
    setSelectedDate(dateKey(today.year, today.month, today.day));
  }

  if (isLoading) {
    return (
      <div role="status" aria-busy="true" className="rounded-[26px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-600 shadow-sm">
        Loading events calendar...
      </div>
    );
  }

  if (hasError) {
    return (
      <div role="alert" className="rounded-[26px] border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="font-semibold text-amber-950">The events calendar is temporarily unavailable.</p>
        <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-800">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[26px] border border-violet-100 bg-white shadow-[0_18px_48px_rgba(46,16,101,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <CalendarDays size={21} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{monthLabel}</h3>
            <p className="text-xs text-slate-500">Hospital events and PH public holidays · Philippines time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={showToday} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:bg-violet-50">
            Today
          </button>
          <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:border-violet-300 hover:bg-violet-50">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {holidaysError ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:px-6">
          <span>Some public holidays could not be loaded from Google Calendar.</span>
          <button type="button" onClick={() => setHolidayRetry((attempt) => attempt + 1)} className="font-semibold underline underline-offset-2">Retry holidays</button>
        </div>
      ) : null}

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
        {weekdays.map((weekday, index) => (
          <div key={weekday} className="py-2 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500 sm:py-3 sm:text-xs">
            <span className="sm:hidden">{weekdaysCompact[index]}</span>
            <span className="hidden sm:inline">{weekday}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day.getFullYear(), day.getMonth() + 1, day.getDate());
          const dayEvents = eventsByDate.get(key) ?? [];
          const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
          const isSelected = selectedDate === key;
          return (
            <div
              key={key}
              className={`min-h-[82px] border-b border-r border-slate-100 p-1.5 last:border-r-0 sm:min-h-[112px] sm:p-2 ${isCurrentMonth ? "bg-white" : "bg-slate-50/70"}`}
            >
              <button
                type="button"
                onClick={() => setSelectedDate(key)}
                aria-label={`${formatFullDate(key)}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}` : ""}`}
                aria-pressed={isSelected}
                className={`flex h-7 min-w-7 items-center justify-center rounded-full px-1 text-xs font-medium transition sm:h-8 sm:min-w-8 sm:text-sm ${isSelected ? "bg-violet-700 text-white shadow-sm" : isCurrentMonth ? "text-slate-700 hover:bg-violet-50" : "text-slate-400 hover:bg-white"}`}
              >
                {day.getDate()}
              </button>
              <div className="mt-1 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    title={event.title}
                    className={`block w-full truncate rounded-md border-l-2 px-1.5 py-1 text-left text-[0.6rem] font-medium leading-tight sm:text-xs ${event.isHoliday ? "border-amber-500 bg-amber-50 text-amber-900 hover:bg-amber-100" : "border-violet-500 bg-violet-50 text-violet-900 hover:bg-violet-100"}`}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 2 ? (
                  <button type="button" onClick={() => setSelectedDate(key)} className="px-1 text-[0.6rem] font-semibold text-violet-700 sm:text-xs">
                    +{dayEvents.length - 2} more
                  </button>
                ) : null}
                {dayEvents.length > 0 ? (
                  <span className="flex justify-center gap-1 sm:hidden" aria-hidden="true">
                    {dayEvents.slice(0, 3).map((event) => <span key={event.id} className={`h-1 w-1 rounded-full ${event.isHoliday ? "bg-amber-500" : "bg-violet-500"}`} />)}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-violet-50/50 px-4 py-5 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">{formatFullDate(selectedDate)}</p>
        {selectedEvents.length ? (
          <ul className="mt-3 space-y-3">
            {selectedEvents.map((event) => {
              const startTime = formatTime(event.startAt);
              const endTime = formatTime(event.endAt);
              return (
                <li key={event.id} className="rounded-xl border border-violet-100 bg-white p-4 shadow-sm">
                  <h4 className="font-semibold text-slate-900">{event.title}</h4>
                  {event.isHoliday ? <p className="mt-1 text-xs font-medium text-amber-700">Philippine public holiday · Google Calendar</p> : null}
                  {event.excerpt || event.description ? (
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-600">{event.excerpt || event.description}</p>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                    {startTime ? (
                      <span className="inline-flex items-center gap-1.5"><Clock3 size={14} className="text-violet-600" />{startTime}{endTime ? ` – ${endTime}` : ""}</span>
                    ) : null}
                    {event.location ? (
                      <span className="inline-flex items-center gap-1.5"><MapPin size={14} className="text-violet-600" />{event.location}</span>
                    ) : null}
                  </div>
                  {event.externalUrl ? (
                    <a href={event.externalUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-900">
                      Event details ↗
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">No activities scheduled for this day.</p>
        )}
      </div>
    </div>
  );
}
