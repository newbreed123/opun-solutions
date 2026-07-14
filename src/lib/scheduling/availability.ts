import { supabaseAdminFetch } from "@/lib/supabase-admin";
import { getSchedulingConfig } from "./config";
import { appointmentDisplayParts } from "./display";
import type { AppointmentRecord, AvailabilitySlot } from "./types";

type AvailabilityQuery = {
  date: string;
  timezone?: string;
  now?: Date;
  skipGoogleCalendar?: boolean;
};

type BusyRange = {
  startAt: string;
  endAt: string;
};

export async function getAvailableSlots(query: AvailabilityQuery) {
  const config = getSchedulingConfig();
  const timezone = query.timezone || config.timezone;
  const date = parseDate(query.date);

  if (!date) {
    return { ok: false as const, error: "Invalid date.", slots: [] as AvailabilitySlot[] };
  }

  const localDay = dayOfWeek(query.date, timezone);
  const windows = config.workingWindows.filter((window) => window.day === localDay);

  if (windows.length === 0) {
    return { ok: true as const, slots: [] as AvailabilitySlot[] };
  }

  const dayStart = zonedTimeToUtc(query.date, "00:00", timezone);
  const dayEnd = new Date(dayStart.getTime() + 36 * 60 * 60 * 1000);
  const booked = await bookedRanges(dayStart.toISOString(), dayEnd.toISOString());
  const calendarBusy = query.skipGoogleCalendar
    ? []
    : await googleCalendarBusyRanges(dayStart.toISOString(), dayEnd.toISOString());
  const busyRanges = [...booked, ...calendarBusy];
  const now = query.now || new Date();
  const minStart = new Date(now.getTime() + config.minNoticeHours * 60 * 60 * 1000);
  const maxStart = new Date(now.getTime() + config.maxDaysAhead * 24 * 60 * 60 * 1000);
  const slots: AvailabilitySlot[] = [];

  for (const window of windows) {
    const windowStart = zonedTimeToUtc(query.date, window.start, timezone);
    const windowEnd = zonedTimeToUtc(query.date, window.end, timezone);
    const stepMinutes = config.durationMinutes + config.bufferMinutes;

    for (
      let startMs = windowStart.getTime();
      startMs + config.durationMinutes * 60_000 <= windowEnd.getTime();
      startMs += stepMinutes * 60_000
    ) {
      const start = new Date(startMs);
      const end = new Date(startMs + config.durationMinutes * 60_000);

      if (start < minStart || start > maxStart) continue;
      if (hasConflict(start, end, busyRanges, config.bufferMinutes)) continue;

      slots.push(formatSlot(start, end, timezone));
    }
  }

  return { ok: true as const, slots };
}

export async function isSlotAvailable(startAt: string, timezone: string) {
  const start = new Date(startAt);
  if (!Number.isFinite(start.getTime())) return false;

  const date = localDateKey(start, timezone);
  const result = await getAvailableSlots({ date, timezone });

  return result.slots.some((slot) => slot.startAt === start.toISOString());
}

export function appointmentEnd(startAt: string) {
  const config = getSchedulingConfig();
  const start = new Date(startAt);
  return new Date(start.getTime() + config.durationMinutes * 60_000).toISOString();
}

export function formatAppointmentLabel(
  startAt: string,
  timezone: string,
  endAt?: string,
) {
  return appointmentDisplayParts(startAt, timezone, endAt).summary;
}

function formatSlot(start: Date, end: Date, timezone: string): AvailabilitySlot {
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: timezone,
  }).format(start);
  const timeLabel = timeOnly(start, timezone);

  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
    timezone,
    label: `${dateLabel}, ${timeLabel}`,
    dateLabel,
    timeLabel,
  };
}

function timeOnly(date: Date, timezone: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(date);
}

async function bookedRanges(fromIso: string, toIso: string): Promise<BusyRange[]> {
  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    query: {
      select: "start_at,end_at,status",
      and: `(start_at.lt.${toIso},end_at.gt.${fromIso},status.in.(pending,confirmed))`,
      limit: 500,
    },
  });

  if (!result.ok) return [];

  return result.data.map((row) => ({
    startAt: row.start_at,
    endAt: row.end_at,
  }));
}

async function googleCalendarBusyRanges(
  fromIso: string,
  toIso: string,
): Promise<BusyRange[]> {
  const { getGoogleCalendarBusyRanges } = await import("./calendar");
  const result = await getGoogleCalendarBusyRanges(fromIso, toIso);
  return result.ok ? result.busy : [];
}

function hasConflict(start: Date, end: Date, ranges: BusyRange[], bufferMinutes: number) {
  const bufferMs = bufferMinutes * 60_000;
  return ranges.some((range) => {
    const busyStart = new Date(range.startAt).getTime() - bufferMs;
    const busyEnd = new Date(range.endAt).getTime() + bufferMs;
    return start.getTime() < busyEnd && end.getTime() > busyStart;
  });
}

function parseDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function localDateKey(date: Date, timezone: string) {
  const parts = zonedParts(date, timezone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function dayOfWeek(date: string, timezone: string) {
  const localNoon = zonedTimeToUtc(date, "12:00", timezone);
  return weekdayIndex(localNoon, timezone);
}

function weekdayIndex(date: Date, timezone: string) {
  const label = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: timezone,
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(label);
}

function zonedTimeToUtc(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = new Date(localAsUtc);

  for (let index = 0; index < 2; index += 1) {
    const parts = zonedParts(guess, timezone);
    const zonedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
    );
    guess = new Date(localAsUtc - (zonedAsUtc - guess.getTime()));
  }

  return guess;
}

function zonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    year: Number(byType.year),
    month: Number(byType.month),
    day: Number(byType.day),
    hour: Number(byType.hour),
    minute: Number(byType.minute),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}
