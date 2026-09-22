import type { AdministrativeOfficeHourDay } from "@/lib/api/settings";

const dayLabels: Record<AdministrativeOfficeHourDay["day"], string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

function formatTime(value: string) {
  const [hours, minutes] = value.split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalized = hour % 12 || 12;
  return `${normalized}:${minutes} ${suffix}`;
}

export function formatOfficeHours(
  schedule: AdministrativeOfficeHourDay[] | null | undefined,
  legacyValue: string | null | undefined,
) {
  if (!schedule?.length) {
    return legacyValue || "Official Service / Office Hours - To be provided";
  }

  return schedule
    .map((entry) => {
      const hours = entry.isOpen
        ? entry.startTime && entry.endTime
          ? `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`
          : "Open"
        : "Closed";
      return `${dayLabels[entry.day]}: ${hours}`;
    })
    .join("\n");
}
