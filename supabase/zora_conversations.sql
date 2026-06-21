create table if not exists zora_conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text null,
  business_type text null,
  challenge text null,
  website_url text null,
  platform_hint text null,
  industry text null,
  inferred_industry text null,
  inferred_business_model text null,
  inferred_funnel_type text null,
  industry_confidence text null,
  industry_confidence_score numeric null,
  industry_evidence jsonb null,
  buyer_journey text null,
  primary_bottlenecks jsonb null,
  recommended_focus_areas jsonb null,
  optional_revenue_mention text null,
  current_step text null,
  intent text null,
  conversation_stage text null,
  current_topic text null,
  current_subtopic text null,
  recommended_next_step text null,
  recommendation_roadmap jsonb null,
  cta_clicked text null,
  conversation_outcome text null,
  lead_score integer null,
  lead_temperature text null,
  latest_user_message text null,
  latest_assistant_message text null,
  source_path text null,
  user_agent text null,
  audit_clicked boolean not null default false,
  strategy_call_clicked boolean not null default false,
  ask_question_clicked boolean not null default false,
  faq_opened boolean not null default false,
  contact_requested boolean not null default false,
  live_agent_requested boolean not null default false,
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
  add column if not exists industry text null;

alter table zora_conversations
  add column if not exists inferred_industry text null;

alter table zora_conversations
  add column if not exists inferred_business_model text null;

alter table zora_conversations
  add column if not exists inferred_funnel_type text null;

alter table zora_conversations
  add column if not exists industry_confidence text null;

alter table zora_conversations
  alter column industry_confidence type text
  using industry_confidence::text;

alter table zora_conversations
  add column if not exists industry_confidence_score numeric null;

alter table zora_conversations
  add column if not exists industry_evidence jsonb null;

alter table zora_conversations
  add column if not exists buyer_journey text null;

alter table zora_conversations
  add column if not exists primary_bottlenecks jsonb null;

alter table zora_conversations
  add column if not exists recommended_focus_areas jsonb null;

alter table zora_conversations
  add column if not exists optional_revenue_mention text null;

alter table zora_conversations
  add column if not exists current_step text null;

alter table zora_conversations
  add column if not exists intent text null;

alter table zora_conversations
  add column if not exists conversation_stage text null;

alter table zora_conversations
  add column if not exists current_topic text null;

alter table zora_conversations
  add column if not exists current_subtopic text null;

alter table zora_conversations
  add column if not exists recommended_next_step text null;

alter table zora_conversations
  add column if not exists recommendation_roadmap jsonb null;

alter table zora_conversations
  add column if not exists cta_clicked text null;

alter table zora_conversations
  add column if not exists conversation_outcome text null;

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
  add column if not exists ask_question_clicked boolean not null default false;

alter table zora_conversations
  add column if not exists faq_opened boolean not null default false;

alter table zora_conversations
  add column if not exists contact_requested boolean not null default false;

alter table zora_conversations
  add column if not exists live_agent_requested boolean not null default false;

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

create index if not exists zora_conversations_industry_idx
  on zora_conversations (industry);

create index if not exists zora_conversations_industry_confidence_idx
  on zora_conversations (industry_confidence);

create index if not exists zora_conversations_lead_temperature_idx
  on zora_conversations (lead_temperature);

create index if not exists zora_conversations_audit_clicked_idx
  on zora_conversations (audit_clicked);

create index if not exists zora_conversations_strategy_call_clicked_idx
  on zora_conversations (strategy_call_clicked);

create index if not exists zora_conversations_intent_idx
  on zora_conversations (intent);

create index if not exists zora_conversations_conversation_stage_idx
  on zora_conversations (conversation_stage);

create index if not exists zora_conversations_current_topic_idx
  on zora_conversations (current_topic);

create index if not exists zora_conversations_cta_clicked_idx
  on zora_conversations (cta_clicked);

create index if not exists zora_conversations_conversation_outcome_idx
  on zora_conversations (conversation_outcome);
