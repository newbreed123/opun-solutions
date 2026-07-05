export type FounderDashboardMetrics = {
  visitors: number;
  auditStarted: number;
  auditCompleted: number;
  auditAssistantPrompts: number;
  zoraConversations: number;
  strategyCallsBooked: number;
  contactFormsSubmitted: number;
};

export type FunnelStep = {
  key: keyof FounderDashboardMetrics;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
};

export type FounderEvent = {
  id: string;
  eventName:
    | "audit_started"
    | "audit_completed"
    | "zora_conversation_started"
    | "strategy_call_booked"
    | "contact_form_submitted";
  label: string;
  occurredAt: string;
  source: string;
};

export type ProblemCategory = {
  label: string;
  count: number;
  note: string;
};

export type IndustryCategory = {
  label: string;
  count: number;
  note: string;
};
