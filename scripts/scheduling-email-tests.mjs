import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const email = readFileSync("src/lib/scheduling/email.ts", "utf8");
const calendar = readFileSync("src/lib/scheduling/calendar.ts", "utf8");
const appointments = readFileSync("src/lib/scheduling/appointments.ts", "utf8");
const display = readFileSync("src/lib/scheduling/display.ts", "utf8");
const confirmationPage = readFileSync("src/app/strategy-call-confirmed/page.tsx", "utf8");
const copyMeetingLink = readFileSync("src/app/strategy-call-confirmed/CopyMeetingLinkButton.tsx", "utf8");
const bookingPage = readFileSync("src/app/book/strategy-session/page.tsx", "utf8");
const googleOauth = readFileSync("src/lib/scheduling/google-oauth.ts", "utf8");
const authorizeRoute = readFileSync("src/app/api/google/oauth/authorize/route.ts", "utf8");
const callbackRoute = readFileSync("src/app/api/google/oauth/callback/route.ts", "utf8");

assert.match(email, /Hi \$\{escapeHtml\(appointment\.name\)\}/);
assert.match(email, /mailto:\$\{escapeHtml\(email\)\}/);
assert.match(email, /tel:\$\{escapeHtml\(phone\)\}/);
assert.match(email, /Join Google Meet/);
assert.match(email, /View All Appointments/);
assert.match(email, /System details/);
assert.match(email, /Missing Business Information/);
assert.match(email, /Missing before the call/);
assert.match(email, /formatPhoneForDisplay/);
assert.match(email, /Service requested/);
assert.match(email, /Quick Actions/);
assert.match(email, /MEET_PENDING_MESSAGE/);
assert.match(email, /Your appointment is confirmed\. Your meeting link is being prepared and will be emailed separately\./);
assert.match(email, /Your Opzix strategy session is tomorrow/);
assert.match(email, /Your Opzix strategy session starts in one hour/);
assert.match(email, /preparationChecklist/);
assert.match(email, /Calendar event created and Meet link ready/);
assert.match(email, /Meet generation pending/);
assert.match(email, /Google OAuth configuration incomplete/);
assert.match(email, /sendMeetLinkAvailableEmail/);
assert.match(email, /Your Google Meet Link for Your Opzix Strategy Session/);
assert.doesNotMatch(email, /Calendar details will be included in the invite when configured/);
assert.doesNotMatch(email, /GOOGLE_PRIVATE_KEY|GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY/);

assert.match(display, /"America\/New_York": "Eastern Time \(ET\)"/);
assert.match(display, /formatTimezoneLabel/);
assert.match(display, /audit_scanner: "Audit Scanner"/);
assert.match(display, /header: "Website Header"/);
assert.match(display, /strategy_cta: "Strategy Call CTA"/);
assert.match(display, /\+1 \(\$\{digits\.slice\(1, 4\)\}\)/);

assert.match(confirmationPage, /Join Google Meet/);
assert.match(confirmationPage, /target="_blank"/);
assert.match(confirmationPage, /rel="noopener noreferrer"/);
assert.match(confirmationPage, /formatTimezoneLabel/);
assert.match(confirmationPage, /Check your inbox for your confirmation email\./);
assert.doesNotMatch(confirmationPage, /OAuth|calendar sync|public_token|calendar_sync/);
assert.match(copyMeetingLink, /navigator\.clipboard\.writeText\(meetingUrl\)/);
assert.match(copyMeetingLink, /Copy meeting link/);

assert.match(googleOauth, /new google\.auth\.OAuth2/);
assert.match(googleOauth, /GOOGLE_REFRESH_TOKEN/);
assert.match(googleOauth, /GOOGLE_OAUTH_SETUP_SECRET/);
assert.match(googleOauth, /validateGoogleCalendarProductionConfig/);
assert.match(googleOauth, /https:\/\/opzix\.io\/api\/google\/oauth\/callback/);
assert.match(googleOauth, /GOOGLE_CALENDAR_TIMEZONE/);
assert.doesNotMatch(googleOauth, /OPZIX_GOOGLE_OAUTH_SETUP_SECRET|OPZIX_ADMIN_PASSCODE/);
assert.doesNotMatch(googleOauth, /NEXT_PUBLIC_/);

assert.match(authorizeRoute, /access_type:\s*"offline"/);
assert.match(authorizeRoute, /prompt:\s*"consent"/);
assert.match(authorizeRoute, /include_granted_scopes:\s*true/);
assert.match(authorizeRoute, /GOOGLE_CALENDAR_EVENTS_SCOPE/);
assert.match(authorizeRoute, /isValidGoogleOAuthSetupSecret/);
assert.match(authorizeRoute, /searchParams\.get\("secret"\)/);
assert.doesNotMatch(authorizeRoute, /setupSecret|x-opzix-google-oauth-secret/);

assert.match(callbackRoute, /No authorization code was provided/);
assert.match(callbackRoute, /Google did not return a refresh token/);
assert.match(callbackRoute, /isValidGoogleOAuthState/);
assert.doesNotMatch(callbackRoute, /GOOGLE_CLIENT_SECRET/);

assert.match(calendar, /google\.calendar\(\{/);
assert.match(calendar, /attendees:\s*\[\s*\{\s*email:\s*appointment\.email/);
assert.match(calendar, /sendUpdates:\s*"all"/);
assert.match(calendar, /conferenceDataVersion:\s*1/);
assert.match(calendar, /calendar\.events\.insert/);
assert.match(calendar, /requestId:\s*randomUUID\(\)/);
assert.match(calendar, /calendar\.events\.get/);
assert.match(calendar, /MEET_FETCH_DELAYS_MS = \[500, 1000, 2000, 3000\]/);
assert.match(calendar, /conference status pending/);
assert.match(calendar, /conference status success/);
assert.match(calendar, /conference status failure/);
assert.match(calendar, /meet url extracted/);
assert.match(calendar, /event fetch failed/);
assert.match(calendar, /extractGoogleMeetUrl\(event\)/);
assert.match(calendar, /Service requested/);
assert.match(calendar, /entryPointType === "video"/);
assert.doesNotMatch(calendar, /payload\.htmlLink \|\| null/);
assert.doesNotMatch(calendar, /GOOGLE_REFRESH_TOKEN.*console/i);
assert.doesNotMatch(calendar, /clientSecret.*console|Authorization.*console|refreshToken.*console/);

assert.match(appointments, /service_requested/);
assert.match(appointments, /conference_pending/);
assert.match(appointments, /meet_link_email_sent_at/);
assert.match(bookingPage, /serviceRequested/);

console.log("Scheduling OAuth, email, and Calendar smoke tests passed.");
