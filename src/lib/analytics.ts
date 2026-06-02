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
  );

  try {
    window.gtag?.("event", eventName, cleanPayload);
    window.dataLayer?.push({ event: eventName, ...cleanPayload });
  } catch {
    // Analytics should never interrupt the product experience.
  }
}
