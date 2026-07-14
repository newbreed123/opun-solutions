import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";

const moduleCache = new Map();
const repoRoot = process.cwd();

function loadTsModule(relativePath) {
  const absolutePath = path.resolve(repoRoot, relativePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  const source = readFileSync(absolutePath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  moduleCache.set(absolutePath, module);

  const localRequire = (request) => {
    if (request === "./display") {
      return loadTsModule("src/lib/scheduling/display.ts");
    }
    if (request === "./config") {
      return {
        getSchedulingConfig: () => ({
          durationMinutes: 30,
        }),
      };
    }
    if (request === "./types") {
      return {};
    }
    throw new Error(`Unexpected test require: ${request}`);
  };

  const factory = new Function("require", "module", "exports", transpiled);
  factory(localRequire, module, module.exports);
  return module.exports;
}

const {
  appointmentEmailTemplateProps,
  renderProspectEmail,
} = loadTsModule("src/lib/scheduling/email.ts");

const baseAppointment = {
  id: "appt_123",
  public_token: "token",
  idempotency_key: "idem",
  created_at: "2026-07-14T12:00:00.000Z",
  updated_at: "2026-07-14T12:00:00.000Z",
  appointment_type: "strategy_session",
  status: "confirmed",
  start_at: "2026-07-14T16:45:00.000Z",
  end_at: "2026-07-14T17:15:00.000Z",
  timezone: "America/New_York",
  name: "Bill",
  email: "bill@example.com",
  phone: "+18239002233",
  business_name: null,
  website_domain: null,
  business_type: null,
  challenge: null,
  service_requested: null,
  industry: null,
  message: null,
  source: null,
  scan_id: null,
  session_id: null,
  utm_source: null,
  utm_medium: null,
  utm_campaign: null,
  gclid: null,
  google_calendar_event_id: "event_123",
  meeting_url: null,
  google_meet_url: "https://meet.google.com/wwq-zdox-vsc",
  calendar_sync_status: "synced",
  calendar_sync_error: null,
  confirmation_sent_at: null,
  meet_link_email_sent_at: null,
  reminder_24h_sent_at: null,
  reminder_24h_start_at: null,
  reminder_1h_sent_at: null,
  reminder_1h_start_at: null,
  cancelled_at: null,
  rescheduled_from_id: null,
};

function render(appointment = baseAppointment) {
  const props = appointmentEmailTemplateProps(
    appointment,
    "Your Opzix Strategy Session Is Confirmed",
    "Your strategy session is confirmed.",
  );
  return {
    props,
    ...renderProspectEmail(props),
  };
}

const withMeet = render();
assert.equal(withMeet.props.clientName, "Bill");
assert.equal(withMeet.props.clientEmail, "bill@example.com");
assert.equal(withMeet.props.googleMeetUrl, "https://meet.google.com/wwq-zdox-vsc");
assert.match(withMeet.html, /Hi Bill,/);
assert.match(withMeet.text, /Hi Bill,/);
assert.match(withMeet.html, /Join Google Meet/);
assert.match(withMeet.html, /https:\/\/meet\.google\.com\/wwq-zdox-vsc/);
assert.match(withMeet.text, /Google Meet: https:\/\/meet\.google\.com\/wwq-zdox-vsc/);
assert.match(withMeet.html, /Before the call/);
assert.match(withMeet.html, /Website URL\./);
assert.match(withMeet.html, /Current business challenge\./);
assert.match(withMeet.html, /Existing audit report\./);
assert.match(withMeet.html, /What success should look like\./);
assert.match(withMeet.html, /Reschedule/);
assert.match(withMeet.html, /Cancel/);
assert.doesNotMatch(
  `${withMeet.html}\n${withMeet.text}`,
  /schedule time|selected time|appointment summary|calendar sync|appointment id|service requested/i,
);

const withoutMeet = render({
  ...baseAppointment,
  google_meet_url: null,
  meeting_url: null,
});
assert.match(
  withoutMeet.html,
  /Your appointment is confirmed\. Your meeting link is being prepared and will be emailed separately\./,
);
assert.match(withoutMeet.html, /Before the call/);
assert.match(withoutMeet.html, /Reschedule/);
assert.match(withoutMeet.html, /Cancel/);

const protectedGreeting = render({
  ...baseAppointment,
  name: "schedule time",
});
assert.match(protectedGreeting.html, /Hi there,/);
assert.doesNotMatch(protectedGreeting.html, /Hi schedule time,/i);

console.log("Scheduling confirmation email render tests passed.");
