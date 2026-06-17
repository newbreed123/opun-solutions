alter table public.audit_scans
  add column if not exists benchmark_group text,
  add column if not exists benchmark_percentile_estimate integer,
  add column if not exists benchmark_label text,
  add column if not exists benchmark_explanation text;

create index if not exists audit_scans_benchmark_group_idx
  on public.audit_scans (benchmark_group);

