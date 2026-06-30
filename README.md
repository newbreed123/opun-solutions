# Opzix Solutions

## Google Ads Appointment Conversion Tracking

Google Ads appointment conversion tracking should use URL-based tracking for the primary conversion:

- Primary conversion: visit to `/strategy-call-confirmed`

Secondary conversions to configure in analytics or ads reporting:

- `audit_completed`
- `contact_form_submitted`
- `zora_qualified_conversation`
- `scanner_report_generated`

Do not add Google Ads scripts directly in app code unless a standard conversion-events integration is introduced. The app's existing `trackEvent` helper sends analytics events to `gtag` and `dataLayer`; `/strategy-call-confirmed` fires `strategy_call_confirmed` on page load.
