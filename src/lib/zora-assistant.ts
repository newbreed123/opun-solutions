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
  | "Website";

export type ZoraRevenueRange = "Under $100k" | "$100k-$1M" | "$1M+";

export type ZoraLeadQuality = "low" | "medium" | "high";

export type ZoraNextStep = "free_audit" | "strategy_call" | "ask_question";

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
  email?: string;
  recommendedNextStep?: ZoraNextStep;
  recommendedFocusAreas?: string[];
  leadQuality?: ZoraLeadQuality;
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
  recommendedActions: Array<"free_audit" | "strategy_call" | "diagnose">;
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

function isCapabilityQuestion(message: string) {
  return /\b(how can you help|what can you do|what do you do|what does opzix do|tell me more about opzix|more about opzix|about opzix|who is opzix|what is opzix|how does this work|your services|services do you offer)\b/i.test(
    message,
  );
}

function isSmallTalkQuestion(message: string) {
  return /\b(how are you|how's it going|how is it going|what's up|whats up|hello|hi zora|hey zora|hi\b|hey\b|good morning|good afternoon|good evening)\b/i.test(
    message,
  );
}

function isThanksMessage(message: string) {
  return /\b(thank you|thanks|thx|appreciate it|appreciate you|got it|okay thanks|ok thanks)\b/i.test(
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

function isEcommerceBuildQuestion(message: string) {
  return /\b(ecommerce website|e-commerce website|online store|shopify store|storefront|commerce site)\b/i.test(
    message,
  );
}

function isAuditRequest(message: string) {
  return /\b(audit my website|audit my site|run an audit|free audit|scan my website|scan my site|website audit|check (?:the )?site path|review (?:the )?site path|look at (?:the )?site path|check (?:my )?site|review (?:my )?site)\b/i.test(
    message,
  );
}

function isBookingRequest(message: string) {
  return /\b(book|strategy call|schedule|calendly|talk to someone|speak with)\b/i.test(
    message,
  );
}

function isNextStepRequest(message: string) {
  return /\b(sounds good|what next|next step|next steps|help me|let's do it|lets do it|i'm ready|im ready|start there|do it)\b/i.test(
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
  if (/\bbefore\s+(product|product pages?)|category pages?|collection pages?|landing page\b/i.test(text)) {
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
  if (/\bone product|single product|one item|1 product|1 item\b/i.test(text)) {
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
  if (/\bads?|paid traffic|google ads|facebook ads|meta ads\b/i.test(text)) return "Ads";
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
  const challenge =
    outOfScope || (websiteUrl && isWebsiteCaptureMessage(message))
      ? undefined
      : firstMatch(message, challengePatterns);
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
  const leadSource = outOfScope ? undefined : extractLeadSource(message);
  const intent: ZoraIntent = outOfScope
    ? "out_of_scope"
    : isThanksMessage(message)
      ? "thanks"
      : isSmallTalkQuestion(message)
        ? "small_talk"
        : isCapabilityQuestion(message)
          ? "capability"
          : isAuditRequest(message)
            ? "audit_request"
            : isBookingRequest(message)
              ? "booking_request"
              : isFocusRequest(message)
                ? "focus_request"
                : isNextStepRequest(message)
                  ? "next_step"
                  : isTimelineQuestion(message)
                    ? "timeline"
                    : isPricingQuestion(message)
                      ? "pricing"
                      : businessType || challenge || platform || revenue.revenueRange || websiteUrl || funnelStage
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
    addChange(changes, "challenge", nextProfile.challenge, analysis.challenge);
    nextProfile.challenge = analysis.challenge;
  }

  if (analysis.websiteUrl) {
    addChange(changes, "websiteUrl", nextProfile.websiteUrl, analysis.websiteUrl);
    nextProfile.websiteUrl = analysis.websiteUrl;
  }

  if (analysis.email) {
    addChange(changes, "email", nextProfile.email, analysis.email);
    nextProfile.email = analysis.email;
  }

  nextProfile.recommendedNextStep = recommendZoraNextStep(nextProfile);
  nextProfile.recommendedFocusAreas = focusAreas(nextProfile);
  nextProfile.leadQuality = scoreZoraLeadQuality(nextProfile);

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

function greetingPrefix(profile: ZoraLeadProfile) {
  return profile.visitorName ? `Nice to meet you, ${profile.visitorName}. ` : "";
}

function buildCapabilityResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}Opzix builds growth systems for businesses that need their website, ecommerce, automation, tracking, follow-up, and operations to work together. That can include websites, ecommerce systems, AI assistants, dashboards, integrations, lead generation systems, and audit-based implementation roadmaps. Want me to diagnose your growth system or point you to the free audit?`;
}

function buildSmallTalkResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}I'm doing well, thanks for asking. I'm here to help you spot growth bottlenecks across traffic, conversion, operations, tracking, follow-up, and your website. Want to diagnose your growth system, run the free audit, or ask me a specific question?`;
}

function buildThanksResponse(profile: ZoraLeadProfile) {
  return `${profile.visitorName ? `You're welcome, ${profile.visitorName}.` : "You're welcome."} If you want to go deeper, I can help diagnose your growth system, point you to the free audit, or help you book a strategy call.`;
}

function buildTimelineResponse(profile: ZoraLeadProfile, message: string) {
  if (isEcommerceBuildQuestion(message)) {
    return `${greetingPrefix(profile)}A focused ecommerce website can often launch in 3-6 weeks, while a more custom ecommerce system with product structure, integrations, tracking, automation, or migration work can take 6-12+ weeks. The real timeline depends on catalog complexity, content readiness, platform access, payment/shipping setup, and how much backend workflow needs to be connected. Want me to help scope the right path?`;
  }

  return `${greetingPrefix(profile)}Focused improvements can often take 1-3 weeks. Larger websites, ecommerce systems, AI assistants, automation workflows, dashboards, or integrations can take several weeks or longer depending on scope, access, content, and testing. Want me to help scope the right path?`;
}

function buildPricingResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}Opzix uses directional planning ranges rather than fixed quotes inside chat. Focused improvements can start in the low thousands, while larger websites, ecommerce systems, AI assistants, automations, dashboards, and integrations depend on scope, platform access, and complexity. Want me to diagnose the likely scope?`;
}

function buildClarifyingResponse() {
  return "I can help with that. To give a useful recommendation, tell me what kind of business you run and what feels stuck: traffic, conversion, operations, tracking, follow-up, or the website itself.";
}

function buildWebsiteCapturedResponse(analysis: ZoraMessageAnalysis) {
  return `Got it, I have ${analysis.websiteUrl}. What type of business is this for, and what feels stuck right now?`;
}

function buildWebsiteCapturedWithMemoryResponse(profile: ZoraLeadProfile) {
  if (profile.businessType && profile.challenge) {
    return `Got it, I have ${profile.websiteUrl}. Since this is ${businessContextLabel(profile.businessType)} and the issue is ${profile.challenge.toLowerCase()}, the next useful step is to look at the actual site path before guessing further.`;
  }

  if (profile.businessType) {
    return `Got it, I have ${profile.websiteUrl}. What feels like the biggest bottleneck right now: traffic, conversion, operations, tracking, follow-up, or the website?`;
  }

  return `Got it, I have ${profile.websiteUrl}. What type of business is this for, and what feels stuck right now?`;
}

function buildOutOfScopeResponse() {
  return "I probably cannot help with that directly. Opzix focuses on websites, ecommerce, AI assistants, automation, tracking, follow-up, dashboards, integrations, and lead generation systems. If the issue is about your business website or customer journey, I can help diagnose that.";
}

function buildAuditRequestResponse(profile: ZoraLeadProfile) {
  if (profile.businessType || profile.challenge || profile.platform) {
    const focus = joinList(focusAreas(profile));
    const business = profile.businessType
      ? businessContextLabel(profile.businessType)
      : "your website";

    return `Yes. Since the issue is tied to ${business}, the audit should focus on ${focus}. The scanner can review the actual site and generate a more detailed roadmap.`;
  }

  return "Yes. Zora does not run the full scanner inside chat, but the free audit scanner can review your actual website and generate a more detailed roadmap.";
}

function buildBookingRequestResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}A strategy call is the best next step if you want help deciding what to fix first and what scope makes sense.`;
}

function followUpQuestion(profile: ZoraLeadProfile) {
  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    return "Are most visitors dropping before product pages, on product pages, or during checkout?";
  }

  if (profile.businessType === "Real Estate") {
    return "Are you currently getting seller leads from ads, referrals, organic search, or social?";
  }

  if (profile.businessType === "Care/Healthcare") {
    return "Are most inquiries coming from families, referral partners, or waiver-related searches?";
  }

  if (profile.businessType === "Service Business" && profile.challenge === "Follow-up") {
    return "Do leads currently go into a CRM, email inbox, spreadsheet, or nowhere structured?";
  }

  if (!profile.businessType) {
    return "Quick question: what type of business is this for?";
  }

  if (!profile.challenge) {
    return "Quick question: what feels like the biggest bottleneck right now: traffic, conversion, operations, tracking, follow-up, or the website?";
  }

  if (!profile.websiteUrl) {
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
      nonGenericChallenge,
  );
}

function hasProfileDiagnosisSignal(profile: ZoraLeadProfile) {
  return Boolean(
    profile.businessType &&
      (profile.challenge ||
        profile.desiredOutcome ||
        profile.conversionRate ||
        profile.websiteUrl),
  );
}

function qualificationCount(profile: ZoraLeadProfile) {
  return [
    profile.businessType,
    profile.challenge,
    profile.websiteUrl,
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
) {
  if (intent === "audit_request") return ["free_audit"] as ZoraResponse["recommendedActions"];
  if (intent === "booking_request") return ["strategy_call"] as ZoraResponse["recommendedActions"];
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
  const effectiveDiagnosisProfile = leadProfile;
  const hasDiagnosis =
    hasDiagnosisSignal(analysis) ||
    ((analysis.intent === "clarify" || analysis.intent === "next_step") &&
      hasProfileDiagnosisSignal(leadProfile));
  const hasNewFunnelStage = Boolean(analysis.funnelStage);
  const hasNewDropoffDetail = Boolean(analysis.dropoffDetail);
  const hasNewProductScope = Boolean(analysis.productScope);
  const hasNewCartBuildSource = Boolean(analysis.cartBuildSource);
  const hasNewShippingPricing = Boolean(analysis.shippingPricing);
  const hasNewRecommendationSetup = Boolean(analysis.recommendationSetup);
  const hasNewLeadDestination = Boolean(analysis.leadDestination);
  const hasNewNotificationChannel = Boolean(analysis.notificationChannel);
  const reply =
    analysis.intent === "out_of_scope"
      ? buildOutOfScopeResponse()
      : analysis.intent === "thanks"
        ? buildThanksResponse(leadProfile)
        : analysis.intent === "timeline"
          ? buildTimelineResponse(leadProfile, message)
          : analysis.intent === "pricing"
            ? buildPricingResponse(leadProfile)
            : analysis.intent === "capability"
              ? buildCapabilityResponse(leadProfile)
              : analysis.intent === "small_talk"
                ? buildSmallTalkResponse(leadProfile)
                : analysis.intent === "audit_request"
                  ? buildAuditRequestResponse(leadProfile)
                  : analysis.intent === "booking_request"
                    ? buildBookingRequestResponse(leadProfile)
                    : analysis.intent === "next_step"
                      ? buildNextStepResponse(leadProfile)
                      : analysis.intent === "focus_request"
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
                          : hasDiagnosis
                            ? `${buildZoraDiagnosis(effectiveDiagnosisProfile)} ${followUpQuestion(effectiveDiagnosisProfile)}`
                            : analysis.websiteUrl
                              ? buildWebsiteCapturedWithMemoryResponse(leadProfile)
                              : buildClarifyingResponse();

  return {
    reply,
    leadProfile,
    currentMessageAnalysis: analysis,
    confidenceScore: analysis.confidenceScore,
    profileChanges,
    responseMode: analysis.intent,
    recommendedActions: actionsForIntent(analysis.intent, hasDiagnosis, leadProfile),
  };
}
