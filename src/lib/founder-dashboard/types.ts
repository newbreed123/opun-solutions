export type FounderDashboardEventName =
  | "audit_started"
  | "audit_completed"
  | "zora_conversation_started"
  | "audit_assistant_prompt_clicked"
  | "strategy_call_booked"
  | "contact_form_submitted"
  | "zora_qualified_lead"
  | "pdf_downloaded"
  | "strategy_call_clicked";

export type FounderDashboardMetrics = {
  visitors: number;
  auditStarted: number;
  auditCompleted: number;
  auditAssistantPrompts: number;
  zoraConversations: number;
  strategyCallsBooked: number;
  contactFormsSubmitted: number;
  zoraQualifiedLeads: number;
};

export type FunnelStep = {
  key: keyof FounderDashboardMetrics;
  label: string;
  count: number;
  conversionFromPrevious: number | null;
};

export type FounderDashboardEvent = {
  id: string;
  eventName: FounderDashboardEventName;
  source?: string;
  websiteUrl?: string;
  scanId?: string;
  businessType?: string;
  challenge?: string;
  industry?: string;
  createdAt: string;
};

export type FounderEvent = {
  id: string;
  eventName: FounderDashboardEventName;
  label: string;
  occurredAt: string;
  source: string;
  websiteUrl?: string;
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
