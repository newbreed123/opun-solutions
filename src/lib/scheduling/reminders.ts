import { logConversionEvent } from "@/lib/conversion-event-log";
import { recordFounderEvent } from "@/lib/founder-dashboard/events";
import {
  getAppointmentById,
  listAppointments,
  listPendingConferenceAppointments,
  updateAppointment,
} from "./appointments";
import { fetchGoogleMeetUrlForEvent } from "./calendar";
import {
  sendMeetLinkAvailableEmail,
  sendReminder1h,
  sendReminder24h,
} from "./email";
import type { AppointmentRecord } from "./types";

type ReminderType = "appointment_24h" | "appointment_1h";

type ReminderConfig = {
  type: ReminderType;
  windowStartMinutes: number;
  windowEndMinutes: number;
  minimumLeadTimeMinutes: number;
  sentAtField: "reminder_24h_sent_at" | "reminder_1h_sent_at";
  startAtField: "reminder_24h_start_at" | "reminder_1h_start_at";
  send: typeof sendReminder24h;
  eventName: "strategy_call_reminder_24h_sent" | "strategy_call_reminder_1h_sent";
};

const REMINDER_CONFIGS: ReminderConfig[] = [
  {
    type: "appointment_24h",
    windowStartMinutes: 23 * 60,
    windowEndMinutes: 25 * 60,
    minimumLeadTimeMinutes: 24 * 60,
    sentAtField: "reminder_24h_sent_at",
    startAtField: "reminder_24h_start_at",
    send: sendReminder24h,
    eventName: "strategy_call_reminder_24h_sent",
  },
  {
    type: "appointment_1h",
    windowStartMinutes: 45,
    windowEndMinutes: 75,
    minimumLeadTimeMinutes: 60,
    sentAtField: "reminder_1h_sent_at",
    startAtField: "reminder_1h_start_at",
    send: sendReminder1h,
    eventName: "strategy_call_reminder_1h_sent",
  },
];

export const DISABLED_REMINDERS_RESPONSE = {
  status: "disabled",
  message: "Branded appointment reminders are currently disabled.",
};

// Branded Opzix appointment reminders are currently disabled in production
// because Vercel Hobby does not support hourly cron schedules. Google Calendar
// invitations and attendee notifications are used temporarily. Re-enable the
// hourly cron after upgrading to Vercel Pro or moving reminder execution to
// another scheduler.
export function appointmentRemindersEnabled() {
  const value = process.env.APPOINTMENT_REMINDERS_ENABLED?.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production";
}

export async function processSchedulingReminders(now = new Date()) {
  if (!appointmentRemindersEnabled()) {
    schedulingReminderLog("scan completed", {
      result: "disabled",
    });
    return {
      ok: true as const,
      processed: 0,
      disabled: true as const,
      ...DISABLED_REMINDERS_RESPONSE,
    };
  }

  schedulingReminderLog("scan started", { now: now.toISOString() });
  const pendingConferenceResult = await processPendingConferenceLinks(now);
  const horizon = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();
  const result = await listAppointments({
    from: now.toISOString(),
    to: horizon,
  });

  if (!result.ok) {
    schedulingReminderLog("scan completed", {
      result: "failed",
      error: "appointment_query_failed",
    });
    return {
      ok: false as const,
      processed: pendingConferenceResult.processed,
      error: result.error,
    };
  }

  let processed = pendingConferenceResult.processed;
  const errors: string[] = [...pendingConferenceResult.errors];

  for (const appointment of result.data) {
    for (const config of REMINDER_CONFIGS) {
      const decision = reminderEligibility(appointment, config, now);

      if (!decision.eligible) {
        if (decision.reason !== "outside_window") {
          schedulingReminderLog("reminder skipped", {
            appointmentId: appointment.id,
            reminderType: config.type,
            scheduledStartAt: appointment.start_at,
            result: decision.reason,
          });
        }
        continue;
      }

      schedulingReminderLog("eligible appointment found", {
        appointmentId: appointment.id,
        reminderType: config.type,
        scheduledStartAt: appointment.start_at,
        result: "eligible",
      });

      const latestAppointment = await getAppointmentById(appointment.id);
      if (!latestAppointment) {
        schedulingReminderLog("reminder skipped", {
          appointmentId: appointment.id,
          reminderType: config.type,
          scheduledStartAt: appointment.start_at,
          result: "appointment_not_found",
        });
        continue;
      }

      const latestDecision = reminderEligibility(latestAppointment, config, now);
      if (!latestDecision.eligible) {
        schedulingReminderLog("reminder skipped", {
          appointmentId: latestAppointment.id,
          reminderType: config.type,
          scheduledStartAt: latestAppointment.start_at,
          result: latestDecision.reason,
        });
        continue;
      }

      const sent = await config.send(latestAppointment);
      if (!sent.ok) {
        errors.push(sent.error);
        schedulingReminderLog("send failed", {
          appointmentId: latestAppointment.id,
          reminderType: config.type,
          scheduledStartAt: latestAppointment.start_at,
          result: "email_provider_failed",
        });
        continue;
      }

      if (!sent.skipped) {
        const updated = await updateAppointment(latestAppointment.id, {
          [config.sentAtField]: new Date().toISOString(),
          [config.startAtField]: latestAppointment.start_at,
        });

        if (updated) {
          await logReminderEvent(config.eventName, latestAppointment);
          processed += 1;
          schedulingReminderLog("reminder sent", {
            appointmentId: latestAppointment.id,
            reminderType: config.type,
            scheduledStartAt: latestAppointment.start_at,
            providerMessageId: sent.id,
            result: "sent",
          });
        } else {
          errors.push("Reminder sent but appointment update failed.");
          schedulingReminderLog("send failed", {
            appointmentId: latestAppointment.id,
            reminderType: config.type,
            scheduledStartAt: latestAppointment.start_at,
            result: "status_update_failed",
          });
        }
      } else {
        schedulingReminderLog("reminder skipped", {
          appointmentId: latestAppointment.id,
          reminderType: config.type,
          scheduledStartAt: latestAppointment.start_at,
          result: "email_provider_not_configured",
        });
      }
    }
  }

  schedulingReminderLog("scan completed", {
    processed,
    errorCount: errors.length,
    result: errors.length === 0 ? "ok" : "failed",
  });

  return {
    ok: errors.length === 0,
    processed,
    errors,
  };
}

async function processPendingConferenceLinks(now: Date) {
  const result = await listPendingConferenceAppointments(now);
  const errors: string[] = [];
  let processed = 0;

  if (!result.ok) {
    schedulingReminderLog("send failed", {
      reminderType: "meet_link_retry",
      result: "pending_conference_query_failed",
    });
    return { processed, errors: [result.error] };
  }

  for (const appointment of result.data) {
    const latestAppointment = await getAppointmentById(appointment.id);
    if (
      !latestAppointment ||
      latestAppointment.status !== "confirmed" ||
      latestAppointment.cancelled_at ||
      new Date(latestAppointment.start_at).getTime() <= now.getTime()
    ) {
      schedulingReminderLog("reminder skipped", {
        appointmentId: appointment.id,
        reminderType: "meet_link_retry",
        scheduledStartAt: appointment.start_at,
        result: "not_eligible",
      });
      continue;
    }

    if (latestAppointment.google_meet_url || latestAppointment.meeting_url) {
      continue;
    }

    const meet = await fetchGoogleMeetUrlForEvent(latestAppointment);

    if (!meet.ok) {
      if (meet.conferenceStatus === "config_incomplete") {
        await updateAppointment(latestAppointment.id, {
          calendar_sync_status: "oauth_config_incomplete",
          calendar_sync_error: meet.error,
        });
      }
      errors.push(meet.error);
      schedulingReminderLog("send failed", {
        appointmentId: latestAppointment.id,
        reminderType: "meet_link_retry",
        scheduledStartAt: latestAppointment.start_at,
        result: "calendar_fetch_failed",
      });
      continue;
    }

    if (!meet.meetingUrl) {
      if (meet.conferenceStatus === "failure") {
        await updateAppointment(latestAppointment.id, {
          calendar_sync_status: "failed",
          calendar_sync_error: "Google Calendar reported Meet conference creation failed.",
        });
      }
      schedulingReminderLog("reminder skipped", {
        appointmentId: latestAppointment.id,
        reminderType: "meet_link_retry",
        scheduledStartAt: latestAppointment.start_at,
        result: meet.conferenceStatus === "failure" ? "conference_failed" : "still_pending",
      });
      continue;
    }

    const updated = await updateAppointment(latestAppointment.id, {
      meeting_url: meet.meetingUrl,
      google_meet_url: meet.meetingUrl,
      calendar_sync_status: "synced",
      calendar_sync_error: null,
    });

    if (!updated) {
      errors.push("Meet link found but appointment update failed.");
      continue;
    }

    if (updated.meet_link_email_sent_at) {
      processed += 1;
      continue;
    }

    const sent = await sendMeetLinkAvailableEmail(updated);
    if (!sent.ok) {
      errors.push(sent.error);
      schedulingReminderLog("send failed", {
        appointmentId: updated.id,
        reminderType: "meet_link_retry",
        scheduledStartAt: updated.start_at,
        result: "meet_link_email_failed",
      });
      continue;
    }

    if (!sent.skipped) {
      await updateAppointment(updated.id, {
        meet_link_email_sent_at: new Date().toISOString(),
      });
    }

    processed += 1;
    schedulingReminderLog("reminder sent", {
      appointmentId: updated.id,
      reminderType: "meet_link_retry",
      scheduledStartAt: updated.start_at,
      result: "meet_link_sent",
    });
  }

  return { processed, errors };
}

function reminderEligibility(
  appointment: AppointmentRecord,
  config: ReminderConfig,
  now: Date,
):
  | { eligible: true }
  | {
      eligible: false;
      reason:
        | "already_sent"
        | "booked_too_late"
        | "cancelled"
        | "outside_window"
        | "past_start"
        | "unsupported_status";
    } {
  if (appointment.status !== "confirmed") {
    return { eligible: false, reason: "unsupported_status" };
  }

  if (appointment.cancelled_at) {
    return { eligible: false, reason: "cancelled" };
  }

  const start = new Date(appointment.start_at);
  if (start.getTime() <= now.getTime()) {
    return { eligible: false, reason: "past_start" };
  }

  const minutesUntilStart = (start.getTime() - now.getTime()) / 60_000;
  if (
    minutesUntilStart < config.windowStartMinutes ||
    minutesUntilStart > config.windowEndMinutes
  ) {
    return { eligible: false, reason: "outside_window" };
  }

  const createdAt = new Date(appointment.created_at);
  const bookingLeadMinutes = (start.getTime() - createdAt.getTime()) / 60_000;
  if (bookingLeadMinutes < config.minimumLeadTimeMinutes) {
    return { eligible: false, reason: "booked_too_late" };
  }

  if (
    reminderAlreadySentForStart(
      appointment[config.sentAtField],
      appointment[config.startAtField],
      appointment.start_at,
    )
  ) {
    return { eligible: false, reason: "already_sent" };
  }

  return { eligible: true };
}

function reminderAlreadySentForStart(
  sentAt: string | null,
  reminderStartAt: string | null,
  currentStartAt: string,
) {
  if (!sentAt) return false;
  if (!reminderStartAt) return true;

  const previousStart = new Date(reminderStartAt).getTime();
  const currentStart = new Date(currentStartAt).getTime();
  const startDeltaMinutes = Math.abs(previousStart - currentStart) / 60_000;

  return startDeltaMinutes <= 5;
}

function schedulingReminderLog(
  event:
    | "scan started"
    | "eligible appointment found"
    | "reminder sent"
    | "reminder skipped"
    | "send failed"
    | "scan completed",
  payload: Record<string, string | number | undefined>,
) {
  console.info(`[scheduling-reminder] ${event}`, payload);
}

function logReminderEvent(
  eventName: "strategy_call_reminder_24h_sent" | "strategy_call_reminder_1h_sent",
  appointment: AppointmentRecord,
) {
  const payload = {
    source: appointment.source || undefined,
    websiteDomain: appointment.website_domain || undefined,
    websiteUrl: appointment.website_domain || undefined,
    scanId: appointment.scan_id || undefined,
    sessionId: appointment.session_id || undefined,
    businessType: appointment.business_type || undefined,
    challenge: appointment.challenge || undefined,
    industry: appointment.industry || undefined,
    appointmentType: appointment.appointment_type,
  };

  return Promise.all([
    logConversionEvent({
      eventName,
      payload,
    }),
    recordFounderEvent({
      eventName,
      source: appointment.source || undefined,
      websiteDomain: appointment.website_domain || undefined,
      scanId: appointment.scan_id || undefined,
      businessType: appointment.business_type || undefined,
      challenge: appointment.challenge || undefined,
      industry: appointment.industry || undefined,
    }),
  ]);
}
