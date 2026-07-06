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

export type { FounderDashboardEvent, FounderDashboardEventName } from "./types";

export type FounderDashboardEventInput = {
  eventName: FounderDashboardEventName;
  source?: string;
  websiteUrl?: string;
  scanId?: string;
  businessType?: string;
  challenge?: string;
  industry?: string;
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
      scanId: safeEvent.scanId,
      businessType: safeEvent.businessType,
      challenge: safeEvent.challenge,
      industry: safeEvent.industry,
      founderDashboardEvent: true,
    },
  });
}

export async function getFounderDashboardEvents(
  query: FounderDashboardEventQuery = {},
) {
  const result = await listConversionEvents(2000);

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
  return {
    eventName: event.eventName,
    source: safeText(event.source) || "unknown",
    websiteUrl: sanitizeWebsiteUrl(event.websiteUrl) || "",
    scanId: safeIdentifier(event.scanId) || "",
    businessType: safeText(event.businessType) || "",
    challenge: safeText(event.challenge) || "",
    industry: safeText(event.industry) || "",
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
  };
}

function eventFromConversionRow(row: ConversionEventRow): FounderDashboardEvent {
  const payload = row.payload ?? {};

  return {
    id: row.id,
    eventName: row.event_name as FounderDashboardEventName,
    source: safeText(row.source) || safeText(payload.source) || "unknown",
    websiteUrl:
      sanitizeWebsiteUrl(row.website_url) ||
      sanitizeWebsiteUrl(payload.websiteUrl) ||
      undefined,
    scanId: safeIdentifier(payload.scanId) || undefined,
    businessType:
      safeText(row.business_type) || safeText(payload.businessType) || undefined,
    challenge: safeText(row.challenge) || safeText(payload.challenge) || undefined,
    industry: safeText(payload.industry) || undefined,
    createdAt: validDate(row.created_at) || new Date(0).toISOString(),
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

function sanitizeWebsiteUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "";

  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value}`);
    return url.hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    return safeText(value.replace(/^https?:\/\//, "").split("/")[0]);
  }
}

function safeText(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim().replace(/\s+/g, " ");

  if (!trimmed || hasPrivatePattern(trimmed)) return "";

  return trimmed.slice(0, 120);
}

function safeIdentifier(value: unknown) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();

  if (!trimmed || hasPrivatePattern(trimmed)) return "";

  return trimmed.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
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
