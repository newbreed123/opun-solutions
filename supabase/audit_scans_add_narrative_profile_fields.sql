-- Adds Phase 4 narrative profile fields to Opzix Audit scan logging.
-- Safe to run more than once.

alter table public.audit_scans
  add column if not exists narrative_mode text,
  add column if not exists business_context text,
  add column if not exists recommended_action_style text;
