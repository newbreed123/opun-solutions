import {
  listConversionEvents,
  logConversionEvent,
  type ConversionEventRow,
} from "@/lib/conversion-event-log";
import type {
  FounderDashboardEvent,
  FounderDashboardEventName,
  FounderDashboardMetrics,
} from "./types";
import {
  sanitizeWebsiteToDomain,
  stripPII,
  summarizeZoraQuestion,
} from "./sanitize";

export type { FounderDashboardEvent, FounderDashboardEventName } from "./types";

export type FounderDashboardEventInput = {
  eventName: FounderDashboardEventName;
  source?: string;
  websiteUrl?: string;
  websiteDomain?: string;
  scanId?: string;
  businessType?: string;
  challenge?: string;
  industry?: string;
  detectedIntent?: string;
  detectedConcept?: string;
  detectedOffer?: string;
  detectedFramework?: string;
  detectedPlaybook?: string;
  ctaType?: string;
  confidence?: number;
  messageCategory?: string;
  sanitizedQuestionSummary?: string;
  createdAt?: string;
};

export type FounderDashboardEventQuery = {
  from?: string;
  to?: string;
};

export type FounderDashboardData = {
  metrics: FounderDashboardMetrics;
  events: FounderDashboardEvent[];
  topProblems: Array<{ label: string; count: number }>;
  topIndustries: Array<{ label: string; count: number }>;
  zoraInsights: ZoraIntelligenceInsights;
};

export type ZoraIntelligenceInsights = {
  hasRealZoraInsightEvents: boolean;
  totalZoraConversations: number;
  qualifiedZoraLeads: number;
  leadProfileCompleted: number;
  leadProfileCompletionRate: number;
  lowConfidenceFallbacks: number;
  lowConfidenceFallbackRate: number;
  ctaClicksFromZora: number;
  ctaClickRate: number;
  qualifiedLeadRate: number;
  conversationsWithBusinessType: number;
  conversationsWithChallenge: number;
  conversationsWithWebsiteDomain: number;
  conversationsWithAllProfileFields: number;
  strategyCallClicksAfterZora: number;
  topZoraIntents: Array<{ label: string; count: number }>;
  topZoraConcepts: Array<{ label: string; count: number }>;
  topZoraOffers: Array<{ label: string; count: number }>;
  topSolutionFrameworks: Array<{ label: string; count: number }>;
  topPlaybooks: Array<{ label: string; count: number }>;
  topQuestionSummaries: Array<{ label: string; count: number }>;
};

const allowedFounderEvents = new Set<FounderDashboardEventName>([
  "audit_started",
  "audit_completed",
  "zora_conversation_started",
  "audit_assistant_prompt_clicked",
  "strategy_call_booked",
  "contact_form_submitted",
  "zora_qualified_lead",
  "pdf_downloaded",
  "strategy_call_clicked",
  "zora_message_received",
  "zora_intent_detected",
  "zora_concept_detected",
  "zora_offer_detected",
  "zora_solution_framework_used",
  "zora_playbook_used",
  "zora_low_confidence_fallback",
  "zora_lead_profile_completed",
  "zora_cta_clicked",
]);

export function isFounderDashboardEventName(
  value: string,
): value is FounderDashboardEventName {
  return allowedFounderEvents.has(value as FounderDashboardEventName);
}

export async function recordFounderEvent(event: FounderDashboardEventInput) {
  if (!isFounderDashboardEventName(event.eventName)) {
    return { ok: false as const, skipped: false, error: "Invalid founder event." };
  }

  const safeEvent = sanitizeFounderEvent(event);

  return logConversionEvent({
    eventName: safeEvent.eventName,
    payload: {
      source: safeEvent.source,
      websiteUrl: safeEvent.websiteUrl,
      websiteDomain: safeEvent.websiteDomain,
      scanId: safeEvent.scanId,
      businessType: safeEvent.businessType,
      challenge: safeEvent.challenge,
      industry: safeEvent.industry,
      detectedIntent: safeEvent.detectedIntent,
      detectedConcept: safeEvent.detectedConcept,
      detectedOffer: safeEvent.detectedOffer,
      detectedFramework: safeEvent.detectedFramework,
      detectedPlaybook: safeEvent.detectedPlaybook,
      ctaType: safeEvent.ctaType,
      confidence: safeEvent.confidence,
      messageCategory: safeEvent.messageCategory,
      sanitizedQuestionSummary: safeEvent.sanitizedQuestionSummary,
      founderDashboardEvent: true,
    },
  });
}

export async function getFounderDashboardEvents(
  query: FounderDashboardEventQuery = {},
) {
  const result = await listConversionEvents(2000, query);

  if (!result.ok) {
    return { ok: false as const, data: [] as FounderDashboardEvent[], error: result.error };
  }

  return {
    ok: true as const,
    data: result.data
      .filter((row) => isFounderDashboardEventName(row.event_name))
      .map(eventFromConversionRow)
      .filter((event) => eventWithinRange(event, query)),
  };
}

export async function getFounderDashboardMetrics(
  query: FounderDashboardEventQuery = {},
) {
  const result = await getFounderDashboardEvents(query);

  if (!result.ok) {
    return { ok: false as const, data: emptyFounderDashboardData(), error: result.error };
  }

  return {
    ok: true as const,
    data: buildFounderDashboardData(result.data),
  };
}

export function sanitizeFounderEvent(
  event: FounderDashboardEventInput,
): Required<FounderDashboardEventInput> {
  const websiteDomain =
    sanitizeWebsiteToDomain(event.websiteDomain) ||
    sanitizeWebsiteToDomain(event.websiteUrl);

  return {
    eventName: event.eventName,
    source: safeText(event.source) || "unknown",
    websiteUrl: websiteDomain,
    websiteDomain,
    scanId: safeIdentifier(event.scanId) || "",
    businessType: safeText(event.businessType) || "",
    challenge: safeText(event.challenge) || "",
    industry: safeText(event.industry) || "",
    detectedIntent: safeIdentifier(event.detectedIntent) || "",
    detectedConcept: safeIdentifier(event.detectedConcept) || "",
    detectedOffer: safeIdentifier(event.detectedOffer) || "",
    detectedFramework: safeIdentifier(event.detectedFramework) || "",
    detectedPlaybook: safeIdentifier(event.detectedPlaybook) || "",
    ctaType: safeIdentifier(event.ctaType) || "",
    confidence:
      typeof event.confidence === "number" && Number.isFinite(event.confidence)
        ? Math.max(0, Math.min(1, event.confidence))
        : 0,
    messageCategory: safeIdentifier(event.messageCategory) || "",
    sanitizedQuestionSummary:
      summarizeZoraQuestion(event.sanitizedQuestionSummary) ||
      safeText(event.sanitizedQuestionSummary) ||
      "",
    createdAt: validDate(event.createdAt) || new Date().toISOString(),
  };
}

function buildFounderDashboardData(
  events: FounderDashboardEvent[],
): FounderDashboardData {
  const counts = events.reduce<Record<FounderDashboardEventName, number>>(
    (current, event) => {
      current[event.eventName] = (current[event.eventName] ?? 0) + 1;
      return current;
    },
    {
      audit_started: 0,
      audit_completed: 0,
      zora_conversation_started: 0,
      audit_assistant_prompt_clicked: 0,
      strategy_call_booked: 0,
      contact_form_submitted: 0,
      zora_qualified_lead: 0,
      pdf_downloaded: 0,
      strategy_call_clicked: 0,
      zora_message_received: 0,
      zora_intent_detected: 0,
      zora_concept_detected: 0,
      zora_offer_detected: 0,
      zora_solution_framework_used: 0,
      zora_playbook_used: 0,
      zora_low_confidence_fallback: 0,
      zora_lead_profile_completed: 0,
      zora_cta_clicked: 0,
    },
  );

  return {
    metrics: {
      visitors: 0,
      auditStarted: counts.audit_started,
      auditCompleted: counts.audit_completed,
      auditAssistantPrompts: counts.audit_assistant_prompt_clicked,
      zoraConversations: counts.zora_conversation_started,
      strategyCallsBooked: counts.strategy_call_booked,
      contactFormsSubmitted: counts.contact_form_submitted,
      zoraQualifiedLeads: counts.zora_qualified_lead,
    },
    events,
    topProblems: groupBy(events.map((event) => event.challenge)),
    topIndustries: groupBy(
      events.map((event) => event.industry || event.businessType),
    ),
    zoraInsights: buildZoraInsights(events, counts),
  };
}

function eventFromConversionRow(row: ConversionEventRow): FounderDashboardEvent {
  const payload = row.payload ?? {};

  return {
    id: row.id,
    eventName: row.event_name as FounderDashboardEventName,
    source: safeText(row.source) || safeText(payload.source) || "unknown",
    websiteUrl:
      sanitizeWebsiteToDomain(row.website_url) ||
      sanitizeWebsiteToDomain(payload.websiteUrl) ||
      sanitizeWebsiteToDomain(payload.websiteDomain) ||
      undefined,
    websiteDomain:
      sanitizeWebsiteToDomain(payload.websiteDomain) ||
      sanitizeWebsiteToDomain(row.website_url) ||
      sanitizeWebsiteToDomain(payload.websiteUrl) ||
      undefined,
    scanId:
      safeIdentifier(row.scan_id) || safeIdentifier(payload.scanId) || undefined,
    businessType:
      safeText(row.business_type) || safeText(payload.businessType) || undefined,
    challenge: safeText(row.challenge) || safeText(payload.challenge) || undefined,
    industry: safeText(row.industry) || safeText(payload.industry) || undefined,
    detectedIntent: safeIdentifier(payload.detectedIntent) || undefined,
    detectedConcept: safeIdentifier(payload.detectedConcept) || undefined,
    detectedOffer: safeIdentifier(payload.detectedOffer) || undefined,
    detectedFramework: safeIdentifier(payload.detectedFramework) || undefined,
    detectedPlaybook: safeIdentifier(payload.detectedPlaybook) || undefined,
    ctaType: safeIdentifier(payload.ctaType) || undefined,
    confidence: numberValue(payload.confidence),
    messageCategory: safeIdentifier(payload.messageCategory) || undefined,
    sanitizedQuestionSummary:
      summarizeZoraQuestion(payload.sanitizedQuestionSummary) || undefined,
    createdAt: validDate(row.created_at) || new Date(0).toISOString(),
  };
}

function buildZoraInsights(
  events: FounderDashboardEvent[],
  counts: Record<FounderDashboardEventName, number>,
): ZoraIntelligenceInsights {
  const zoraInsightEvents = events.filter((event) => isZoraInsightEvent(event.eventName));
  const profileEvents = events.filter((event) =>
    event.businessType || event.challenge || event.websiteDomain || event.websiteUrl,
  );
  const totalZoraConversations = Math.max(
    counts.zora_conversation_started,
    counts.zora_message_received,
  );
  const lowConfidenceFallbacks = counts.zora_low_confidence_fallback;
  const ctaClicksFromZora = counts.zora_cta_clicked;
  const qualifiedZoraLeads = counts.zora_qualified_lead;
  const leadProfileCompleted = counts.zora_lead_profile_completed;

  return {
    hasRealZoraInsightEvents: zoraInsightEvents.length > 0,
    totalZoraConversations,
    qualifiedZoraLeads,
    leadProfileCompleted,
    leadProfileCompletionRate: percentage(leadProfileCompleted, totalZoraConversations),
    lowConfidenceFallbacks,
    lowConfidenceFallbackRate: percentage(lowConfidenceFallbacks, totalZoraConversations),
    ctaClicksFromZora,
    ctaClickRate: percentage(ctaClicksFromZora, totalZoraConversations),
    qualifiedLeadRate: percentage(qualifiedZoraLeads, totalZoraConversations),
    conversationsWithBusinessType: profileEvents.filter((event) => event.businessType).length,
    conversationsWithChallenge: profileEvents.filter((event) => event.challenge).length,
    conversationsWithWebsiteDomain: profileEvents.filter(
      (event) => event.websiteDomain || event.websiteUrl,
    ).length,
    conversationsWithAllProfileFields: profileEvents.filter(
      (event) =>
        event.businessType &&
        event.challenge &&
        (event.websiteDomain || event.websiteUrl),
    ).length,
    strategyCallClicksAfterZora: events.filter(
      (event) =>
        event.eventName === "strategy_call_clicked" &&
        (event.source === "zora" || event.source?.includes("zora")),
    ).length,
    topZoraIntents: groupBy(events.map((event) => event.detectedIntent)),
    topZoraConcepts: groupBy(events.map((event) => event.detectedConcept)),
    topZoraOffers: groupBy(events.map((event) => event.detectedOffer)),
    topSolutionFrameworks: groupBy(events.map((event) => event.detectedFramework)),
    topPlaybooks: groupBy(events.map((event) => event.detectedPlaybook)),
    topQuestionSummaries: groupBy(
      events.map((event) => event.sanitizedQuestionSummary),
    ),
  };
}

function eventWithinRange(
  event: FounderDashboardEvent,
  { from, to }: FounderDashboardEventQuery,
) {
  const createdAt = new Date(event.createdAt).getTime();
  const fromTime = from ? new Date(from).getTime() : Number.NaN;
  const toTime = to ? new Date(to).getTime() : Number.NaN;

  if (Number.isFinite(fromTime) && createdAt < fromTime) return false;
  if (Number.isFinite(toTime) && createdAt > toTime) return false;

  return true;
}

function emptyFounderDashboardData(): FounderDashboardData {
  return {
    metrics: {
      visitors: 0,
      auditStarted: 0,
      auditCompleted: 0,
      auditAssistantPrompts: 0,
      zoraConversations: 0,
      strategyCallsBooked: 0,
      contactFormsSubmitted: 0,
      zoraQualifiedLeads: 0,
    },
    events: [],
    topProblems: [],
    topIndustries: [],
    zoraInsights: emptyZoraInsights(),
  };
}

function emptyZoraInsights(): ZoraIntelligenceInsights {
  return {
    hasRealZoraInsightEvents: false,
    totalZoraConversations: 0,
    qualifiedZoraLeads: 0,
    leadProfileCompleted: 0,
    leadProfileCompletionRate: 0,
    lowConfidenceFallbacks: 0,
    lowConfidenceFallbackRate: 0,
    ctaClicksFromZora: 0,
    ctaClickRate: 0,
    qualifiedLeadRate: 0,
    conversationsWithBusinessType: 0,
    conversationsWithChallenge: 0,
    conversationsWithWebsiteDomain: 0,
    conversationsWithAllProfileFields: 0,
    strategyCallClicksAfterZora: 0,
    topZoraIntents: [],
    topZoraConcepts: [],
    topZoraOffers: [],
    topSolutionFrameworks: [],
    topPlaybooks: [],
    topQuestionSummaries: [],
  };
}

function groupBy(values: Array<string | undefined>) {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const label = safeText(value);
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
    .slice(0, 6);
}

function safeText(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = stripPII(value).trim().replace(/\s+/g, " ");

  if (!trimmed || trimmed.includes("[email removed]") || trimmed.includes("[phone removed]")) {
    return "";
  }

  if (hasPrivatePattern(trimmed)) return "";

  return trimmed.slice(0, 120);
}

function safeIdentifier(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();

  if (!trimmed || hasPrivatePattern(trimmed)) return "";

  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : undefined;
}

function percentage(count: number, total: number) {
  return total === 0 ? 0 : (count / total) * 100;
}

function isZoraInsightEvent(eventName: FounderDashboardEventName) {
  return (
    eventName === "zora_message_received" ||
    eventName === "zora_intent_detected" ||
    eventName === "zora_concept_detected" ||
    eventName === "zora_offer_detected" ||
    eventName === "zora_solution_framework_used" ||
    eventName === "zora_playbook_used" ||
    eventName === "zora_low_confidence_fallback" ||
    eventName === "zora_lead_profile_completed" ||
    eventName === "zora_cta_clicked"
  );
}

function hasPrivatePattern(value: string) {
  return (
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value) ||
    /(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/.test(value)
  );
}

function validDate(value: unknown) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}
