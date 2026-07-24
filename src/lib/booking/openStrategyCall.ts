import { trackEvent } from "@/lib/analytics";
import {
  CALENDLY_FALLBACK_URL,
  OPZIX_BOOKING_ENABLED,
  STRATEGY_CALL_BOOKING_PATH,
  STRATEGY_CALL_CONFIRMED_PATH,
  STRATEGY_CALL_URL,
} from "@/lib/booking";
import { trackConversion, type ConversionPayload } from "@/lib/analytics/trackConversion";

export type StrategyCallSource =
  | "hero"
  | "header"
  | "zora"
  | "audit_assistant"
  | "contact_page"
  | "services_page"
  | "real_estate_page"
  | "platform_page"
  | "pricing"
  | "footer";

export type StrategyCallPayload = {
  source: StrategyCallSource;
  serviceRequested?: string;
  businessType?: string;
  challenge?: string;
  websiteUrl?: string;
  industry?: string;
  scanId?: string;
  sessionId?: string;
  leadScore?: number;
  leadTemperature?: string;
};

type CalendlyMessageData = {
  event?: string;
  payload?: Record<string, unknown>;
};

declare global {
  interface Window {
    Calendly?: {
      initInlineWidget?: (options: {
        url: string;
        parentElement: HTMLElement;
      }) => void;
    };
  }
}

let calendlyListenerInstalled = false;
let calendlyWidgetLoading: Promise<void> | null = null;
let latestStrategyCallPayload: StrategyCallPayload | null = null;
let strategyCallRedirectStarted = false;
const scheduledCalendlyEvents = new Set<string>();
const PENDING_STRATEGY_CALL_PAYLOAD_KEY = "opzix-pending-strategy-call-payload";
const TRACKED_STRATEGY_CALL_BOOKINGS_KEY = "opzix-tracked-strategy-call-bookings";
const BOOKED_BEFORE_CONFIRMATION_KEY = "opzix-strategy-call-booked-before-confirmation";
const CALENDLY_WIDGET_SCRIPT_ID = "calendly-widget-script";
const CALENDLY_WIDGET_STYLES_ID = "calendly-widget-styles";
const CALENDLY_WIDGET_SCRIPT_SRC = "https://assets.calendly.com/assets/external/widget.js";
const CALENDLY_WIDGET_STYLES_HREF = "https://assets.calendly.com/assets/external/widget.css";

export function openStrategyCall(payload: StrategyCallPayload) {
  if (typeof window === "undefined") {
    return;
  }

  const enrichedPayload = withPagePath(payload);

  rememberStrategyCallContext(payload);
  if (!OPZIX_BOOKING_ENABLED) {
    installCalendlyBookingListener();
  }
  trackConversion("strategy_call_clicked", enrichedPayload);
  trackEvent("strategy_call_clicked", enrichedPayload);
  redirectToStrategyCallBookingPage();
}

export function rememberStrategyCallContext(payload: StrategyCallPayload) {
  if (typeof window === "undefined") {
    return;
  }

  latestStrategyCallPayload = payload;
  persistLatestStrategyCallPayload(payload);
}

export function trackStrategyCallBookedFromConfirmation() {
  if (typeof window === "undefined") {
    return;
  }

  if (wasBookedBeforeConfirmation()) {
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
  devLog("listener mounted");
}

export function initStrategyCallInlineWidget(parentElement: HTMLElement) {
  return ensureCalendlyWidget().then(() => {
    if (typeof window.Calendly?.initInlineWidget !== "function") {
      throw new Error("Calendly inline widget is unavailable.");
    }

    parentElement.innerHTML = "";
    window.Calendly.initInlineWidget({
      url: CALENDLY_FALLBACK_URL,
      parentElement,
    });
  });
}

function handleCalendlyMessage(event: MessageEvent) {
  if (!isCalendlyEvent(event)) {
    return;
  }

  const eventData = event.data as CalendlyMessageData;
  devLog("Calendly message received", {
    event: eventData.event,
    origin: event.origin,
  });

  if (eventData.event !== "calendly.event_scheduled") {
    return;
  }

  devLog("event_scheduled detected", eventData.payload);

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
  markBookedBeforeConfirmation();

  return true;
}

function ensureCalendlyWidget() {
  injectCalendlyStyles();

  if (typeof window.Calendly?.initInlineWidget === "function") {
    return Promise.resolve();
  }

  if (calendlyWidgetLoading) {
    return calendlyWidgetLoading;
  }

  calendlyWidgetLoading = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      CALENDLY_WIDGET_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = CALENDLY_WIDGET_SCRIPT_ID;
    script.src = CALENDLY_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject();
    document.head.appendChild(script);
  });

  return calendlyWidgetLoading;
}

function injectCalendlyStyles() {
  if (document.getElementById(CALENDLY_WIDGET_STYLES_ID)) {
    return;
  }

  const styles = document.createElement("link");
  styles.id = CALENDLY_WIDGET_STYLES_ID;
  styles.rel = "stylesheet";
  styles.href = CALENDLY_WIDGET_STYLES_HREF;
  document.head.appendChild(styles);
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
          serviceRequested: stringOrUndefined(parsed.serviceRequested),
          businessType: stringOrUndefined(parsed.businessType),
          challenge: stringOrUndefined(parsed.challenge),
          websiteUrl: stringOrUndefined(parsed.websiteUrl),
          industry: stringOrUndefined(parsed.industry),
          scanId: stringOrUndefined(parsed.scanId),
          sessionId: stringOrUndefined(parsed.sessionId),
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

function markBookedBeforeConfirmation() {
  try {
    window.sessionStorage.setItem(BOOKED_BEFORE_CONFIRMATION_KEY, "true");
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
}

function wasBookedBeforeConfirmation() {
  try {
    const bookedBeforeConfirmation = window.sessionStorage.getItem(
      BOOKED_BEFORE_CONFIRMATION_KEY,
    );

    if (bookedBeforeConfirmation === "true") {
      window.sessionStorage.removeItem(BOOKED_BEFORE_CONFIRMATION_KEY);
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function isCalendlyEvent(event: MessageEvent) {
  const data = event.data as CalendlyMessageData | undefined;

  return (
    isCalendlyOrigin(event.origin) &&
    typeof data?.event === "string" &&
    data.event.startsWith("calendly.")
  );
}

function isCalendlyOrigin(origin: string) {
  try {
    const hostname = new URL(origin).hostname;
    return hostname === "calendly.com" || hostname.endsWith(".calendly.com");
  } catch {
    return false;
  }
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
  if (strategyCallRedirectStarted) {
    return;
  }

  strategyCallRedirectStarted = true;

  const payload = latestStrategyCallPayload || storedStrategyCallPayload();
  const confirmationUrl = new URL(STRATEGY_CALL_CONFIRMED_PATH, window.location.origin);

  if (payload) {
    addQueryParam(confirmationUrl, "source", payload.source);
    addQueryParam(confirmationUrl, "serviceRequested", payload.serviceRequested);
    addQueryParam(confirmationUrl, "businessType", payload.businessType);
    addQueryParam(confirmationUrl, "challenge", payload.challenge);
    addQueryParam(confirmationUrl, "website", payload.websiteUrl);
    addQueryParam(confirmationUrl, "websiteUrl", payload.websiteUrl);
    addQueryParam(confirmationUrl, "industry", payload.industry);
    addQueryParam(confirmationUrl, "scanId", payload.scanId);
    addQueryParam(confirmationUrl, "sessionId", payload.sessionId);
    addQueryParam(
      confirmationUrl,
      "leadScore",
      typeof payload.leadScore === "number" ? String(payload.leadScore) : undefined,
    );
    addQueryParam(confirmationUrl, "leadTemperature", payload.leadTemperature);
  }

  devLog("redirect started", `${confirmationUrl.pathname}${confirmationUrl.search}`);
  window.setTimeout(() => {
    window.location.assign(`${confirmationUrl.pathname}${confirmationUrl.search}`);
  }, 300);
}

function redirectToStrategyCallBookingPage() {
  const payload = latestStrategyCallPayload || storedStrategyCallPayload();
  const bookingUrl = new URL(STRATEGY_CALL_URL, window.location.origin);

  if (payload) {
    addQueryParam(bookingUrl, "source", payload.source);
    addQueryParam(bookingUrl, "serviceRequested", payload.serviceRequested);
    addQueryParam(bookingUrl, "businessType", payload.businessType);
    addQueryParam(bookingUrl, "challenge", payload.challenge);
    addQueryParam(bookingUrl, "website", payload.websiteUrl);
    addQueryParam(bookingUrl, "websiteUrl", payload.websiteUrl);
    addQueryParam(bookingUrl, "industry", payload.industry);
    addQueryParam(bookingUrl, "scanId", payload.scanId);
    addQueryParam(bookingUrl, "sessionId", payload.sessionId);
    addQueryParam(
      bookingUrl,
      "leadScore",
      typeof payload.leadScore === "number" ? String(payload.leadScore) : undefined,
    );
    addQueryParam(bookingUrl, "leadTemperature", payload.leadTemperature);
  }

  devLog("opening booking page", bookingUrl.toString());
  window.setTimeout(() => {
    window.location.assign(
      bookingUrl.origin === window.location.origin
        ? `${bookingUrl.pathname}${bookingUrl.search}`
        : bookingUrl.toString(),
    );
  }, 120);
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
    value === "services_page" ||
    value === "real_estate_page" ||
    value === "platform_page" ||
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

function devLog(message: string, details?: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (details === undefined) {
    console.info(`[Calendly booking] ${message}`);
    return;
  }

  console.info(`[Calendly booking] ${message}`, details);
}
