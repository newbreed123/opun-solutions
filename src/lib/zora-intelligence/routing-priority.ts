export const ZORA_ROUTING_PRIORITY = [
  "company_background",
  "pricing",
  "action",
  "audit_context",
  "active_playbook_answer",
  "explainer",
  "offer",
  "solution_framework",
  "brain_concept",
  "industry_diagnosis",
  "recommendation",
  "qualification",
  "faq",
  "fallback",
] as const;

export type ZoraRoutingPriority = (typeof ZORA_ROUTING_PRIORITY)[number];

export const ZORA_ROUTING_PRIORITY_RANK: Record<ZoraRoutingPriority, number> =
  ZORA_ROUTING_PRIORITY.reduce(
    (rankMap, intent, index) => ({
      ...rankMap,
      [intent]: index + 1,
    }),
    {} as Record<ZoraRoutingPriority, number>,
  );
