export const STRATEGY_CALL_URL =
  process.env.NEXT_PUBLIC_STRATEGY_CALL_URL || "https://calendly.com/hello-opzix";

export const STRATEGY_CALL_BOOKING_PATH = "/strategy-call";
export const STRATEGY_CALL_CONFIRMED_PATH = "/strategy-call-confirmed";

type StrategyCallBookingHrefPayload = {
  source?: string;
  businessType?: string;
  challenge?: string;
  websiteUrl?: string;
  leadScore?: number;
  leadTemperature?: string;
};

export function strategyCallBookingHref(payload: StrategyCallBookingHrefPayload = {}) {
  const params = new URLSearchParams();

  addParam(params, "source", payload.source);
  addParam(params, "businessType", payload.businessType);
  addParam(params, "challenge", payload.challenge);
  addParam(params, "websiteUrl", payload.websiteUrl);
  addParam(
    params,
    "leadScore",
    typeof payload.leadScore === "number" ? String(payload.leadScore) : undefined,
  );
  addParam(params, "leadTemperature", payload.leadTemperature);

  const query = params.toString();
  return query ? `${STRATEGY_CALL_BOOKING_PATH}?${query}` : STRATEGY_CALL_BOOKING_PATH;
}

function addParam(params: URLSearchParams, key: string, value?: string) {
  if (value) {
    params.set(key, value);
  }
}
