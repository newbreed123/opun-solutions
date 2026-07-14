import { randomUUID } from "crypto";
import { google, calendar_v3 } from "googleapis";
import { createGoogleOAuthClient, getGoogleOAuthConfig } from "./google-oauth";
import type { AppointmentRecord } from "./types";

type BusyRange = {
  startAt: string;
  endAt: string;
};

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

  if (!oauth.ok) {
    console.error("Opzix scheduling Google OAuth is not configured.", {
      missing: oauth.missing,
    });
    return {
      ok: true as const,
      skipped: true,
      eventId: null,
      meetingUrl: null,
    };
  }

  const calendar = google.calendar({
    version: "v3",
    auth: oauth.oauth2Client,
  });

  try {
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
    const meetingUrl = extractGoogleMeetUrl(response.data);

    return {
      ok: true as const,
      skipped: false,
      eventId: response.data.id || null,
      meetingUrl,
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

export function extractGoogleMeetUrl(event: calendar_v3.Schema$Event) {
  return (
    event.hangoutLink ||
    event.conferenceData?.entryPoints?.find(
      (entry) => entry.entryPointType === "video" && entry.uri,
    )?.uri ||
    null
  );
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
