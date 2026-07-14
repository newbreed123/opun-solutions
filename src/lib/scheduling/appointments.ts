import { logConversionEvent } from "@/lib/conversion-event-log";
import { recordFounderEvent } from "@/lib/founder-dashboard/events";
import { supabaseAdminFetch } from "@/lib/supabase-admin";
import { appointmentEnd, formatAppointmentLabel, isSlotAvailable } from "./availability";
import { createGoogleCalendarEvent } from "./calendar";
import {
  sendBookingConfirmation,
  sendFounderNotification,
} from "./email";
import type { AppointmentPublicSummary, AppointmentRecord } from "./types";
import {
  publicToken,
  safeAnalyticsContext,
  type ValidatedAppointmentInput,
} from "./validation";

type AppointmentQuery = {
  from?: string;
  to?: string;
};

const APPOINTMENT_SELECT_STABLE =
  "id,public_token,idempotency_key,created_at,updated_at,appointment_type,status,start_at,end_at,timezone,name,email,phone,business_name,website_domain,business_type,challenge,industry,message,source,scan_id,session_id,utm_source,utm_medium,utm_campaign,gclid,google_calendar_event_id,meeting_url,google_meet_url,calendar_sync_status,calendar_sync_error,confirmation_sent_at,reminder_24h_sent_at,reminder_1h_sent_at,cancelled_at,rescheduled_from_id";
const APPOINTMENT_SELECT_BASE =
  "id,public_token,idempotency_key,created_at,updated_at,appointment_type,status,start_at,end_at,timezone,name,email,phone,business_name,website_domain,business_type,challenge,service_requested,industry,message,source,scan_id,session_id,utm_source,utm_medium,utm_campaign,gclid,google_calendar_event_id,meeting_url,google_meet_url,calendar_sync_status,calendar_sync_error,confirmation_sent_at,meet_link_email_sent_at,reminder_24h_sent_at,reminder_1h_sent_at,cancelled_at,rescheduled_from_id";
const APPOINTMENT_SELECT_WITH_REMINDER_START =
  "id,public_token,idempotency_key,created_at,updated_at,appointment_type,status,start_at,end_at,timezone,name,email,phone,business_name,website_domain,business_type,challenge,service_requested,industry,message,source,scan_id,session_id,utm_source,utm_medium,utm_campaign,gclid,google_calendar_event_id,meeting_url,google_meet_url,calendar_sync_status,calendar_sync_error,confirmation_sent_at,meet_link_email_sent_at,reminder_24h_sent_at,reminder_24h_start_at,reminder_1h_sent_at,reminder_1h_start_at,cancelled_at,rescheduled_from_id";

export async function createAppointment(input: ValidatedAppointmentInput) {
  const idempotent = await findAppointmentByIdempotencyKey(input.idempotencyKey);
  if (idempotent) {
    return { ok: true as const, appointment: idempotent, idempotent: true };
  }

  const available = await isSlotAvailable(input.startAt, input.timezone);
  if (!available) {
    await logSafeEvent("strategy_call_booking_failed", input, {
      failureReason: "slot_unavailable",
    });
    return {
      ok: false as const,
      status: 409,
      error: "That time is no longer available. Please choose another slot.",
    };
  }

  const now = new Date().toISOString();
  const record = {
    public_token: publicToken(),
    idempotency_key: input.idempotencyKey,
    appointment_type: "strategy_session",
    status: "confirmed",
    start_at: input.startAt,
    end_at: appointmentEnd(input.startAt),
    timezone: input.timezone,
    name: input.name,
    email: input.email,
    phone: input.phone,
    business_name: input.businessName || null,
    website_domain: input.websiteDomain || null,
    business_type: input.businessType || null,
    challenge: input.challenge || null,
    service_requested: input.serviceRequested || null,
    industry: input.industry || null,
    message: input.message || null,
    source: input.source || null,
    scan_id: input.scanId || null,
    session_id: input.sessionId || null,
    utm_source: input.utmSource || null,
    utm_medium: input.utmMedium || null,
    utm_campaign: input.utmCampaign || null,
    gclid: input.gclid || null,
    meeting_url: null,
    calendar_sync_status: "pending",
    updated_at: now,
  };
  let created = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    method: "POST",
    body: record,
    prefer: "return=representation",
    query: { select: APPOINTMENT_SELECT_BASE },
  });

  if (!created.ok && isMissingServiceRequestedColumnError(created.error)) {
    const { service_requested, ...recordWithoutServiceRequested } = record;
    console.warn("Opzix scheduling service_requested unavailable; retrying insert without optional field.", {
      status: created.status,
    });
    created = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      method: "POST",
      body: recordWithoutServiceRequested,
      prefer: "return=representation",
      query: { select: APPOINTMENT_SELECT_STABLE },
    });
  }

  if (!created.ok || !created.data[0]) {
    console.error("Opzix scheduling appointment insert failed:", {
      status: created.status,
      error: created.ok ? "No appointment returned after insert." : created.error,
    });
    await logSafeEvent("strategy_call_booking_failed", input, {
      failureReason: "database_conflict",
    });
    return {
      ok: false as const,
      status: created.status === 409 ? 409 : 500,
      error:
        created.status === 409
          ? "That time is no longer available. Please choose another slot."
          : "We could not complete the booking. Please try again.",
    };
  }

  let appointment = normalizeAppointmentRecord(created.data[0]) || created.data[0];
  const calendar = await createGoogleCalendarEvent(appointment);

  if (!calendar.ok) {
    console.error("Opzix scheduling calendar creation failed:", {
      appointmentId: appointment.id,
      calendarIdConfigured: Boolean(process.env.GOOGLE_CALENDAR_ID?.trim()),
      error: calendar.error,
    });
    appointment =
      (await updateAppointment(appointment.id, {
        google_calendar_event_id: calendar.eventId || appointment.google_calendar_event_id,
        calendar_sync_status: "failed",
        calendar_sync_error: calendar.error,
      })) || appointment;
    await logSafeEvent("strategy_call_booking_failed", input, {
      failureReason: "calendar_failed",
    });
  } else if (calendar.skipped) {
    const missing = "missing" in calendar ? calendar.missing ?? [] : [];
    appointment =
      (await updateAppointment(appointment.id, {
        calendar_sync_status: "oauth_config_incomplete",
        calendar_sync_error:
          missing.length > 0
            ? `Google Calendar configuration missing or invalid: ${missing.join(", ")}`
            : "Google Calendar environment variables are missing or invalid.",
      })) || appointment;
  } else {
    appointment =
      (await updateAppointment(appointment.id, {
        google_calendar_event_id: calendar.eventId,
        meeting_url: calendar.meetingUrl,
        google_meet_url: calendar.meetingUrl,
        calendar_sync_status: calendar.meetingUrl
          ? "synced"
          : calendar.pending
            ? "conference_pending"
            : "failed",
        calendar_sync_error: calendar.meetingUrl
          ? null
          : calendar.pending
            ? "Google Calendar event was created; Meet link is still being generated."
            : "Google Calendar event was created without a Google Meet URL.",
      })) || appointment;
  }

  const confirmation = await sendBookingConfirmation(appointment);
  await sendFounderNotification(appointment);

  if (confirmation.ok) {
    appointment =
      (await updateAppointment(appointment.id, {
        confirmation_sent_at: new Date().toISOString(),
      })) || appointment;
    await logSafeEvent("strategy_call_confirmation_email_sent", input);
  }

  await logSafeEvent("strategy_call_booked", input);

  return { ok: true as const, appointment, idempotent: false };
}

export async function getPublicAppointmentSummary(id: string, token: string) {
  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    query: {
      select:
        "id,public_token,status,start_at,end_at,timezone,meeting_url,google_meet_url,scan_id",
      id: `eq.${id}`,
      public_token: `eq.${token}`,
      limit: 1,
    },
  });

  if (!result.ok || !result.data[0]) return null;

  const appointment = normalizeAppointmentRecord(result.data[0]);
  if (!appointment) return null;

  return {
    id: appointment.id,
    startAt: appointment.start_at,
    endAt: appointment.end_at,
    timezone: appointment.timezone,
    dateTimeLabel: formatAppointmentLabel(
      appointment.start_at,
      appointment.timezone,
      appointment.end_at,
    ),
    meetingUrl: appointment.google_meet_url || appointment.meeting_url || undefined,
    status: appointment.status,
    hasAuditContext: Boolean(appointment.scan_id),
  } satisfies AppointmentPublicSummary;
}

export async function listAppointments(query: AppointmentQuery = {}) {
  const filters: Record<string, string | number> = {
    select: APPOINTMENT_SELECT_WITH_REMINDER_START,
    order: "start_at.asc",
    limit: 500,
  };
  const and: string[] = [];

  if (query.from) and.push(`start_at.gte.${query.from}`);
  if (query.to) and.push(`start_at.lte.${query.to}`);
  if (and.length > 0) filters.and = `(${and.join(",")})`;

  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    query: filters,
  });

  if (!result.ok && isMissingOptionalAppointmentColumnError(result.error)) {
    const fallbackSelect = isMissingServiceRequestedColumnError(result.error)
      ? APPOINTMENT_SELECT_STABLE
      : APPOINTMENT_SELECT_BASE;
    const fallback = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      query: { ...filters, select: fallbackSelect },
    });

    if (!fallback.ok && isMissingServiceRequestedColumnError(fallback.error)) {
      const stable = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
        query: { ...filters, select: APPOINTMENT_SELECT_STABLE },
      });

      return stable.ok
        ? { ok: true as const, data: normalizeAppointmentRecords(stable.data) }
        : { ok: false as const, data: [] as AppointmentRecord[], error: stable.error };
    }

    return fallback.ok
      ? { ok: true as const, data: normalizeAppointmentRecords(fallback.data) }
      : { ok: false as const, data: [] as AppointmentRecord[], error: fallback.error };
  }

  return result.ok
    ? { ok: true as const, data: normalizeAppointmentRecords(result.data) }
    : { ok: false as const, data: [] as AppointmentRecord[], error: result.error };
}

export async function getAppointmentById(id: string) {
  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    query: {
      select: APPOINTMENT_SELECT_WITH_REMINDER_START,
      id: `eq.${id}`,
      limit: 1,
    },
  });

  if (!result.ok && isMissingOptionalAppointmentColumnError(result.error)) {
    const fallbackSelect = isMissingServiceRequestedColumnError(result.error)
      ? APPOINTMENT_SELECT_STABLE
      : APPOINTMENT_SELECT_BASE;
    const fallback = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      query: {
        select: fallbackSelect,
        id: `eq.${id}`,
        limit: 1,
      },
    });

    if (!fallback.ok && isMissingServiceRequestedColumnError(fallback.error)) {
      const stable = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
        query: {
          select: APPOINTMENT_SELECT_STABLE,
          id: `eq.${id}`,
          limit: 1,
        },
      });

      return stable.ok ? normalizeAppointmentRecord(stable.data[0]) || null : null;
    }

    return fallback.ok ? normalizeAppointmentRecord(fallback.data[0]) || null : null;
  }

  return result.ok ? normalizeAppointmentRecord(result.data[0]) || null : null;
}

export async function listPendingConferenceAppointments(now = new Date()) {
  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    query: {
      select: APPOINTMENT_SELECT_BASE,
      and: `(status.eq.confirmed,start_at.gt.${now.toISOString()},google_calendar_event_id.not.is.null,google_meet_url.is.null,calendar_sync_status.eq.conference_pending)`,
      order: "start_at.asc",
      limit: 100,
    },
  });

  if (!result.ok && isMissingOptionalAppointmentColumnError(result.error)) {
    const fallback = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      query: {
        select: APPOINTMENT_SELECT_STABLE,
        and: `(status.eq.confirmed,start_at.gt.${now.toISOString()},google_calendar_event_id.not.is.null,google_meet_url.is.null,calendar_sync_status.eq.conference_pending)`,
        order: "start_at.asc",
        limit: 100,
      },
    });

    return fallback.ok
      ? { ok: true as const, data: normalizeAppointmentRecords(fallback.data) }
      : { ok: false as const, data: [] as AppointmentRecord[], error: fallback.error };
  }

  return result.ok
    ? { ok: true as const, data: normalizeAppointmentRecords(result.data) }
    : { ok: false as const, data: [] as AppointmentRecord[], error: result.error };
}

export async function updateAppointment(id: string, patch: Partial<AppointmentRecord>) {
  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    method: "PATCH",
    query: { id: `eq.${id}`, select: APPOINTMENT_SELECT_BASE },
    body: { ...patch, updated_at: new Date().toISOString() },
    prefer: "return=representation",
  });

  if (!result.ok && isMissingServiceRequestedColumnError(result.error)) {
    const fallback = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      method: "PATCH",
      query: { id: `eq.${id}`, select: APPOINTMENT_SELECT_STABLE },
      body: { ...patchWithoutOptionalSchemaColumns(patch), updated_at: new Date().toISOString() },
      prefer: "return=representation",
    });

    return fallback.ok ? normalizeAppointmentRecord(fallback.data[0]) || null : null;
  }

  if (!result.ok && hasReminderStartPatch(patch)) {
    const { reminder_24h_start_at, reminder_1h_start_at, ...fallbackPatch } = patch;
    const fallback = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      method: "PATCH",
      query: { id: `eq.${id}`, select: APPOINTMENT_SELECT_BASE },
      body: { ...fallbackPatch, updated_at: new Date().toISOString() },
      prefer: "return=representation",
    });

    return fallback.ok ? normalizeAppointmentRecord(fallback.data[0]) || null : null;
  }

  return result.ok ? normalizeAppointmentRecord(result.data[0]) || null : null;
}

async function findAppointmentByIdempotencyKey(key: string) {
  const result = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
    query: {
      select: APPOINTMENT_SELECT_BASE,
      idempotency_key: `eq.${key}`,
      limit: 1,
    },
  });

  if (!result.ok && isMissingServiceRequestedColumnError(result.error)) {
    const fallback = await supabaseAdminFetch<AppointmentRecord[]>("appointments", {
      query: {
        select: APPOINTMENT_SELECT_STABLE,
        idempotency_key: `eq.${key}`,
        limit: 1,
      },
    });

    return fallback.ok ? normalizeAppointmentRecord(fallback.data[0]) || null : null;
  }

  return result.ok ? normalizeAppointmentRecord(result.data[0]) || null : null;
}

function normalizeAppointmentRecord(
  appointment: AppointmentRecord | undefined,
): AppointmentRecord | undefined {
  if (!appointment) return undefined;

  return {
    ...appointment,
    service_requested: appointment.service_requested ?? null,
    meet_link_email_sent_at: appointment.meet_link_email_sent_at ?? null,
    reminder_24h_start_at: appointment.reminder_24h_start_at ?? null,
    reminder_1h_start_at: appointment.reminder_1h_start_at ?? null,
  } as AppointmentRecord;
}

function normalizeAppointmentRecords(appointments: AppointmentRecord[]) {
  return appointments
    .map(normalizeAppointmentRecord)
    .filter((appointment): appointment is AppointmentRecord => Boolean(appointment));
}

function isMissingReminderStartColumnError(error: string) {
  return (
    /reminder_24h_start_at|reminder_1h_start_at/i.test(error) &&
    /column|schema cache|could not find/i.test(error)
  );
}

function isMissingServiceRequestedColumnError(error: string) {
  return (
    /service_requested|meet_link_email_sent_at/i.test(error) &&
    /column|schema cache|could not find/i.test(error)
  );
}

function isMissingOptionalAppointmentColumnError(error: string) {
  return (
    isMissingReminderStartColumnError(error) ||
    isMissingServiceRequestedColumnError(error)
  );
}

function hasReminderStartPatch(patch: Partial<AppointmentRecord>) {
  return (
    Object.prototype.hasOwnProperty.call(patch, "reminder_24h_start_at") ||
    Object.prototype.hasOwnProperty.call(patch, "reminder_1h_start_at")
  );
}

function patchWithoutOptionalSchemaColumns(patch: Partial<AppointmentRecord>) {
  const {
    reminder_24h_start_at,
    reminder_1h_start_at,
    service_requested,
    meet_link_email_sent_at,
    ...stablePatch
  } = patch;

  return stablePatch;
}

async function logSafeEvent(
  eventName:
    | "strategy_call_booked"
    | "strategy_call_booking_failed"
    | "strategy_call_confirmation_email_sent",
  input: ValidatedAppointmentInput,
  extra: Record<string, string | number | boolean | undefined> = {},
) {
  const payload = {
    ...safeAnalyticsContext(input),
    appointmentType: "strategy_session",
    ...extra,
  };

  await logConversionEvent({ eventName, payload });

  await recordFounderEvent({
    eventName,
    source: input.source,
    websiteDomain: input.websiteDomain,
    scanId: input.scanId,
    businessType: input.businessType,
    challenge: input.challenge,
    serviceRequested: input.serviceRequested,
    industry: input.industry,
  });
}
