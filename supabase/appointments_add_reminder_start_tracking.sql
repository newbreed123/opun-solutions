alter table appointments
  add column if not exists reminder_24h_start_at timestamptz,
  add column if not exists reminder_1h_start_at timestamptz;

create index if not exists appointments_reminder_24h_start_at_idx
  on appointments(reminder_24h_start_at);

create index if not exists appointments_reminder_1h_start_at_idx
  on appointments(reminder_1h_start_at);
