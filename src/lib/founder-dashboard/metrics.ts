import type { FounderDashboardMetrics, FunnelStep } from "./types";

const funnelDefinitions: Array<{
  key: keyof FounderDashboardMetrics;
  label: string;
}> = [
  { key: "auditStarted", label: "Audit Started" },
  { key: "auditCompleted", label: "Audit Completed" },
  { key: "auditAssistantPrompts", label: "Audit Assistant Prompt Clicked" },
  { key: "zoraConversations", label: "Zora Conversation Started" },
  { key: "strategyCallsBooked", label: "Strategy Call Booked" },
  { key: "contactFormsSubmitted", label: "Contact Form Submitted" },
];

export function calculateFunnelRates(
  metrics: FounderDashboardMetrics,
): FunnelStep[] {
  return funnelDefinitions.map((definition, index) => {
    const previousStep = index > 0 ? funnelDefinitions[index - 1] : null;
    const previousCount = previousStep ? metrics[previousStep.key] : null;
    const count = metrics[definition.key];

    return {
      key: definition.key,
      label: definition.label,
      count,
      conversionFromPrevious:
        previousCount === null ? null : percentage(count, previousCount),
    };
  });
}

export function percentage(count: number, total: number) {
  return total === 0 ? 0 : (count / total) * 100;
}
