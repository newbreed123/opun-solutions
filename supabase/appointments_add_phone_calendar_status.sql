alter table appointments
  add column if not exists phone text,
  add column if not exists service_requested text,
  add column if not exists google_meet_url text,
  add column if not exists calendar_sync_status text not null default 'pending',
  add column if not exists calendar_sync_error text,
  add column if not exists meet_link_email_sent_at timestamptz;

create index if not exists appointments_calendar_sync_status_idx
  on appointments(calendar_sync_status);
