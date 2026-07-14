export type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export type AppointmentType = "strategy_session";

export type SchedulingContext = {
  source?: string;
  serviceRequested?: string;
  scanId?: string;
  sessionId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  gclid?: string;
  websiteDomain?: string;
  businessType?: string;
  challenge?: string;
  industry?: string;
};

export type AppointmentInput = SchedulingContext & {
  startAt: string;
  timezone: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  website?: string;
  message?: string;
  idempotencyKey?: string;
};

export type AppointmentRecord = {
  id: string;
  public_token?: string | null;
  idempotency_key?: string | null;
  created_at: string;
  updated_at: string;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  start_at: string;
  end_at: string;
  timezone: string;
  name: string;
  email: string;
  phone: string | null;
  business_name: string | null;
  website_domain: string | null;
  business_type: string | null;
  challenge: string | null;
  service_requested: string | null;
  industry: string | null;
  message: string | null;
  source: string | null;
  scan_id: string | null;
  session_id: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  gclid: string | null;
  google_calendar_event_id: string | null;
  meeting_url: string | null;
  google_meet_url: string | null;
  calendar_sync_status: "pending" | "synced" | "failed" | "skipped" | null;
  calendar_sync_error: string | null;
  confirmation_sent_at: string | null;
  reminder_24h_sent_at: string | null;
  reminder_24h_start_at: string | null;
  reminder_1h_sent_at: string | null;
  reminder_1h_start_at: string | null;
  cancelled_at: string | null;
  rescheduled_from_id: string | null;
};

export type AvailabilitySlot = {
  startAt: string;
  endAt: string;
  timezone: string;
  label: string;
  dateLabel: string;
  timeLabel: string;
};

export type AppointmentPublicSummary = {
  id: string;
  startAt: string;
  endAt: string;
  timezone: string;
  dateTimeLabel: string;
  meetingUrl?: string;
  status: AppointmentStatus;
  hasAuditContext: boolean;
};
