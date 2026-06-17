-- Adds richer internal intelligence fields to Opzix Audit scan logging.
-- Safe to run more than once.

alter table public.audit_scans
  add column if not exists archetype text,
  add column if not exists industry text,
  add column if not exists platform text,
  add column if not exists site_type text,
  add column if not exists traffic_readiness text,
  add column if not exists tracking_readiness text,
  add column if not exists trust_readiness text,
  add column if not exists checkout_readiness text,
  add column if not exists mobile_readiness text;
