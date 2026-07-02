export type ZoraResponseIntent =
  | "company_background"
  | "pricing"
  | "action"
  | "audit_context"
  | "explainer"
  | "offer"
  | "solution_framework"
  | "brain_concept"
  | "playbook"
  | "industry_diagnosis"
  | "recommendation"
  | "qualification"
  | "faq"
  | "fallback";

export type ZoraStructuredResponse = {
  intent: ZoraResponseIntent;
  message: string;
  buttons?: Array<{
    label: string;
    action: string;
    href?: string;
  }>;
  action?: {
    type: string;
    url?: string;
  };
  updatedState?: Record<string, unknown>;
  recentTalkingPoint?: string;
};
