import { trackEvent } from "@/lib/analytics";
import { STRATEGY_CALL_CONFIRMED_PATH } from "@/lib/booking";
import { trackConversion, type ConversionPayload } from "@/lib/analytics/trackConversion";

export type StrategyCallSource =
  | "hero"
  | "header"
  | "zora"
  | "audit_assistant"
  | "contact_page"
  | "pricing"
  | "footer";

export type StrategyCallPayload = {
  source: StrategyCallSource;
  businessType?: string;
  challenge?: string;
  websiteUrl?: string;
  leadScore?: number;
  leadTemperature?: string;
};

type CalendlyMessageData = {
  event?: string;
  payload?: Record<string, unknown>;
};

let calendlyListenerInstalled = false;
let latestStrategyCallPayload: StrategyCallPayload | null = null;
const scheduledCalendlyEvents = new Set<string>();
const PENDING_STRATEGY_CALL_PAYLOAD_KEY = "opzix-pending-strategy-call-payload";
const TRACKED_STRATEGY_CALL_BOOKINGS_KEY = "opzix-tracked-strategy-call-bookings";

export function openStrategyCall(payload: StrategyCallPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const enrichedPayload = withPagePath(payload);

  latestStrategyCallPayload = payload;
  persistLatestStrategyCallPayload(payload);
  installCalendlyBookingListener();
  trackConversion("strategy_call_clicked", enrichedPayload);
  trackEvent("strategy_call_clicked", enrichedPayload);
}

export function trackStrategyCallBookedFromConfirmation() {
  if (typeof window === "undefined") {
    return;
  }

  trackStrategyCallBooked(undefined, "strategy-call-confirmed");
}

export function installCalendlyBookingListener() {
  if (typeof window === "undefined" || calendlyListenerInstalled) {
    return;
  }

  window.addEventListener("message", handleCalendlyMessage);
  calendlyListenerInstalled = true;
}

function handleCalendlyMessage(event: MessageEvent) {
  if (!isCalendlyEvent(event)) {
    return;
  }

  const eventData = event.data as CalendlyMessageData;

  if (eventData.event !== "calendly.event_scheduled") {
    return;
  }

  const eventKey = calendlyEventKey(eventData.payload);
  const booked = trackStrategyCallBooked(eventData.payload, eventKey);

  if (booked) {
    redirectToStrategyCallConfirmed();
  }
}

function trackStrategyCallBooked(
  calendlyPayload?: Record<string, unknown>,
  eventKey = JSON.stringify(calendlyPayload ?? {}),
) {
  if (wasStrategyCallBookedTracked(eventKey)) {
    return false;
  }

  markStrategyCallBookedTracked(eventKey);

  const conversionPayload = withPagePath(
    latestStrategyCallPayload ||
      storedStrategyCallPayload() || {
      source: "hero",
    },
  );

  trackConversion("strategy_call_booked", conversionPayload);
  trackEvent("strategy_call_booked", conversionPayload);

  return true;
}

function persistLatestStrategyCallPayload(payload: StrategyCallPayload) {
  try {
    window.sessionStorage.setItem(
      PENDING_STRATEGY_CALL_PAYLOAD_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
}

function storedStrategyCallPayload(): StrategyCallPayload | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_STRATEGY_CALL_PAYLOAD_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StrategyCallPayload>;

    return isStrategyCallSource(parsed.source)
      ? {
          source: parsed.source,
          businessType: stringOrUndefined(parsed.businessType),
          challenge: stringOrUndefined(parsed.challenge),
          websiteUrl: stringOrUndefined(parsed.websiteUrl),
          leadScore: numberOrUndefined(parsed.leadScore),
          leadTemperature: stringOrUndefined(parsed.leadTemperature),
        }
      : null;
  } catch {
    return null;
  }
}

function wasStrategyCallBookedTracked(eventKey: string) {
  if (scheduledCalendlyEvents.has(eventKey)) {
    return true;
  }

  try {
    const tracked = JSON.parse(
      window.sessionStorage.getItem(TRACKED_STRATEGY_CALL_BOOKINGS_KEY) || "[]",
    ) as unknown;

    return Array.isArray(tracked) && tracked.includes(eventKey);
  } catch {
    return false;
  }
}

function markStrategyCallBookedTracked(eventKey: string) {
  scheduledCalendlyEvents.add(eventKey);

  try {
    const tracked = JSON.parse(
      window.sessionStorage.getItem(TRACKED_STRATEGY_CALL_BOOKINGS_KEY) || "[]",
    ) as unknown;
    const trackedEvents = Array.isArray(tracked)
      ? tracked.filter((value): value is string => typeof value === "string")
      : [];

    if (!trackedEvents.includes(eventKey)) {
      window.sessionStorage.setItem(
        TRACKED_STRATEGY_CALL_BOOKINGS_KEY,
        JSON.stringify([...trackedEvents, eventKey].slice(-20)),
      );
    }
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
}

function isCalendlyEvent(event: MessageEvent) {
  const data = event.data as CalendlyMessageData | undefined;

  return (
    event.origin === "https://calendly.com" &&
    typeof data?.event === "string" &&
    data.event.startsWith("calendly.")
  );
}

function calendlyEventKey(payload?: Record<string, unknown>) {
  const eventUri = uriFromPayload(payload?.event);
  const inviteeUri = uriFromPayload(payload?.invitee);

  return [eventUri, inviteeUri].filter(Boolean).join(":") || JSON.stringify(payload ?? {});
}

function uriFromPayload(value: unknown) {
  if (typeof value !== "object" || value === null || !("uri" in value)) {
    return "";
  }

  const uri = (value as { uri?: unknown }).uri;
  return typeof uri === "string" ? uri : "";
}

function withPagePath(payload: StrategyCallPayload): ConversionPayload {
  return {
    ...payload,
    pagePath: window.location.pathname,
  };
}

function redirectToStrategyCallConfirmed() {
  const payload = latestStrategyCallPayload || storedStrategyCallPayload();
  const confirmationUrl = new URL(STRATEGY_CALL_CONFIRMED_PATH, window.location.origin);

  if (payload) {
    addQueryParam(confirmationUrl, "source", payload.source);
    addQueryParam(confirmationUrl, "businessType", payload.businessType);
    addQueryParam(confirmationUrl, "challenge", payload.challenge);
    addQueryParam(confirmationUrl, "websiteUrl", payload.websiteUrl);
    addQueryParam(
      confirmationUrl,
      "leadScore",
      typeof payload.leadScore === "number" ? String(payload.leadScore) : undefined,
    );
    addQueryParam(confirmationUrl, "leadTemperature", payload.leadTemperature);
  }

  window.location.assign(`${confirmationUrl.pathname}${confirmationUrl.search}`);
}

function addQueryParam(url: URL, key: string, value?: string) {
  if (value) {
    url.searchParams.set(key, value);
  }
}

function isStrategyCallSource(value: unknown): value is StrategyCallSource {
  return (
    value === "hero" ||
    value === "header" ||
    value === "zora" ||
    value === "audit_assistant" ||
    value === "contact_page" ||
    value === "pricing" ||
    value === "footer"
  );
}

function stringOrUndefined(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function numberOrUndefined(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
