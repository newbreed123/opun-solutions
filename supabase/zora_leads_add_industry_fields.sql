alter table zora_conversations
  add column if not exists industry text null;

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

create index if not exists zora_conversations_industry_idx
  on zora_conversations (industry);

create index if not exists zora_conversations_industry_confidence_idx
  on zora_conversations (industry_confidence);
