create table if not exists zora_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text null,
  business_type text null,
  challenge text null,
  website_url text null,
  platform_hint text null,
  inferred_industry text null,
  inferred_business_model text null,
  inferred_funnel_type text null,
  industry_confidence numeric null,
  optional_revenue_mention text null,
  current_step text null,
  recommended_next_step text null,
  recommendation_roadmap jsonb null,
  lead_score integer null,
  lead_temperature text null,
  latest_user_message text null,
  latest_assistant_message text null,
  source_path text null,
  user_agent text null,
  audit_clicked boolean not null default false,
  strategy_call_clicked boolean not null default false,
  email_submitted boolean not null default false
);

alter table zora_conversations
  add column if not exists session_id text null;

alter table zora_conversations
  add column if not exists business_type text null;

alter table zora_conversations
  add column if not exists challenge text null;

alter table zora_conversations
  add column if not exists website_url text null;

alter table zora_conversations
  add column if not exists platform_hint text null;

alter table zora_conversations
  add column if not exists inferred_industry text null;

alter table zora_conversations
  add column if not exists inferred_business_model text null;

alter table zora_conversations
  add column if not exists inferred_funnel_type text null;

alter table zora_conversations
  add column if not exists industry_confidence numeric null;

alter table zora_conversations
  add column if not exists optional_revenue_mention text null;

alter table zora_conversations
  add column if not exists current_step text null;

alter table zora_conversations
  add column if not exists recommended_next_step text null;

alter table zora_conversations
  add column if not exists recommendation_roadmap jsonb null;

alter table zora_conversations
  add column if not exists lead_score integer null;

alter table zora_conversations
  add column if not exists lead_temperature text null;

alter table zora_conversations
  add column if not exists latest_user_message text null;

alter table zora_conversations
  add column if not exists latest_assistant_message text null;

alter table zora_conversations
  add column if not exists source_path text null;

alter table zora_conversations
  add column if not exists user_agent text null;

alter table zora_conversations
  add column if not exists audit_clicked boolean not null default false;

alter table zora_conversations
  add column if not exists strategy_call_clicked boolean not null default false;

alter table zora_conversations
  add column if not exists email_submitted boolean not null default false;

create index if not exists zora_conversations_created_at_idx
  on zora_conversations (created_at desc);

create index if not exists zora_conversations_session_id_idx
  on zora_conversations (session_id);

create index if not exists zora_conversations_business_type_idx
  on zora_conversations (business_type);

create index if not exists zora_conversations_challenge_idx
  on zora_conversations (challenge);

create index if not exists zora_conversations_lead_temperature_idx
  on zora_conversations (lead_temperature);

create index if not exists zora_conversations_audit_clicked_idx
  on zora_conversations (audit_clicked);

create index if not exists zora_conversations_strategy_call_clicked_idx
  on zora_conversations (strategy_call_clicked);
