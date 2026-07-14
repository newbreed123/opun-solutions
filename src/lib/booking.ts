export const NATIVE_STRATEGY_CALL_BOOKING_PATH =
  process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "/book/strategy-session";
export const CALENDLY_FALLBACK_URL =
  process.env.NEXT_PUBLIC_CALENDLY_FALLBACK_URL || "https://calendly.com/hello-opzix";
export const OPZIX_BOOKING_ENABLED =
  process.env.NEXT_PUBLIC_OPZIX_BOOKING_ENABLED !== "false";
export const STRATEGY_CALL_URL = OPZIX_BOOKING_ENABLED
  ? NATIVE_STRATEGY_CALL_BOOKING_PATH
  : CALENDLY_FALLBACK_URL;

export const STRATEGY_CALL_BOOKING_PATH = OPZIX_BOOKING_ENABLED
  ? NATIVE_STRATEGY_CALL_BOOKING_PATH
  : "/strategy-call";
export const STRATEGY_CALL_CONFIRMED_PATH = "/strategy-call-confirmed";

type StrategyCallBookingHrefPayload = {
  source?: string;
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

export function strategyCallBookingHref(payload: StrategyCallBookingHrefPayload = {}) {
  const params = new URLSearchParams();

  addParam(params, "source", payload.source);
  addParam(params, "serviceRequested", payload.serviceRequested);
  addParam(params, "businessType", payload.businessType);
  addParam(params, "challenge", payload.challenge);
  addParam(params, "website", payload.websiteUrl);
  addParam(params, "websiteUrl", payload.websiteUrl);
  addParam(params, "industry", payload.industry);
  addParam(params, "scanId", payload.scanId);
  addParam(params, "sessionId", payload.sessionId);
  addParam(
    params,
    "leadScore",
    typeof payload.leadScore === "number" ? String(payload.leadScore) : undefined,
  );
  addParam(params, "leadTemperature", payload.leadTemperature);

  if (/^https?:\/\//i.test(STRATEGY_CALL_URL)) {
    const url = new URL(STRATEGY_CALL_URL);
    params.forEach((value, key) => url.searchParams.set(key, value));
    return url.toString();
  }

  const query = params.toString();
  return query ? `${STRATEGY_CALL_URL}?${query}` : STRATEGY_CALL_URL;
}

function addParam(params: URLSearchParams, key: string, value?: string) {
  if (value) {
    params.set(key, value);
  }
}
