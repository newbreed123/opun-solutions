create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'appointment_status') then
    create type appointment_status as enum (
      'pending',
      'confirmed',
      'cancelled',
      'completed',
      'no_show'
    );
  end if;
end $$;

create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  public_token text not null default encode(gen_random_bytes(24), 'hex'),
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  appointment_type text not null default 'strategy_session',
  status appointment_status not null default 'pending',

  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,

  name text not null,
  email text not null,
  business_name text,
  website_domain text,
  business_type text,
  challenge text,
  service_requested text,
  industry text,
  message text,

  source text,
  scan_id text,
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  gclid text,

  google_calendar_event_id text,
  meeting_url text,
  google_meet_url text,
  calendar_sync_status text not null default 'pending',
  calendar_sync_error text,

  confirmation_sent_at timestamptz,
  meet_link_email_sent_at timestamptz,
  reminder_24h_sent_at timestamptz,
  reminder_24h_start_at timestamptz,
  reminder_1h_sent_at timestamptz,
  reminder_1h_start_at timestamptz,
  cancelled_at timestamptz,
  rescheduled_from_id uuid references appointments(id)
);

alter table appointments enable row level security;

drop policy if exists "No anonymous appointment reads" on appointments;
create policy "No anonymous appointment reads"
  on appointments for select
  using (false);

create index if not exists appointments_start_at_idx on appointments(start_at);
create index if not exists appointments_status_idx on appointments(status);
create index if not exists appointments_email_idx on appointments(email);
create index if not exists appointments_created_at_idx on appointments(created_at);
create index if not exists appointments_google_calendar_event_id_idx on appointments(google_calendar_event_id);
create unique index if not exists appointments_public_token_idx on appointments(public_token);
create unique index if not exists appointments_active_start_at_idx
  on appointments(start_at)
  where status in ('pending', 'confirmed');
