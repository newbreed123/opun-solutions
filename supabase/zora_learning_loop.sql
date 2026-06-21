-- Phase 1 Zora learning loop.
-- Run this in the Supabase SQL editor for the project configured with
-- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.

alter table zora_conversations
  add column if not exists intent text null;

alter table zora_conversations
  add column if not exists conversation_stage text null;

alter table zora_conversations
  add column if not exists current_topic text null;

alter table zora_conversations
  add column if not exists current_subtopic text null;

alter table zora_conversations
  add column if not exists cta_clicked text null;

alter table zora_conversations
  add column if not exists conversation_outcome text null;

alter table zora_conversations
  add column if not exists ask_question_clicked boolean not null default false;

alter table zora_conversations
  add column if not exists faq_opened boolean not null default false;

alter table zora_conversations
  add column if not exists contact_requested boolean not null default false;

alter table zora_conversations
  add column if not exists live_agent_requested boolean not null default false;

create table if not exists zora_failures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id text null,
  user_message text null,
  assistant_response text null,
  detected_intent text null,
  failure_reason text null,
  business_type text null,
  challenge text null,
  website_url text null,
  lead_temperature text null,
  reviewed boolean not null default false,
  notes text null
);

create table if not exists zora_learning (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  intent text null,
  business_type text null,
  challenge text null,
  user_message text null,
  assistant_response text null,
  cta_clicked text null,
  conversion_outcome text null,
  audit_clicked boolean not null default false,
  strategy_call_clicked boolean not null default false,
  response_score numeric null,
  notes text null
);

create table if not exists zora_playbooks (
  id text primary key,
  intent text not null,
  business_type text null,
  challenge text null,
  question_pattern text not null,
  best_response text not null,
  response_notes text null,
  primary_cta text null,
  secondary_cta text null,
  usage_count integer not null default 0,
  audit_click_count integer not null default 0,
  strategy_call_click_count integer not null default 0,
  success_rate numeric null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into zora_playbooks (
  id,
  intent,
  question_pattern,
  best_response,
  response_notes,
  primary_cta,
  secondary_cta
)
values
  (
    'pricing_question_default',
    'pricing_question',
    '\\b(how much|cost|price|pricing|free audit|audit cost)\\b',
    'The audit is completely free. We use it to give you a data-backed starting point before discussing implementation. If you already have a live website, the audit is usually the fastest next step.',
    'Answer the cost/free question in the first sentence.',
    'Run Free Audit',
    null
  ),
  (
    'live_agent_request_default',
    'live_agent_request',
    '\\b(live agent|human|person|someone|talk to|speak to|contact|call me|representative)\\b',
    'Absolutely. If you''d rather speak with a person, the best next step is a strategy call with Opzix.',
    'Route to a human path without over-explaining.',
    'Book Strategy Call',
    null
  ),
  (
    'review_request_default',
    'review_request',
    '\\b(review|take a look|thoughts|what do you think|initial opinion)\\b',
    'I can give you a directional review based on the context you''ve provided, but I won''t claim confirmed findings until the audit runs. Directionally, I would look at [context-specific focus areas].',
    'Keep review distinct from scanner execution.',
    'Run Free Audit',
    'Book Strategy Call'
  ),
  (
    'audit_request_default',
    'audit_request',
    '\\b(run|start|scan|audit)\\b',
    'Yes. If you have a live URL, the free audit can scan the site and generate a starting roadmap.',
    'Prefer scanner route when a website URL exists.',
    'Run Free Audit',
    null
  ),
  (
    'out_of_scope_default',
    'out_of_scope',
    '.*',
    'I probably can''t help with that directly. Opzix focuses on websites, ecommerce systems, AI assistants, automation, tracking, dashboards, integrations, and lead generation systems.',
    'Redirect only to relevant Opzix scope.',
    'Ask a Question',
    null
  )
on conflict (id) do update set
  intent = excluded.intent,
  question_pattern = excluded.question_pattern,
  best_response = excluded.best_response,
  response_notes = excluded.response_notes,
  primary_cta = excluded.primary_cta,
  secondary_cta = excluded.secondary_cta,
  is_active = true,
  updated_at = now();

create index if not exists zora_failures_created_at_idx
  on zora_failures (created_at desc);

create index if not exists zora_failures_session_id_idx
  on zora_failures (session_id);

create index if not exists zora_failures_reason_idx
  on zora_failures (failure_reason);

create index if not exists zora_failures_reviewed_idx
  on zora_failures (reviewed);

create index if not exists zora_learning_created_at_idx
  on zora_learning (created_at desc);

create index if not exists zora_learning_intent_idx
  on zora_learning (intent);

create index if not exists zora_learning_cta_clicked_idx
  on zora_learning (cta_clicked);

create index if not exists zora_playbooks_intent_idx
  on zora_playbooks (intent);

create index if not exists zora_playbooks_active_idx
  on zora_playbooks (is_active);
