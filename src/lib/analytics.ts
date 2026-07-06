export type AnalyticsPayload = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, payload?: Record<string, unknown>) => void;
    dataLayer?: Record<string, unknown>[];
  }
}

export function trackEvent(eventName: string, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanPayload = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null),
  ) as Record<string, string | number | boolean>;

  try {
    window.gtag?.("event", eventName, cleanPayload);
    window.dataLayer?.push({ event: eventName, ...cleanPayload });
  } catch {
    // Analytics should never interrupt the product experience.
  }

  logFounderPromptEvent(eventName, cleanPayload);
}

function logFounderPromptEvent(
  eventName: string,
  payload: Record<string, string | number | boolean>,
) {
  if (eventName !== "audit_assistant_prompt_clicked") {
    return;
  }

  try {
    void fetch("/api/founder-dashboard/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        source: stringField(payload.source) || stringField(payload.sourceArea),
        websiteUrl:
          stringField(payload.websiteUrl) ||
          stringField(payload.scannedUrl) ||
          stringField(payload.website),
        scanId: stringField(payload.scanId),
        businessType: stringField(payload.businessType),
        challenge:
          stringField(payload.challenge) || stringField(payload.primaryConcern),
        industry: stringField(payload.industry),
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Founder analytics should never interrupt the product experience.
  }
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
