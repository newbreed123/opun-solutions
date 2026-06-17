-- Opzix Audit internal scan logging.
-- Run this in the Supabase SQL editor for the project configured with
-- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

create extension if not exists "pgcrypto";

create table if not exists public.audit_scans (
  id uuid primary key default gen_random_uuid(),
  scan_id text unique not null,
  url text not null,
  normalized_domain text not null,
  score integer not null,
  status text not null,
  primary_concern text not null,
  archetype text null,
  industry text null,
  platform text not null,
  site_type text not null,
  ecommerce_probability_label text null,
  ecommerce_probability_score integer null,
  platform_confidence_label text null,
  platform_confidence_score integer null,
  platform_evidence jsonb not null default '[]'::jsonb,
  narrative_mode text null,
  business_context text null,
  recommended_action_style text null,
  traffic_readiness text null,
  tracking_readiness text null,
  trust_readiness text null,
  checkout_readiness text null,
  mobile_readiness text null,
  visual_ux_score integer null,
  visual_ux_findings jsonb not null default '[]'::jsonb,
  visual_ux_summary text null,
  visual_ux_mobile_concerns jsonb not null default '[]'::jsonb,
  visual_ux_desktop_concerns jsonb not null default '[]'::jsonb,
  top_issues jsonb not null default '[]'::jsonb,
  benchmark_tags jsonb not null default '[]'::jsonb,
  contact_submitted boolean not null default false,
  contact_email text null,
  contact_name text null,
  source text not null default 'opzix-audit',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists audit_scans_created_at_idx
  on public.audit_scans (created_at desc);

create index if not exists audit_scans_contact_submitted_idx
  on public.audit_scans (contact_submitted);

create index if not exists audit_scans_status_idx
  on public.audit_scans (status);

create index if not exists audit_scans_primary_concern_idx
  on public.audit_scans (primary_concern);

create or replace function public.set_audit_scans_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_audit_scans_updated_at on public.audit_scans;

create trigger set_audit_scans_updated_at
before update on public.audit_scans
for each row
execute function public.set_audit_scans_updated_at();
