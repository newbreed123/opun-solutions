alter table public.audit_scans
  add column if not exists recommendation_roadmap jsonb not null default '{}'::jsonb;
