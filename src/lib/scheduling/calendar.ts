import { randomUUID } from "crypto";
import { google, calendar_v3 } from "googleapis";
import {
  createGoogleOAuthClient,
  getGoogleOAuthConfig,
  validateGoogleCalendarProductionConfig,
} from "./google-oauth";
import type { AppointmentRecord } from "./types";

type BusyRange = {
  startAt: string;
  endAt: string;
};

type CalendarEventResult =
  | {
      ok: true;
      skipped: false;
      eventId: string;
      meetingUrl: string | null;
      conferenceStatus: ConferenceStatus;
      pending: boolean;
    }
  | {
      ok: true;
      skipped: true;
      eventId: null;
      meetingUrl: null;
      conferenceStatus: "config_incomplete";
      pending: false;
      missing: string[];
    }
  | {
      ok: false;
      skipped: false;
      error: string;
      eventId?: string | null;
      conferenceStatus?: ConferenceStatus;
    };

type ConferenceStatus =
  | "pending"
  | "success"
  | "failure"
  | "unknown"
  | "config_incomplete";

const MEET_FETCH_DELAYS_MS = [500, 1000, 2000, 3000];

export async function getGoogleCalendarBusyRanges(fromIso: string, toIso: string) {
  const oauth = createGoogleOAuthClient({ requireRefreshToken: true });
  const config = getGoogleOAuthConfig();

  if (!oauth.ok) {
    console.error("Opzix scheduling Google OAuth is not configured for free/busy.", {
      missing: oauth.missing,
    });
    return { ok: true as const, skipped: true, busy: [] as BusyRange[] };
  }

  const calendar = google.calendar({
    version: "v3",
    auth: oauth.oauth2Client,
  });

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: fromIso,
        timeMax: toIso,
        timeZone: config.calendarTimezone,
        items: [{ id: config.calendarId }],
      },
    });

    return {
      ok: true as const,
      skipped: false,
      busy:
        response.data.calendars?.[config.calendarId]?.busy?.map((range) => ({
          startAt: range.start || fromIso,
          endAt: range.end || toIso,
        })) ?? [],
    };
  } catch (error) {
    console.error("Opzix scheduling Calendar free/busy failed:", {
      error: sanitizedCalendarError(error),
    });
    return {
      ok: false as const,
      skipped: false,
      busy: [] as BusyRange[],
      error: "Calendar conflict check failed.",
    };
  }
}

export async function createGoogleCalendarEvent(appointment: AppointmentRecord) {
  const oauth = createGoogleOAuthClient({ requireRefreshToken: true });
  const config = getGoogleOAuthConfig();
  const productionMissing = validateGoogleCalendarProductionConfig();

  if (!oauth.ok || productionMissing.length > 0) {
    const missing = uniqueStrings([...(!oauth.ok ? oauth.missing : []), ...productionMissing]);
    schedulingCalendarLog("configuration validated", {
      appointmentId: appointment.id,
      result: "config_incomplete",
      missing: missing.join(","),
    });
    return {
      ok: true as const,
      skipped: true,
      eventId: null,
      meetingUrl: null,
      conferenceStatus: "config_incomplete" as const,
      pending: false as const,
      missing,
    };
  }

  schedulingCalendarLog("configuration validated", {
    appointmentId: appointment.id,
    result: "ok",
  });

  const calendar = google.calendar({
    version: "v3",
    auth: oauth.oauth2Client,
  });

  try {
    schedulingCalendarLog("event insert started", {
      appointmentId: appointment.id,
    });
    const response = await calendar.events.insert({
      calendarId: config.calendarId,
      conferenceDataVersion: 1,
      sendUpdates: "all",
      requestBody: {
        summary: "Opzix Strategy Session",
        description: eventDescription(appointment),
        start: {
          dateTime: appointment.start_at,
          timeZone: appointment.timezone || config.calendarTimezone,
        },
        end: {
          dateTime: appointment.end_at,
          timeZone: appointment.timezone || config.calendarTimezone,
        },
        attendees: [
          {
            email: appointment.email,
            displayName: appointment.name,
          },
        ],
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
        guestsCanInviteOthers: false,
        guestsCanModify: false,
      },
    });
    const eventId = response.data.id || "";
    const initial = inspectCalendarEvent(response.data);

    schedulingCalendarLog("event inserted", {
      appointmentId: appointment.id,
      googleEventId: eventId,
      conferenceStatus: initial.conferenceStatus,
      hasHangoutLink: initial.hasHangoutLink ? "true" : "false",
      hasVideoEntryPoint: initial.hasVideoEntryPoint ? "true" : "false",
    });

    if (!eventId) {
      return {
        ok: false as const,
        skipped: false as const,
        error: "Google Calendar event was created without an event ID.",
        eventId: null,
        conferenceStatus: initial.conferenceStatus,
      };
    }

    const resolved = initial.meetingUrl
      ? initial
      : await fetchMeetUrlWithBackoff(calendar, config.calendarId, eventId, appointment.id, initial);

    if (resolved.meetingUrl) {
      schedulingCalendarLog("meet url extracted", {
        appointmentId: appointment.id,
        googleEventId: eventId,
        conferenceStatus: resolved.conferenceStatus,
        hasHangoutLink: resolved.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: resolved.hasVideoEntryPoint ? "true" : "false",
      });
    }

    if (resolved.conferenceStatus === "failure") {
      schedulingCalendarLog("conference status failure", {
        appointmentId: appointment.id,
        googleEventId: eventId,
        conferenceStatus: resolved.conferenceStatus,
        hasHangoutLink: resolved.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: resolved.hasVideoEntryPoint ? "true" : "false",
      });

      return {
        ok: false as const,
        skipped: false as const,
        error: "Google Calendar reported Meet conference creation failed.",
        eventId,
        conferenceStatus: "failure" as const,
      };
    }

    if (!resolved.meetingUrl) {
      schedulingCalendarLog("conference status pending", {
        appointmentId: appointment.id,
        googleEventId: eventId,
        conferenceStatus: resolved.conferenceStatus,
        hasHangoutLink: resolved.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: resolved.hasVideoEntryPoint ? "true" : "false",
      });
    }

    return {
      ok: true as const,
      skipped: false,
      eventId,
      meetingUrl: resolved.meetingUrl,
      conferenceStatus: resolved.conferenceStatus,
      pending: !resolved.meetingUrl,
    };
  } catch (error) {
    const sanitizedError = sanitizedCalendarError(error);

    console.error("Opzix scheduling Calendar event creation failed:", {
      appointmentId: appointment.id,
      error: sanitizedError,
    });

    return {
      ok: false as const,
      skipped: false,
      error: sanitizedError,
    };
  }
}

export async function fetchGoogleMeetUrlForEvent(
  appointment: AppointmentRecord,
): Promise<
  | {
      ok: true;
      meetingUrl: string | null;
      conferenceStatus: ConferenceStatus;
    }
  | { ok: false; error: string; conferenceStatus?: ConferenceStatus }
> {
  if (!appointment.google_calendar_event_id) {
    return { ok: false, error: "Appointment has no Google Calendar event ID." };
  }

  const oauth = createGoogleOAuthClient({ requireRefreshToken: true });
  const config = getGoogleOAuthConfig();
  const productionMissing = validateGoogleCalendarProductionConfig();

  if (!oauth.ok || productionMissing.length > 0) {
    const missing = uniqueStrings([...(!oauth.ok ? oauth.missing : []), ...productionMissing]);
    schedulingCalendarLog("configuration validated", {
      appointmentId: appointment.id,
      googleEventId: appointment.google_calendar_event_id,
      result: "config_incomplete",
      missing: missing.join(","),
    });
    return {
      ok: false,
      error: `Google Calendar configuration missing or invalid: ${missing.join(", ")}`,
      conferenceStatus: "config_incomplete",
    };
  }

  const calendar = google.calendar({
    version: "v3",
    auth: oauth.oauth2Client,
  });

  try {
    const response = await calendar.events.get(withConferenceDataVersion({
      calendarId: config.calendarId,
      eventId: appointment.google_calendar_event_id,
    }));
    const inspected = inspectCalendarEvent(response.data);

    if (inspected.meetingUrl) {
      schedulingCalendarLog("meet url extracted", {
        appointmentId: appointment.id,
        googleEventId: appointment.google_calendar_event_id,
        conferenceStatus: inspected.conferenceStatus,
        hasHangoutLink: inspected.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: inspected.hasVideoEntryPoint ? "true" : "false",
      });
    } else if (inspected.conferenceStatus === "failure") {
      schedulingCalendarLog("conference status failure", {
        appointmentId: appointment.id,
        googleEventId: appointment.google_calendar_event_id,
        conferenceStatus: inspected.conferenceStatus,
        hasHangoutLink: inspected.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: inspected.hasVideoEntryPoint ? "true" : "false",
      });
    } else {
      schedulingCalendarLog("conference status pending", {
        appointmentId: appointment.id,
        googleEventId: appointment.google_calendar_event_id,
        conferenceStatus: inspected.conferenceStatus,
        hasHangoutLink: inspected.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: inspected.hasVideoEntryPoint ? "true" : "false",
      });
    }

    return {
      ok: true,
      meetingUrl: inspected.meetingUrl,
      conferenceStatus: inspected.conferenceStatus,
    };
  } catch (error) {
    schedulingCalendarLog("event fetch failed", {
      appointmentId: appointment.id,
      googleEventId: appointment.google_calendar_event_id,
      result: statusCategory(error),
    });
    return { ok: false, error: sanitizedCalendarError(error) };
  }
}

export function extractGoogleMeetUrl(event: calendar_v3.Schema$Event) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video" && entry.uri,
    )?.uri ||
    null
  );
}

async function fetchMeetUrlWithBackoff(
  calendar: calendar_v3.Calendar,
  calendarId: string,
  eventId: string,
  appointmentId: string,
  initial: ReturnType<typeof inspectCalendarEvent>,
) {
  let latest = initial;

  if (latest.conferenceStatus === "failure") return latest;

  for (const delayMs of MEET_FETCH_DELAYS_MS) {
    if (latest.meetingUrl || latest.conferenceStatus === "failure") break;

    if (latest.conferenceStatus === "pending" || !latest.meetingUrl) {
      schedulingCalendarLog("conference status pending", {
        appointmentId,
        googleEventId: eventId,
        conferenceStatus: latest.conferenceStatus,
        hasHangoutLink: latest.hasHangoutLink ? "true" : "false",
        hasVideoEntryPoint: latest.hasVideoEntryPoint ? "true" : "false",
      });
    }

    await sleep(delayMs);

    try {
      const response = await calendar.events.get(withConferenceDataVersion({
        calendarId,
        eventId,
      }));
      latest = inspectCalendarEvent(response.data);

      if (latest.meetingUrl) {
        schedulingCalendarLog("conference status success", {
          appointmentId,
          googleEventId: eventId,
          conferenceStatus: latest.conferenceStatus,
          hasHangoutLink: latest.hasHangoutLink ? "true" : "false",
          hasVideoEntryPoint: latest.hasVideoEntryPoint ? "true" : "false",
        });
      }
    } catch (error) {
      schedulingCalendarLog("event fetch failed", {
        appointmentId,
        googleEventId: eventId,
        result: statusCategory(error),
      });
    }
  }

  return latest;
}

function inspectCalendarEvent(event: calendar_v3.Schema$Event) {
  const meetingUrl = extractGoogleMeetUrl(event);
  const conferenceStatus =
    (event.conferenceData?.createRequest?.status?.statusCode as ConferenceStatus | undefined) ||
    (meetingUrl ? "success" : "unknown");

  return {
    meetingUrl,
    conferenceStatus,
    hasHangoutLink: Boolean(event.hangoutLink),
    hasVideoEntryPoint: Boolean(
      event.conferenceData?.entryPoints?.some(
        (entry) => entry.entryPointType === "video" && entry.uri,
      ),
    ),
  };
}

function schedulingCalendarLog(
  event:
    | "configuration validated"
    | "event insert started"
    | "event inserted"
    | "conference status pending"
    | "conference status success"
    | "conference status failure"
    | "meet url extracted"
    | "event fetch failed",
  payload: Record<string, string | undefined>,
) {
  console.info(`[scheduling-calendar] ${event}`, payload);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withConferenceDataVersion(
  params: calendar_v3.Params$Resource$Events$Get,
) {
  return {
    ...params,
    conferenceDataVersion: 1,
  } as calendar_v3.Params$Resource$Events$Get;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function eventDescription(appointment: AppointmentRecord) {
  const rows = [
    ["Purpose", "Opzix strategy session"],
    ["Appointment ID", appointment.id],
    ["Client name", appointment.name],
    ["Client email", appointment.email],
    ["Client phone", appointment.phone],
    ["Business", appointment.business_name],
    ["Website", appointment.website_domain],
    ["Business type", appointment.business_type],
    ["Challenge", appointment.challenge],
    ["Service requested", appointment.service_requested],
    ["Industry", appointment.industry],
    ["Source", appointment.source],
    ["Scan ID", appointment.scan_id],
    ["Message", appointment.message],
  ].filter(([, value]) => value);

  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function sanitizedCalendarError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message.replace(/ya29\.[A-Za-z0-9_.-]+/g, "[redacted-token]").slice(0, 500);
  }

  return "Google Calendar request failed.";
}

function statusCategory(error: unknown) {
  const maybeStatus = error as { code?: unknown; status?: unknown; response?: { status?: unknown } };
  const status = maybeStatus.code || maybeStatus.status || maybeStatus.response?.status;

  if (typeof status === "number") {
    if (status >= 500) return "5xx";
    if (status >= 400) return "4xx";
    return "non_error";
  }

  return "unknown";
}
