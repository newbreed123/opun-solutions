export type WorkingWindow = {
  day: number;
  start: string;
  end: string;
};

export type SchedulingConfig = {
  bookingEnabled: boolean;
  nativeBookingPath: string;
  calendlyFallbackUrl: string;
  timezone: string;
  durationMinutes: number;
  bufferMinutes: number;
  minNoticeHours: number;
  maxDaysAhead: number;
  workingWindows: WorkingWindow[];
  meetingLocation: string;
  googleCalendarId?: string;
  googleMeetEnabled: boolean;
};

const DEFAULT_WORKING_WINDOWS: WorkingWindow[] = [1, 2, 3, 4, 5].map((day) => ({
  day,
  start: "09:00",
  end: "17:00",
}));

export function getSchedulingConfig(): SchedulingConfig {
  return {
    bookingEnabled: envBool("NEXT_PUBLIC_OPZIX_BOOKING_ENABLED", true),
    nativeBookingPath:
      process.env.NEXT_PUBLIC_STRATEGY_CALL_URL?.trim() || "/book/strategy-session",
    calendlyFallbackUrl:
      process.env.NEXT_PUBLIC_CALENDLY_FALLBACK_URL?.trim() ||
      "https://calendly.com/hello-opzix",
    timezone: process.env.OPZIX_BOOKING_TIMEZONE?.trim() || "America/New_York",
    durationMinutes: envInt("OPZIX_STRATEGY_SESSION_DURATION_MINUTES", 30),
    bufferMinutes: envInt("OPZIX_BOOKING_BUFFER_MINUTES", 15),
    minNoticeHours: envInt("OPZIX_BOOKING_MIN_NOTICE_HOURS", 12),
    maxDaysAhead: envInt("OPZIX_BOOKING_MAX_DAYS_AHEAD", 30),
    workingWindows: parseWorkingWindows() || DEFAULT_WORKING_WINDOWS,
    meetingLocation:
      process.env.OPZIX_MEETING_LOCATION?.trim() ||
      "Google Calendar invite details will include the meeting location.",
    googleCalendarId: process.env.GOOGLE_CALENDAR_ID?.trim(),
    googleMeetEnabled: envBool("GOOGLE_CALENDAR_CREATE_MEET_LINK", true),
  };
}

export function getPublicStrategyCallUrl() {
  const config = getSchedulingConfig();
  return config.bookingEnabled ? config.nativeBookingPath : config.calendlyFallbackUrl;
}

function envBool(name: string, fallback: boolean) {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function envInt(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function parseWorkingWindows() {
  const raw = process.env.OPZIX_BOOKING_WORKING_WINDOWS?.trim();

  if (!raw) return null;

  const windows = raw
    .split(",")
    .map((part) => {
      const [day, range] = part.split(":");
      const [start, end] = (range || "").split("-");
      const parsedDay = Number(day);

      if (
        !Number.isInteger(parsedDay) ||
        parsedDay < 0 ||
        parsedDay > 6 ||
        !isTime(start) ||
        !isTime(end)
      ) {
        return null;
      }

      return { day: parsedDay, start, end };
    })
    .filter((value): value is WorkingWindow => Boolean(value));

  return windows.length > 0 ? windows : null;
}

function isTime(value: unknown) {
  return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
}

