export type ConversionEventName =
  | "zora_conversation_started"
  | "zora_qualified_lead"
  | "audit_started"
  | "audit_completed"
  | "strategy_call_clicked"
  | "strategy_call_booking_viewed"
  | "strategy_call_slot_selected"
  | "strategy_call_booking_started"
  | "strategy_call_booked"
  | "strategy_call_booking_failed"
  | "strategy_call_confirmation_email_sent"
  | "strategy_call_reminder_24h_sent"
  | "strategy_call_reminder_1h_sent"
  | "contact_form_submitted"
  | "ask_question_clicked"
  | "roadmap_downloaded";

type FounderEventName =
  | "audit_started"
  | "audit_completed"
  | "zora_conversation_started"
  | "strategy_call_booked"
  | "strategy_call_booking_viewed"
  | "strategy_call_slot_selected"
  | "strategy_call_booking_started"
  | "strategy_call_booking_failed"
  | "strategy_call_confirmation_email_sent"
  | "strategy_call_reminder_24h_sent"
  | "strategy_call_reminder_1h_sent"
  | "contact_form_submitted"
  | "zora_qualified_lead"
  | "pdf_downloaded"
  | "strategy_call_clicked";

export type ConversionPayload = {
  source?: string;
  businessType?: string;
  challenge?: string;
  websiteUrl?: string;
  leadScore?: number;
  leadTemperature?: string;
  recommendedNextStep?: string;
  pagePath?: string;
  [key: string]: string | number | boolean | undefined;
};

type ConversionEventConfig = {
  ga4Event: ConversionEventName;
  adsConversionLabel?: string;
  adsConversionLabelEnvName?: string;
  adsPayload?: ConversionPayload;
  primary: boolean;
};

const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const ATTRIBUTION_STORAGE_KEY = "opzix-conversion-attribution";

export const CONVERSION_EVENTS: Record<ConversionEventName, ConversionEventConfig> = {
  audit_started: {
    ga4Event: "audit_started",
    adsConversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_AUDIT_STARTED_LABEL,
    adsConversionLabelEnvName: "NEXT_PUBLIC_GOOGLE_ADS_AUDIT_STARTED_LABEL",
    adsPayload: {
      value: 1.0,
      currency: "USD",
    },
    primary: true,
  },
  strategy_call_clicked: {
    ga4Event: "strategy_call_clicked",
    primary: false,
  },
  strategy_call_booking_viewed: {
    ga4Event: "strategy_call_booking_viewed",
    primary: false,
  },
  strategy_call_slot_selected: {
    ga4Event: "strategy_call_slot_selected",
    primary: false,
  },
  strategy_call_booking_started: {
    ga4Event: "strategy_call_booking_started",
    primary: false,
  },
  strategy_call_booked: {
    ga4Event: "strategy_call_booked",
    adsConversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_STRATEGY_CALL_BOOKED_LABEL,
    adsConversionLabelEnvName: "NEXT_PUBLIC_GOOGLE_ADS_STRATEGY_CALL_BOOKED_LABEL",
    primary: true,
  },
  strategy_call_booking_failed: {
    ga4Event: "strategy_call_booking_failed",
    primary: false,
  },
  strategy_call_confirmation_email_sent: {
    ga4Event: "strategy_call_confirmation_email_sent",
    primary: false,
  },
  strategy_call_reminder_24h_sent: {
    ga4Event: "strategy_call_reminder_24h_sent",
    primary: false,
  },
  strategy_call_reminder_1h_sent: {
    ga4Event: "strategy_call_reminder_1h_sent",
    primary: false,
  },
  contact_form_submitted: {
    ga4Event: "contact_form_submitted",
    adsConversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_FORM_LABEL,
    adsConversionLabelEnvName: "NEXT_PUBLIC_GOOGLE_ADS_CONTACT_FORM_LABEL",
    primary: true,
  },
  audit_completed: {
    ga4Event: "audit_completed",
    adsConversionLabel: process.env.NEXT_PUBLIC_GOOGLE_ADS_AUDIT_COMPLETED_LABEL,
    adsConversionLabelEnvName: "NEXT_PUBLIC_GOOGLE_ADS_AUDIT_COMPLETED_LABEL",
    primary: false,
  },
  zora_conversation_started: {
    ga4Event: "zora_conversation_started",
    primary: false,
  },
  zora_qualified_lead: {
    ga4Event: "zora_qualified_lead",
    primary: false,
  },
  ask_question_clicked: {
    ga4Event: "ask_question_clicked",
    primary: false,
  },
  roadmap_downloaded: {
    ga4Event: "roadmap_downloaded",
    primary: false,
  },
};

function cleanConversionPayload(
  payload: ConversionPayload,
): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;
}

function shouldLogConversions() {
  return process.env.NODE_ENV === "development";
}

export function trackConversion(
  eventName: ConversionEventName,
  payload: ConversionPayload = {},
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const gtag = window.gtag;
    const eventConfig = CONVERSION_EVENTS[eventName];
    const cleanPayload = cleanConversionPayload(enrichConversionPayload(payload));

    if (typeof gtag !== "function") {
      logInternalConversionEvent(eventName, cleanPayload);

      if (shouldLogConversions()) {
        console.info("[conversion skipped]", eventName, {
          reason: "gtag_unavailable",
          payload: cleanPayload,
        });
      }
      return;
    }

    gtag("event", eventConfig.ga4Event, cleanPayload);

    if (eventConfig.adsConversionLabel && GOOGLE_ADS_ID) {
      const adsSendTo = `${GOOGLE_ADS_ID}/${eventConfig.adsConversionLabel}`;

      if (shouldLogConversions()) {
        console.info("[google ads conversion]", eventName, {
          googleAdsIdEnvName: "NEXT_PUBLIC_GOOGLE_ADS_ID",
          googleAdsId: GOOGLE_ADS_ID,
          conversionLabelEnvName: eventConfig.adsConversionLabelEnvName,
          conversionLabel: eventConfig.adsConversionLabel,
          send_to: adsSendTo,
        });
      }

      gtag("event", "conversion", {
        send_to: adsSendTo,
        ...eventConfig.adsPayload,
        ...cleanPayload,
      });
    }

    logInternalConversionEvent(eventName, cleanPayload);

    if (shouldLogConversions()) {
      console.info("[conversion tracked]", eventName, {
        ga4Event: eventConfig.ga4Event,
        adsConversion: Boolean(eventConfig.adsConversionLabel && GOOGLE_ADS_ID),
        primary: eventConfig.primary,
        payload: cleanPayload,
      });
    }
  } catch (error) {
    if (shouldLogConversions()) {
      console.warn("[conversion failed]", eventName, error);
    }
  }
}

function enrichConversionPayload(payload: ConversionPayload): ConversionPayload {
  const attribution = currentAttribution();

  return {
    pagePath: window.location.pathname,
    ...attribution,
    ...payload,
  };
}

function currentAttribution(): ConversionPayload {
  const fromUrl = attributionFromUrl();

  if (Object.keys(fromUrl).length > 0) {
    persistAttribution(fromUrl);
    return fromUrl;
  }

  return storedAttribution();
}

function attributionFromUrl(): ConversionPayload {
  const params = new URLSearchParams(window.location.search);

  return cleanConversionPayload({
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    gclid: params.get("gclid") || undefined,
  });
}

function persistAttribution(payload: ConversionPayload) {
  try {
    window.sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Session storage can be unavailable in private browsing modes.
  }
}

function storedAttribution(): ConversionPayload {
  try {
    const raw = window.sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY);

    if (!raw) return {};

    const parsed = JSON.parse(raw) as ConversionPayload;

    return cleanConversionPayload({
      utmSource: parsed.utmSource,
      utmMedium: parsed.utmMedium,
      utmCampaign: parsed.utmCampaign,
      gclid: parsed.gclid,
    });
  } catch {
    return {};
  }
}

function logInternalConversionEvent(
  eventName: ConversionEventName,
  payload: Record<string, string | number | boolean>,
) {
  try {
    void fetch("/api/conversion-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName,
        payload,
      }),
      keepalive: true,
    }).catch(() => undefined);
    logInternalFounderEvent(eventName, payload);
  } catch {
    // Internal analytics should never interrupt the product experience.
  }
}

function logInternalFounderEvent(
  eventName: ConversionEventName,
  payload: Record<string, string | number | boolean>,
) {
  const founderEventName = founderEventNameForConversion(eventName);

  if (!founderEventName) {
    return;
  }

  try {
    void fetch("/api/founder-dashboard/events", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventName: founderEventName,
        source: stringField(payload.source),
        websiteUrl: stringField(payload.websiteUrl),
        scanId: stringField(payload.scanId),
        businessType: stringField(payload.businessType),
        challenge: stringField(payload.challenge),
        industry: stringField(payload.industry),
      }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Founder analytics should never interrupt the product experience.
  }
}

function founderEventNameForConversion(
  eventName: ConversionEventName,
): FounderEventName | null {
  if (eventName === "roadmap_downloaded") return "pdf_downloaded";
  if (eventName === "ask_question_clicked") return null;
  return eventName;
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
