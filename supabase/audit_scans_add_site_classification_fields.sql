-- Migration: add site classification fields to audit_scans

alter table public.audit_scans
add column if not exists site_type_confidence_label text;

alter table public.audit_scans
add column if not exists site_type_confidence_score integer;

alter table public.audit_scans
add column if not exists site_type_evidence jsonb;

-- keep migration idempotent; columns will only be added if missing
