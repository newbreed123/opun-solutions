-- Additive Zora conversation intelligence schema.
-- Keeps the existing zora_conversations write path intact while adding
-- durable transcripts, prompt version tracking, replay correlation, and
-- persisted founder-only review results.

create extension if not exists "pgcrypto";

alter table public.zora_conversations
  add column if not exists updated_at timestamptz not null default now();

alter table public.zora_conversations
  add column if not exists visitor_session_id text null;

alter table public.zora_conversations
  add column if not exists landing_page text null;

alter table public.zora_conversations
  add column if not exists page_url text null;

alter table public.zora_conversations
  add column if not exists referrer text null;

alter table public.zora_conversations
  add column if not exists source text null;

alter table public.zora_conversations
  add column if not exists medium text null;

alter table public.zora_conversations
  add column if not exists campaign text null;

alter table public.zora_conversations
  add column if not exists prompt_version text null;

alter table public.zora_conversations
  add column if not exists conversation_flow_version text null;

alter table public.zora_conversations
  add column if not exists model_version text null;

alter table public.zora_conversations
  add column if not exists experiment_id text null;

alter table public.zora_conversations
  add column if not exists clarity_session_id text null;

alter table public.zora_conversations
  add column if not exists persistence_error text null;

alter table public.zora_conversations
  add column if not exists redaction_applied boolean not null default true;

create index if not exists zora_conversations_visitor_session_id_idx
  on public.zora_conversations (visitor_session_id);

create index if not exists zora_conversations_source_idx
  on public.zora_conversations (source);

create index if not exists zora_conversations_campaign_idx
  on public.zora_conversations (campaign);

create index if not exists zora_conversations_prompt_version_idx
  on public.zora_conversations (prompt_version);

create index if not exists zora_conversations_website_url_idx
  on public.zora_conversations (website_url);

create table if not exists public.zora_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_row_id uuid null references public.zora_conversations(id) on delete set null,
  conversation_id text not null,
  visitor_session_id text null,
  session_id text null,
  role text not null check (role in ('user', 'assistant')),
  message_text text not null,
  page_url text null,
  source_path text null,
  source text null,
  medium text null,
  campaign text null,
  prompt_version text null,
  model_version text null,
  redaction_applied boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists zora_messages_conversation_id_idx
  on public.zora_messages (conversation_id);

create index if not exists zora_messages_conversation_row_id_idx
  on public.zora_messages (conversation_row_id);

create index if not exists zora_messages_session_id_idx
  on public.zora_messages (session_id);

create index if not exists zora_messages_created_at_idx
  on public.zora_messages (created_at);

create table if not exists public.zora_conversation_reviews (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  visitor_session_id text null,
  overall_score integer null check (overall_score >= 0 and overall_score <= 100),
  answered_question boolean null,
  answer_accuracy integer null check (answer_accuracy >= 0 and answer_accuracy <= 100),
  answer_relevance integer null check (answer_relevance >= 0 and answer_relevance <= 100),
  clarity integer null check (clarity >= 0 and clarity <= 100),
  tone integer null check (tone >= 0 and tone <= 100),
  discovery_quality integer null check (discovery_quality >= 0 and discovery_quality <= 100),
  qualification_quality integer null check (qualification_quality >= 0 and qualification_quality <= 100),
  asked_for_website boolean null,
  explained_free_audit boolean null,
  recommended_correct_next_step boolean null,
  handled_objection boolean null,
  repeated_itself boolean null,
  used_excessive_jargon boolean null,
  likely_dropoff_reason text null,
  missed_opportunities jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  recommended_improvement text null,
  suggested_better_response text null,
  review_confidence text null,
  reviewed_at timestamptz not null default now(),
  prompt_version text not null,
  model_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists zora_conversation_reviews_conversation_id_idx
  on public.zora_conversation_reviews (conversation_id);

create index if not exists zora_conversation_reviews_reviewed_at_idx
  on public.zora_conversation_reviews (reviewed_at desc);

alter table public.zora_messages enable row level security;
alter table public.zora_conversation_reviews enable row level security;

revoke all on public.zora_messages from anon;
revoke all on public.zora_messages from authenticated;
revoke all on public.zora_conversation_reviews from anon;
revoke all on public.zora_conversation_reviews from authenticated;

grant all on public.zora_messages to service_role;
grant all on public.zora_conversation_reviews to service_role;

drop policy if exists "Service role can manage zora messages"
  on public.zora_messages;

create policy "Service role can manage zora messages"
  on public.zora_messages
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Service role can manage zora conversation reviews"
  on public.zora_conversation_reviews;

create policy "Service role can manage zora conversation reviews"
  on public.zora_conversation_reviews
  for all
  to service_role
  using (true)
  with check (true);
