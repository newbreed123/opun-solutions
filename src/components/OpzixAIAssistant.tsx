"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  Check,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  buildZoraDiagnosis,
  buildZoraResponse,
  detectZoraTrafficIntent,
  hasUrlBusinessTypeMismatch,
  inferIndustryFromUrl,
  recommendZoraNextStep,
  scoreZoraLeadQuality,
  shouldUseIndustryInference,
  zoraTrafficIntentAnchor,
  zoraFaqItems,
  ZoraBusinessType,
  ZoraChallenge,
  ZoraLeadProfile,
  ZoraResponse,
} from "@/lib/zora-assistant";
import {
  detectZoraIndustry,
  type ZoraIndustry,
  type ZoraIndustryProfile,
} from "@/lib/zora-industry-awareness";

const CHATBOT_STATE_KEY = "opzix-ai-chatbot-state";
const ZORA_SESSION_ID_KEY = "opzix-zora-session-id";
const ZORA_TRAFFIC_INTENT_KEY = "opzix-zora-traffic-intent";
const BOOKING_LINK_DELAY_MS = 150;
const STRATEGY_CALL_URL = "https://calendly.com/hello-opzix";
const FREE_AUDIT_URL = "/tools/ecommerce-audit-scanner?source=zora";

type GuidedStep =
  | "businessType"
  | "challenge"
  | "websiteUrl";

type ZoraActionTone = "primary" | "secondary" | "text";

type ZoraAction =
  | {
      kind: "start";
      label: string;
      value: "diagnose" | "free_audit" | "strategy_call" | "ask_question" | "faq";
      tone?: ZoraActionTone;
    }
  | {
      kind: "choice";
      label: string;
      step: GuidedStep;
      value: string;
    }
  | {
      kind: "faq";
      label: string;
      question: string;
    }
  | {
      kind: "link";
      label: string;
      href: string;
      booking?: boolean;
      tone?: ZoraActionTone;
    };

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  actions?: ZoraAction[];
};

type ZoraApiResponse = ZoraResponse & {
  poweredBy?: "openai" | "local-diagnosis";
};

type StoredTrafficIntent = Pick<
  ZoraLeadProfile,
  "trafficIntentCategory" | "trafficIntentText" | "adContext"
>;

const businessTypeChoices: Array<{ label: string; value: ZoraBusinessType }> = [
  { label: "Ecommerce", value: "Ecommerce" },
  { label: "Service Business", value: "Service Business" },
  { label: "Real Estate", value: "Real Estate" },
  { label: "Healthcare / Care", value: "Care/Healthcare" },
  { label: "Other", value: "Other" },
];

const challengeChoices: Array<{ label: string; value: ZoraChallenge }> = [
  { label: "Getting Traffic", value: "Traffic" },
  { label: "Converting Visitors", value: "Conversion" },
  { label: "Lead Follow-up", value: "Follow-up" },
  { label: "Operations", value: "Operations" },
  { label: "Tracking", value: "Tracking" },
  { label: "Not Sure", value: "Not Sure" },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return createId("zora-session");
}

function introTextForProfile(profile?: ZoraLeadProfile) {
  const anchor = profile ? zoraTrafficIntentAnchor(profile) : "";

  return [
    "Hi, I'm Zora, Opzix's AI Growth Consultant.",
    anchor,
    "I can help you understand your business, identify the likely bottleneck, and choose the next step.",
    "What type of business do you run?",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function trafficIntentFromSearch(search: string): StoredTrafficIntent | undefined {
  const params = new URLSearchParams(search);
  const adContext = {
    utm_campaign: params.get("utm_campaign") || undefined,
    utm_term: params.get("utm_term") || undefined,
    utm_content: params.get("utm_content") || undefined,
    gclid: params.get("gclid") || undefined,
  };
  const values = [
    "zora_intent",
    "intent",
    "keyword",
    "ad_keyword",
    "utm_term",
    "utm_campaign",
    "utm_content",
    "campaign",
    "adgroup",
    "gclid",
  ]
    .map((key) => params.get(key))
    .filter((value): value is string => Boolean(value));
  const detected = detectZoraTrafficIntent(values.join(" "));

  if (!detected && !Object.values(adContext).some(Boolean)) return undefined;

  return {
    trafficIntentCategory: detected?.category,
    trafficIntentText: detected?.text || values.join(" ") || undefined,
    adContext,
  };
}

function storedTrafficIntent(): StoredTrafficIntent | undefined {
  try {
    const fromUrl = trafficIntentFromSearch(window.location.search);

    if (fromUrl) {
      window.sessionStorage.setItem(ZORA_TRAFFIC_INTENT_KEY, JSON.stringify(fromUrl));
      return fromUrl;
    }

    const raw = window.sessionStorage.getItem(ZORA_TRAFFIC_INTENT_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as StoredTrafficIntent;
    return parsed.trafficIntentCategory || parsed.adContext ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isBookingUrl(href: string) {
  const normalized = href.toLowerCase();

  return (
    normalized.includes("/contact") ||
    normalized.includes("calendly.com") ||
    normalized.includes("source=ai-chatbot") ||
    normalized.includes("source=homepage") ||
    normalized.includes("source=services") ||
    normalized.includes("source=ecommerce-audit")
  );
}

function businessTypeFromDetectedIndustry(
  industry?: ZoraIndustry,
): ZoraBusinessType | undefined {
  if (industry === "real_estate") return "Real Estate";
  if (industry === "healthcare_care") return "Care/Healthcare";
  if (industry === "nonprofit_faith_community") return "Other";
  if (
    industry === "b2b_supply_platform" ||
    industry === "ecommerce_dtc" ||
    industry === "industrial_b2b_catalog" ||
    industry === "marketplace_retail"
  ) {
    return "Ecommerce";
  }
  if (
    industry === "service_business" ||
    industry === "local_service" ||
    industry === "education" ||
    industry === "restaurant_hospitality"
  ) {
    return "Service Business";
  }
  return undefined;
}

function shouldUseDetectedIndustry(
  current: ZoraIndustryProfile | undefined,
  next: ZoraIndustryProfile,
) {
  if (next.industry === "unknown") return false;
  if (!current || current.industry === "unknown") return true;
  if (current.industry === next.industry) return true;
  if (next.confidence === "High") return true;
  if (current.confidence === "High" && next.confidence === "Low") return false;
  return next.confidence !== "Low";
}

function normalizeProfile(profile: ZoraLeadProfile): ZoraLeadProfile {
  const industryProfile = detectZoraIndustry({
    userMessage: [
      profile.industry,
      profile.desiredOutcome,
      profile.leadSource,
      profile.trafficIntentText,
      profile.websiteUrl,
    ]
      .filter(Boolean)
      .join(" "),
    websiteUrl: profile.websiteUrl,
    businessType: profile.businessType,
    platformHint: profile.platform,
  });
  const useIndustryProfile = shouldUseDetectedIndustry(
    profile.industryProfile,
    industryProfile,
  );
  const detectedBusinessType = useIndustryProfile
    ? businessTypeFromDetectedIndustry(industryProfile.industry)
    : undefined;
  const resolvedProfile = useIndustryProfile
    ? {
        ...profile,
        businessType:
          detectedBusinessType && industryProfile.confidence === "High"
            ? detectedBusinessType
            : profile.businessType,
        industry: industryProfile.industry,
        industryProfile,
        industryEvidence: industryProfile.evidence,
        buyerJourney: industryProfile.buyerJourney,
        primaryBottlenecks: industryProfile.primaryBottlenecks,
        recommendedFocusAreas: industryProfile.recommendedFocusAreas,
        inferredIndustry: industryProfile.industry,
        inferredBusinessModel: industryProfile.industry,
        inferredFunnelType: industryProfile.buyerJourney,
        industryConfidence: industryProfile.confidence,
        needsBusinessTypeClarification:
          industryProfile.confidence === "High" &&
          detectedBusinessType &&
          profile.businessType &&
          profile.businessType !== detectedBusinessType
            ? false
            : profile.needsBusinessTypeClarification,
        industryMismatchResolved:
          industryProfile.confidence === "High" &&
          detectedBusinessType &&
          profile.businessType &&
          profile.businessType !== detectedBusinessType
            ? true
            : profile.industryMismatchResolved,
      }
    : profile;
  const withRecommendedStep = {
    ...resolvedProfile,
    recommendedNextStep: recommendZoraNextStep(resolvedProfile),
  };

  return {
    ...withRecommendedStep,
    leadQuality: scoreZoraLeadQuality(withRecommendedStep),
  };
}

function normalizeZoraWebsiteInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^www\./i, "")}`;
}

function isLikelyWebsiteUrl(value: string) {
  try {
    const url = new URL(normalizeZoraWebsiteInput(value));
    return Boolean(
      (url.protocol === "http:" || url.protocol === "https:") &&
        url.hostname.includes(".") &&
        !url.hostname.includes(" "),
    );
  } catch {
    return false;
  }
}

function isNoWebsiteAnswer(value: string) {
  return /^\s*no\s*[.!?]*\s*$/i.test(value) || /\b(not yet|no website|don't have|dont have|do not have|none|nope|not right now|skip)\b/i.test(
    value,
  );
}

function isHasWebsiteAnswer(value: string) {
  return /\b(yes|yes i do|yep|yeah|i have (?:a )?(?:website|site|landing page)|we have (?:a )?(?:website|site|landing page)|have (?:a )?(?:website|site|landing page)|already have (?:a )?(?:website|site|landing page))\b/i.test(
    value,
  );
}

function auditHrefForProfile(profile?: ZoraLeadProfile) {
  const normalizedWebsite = profile?.websiteUrl
    ? normalizeZoraWebsiteInput(profile.websiteUrl)
    : "";
  const params = new URLSearchParams({ source: "zora" });

  if (normalizedWebsite && isLikelyWebsiteUrl(normalizedWebsite)) {
    params.set("url", normalizedWebsite);
  }

  return `${FREE_AUDIT_URL.split("?")[0]}?${params.toString()}`;
}

function scannerAction(
  label = "Run Free Audit",
  tone: ZoraActionTone = "secondary",
  profile?: ZoraLeadProfile,
): ZoraAction {
  return {
    kind: "link",
    label,
    href: auditHrefForProfile(profile),
    tone,
  };
}

function bookingAction(
  label = "Book Strategy Call",
  tone: ZoraActionTone = "secondary",
): ZoraAction {
  return {
    kind: "link",
    label,
    href: STRATEGY_CALL_URL,
    booking: true,
    tone,
  };
}

function actionsFromRecommendation(actions: ZoraResponse["recommendedActions"]): ZoraAction[] {
  return actions.flatMap((action) =>
    action === "strategy_call"
      ? [bookingAction("Book Strategy Call", "primary")]
      : action === "free_audit"
        ? [scannerAction("Run Free Audit", "primary")]
        : action === "diagnose"
          ? [
              {
                kind: "start",
                label: "Diagnose my growth system",
                value: "diagnose",
                tone: "primary",
              },
            ]
          : action === "ask_question"
            ? [
                {
                  kind: "start",
                  label: "Ask a Question",
                  value: "ask_question",
                  tone: "text",
                },
              ]
            : [],
  );
}

function actionTone(action: ZoraAction) {
  if (action.kind === "start") return action.tone || "secondary";
  if (action.kind === "link" && action.tone) return action.tone;
  if (action.kind === "link" && action.booking) return "primary";
  if (action.kind === "link") return "secondary";
  return "secondary";
}

function withTrafficIntentAnchor(profile: ZoraLeadProfile, text: string) {
  const anchor = zoraTrafficIntentAnchor(profile);
  return anchor ? `${anchor}\n\n${text}` : text;
}

function phase1Diagnosis(profile: ZoraLeadProfile) {
  const useInferredContext = shouldUseIndustryInference(profile);
  const industry = profile.industryProfile?.industry;

  if (profile.hasNoWebsite) {
    return withTrafficIntentAnchor(profile, "Since there is no live site yet, I would start by mapping the landing page architecture, core offer, lead capture, follow-up path, and launch tracking. The best next step is a strategy call to scope the first version before spending on traffic.");
  }

  if (industry === "real_estate") {
    const correction =
      profile.industryMismatchResolved
        ? "That URL looks more like real estate than ecommerce. I'll treat this as a real estate lead-generation/operations site. "
        : "Because this looks like a real estate business, ";

    return withTrafficIntentAnchor(profile, `${correction}I would first look at lead routing, agent assignment, CRM follow-up, booking flow, local proof, and source tracking.`);
  }

  if (industry === "industrial_b2b_catalog") {
    return withTrafficIntentAnchor(profile, "Because this looks like an industrial/B2B catalog, I would focus on catalog discovery, search, SKU/specs, category hierarchy, and the cart/quote/account path.");
  }

  if (industry === "b2b_supply_platform") {
    return withTrafficIntentAnchor(profile, "Because this looks like a B2B supply or ecommerce infrastructure platform, I would focus on merchant acquisition, onboarding speed, integration clarity, vendor dashboard clarity, supplier logistics visibility, API/plugin stability, and enterprise lead capture.");
  }

  if (industry === "healthcare_care") {
    return withTrafficIntentAnchor(profile, "Because this looks like a care or healthcare services business, I would focus on service clarity, intake flow, referral handoff, trust proof, response time, and internal routing.");
  }

  if (industry === "nonprofit_faith_community") {
    return withTrafficIntentAnchor(profile, "Because this looks like a faith-based or community organization, I would focus on campus discovery, service time clarity, connection forms, small group paths, volunteer routing, and localized follow-up.");
  }

  if (industry === "ecommerce_dtc") {
    return withTrafficIntentAnchor(profile, "Because this looks like a DTC ecommerce store, I would review mobile product discovery, product-page confidence, reviews, shipping/returns clarity, checkout trust, tracking, and email/SMS follow-up.");
  }

  if (industry === "marketplace_retail") {
    return withTrafficIntentAnchor(profile, "Because this looks like marketplace or enterprise retail, I would review search/departments, pickup/delivery clarity, account/cart path, availability, and measurement confidence. Public-page evidence may be directional.");
  }

  if (useInferredContext && profile.inferredBusinessModel === "B2B Ecommerce / Distributor") {
    if (profile.challenge === "Operations") {
      return withTrafficIntentAnchor(profile, "This appears to be an industrial/B2B ecommerce business. Assuming that's correct, I'd look at order flow, fulfillment handoffs, inventory and product data, quote/request paths, account-based purchasing, customer support routing, reporting visibility, and automation opportunities first.");
    }

    return withTrafficIntentAnchor(profile, "This appears to be an industrial/B2B ecommerce business. Assuming that's correct, I'd look at product discovery, quote/request paths, account-based purchasing, follow-up after inquiry, and tracking visibility first.");
  }

  if (useInferredContext && profile.inferredBusinessModel === "DTC Ecommerce") {
    return withTrafficIntentAnchor(profile, "This appears to be a DTC ecommerce brand. Assuming that's correct, I'd look at product discovery, mobile buying experience, checkout confidence, retention, and tracking visibility first.");
  }

  if (useInferredContext && profile.inferredIndustry === "Real Estate") {
    return withTrafficIntentAnchor(profile, "This appears to be a real estate lead-generation business. Assuming that's correct, I'd look at seller/buyer lead capture, local authority proof, appointment booking, and follow-up speed first.");
  }

  if (useInferredContext && profile.inferredBusinessModel === "Care Provider / Service Organization") {
    return withTrafficIntentAnchor(profile, "This appears to be a care provider or service organization. Assuming that's correct, I'd look at intake flow, referral paths, trust proof, service clarity, and response process first.");
  }

  if (useInferredContext && profile.inferredBusinessModel === "Faith-Based / Community Organization") {
    return withTrafficIntentAnchor(profile, "This appears to be a faith-based or community organization. Assuming that's correct, I'd look at campus discovery, service times, connection forms, small group paths, volunteer routing, and localized follow-up first.");
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at product discovery, mobile UX, checkout confidence, and tracking first. The best next step is to run a free audit so Opzix can review the actual customer journey.");
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Operations") {
    return withTrafficIntentAnchor(profile, "Using the business type you selected, I'd look at order flow, fulfillment handoffs, inventory/product data, customer support routing, reporting visibility, and automation opportunities first.");
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Tracking") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at GA4/event coverage, checkout-step tracking, attribution, product discovery signals, ad platform pixels, and reporting visibility first.");
  }

  if (profile.businessType === "Service Business" && profile.challenge === "Follow-up") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at intake flow, response speed, CRM routing, and appointment booking first. The best next step is a strategy call or quick systems review.");
  }

  if (profile.businessType === "Real Estate" && profile.challenge === "Traffic") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at seller and buyer lead capture, local landing pages, follow-up speed, and booking flow first.");
  }

  if (profile.businessType === "Care/Healthcare" && profile.challenge === "Operations") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at intake forms, referral flow, trust signals, booking/contact flow, and internal routing first.");
  }

  if (profile.businessType === "Ecommerce") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at product discovery, customer journey clarity, mobile UX, tracking, and checkout confidence first.");
  }

  if (profile.businessType === "Service Business") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at lead capture, intake flow, response speed, booking, and follow-up handoff first.");
  }

  if (profile.businessType === "Real Estate") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at lead capture, local proof, landing-page clarity, follow-up speed, and booking flow first.");
  }

  if (profile.businessType === "Care/Healthcare") {
    return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at trust signals, intake flow, referral paths, response process, and internal routing first.");
  }

  return withTrafficIntentAnchor(profile, "Based on what you shared, I'd look at the customer journey, lead capture, follow-up, tracking, and operations flow first.");
}

function recommendedPhase1Step(profile: ZoraLeadProfile) {
  if (profile.recommendedNextStep === "strategy_call") return "strategy_call";
  if (profile.recommendedNextStep === "free_audit") return "audit";

  if (profile.businessType === "Ecommerce" && profile.challenge === "Operations") {
    return "strategy_call";
  }

  const callFirst =
    !profile.websiteUrl ||
    ((profile.businessType === "Service Business" ||
      profile.businessType === "Real Estate" ||
      profile.businessType === "Care/Healthcare") &&
      (profile.challenge === "Follow-up" || profile.challenge === "Operations"));

  if (profile.websiteUrl && profile.businessType === "Ecommerce") {
    return "audit";
  }

  return callFirst ? "strategy_call" : "audit";
}

function phase1CtaActions(profile: ZoraLeadProfile): ZoraAction[] {
  const ask: ZoraAction = {
    kind: "start",
    label: "Ask a Question",
    value: "ask_question",
    tone: "text",
  };

  if (profile.hasNoWebsite) {
    return [bookingAction("Book Strategy Call", "primary"), ask];
  }

  const auditFirst = recommendedPhase1Step(profile) === "audit";
  const audit = scannerAction("Run Free Audit", auditFirst ? "primary" : "secondary", profile);
  const call = bookingAction("Book Strategy Call", auditFirst ? "secondary" : "primary");

  return auditFirst ? [audit, call, ask] : [call, audit, ask];
}

function hasWebsiteState(profile: ZoraLeadProfile) {
  if (profile.hasNoWebsite) return false;
  if (profile.hasWebsiteOrLandingPage || profile.websiteUrl) return true;
  return undefined;
}

function shouldShowPhase1Actions(profile: ZoraLeadProfile) {
  if (profile.needsBusinessTypeClarification) {
    return false;
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    return Boolean(profile.websiteUrl || profile.hasNoWebsite);
  }

  return Boolean(
    profile.businessType &&
      (profile.challenge ||
        profile.websiteUrl ||
        profile.hasNoWebsite ||
        profile.platform ||
        profile.desiredOutcome ||
        profile.leadSource ||
        profile.conversionRate),
  );
}

function phase1DiagnosisMessage(profile: ZoraLeadProfile): ChatMessage {
  return {
    id: createId("assistant"),
    role: "assistant",
    text: phase1Diagnosis(profile),
    actions: phase1CtaActions(profile),
  };
}

function actionClassName(action: ZoraAction) {
  const tone = actionTone(action);
  const base =
    "inline-flex min-h-8 items-center justify-center gap-2 rounded-full px-3 py-1.5 text-left text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/45";

  if (tone === "primary") {
    return `${base} border border-brand-cyan/70 bg-brand-cyan/20 text-primary shadow-[0_0_24px_rgba(6,182,212,0.12)] hover:bg-brand-cyan/28`;
  }

  if (tone === "text") {
    return `${base} border border-transparent bg-transparent px-1.5 text-muted hover:text-primary`;
  }

  return `${base} border border-dark-border bg-white/[0.045] text-secondary hover:border-brand-cyan/50 hover:bg-brand-cyan/12 hover:text-primary`;
}

function questionForStep(step: GuidedStep): ChatMessage {
  if (step === "businessType") {
    return {
      id: createId("assistant"),
      role: "assistant",
      text: "What type of business do you run?",
      actions: businessTypeChoices.map((choice) => ({
        kind: "choice",
        label: choice.label,
        step,
        value: choice.value,
      })),
    };
  }

  if (step === "challenge") {
    return {
      id: createId("assistant"),
      role: "assistant",
      text: "What's the biggest challenge?",
      actions: challengeChoices.map((choice) => ({
        kind: "choice",
        label: choice.label,
        step,
        value: choice.value,
      })),
    };
  }

  return {
    id: createId("assistant"),
    role: "assistant",
    text: "Do you already have a website URL I can use as context?",
  };
}

function nextGuidedStep(profile: ZoraLeadProfile): GuidedStep | null {
  if (!profile.businessType) return "businessType";
  if (!profile.challenge) return "challenge";
  if (profile.websiteUrl === undefined && !profile.hasNoWebsite) return "websiteUrl";
  return null;
}

function guidedCompletionMessage(profile: ZoraLeadProfile): ChatMessage {
  return phase1DiagnosisMessage(profile);
}

function businessTypeClarificationMessage(profile: ZoraLeadProfile): ChatMessage {
  const inferred = profile.inferredIndustry || "another industry";
  const selected = profile.businessType || "the selected business type";
  const inferredBusinessType =
    inferred === "Real Estate"
      ? "Real Estate"
      : inferred === "Healthcare / Care"
        ? "Care/Healthcare"
        : profile.inferredBusinessModel?.includes("Ecommerce")
          ? "Ecommerce"
          : inferred === "Local Service Business"
            ? "Service Business"
            : "Other";

  return {
    id: createId("assistant"),
    role: "assistant",
    text: `Quick check: you selected ${selected}, but this domain appears to be ${inferred.toLowerCase()}-related. Should I diagnose this as ${selected.toLowerCase()} or a ${inferred.toLowerCase()} business?`,
    actions: [
      {
        kind: "choice",
        label: selected,
        step: "businessType",
        value: selected,
      },
      {
        kind: "choice",
        label: inferredBusinessType === "Care/Healthcare" ? "Healthcare / Care" : inferredBusinessType,
        step: "businessType",
        value: inferredBusinessType,
      },
      {
        kind: "choice",
        label: "Other",
        step: "businessType",
        value: "Other",
      },
    ],
  };
}

function faqActions(): ZoraAction[] {
  return zoraFaqItems.map((item) => ({
    kind: "faq",
    label: item.question,
    question: item.question,
  }));
}

function matchGuidedText(step: GuidedStep, text: string) {
  const normalized = text.trim().toLowerCase();

  if (!normalized) return null;

  if (step === "businessType") {
    return businessTypeChoices.find((choice) =>
      normalized.includes(choice.value.toLowerCase()) ||
      normalized.includes(choice.label.toLowerCase()),
    )?.value;
  }

  if (step === "challenge") {
    return challengeChoices.find((choice) =>
      normalized.includes(choice.value.toLowerCase()) ||
      normalized.includes(choice.label.toLowerCase()),
    )?.value;
  }

  if (step === "websiteUrl") {
    if (isNoWebsiteAnswer(text)) return "";
    if (isLikelyWebsiteUrl(text)) return normalizeZoraWebsiteInput(text);
  }

  return null;
}

export default function OpzixAIAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [flowStep, setFlowStep] = useState<GuidedStep | null>("businessType");
  const [leadProfile, setLeadProfile] = useState<ZoraLeadProfile>({});
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "zora-intro",
      role: "assistant",
      text: introTextForProfile(),
      actions: businessTypeChoices.map((choice) => ({
        kind: "choice",
        label: choice.label,
        step: "businessType",
        value: choice.value,
      })),
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    const trafficIntent = storedTrafficIntent();

    if (!trafficIntent) return;

    setLeadProfile((current) => {
      if (current.trafficIntentCategory === trafficIntent.trafficIntentCategory) {
        return current;
      }

      return normalizeProfile({
        ...current,
        ...trafficIntent,
        desiredOutcome: current.desiredOutcome || trafficIntent.trafficIntentText,
      });
    });
    setMessages((current) =>
      current.map((message) =>
        message.id === "zora-intro"
          ? {
              ...message,
              text: introTextForProfile(trafficIntent),
            }
          : message,
      ),
    );
  }, []);

  const profileSummary = useMemo(
    () =>
      [
        leadProfile.businessType,
        leadProfile.platform,
        leadProfile.revenueRange,
        leadProfile.challenge,
      ].filter((item): item is string => Boolean(item)),
    [leadProfile],
  );

  function persistChatbotState(nextState: "open" | "closed") {
    try {
      window.localStorage.setItem(CHATBOT_STATE_KEY, nextState);
    } catch {
      // Local storage can be unavailable in private browsing modes.
    }
  }

  function appendMessages(nextMessages: ChatMessage[]) {
    setMessages((current) => [...current, ...nextMessages]);
  }

  function clearIntroActions() {
    setMessages((current) =>
      current.map((message) =>
        message.id === "zora-intro" ? { ...message, actions: undefined } : message,
      ),
    );
  }

  function zoraSessionId() {
    if (sessionIdRef.current) {
      return sessionIdRef.current;
    }

    try {
      const existing = window.sessionStorage.getItem(ZORA_SESSION_ID_KEY);

      if (existing) {
        sessionIdRef.current = existing;
        return existing;
      }

      const nextId = createSessionId();
      window.sessionStorage.setItem(ZORA_SESSION_ID_KEY, nextId);
      sessionIdRef.current = nextId;
      return nextId;
    } catch {
      const nextId = createSessionId();
      sessionIdRef.current = nextId;
      return nextId;
    }
  }

  function currentSourcePath() {
    return `${window.location.pathname}${window.location.search}`;
  }

  function trackZoraEvent(eventType: string, profile = leadProfile) {
    try {
      void fetch("/api/zora-conversion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventType,
          sessionId: zoraSessionId(),
          leadProfile: normalizeProfile(profile),
          sourcePath: currentSourcePath(),
        }),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Conversion tracking should never block chat navigation.
    }
  }

  function closeChatbot({ persist = true } = {}) {
    setOpen(false);
    setFlowStep(null);

    if (persist) {
      persistChatbotState("closed");
    }
  }

  function toggleChatbot() {
    setOpen((current) => {
      const nextOpen = !current;
      persistChatbotState(nextOpen ? "open" : "closed");
      return nextOpen;
    });
  }

  function openBookingUrlAfterClose(href: string) {
    closeChatbot();

    window.setTimeout(() => {
      window.location.assign(href);
    }, BOOKING_LINK_DELAY_MS);
  }

  function routeToLink(action: Extract<ZoraAction, { kind: "link" }>) {
    if (action.booking || isBookingUrl(action.href)) {
      trackZoraEvent("strategy_call_clicked");
      openBookingUrlAfterClose(action.href);
      return;
    }

    if (action.href.includes("/tools/ecommerce-audit-scanner")) {
      trackZoraEvent("audit_clicked");
    }

    closeChatbot();
    window.location.assign(action.href);
  }

  function routeToScannerHref(href: string) {
    trackZoraEvent("audit_clicked");
    closeChatbot();
    window.setTimeout(() => {
      window.location.assign(href);
    }, BOOKING_LINK_DELAY_MS);
  }

  function handleStructuredAction(action: ZoraResponse["action"] | undefined) {
    if (!action) return;

    if (action.type === "start_audit") {
      routeToScannerHref(auditHrefForProfile({ websiteUrl: action.url }));
      return;
    }

    if (action.type === "book_strategy_call") {
      trackZoraEvent("strategy_call_clicked");
      openBookingUrlAfterClose(STRATEGY_CALL_URL);
    }
  }

  function startGuidedFlow() {
    const nextProfile = normalizeProfile(leadProfile);
    const hasExistingContext = Boolean(
      nextProfile.businessType ||
        nextProfile.challenge ||
        nextProfile.websiteUrl ||
        nextProfile.hasNoWebsite ||
        nextProfile.industryProfile,
    );
    const firstMissingStep = nextGuidedStep(nextProfile);

    if (
      hasExistingContext &&
      !firstMissingStep &&
      (nextProfile.businessType ||
        nextProfile.websiteUrl ||
        nextProfile.challenge ||
        nextProfile.hasNoWebsite)
    ) {
      const localResponse = buildZoraResponse("Diagnose my growth system", nextProfile);
      const responseProfile = normalizeProfile(localResponse.leadProfile);
      const responseActions =
        responseProfile.duplicateCommandCount && responseProfile.duplicateCommandCount > 0
          ? []
          : localResponse.responseMode === "diagnosis" && shouldShowPhase1Actions(responseProfile)
            ? phase1CtaActions(responseProfile)
            : actionsFromRecommendation(localResponse.recommendedActions);

      setFlowStep(null);
      setLeadProfile(responseProfile);
      appendMessages([
        {
          id: createId("user"),
          role: "user",
          text: "Diagnose my growth system",
        },
        {
          id: createId("assistant"),
          role: "assistant",
          text: localResponse.reply,
          actions: responseActions,
        },
      ]);
      return;
    }

    const firstStep = firstMissingStep || "businessType";
    setFlowStep(firstStep);
    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "Diagnose my growth system",
      },
      questionForStep(firstStep),
    ]);
  }

  function showScannerRoute() {
    const nextProfile = normalizeProfile(leadProfile);
    if (nextProfile.hasNoWebsite) {
      appendMessages([
        {
          id: createId("user"),
          role: "user",
          text: "Run free audit",
        },
        {
          id: createId("assistant"),
          role: "assistant",
          text:
            "There is no live site yet. The better next step is a strategy call to map the first landing page, offer, follow-up path, tracking, and launch timeline.",
          actions: [bookingAction("Book Strategy Call", "primary")],
        },
      ]);
      return;
    }

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "Run free audit",
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text:
          "I can give you a quick recommendation here, but the free audit scanner can review your actual website and generate a more detailed roadmap.",
        actions: [scannerAction("Run Free Audit", "primary", nextProfile), bookingAction()],
      },
    ]);
  }

  function showQuestionPrompt() {
    setFlowStep(null);
    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "Ask a Question",
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text:
          "Ask me anything about websites, ecommerce systems, AI assistants, automation, tracking, lead generation, pricing ranges, or timelines.",
      },
    ]);
  }

  function showFaq() {
    setFlowStep(null);
    clearIntroActions();
    trackZoraEvent("faq_opened");
    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: "FAQ",
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text: "Pick a common question and I'll keep the answer practical.",
        actions: faqActions(),
      },
    ]);
  }

  function answerFaq(question: string) {
    const item = zoraFaqItems.find((faq) => faq.question === question);

    if (!item) return;

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: question,
      },
      {
        id: createId("assistant"),
        role: "assistant",
        text: item.answer,
        actions: leadProfile.hasNoWebsite
          ? [bookingAction("Book Strategy Call", "primary")]
          : [scannerAction("Run Free Audit", "secondary", leadProfile), bookingAction()],
      },
    ]);
  }

  function applyGuidedChoice(step: GuidedStep, value: string, label = value) {
    let patch: ZoraLeadProfile;

    if (step === "businessType") {
      patch = {
        businessType: value as ZoraBusinessType,
        needsBusinessTypeClarification: false,
        industryMismatchResolved: Boolean(leadProfile.needsBusinessTypeClarification),
      };
    } else if (step === "challenge") {
      patch = { challenge: value as ZoraChallenge };
    } else if (value) {
      const inference = inferIndustryFromUrl(value);
      const mismatch = hasUrlBusinessTypeMismatch(leadProfile.businessType, inference);
      patch = {
        websiteUrl: value,
        hasNoWebsite: false,
        hasWebsiteOrLandingPage: true,
        inferredIndustry: inference.inferredIndustry,
        inferredBusinessModel: inference.inferredBusinessModel,
        inferredFunnelType: inference.inferredFunnelType,
        industryConfidence: inference.industryConfidence,
        needsBusinessTypeClarification: mismatch,
        industryMismatchResolved: false,
      };
    } else {
      patch = {
        websiteUrl: "",
        hasNoWebsite: true,
        hasWebsiteOrLandingPage: false,
        needsBusinessTypeClarification: false,
      };
    }

    const nextProfile = normalizeProfile({
      ...leadProfile,
      ...patch,
    });
    const nextStep = nextProfile.needsBusinessTypeClarification
      ? null
      : nextGuidedStep(nextProfile);

    setLeadProfile(nextProfile);
    setFlowStep(nextStep);
    if (!nextStep) {
      trackZoraEvent("qualification_completed", nextProfile);
    }

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: label || "Skip",
      },
      nextProfile.needsBusinessTypeClarification
        ? businessTypeClarificationMessage(nextProfile)
        : nextStep
          ? questionForStep(nextStep)
          : guidedCompletionMessage(nextProfile),
    ]);
  }

  function handleAction(action: ZoraAction) {
    if (action.kind === "start" || action.kind === "choice") {
      clearIntroActions();
    }

    if (action.kind === "link") {
      routeToLink(action);
      return;
    }

    if (action.kind === "faq") {
      answerFaq(action.question);
      return;
    }

    if (action.kind === "choice") {
      applyGuidedChoice(action.step, action.value, action.label);
      return;
    }

    if (action.value === "diagnose") {
      startGuidedFlow();
      return;
    }

    if (action.value === "free_audit") {
      if (leadProfile.hasNoWebsite) {
        showScannerRoute();
        return;
      }

      routeToLink(scannerAction("Run Free Audit", "primary", normalizeProfile(leadProfile)) as Extract<ZoraAction, { kind: "link" }>);
      return;
    }

    if (action.value === "strategy_call") {
      trackZoraEvent("strategy_call_clicked");
      openBookingUrlAfterClose(STRATEGY_CALL_URL);
      return;
    }

    if (action.value === "ask_question") {
      trackZoraEvent("ask_question_clicked");
      showQuestionPrompt();
      return;
    }

    if (action.value === "faq") {
      showFaq();
      return;
    }
  }

  async function submitFreeText(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = input.trim();

    if (!message || isThinking) return;

    setInput("");

    if (flowStep) {
      const matchedValue = matchGuidedText(flowStep, message);

      if (typeof matchedValue === "string") {
        applyGuidedChoice(flowStep, matchedValue, message);
        return;
      }

      if (flowStep === "websiteUrl") {
        if (isHasWebsiteAnswer(message)) {
          const nextProfile = normalizeProfile({
            ...leadProfile,
            hasWebsiteOrLandingPage: true,
            hasNoWebsite: false,
          });
          setLeadProfile(nextProfile);
          setFlowStep("websiteUrl");
          appendMessages([
            {
              id: createId("user"),
              role: "user",
              text: message,
            },
            {
              id: createId("assistant"),
              role: "assistant",
              text: "Great - what is the URL, or would you rather talk through the strategy first?",
            },
          ]);
          return;
        }

        appendMessages([
          {
            id: createId("user"),
            role: "user",
            text: message,
          },
          {
            id: createId("assistant"),
            role: "assistant",
            text:
              "I can use a URL like example.com, https://example.com, or www.example.com. If you do not have one yet, say \"not yet\" and I'll continue.",
          },
        ]);
        return;
      }
    }

    const pendingGuidedStep = flowStep;
    setFlowStep(null);
    setIsThinking(true);
    clearIntroActions();

    const localResponse = buildZoraResponse(message, leadProfile);

    appendMessages([
      {
        id: createId("user"),
        role: "user",
        text: message,
      },
    ]);

    try {
      const response = await fetch("/api/zora-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          leadProfile,
          hasWebsite: hasWebsiteState(leadProfile),
          sessionId: zoraSessionId(),
          sourcePath: currentSourcePath(),
        }),
      });

      const payload = response.ok
        ? ((await response.json()) as ZoraApiResponse)
        : localResponse;
      const nextProfile = normalizeProfile(payload.leadProfile || localResponse.leadProfile);
      const responseMode = payload.responseMode || localResponse.responseMode;
      const shouldResumeGuidedStep =
        responseMode === "company_background" && Boolean(pendingGuidedStep);
      const resumedGuidedQuestion =
        shouldResumeGuidedStep && pendingGuidedStep
          ? questionForStep(pendingGuidedStep)
          : null;
      const responseActions =
        resumedGuidedQuestion
          ? resumedGuidedQuestion.actions || []
          : responseMode === "diagnosis" && shouldShowPhase1Actions(nextProfile)
            ? phase1CtaActions(nextProfile)
            : actionsFromRecommendation(
                payload.recommendedActions || localResponse.recommendedActions,
              );

      setLeadProfile(nextProfile);
      if (shouldResumeGuidedStep) {
        setFlowStep(pendingGuidedStep);
      }
      appendMessages([
        {
          id: createId("assistant"),
          role: "assistant",
          text: payload.reply || localResponse.reply,
          actions: responseActions,
        },
      ]);
      handleStructuredAction(payload.action || localResponse.action);
    } catch {
      const nextProfile = normalizeProfile(localResponse.leadProfile);
      const shouldResumeGuidedStep =
        localResponse.responseMode === "company_background" && Boolean(pendingGuidedStep);
      const resumedGuidedQuestion =
        shouldResumeGuidedStep && pendingGuidedStep
          ? questionForStep(pendingGuidedStep)
          : null;
      const responseActions =
        resumedGuidedQuestion
          ? resumedGuidedQuestion.actions || []
          : localResponse.responseMode === "diagnosis" && shouldShowPhase1Actions(nextProfile)
            ? phase1CtaActions(nextProfile)
            : actionsFromRecommendation(localResponse.recommendedActions);
      setLeadProfile(nextProfile);
      if (shouldResumeGuidedStep) {
        setFlowStep(pendingGuidedStep);
      }
      appendMessages([
        {
          id: createId("assistant"),
          role: "assistant",
          text: localResponse.reply,
          actions: responseActions,
        },
      ]);
      handleStructuredAction(localResponse.action);
    } finally {
      setIsThinking(false);
    }
  }

  useEffect(() => {
    function handleDocumentClick(event: globalThis.MouseEvent) {
      if (event.defaultPrevented) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const link = target.closest<HTMLAnchorElement>("a[href]");

      if (!link || !isBookingUrl(link.href)) {
        return;
      }

      const isModifiedClick =
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;

      if (isModifiedClick || link.hasAttribute("download")) {
        closeChatbot();
        return;
      }

      event.preventDefault();
      openBookingUrlAfterClose(link.href);
    }

    document.addEventListener("click", handleDocumentClick, true);

    return () => {
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages, isThinking]);

  return (
    <div className="opzix-ai-shell">
      {open && (
        <div className="opzix-ai-panel" role="dialog" aria-label="Zora AI Growth Consultant">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-dark-border pb-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                <Sparkles className="h-3.5 w-3.5" />
                Zora
              </p>
              <h2 className="mt-1.5 text-lg font-bold leading-snug text-primary">
                AI Growth Consultant
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Diagnose, prioritize, and route the next move.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={showFaq}
                className="rounded-full border border-transparent px-2 py-1 text-xs font-semibold text-muted transition-colors hover:text-primary"
              >
                FAQ
              </button>
              <button
                type="button"
                onClick={() => closeChatbot()}
                className="rounded-full border border-dark-border bg-white/5 p-2 text-muted transition-colors hover:border-brand-cyan hover:text-primary"
                aria-label="Close Zora"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {profileSummary.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profileSummary.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-[0.7rem] font-semibold text-primary"
                >
                  {item}
                </span>
              ))}
            </div>
          )}

          <div className="opzix-ai-messages mt-3 space-y-2.5 pr-1">
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? "text-right" : ""}>
                <div
                  className={`inline-block max-w-[92%] rounded-xl border px-3 py-2.5 text-left text-sm leading-relaxed ${
                    message.role === "user"
                      ? "border-brand-cyan/45 bg-brand-cyan/14 text-primary"
                      : "border-dark-border bg-white/[0.035] text-secondary"
                  }`}
                >
                  <p className="whitespace-pre-line">{message.text}</p>
                </div>

                {message.actions && message.actions.length > 0 && (
                  <div className="opzix-ai-actions mt-2 flex flex-wrap gap-1.5">
                    {message.actions.map((action) => (
                      <button
                        type="button"
                        key={`${message.id}-${action.label}`}
                        onClick={() => handleAction(action)}
                        className={actionClassName(action)}
                      >
                        {action.kind === "link" && action.booking ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : action.kind === "link" ? (
                          <ArrowRight className="h-3.5 w-3.5" />
                        ) : null}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isThinking && (
              <div className="inline-flex rounded-2xl border border-dark-border bg-white/[0.035] px-3.5 py-3 text-sm text-secondary">
                Zora is thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={submitFreeText} className="opzix-ai-form mt-3 flex shrink-0 gap-2 border-t border-dark-border pt-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Zora what to fix next..."
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-brand-cyan/25 bg-white/[0.055] px-3 text-sm text-primary outline-none placeholder:text-muted focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/25"
            />
            <button
              type="submit"
              disabled={isThinking || !input.trim()}
              className="inline-flex min-h-11 w-11 items-center justify-center rounded-xl border border-brand-cyan/45 bg-brand-cyan/18 text-primary transition-all hover:border-brand-cyan hover:bg-brand-cyan/25 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message to Zora"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      )}

      {!open && (
        <button
          type="button"
          className="opzix-ai-button"
          onClick={toggleChatbot}
          aria-expanded={open}
          aria-label="Open Zora AI Growth Consultant"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Zora
        </button>
      )}
    </div>
  );
}
