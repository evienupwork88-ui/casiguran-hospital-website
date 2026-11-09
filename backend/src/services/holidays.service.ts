import { env } from "../config/env";
import { AppError } from "../utils/AppError";

const calendarId = "en.philippines#holiday@group.v.calendar.google.com";
const cacheDurationMs = 6 * 60 * 60 * 1000;

export type PhilippinePublicHoliday = {
  date: string;
  name: string;
};

type GoogleCalendarErrorResponse = {
  error?: {
    message?: unknown;
    status?: unknown;
  };
};

const holidayCache = new Map<number, { items: PhilippinePublicHoliday[]; expiresAt: number }>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function mapGoogleHoliday(value: unknown): PhilippinePublicHoliday | null {
  if (!isRecord(value) || !isRecord(value.start)) return null;
  const date = value.start.date;
  const name = value.summary;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || typeof name !== "string" || !name.trim()) {
    return null;
  }
  return { date, name: name.trim() };
}

export async function listPhilippinePublicHolidays(year: number): Promise<PhilippinePublicHoliday[]> {
  if (!env.googleCalendarApiKey) {
    throw new AppError(503, "Philippine holidays are not configured", "HOLIDAYS_NOT_CONFIGURED");
  }

  const cached = holidayCache.get(year);
  if (cached && cached.expiresAt > Date.now()) return cached.items;

  const params = new URLSearchParams({
    key: env.googleCalendarApiKey,
    timeMin: `${year}-01-01T00:00:00+08:00`,
    timeMax: `${year + 1}-01-01T00:00:00+08:00`,
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "2500",
  });
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    throw new AppError(502, "Google Calendar could not be reached", "HOLIDAYS_UPSTREAM_UNAVAILABLE");
  }

  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorData: unknown = await response.json();
      if (isRecord(errorData) && isRecord(errorData.error)) {
        const message = errorData.error.message;
        const status = errorData.error.status;
        if (typeof message === "string") errorDetail = `: ${message.slice(0, 240)}`;
        if (typeof status === "string") errorDetail += ` (${status})`;
      }
    } catch {
      errorDetail = "";
    }

    throw new AppError(502, `Google Calendar request failed (${response.status})${errorDetail}`, "HOLIDAYS_UPSTREAM_FAILED");
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new AppError(502, "Google Calendar returned an invalid holiday response", "HOLIDAYS_INVALID_RESPONSE");
  }
  if (!isRecord(data) || !Array.isArray(data.items)) {
    throw new AppError(502, "Google Calendar returned an invalid holiday response", "HOLIDAYS_INVALID_RESPONSE");
  }

  const items = data.items.map(mapGoogleHoliday).filter((holiday): holiday is PhilippinePublicHoliday => holiday !== null);
  holidayCache.set(year, { items, expiresAt: Date.now() + cacheDurationMs });
  return items;
}
