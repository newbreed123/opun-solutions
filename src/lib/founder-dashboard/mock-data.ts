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
