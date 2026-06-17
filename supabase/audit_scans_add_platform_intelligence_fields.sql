-- Adds Phase 2 platform intelligence fields to Opzix Audit scan logging.
-- Safe to run more than once.

alter table public.audit_scans
  add column if not exists ecommerce_probability_label text,
  add column if not exists ecommerce_probability_score integer,
  add column if not exists platform_confidence_label text,
  add column if not exists platform_confidence_score integer,
  add column if not exists platform_evidence jsonb not null default '[]'::jsonb;
