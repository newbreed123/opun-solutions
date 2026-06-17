-- Optional visual UX intelligence fields for Opzix Audit scan logging.
-- Run this in Supabase SQL editor for existing audit_scans tables.

alter table public.audit_scans
  add column if not exists visual_ux_score integer,
  add column if not exists visual_ux_findings jsonb not null default '[]'::jsonb,
  add column if not exists visual_ux_summary text,
  add column if not exists visual_ux_mobile_concerns jsonb not null default '[]'::jsonb,
  add column if not exists visual_ux_desktop_concerns jsonb not null default '[]'::jsonb;
