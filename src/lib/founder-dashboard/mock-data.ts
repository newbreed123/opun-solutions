import type {
  ZoraIntelligenceInsights,
} from "./events";
import type {
  FounderDashboardMetrics,
  FounderEvent,
  IndustryCategory,
  ProblemCategory,
} from "./types";

export const demoFounderDashboardMetrics: FounderDashboardMetrics = {
  visitors: 1840,
  auditStarted: 326,
  auditCompleted: 271,
  auditAssistantPrompts: 118,
  zoraConversations: 84,
  strategyCallsBooked: 19,
  contactFormsSubmitted: 27,
  zoraQualifiedLeads: 31,
};

export const demoProblemCategories: ProblemCategory[] = [
  {
    label: "Getting Traffic",
    count: 42,
    note: "Placeholder until Zora lead profile data is connected.",
  },
  {
    label: "Converting Visitors",
    count: 38,
    note: "Placeholder until Zora lead profile data is connected.",
  },
  {
    label: "Lead Follow-up",
    count: 24,
    note: "Placeholder until Zora lead profile data is connected.",
  },
  {
    label: "Operations",
    count: 19,
    note: "Placeholder until Zora lead profile data is connected.",
  },
  {
    label: "Tracking",
    count: 16,
    note: "Placeholder until Zora lead profile data is connected.",
  },
  {
    label: "Not Sure",
    count: 11,
    note: "Placeholder until Zora lead profile data is connected.",
  },
];

export const demoIndustryCategories: IndustryCategory[] = [
  {
    label: "Ecommerce",
    count: 48,
    note: "Placeholder until qualification and scanner detection are connected.",
  },
  {
    label: "Service Business",
    count: 36,
    note: "Placeholder until qualification and scanner detection are connected.",
  },
  {
    label: "Real Estate",
    count: 17,
    note: "Placeholder until qualification and scanner detection are connected.",
  },
  {
    label: "Healthcare / Care",
    count: 14,
    note: "Placeholder until qualification and scanner detection are connected.",
  },
  {
    label: "Manufacturing / B2B",
    count: 12,
    note: "Placeholder until qualification and scanner detection are connected.",
  },
  {
    label: "Other",
    count: 9,
    note: "Placeholder until qualification and scanner detection are connected.",
  },
];

export const demoRecentFounderEvents: FounderEvent[] = [
  {
    id: "demo-event-001",
    eventName: "audit_started",
    label: "Audit started",
    occurredAt: "2026-07-05T13:42:00.000Z",
    source: "Ecommerce audit scanner",
  },
  {
    id: "demo-event-002",
    eventName: "audit_completed",
    label: "Audit completed",
    occurredAt: "2026-07-05T13:45:00.000Z",
    source: "Ecommerce audit scanner",
  },
  {
    id: "demo-event-003",
    eventName: "zora_conversation_started",
    label: "Zora conversation started",
    occurredAt: "2026-07-05T14:03:00.000Z",
    source: "Zora assistant",
  },
  {
    id: "demo-event-004",
    eventName: "strategy_call_booked",
    label: "Strategy call booked",
    occurredAt: "2026-07-05T14:18:00.000Z",
    source: "Strategy call flow",
  },
  {
    id: "demo-event-005",
    eventName: "contact_form_submitted",
    label: "Contact form submitted",
    occurredAt: "2026-07-05T14:36:00.000Z",
    source: "Contact form",
  },
];

export const demoZoraIntelligenceInsights: ZoraIntelligenceInsights = {
  hasRealZoraInsightEvents: false,
  totalZoraConversations: 84,
  qualifiedZoraLeads: 31,
  leadProfileCompleted: 37,
  leadProfileCompletionRate: 44,
  lowConfidenceFallbacks: 9,
  lowConfidenceFallbackRate: 10.7,
  ctaClicksFromZora: 46,
  ctaClickRate: 54.8,
  qualifiedLeadRate: 36.9,
  conversationsWithBusinessType: 52,
  conversationsWithChallenge: 44,
  conversationsWithWebsiteDomain: 39,
  conversationsWithAllProfileFields: 28,
  strategyCallClicksAfterZora: 18,
  topZoraIntents: [
    { label: "offer", count: 26 },
    { label: "solution_framework", count: 21 },
    { label: "brain_concept", count: 14 },
    { label: "audit_context", count: 11 },
    { label: "pricing", count: 7 },
    { label: "fallback", count: 5 },
  ],
  topZoraConcepts: [
    { label: "tracking_visibility", count: 14 },
    { label: "conversion_path", count: 11 },
    { label: "lead_follow_up", count: 8 },
    { label: "customer_journey", count: 7 },
  ],
  topZoraOffers: [
    { label: "ai_assistant_chatbot", count: 17 },
    { label: "analytics_tracking", count: 13 },
    { label: "ecommerce_storefront", count: 10 },
    { label: "crm_email_automation", count: 8 },
  ],
  topSolutionFrameworks: [
    { label: "traffic_growth", count: 18 },
    { label: "conversion_improvement", count: 16 },
    { label: "follow_up_system", count: 10 },
    { label: "tracking_visibility", count: 9 },
    { label: "ai_assistant_adoption", count: 8 },
    { label: "ecommerce_growth", count: 7 },
    { label: "business_systems", count: 5 },
  ],
  topPlaybooks: [
    { label: "client_dashboard", count: 7 },
    { label: "audit_next_step", count: 6 },
    { label: "manual_review", count: 4 },
  ],
  topQuestionSummaries: [
    { label: "Asked about AI chatbot", count: 16 },
    { label: "Asked how Opzix can help with traffic", count: 13 },
    { label: "Asked about tracking", count: 11 },
    { label: "Asked about converting visitors", count: 9 },
    { label: "Asked about pricing", count: 7 },
  ],
};
