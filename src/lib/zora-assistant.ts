export type ZoraBusinessType =
  | "Ecommerce"
  | "Service Business"
  | "Real Estate"
  | "Care/Healthcare"
  | "Other";

export type ZoraChallenge =
  | "Traffic"
  | "Conversion"
  | "Operations"
  | "Tracking"
  | "Follow-up"
  | "Website"
  | "Not Sure";

export type ZoraRevenueRange = "Under $100k" | "$100k-$1M" | "$1M+";

export type ZoraLeadQuality = "low" | "medium" | "high";
export type ZoraLeadTemperature = "cold" | "warm" | "hot";

export type ZoraNextStep = "free_audit" | "strategy_call" | "ask_question";

export type ZoraTopic =
  | "offer_clarity"
  | "tracking_visibility"
  | "follow_up_handoff"
  | "landing_page"
  | "booking_flow"
  | "product_discovery"
  | "checkout_confidence"
  | "crm_routing"
  | "lead_capture";

export type ZoraRoadmapStep = {
  title: string;
  reason: string;
  validation: string;
  expectedImpact: string;
  costRange: string;
  timeline: string;
};

export type ZoraIndustryInference = {
  inferredIndustry?: string;
  inferredBusinessModel?: string;
  inferredFunnelType?: string;
  industryConfidence?: number;
};

export type ZoraFunnelStage =
  | "Before product pages"
  | "Product pages"
  | "Cart"
  | "Checkout";

export type ZoraDropoffDetail =
  | "One product cart"
  | "Larger cart"
  | "Shipping step"
  | "Payment step"
  | "Checkout error";

export type ZoraProductScope = "All products" | "Few high-traffic products";

export type ZoraCartBuildSource =
  | "Search"
  | "Collections"
  | "Product recommendations"
  | "Unknown";

export type ZoraShippingPricing =
  | "Free shipping"
  | "Flat-rate shipping"
  | "Calculated at checkout"
  | "Unknown";

export type ZoraRecommendationSetup =
  | "Manually curated"
  | "App-generated"
  | "Mixed"
  | "Unknown";

export type ZoraLeadDestination =
  | "CRM"
  | "Email inbox"
  | "Spreadsheet"
  | "Unstructured"
  | "Unknown";

export type ZoraNotificationChannel =
  | "Email"
  | "SMS/app"
  | "Both"
  | "None"
  | "Unknown";

export type ZoraIntent =
  | "diagnosis"
  | "capability"
  | "small_talk"
  | "thanks"
  | "timeline"
  | "pricing"
  | "audit_request"
  | "booking_request"
  | "recommendation"
  | "consultant"
  | "focus_request"
  | "next_step"
  | "out_of_scope"
  | "clarify";

export type ZoraLeadProfile = {
  visitorName?: string;
  businessType?: ZoraBusinessType;
  platform?: string;
  industry?: string;
  toolsMentioned?: string[];
  leadSource?: string;
  conversionRate?: string;
  funnelStage?: ZoraFunnelStage;
  dropoffDetail?: ZoraDropoffDetail;
  productScope?: ZoraProductScope;
  cartBuildSource?: ZoraCartBuildSource;
  shippingPricing?: ZoraShippingPricing;
  recommendationSetup?: ZoraRecommendationSetup;
  leadDestination?: ZoraLeadDestination;
  notificationChannel?: ZoraNotificationChannel;
  desiredOutcome?: string;
  revenueRange?: ZoraRevenueRange;
  annualRevenueText?: string;
  challenge?: ZoraChallenge;
  websiteUrl?: string;
  inferredIndustry?: string;
  inferredBusinessModel?: string;
  inferredFunnelType?: string;
  industryConfidence?: number;
  needsBusinessTypeClarification?: boolean;
  industryMismatchResolved?: boolean;
  hasWebsiteOrLandingPage?: boolean;
  hasNoWebsite?: boolean;
  email?: string;
  recommendedNextStep?: ZoraNextStep;
  recommendedFocusAreas?: string[];
  recommendationRoadmap?: ZoraRoadmapStep[];
  currentTopic?: ZoraTopic;
  currentTopicDepth?: number;
  leadQuality?: ZoraLeadQuality;
  leadTemperature?: ZoraLeadTemperature;
  leadScore?: number;
  hasSeenSoftClose?: boolean;
};

export type ZoraMessageAnalysis = {
  intent: ZoraIntent;
  visitorName?: string;
  businessType?: ZoraBusinessType;
  platform?: string;
  industry?: string;
  toolsMentioned?: string[];
  leadSource?: string;
  conversionRate?: string;
  funnelStage?: ZoraFunnelStage;
  dropoffDetail?: ZoraDropoffDetail;
  productScope?: ZoraProductScope;
  cartBuildSource?: ZoraCartBuildSource;
  shippingPricing?: ZoraShippingPricing;
  recommendationSetup?: ZoraRecommendationSetup;
  leadDestination?: ZoraLeadDestination;
  notificationChannel?: ZoraNotificationChannel;
  desiredOutcome?: string;
  revenueRange?: ZoraRevenueRange;
  annualRevenueText?: string;
  challenge?: ZoraChallenge;
  websiteUrl?: string;
  currentTopic?: ZoraTopic;
  hasWebsiteOrLandingPage?: boolean;
  hasNoWebsite?: boolean;
  email?: string;
  confidenceScore: number;
  outOfScope: boolean;
};

export type ZoraResponse = {
  reply: string;
  leadProfile: ZoraLeadProfile;
  currentMessageAnalysis: ZoraMessageAnalysis;
  confidenceScore: number;
  profileChanges: string[];
  responseMode: ZoraIntent;
  recommendedActions: Array<"free_audit" | "strategy_call" | "diagnose" | "ask_question">;
};

const businessTypePatterns: Array<[ZoraBusinessType, RegExp]> = [
  [
    "Ecommerce",
    /\b(ecommerce|e-commerce|shopify|woocommerce|bigcommerce|online store|storefront|products?|checkout|cart|sku|catalog|dtc)\b/i,
  ],
  [
    "Real Estate",
    /\b(real estate|realtor|brokerage|property|properties|listing|listings|seller leads?|buyer leads?|agent)\b/i,
  ],
  [
    "Care/Healthcare",
    /\b(care|healthcare|health care|clinic|medical|dental|therapy|home care|senior care|patient|disability services?|client intake)\b/i,
  ],
  [
    "Service Business",
    /\b(service business|home service|agency|consulting|consultant|coach|law firm|accounting|contractor|salon|spa|fitness|appointment|booking|quote)\b/i,
  ],
];

const challengePatterns: Array<[ZoraChallenge, RegExp]> = [
  [
    "Follow-up",
    /\b(follow[ -]?up|followup|follows up|nobody follows|nurture|crm|email sequence|lead routing|respond|response time|no-show|pipeline)\b/i,
  ],
  [
    "Conversion",
    /\b(conversion|conversions|convert|converting|checkout|cart|abandon|cvr|rate|0\.\d+%|1\.\d+%|2\.\d+%|sales path|buying path|product discovery|intake requests?|requests?)\b/i,
  ],
  [
    "Tracking",
    /\b(tracking|analytics|ga4|pixel|attribution|utm|reporting|data|measure|measurement|roas|dashboard)\b/i,
  ],
  [
    "Operations",
    /\b(operations|manual|workflow|fulfillment|inventory|orders?|erp|netsuite|integration|handoff|backend|admin)\b/i,
  ],
  [
    "Traffic",
    /\b(traffic|visitors|ads|advertising|google ads|facebook ads|meta ads|seo|leads|lead volume|seller leads?|buyer leads?|awareness)\b/i,
  ],
  [
    "Website",
    /\b(website|site|redesign|landing page|homepage|mobile|speed|ux|navigation|copy|layout)\b/i,
  ],
];

const platformPatterns: Array<[string, RegExp]> = [
  ["Shopify", /\bshopify\b/i],
  ["WooCommerce", /\bwoo ?commerce\b/i],
  ["BigCommerce", /\bbigcommerce\b/i],
  ["WordPress", /\bwordpress\b/i],
  ["Webflow", /\bwebflow\b/i],
  ["Squarespace", /\bsquarespace\b/i],
  ["Wix", /\bwix\b/i],
];

const toolPatterns: Array<[string, RegExp]> = [
  ...platformPatterns,
  ["NetSuite", /\bnetsuite\b/i],
  ["HubSpot", /\bhubspot\b/i],
  ["Klaviyo", /\bklaviyo\b/i],
];

export const zoraFaqItems = [
  {
    question: "What does Opzix build?",
    answer:
      "Opzix builds conversion-focused websites, ecommerce systems, AI assistants, automation workflows, dashboards, integrations, lead generation systems, and audit-based implementation roadmaps. Want me to point you to the right next step?",
  },
  {
    question: "Do you build ecommerce systems?",
    answer:
      "Yes. Opzix helps with ecommerce storefronts, product discovery, checkout confidence, tracking, integrations, and operational workflows around orders and fulfillment. Would you like to run the free audit?",
  },
  {
    question: "Can you build AI chatbots?",
    answer:
      "Yes. Opzix builds AI assistants that answer useful questions, qualify visitors, capture context, route leads, and connect to follow-up workflows. Would you like to book a strategy call?",
  },
  {
    question: "Can you help with lead generation?",
    answer:
      "Yes. Opzix helps connect the website, offer, form flow, CRM, booking path, and follow-up so more visitors become qualified opportunities. Want me to point you to the right next step?",
  },
  {
    question: "Can you automate workflows?",
    answer:
      "Yes. Opzix plans and builds workflows across forms, CRM, email, ecommerce, booking, dashboards, and backend tools so fewer steps rely on manual handoff. Would you like to book a strategy call?",
  },
  {
    question: "What are the pricing ranges?",
    answer:
      "Opzix uses directional planning ranges, not fixed quotes inside chat. Focused improvements can start in the low thousands, while larger websites, ecommerce systems, AI assistants, and integrations depend on scope and access. Want me to point you to the right next step?",
  },
  {
    question: "How long does it take?",
    answer:
      "Focused improvements may take 1-3 weeks, while larger builds or integrations can take longer depending on scope, content, platform access, and testing needs. Would you like to book a strategy call?",
  },
  {
    question: "What happens on a strategy call?",
    answer:
      "A strategy call is a practical conversation about your bottleneck, current systems, and highest-value next step. It is not a hard sell or a final proposal. Would you like to book a strategy call?",
  },
  {
    question: "What does the free audit scanner do?",
    answer:
      "The free audit scanner reviews public-page signals from your actual website and produces a more detailed roadmap around UX, conversion, tracking, and operations. Would you like to run the free audit?",
  },
];

function firstMatch<T extends string>(text: string, patterns: Array<[T, RegExp]>) {
  return patterns.find(([, pattern]) => pattern.test(text))?.[0];
}

const topicPatterns: Array<[ZoraTopic, RegExp]> = [
  [
    "offer_clarity",
    /\b(the offer|offer|value prop|value proposition|positioning|message clarity|messaging|copy|promise|hook)\b/i,
  ],
  [
    "tracking_visibility",
    /\b(tracking|analytics|ga4|pixel|attribution|utm|reporting|dashboard|measure|measurement|source quality)\b/i,
  ],
  [
    "follow_up_handoff",
    /\b(follow[ -]?up|followup|handoff|response speed|speed to lead|nurture|missed lead|reply|respond)\b/i,
  ],
  ["landing_page", /\b(landing page|homepage|page path|site path|website path|page structure|landing path)\b/i],
  ["booking_flow", /\b(booking|booked appointment|appointment|calendar|schedule|calendly|consultation|call flow)\b/i],
  [
    "product_discovery",
    /\b(product discovery|search|collections?|category|catalog|navigation|filters?|merchandising|product pages?)\b/i,
  ],
  ["checkout_confidence", /\b(checkout|cart|payment|shipping|tax|trust cues?|returns?|delivery)\b/i],
  ["crm_routing", /\b(crm|hubspot|salesforce|zoho|pipedrive|routing|assignment|lead owner|pipeline)\b/i],
  ["lead_capture", /\b(lead capture|capture action|form|forms?|intake|quote request|contact form|call button)\b/i],
];

function topicFromChallenge(challenge: ZoraChallenge | undefined): ZoraTopic | undefined {
  switch (challenge) {
    case "Tracking":
      return "tracking_visibility";
    case "Follow-up":
      return "follow_up_handoff";
    case "Website":
      return "landing_page";
    case "Conversion":
      return "lead_capture";
    default:
      return undefined;
  }
}

function extractCurrentTopic(message: string, challenge?: ZoraChallenge) {
  return firstMatch(message, topicPatterns) || topicFromChallenge(challenge);
}

function isCapabilityQuestion(message: string) {
  if (
    /\b(how can you help|what can you do|what do you do|what does opzix do|tell me more about opzix|more about opzix|about opzix|who is opzix|what is opzix|your services|services do you offer|do you build|can you build|what do you build|build websites?)\b/i.test(
      message,
    )
  ) {
    return true;
  }

  return (
    /\b(websites?|ecommerce|ai\b|crm|automation|services)\b/i.test(message) &&
    /\b(do you|can you|could you|will you|would you|does opzix|can opzix|what|build|offer|provide|services)\b/i.test(
      message,
    )
  );
}

function isSmallTalkQuestion(message: string) {
  return /\b(how are you|how's it going|how is it going|what's up|whats up|hello|hi zora|hey zora|hi\b|hey\b|good morning|good afternoon|good evening)\b/i.test(
    message,
  );
}

function isThanksMessage(message: string) {
  if (isCasualAcknowledgmentMessage(message)) {
    return true;
  }

  return /\b(thank you|thanks|thx|appreciate it|appreciate you|got it|okay thanks|ok thanks)\b/i.test(
    message,
  );
}

function isCasualAcknowledgmentMessage(message: string) {
  return /^(ok|okay|nice|okay nice|ok nice|yes|yeah|yep|sure|sounds good|continue|keep going|go on|got it)[.!?]*$/i.test(
    message.trim(),
  );
}

function isMomentumAcknowledgmentMessage(message: string) {
  return /^(ok|okay|yes|yeah|yep|sure|sounds good|continue|keep going|go on)[.!?]*$/i.test(
    message.trim(),
  );
}

function isTopicContinuationMessage(message: string) {
  return /^(ok|okay|yes|yeah|yep|sure|sounds good|continue|keep going|go on|tell me more|more|why|interesting)[.!?]*$/i.test(
    message.trim(),
  );
}

function isAffirmativeAnswer(message: string) {
  return /^\s*(yes|yeah|yep|mostly|most are|they are|mobile yes)\s*[.!?]*\s*$/i.test(
    message,
  );
}

function isTimelineQuestion(message: string) {
  return /\b(how long|timeline|how many weeks|how many months|time to build|take to build|launch)\b/i.test(
    message,
  );
}

function isPricingQuestion(message: string) {
  return /\b(how much|price|pricing|cost|investment|budget|range|estimate)\b/i.test(
    message,
  );
}

function isRecommendationQuestion(message: string) {
  return /\b(what would you do|what would opzix do|where should i start|what comes first|what comes next|how would you fix|walk me through|talk through|what should i fix|what should i do first|what would you fix first|recommendation|recommend a plan|roadmap|fix path)\b/i.test(
    message,
  );
}

function isConsultantQuestion(message: string) {
  const hasWebsiteBuildIntent = isWebsiteBuildOrRebuildQuestion(message);
  const hasGeneralConsultantIntent =
    /\b(explain|why|tell me about|process|strategy|cost analysis|roi|implementation|audit process|how it works|how does it work|ecommerce store cost|should i run ads|run ads|should i rebuild|rebuild|fix my site|fix the site|improve my site|replace my site)\b/i.test(
      message,
    );
  const hasComparisonIntent =
    (/\b(compare|comparison|versus|vs\.?|better|switch|migrate|rebuild|should i use|which platform|platform)\b/i.test(
      message,
    ) &&
      /\b(shopify|bigcommerce|rebuild)\b/i.test(message)) ||
    /\bshopify\b.+\bbigcommerce\b|\bbigcommerce\b.+\bshopify\b/i.test(message);

  return hasWebsiteBuildIntent || hasGeneralConsultantIntent || hasComparisonIntent;
}

function isWebsiteBuildOrRebuildQuestion(message: string) {
  return /\b(considering|thinking about|want to|need to|should i|can you|could you|looking at|planning to)?\s*(build(?:ing)?|rebuild(?:ing)?|replace|redesign|create|launch)\s+(?:a\s+)?(?:new\s+)?(?:website|site|landing page)\b|\bnew\s+(?:website|site)\b/i.test(
    message,
  );
}

function isRoadmapFollowUp(message: string) {
  return /\b(why|what comes second|what comes third|second step|third step|how much|how long|timeline|cost|investment|range)\b/i.test(
    message,
  );
}

function isRoadmapSpecificFollowUp(message: string) {
  return /\b(that|this|first step|second step|third step|roadmap|recommendation|plan|step)\b/i.test(
    message,
  );
}

function isResumeRecommendationThreadRequest(message: string) {
  return /\b(back to|return to|resume|go back to|switch back to)\b.+\b(seller leads?|lead follow-?up|roadmap|recommendation|plan|that)\b/i.test(
    message,
  );
}

function isEcommerceBuildQuestion(message: string) {
  return /\b(ecommerce website|e-commerce website|online store|shopify store|storefront|commerce site)\b/i.test(
    message,
  );
}

function isAuditRequest(message: string) {
  return /\b(audit my website|audit my site|audit my store|run an audit|free audit|scan my website|scan my site|scan my store|website audit|check (?:the )?site path|review (?:the )?site path|look at (?:the )?site path|check (?:my )?site|review (?:my )?site|check my website|review my website)\b/i.test(
    message,
  );
}

function isBookingRequest(message: string) {
  return /\b(book|strategy call|schedule|calendly|talk to someone|speak with)\b/i.test(
    message,
  );
}

function isNextStepRequest(message: string) {
  return /\b(sounds good|what next|next step|next steps|help me|let's do it|lets do it|i'm ready|im ready|start there|do it|high-level recommendation|high level recommendation|recommendation here|likely fix path)\b/i.test(
    message,
  );
}

function isFocusRequest(message: string) {
  return /\b(what should i focus on|focus on first|what should i do first|where should i start|what would you fix first)\b/i.test(
    message,
  );
}

function isOutOfScopeQuestion(message: string) {
  return /\b(fix|repair|troubleshoot)\s+(my\s+)?(printer|laptop|phone|car|appliance|router)\b/i.test(
    message,
  );
}

function isWebsiteCaptureMessage(message: string) {
  return /\b(my website is|my site is|website is|site is|here is my website|here's my website)\b/i.test(
    message,
  );
}

function hasNoWebsiteAnswer(message: string) {
  return /\b(no website|have no website|i have no website|don't have (?:a )?(?:website|site)|dont have (?:a )?(?:website|site)|do not have (?:a )?(?:website|site)|not yet|no site)\b/i.test(
    message,
  );
}

function hasWebsiteOrLandingPageAnswer(message: string) {
  return /\b(yes i do|i have (?:a )?(?:website|site|landing page)|we have (?:a )?(?:website|site|landing page)|have (?:a )?(?:website|site|landing page)|already have (?:a )?(?:website|site|landing page))\b/i.test(
    message,
  );
}

function extractWebsiteUrl(text: string) {
  const match = text.match(
    /\bhttps?:\/\/[a-z0-9.-]+\.[a-z]{2,}(?:\/[^\s<>()"]*)?|\b(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s<>()"]*)?/i,
  );
  const url = match?.[0];

  if (!url) return undefined;

  if (match.index && text[match.index - 1] === "@") {
    return undefined;
  }

  return url.startsWith("http") ? url : `https://${url}`;
}

function normalizeDomainContext(url: string) {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return `${parsed.hostname} ${parsed.pathname}`
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/[^a-z0-9]+/g, " ");
  } catch {
    return url.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  }
}

export function inferIndustryFromUrl(url: string): ZoraIndustryInference {
  const context = normalizeDomainContext(url);
  const has = (pattern: RegExp) => pattern.test(context);

  if (has(/\b(serhant|realty|realtor|homes|properties|brokerage|estate|listings)\b/)) {
    return {
      inferredIndustry: "Real Estate",
      inferredBusinessModel: "Brokerage / Agent Brand",
      inferredFunnelType: "Lead Generation / Appointment Booking",
      industryConfidence: context.includes("serhant") ? 0.9 : 0.78,
    };
  }

  if (has(/\b(maxx|supply|industrial|wholesale|parts|equipment|tools|distributor)\b/)) {
    return {
      inferredIndustry: "Industrial Supply",
      inferredBusinessModel: "B2B Ecommerce / Distributor",
      inferredFunnelType: "Quote + Purchase / Account-Based Ordering",
      industryConfidence: context.includes("maxx") || context.includes("supply") ? 0.85 : 0.76,
    };
  }

  if (has(/\b(allbirds|shop|store|apparel|clothing|shoes|beauty|skincare|products|cart|checkout)\b/)) {
    return {
      inferredIndustry: "Retail / Apparel",
      inferredBusinessModel: "DTC Ecommerce",
      inferredFunnelType: "Online Purchase",
      industryConfidence: context.includes("allbirds") ? 0.95 : 0.74,
    };
  }

  if (has(/\b(care|healthcare|homecare|therapy|disability|waiver|respite|residential|clinic|vintage solutions)\b/)) {
    return {
      inferredIndustry: "Healthcare / Care",
      inferredBusinessModel: "Care Provider / Service Organization",
      inferredFunnelType: "Intake / Referral / Appointment Request",
      industryConfidence: 0.78,
    };
  }

  if (has(/\b(plumbing|roofing|hvac|cleaning|landscaping|contractor|repair)\b/)) {
    return {
      inferredIndustry: "Local Service Business",
      inferredBusinessModel: "Local Service Business",
      inferredFunnelType: "Lead Form / Call / Appointment Booking",
      industryConfidence: 0.74,
    };
  }

  return {
    industryConfidence: 0,
  };
}

function businessTypeFromInference(inference: ZoraIndustryInference): ZoraBusinessType | undefined {
  if (inference.inferredIndustry === "Real Estate") return "Real Estate";
  if (inference.inferredIndustry === "Healthcare / Care") return "Care/Healthcare";
  if (inference.inferredBusinessModel?.includes("Ecommerce")) return "Ecommerce";
  if (inference.inferredIndustry === "Local Service Business") return "Service Business";
  return undefined;
}

export function hasUrlBusinessTypeMismatch(
  businessType: ZoraBusinessType | undefined,
  inference: ZoraIndustryInference | undefined,
) {
  const inferredBusinessType = inference ? businessTypeFromInference(inference) : undefined;

  return Boolean(
    businessType &&
      inferredBusinessType &&
      inference?.industryConfidence &&
      inference.industryConfidence >= 0.7 &&
      businessType !== inferredBusinessType,
  );
}

export function shouldUseIndustryInference(profile: ZoraLeadProfile) {
  const inferredBusinessType = businessTypeFromInference(profile);

  return Boolean(
    profile.industryConfidence &&
      profile.industryConfidence >= 0.7 &&
      (!profile.businessType || !inferredBusinessType || profile.businessType === inferredBusinessType),
  );
}

function extractEmail(text: string) {
  return text.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i)?.[0];
}

function extractVisitorName(text: string) {
  const name = text.match(/\bmy name is\s+([a-z][a-z'-]{1,30})\b/i)?.[1];

  if (!name) return undefined;

  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

function extractConversionRate(text: string) {
  return text.match(/\b\d+(?:\.\d+)?%/)?.[0];
}

function extractFunnelStage(text: string): ZoraFunnelStage | undefined {
  if (/\bbefore\s+(product|product pages?)|category pages?|collection pages?\b/i.test(text)) {
    return "Before product pages";
  }

  if (/\bproduct pages?|pdp|product detail/i.test(text)) {
    return "Product pages";
  }

  if (/\bcart\b/i.test(text)) {
    return "Cart";
  }

  if (/\bcheckout|payment|shipping step|shipping page\b/i.test(text)) {
    return "Checkout";
  }

  return undefined;
}

function extractDropoffDetail(text: string): ZoraDropoffDetail | undefined {
  if (/\b(one product|single product|one item|1 product|1 item|adding one product|add(?:ing)? one item|after adding one|after add(?:ing)? one)\b/i.test(text)) {
    return "One product cart";
  }

  if (/\blarger cart|big cart|multiple products|multiple items|several products|many products\b/i.test(text)) {
    return "Larger cart";
  }

  if (/\bshipping|delivery\b/i.test(text)) {
    return "Shipping step";
  }

  if (/\bpayment|card|paypal|apple pay|google pay\b/i.test(text)) {
    return "Payment step";
  }

  if (/\berror|bug|decline|failed|broken\b/i.test(text)) {
    return "Checkout error";
  }

  return undefined;
}

function extractCartBuildSource(text: string): ZoraCartBuildSource | undefined {
  if (/\bnot sure|not too sure|unsure|don't know|dont know|unknown\b/i.test(text)) {
    return "Unknown";
  }

  if (/\bsearch|site search\b/i.test(text)) return "Search";
  if (/\bcollections?|category|categories\b/i.test(text)) return "Collections";
  if (/\breco?mm?endations?|recomendations?|related products?|upsell|cross-sell|cross sell\b/i.test(text)) {
    return "Product recommendations";
  }

  return undefined;
}

function extractShippingPricing(text: string): ZoraShippingPricing | undefined {
  if (/\b(shipping|delivery).*(not sure|not too sure|unsure|don't know|dont know|unknown)|(not sure|not too sure|unsure|don't know|dont know|unknown).*(shipping|delivery)\b/i.test(text)) {
    return "Unknown";
  }

  if (/\bfree shipping|shipping is free\b/i.test(text)) return "Free shipping";
  if (/\bflat rate|flat-rate|fixed shipping\b/i.test(text)) return "Flat-rate shipping";
  if (/\bcalculated at checkout|calculated shipping|live rates?|carrier rates?|at checkout\b/i.test(text)) {
    return "Calculated at checkout";
  }

  return undefined;
}

function extractRecommendationSetup(text: string): ZoraRecommendationSetup | undefined {
  if (/\b(manual|manually|curated|hand[-\s]?picked|hand selected|merchandised)\b/i.test(text)) {
    return "Manually curated";
  }

  if (/\b(app[-\s]?generated|generated by an app|automated|algorithm|algorithmic|ai|personalized|recommendation app|upsell app)\b/i.test(text)) {
    return "App-generated";
  }

  if (/\b(both|mix|mixed|some manual|some automated|hybrid)\b/i.test(text)) {
    return "Mixed";
  }

  if (/\bnot sure|not too sure|unsure|don't know|dont know|unknown\b/i.test(text)) {
    return "Unknown";
  }

  return undefined;
}

function extractLeadDestination(text: string): ZoraLeadDestination | undefined {
  if (/\b(crm|hubspot|salesforce|zoho|pipedrive|jobber|housecall pro|servicetitan|service titan)\b/i.test(text)) {
    return "CRM";
  }

  if (/\b(email|email inbox|inbox|shared inbox|gmail|outlook)\b/i.test(text)) {
    return "Email inbox";
  }

  if (/\b(spreadsheet|google sheets?|sheet|excel)\b/i.test(text)) {
    return "Spreadsheet";
  }

  if (/\b(nowhere|not structured|nothing structured|manual|text messages?|texts?|phone calls?|voicemail)\b/i.test(text)) {
    return "Unstructured";
  }

  if (/\bnot sure|not too sure|unsure|don't know|dont know|unknown\b/i.test(text)) {
    return "Unknown";
  }

  return undefined;
}

function extractNotificationChannel(text: string): ZoraNotificationChannel | undefined {
  if (/\b(both|sms and email|email and sms|app and email|email and app)\b/i.test(text)) {
    return "Both";
  }

  if (/\b(sms|text|texts|text message|app|push|mobile notification|phone notification)\b/i.test(text)) {
    return "SMS/app";
  }

  if (/\b(email|inbox|gmail|outlook)\b/i.test(text)) {
    return "Email";
  }

  if (/\b(no notification|none|nothing|does not notify|doesn't notify|not notified)\b/i.test(text)) {
    return "None";
  }

  if (/\bnot sure|not too sure|unsure|don't know|dont know|unknown\b/i.test(text)) {
    return "Unknown";
  }

  return undefined;
}

function extractProductScope(text: string): ZoraProductScope | undefined {
  if (/\ball products|every product|sitewide|across products|across all products\b/i.test(text)) {
    return "All products";
  }

  if (/\bfew|some|specific|high-traffic|top products|best sellers|bestsellers\b/i.test(text)) {
    return "Few high-traffic products";
  }

  return undefined;
}

function extractIndustry(text: string, businessType?: ZoraBusinessType) {
  if (/\bdisability services?\b/i.test(text)) return "Disability services";
  if (/\bhome service\b/i.test(text)) return "Home services";
  if (/\brealtor|real estate\b/i.test(text)) return "Real estate";
  if (/\bshopify|ecommerce|e-commerce|online store\b/i.test(text)) return "Ecommerce";
  return businessType;
}

function extractDesiredOutcome(text: string) {
  const outcomePatterns = [
    /\bmore seller leads?\b/i,
    /\bmore buyer leads?\b/i,
    /\bmore client intake requests?\b/i,
    /\bmore leads?\b/i,
    /\bmore sales\b/i,
    /\bbetter conversions?\b/i,
  ];
  const match = outcomePatterns.map((pattern) => text.match(pattern)?.[0]).find(Boolean);

  return match ? match.charAt(0).toUpperCase() + match.slice(1).toLowerCase() : undefined;
}

function extractLeadSource(text: string) {
  if (/\b(?:ad|ads|paid traffic|google ads|facebook ads|meta ads)\b/i.test(text)) return "Ads";
  if (/\breferrals?\b/i.test(text)) return "Referrals";
  if (/\borganic|seo|search\b/i.test(text)) return "Organic search";
  if (/\bsocial|instagram|facebook|tiktok|linkedin\b/i.test(text)) return "Social";
  if (/\bhome\s?page|homepage|hompage\b/i.test(text)) return "Homepage";
  return undefined;
}

function extractToolsMentioned(text: string) {
  return toolPatterns
    .filter(([, pattern]) => pattern.test(text))
    .map(([tool]) => tool);
}

function parseRevenue(text: string): Pick<ZoraLeadProfile, "annualRevenueText" | "revenueRange"> {
  if (/\bunder\s*\$?100k|\b<\s*\$?100k|\bless than\s*\$?100k/i.test(text)) {
    return { revenueRange: "Under $100k", annualRevenueText: "Under $100k" };
  }

  if (/\$?1m\+|\$?1\s?million\+|over\s*\$?1m|over\s*\$?1\s?million/i.test(text)) {
    return { revenueRange: "$1M+", annualRevenueText: "$1M+" };
  }

  const revenueMatch = text.match(
    /\$\s*(\d+(?:\.\d+)?)\s*(k|m|million)?(?:\s*\/?\s*(?:year|yr|annual|annually))?|\b(\d+(?:\.\d+)?)\s*(k|m|million)\b(?:\s*\/?\s*(?:year|yr|annual|annually))?/i,
  );

  if (!revenueMatch) {
    return {};
  }

  const amount = revenueMatch[1] || revenueMatch[3];
  const numericValue = Number(amount);
  const unit = (revenueMatch[2] || revenueMatch[4])?.toLowerCase();
  const annualValue =
    unit === "m" || unit === "million"
      ? numericValue * 1_000_000
      : unit === "k"
        ? numericValue * 1_000
        : numericValue;

  if (!Number.isFinite(annualValue) || annualValue <= 0) {
    return {};
  }

  const displayUnit =
    unit === "m" || unit === "million" ? "M" : unit === "k" ? "k" : "";
  const annualRevenueText = `$${amount}${displayUnit}/year`;

  if (annualValue < 100_000) {
    return { revenueRange: "Under $100k", annualRevenueText };
  }

  if (annualValue >= 1_000_000) {
    return { revenueRange: "$1M+", annualRevenueText };
  }

  return { revenueRange: "$100k-$1M", annualRevenueText };
}

function calculateConfidence(analysis: Omit<ZoraMessageAnalysis, "confidenceScore">) {
  if (analysis.outOfScope) return 0.92;

  let score = 0.12;

  if (analysis.businessType) score += 0.2;
  if (analysis.challenge) score += 0.2;
  if (analysis.platform) score += 0.16;
  if (analysis.revenueRange) score += 0.14;
  if (analysis.websiteUrl) score += 0.12;
  if (analysis.hasWebsiteOrLandingPage) score += 0.08;
  if (analysis.hasNoWebsite) score += 0.08;
  if (analysis.funnelStage) score += 0.12;
  if (analysis.dropoffDetail) score += 0.12;
  if (analysis.productScope) score += 0.12;
  if (analysis.cartBuildSource) score += 0.12;
  if (analysis.shippingPricing) score += 0.12;
  if (analysis.recommendationSetup) score += 0.12;
  if (analysis.leadDestination) score += 0.12;
  if (analysis.notificationChannel) score += 0.12;
  if (analysis.email) score += 0.08;
  if (analysis.businessType && analysis.challenge) score += 0.08;

  return Math.min(0.96, Number(score.toFixed(2)));
}

export function analyzeZoraMessage(message: string): ZoraMessageAnalysis {
  const outOfScope = isOutOfScopeQuestion(message);
  const businessType = outOfScope ? undefined : firstMatch(message, businessTypePatterns);
  const platform = outOfScope ? undefined : firstMatch(message, platformPatterns);
  const toolsMentioned = outOfScope ? undefined : extractToolsMentioned(message);
  const industry = outOfScope ? undefined : extractIndustry(message, businessType);
  const websiteUrl = outOfScope ? undefined : extractWebsiteUrl(message);
  const hasNoWebsite = outOfScope ? undefined : hasNoWebsiteAnswer(message) || undefined;
  const hasWebsiteOrLandingPage =
    outOfScope || hasNoWebsite || websiteUrl
      ? undefined
      : hasWebsiteOrLandingPageAnswer(message) || undefined;
  const leadSource = outOfScope ? undefined : extractLeadSource(message);
  const challenge =
    outOfScope || (websiteUrl && isWebsiteCaptureMessage(message))
      ? undefined
      : hasNoWebsite
        ? leadSource
          ? "Traffic"
          : undefined
        : firstMatch(message, challengePatterns) ||
          (leadSource ? "Traffic" : undefined);
  const currentTopic = outOfScope ? undefined : extractCurrentTopic(message, challenge);
  const revenue = outOfScope ? {} : parseRevenue(message);
  const email = outOfScope ? undefined : extractEmail(message);
  const visitorName = extractVisitorName(message);
  const conversionRate = outOfScope ? undefined : extractConversionRate(message);
  const funnelStage = outOfScope ? undefined : extractFunnelStage(message);
  const dropoffDetail = outOfScope ? undefined : extractDropoffDetail(message);
  const productScope = outOfScope ? undefined : extractProductScope(message);
  const cartBuildSource = outOfScope ? undefined : extractCartBuildSource(message);
  const shippingPricing = outOfScope ? undefined : extractShippingPricing(message);
  const recommendationSetup = outOfScope ? undefined : extractRecommendationSetup(message);
  const leadDestination = outOfScope ? undefined : extractLeadDestination(message);
  const notificationChannel = outOfScope ? undefined : extractNotificationChannel(message);
  const desiredOutcome = outOfScope ? undefined : extractDesiredOutcome(message);
  const intent: ZoraIntent = outOfScope
    ? "out_of_scope"
    : isThanksMessage(message)
      ? "thanks"
      : isSmallTalkQuestion(message)
        ? "small_talk"
        : isRecommendationQuestion(message)
          ? "recommendation"
          : isAuditRequest(message)
            ? "audit_request"
            : isBookingRequest(message)
              ? "booking_request"
              : isConsultantQuestion(message)
                ? "consultant"
                : isCapabilityQuestion(message)
                  ? "capability"
                  : isFocusRequest(message)
                    ? "focus_request"
                    : isNextStepRequest(message)
                      ? "next_step"
                      : isTimelineQuestion(message)
                        ? "timeline"
                        : isPricingQuestion(message)
                          ? "pricing"
                          : businessType ||
                              challenge ||
                              platform ||
                              revenue.revenueRange ||
                              websiteUrl ||
                              hasNoWebsite ||
                              funnelStage
                            ? "diagnosis"
                            : dropoffDetail ||
                                productScope ||
                                cartBuildSource ||
                                shippingPricing ||
                                recommendationSetup ||
                                leadDestination ||
                                notificationChannel
                              ? "diagnosis"
                            : "clarify";
  const analysisWithoutConfidence = {
    intent,
    visitorName,
    businessType,
    platform,
    industry,
    toolsMentioned,
    leadSource,
    conversionRate,
    funnelStage,
    dropoffDetail,
    productScope,
    cartBuildSource,
    shippingPricing,
    recommendationSetup,
    leadDestination,
    notificationChannel,
    desiredOutcome,
    challenge,
    websiteUrl,
    currentTopic,
    hasWebsiteOrLandingPage,
    hasNoWebsite,
    email,
    outOfScope,
    ...revenue,
  };

  return {
    ...analysisWithoutConfidence,
    confidenceScore: calculateConfidence(analysisWithoutConfidence),
  };
}

function addChange(changes: string[], field: string, previous: unknown, next: unknown) {
  if (previous !== next) {
    changes.push(`${field}: ${previous || "empty"} -> ${next || "empty"}`);
  }
}

function hasBusinessTypeConflict(
  currentProfile: ZoraLeadProfile,
  analysis: ZoraMessageAnalysis,
) {
  return Boolean(
    analysis.businessType &&
      currentProfile.businessType &&
      analysis.businessType !== currentProfile.businessType,
  );
}

function mergeLeadProfile(
  currentProfile: ZoraLeadProfile,
  analysis: ZoraMessageAnalysis,
) {
  const changes: string[] = [];
  const businessTypeConflict = hasBusinessTypeConflict(currentProfile, analysis);
  const nextProfile: ZoraLeadProfile = businessTypeConflict
    ? {
        visitorName: currentProfile.visitorName,
        email: currentProfile.email,
      }
    : { ...currentProfile };

  if (businessTypeConflict) {
    changes.push(
      `business context reset: ${currentProfile.businessType} -> ${analysis.businessType}`,
    );
  }

  if (analysis.visitorName) {
    addChange(changes, "visitorName", nextProfile.visitorName, analysis.visitorName);
    nextProfile.visitorName = analysis.visitorName;
  }

  if (analysis.businessType) {
    addChange(changes, "businessType", nextProfile.businessType, analysis.businessType);
    nextProfile.businessType = analysis.businessType;
    if (nextProfile.needsBusinessTypeClarification) {
      addChange(changes, "needsBusinessTypeClarification", true, false);
      nextProfile.needsBusinessTypeClarification = false;
      nextProfile.industryMismatchResolved = true;
    }
  }

  if (analysis.platform) {
    addChange(changes, "platform", nextProfile.platform, analysis.platform);
    nextProfile.platform = analysis.platform;
  } else if (businessTypeConflict && nextProfile.platform) {
    addChange(changes, "platform", nextProfile.platform, undefined);
    delete nextProfile.platform;
  }

  if (analysis.industry) {
    addChange(changes, "industry", nextProfile.industry, analysis.industry);
    nextProfile.industry = analysis.industry;
  }

  if (analysis.toolsMentioned?.length) {
    const previousTools = nextProfile.toolsMentioned || [];
    const mergedTools = Array.from(new Set([...previousTools, ...analysis.toolsMentioned]));
    if (mergedTools.join(",") !== previousTools.join(",")) {
      changes.push(
        `toolsMentioned: ${previousTools.join(", ") || "empty"} -> ${mergedTools.join(", ")}`,
      );
    }
    nextProfile.toolsMentioned = mergedTools;
  }

  if (analysis.leadSource) {
    addChange(changes, "leadSource", nextProfile.leadSource, analysis.leadSource);
    nextProfile.leadSource = analysis.leadSource;
  }

  if (analysis.conversionRate) {
    addChange(changes, "conversionRate", nextProfile.conversionRate, analysis.conversionRate);
    nextProfile.conversionRate = analysis.conversionRate;
  }

  if (analysis.funnelStage) {
    addChange(changes, "funnelStage", nextProfile.funnelStage, analysis.funnelStage);
    nextProfile.funnelStage = analysis.funnelStage;
  }

  if (analysis.dropoffDetail) {
    addChange(changes, "dropoffDetail", nextProfile.dropoffDetail, analysis.dropoffDetail);
    nextProfile.dropoffDetail = analysis.dropoffDetail;
  }

  if (analysis.productScope) {
    addChange(changes, "productScope", nextProfile.productScope, analysis.productScope);
    nextProfile.productScope = analysis.productScope;
  }

  if (analysis.cartBuildSource) {
    addChange(changes, "cartBuildSource", nextProfile.cartBuildSource, analysis.cartBuildSource);
    nextProfile.cartBuildSource = analysis.cartBuildSource;
  }

  if (analysis.shippingPricing) {
    addChange(changes, "shippingPricing", nextProfile.shippingPricing, analysis.shippingPricing);
    nextProfile.shippingPricing = analysis.shippingPricing;
  }

  if (analysis.recommendationSetup) {
    addChange(
      changes,
      "recommendationSetup",
      nextProfile.recommendationSetup,
      analysis.recommendationSetup,
    );
    nextProfile.recommendationSetup = analysis.recommendationSetup;
  }

  if (analysis.leadDestination) {
    addChange(
      changes,
      "leadDestination",
      nextProfile.leadDestination,
      analysis.leadDestination,
    );
    nextProfile.leadDestination = analysis.leadDestination;
  }

  if (analysis.notificationChannel) {
    addChange(
      changes,
      "notificationChannel",
      nextProfile.notificationChannel,
      analysis.notificationChannel,
    );
    nextProfile.notificationChannel = analysis.notificationChannel;
  }

  if (analysis.desiredOutcome) {
    addChange(changes, "desiredOutcome", nextProfile.desiredOutcome, analysis.desiredOutcome);
    nextProfile.desiredOutcome = analysis.desiredOutcome;
  }

  if (analysis.revenueRange || analysis.annualRevenueText) {
    addChange(changes, "revenueRange", nextProfile.revenueRange, analysis.revenueRange);
    addChange(
      changes,
      "annualRevenueText",
      nextProfile.annualRevenueText,
      analysis.annualRevenueText,
    );
    nextProfile.revenueRange = analysis.revenueRange;
    nextProfile.annualRevenueText = analysis.annualRevenueText;
  }

  if (analysis.challenge) {
    const shouldKeepExistingChallenge =
      analysis.challenge === "Website" &&
      nextProfile.challenge &&
      nextProfile.challenge !== "Website";

    if (!shouldKeepExistingChallenge) {
      addChange(changes, "challenge", nextProfile.challenge, analysis.challenge);
      nextProfile.challenge = analysis.challenge;
    }
  }

  if (analysis.currentTopic) {
    addChange(changes, "currentTopic", nextProfile.currentTopic, analysis.currentTopic);
    if (nextProfile.currentTopic !== analysis.currentTopic) {
      addChange(changes, "currentTopicDepth", nextProfile.currentTopicDepth, 1);
      nextProfile.currentTopicDepth = 1;
    }
    nextProfile.currentTopic = analysis.currentTopic;
  }

  if (analysis.websiteUrl) {
    addChange(changes, "websiteUrl", nextProfile.websiteUrl, analysis.websiteUrl);
    nextProfile.websiteUrl = analysis.websiteUrl;
    const inference = inferIndustryFromUrl(analysis.websiteUrl);
    if ((inference.industryConfidence ?? 0) > 0) {
      addChange(changes, "inferredIndustry", nextProfile.inferredIndustry, inference.inferredIndustry);
      addChange(
        changes,
        "inferredBusinessModel",
        nextProfile.inferredBusinessModel,
        inference.inferredBusinessModel,
      );
      addChange(
        changes,
        "inferredFunnelType",
        nextProfile.inferredFunnelType,
        inference.inferredFunnelType,
      );
      nextProfile.inferredIndustry = inference.inferredIndustry;
      nextProfile.inferredBusinessModel = inference.inferredBusinessModel;
      nextProfile.inferredFunnelType = inference.inferredFunnelType;
      nextProfile.industryConfidence = inference.industryConfidence;
    }
    const mismatch =
      !nextProfile.industryMismatchResolved &&
      hasUrlBusinessTypeMismatch(nextProfile.businessType, inference);
    if (mismatch) {
      addChange(changes, "needsBusinessTypeClarification", false, true);
      nextProfile.needsBusinessTypeClarification = true;
    }
    if (!nextProfile.hasWebsiteOrLandingPage) {
      addChange(changes, "hasWebsiteOrLandingPage", nextProfile.hasWebsiteOrLandingPage, true);
      nextProfile.hasWebsiteOrLandingPage = true;
    }
    if (nextProfile.hasNoWebsite) {
      addChange(changes, "hasNoWebsite", nextProfile.hasNoWebsite, undefined);
      delete nextProfile.hasNoWebsite;
    }
  }

  if (analysis.hasWebsiteOrLandingPage) {
    addChange(
      changes,
      "hasWebsiteOrLandingPage",
      nextProfile.hasWebsiteOrLandingPage,
      true,
    );
    nextProfile.hasWebsiteOrLandingPage = true;
    if (nextProfile.hasNoWebsite) {
      addChange(changes, "hasNoWebsite", nextProfile.hasNoWebsite, undefined);
      delete nextProfile.hasNoWebsite;
    }
  }

  if (analysis.hasNoWebsite) {
    addChange(
      changes,
      "hasWebsiteOrLandingPage",
      nextProfile.hasWebsiteOrLandingPage,
      false,
    );
    nextProfile.hasWebsiteOrLandingPage = false;
    addChange(changes, "hasNoWebsite", nextProfile.hasNoWebsite, true);
    nextProfile.hasNoWebsite = true;
    if (nextProfile.websiteUrl) {
      addChange(changes, "websiteUrl", nextProfile.websiteUrl, undefined);
      delete nextProfile.websiteUrl;
    }
  }

  if (analysis.email) {
    addChange(changes, "email", nextProfile.email, analysis.email);
    nextProfile.email = analysis.email;
  }

  nextProfile.recommendedNextStep = recommendZoraNextStep(nextProfile);
  nextProfile.recommendedFocusAreas = focusAreas(nextProfile);
  nextProfile.leadQuality = scoreZoraLeadQuality(nextProfile);
  nextProfile.leadScore = scoreZoraLead(nextProfile);
  nextProfile.leadTemperature = scoreZoraLeadTemperature(nextProfile);

  return {
    leadProfile: nextProfile,
    profileChanges: changes,
  };
}

function withRecalculatedConfidence(
  analysis: Omit<ZoraMessageAnalysis, "confidenceScore">,
): ZoraMessageAnalysis {
  return {
    ...analysis,
    confidenceScore: calculateConfidence(analysis),
  };
}

function applyProfileContextToAnalysis(
  analysis: ZoraMessageAnalysis,
  currentProfile: ZoraLeadProfile,
): ZoraMessageAnalysis {
  const ecommerceFunnelAnswer =
    currentProfile.businessType === "Ecommerce" &&
    currentProfile.challenge === "Conversion" &&
    (!analysis.businessType || analysis.businessType === "Ecommerce") &&
    Boolean(
      analysis.funnelStage ||
        analysis.dropoffDetail ||
        analysis.productScope ||
        analysis.cartBuildSource ||
        analysis.shippingPricing ||
        analysis.recommendationSetup,
    );

  if (ecommerceFunnelAnswer) {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      challenge: undefined,
      leadSource: undefined,
    });
  }

  const crmNotificationAnswer =
    currentProfile.businessType === "Service Business" &&
    currentProfile.challenge === "Follow-up" &&
    currentProfile.leadDestination === "CRM" &&
    Boolean(analysis.notificationChannel) &&
    !analysis.businessType &&
    !analysis.funnelStage &&
    !analysis.dropoffDetail &&
    !analysis.productScope &&
    !analysis.cartBuildSource &&
    !analysis.shippingPricing &&
    !analysis.recommendationSetup;

  if (crmNotificationAnswer) {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      leadDestination: undefined,
    });
  }

  const genericUncertainty =
    analysis.cartBuildSource === "Unknown" &&
    currentProfile.cartBuildSource === "Product recommendations" &&
    (!analysis.recommendationSetup || analysis.recommendationSetup === "Unknown") &&
    !analysis.funnelStage &&
    !analysis.dropoffDetail &&
    !analysis.productScope &&
    !analysis.shippingPricing;

  if (!genericUncertainty) {
    return analysis;
  }

  const { confidenceScore, ...analysisWithoutConfidence } = analysis;
  void confidenceScore;

  return withRecalculatedConfidence({
    ...analysisWithoutConfidence,
    cartBuildSource: undefined,
    leadDestination: undefined,
    notificationChannel: undefined,
    recommendationSetup: analysis.recommendationSetup || "Unknown",
  });
}

export function inferZoraLeadProfile(
  message: string,
  currentProfile: ZoraLeadProfile = {},
): ZoraLeadProfile {
  const analysis = applyProfileContextToAnalysis(analyzeZoraMessage(message), currentProfile);
  return mergeLeadProfile(currentProfile, analysis).leadProfile;
}

export function recommendZoraNextStep(profile: ZoraLeadProfile): ZoraNextStep {
  if (profile.hasNoWebsite) {
    return "strategy_call";
  }

  if (profile.revenueRange === "$1M+" || profile.leadQuality === "high") {
    return "strategy_call";
  }

  if (profile.websiteUrl || profile.businessType === "Ecommerce" || profile.challenge === "Conversion") {
    return "free_audit";
  }

  return "ask_question";
}

export function scoreZoraLeadQuality(profile: ZoraLeadProfile): ZoraLeadQuality {
  let score = 0;

  if (profile.businessType) score += 1;
  if (profile.challenge) score += 1;
  if (profile.websiteUrl) score += 1;
  if (profile.email) score += 1;
  if (profile.desiredOutcome) score += 1;
  if (profile.conversionRate) score += 1;
  if (profile.funnelStage) score += 1;
  if (profile.dropoffDetail) score += 1;
  if (profile.productScope) score += 1;
  if (profile.cartBuildSource) score += 1;
  if (profile.shippingPricing) score += 1;
  if (profile.recommendationSetup) score += 1;
  if (profile.leadDestination) score += 1;
  if (profile.notificationChannel) score += 1;
  if (profile.toolsMentioned?.length) score += 1;
  if (profile.revenueRange === "$100k-$1M") score += 2;
  if (profile.revenueRange === "$1M+") score += 3;
  if (profile.platform) score += 1;

  if (score >= 5) return "high";
  if (score >= 3) return "medium";
  return "low";
}

export function scoreZoraLead(profile: ZoraLeadProfile): number {
  let score = 0;

  if (profile.businessType) score += 10;
  if (profile.challenge) score += 15;
  if (profile.websiteUrl) score += 20;
  if (profile.hasNoWebsite) score += 8;
  if (profile.hasWebsiteOrLandingPage) score += 8;
  if (profile.platform) score += 8;
  if (profile.annualRevenueText || profile.revenueRange) score += 12;
  if (profile.conversionRate) score += 10;
  if (profile.funnelStage || profile.dropoffDetail || profile.productScope) score += 8;
  if (profile.leadDestination || profile.notificationChannel) score += 8;
  if (profile.email) score += 12;
  if (profile.recommendedNextStep === "strategy_call") score += 8;

  return Math.min(100, score);
}

export function scoreZoraLeadTemperature(
  profile: ZoraLeadProfile,
  eventType?: string,
): ZoraLeadTemperature {
  const highIntentEvent =
    eventType === "audit_clicked" ||
    eventType === "strategy_call_clicked" ||
    eventType === "audit_requested" ||
    eventType === "booking_requested" ||
    eventType === "cost_or_fix_requested" ||
    eventType === "recommendation_requested" ||
    eventType === "consultant_question";

  if (
    highIntentEvent ||
    (profile.websiteUrl &&
      (profile.challenge === "Conversion" ||
        profile.challenge === "Tracking" ||
        profile.challenge === "Operations" ||
        profile.challenge === "Follow-up"))
  ) {
    return "hot";
  }

  if (
    (profile.businessType && profile.challenge) ||
    profile.leadQuality === "medium" ||
    profile.leadQuality === "high"
  ) {
    return "warm";
  }

  return "cold";
}

function focusAreas(profile: Pick<ZoraLeadProfile, "businessType" | "challenge">) {
  if (profile.businessType === "Ecommerce" && profile.challenge === "Traffic") {
    return [
      "offer positioning",
      "paid traffic landing page",
      "SEO/product category pages",
      "retargeting",
      "conversion readiness before ad scaling",
    ];
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Operations") {
    return [
      "order flow",
      "fulfillment handoffs",
      "inventory/product data",
      "customer support routing",
      "reporting visibility",
      "automation opportunities",
    ];
  }

  if (profile.businessType === "Ecommerce") {
    return [
      "product discovery",
      "mobile UX",
      "checkout confidence",
      "tracking accuracy",
      "email/SMS follow-up",
    ];
  }

  if (profile.businessType === "Real Estate") {
    return [
      "seller-specific landing page",
      "home valuation offer",
      "local proof",
      "follow-up automation",
      "ad/source tracking",
    ];
  }

  if (profile.businessType === "Care/Healthcare") {
    return [
      "trust proof",
      "service clarity",
      "intake form friction",
      "referral partner path",
      "response process",
    ];
  }

  if (profile.businessType === "Service Business" && profile.challenge === "Follow-up") {
    return [
      "speed-to-lead",
      "CRM routing",
      "missed lead recovery",
      "booking automation",
      "nurture sequence",
    ];
  }

  if (profile.businessType === "Service Business") {
    return ["offer clarity", "form flow", "trust proof", "follow-up path"];
  }

  if (profile.challenge === "Operations") {
    return ["handoffs", "workflow visibility", "dashboard clarity", "integration gaps"];
  }

  if (profile.challenge === "Tracking") {
    return ["analytics coverage", "conversion events", "source attribution", "reporting clarity"];
  }

  if (profile.challenge === "Website") {
    return ["message clarity", "mobile UX", "trust signals", "CTA path", "form friction"];
  }

  return ["traffic quality", "conversion path", "tracking", "follow-up"];
}

function joinList(values: string[]) {
  if (values.length <= 1) return values.join("");
  if (values.length === 2) return values.join(" and ");

  return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
}

function challengeDiagnosis(profile: Pick<ZoraLeadProfile, "businessType" | "challenge">) {
  if (profile.businessType === "Real Estate" && profile.challenge === "Traffic") {
    return "For real estate, seller lead generation usually depends on offer specificity, local proof, fast follow-up, and a landing path that speaks to sellers rather than all prospects.";
  }

  if (profile.businessType === "Care/Healthcare") {
    return "For care and healthcare services, the intake path needs to build trust quickly and make the next step feel clear for families, patients, or referral partners.";
  }

  switch (profile.challenge) {
    case "Conversion":
      return "That sounds less like a traffic issue and more like friction in the decision path.";
    case "Traffic":
      return "Before sending more traffic, I would verify that the offer and landing path are ready to convert the right visitor.";
    case "Operations":
      return "The pattern I would check first is whether intent is getting lost in handoffs after someone raises their hand.";
    case "Tracking":
      return "Tracking gaps usually make it hard to separate real demand from noisy traffic.";
    case "Follow-up":
      return "For this type of bottleneck, speed-to-lead and routing usually matter before more lead volume.";
    case "Website":
      return "For website work, I would separate message clarity from the mechanics of the next action path.";
    default:
      return "The first move is to separate traffic, conversion, operations, tracking, and follow-up so the next improvement is not guesswork.";
  }
}

function businessContextLabel(businessType: ZoraBusinessType) {
  switch (businessType) {
    case "Ecommerce":
      return "an ecommerce business";
    case "Real Estate":
      return "a real estate business";
    case "Care/Healthcare":
      return "a care or healthcare organization";
    case "Service Business":
      return "a service business";
    case "Other":
      return "this business";
  }
}

export function buildZoraDiagnosis(profile: ZoraLeadProfile) {
  const areas = joinList(focusAreas(profile));
  const contextParts = [
    profile.platform ? `on ${profile.platform}` : "",
    profile.annualRevenueText ? `at about ${profile.annualRevenueText}` : "",
  ].filter(Boolean);
  const contextText =
    contextParts.length > 0 ? ` ${contextParts.join(" ")}` : "";

  const opener =
    profile.businessType === "Real Estate"
      ? "For seller-lead growth"
      : profile.businessType === "Care/Healthcare"
        ? "For intake growth"
        : profile.businessType === "Ecommerce"
          ? "For ecommerce growth"
          : profile.businessType === "Service Business" && profile.challenge === "Follow-up"
            ? "For service-business follow-up"
            : profile.businessType === "Service Business"
              ? "For service-business growth"
              : "Based on what you shared";

  return `${opener}${contextText}, I would focus on ${areas}. ${challengeDiagnosis(profile)}`;
}

function buildRecommendationRoadmap(profile: ZoraLeadProfile): ZoraRoadmapStep[] {
  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    if (profile.funnelStage === "Product pages" || profile.productScope === "All products") {
      return [
        {
          title: "Mobile Product-Page Conversion Review",
          reason:
            "If product pages are leaking across the catalog, the shared template is probably creating uncertainty before add-to-cart.",
          validation:
            "Review mobile PDP hierarchy, images, variant selection, reviews, shipping/returns visibility, sticky add-to-cart, and product-view to add-to-cart data.",
          expectedImpact:
            "Reduce buying friction before checkout and make the first purchase decision clearer.",
          costRange: "$1,500-$4,000",
          timeline: "1-3 weeks",
        },
        {
          title: "Checkout Confidence and Tracking Pass",
          reason:
            "Once product-page intent improves, checkout and tracking need to confirm where shoppers still hesitate.",
          validation:
            "Check cart clarity, shipping/tax visibility, payment options, checkout-start events, and abandonment by step.",
          expectedImpact:
            "Separate real checkout friction from analytics noise before investing in larger theme work.",
          costRange: "$1,000-$3,000",
          timeline: "1-2 weeks",
        },
      ];
    }

    return [
      {
        title: "Purchase Path Friction Review",
        reason:
          "A low conversion rate usually means the buying path needs to be separated from traffic quality before scaling acquisition.",
        validation:
          "Map product discovery, product pages, cart, checkout, trust signals, and event tracking.",
        expectedImpact:
          "Identify whether the first fix is UX, offer clarity, checkout confidence, or tracking.",
        costRange: "$1,500-$4,500",
        timeline: "1-3 weeks",
      },
      {
        title: "Priority UX Improvement Sprint",
        reason:
          "The best next move is usually a focused fix to the highest-friction step, not a full rebuild by default.",
        validation:
          "Compare top landing/product paths against add-to-cart, checkout-start, and purchase data.",
        expectedImpact:
          "Improve conversion readiness before ad spend or major platform work.",
        costRange: "$2,000-$6,000",
        timeline: "2-4 weeks",
      },
    ];
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Operations") {
    return [
      {
        title: "Ecommerce Operations Flow Map",
        reason:
          "For ecommerce operations, the leak is often not the storefront itself; it is the handoff between order placed, fulfillment, customer communication, support, and reporting.",
        validation:
          "Map order flow, fulfillment handoffs, inventory/product data, support routing, exception handling, and reporting visibility.",
        expectedImpact:
          "Expose where work is manual, duplicated, delayed, or invisible before automating the wrong step.",
        costRange: "$1,500-$4,000",
        timeline: "1-3 weeks",
      },
      {
        title: "Automation and Reporting Prioritization",
        reason:
          "After the operating flow is visible, the next move is to prioritize the automations and dashboards that remove the most friction.",
        validation:
          "Review order status updates, internal notifications, customer support triggers, inventory alerts, and team reporting needs.",
        expectedImpact:
          "Reduce manual handoffs and improve operational visibility without overbuilding.",
        costRange: "$2,000-$7,000",
        timeline: "2-4 weeks",
      },
    ];
  }

  if (profile.businessType === "Real Estate") {
    return [
      {
        title: "Seller Lead Path Review",
        reason:
          "Real estate lead generation depends on a specific offer, local proof, and a clear capture path for sellers or buyers.",
        validation:
          "Review landing-page message, local trust proof, valuation/consultation offer, form friction, and booking path.",
        expectedImpact:
          "Increase qualified lead capture from the traffic you already have.",
        costRange: "$1,000-$3,000",
        timeline: "1-2 weeks",
      },
      {
        title: "Follow-Up Speed and Source Tracking",
        reason:
          "Seller leads often lose value when response speed, ownership, or source tracking is unclear.",
        validation:
          "Check CRM routing, notifications, missed-lead alerts, and whether leads are tagged by source.",
        expectedImpact:
          "Improve response quality and show which channels are worth scaling.",
        costRange: "$1,500-$4,000",
        timeline: "1-3 weeks",
      },
    ];
  }

  if (profile.businessType === "Service Business" && profile.challenge === "Follow-up") {
    return [
      {
        title: "Speed-to-Lead Workflow Review",
        reason:
          "When leads exist but follow-up is slow, more traffic will usually amplify the leak instead of solving it.",
        validation:
          "Map where leads land, who gets notified, response-time rules, CRM ownership, and missed-lead recovery.",
        expectedImpact:
          "Shorten response time and reduce lost opportunities from manual handoffs.",
        costRange: "$1,000-$3,500",
        timeline: "1-2 weeks",
      },
      {
        title: "Booking and Nurture Automation",
        reason:
          "After routing is clear, automation can keep leads moving without depending on someone checking manually.",
        validation:
          "Review booking path, reminders, status changes, SMS/email follow-up, and no-response alerts.",
        expectedImpact:
          "Improve consistency from inquiry to booked conversation.",
        costRange: "$2,000-$6,000",
        timeline: "2-4 weeks",
      },
    ];
  }

  if (profile.challenge === "Tracking") {
    return [
      {
        title: "Tracking and Attribution Review",
        reason:
          "If measurement is unclear, it is hard to know whether traffic, conversion, or follow-up is the real issue.",
        validation:
          "Check GA4 events, pixels, UTMs, conversion actions, source reporting, and dashboard visibility.",
        expectedImpact:
          "Create cleaner decision-making before spending more on ads or rebuild work.",
        costRange: "$1,000-$3,000",
        timeline: "1-2 weeks",
      },
      {
        title: "Dashboard or Reporting Cleanup",
        reason:
          "Once events are trustworthy, the team needs a simple view of what is working.",
        validation:
          "Prioritize channel, lead, conversion, and follow-up metrics that connect to sales decisions.",
        expectedImpact:
          "Make the next improvement less dependent on guesswork.",
        costRange: "$1,500-$4,500",
        timeline: "1-3 weeks",
      },
    ];
  }

  return [
    {
      title: "Growth System Diagnosis",
      reason:
        "The safest first move is to separate traffic, conversion, follow-up, tracking, and operations before prescribing a build.",
      validation:
        "Review the website path, primary offer, lead capture, follow-up handoff, and tracking signals.",
      expectedImpact:
        "Identify the highest-leverage bottleneck without over-scoping the first project.",
      costRange: "$1,000-$3,000",
      timeline: "1-2 weeks",
    },
    {
      title: "Focused Improvement Sprint",
      reason:
        "After the bottleneck is confirmed, a targeted improvement is usually smarter than a full rebuild.",
      validation:
        "Prioritize the one or two changes most likely to improve lead capture, conversion, or operational control.",
      expectedImpact:
        "Create measurable progress before deciding whether larger implementation is needed.",
      costRange: "$2,000-$7,000",
      timeline: "2-4 weeks",
    },
  ];
}

function formatRoadmapStep(step: ZoraRoadmapStep, index: number) {
  return `${index + 1}. ${step.title}\nWhy: ${step.reason}\nValidate: ${step.validation}\nExpected impact: ${step.expectedImpact}\nTypical range: ${step.costRange}\nTimeline: ${step.timeline}`;
}

function buildRecommendationResponse(profile: ZoraLeadProfile) {
  if (!hasProfileDiagnosisSignal(profile)) {
    return "I can recommend a roadmap, but I need one business detail first: what type of business is this, and what feels stuck right now?";
  }

  const roadmap = profile.recommendationRoadmap?.length
    ? profile.recommendationRoadmap
    : buildRecommendationRoadmap(profile);
  const first = roadmap[0];
  const second = roadmap[1];

  if (!first) {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  return [
    `What I would do first: ${first.title}.`,
    `Why: ${first.reason}`,
    `What I would validate: ${first.validation}`,
    `Expected impact: ${first.expectedImpact}`,
    second ? `What comes second: ${second.title}. ${second.reason}` : "",
    `Typical range: ${first.costRange}`,
    `Timeline: ${first.timeline}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRoadmapFollowUpResponse(message: string, roadmap: ZoraRoadmapStep[]) {
  const lower = message.toLowerCase();
  const requestedStep = /\bthird|3rd\b/.test(lower) ? 2 : /\bsecond|2nd\b/.test(lower) ? 1 : 0;
  const step = roadmap[requestedStep] || roadmap[0];

  if (!step) {
    return "I would start by diagnosing the growth system, then use that to decide whether the next move is a free audit, a focused improvement sprint, or a strategy call.";
  }

  if (/\bhow much|cost|investment|range|price|pricing\b/i.test(message)) {
    return `For ${step.title}, I would treat ${step.costRange} as a directional planning range. The range depends on platform constraints, implementation depth, and business impact. It is not a final quote.`;
  }

  if (/\bhow long|timeline|weeks?|months?|take\b/i.test(message)) {
    return `For ${step.title}, I would plan around ${step.timeline}. The timeline depends on access, content readiness, platform constraints, and how quickly validation data is available.`;
  }

  if (/\bwhy\b/i.test(message)) {
    return `I put ${step.title} there because ${step.reason} I would validate it by checking: ${step.validation}`;
  }

  return formatRoadmapStep(step, requestedStep);
}

function greetingPrefix(profile: ZoraLeadProfile) {
  return profile.visitorName ? `Nice to meet you, ${profile.visitorName}. ` : "";
}

function buildCapabilityResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}Yes. Opzix builds websites, ecommerce systems, AI assistants, CRM and booking flows, automation, dashboards, integrations, lead-generation systems, and audit-based implementation roadmaps. My role is to understand what kind of business you have, identify the likely bottleneck, explain what it means, and recommend whether the next move is a focused fix, free audit, or strategy call.`;
}

function buildSmallTalkResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}I'm doing well, thanks for asking. I'm here to help diagnose growth bottlenecks across traffic, conversion, follow-up, tracking, operations, and your website. If you tell me what business you run and what feels stuck, I can give you a practical recommendation.`;
}

function buildThanksResponse(profile: ZoraLeadProfile, repeatedSoftClose = false) {
  if (repeatedSoftClose) {
    return profile.hasNoWebsite
      ? "Got it. I'll be here when you're ready to map the first version."
      : "Got it. I'll be here when you want to run the audit, book a call, or ask a specific question.";
  }

  if (profile.hasNoWebsite) {
    return `${profile.visitorName ? `You're welcome, ${profile.visitorName}.` : "You're welcome."} Since there is no site to audit yet, the best next step is a strategy call to map the first landing page, offer, and follow-up path.`;
  }

  return `${profile.visitorName ? `You're welcome, ${profile.visitorName}.` : "You're welcome."} When you're ready, the next best step is either the free audit for a website-based diagnosis or a strategy call for planning the system.`;
}

function buildTimelineResponse(profile: ZoraLeadProfile, message: string) {
  if (profile.recommendationRoadmap?.length && isRoadmapSpecificFollowUp(message)) {
    return buildRoadmapFollowUpResponse(message, profile.recommendationRoadmap);
  }

  if (isEcommerceBuildQuestion(message)) {
    return `${greetingPrefix(profile)}A focused ecommerce website can often launch in 3-6 weeks, while a more custom ecommerce system with product structure, integrations, tracking, automation, or migration work can take 6-12+ weeks. The real timeline depends on catalog complexity, content readiness, platform access, payment/shipping setup, and how much backend workflow needs to be connected. Want me to help scope the right path?`;
  }

  return `${greetingPrefix(profile)}Focused improvements can often take 1-3 weeks. Larger websites, ecommerce systems, AI assistants, automation workflows, dashboards, or integrations can take several weeks or longer depending on scope, access, content, and testing. Want me to help scope the right path?`;
}

function buildPricingResponse(profile: ZoraLeadProfile, message: string) {
  if (profile.recommendationRoadmap?.length && isRoadmapSpecificFollowUp(message)) {
    return buildRoadmapFollowUpResponse(message, profile.recommendationRoadmap);
  }

  return `${greetingPrefix(profile)}I would look at cost in three layers: platform, implementation, and business impact. Platform affects what is easy or constrained. Implementation is the actual design, build, automation, integration, tracking, and testing work. Business impact determines whether the right move is a small fix or a larger system build. Opzix uses directional planning ranges in chat, not fixed quotes; focused improvements often start in the low thousands, while larger ecommerce systems, AI assistants, dashboards, automations, and integrations depend on scope.`;
}

function buildClarifyingResponse() {
  return "I can help with that. To give a useful recommendation, tell me what kind of business you run and what feels stuck: traffic, conversion, operations, tracking, follow-up, or the website itself.";
}

function buildWebsiteCapturedResponse(analysis: ZoraMessageAnalysis) {
  return `Got it, I have ${analysis.websiteUrl}. What type of business is this for, and what feels stuck right now?`;
}

function inferredContextSummary(profile: ZoraLeadProfile) {
  if (
    !shouldUseIndustryInference(profile) ||
    !profile.inferredBusinessModel ||
    !profile.inferredFunnelType ||
    !profile.industryConfidence ||
    profile.industryConfidence < 0.7
  ) {
    return "";
  }

  const focus =
    profile.inferredBusinessModel === "B2B Ecommerce / Distributor"
      ? "product discovery, quote/request paths, account-based purchasing, follow-up after inquiry, and tracking visibility"
      : profile.inferredBusinessModel === "DTC Ecommerce"
        ? "product discovery, mobile buying experience, checkout confidence, retention, and tracking visibility"
        : profile.inferredIndustry === "Real Estate"
          ? "seller/buyer lead capture, local authority proof, appointment booking, and follow-up speed"
          : profile.inferredBusinessModel === "Care Provider / Service Organization"
            ? "intake flow, referral paths, trust proof, service clarity, and response process"
            : "";

  return focus
    ? ` This appears to be a ${profile.inferredBusinessModel} with a ${profile.inferredFunnelType} funnel. Assuming that's correct, I'd look at ${focus} first.`
    : "";
}

function buildWebsiteCapturedWithMemoryResponse(profile: ZoraLeadProfile) {
  const inferredContext = inferredContextSummary(profile);

  if (profile.businessType && profile.challenge) {
    return `Got it, I have ${profile.websiteUrl}.${inferredContext || ` Using the business type you selected, the issue is ${profile.challenge.toLowerCase()}, so the next useful step is to look at the actual site path before guessing further.`}`;
  }

  if (profile.businessType) {
    return `Got it, I have ${profile.websiteUrl}.${inferredContext} What feels like the biggest bottleneck right now: traffic, conversion, operations, tracking, follow-up, or the website?`;
  }

  return `Got it, I have ${profile.websiteUrl}. What type of business is this for, and what feels stuck right now?`;
}

function buildBusinessTypeMismatchResponse(profile: ZoraLeadProfile) {
  const selected = profile.businessType || "the selected business type";
  const inferred = profile.inferredIndustry || "another industry";

  return `Quick check: you selected ${selected}, but the website looks like it may be ${inferred.toLowerCase()}-related. Should I diagnose this as ${selected.toLowerCase()} or a ${inferred.toLowerCase()} business?`;
}

function buildOutOfScopeResponse() {
  return "I probably cannot help with that directly. Opzix focuses on websites, ecommerce, AI assistants, automation, tracking, follow-up, dashboards, integrations, and lead-generation systems. If the issue connects to your customer journey or business systems, I can help diagnose it.";
}

function buildAuditRequestResponse(profile: ZoraLeadProfile) {
  if (profile.hasNoWebsite) {
    return "Since there is no website to audit yet, the best next step is a strategy call to map the first version.";
  }

  if (!profile.websiteUrl) {
    return "Yes. What website URL should I use?";
  }

  if (profile.businessType || profile.challenge || profile.platform) {
    const focus = joinList(focusAreas(profile));
    const business = profile.businessType
      ? businessContextLabel(profile.businessType)
      : "your website";

    return `Yes. Since the issue is tied to ${business}, the audit should focus on ${focus}. The scanner can review ${profile.websiteUrl} and generate a more detailed roadmap.`;
  }

  return `Yes. Zora does not run the full scanner inside chat, but the free audit scanner can review ${profile.websiteUrl} and generate a more detailed roadmap.`;
}

function buildBookingRequestResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}A strategy call is the best next step if you want help deciding what to fix first and what scope makes sense.`;
}

function buildNoWebsiteResponse() {
  return "Since there is no site to audit yet, the best next step is a strategy call to map the landing page, offer, and follow-up system.";
}

function buildConsultantResponse(profile: ZoraLeadProfile, message: string) {
  if (
    profile.recommendationRoadmap?.length &&
    isRoadmapFollowUp(message) &&
    isRoadmapSpecificFollowUp(message)
  ) {
    return buildRoadmapFollowUpResponse(message, profile.recommendationRoadmap);
  }

  if (/\bshopify\b.+\bbigcommerce\b|\bbigcommerce\b.+\bshopify\b/i.test(message)) {
    return "Shopify is usually the cleaner path for DTC stores that need speed, app ecosystem, and simpler operations. BigCommerce can make sense for more complex catalogs, B2B pricing, multi-store needs, or tighter backend requirements. The right choice depends on catalog complexity, checkout rules, integrations, team workflow, and how much control you need over operations.";
  }

  if (/\b(should i run ads|run ads|ads|advertising|scale traffic)\b/i.test(message)) {
    return "What this means: ads only help when the path after the click can convert and follow up. Traffic flows into conversion, then follow-up, then operations.\nWhat I would check: landing-page match, offer clarity, mobile path, tracking, and whether leads or carts are handled quickly.\nWhy it matters: more traffic will not solve conversion leaks; it usually makes the leak more expensive.\nRecommendation: if conversion is weak, fix the site path first. If conversion is strong, scale traffic. If leads exist but close rate is weak, fix follow-up and operations before buying more traffic.";
  }

  if (isWebsiteBuildOrRebuildQuestion(message)) {
    if (profile.businessType === "Real Estate") {
      return "For a real estate business, I would not start with a generic new website. I would scope the site around the lead path: seller or buyer offer, local proof, valuation or consultation CTA, fast follow-up, source tracking, and a page structure that supports ads, organic search, and referrals. The first decision is whether you need a focused landing path or a fuller brand/site rebuild. A strategy call is usually the better next step for scoping that before treating it like a fixed website project.";
    }

    return "What this means: I would compare cost to improve against cost to replace before recommending a rebuild.\nWhat I would check: platform limits, technical debt, page/template constraints, tracking gaps, integration needs, and whether the current site blocks growth.\nWhy it matters: a rebuild is only worth it when the architecture is limiting the business, not just because the site feels imperfect.\nRecommendation: default to a focused fix first. Consider rebuild only if platform limitations, severe technical debt, or architecture constraints are confirmed.";
  }

  if (/\b(audit process|how does the audit|free audit|audit work)\b/i.test(message)) {
    return "What this means: the audit is a structured way to diagnose the visible growth system before scoping work.\nWhat I would check: conversion gaps, UX friction, tracking gaps, and operational bottlenecks such as lead capture, CRM handoff, booking flow, product discovery, and checkout confidence.\nWhy it matters: the goal is to prioritize the next useful improvement, not generate a generic score.\nRecommendation: run the free audit when you have a URL. If there is no site yet, start with a strategy call to map the first version.";
  }

  if (/\b(cost analysis|roi|return|worth it|business impact)\b/i.test(message)) {
    return "What this means: I would evaluate the decision in layers: platform, implementation, and business impact.\nWhat I would check: what the current platform allows, what has to be designed or integrated, and which bottleneck affects revenue or lead quality the most.\nWhy it matters: the cheapest fix is not always the best one, but the biggest build is not automatically justified either.\nRecommendation: start with a directional planning range tied to the highest-value bottleneck, then validate scope before treating it like a proposal.";
  }

  if (/\b(implementation|process|strategy|how would this work)\b/i.test(message)) {
    return "What this means: Opzix usually works through diagnose, prioritize, then build.\nWhat I would check: the customer journey, conversion friction, tracking, follow-up handoff, and any systems that need to connect.\nWhy it matters: implementation should follow the bottleneck, not a generic feature list.\nRecommendation: diagnose the visible path first, prioritize the highest-impact improvement, then build the website, ecommerce, AI assistant, automation, dashboard, integration, or workflow that solves that specific constraint.";
  }

  return `${buildZoraDiagnosis(profile)} Recommendation: I would diagnose the visible path first, prioritize the highest-impact bottleneck, then decide whether the next move is a focused fix, free audit, or strategy call.`;
}

function buildContextSwitchResponse(profile: ZoraLeadProfile) {
  if (profile.businessType === "Real Estate") {
    return "Got it - I'll treat this as a real estate lead-generation site, not ecommerce. For real estate, I'd focus on seller/buyer landing pages, local proof, lead capture, follow-up speed, and booking flow. Do you want to run the free audit on the page, or map the seller-lead path first?";
  }

  if (profile.businessType === "Care/Healthcare") {
    return "Got it - I'll treat this as a care or healthcare growth system. I would focus on trust proof, service clarity, intake friction, referral paths, and response process first. Do you want to run the free audit on the page, or map the intake path first?";
  }

  if (profile.businessType === "Service Business") {
    return "Got it - I'll treat this as a service business. I would focus on lead capture, qualification, booking flow, follow-up speed, and operational handoff first. Do you want to map the lead path or book a strategy call?";
  }

  if (profile.businessType === "Ecommerce") {
    return "Got it - I'll treat this as ecommerce. I would focus on product discovery, mobile UX, checkout confidence, tracking, and follow-up first. Do you want to run the free audit on the store, or talk through the likely fix path first?";
  }

  return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
}

function businessShortLabel(profile: ZoraLeadProfile) {
  if (profile.businessType === "Care/Healthcare") return "care or healthcare";
  if (profile.businessType === "Real Estate") return "real estate";
  if (profile.businessType === "Service Business") return "service-business";
  if (profile.businessType === "Ecommerce") return "ecommerce";
  return "this business";
}

function topicLabel(topic: ZoraTopic) {
  switch (topic) {
    case "offer_clarity":
      return "offer clarity";
    case "tracking_visibility":
      return "tracking visibility";
    case "follow_up_handoff":
      return "follow-up handoff";
    case "landing_page":
      return "landing page";
    case "booking_flow":
      return "booking flow";
    case "product_discovery":
      return "product discovery";
    case "checkout_confidence":
      return "checkout confidence";
    case "crm_routing":
      return "CRM routing";
    case "lead_capture":
      return "lead capture";
  }
}

function topicResponseParts(profile: ZoraLeadProfile, topic: ZoraTopic) {
  const business = businessShortLabel(profile);

  switch (topic) {
    case "offer_clarity":
      return {
        happening: `The offer may not be specific enough for the visitor to quickly understand why they should act now, especially in a ${business} context.`,
        matters:
          "Traffic and operations improvements only help if the first promise is clear. A vague offer makes good visitors hesitate, compare, or leave.",
        validate:
          "I would validate the headline, primary CTA, proof near the CTA, service or outcome specificity, and whether the page answers the visitor's first objection.",
        good:
          "A good offer says who it is for, what outcome it helps create, why it is credible, and what the next step is without forcing the visitor to infer it.",
        next:
          "I would review the landing page hero, CTA wording, proof blocks, and the first form or booking step.",
      };
    case "tracking_visibility":
      return {
        happening:
          "The team may be making decisions from incomplete or mismatched data, so it is hard to know whether the real issue is traffic, conversion, or follow-up.",
        matters:
          "Without trustworthy tracking, the next investment can look reasonable but target the wrong bottleneck.",
        validate:
          "I would validate GA4 events, conversion actions, pixels, UTMs, call or form tracking, CRM source fields, and whether reports match actual leads or sales.",
        good:
          "Good tracking shows where visitors came from, what action they took, which leads were qualified, and where the handoff broke.",
        next:
          "I would review analytics, ad platform events, form or booking events, CRM source capture, and the simplest dashboard the team actually uses.",
      };
    case "follow_up_handoff":
      return {
        happening:
          "Leads or customer intent may be captured, but the handoff after that point may depend too much on manual checking or unclear ownership.",
        matters:
          "Slow or inconsistent follow-up lowers close rate even when traffic and the website are doing their job.",
        validate:
          "I would validate where each inquiry lands, who gets notified, how fast they respond, what happens after no response, and whether status is visible.",
        good:
          "Good follow-up has one owner, instant alerts, a backup reminder, a clear next action, and a visible status for every lead.",
        next:
          "I would review form routing, CRM assignment, notification channels, reminders, and missed-lead recovery.",
      };
    case "landing_page":
      return {
        happening:
          "The landing page may be trying to do too much, or it may not match the traffic source and visitor intent tightly enough.",
        matters:
          "A landing page is usually where offer, proof, lead capture, and tracking meet. If that page is unclear, every channel performs worse.",
        validate:
          "I would validate message match, above-the-fold clarity, CTA visibility, proof, mobile layout, form friction, and source-specific paths.",
        good:
          "A good landing page makes the visitor's next decision obvious and gives enough proof to act without overloading them.",
        next:
          "I would review the hero section, CTA path, proof blocks, mobile scroll path, form fields, and conversion events.",
      };
    case "booking_flow":
      return {
        happening:
          "The visitor may be interested, but the booking step may introduce friction, uncertainty, or a weak handoff.",
        matters:
          "Booking friction turns qualified intent into delay, and delay gives people time to forget, compare, or choose someone else.",
        validate:
          "I would validate calendar visibility, available times, confirmation messaging, reminders, qualification questions, and CRM handoff.",
        good:
          "A good booking flow feels fast, confirms the value of the call, sets expectations, and sends the context to the right person.",
        next:
          "I would review the CTA into booking, scheduler settings, confirmation emails, reminders, and CRM notes.",
      };
    case "product_discovery":
      return {
        happening:
          "Shoppers may want to buy but struggle to find the right product, compare options, or understand what fits their need.",
        matters:
          "Product discovery issues often look like traffic problems because visitors leave before they reach a confident product decision.",
        validate:
          "I would validate navigation, search quality, collection structure, filters, product cards, availability, and paths from landing pages to products.",
        good:
          "Good product discovery helps shoppers narrow options quickly without losing context or confidence.",
        next:
          "I would review search results, collections, merchandising, product cards, filters, and top landing paths.",
      };
    case "checkout_confidence":
      return {
        happening:
          "Shoppers may have intent, but the cart or checkout may introduce surprise, uncertainty, or missing reassurance.",
        matters:
          "Checkout confidence is where trust, payment, shipping, tax, returns, and tracking all converge.",
        validate:
          "I would validate cart clarity, shipping and tax visibility, payment options, guest checkout, error states, delivery promises, and checkout events.",
        good:
          "A good checkout feels predictable, safe, fast, and consistent with what the shopper saw before checkout.",
        next:
          "I would review cart-to-checkout steps, shipping/payment screens, trust cues, failed payment data, and abandonment tracking.",
      };
    case "crm_routing":
      return {
        happening:
          "The CRM may be capturing information, but routing, ownership, or status tracking may not be clear enough for consistent action.",
        matters:
          "A CRM only improves growth when it tells the right person what to do next at the right time.",
        validate:
          "I would validate source fields, lead owner assignment, pipeline stages, notifications, duplicate handling, and missed follow-up alerts.",
        good:
          "Good CRM routing makes every lead visible, assigned, timed, and recoverable if the first response does not happen.",
        next:
          "I would review form-to-CRM mapping, assignment rules, alerts, pipeline stages, and reporting views.",
      };
    case "lead_capture":
      return {
        happening:
          "Interested visitors may not have a clear, low-friction way to raise their hand or explain what they need.",
        matters:
          "Lead capture is the bridge between website interest and sales follow-up. If it is vague or hard, qualified visitors disappear quietly.",
        validate:
          "I would validate CTA clarity, form length, field relevance, mobile usability, trust near the form, confirmation messaging, and source tracking.",
        good:
          "Good lead capture asks for only the context needed to route the next step and reassures the visitor that someone will follow up.",
        next:
          "I would review CTAs, forms, call buttons, intake questions, confirmation states, and CRM routing.",
      };
  }
}

function topicDepthInsight(topic: ZoraTopic, depth = 1) {
  if (depth <= 1) return "";

  const later = depth >= 3;

  switch (topic) {
    case "offer_clarity":
      return later
        ? "Deeper lens: I would compare the offer against the visitor's urgency. If the page says what you do but not why someone should act now, the offer is still underpowered."
        : "Deeper lens: I would separate the offer from the service description. The service is what you provide; the offer is the reason a visitor believes this next step is worth taking now.";
    case "tracking_visibility":
      return later
        ? "Deeper lens: I would check whether the same lead or sale tells the same story in analytics, ads, and the CRM. If those disagree, reporting will keep producing false confidence."
        : "Deeper lens: I would separate event coverage from decision visibility. Having events fire is not enough if the team still cannot tell which channel produced qualified demand.";
    case "follow_up_handoff":
      return later
        ? "Deeper lens: I would look for the first place ownership becomes ambiguous. Follow-up usually breaks where everyone can see the lead but no one clearly owns it."
        : "Deeper lens: I would separate capture from response. A form submission is not a lead system until routing, reminders, and ownership are clear.";
    case "landing_page":
      return later
        ? "Deeper lens: I would check whether the page is built for one visitor intent or several competing intents. Mixed intent pages usually dilute conversion."
        : "Deeper lens: I would look at message match first. The page should continue the promise that brought the visitor there, not make them restart their decision.";
    case "booking_flow":
      return later
        ? "Deeper lens: I would inspect the confirmation and reminder experience. The booking is not complete until the visitor knows what happens next and the team has useful context."
        : "Deeper lens: I would treat booking as a conversion step, not an admin detail. The calendar needs to reinforce trust and reduce hesitation.";
    case "product_discovery":
      return later
        ? "Deeper lens: I would compare search, category, and recommendation paths separately because each one reveals a different kind of buying intent."
        : "Deeper lens: I would separate finding a product from choosing a product. Discovery has to support both navigation and confidence.";
    case "checkout_confidence":
      return later
        ? "Deeper lens: I would look for late surprises. Shipping, tax, delivery, payment, or return uncertainty often appears after the shopper has already decided to buy."
        : "Deeper lens: I would separate checkout mechanics from checkout confidence. A checkout can function technically while still making buyers hesitate.";
    case "crm_routing":
      return later
        ? "Deeper lens: I would check whether CRM status mirrors reality. If the pipeline stage does not match what the team should do next, the CRM becomes passive storage."
        : "Deeper lens: I would separate CRM capture from CRM routing. The CRM should assign, notify, and clarify next action, not just store the inquiry.";
    case "lead_capture":
      return later
        ? "Deeper lens: I would check whether the form asks for enough context to route the lead without making the visitor feel interrogated."
        : "Deeper lens: I would treat lead capture as a promise. The CTA and form should make it clear what the visitor gets after submitting.";
  }
}

function buildTopicResponse(profile: ZoraLeadProfile, topic: ZoraTopic) {
  const parts = topicResponseParts(profile, topic);
  const label = topicLabel(topic);
  const depthInsight = topicDepthInsight(topic, profile.currentTopicDepth);

  return [
    `Let's stay on ${label}.`,
    `What I think is happening: ${parts.happening}`,
    `Why it matters: ${parts.matters}`,
    `What I would validate: ${parts.validate}`,
    `What good looks like: ${parts.good}`,
    depthInsight,
    `What I'd review next: ${parts.next}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildMomentumResponse(profile: ZoraLeadProfile) {
  if (profile.currentTopic) {
    return buildTopicResponse(profile, profile.currentTopic);
  }

  const websiteContext = profile.websiteUrl
    ? ` I can use ${profile.websiteUrl} as context, but I would still validate the actual path with the scanner or a manual review before treating this as confirmed.`
    : "";

  if (profile.recommendationRoadmap?.length) {
    const first = profile.recommendationRoadmap[0];
    return `Let's go one layer deeper on ${first.title}. I would validate ${first.validation.toLowerCase()}${websiteContext} Quick question: which part feels least clear right now: the offer, the page path, the tracking, or the follow-up handoff?`;
  }

  if (profile.businessType === "Real Estate" && profile.challenge === "Tracking") {
    return `Good. For real estate tracking, I would go deeper on source attribution, form and booking events, call tracking, CRM handoff, and whether seller versus buyer leads are separated cleanly.${websiteContext} Quick question: are you mainly trying to track form fills, calls, booked appointments, or lead source quality?`;
  }

  if (profile.businessType === "Real Estate") {
    return `Good. For real estate, I would separate the lead path into offer, local proof, capture action, response speed, and source tracking.${websiteContext} Quick question: are you focused more on seller leads, buyer leads, recruiting, or general brand visibility?`;
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    return `Good. For ecommerce conversion, I would go deeper on where intent is dropping: product discovery, product pages, cart, checkout, or post-purchase follow-up.${websiteContext} Quick question: are visitors mostly dropping before product pages, on product pages, or during checkout?`;
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Tracking") {
    return `Good. For ecommerce tracking, I would check GA4 events, product-view to add-to-cart coverage, checkout-step events, purchase attribution, ad pixels, and whether reports match reality.${websiteContext} Quick question: is the biggest concern missing events, wrong revenue attribution, ad platform mismatch, or unclear reporting?`;
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Operations") {
    return `Good. For ecommerce operations, I would map the path from order placed to fulfillment, customer communication, support exceptions, inventory updates, and reporting.${websiteContext} Quick question: where does the team lose the most time right now: fulfillment, inventory, support, reporting, or manual updates?`;
  }

  if (profile.businessType === "Service Business" && profile.challenge === "Follow-up") {
    return `Good. For service-business follow-up, I would look at speed-to-lead, where leads land, who owns the first response, CRM notifications, reminders, and booking handoff.${websiteContext} Quick question: do leads currently go into a CRM, email inbox, spreadsheet, or nowhere structured?`;
  }

  if (profile.businessType === "Service Business" && profile.hasNoWebsite) {
    return "Good. Since there is no website yet, I would start by mapping the first landing page around the service, offer, proof, lead capture, and follow-up path. Quick question: what service are you trying to sell first, and who is the ideal customer?";
  }

  if (profile.businessType === "Service Business") {
    return `Good. For a service business, I would separate traffic quality from offer clarity, trust proof, form friction, booking path, and follow-up speed.${websiteContext} Quick question: are you trying to get more calls, form leads, bookings, or qualified consultations?`;
  }

  if (profile.businessType === "Care/Healthcare") {
    return `Good. For care or healthcare, I would go deeper on trust proof, service clarity, intake path, referral source, booking/contact flow, and response process.${websiteContext} Quick question: are most inquiries coming from families, patients, referral partners, or search traffic?`;
  }

  return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
}

function followUpQuestion(profile: ZoraLeadProfile) {
  if (!profile.businessType) {
    return "Quick question: what type of business is this for?";
  }

  if (!profile.challenge) {
    return "Quick question: what feels like the biggest bottleneck right now: traffic, conversion, operations, tracking, follow-up, or the website?";
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    if (profile.funnelStage) {
      return "Quick question: do you want to run the free audit next, or talk through the likely fix path first?";
    }

    return "Are most visitors dropping before product pages, on product pages, or during checkout?";
  }

  if (profile.businessType === "Real Estate") {
    if (profile.hasNoWebsite) {
      return "Since there is no site to audit yet, the best next step is a strategy call to map the landing page, offer, and follow-up system.";
    }

    if (profile.hasWebsiteOrLandingPage && !profile.websiteUrl) {
      return "Great - what is the URL, or would you rather talk through the strategy first?";
    }

    if (profile.leadSource) {
      if (profile.websiteUrl || profile.hasNoWebsite) {
        return "Quick question: do you want a strategy-call review or a high-level next-step recommendation here?";
      }

      return "Quick question: do you already have a website or landing page for those leads?";
    }

    return "Are you currently getting seller leads from ads, referrals, organic search, or social?";
  }

  if (profile.businessType === "Care/Healthcare") {
    return "Are most inquiries coming from families, referral partners, or waiver-related searches?";
  }

  if (profile.businessType === "Service Business" && profile.challenge === "Follow-up") {
    if (profile.leadDestination) {
      return "Quick question: how does your team get notified when a new lead comes in?";
    }

    return "Do leads currently go into a CRM, email inbox, spreadsheet, or nowhere structured?";
  }

  if (!profile.websiteUrl && !profile.hasNoWebsite) {
    if (profile.hasWebsiteOrLandingPage) {
      return "Great - what is the URL, or would you rather talk through the strategy first?";
    }

    return "Quick question: do you already have a website URL I should use as context?";
  }

  return "Quick question: do you want a high-level recommendation here, or do you want to run the scanner for a more detailed roadmap?";
}

function hasDiagnosisSignal(analysis: ZoraMessageAnalysis) {
  const nonGenericChallenge =
    analysis.challenge && analysis.challenge !== "Website" ? analysis.challenge : undefined;

  return Boolean(
    analysis.businessType ||
      analysis.platform ||
      analysis.revenueRange ||
      analysis.hasWebsiteOrLandingPage ||
      nonGenericChallenge,
  );
}

function hasProfileDiagnosisSignal(profile: ZoraLeadProfile) {
  return Boolean(
    profile.businessType &&
      (profile.challenge ||
        profile.desiredOutcome ||
        profile.conversionRate ||
        profile.websiteUrl ||
        profile.hasWebsiteOrLandingPage ||
        profile.hasNoWebsite),
  );
}

function qualificationCount(profile: ZoraLeadProfile) {
  return [
    profile.businessType,
    profile.challenge,
    profile.websiteUrl,
    profile.hasWebsiteOrLandingPage,
    profile.hasNoWebsite,
    profile.revenueRange,
    profile.platform,
    profile.desiredOutcome,
    profile.conversionRate,
    profile.leadSource,
    profile.leadDestination,
  ].filter(Boolean).length;
}

function hasSufficientQualification(profile: ZoraLeadProfile) {
  return Boolean(profile.websiteUrl || qualificationCount(profile) >= 2);
}

function buildNextStepResponse(profile: ZoraLeadProfile) {
  if (profile.hasNoWebsite) {
    return "Since there is no site to audit yet, the best next step is a strategy call to map the landing page, offer, and follow-up system.";
  }

  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    if (profile.funnelStage === "Product pages" && profile.productScope === "All products") {
      return "Here's the likely fix path:\n1. Review the mobile product-page template first.\n2. Check image hierarchy, variant selection, reviews, shipping/returns visibility, and sticky add-to-cart behavior.\n3. Compare top product pages against add-to-cart and checkout-start data.\n4. Run the free audit to confirm where the friction is visible on the actual page.\n5. Then decide whether this is a quick UX cleanup or a theme/template improvement.";
    }

    if (profile.dropoffDetail === "One product cart") {
      return "High-level recommendation: start with the first-product purchase path. I would check whether the product page and cart answer the first buyer objections before checkout: shipping cost and timing, return reassurance, reviews, price confidence, variant clarity, and whether the cart introduces a surprise. Then validate tracking from product view to add-to-cart to checkout-start so the team can see where intent drops.";
    }

    if (profile.funnelStage === "Checkout" || profile.funnelStage === "Cart") {
      return "High-level recommendation: focus on checkout confidence before adding more traffic. I would review cart clarity, shipping/tax surprise, payment options, guest checkout friction, delivery/returns reassurance, and checkout-step tracking. The goal is to separate true checkout friction from tracking noise before deciding what to rebuild.";
    }
  }

  if (hasSufficientQualification(profile)) {
    const nextStep =
      profile.websiteUrl || profile.recommendedNextStep === "free_audit"
        ? "the free audit so we can review the actual site path"
        : "a strategy call so we can map scope and priorities";

    return `Great. The next best step is ${nextStep}. Want to start there or book a strategy call?`;
  }

  return "Great. What type of business are we looking at?";
}

function buildFocusResponse(profile: ZoraLeadProfile) {
  if (hasProfileDiagnosisSignal(profile)) {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  return "I can help prioritize that, but I need one more detail first: what type of business is this for?";
}

function buildFunnelStageResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Ecommerce" || profile.challenge !== "Conversion") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.funnelStage) {
    case "Checkout":
      return "That narrows it. If shoppers are dropping during checkout, I would check shipping or tax surprise, payment options, guest checkout friction, error states, delivery/returns reassurance, and whether tracking captures each checkout step. Quick question: is the biggest drop at cart, shipping, payment, or after an error?";
    case "Product pages":
      return "That narrows it. If product pages are the drop-off point, I would check product-page clarity, variant selection, image/video quality, reviews, shipping/returns visibility, price confidence, and whether the add-to-cart path is obvious on mobile. Quick question: is this happening across all products or mostly on a few high-traffic products?";
    case "Cart":
      return "That narrows it. If the cart is where intent stalls, I would check discount-code behavior, shipping visibility, trust cues, cart edits, checkout CTA clarity, and whether shoppers are being surprised before checkout. Quick question: do shoppers abandon after adding one product, or after building a larger cart?";
    case "Before product pages":
      return "That narrows it. If visitors drop before product pages, I would check navigation, collection/category clarity, search, merchandising, offer positioning, and whether traffic is landing on the right page for its intent. Quick question: are visitors entering through ads, search, email, or the homepage?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildDropoffDetailResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Ecommerce" || profile.challenge !== "Conversion") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.dropoffDetail) {
    case "One product cart":
      return "That is useful. If shoppers abandon after adding one product, I would check whether the first product feels complete enough to buy: shipping cost/timing, return reassurance, reviews, price confidence, variant clarity, and whether the cart introduces a surprise before checkout. Quick question: do you show shipping or delivery expectations before the cart?";
    case "Larger cart":
      return "That points to order-building friction. I would check cart editing, bundles or thresholds, shipping incentives, discount behavior, and whether shoppers can easily keep shopping without losing cart context. Quick question: do shoppers usually build carts from search, collections, or product recommendations?";
    case "Shipping step":
      return "If the drop is at shipping, I would check cost surprise, delivery timing, address friction, pickup options, and whether shipping expectations were visible before checkout. Quick question: is shipping free, flat-rate, or calculated at checkout?";
    case "Payment step":
      return "If the drop is at payment, I would check payment options, wallet availability, card errors, trust cues, and whether tax or fees appear too late. Quick question: do you offer express checkout like Shop Pay, Apple Pay, or PayPal?";
    case "Checkout error":
      return "If errors are part of the drop, I would verify checkout event tracking, form validation, payment failures, app conflicts, and whether users can recover without restarting. Quick question: are you seeing error reports, failed payment events, or just analytics drop-off?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildProductScopeResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Ecommerce" || profile.challenge !== "Conversion") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.productScope) {
    case "All products":
      return "That points to a sitewide product-page template issue, not just one weak SKU. I would check the shared product-page layout: headline clarity, image hierarchy, variant selection, review placement, shipping/returns reassurance, sticky add-to-cart behavior on mobile, and whether key buying objections are answered before the CTA. Quick question: are most of your visitors on mobile?";
    case "Few high-traffic products":
      return "That points to a priority-product issue. I would start with the highest-traffic products and compare their images, offer clarity, reviews, price confidence, variant selection, and add-to-cart behavior against better-performing products. Quick question: do those products have enough reviews or social proof?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildMobileProductPageAffirmationResponse() {
  return "That makes mobile product-page friction the priority. I would check sticky add-to-cart behavior, image hierarchy, variant selection, reviews, shipping/returns visibility, and whether the first buying objections are answered before the CTA. Quick question: do you want me to talk through the likely fix path?";
}

function buildCartBuildSourceResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Ecommerce" || profile.challenge !== "Conversion") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.cartBuildSource) {
    case "Unknown":
      return "That is okay. If the source is unclear, I would first make sure analytics can separate cart entrants by source: search, collections, product recommendations, email, and paid traffic. Without that split, cart abandonment can look like one issue when different paths are leaking differently. Quick question: do you have GA4 or Shopify analytics showing add-to-cart and checkout-start events by traffic source?";
    case "Search":
      return "If larger carts are built from search, I would check search result quality, product availability, filters, and whether shoppers can compare items without losing context. Quick question: are search users adding related products or repeatedly changing queries?";
    case "Collections":
      return "If larger carts are built from collections, I would check collection sorting, product-card clarity, quick-add behavior, and whether shoppers can understand shipping thresholds before cart. Quick question: do your collections clearly show price, variants, inventory, and delivery expectations?";
    case "Product recommendations":
      return "If larger carts come from recommendations, I would check whether upsells feel relevant, whether bundles are clear, and whether recommendations create confidence or overwhelm. Quick question: are recommendations manually curated or app-generated?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildShippingPricingResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Ecommerce" || profile.challenge !== "Conversion") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.shippingPricing) {
    case "Calculated at checkout":
      return "That is a strong checkout-friction candidate. Calculated shipping can create a late surprise, especially if shoppers only learn the final cost after they have already built intent. I would test showing delivery expectations, free-shipping thresholds, or estimated shipping earlier on product/cart pages. Quick question: do you know whether shipping cost appears before checkout starts or only after address entry?";
    case "Flat-rate shipping":
      return "Flat-rate shipping is easier to message, so I would check whether the rate is visible before cart and whether it feels proportional to the product price. Quick question: is the flat rate shown on product pages or only in checkout?";
    case "Free shipping":
      return "If shipping is free, the checkout drop may be less about cost and more about payment trust, delivery timing, account friction, or errors. Quick question: do shoppers see delivery timing and return reassurance before payment?";
    case "Unknown":
      return "If shipping setup is unclear, I would verify exactly when shoppers first see cost and timing. Late shipping uncertainty is one of the easiest ways to lose checkout intent. Quick question: can you see shipping-step abandonment in Shopify or GA4?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildRecommendationSetupResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Ecommerce" || profile.challenge !== "Conversion") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.recommendationSetup) {
    case "Manually curated":
      return "That helps. If related products are manually curated and larger carts still stall, I would check whether those add-ons feel essential, whether bundles or thresholds are clearer than separate add-ons, and whether the cart makes the total value feel worth completing. Quick question: do those larger carts usually include complementary items, replacements, or accessories?";
    case "App-generated":
      return "If recommendations are app-generated, I would check relevance rules, duplicate or low-margin suggestions, load speed, mobile placement, and whether the app is pushing too many choices near cart. Quick question: can you control recommendation rules by collection, product type, or margin?";
    case "Mixed":
      return "If recommendations are partly curated and partly automated, I would compare the paths separately. Manual sets should clarify the offer; automated sets should improve relevance without adding noise. Quick question: do curated recommendations convert better than the app-generated ones?";
    case "Unknown":
      return "If the recommendation setup is unclear, I would first identify which products are being suggested, where they appear, and whether shoppers interact with them before abandoning. Quick question: can you see recommendation clicks or add-to-cart events in Shopify, GA4, or the recommendation app?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildLeadDestinationResponse(profile: ZoraLeadProfile) {
  if (profile.businessType !== "Service Business" || profile.challenge !== "Follow-up") {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.leadDestination) {
    case "CRM":
      return "Good, so the lead is being captured. The likely gap is speed-to-lead inside the CRM: assignment rules, notification channel, SLA timers, missed-lead alerts, and whether someone can book or respond from mobile. Quick question: does the CRM notify the right person immediately by SMS/app, or mostly by email?";
    case "Email inbox":
      return "If leads land in an inbox, I would check ownership, response-time expectations, auto-replies, lead tagging, and whether urgent requests get routed differently from general questions. Quick question: is one person responsible for replying, or does the team share the inbox?";
    case "Spreadsheet":
      return "If leads end up in a spreadsheet, follow-up usually depends too much on manual checking. I would look at form-to-CRM routing, instant alerts, status tracking, and reminders for unreplied leads. Quick question: how often does someone check or update that sheet?";
    case "Unstructured":
      return "If leads are not landing somewhere structured, I would fix capture and routing before adding more lead volume. The first move is a clear intake path, instant owner notification, and a simple status pipeline. Quick question: are leads mostly coming from forms, calls, texts, or booking requests?";
    case "Unknown":
      return "That is worth clarifying first. For follow-up problems, the first diagnostic step is mapping exactly where a new inquiry appears and who gets notified. Quick question: can someone on the team see every new lead in one place?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function buildNotificationChannelResponse(profile: ZoraLeadProfile) {
  if (
    profile.businessType !== "Service Business" ||
    profile.challenge !== "Follow-up" ||
    profile.leadDestination !== "CRM"
  ) {
    return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }

  switch (profile.notificationChannel) {
    case "Email":
      return "That is likely part of the slowdown. Email-only CRM alerts are easy to miss when the team is in the field, between jobs, or handling calls. I would check SMS/app alerts, lead-owner assignment, response-time rules, and missed-lead reminders. Quick question: does one person own each new lead, or does the whole team see the same notification?";
    case "SMS/app":
      return "That is better for speed-to-lead, so I would check whether ownership and reminders are clear after the alert fires. Fast notification helps, but dropped follow-up often comes from unclear assignment or no second reminder. Quick question: is every lead assigned to one person automatically?";
    case "Both":
      return "Having both email and SMS/app alerts is a good start. I would check whether the CRM tracks who responded, how fast they responded, and which leads are still untouched after a few minutes. Quick question: do you have a missed-lead or no-response alert?";
    case "None":
      return "That explains the bottleneck. If the CRM captures leads but does not notify anyone clearly, response speed will depend on someone checking manually. I would start with instant owner alerts, a backup alert, and a simple missed-lead rule. Quick question: who should own the first response: dispatcher, office admin, sales rep, or owner?";
    case "Unknown":
      return "That is worth checking first. In a follow-up bottleneck, the fastest diagnostic is confirming exactly who gets alerted, how they get alerted, and what happens if they do not respond. Quick question: can someone see a timestamp for when each lead arrived and when the first reply happened?";
    default:
      return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
  }
}

function actionsForIntent(
  intent: ZoraIntent,
  hasDiagnosis: boolean,
  profile: ZoraLeadProfile,
  repeatedSoftClose = false,
) {
  if (profile.needsBusinessTypeClarification) {
    return [] as ZoraResponse["recommendedActions"];
  }

  if (profile.hasNoWebsite && intent !== "out_of_scope") {
    return ["strategy_call"] as ZoraResponse["recommendedActions"];
  }

  if (intent === "thanks") {
    if (repeatedSoftClose) {
      return [] as ZoraResponse["recommendedActions"];
    }

    return ["free_audit", "strategy_call"] as ZoraResponse["recommendedActions"];
  }

  if ((intent === "pricing" || intent === "timeline") && profile.recommendationRoadmap?.length) {
    return [] as ZoraResponse["recommendedActions"];
  }

  if (intent === "audit_request") {
    if (profile.hasNoWebsite) return ["strategy_call"] as ZoraResponse["recommendedActions"];
    if (profile.websiteUrl) return ["free_audit"] as ZoraResponse["recommendedActions"];
    return [] as ZoraResponse["recommendedActions"];
  }
  if (intent === "booking_request") return ["strategy_call"] as ZoraResponse["recommendedActions"];
  if (intent === "recommendation" && hasSufficientQualification(profile)) {
    return ["free_audit", "strategy_call"] as ZoraResponse["recommendedActions"];
  }
  if (intent === "consultant") {
    if (profile.challenge === "Website") {
      return ["strategy_call"] as ZoraResponse["recommendedActions"];
    }

    if (profile.websiteUrl && hasSufficientQualification(profile)) {
      return ["free_audit"] as ZoraResponse["recommendedActions"];
    }
    return [] as ZoraResponse["recommendedActions"];
  }
  if (intent === "next_step" && hasSufficientQualification(profile)) {
    return ["free_audit", "strategy_call"] as ZoraResponse["recommendedActions"];
  }
  if (intent === "focus_request") return [] as ZoraResponse["recommendedActions"];
  if (intent === "diagnosis" && hasDiagnosis) return [] as ZoraResponse["recommendedActions"];
  if (intent === "out_of_scope") return [] as ZoraResponse["recommendedActions"];
  return ["diagnose"] as ZoraResponse["recommendedActions"];
}

export function buildZoraResponse(
  message: string,
  currentProfile: ZoraLeadProfile = {},
): ZoraResponse {
  const analysis = applyProfileContextToAnalysis(
    analyzeZoraMessage(message),
    currentProfile,
  );
  const { leadProfile, profileChanges } = mergeLeadProfile(currentProfile, analysis);
  const shouldResumeRecommendationThread = isResumeRecommendationThreadRequest(message);
  if (
    (analysis.intent === "recommendation" || shouldResumeRecommendationThread) &&
    hasProfileDiagnosisSignal(leadProfile)
  ) {
    leadProfile.recommendationRoadmap = buildRecommendationRoadmap(leadProfile);
  }
  const shouldContinueMomentum =
    isMomentumAcknowledgmentMessage(message) &&
    hasProfileDiagnosisSignal(leadProfile) &&
    !leadProfile.needsBusinessTypeClarification;
  const activeTopic = analysis.currentTopic || leadProfile.currentTopic;
  const shouldContinueTopic =
    Boolean(activeTopic) &&
    hasProfileDiagnosisSignal(leadProfile) &&
    (Boolean(analysis.currentTopic) || isTopicContinuationMessage(message)) &&
    !leadProfile.needsBusinessTypeClarification;
  const effectiveIntent: ZoraIntent =
    shouldContinueTopic || shouldContinueMomentum
      ? "diagnosis"
      : shouldResumeRecommendationThread && leadProfile.recommendationRoadmap?.length
      ? "recommendation"
      : analysis.intent;
  const effectiveDiagnosisProfile = leadProfile;
  const businessTypeSwitched = Boolean(
    currentProfile.businessType &&
      analysis.businessType &&
      currentProfile.businessType !== analysis.businessType,
  );
  const hasDiagnosis =
    shouldContinueTopic ||
    shouldContinueMomentum ||
    hasDiagnosisSignal(analysis) ||
    ((analysis.intent === "diagnosis" ||
      analysis.intent === "clarify" ||
      analysis.intent === "next_step") &&
      hasProfileDiagnosisSignal(leadProfile));
  const hasNewFunnelStage = Boolean(analysis.funnelStage);
  const hasNewDropoffDetail = Boolean(analysis.dropoffDetail);
  const hasNewProductScope = Boolean(analysis.productScope);
  const hasNewCartBuildSource = Boolean(analysis.cartBuildSource);
  const hasNewShippingPricing = Boolean(analysis.shippingPricing);
  const hasNewRecommendationSetup = Boolean(analysis.recommendationSetup);
  const hasNewLeadDestination = Boolean(analysis.leadDestination);
  const hasNewNotificationChannel = Boolean(analysis.notificationChannel);
  const mobileProductPageAffirmation =
    leadProfile.businessType === "Ecommerce" &&
    leadProfile.challenge === "Conversion" &&
    leadProfile.funnelStage === "Product pages" &&
    leadProfile.productScope === "All products" &&
    isAffirmativeAnswer(message);
  if (shouldContinueTopic && activeTopic && !analysis.currentTopic) {
    const nextDepth =
      currentProfile.currentTopic === activeTopic
        ? (currentProfile.currentTopicDepth || 1) + 1
        : 1;
    addChange(profileChanges, "currentTopicDepth", leadProfile.currentTopicDepth, nextDepth);
    leadProfile.currentTopic = activeTopic;
    leadProfile.currentTopicDepth = nextDepth;
  }
  const repeatedSoftClose =
    effectiveIntent === "thanks" &&
    (Boolean(currentProfile.hasSeenSoftClose) || isCasualAcknowledgmentMessage(message));
  const reply =
    effectiveIntent === "out_of_scope"
      ? buildOutOfScopeResponse()
      : effectiveIntent === "thanks"
        ? buildThanksResponse(leadProfile, repeatedSoftClose)
        : effectiveIntent === "timeline"
          ? buildTimelineResponse(leadProfile, message)
          : effectiveIntent === "pricing"
            ? buildPricingResponse(leadProfile, message)
            : effectiveIntent === "capability"
              ? buildCapabilityResponse(leadProfile)
              : effectiveIntent === "small_talk"
                ? buildSmallTalkResponse(leadProfile)
                : effectiveIntent === "audit_request"
                  ? buildAuditRequestResponse(leadProfile)
                  : effectiveIntent === "booking_request"
                    ? buildBookingRequestResponse(leadProfile)
                    : effectiveIntent === "recommendation"
                      ? buildRecommendationResponse(leadProfile)
                    : effectiveIntent === "consultant"
                      ? buildConsultantResponse(leadProfile, message)
                    : shouldContinueTopic && activeTopic
                      ? buildTopicResponse(leadProfile, activeTopic)
                    : shouldContinueMomentum
                      ? buildMomentumResponse(leadProfile)
                    : leadProfile.needsBusinessTypeClarification
                      ? buildBusinessTypeMismatchResponse(leadProfile)
                    : analysis.hasNoWebsite
                      ? buildNoWebsiteResponse()
                    : businessTypeSwitched
                      ? buildContextSwitchResponse(leadProfile)
                      : effectiveIntent === "next_step"
                        ? buildNextStepResponse(leadProfile)
                        : effectiveIntent === "focus_request"
                        ? buildFocusResponse(leadProfile)
                        : hasNewDropoffDetail
                            ? buildDropoffDetailResponse(leadProfile)
                          : hasNewCartBuildSource
                            ? buildCartBuildSourceResponse(leadProfile)
                          : hasNewShippingPricing
                            ? buildShippingPricingResponse(leadProfile)
                          : hasNewRecommendationSetup
                            ? buildRecommendationSetupResponse(leadProfile)
                          : hasNewLeadDestination
                            ? buildLeadDestinationResponse(leadProfile)
                          : hasNewNotificationChannel
                            ? buildNotificationChannelResponse(leadProfile)
                          : hasNewProductScope
                            ? buildProductScopeResponse(leadProfile)
                          : hasNewFunnelStage
                            ? buildFunnelStageResponse(leadProfile)
                          : mobileProductPageAffirmation
                            ? buildMobileProductPageAffirmationResponse()
                          : hasDiagnosis
                            ? `${buildZoraDiagnosis(effectiveDiagnosisProfile)} ${followUpQuestion(effectiveDiagnosisProfile)}`
                            : analysis.websiteUrl
                              ? buildWebsiteCapturedWithMemoryResponse(leadProfile)
                              : buildClarifyingResponse();

  if (effectiveIntent === "thanks" && !leadProfile.hasSeenSoftClose) {
    profileChanges.push("hasSeenSoftClose: undefined -> true");
    leadProfile.hasSeenSoftClose = true;
  }

  return {
    reply,
    leadProfile,
    currentMessageAnalysis: analysis,
    confidenceScore: analysis.confidenceScore,
    profileChanges,
    responseMode: effectiveIntent,
    recommendedActions: actionsForIntent(
      effectiveIntent,
      hasDiagnosis,
      leadProfile,
      repeatedSoftClose,
    ),
  };
}
