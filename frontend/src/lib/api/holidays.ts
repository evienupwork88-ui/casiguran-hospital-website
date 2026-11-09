export type PhilippinePublicHoliday = {
  date: string;
  name: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getPhilippinePublicHolidays(year: number, signal?: AbortSignal): Promise<PhilippinePublicHoliday[]> {
  const response = await fetch(`${API_BASE_URL}/api/public/holidays?year=${year}`, {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to load Philippine public holidays (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !("items" in data) || !Array.isArray(data.items)) {
    throw new Error("Holiday API returned an invalid response");
  }

  return data.items.flatMap((item): PhilippinePublicHoliday[] => {
    if (typeof item !== "object" || item === null || !("date" in item) || !("name" in item)) return [];
    if (typeof item.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) || typeof item.name !== "string") return [];
    return [{ date: item.date, name: item.name }];
  });
}
