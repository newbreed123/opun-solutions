-- Founder Dashboard conversion event storage.
--
-- This table powers the v2/v3 Founder Dashboard metrics read through
-- src/lib/conversion-event-log.ts. Events are written by server-side Next.js
-- routes such as /api/conversion-event, /api/founder-dashboard/events, and
-- /api/booking-conversion. Browser clients should not write directly to this
-- table.

create extension if not exists "pgcrypto";

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  source text null,
  page_path text null,
  website_url text null,
  scan_id text null,
  business_type text null,
  challenge text null,
  industry text null,
  lead_score numeric null,
  lead_temperature text null,
  session_id text null,
  utm_campaign text null,
  utm_source text null,
  utm_medium text null,
  gclid text null,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  calendly_payload jsonb null,
  user_agent text null,
  created_at timestamptz not null default now()
);

comment on table public.conversion_events is
  'Server-written conversion and founder dashboard events used for Opzix Founder Dashboard metrics.';

comment on column public.conversion_events.payload is
  'Structured event payload expected by src/lib/conversion-event-log.ts. Do not store private emails, phone numbers, names, or raw chat transcripts.';

comment on column public.conversion_events.metadata is
  'Optional non-sensitive metadata for future dashboard attribution; current app reads payload.';

create index if not exists conversion_events_created_at_idx
  on public.conversion_events (created_at desc);

create index if not exists conversion_events_event_name_idx
  on public.conversion_events (event_name);

create index if not exists conversion_events_scan_id_idx
  on public.conversion_events (scan_id);

create index if not exists conversion_events_source_idx
  on public.conversion_events (source);

create index if not exists conversion_events_session_id_idx
  on public.conversion_events (session_id);

create or replace function public.normalize_conversion_event_fields()
returns trigger as $$
begin
  if new.payload is null then
    new.payload = '{}'::jsonb;
  end if;

  if new.metadata is null then
    new.metadata = '{}'::jsonb;
  end if;

  new.scan_id = coalesce(nullif(new.scan_id, ''), nullif(new.payload->>'scanId', ''));
  new.industry = coalesce(nullif(new.industry, ''), nullif(new.payload->>'industry', ''));

  return new;
end;
$$ language plpgsql;

drop trigger if exists normalize_conversion_event_fields
  on public.conversion_events;

create trigger normalize_conversion_event_fields
before insert or update on public.conversion_events
for each row
execute function public.normalize_conversion_event_fields();

alter table public.conversion_events enable row level security;

revoke all on public.conversion_events from anon;
revoke all on public.conversion_events from authenticated;

grant all on public.conversion_events to service_role;

drop policy if exists "Service role can manage conversion events"
  on public.conversion_events;

create policy "Service role can manage conversion events"
  on public.conversion_events
  for all
  to service_role
  using (true)
  with check (true);
