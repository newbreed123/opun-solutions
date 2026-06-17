create table if not exists assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  scan_id text null,
  domain text null,
  question text not null,
  detected_intent text not null,
  intent_confidence text not null,
  answer_preview text null,
  site_type text null,
  score integer null,
  scoring_confidence text null,
  lead_submitted boolean not null default false,
  contact_clicked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table assistant_conversations
  add column if not exists lead_submitted boolean not null default false;

alter table assistant_conversations
  add column if not exists contact_clicked boolean not null default false;

create index if not exists assistant_conversations_created_at_idx
  on assistant_conversations (created_at desc);

create index if not exists assistant_conversations_detected_intent_idx
  on assistant_conversations (detected_intent);

create index if not exists assistant_conversations_domain_idx
  on assistant_conversations (domain);

create index if not exists assistant_conversations_lead_submitted_idx
  on assistant_conversations (lead_submitted);
