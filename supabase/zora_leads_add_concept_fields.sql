alter table zora_conversations
  add column if not exists detected_concept text null;

alter table zora_conversations
  add column if not exists concept_confidence text null;

alter table zora_conversations
  add column if not exists recent_talking_point text null;

create index if not exists zora_conversations_detected_concept_idx
  on zora_conversations (detected_concept);

create index if not exists zora_conversations_concept_confidence_idx
  on zora_conversations (concept_confidence);
