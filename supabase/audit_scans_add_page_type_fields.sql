alter table public.audit_scans
  add column if not exists submitted_page_type text,
  add column if not exists submitted_page_type_confidence integer,
  add column if not exists submitted_page_type_evidence jsonb not null default '[]'::jsonb,
  add column if not exists scoring_confidence text,
  add column if not exists revenue_risk_areas jsonb not null default '[]'::jsonb,
  add column if not exists recommendation_roadmap jsonb not null default '{}'::jsonb,
  add column if not exists competitive_context jsonb not null default '{}'::jsonb,
  add column if not exists scan_coverage jsonb not null default '{}'::jsonb;

create index if not exists audit_scans_submitted_page_type_idx
  on public.audit_scans (submitted_page_type);

create index if not exists audit_scans_scoring_confidence_idx
  on public.audit_scans (scoring_confidence);
