import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const reminders = readFileSync("src/lib/scheduling/reminders.ts", "utf8");
const reminderRoute = readFileSync("src/app/api/scheduling/reminders/route.ts", "utf8");
const appointments = readFileSync("src/lib/scheduling/appointments.ts", "utf8");
const types = readFileSync("src/lib/scheduling/types.ts", "utf8");
const migration = readFileSync(
  "supabase/appointments_add_reminder_start_tracking.sql",
  "utf8",
);
const vercel = readFileSync("vercel.json", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const readme = readFileSync("README.md", "utf8");

assert.match(reminders, /type ReminderType = "appointment_24h" \| "appointment_1h"/);
assert.match(reminders, /APPOINTMENT_REMINDERS_ENABLED/);
assert.match(reminders, /DISABLED_REMINDERS_RESPONSE/);
assert.match(reminders, /Branded appointment reminders are currently disabled/);
assert.match(reminders, /appointmentRemindersEnabled\(\)/);
assert.match(reminders, /processed:\s*0/);
assert.match(reminders, /windowStartMinutes:\s*23 \* 60/);
assert.match(reminders, /windowEndMinutes:\s*25 \* 60/);
assert.match(reminders, /windowStartMinutes:\s*45/);
assert.match(reminders, /windowEndMinutes:\s*75/);
assert.match(reminders, /minimumLeadTimeMinutes:\s*24 \* 60/);
assert.match(reminders, /minimumLeadTimeMinutes:\s*60/);
assert.match(reminders, /appointment\.status !== "confirmed"/);
assert.match(reminders, /appointment\.cancelled_at/);
assert.match(reminders, /start\.getTime\(\) <= now\.getTime\(\)/);
assert.match(reminders, /reminderAlreadySentForStart/);
assert.match(reminders, /startDeltaMinutes <= 5/);
assert.match(reminders, /getAppointmentById\(appointment\.id\)/);
assert.match(reminders, /listPendingConferenceAppointments/);
assert.match(reminders, /fetchGoogleMeetUrlForEvent/);
assert.match(reminders, /sendMeetLinkAvailableEmail/);
assert.match(reminders, /meet_link_retry/);
assert.match(reminders, /meet_link_email_sent_at/);
assert.match(reminders, /calendar_sync_status:\s*"synced"/);
assert.match(reminders, /calendar_sync_status:\s*"failed"/);
assert.match(reminders, /if \(!sent\.ok\)/);
assert.match(reminders, /if \(!sent\.skipped\)/);
assert.match(reminders, /email_provider_failed/);
assert.match(reminders, /schedulingReminderLog\("scan started"/);
assert.match(reminders, /schedulingReminderLog\("eligible appointment found"/);
assert.match(reminders, /schedulingReminderLog\("reminder sent"/);
assert.match(reminders, /schedulingReminderLog\("reminder skipped"/);
assert.match(reminders, /schedulingReminderLog\("send failed"/);
assert.match(reminders, /schedulingReminderLog\("scan completed"/);
assert.match(reminders, /\[scheduling-reminder\] \$\{event\}/);
assert.doesNotMatch(reminders, /GOOGLE_REFRESH_TOKEN|RESEND_API_KEY|SUPABASE_SERVICE_ROLE_KEY/);

assert.match(reminderRoute, /OPZIX_SCHEDULING_CRON_SECRET/);
assert.match(reminderRoute, /CRON_SECRET/);
assert.match(reminderRoute, /authorization/);
assert.match(reminderRoute, /status:\s*401/);
assert.match(reminderRoute, /DISABLED_REMINDERS_RESPONSE/);
assert.match(reminderRoute, /appointmentRemindersEnabled/);
assert.match(reminderRoute, /errorCount/);
assert.doesNotMatch(reminderRoute, /errors:\s*"errors" in result \? result\.errors/);

assert.match(appointments, /reminder_24h_start_at/);
assert.match(appointments, /reminder_1h_start_at/);
assert.match(appointments, /meet_link_email_sent_at/);
assert.match(appointments, /conference_pending/);
assert.match(appointments, /listPendingConferenceAppointments/);
assert.match(appointments, /getAppointmentById/);
assert.match(types, /reminder_24h_start_at: string \| null/);
assert.match(types, /reminder_1h_start_at: string \| null/);
assert.match(types, /meet_link_email_sent_at: string \| null/);
assert.match(migration, /add column if not exists reminder_24h_start_at timestamptz/);
assert.match(migration, /add column if not exists reminder_1h_start_at timestamptz/);
assert.doesNotMatch(vercel, /"crons"/);
assert.doesNotMatch(vercel, /\/api\/scheduling\/reminders/);
assert.doesNotMatch(vercel, /0 \* \* \* \*/);
assert.match(envExample, /APPOINTMENT_REMINDERS_ENABLED=false/);
assert.match(readme, /Vercel Hobby does not support hourly cron schedules/);
assert.match(readme, /APPOINTMENT_REMINDERS_ENABLED=true/);

console.log("Scheduling reminder smoke tests passed.");
