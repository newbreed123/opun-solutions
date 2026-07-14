# Opzix Solutions

## Native Scheduling MVP

The native Opzix scheduling MVP is behind:

- `NEXT_PUBLIC_OPZIX_BOOKING_ENABLED=true`
- `NEXT_PUBLIC_STRATEGY_CALL_URL=/book/strategy-session`
- `NEXT_PUBLIC_CALENDLY_FALLBACK_URL=https://calendly.com/hello-opzix`

When `NEXT_PUBLIC_OPZIX_BOOKING_ENABLED=false`, shared strategy-call CTAs use the
Calendly fallback. When enabled, they route to `/book/strategy-session`.

Scheduling defaults:

- `OPZIX_BOOKING_TIMEZONE=America/New_York`
- `OPZIX_STRATEGY_SESSION_DURATION_MINUTES=30`
- `OPZIX_BOOKING_BUFFER_MINUTES=15`
- `OPZIX_BOOKING_MIN_NOTICE_HOURS=12`
- `OPZIX_BOOKING_MAX_DAYS_AHEAD=30`
- Optional `OPZIX_BOOKING_WORKING_WINDOWS=1:09:00-17:00,2:09:00-17:00,3:09:00-17:00,4:09:00-17:00,5:09:00-17:00`

Required operational setup:

- Apply `supabase/appointments.sql`.
- Apply `supabase/appointments_add_phone_calendar_status.sql`.
- Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Configure `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, and `CONTACT_NOTIFICATION_EMAIL`.
- Configure `OPZIX_SCHEDULING_CRON_SECRET` for manual cron calls. Vercel Cron calls
  can use the `x-vercel-cron` header.

Google Calendar setup:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/google/oauth/callback`
- `GOOGLE_CALENDAR_ID=hello@opzix.io`
- `GOOGLE_CALENDAR_TIMEZONE=America/New_York`
- `GOOGLE_CALENDAR_CREATE_MEET_LINK=true`
- `GOOGLE_OAUTH_SETUP_SECRET`

For production, set:

- `GOOGLE_OAUTH_REDIRECT_URI=https://opzix.io/api/google/oauth/callback`

Do not expose OAuth credentials through `NEXT_PUBLIC_*` variables and do not
commit downloaded OAuth client JSON files.

Local OAuth setup:

1. Configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI`, and `GOOGLE_OAUTH_SETUP_SECRET`.
2. Visit `/api/google/oauth/authorize?secret=YOUR_SETUP_SECRET`.
3. Approve Calendar access.
4. Copy the returned `GOOGLE_REFRESH_TOKEN` into `.env.local`.

If Google OAuth credentials are not configured, bookings are still recorded and
emails still send, but the internal notification is marked for Calendar/Meet
attention and the client receives a safe "meeting link is being prepared"
fallback.

## Google Ads Appointment Conversion Tracking

Google Ads appointment conversion tracking should use URL-based tracking for the primary conversion:

- Primary conversion: visit to `/strategy-call-confirmed`

Secondary conversions to configure in analytics or ads reporting:

- `audit_completed`
- `contact_form_submitted`
- `zora_qualified_conversation`
- `scanner_report_generated`

Do not add Google Ads scripts directly in app code unless a standard conversion-events integration is introduced. The app's existing `trackEvent` helper sends analytics events to `gtag` and `dataLayer`; `/strategy-call-confirmed` fires `strategy_call_confirmed` on page load.
