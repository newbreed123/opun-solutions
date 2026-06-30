import {
  detectZoraIndustry,
  type ZoraIndustry,
  type ZoraIndustryProfile,
} from "@/lib/zora-industry-awareness";
import { OPZIX_COMPANY_PROFILE } from "@/lib/opzix-company-profile";
import {
  buildConsultingExperienceAnswer,
  isConsultingExperienceQuestion,
} from "@/lib/zora-consulting-knowledge";
import {
  detectZoraActionIntent,
  type ZoraActionIntent,
} from "@/lib/zora-action-intent";
import {
  buildOpzixBrainAnswer,
  buildOpzixBrainLowConfidenceFallback,
  detectOpzixBrainConcept,
  type ConceptDetectionResult,
  type OpzixBrainConcept,
  type OpzixBrainIndustry,
} from "@/lib/opzix-brain";
import {
  buildOpzixOfferAnswer,
  buildOpzixProductLineAnswer,
  detectOpzixOfferIntent,
  isOpzixOfferFollowUp,
  isOpzixProductLineQuestion,
  type OpzixOfferAnswer,
} from "@/lib/detect-opzix-offer";
import { isOpzixOfferKey, type OpzixOfferKey } from "@/lib/opzix-offers";

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

export type ZoraTrafficIntentCategory =
  | "conversion_rate_optimization"
  | "website_rebuild"
  | "ai_automation_crm";

export type ZoraAdContext = {
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
};

export type ZoraConversationStage =
  | "qualification"
  | "diagnosis"
  | "deep_dive"
  | "recommendation"
  | "next_step"
  | "handoff";

export type ZoraTopic =
  | "offer_clarity"
  | "tracking_visibility"
  | "follow_up_handoff"
  | "landing_page"
  | "booking_flow"
  | "product_discovery"
  | "checkout_confidence"
  | "crm_routing"
  | "lead_capture"
  | OpzixOfferKey;

export type ZoraTalkingPoint =
  | "offer_clarity"
  | "conversion_path"
  | "product_discovery"
  | "trust_signals"
  | "mobile_ux"
  | "tracking_visibility"
  | "analytics_dashboard"
  | "follow_up_handoff"
  | "follow_up_speed"
  | "booking_flow"
  | "crm_routing"
  | "lead_capture"
  | "ai_assistant"
  | "backend_integrations"
  | "support_ticket_flow"
  | "email_sms_automation"
  | "ads_readiness"
  | "website_rebuild"
  | "operations_workflow"
  | "ecommerce_cost_analysis"
  | "audit_process"
  | OpzixOfferKey;

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

export type ZoraIndustryStatus = "inferred" | "needs_clarification" | "confirmed";

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

export type ZoraCompanyBackgroundSubtype =
  | "owner"
  | "ceo"
  | "founder"
  | "legitimacy"
  | "what_is_opzix"
  | "who_are_you"
  | "general_company";

export type ZoraCompanyBackgroundIntent = {
  isCompanyBackgroundQuestion: boolean;
  subtype: ZoraCompanyBackgroundSubtype;
  confidence: "High" | "Moderate" | "Low";
};

export type ZoraFounderFollowupSubtype = "identity" | "background" | "experience" | "role";

export type ZoraFounderFollowupIntent = {
  isFounderFollowup: boolean;
  subtype: ZoraFounderFollowupSubtype;
  confidence: "High" | "Moderate" | "Low";
};

export type ZoraTerminologyTerm =
  | "dtc_store"
  | "audit"
  | "product_discovery"
  | "checkout_trust"
  | "tracking_visibility"
  | "crm_routing"
  | "conversion_path";

export type ZoraIntent =
  | "diagnosis"
  | "business_model_correction"
  | "company_background"
  | "terminology"
  | "action_request"
  | "capability"
  | "small_talk"
  | "thanks"
  | "acknowledgement"
  | "timeline"
  | "pricing"
  | "scanner_execute"
  | "scanner_failure"
  | "trust_skepticism"
  | "handoff"
  | "audit_request"
  | "review_request"
  | "booking_request"
  | "offer_catalog"
  | "consulting_concept"
  | "recommendation"
  | "consultant"
  | "focus_request"
  | "next_step"
  | "out_of_scope"
  | "clarify";

export type ZoraAssistantMode =
  | "high_level_recommendation"
  | "diagnosis"
  | "cta_prompt"
  | "scanner_execution"
  | "company_background"
  | "other";

export type ZoraLeadProfile = {
  visitorName?: string;
  businessType?: ZoraBusinessType;
  platform?: string;
  trafficIntentCategory?: ZoraTrafficIntentCategory;
  trafficIntentText?: string;
  adContext?: ZoraAdContext;
  industry?: ZoraIndustry | string;
  confirmedIndustry?: string;
  industryProfile?: ZoraIndustryProfile;
  industryEvidence?: string[];
  buyerJourney?: string;
  primaryBottlenecks?: string[];
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
  inferredIndustry?: string | null;
  inferredBusinessModel?: string | null;
  inferredFunnelType?: string | null;
  industryConfidence?: number | ZoraIndustryProfile["confidence"];
  industryStatus?: ZoraIndustryStatus;
  userCorrectedIndustry?: boolean;
  needsBusinessTypeClarification?: boolean;
  industryMismatchResolved?: boolean;
  businessModelCorrection?: string;
  hasWebsiteOrLandingPage?: boolean;
  hasNoWebsite?: boolean;
  scannerBlocked?: boolean;
  scannerBlockedReason?: string;
  email?: string;
  recommendedNextStep?: ZoraNextStep;
  recommendedFocusAreas?: string[];
  recommendationRoadmap?: ZoraRoadmapStep[];
  conversationStage?: ZoraConversationStage;
  currentTopic?: ZoraTopic;
  currentSubtopic?: string;
  detectedConcept?: OpzixBrainConcept;
  conceptConfidence?: ConceptDetectionResult["confidence"];
  conceptMatchedTerms?: string[];
  lastMentionedOffer?: OpzixOfferKey;
  currentTopicDepth?: number;
  recentTalkingPoints?: ZoraTalkingPoint[];
  leadQuality?: ZoraLeadQuality;
  leadTemperature?: ZoraLeadTemperature;
  leadScore?: number;
  hasSeenSoftClose?: boolean;
  lastUserCommand?: string;
  lastAssistantIntent?: ZoraIntent;
  lastAssistantMode?: ZoraAssistantMode;
  lastAssistantMessageSummary?: string;
  duplicateCommandCount?: number;
  postRecommendationAckCount?: number;
};

export type ZoraMessageAnalysis = {
  intent: ZoraIntent;
  rawMessage?: string;
  companyBackgroundSubtype?: ZoraCompanyBackgroundSubtype;
  founderFollowupSubtype?: ZoraFounderFollowupSubtype;
  terminologyTerm?: ZoraTerminologyTerm;
  actionIntent?: ZoraActionIntent;
  visitorName?: string;
  businessType?: ZoraBusinessType;
  platform?: string;
  industry?: string;
  correctedIndustry?: ZoraIndustry;
  correctedBusinessModel?: string;
  confirmedIndustry?: string;
  industryStatus?: ZoraIndustryStatus;
  userCorrectedIndustry?: boolean;
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
  offerKey?: OpzixOfferKey;
  offerMatchedTerms?: string[];
  isProductLineQuestion?: boolean;
  consultingConcept?: OpzixBrainConcept;
  conceptConfidence?: ConceptDetectionResult["confidence"];
  conceptMatchedTerms?: string[];
  hasWebsiteOrLandingPage?: boolean;
  hasNoWebsite?: boolean;
  scannerBlocked?: boolean;
  scannerBlockedReason?: string;
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
  action?:
    | { type: "start_audit"; url: string }
    | { type: "book_strategy_call" }
    | { type: "open_report"; reportId?: string }
    | { type: "download_pdf"; reportId?: string };
  navigationHref?: string;
  recentTalkingPoint?: ZoraTalkingPoint;
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
    "Other",
    /\b(church|ministry|ministries|faith[-\s]?based|non[-\s]?profit|nonprofit|community organization|congregation|campus|sermon|worship|small groups?|volunteer|serve|donate|giving)\b/i,
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

export function detectZoraTrafficIntent(
  value?: string,
): { category: ZoraTrafficIntentCategory; text: string } | undefined {
  const text = String(value ?? "").replace(/[-_+]/g, " ").trim();

  if (!text) return undefined;

  if (
    /\b(conversion[-\s]?rate[-\s]?optimization|conversion optimization|cro|ecommerce audit|e-commerce audit|fix[-\s]?ecommerce|fix ecommerce sales|fix e commerce sales|ecommerce sales|e commerce sales|people aren't buying|people are not buying|not converting|low conversions?|high traffic low conversions?|checkout abandonment|cart abandonment)\b/i.test(
      text,
    )
  ) {
    return {
      category: "conversion_rate_optimization",
      text,
    };
  }

  if (
    /\b(website[-\s]?cost|hire[-\s]?developer|hire web developer|website developer|web developer|website build|website rebuild cost|rebuild cost|website rebuild|site rebuild|code rebuild|code rewrite|full rebuild|custom website|redesign cost|new website cost)\b/i.test(
      text,
    )
  ) {
    return {
      category: "website_rebuild",
      text,
    };
  }

  if (
    /\b(ai[-\s]?chatbot|chatbot|automation|crm|ai assistant|lead follow[-\s]?up|intake automation|workflow automation|sales automation)\b/i.test(
      text,
    )
  ) {
    return {
      category: "ai_automation_crm",
      text,
    };
  }

  return undefined;
}

export function zoraTrafficIntentAnchor(profile: ZoraLeadProfile) {
  if (profile.trafficIntentCategory === "conversion_rate_optimization") {
    return "When e-commerce brands see high traffic but low conversions, the temptation is to change button colors or redesign the theme. But usually, the leak isn't design; it's micro-friction in the checkout path or a mismatch between what the ad promised and what the landing page delivers.";
  }

  if (profile.trafficIntentCategory === "website_rebuild") {
    return "Before you invest thousands in a full code rebuild, it's critical to separate engineering problems from growth system problems. Building a beautiful new site on top of a broken offer or broken tracking signals just means you'll lose money faster, but with cleaner code.";
  }

  if (profile.trafficIntentCategory === "ai_automation_crm") {
    return "When teams look at AI chatbots, automation, or CRM cleanup, the real question is usually not the tool first; it is whether intake, routing, follow-up ownership, and operational handoff are clear enough for automation to improve the system instead of amplifying confusion.";
  }

  return "";
}

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
  if (/\b(organic search|organic|seo)\b/i.test(message)) {
    return topicFromChallenge(challenge);
  }

  return firstMatch(message, topicPatterns) || topicFromChallenge(challenge);
}

export function detectCompanyBackgroundIntent(
  message: string,
): ZoraCompanyBackgroundIntent {
  const text = message.trim();

  if (
    /\b(who owns|who owns this company|who owns this|who owns it|who is the owner|owner of opzix)\b/i.test(text)
  ) {
    return { isCompanyBackgroundQuestion: true, subtype: "owner", confidence: "High" };
  }

  if (/\b(who is the ceo|who's the ceo|ceo of opzix)\b/i.test(text)) {
    return { isCompanyBackgroundQuestion: true, subtype: "ceo", confidence: "High" };
  }

  if (
    /\b(who is the founder|who's the founder|who started|who founded|who created|who built|who is adim odumefune|who's adim odumefune|who is adim|who's adim)\b/i.test(
      text,
    )
  ) {
    return { isCompanyBackgroundQuestion: true, subtype: "founder", confidence: "High" };
  }

  if (/\b(who runs|who runs this|who runs opzix)\b/i.test(text)) {
    return { isCompanyBackgroundQuestion: true, subtype: "owner", confidence: "High" };
  }

  if (/\b(is this legit|is opzix legit|is this real|is opzix real|is this a scam|scam)\b/i.test(text)) {
    return {
      isCompanyBackgroundQuestion: true,
      subtype: "legitimacy",
      confidence: "High",
    };
  }

  if (/\b(what is opzix|who is opzix)\b/i.test(text)) {
    return {
      isCompanyBackgroundQuestion: true,
      subtype: "what_is_opzix",
      confidence: "High",
    };
  }

  if (/\b(who are you|who am i talking to|who is this|what company is this)\b/i.test(text)) {
    return {
      isCompanyBackgroundQuestion: true,
      subtype: "who_are_you",
      confidence: "High",
    };
  }

  if (/\b(opzix)\b/i.test(text) && /\b(company|background|team|real|legit|owned|runs)\b/i.test(text)) {
    return {
      isCompanyBackgroundQuestion: true,
      subtype: "general_company",
      confidence: "Moderate",
    };
  }

  return {
    isCompanyBackgroundQuestion: false,
    subtype: "general_company",
    confidence: "Low",
  };
}

export function detectFounderFollowupIntent(
  message: string,
  conversationState: Pick<
    ZoraLeadProfile,
    "lastAssistantIntent" | "lastAssistantMessageSummary"
  > = {},
): ZoraFounderFollowupIntent {
  const text = message.trim();
  const previousFounderContext =
    conversationState.lastAssistantIntent === "company_background" &&
    /\b(adim|odumefune|max|founder|owner|ceo)\b/i.test(
      conversationState.lastAssistantMessageSummary || "",
    );

  if (/\b(adim odumefune|adim|max)\b/i.test(text)) {
    return {
      isFounderFollowup: true,
      subtype: /\b(background|experience|senior|engineer|developer|does he do)\b/i.test(text)
        ? "background"
        : "identity",
      confidence: "High",
    };
  }

  if (/\b(who is the founder|who's the founder|who is the ceo|who's the ceo)\b/i.test(text)) {
    return { isFounderFollowup: true, subtype: "role", confidence: "High" };
  }

  if (previousFounderContext) {
    if (/\b(what is his background|what's his background|what experience|what does he do|what has he built)\b/i.test(text)) {
      return { isFounderFollowup: true, subtype: "background", confidence: "High" };
    }

    if (/\b(who is he|who's he|who is that|who's that|tell me about him|him|he)\b/i.test(text)) {
      return { isFounderFollowup: true, subtype: "identity", confidence: "High" };
    }
  }

  if (/\b(founder|owner|ceo)\b/i.test(text) && /\b(background|experience|role|does)\b/i.test(text)) {
    return { isFounderFollowup: true, subtype: "experience", confidence: "Moderate" };
  }

  return { isFounderFollowup: false, subtype: "identity", confidence: "Low" };
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

function isRealEstateLeadSystemInquiry(message: string) {
  const hasRealEstateContext =
    /\b(real estate|realtor|brokerage|broker|agent|property management|zillow|trulia|redfin)\b/i.test(
      message,
    );
  const hasLeadSystemContext =
    /\b(lead|leads|lead[-\s]?generat(?:ing|ion)|organic|seo|zillow|trulia|redfin|crm|follow[-\s]?up|nurture|calendar|booking|website|site|system|pipeline)\b/i.test(
      message,
    );
  const asksForHelp =
    /\b(how can you help|can you help|help me|how would you|what would you build|build(?:ing)?|create|set up|setup|system)\b/i.test(
      message,
    );

  return hasRealEstateContext && hasLeadSystemContext && asksForHelp;
}

function isSmallTalkQuestion(message: string) {
  return /\b(how are you|how's it going|how is it going|what's up|whats up|hello|hi zora|hey zora|hi\b|hey\b|good morning|good afternoon|good evening)\b/i.test(
    message,
  );
}

function isThanksMessage(message: string) {
  return /\b(thank you|thanks|thx|appreciate it|appreciate you|okay thanks|ok thanks)\b/i.test(
    message,
  );
}

function isCasualAcknowledgmentMessage(message: string) {
  return /^(ok|okay|nice|okay nice|ok nice|yes|yeah|yep|sure|sounds good|continue|keep going|go on|got it|yea i see|yeah i see|i see)[.!?]*$/i.test(
    message.trim(),
  );
}

function isMomentumAcknowledgmentMessage(message: string) {
  return /^(ok|okay|yes|yeah|yep|sure|sounds good|continue|keep going|go on|tell me more|more|why|yea i see|yeah i see|i see)[.!?]*$/i.test(
    message.trim(),
  );
}

function isPostRecommendationAcknowledgementMessage(message: string) {
  return /^(ok|okay|cool|sounds good|nice|makes sense|that makes sense|got it|yea i see|yeah i see|i see)[.!?]*$/i.test(
    message.trim(),
  );
}

function isTopicContinuationMessage(message: string) {
  return /^(ok|okay|yes|yeah|yep|sure|sounds good|continue|keep going|go on|tell me more|more|why|interesting|yea i see|yeah i see|i see)[.!?]*$/i.test(
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

function isFreeAuditPricingQuestion(message: string) {
  return (
    /\b(is it|is this|is the audit|audit is|audit's|audits?)\b.+\bfree\b/i.test(message) ||
    /\bfree\b.+\b(audit|scan|scanner|website review)\b/i.test(message) ||
    /\b(how much|cost|price|pricing)\b.+\b(audit|scan|scanner|website review)\b/i.test(message)
  );
}

function normalizeCommandText(message: string) {
  return message
    .toLowerCase()
    .trim()
    .replace(/[’']/g, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectTerminologyQuestion(message: string): ZoraTerminologyTerm | undefined {
  const text = normalizeCommandText(message);
  const asksDefinition =
    /\b(what do you mean|what does .* mean|what is|what'?s|define|explain what|explain the term)\b/i.test(
      message,
    ) || /\b(mean by|means?)\b/i.test(message);

  if (!asksDefinition) return undefined;

  if (/\b(dtc|direct to consumer|direct consumer|dtc store|dtc ecommerce)\b/i.test(text)) {
    return "dtc_store";
  }

  if (/\b(audit|scanner|scan|free audit|website audit)\b/i.test(text)) {
    return "audit";
  }

  if (/\b(product discovery|mobile product discovery|find products|product search)\b/i.test(text)) {
    return "product_discovery";
  }

  if (/\b(checkout trust|checkout confidence|trust at checkout)\b/i.test(text)) {
    return "checkout_trust";
  }

  if (/\b(tracking visibility|source tracking|attribution|conversion tracking)\b/i.test(text)) {
    return "tracking_visibility";
  }

  if (/\b(crm routing|lead routing|routing)\b/i.test(text)) {
    return "crm_routing";
  }

  if (/\b(conversion path|customer journey|conversion mechanics|conversion)\b/i.test(text)) {
    return "conversion_path";
  }

  return undefined;
}

function isAuditInformationIntent(message: string) {
  const text = normalizeCommandText(message);

  return /^(what is the audit|how much is the audit|is the audit free|is it free audit|is the free audit actually free|explain the audit|what does the scanner do|should i run the audit)$/.test(
    text,
  );
}

function isScannerExecutionRequest(message: string) {
  const text = normalizeCommandText(message);

  if (!text || isAuditInformationIntent(text)) return false;

  return /^(run (the )?(free )?audit|start (the )?(free )?audit|start (the )?scan|scan (my )?(site|website|store)|scan it|audit (my )?(site|website|store)|audit it|diagnose (my )?(site|website|store)|diagnose it|lets run it|run it|ok run it|okay run it|yes run it|go ahead and run it|launch the audit|begin the audit)$/.test(
    text,
  );
}

function isDiagnoseExecutionRequest(message: string) {
  return normalizeCommandText(message) === "diagnose my growth system";
}

function isScannerFailureMessage(message: string) {
  return /\b(anti[-\s]?bot|bot protection|blocked by|page blocked|blocked|captcha|cloudflare|akamai|firewall|access denied|403|forbidden)\b/i.test(
    message,
  );
}

function scannerBlockedReason(message: string) {
  if (/\b(cloudflare)\b/i.test(message)) return "Cloudflare protection";
  if (/\b(akamai)\b/i.test(message)) return "Akamai protection";
  if (/\b(captcha)\b/i.test(message)) return "CAPTCHA protection";
  if (/\b(403|forbidden|access denied)\b/i.test(message)) return "access restriction";
  return "anti-bot protection";
}

function isTrustSkepticismMessage(message: string) {
  return /\b(copy and paste|copy-paste|copy paste|generic|template|script|canned|boilerplate|not tailored|tailored to my website|tailored to my site|actual website|my website or|just.*reply|same reply)\b/i.test(
    message,
  );
}

function isReviewRequest(message: string) {
  return /\b(review it|review my website|review my site|your thoughts|what do you think|can you review this|can you review it|can you take a look|take a look|initial opinion)\b/i.test(
    message,
  );
}

function isManualStrategyReviewRequest(message: string) {
  return /\b(review the strategy manually|review strategy manually|review the strategy|strategy review|review my strategy|manual strategy|talk through the strategy|map the strategy manually)\b/i.test(
    message,
  );
}

function isProgressionAgreementMessage(message: string) {
  return /^(ok|okay|sounds good|make sense|makes sense|that makes sense|let'?s do it|lets do it|let'?s go|lets go|proceed|go ahead|ready)[.!?]*$/i.test(
    message.trim(),
  );
}

function isHandoffExecutionMessage(message: string) {
  return /^(let'?s do it|lets do it|let'?s go|lets go|proceed|go ahead|ready)[.!?]*$/i.test(
    message.trim(),
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

function isPreLaunchWebsiteBuildRequest(message: string) {
  return /\b(i want to|want to|i need|need to|planning to|ready to|looking to)\s+(?:build|create|launch|make)\s+(?:a\s+)?(?:new\s+)?(?:website|site|landing page)\b|\bneed a new (?:website|site|landing page)\b|\bwant a new (?:website|site|landing page)\b/i.test(
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
  return (
    isAuditInformationIntent(message) ||
    /\b(audit my website|audit my site|audit my store|run an audit|free audit|scan my website|scan my site|scan my store|website audit|check (?:the )?site path|review (?:the )?site path|look at (?:the )?site path|check (?:my )?site|review (?:my )?site|check my website|review my website)\b/i.test(
      message,
    )
  );
}

function isDirectServiceInformationQuestion(message: string) {
  const text = normalizeCommandText(message);
  if (!text) return false;

  const asksDirectQuestion =
    /^(why|what|how|should i|do i need|do we need|is it|is this|can you explain|could you explain|explain|tell me about|what happens|whats included|what is included)\b/.test(
      text,
    ) ||
    /\b(why do i need|why would i need|do i need|is it worth|can you explain|could you explain|what happens|whats included|what is included)\b/.test(
      text,
    );
  const asksAboutService =
    /\b(strategy call|consultation|audit|free audit|scanner|scan|implementation|service|pricing|price|cost|opzix|roadmap|recommendation|findings)\b/.test(
      text,
    );

  return asksDirectQuestion && asksAboutService;
}

function isStrategyCallInformationQuestion(message: string) {
  const text = normalizeCommandText(message);

  return (
    isDirectServiceInformationQuestion(message) &&
    /\b(strategy call|consultation)\b/.test(text)
  );
}

function isBookingRequest(message: string) {
  if (isDirectServiceInformationQuestion(message)) return false;

  const text = normalizeCommandText(message);

  return (
    /^(book strategy call|strategy call|schedule strategy call)$/.test(text) ||
    /\b(book|schedule|calendly|talk to someone|talk with someone|speak with|speak to someone)\b/i.test(
      message,
    ) ||
    /\b(i want|i need|i would like|let'?s do|lets do|ready for|set up|setup|open|take me to)\b.*\b(strategy call|consultation|meeting)\b/i.test(
      message,
    )
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

  if (has(/\b(sellvia|dropship|dropshipping|turnkey|supplier|supply network|merchant|vendor|ecosystem)\b/)) {
    return {
      inferredIndustry: "B2B Supply Platform",
      inferredBusinessModel: "B2B Supply / Ecommerce Infrastructure Platform",
      inferredFunnelType: "Merchant Acquisition / Platform Onboarding",
      industryConfidence: context.includes("sellvia") ? 0.92 : 0.78,
    };
  }

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

  if (has(/\b(church|ministry|ministries|faith|nonprofit|non profit|community|sermon|worship|campus|elevationchurch|elevation)\b/)) {
    return {
      inferredIndustry: "Nonprofit / Faith Community",
      inferredBusinessModel: "Faith-Based / Community Organization",
      inferredFunnelType: "Digital Engagement / Local Connection",
      industryConfidence: context.includes("elevationchurch") || context.includes("church") ? 0.86 : 0.76,
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

function detectsB2BSupplyPlatformContext(text: string) {
  return /\b(sellvia|dropship|dropshipping|supplier platform|supply network|turnkey|merchant onboarding|merchant acquisition|vendor dashboard|api|plugin|integration|store owners?|ecommerce infrastructure|e-commerce infrastructure|ecosystem|platform model|b2b|b2b ecommerce|wholesale)\b/i.test(
    text,
  );
}

function detectsDtcCorrection(message: string) {
  return (
    /\b(it'?s|it is|we'?re|we are|this is|that is|they'?re|they are)\s+not\s+(?:a\s+)?(?:dtc|direct[-\s]?to[-\s]?consumer|retail store|traditional store|storefront|consumer brand|brand)\b/i.test(
      message,
    ) ||
    /\bnot\s+(?:a\s+)?(?:dtc|direct[-\s]?to[-\s]?consumer|retail store|traditional store|storefront|consumer brand|brand)\b/i.test(
      message,
    ) ||
    /\b(no|actually|correction|wrong|incorrect)\b.*\b(?:dtc|direct[-\s]?to[-\s]?consumer|retail store|traditional store|storefront|consumer brand|brand)\b/i.test(
      message,
    )
  );
}

function detectsGenericIndustryCorrection(message: string) {
  return (
    detectsDtcCorrection(message) ||
    /\b(that'?s wrong|thats wrong|wrong industry|wrong business|wrong model|incorrect industry|incorrect model|not ecommerce|not e-?commerce|not a real estate business|not real estate|something else|different industry|different model)\b/i.test(
      message,
    ) ||
    /\b(actually|no|nah|not quite|not really)\b.*\b(we'?re|we are|it'?s|it is|this is|business|company|model|industry)\b/i.test(
      message,
    )
  );
}

function normalizeConfirmedIndustry(value: string) {
  const text = normalizeCommandText(value);

  if (/\b(domain registrar|domains?|dns|registrar|porkbun|namecheap|godaddy)\b/i.test(value)) {
    return "domain_registrar";
  }

  if (/\b(infrastructure provider|infrastructure|hosting|cloud|dns provider|platform infrastructure)\b/i.test(value)) {
    return "infrastructure_provider";
  }

  if (/\b(saas|software|software platform|app|subscription software)\b/i.test(value)) {
    return "saas_software";
  }

  if (/\b(marketplace|enterprise retail|multi vendor|multi-vendor)\b/i.test(value)) {
    return "marketplace";
  }

  if (/\b(agency|services|service provider|consulting|consultancy)\b/i.test(value)) {
    return "agency_services";
  }

  if (text === "other") {
    return "other";
  }

  return undefined;
}

function businessTypeForConfirmedIndustry(industry?: string): ZoraBusinessType | undefined {
  switch (industry) {
    case "agency_services":
      return "Service Business";
    case "marketplace":
      return "Ecommerce";
    case "domain_registrar":
    case "infrastructure_provider":
    case "saas_software":
    case "other":
      return "Other";
    default:
      return undefined;
  }
}

function detectBusinessModelCorrection(
  message: string,
  currentProfile: Pick<
    ZoraLeadProfile,
    | "websiteUrl"
    | "industryProfile"
    | "inferredBusinessModel"
    | "inferredIndustry"
    | "industryStatus"
    | "confirmedIndustry"
    | "userCorrectedIndustry"
    | "lastAssistantMessageSummary"
  > = {},
): Pick<
  ZoraMessageAnalysis,
  | "correctedIndustry"
  | "correctedBusinessModel"
  | "confirmedIndustry"
  | "industryStatus"
  | "userCorrectedIndustry"
> {
  const confirmedIndustry = normalizeConfirmedIndustry(message);

  if (
    confirmedIndustry &&
    (currentProfile.industryStatus === "needs_clarification" ||
      currentProfile.userCorrectedIndustry ||
      detectsGenericIndustryCorrection(message))
  ) {
    return {
      confirmedIndustry,
      industryStatus: "confirmed",
      userCorrectedIndustry: true,
      correctedBusinessModel: `User confirmed industry: ${confirmedIndustry}`,
    };
  }

  const context = [
    message,
    currentProfile.websiteUrl ? normalizeDomainContext(currentProfile.websiteUrl) : "",
    currentProfile.inferredBusinessModel,
    currentProfile.inferredIndustry,
    currentProfile.lastAssistantMessageSummary,
  ]
    .filter(Boolean)
    .join(" ");
  const correctsDtc = detectsDtcCorrection(message);
  const saysDifferentModel =
    /\b(no|actually|correction|wrong|incorrect|not quite|not really|something else)\b/i.test(message) &&
    /\b(company|business|model|store|platform|site|brand|dtc|direct[-\s]?to[-\s]?consumer)\b/i.test(message);

  if (
    detectsB2BSupplyPlatformContext(context) &&
    (correctsDtc || saysDifferentModel || /\b(we are|we'?re|it'?s|it is|this is)\b/i.test(message))
  ) {
    return {
      correctedIndustry: "b2b_supply_platform",
      correctedBusinessModel: "B2B Supply / Ecommerce Infrastructure Platform",
    };
  }

  if (correctsDtc || saysDifferentModel) {
    return {
      correctedBusinessModel: "User corrected the previous business model assumption",
      industryStatus: "needs_clarification",
      userCorrectedIndustry: true,
    };
  }

  if (
    currentProfile.industryStatus === "needs_clarification" &&
    !confirmedIndustry &&
    (detectsGenericIndustryCorrection(message) || normalizeCommandText(message).length > 0)
  ) {
    return {
      correctedBusinessModel: "User correction needs business model clarification",
      industryStatus: "needs_clarification",
      userCorrectedIndustry: true,
    };
  }

  return {};
}

export function zoraIndustryConfidenceScore(
  confidence: ZoraLeadProfile["industryConfidence"] | undefined,
) {
  if (typeof confidence === "number") return confidence;
  if (confidence === "High") return 0.9;
  if (confidence === "Moderate") return 0.7;
  if (confidence === "Low") return 0.35;
  return 0;
}

function businessTypeFromIndustry(industry?: ZoraIndustry): ZoraBusinessType | undefined {
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

function shouldReplaceIndustryProfile(
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

function applyIndustryProfile(
  profile: ZoraLeadProfile,
  industryProfile: ZoraIndustryProfile,
  changes: string[],
) {
  if (!shouldReplaceIndustryProfile(profile.industryProfile, industryProfile)) {
    return;
  }

  addChange(
    changes,
    "industry",
    profile.industry,
    industryProfile.industry,
  );
  profile.industryProfile = industryProfile;
  profile.industry = industryProfile.industry;
  profile.industryConfidence = industryProfile.confidence;
  profile.industryEvidence = industryProfile.evidence;
  profile.buyerJourney = industryProfile.buyerJourney;
  profile.primaryBottlenecks = industryProfile.primaryBottlenecks;
  profile.recommendedFocusAreas = industryProfile.recommendedFocusAreas;

  const inferredBusinessType = businessTypeFromIndustry(industryProfile.industry);
  if (
    inferredBusinessType &&
    (!profile.businessType || industryProfile.confidence === "High")
  ) {
    addChange(changes, "businessType", profile.businessType, inferredBusinessType);
    profile.businessType = inferredBusinessType;
  }

  if (industryProfile.industry !== "unknown") {
    profile.inferredIndustry =
      industryProfile.industry === "b2b_supply_platform"
        ? "B2B Supply Platform"
        : industryProfile.industry;
    profile.inferredBusinessModel =
      industryProfile.industry === "b2b_supply_platform"
        ? "B2B Supply / Ecommerce Infrastructure Platform"
        : industryProfile.industry;
    profile.inferredFunnelType = industryProfile.buyerJourney;
  }
}

function correctedIndustryProfile(
  industry: ZoraIndustry,
  evidence: string[] = [],
): ZoraIndustryProfile | undefined {
  if (industry === "b2b_supply_platform") {
    return {
      industry,
      confidence: "High",
      evidence: evidence.length ? evidence : ["user correction"],
      buyerJourney:
        "merchant -> platform value proof -> sign-up -> store/inventory integration -> activation and retention",
      primaryBottlenecks: [
        "merchant acquisition",
        "onboarding friction",
        "integration clarity",
        "supplier logistics visibility",
        "vendor dashboard clarity",
        "API/plugin stability",
        "enterprise lead capture",
      ],
      recommendedFocusAreas: [
        "merchant acquisition path",
        "onboarding speed",
        "integration clarity",
        "vendor dashboard clarity",
        "supplier logistics visibility",
        "API/plugin stability",
        "enterprise lead capture",
      ],
      preferredNextStep: "audit",
    };
  }

  return undefined;
}

function businessTypeFromInference(
  inference: Pick<ZoraLeadProfile, "inferredIndustry" | "inferredBusinessModel">,
): ZoraBusinessType | undefined {
  if (inference.inferredIndustry === "Real Estate") return "Real Estate";
  if (inference.inferredIndustry === "Healthcare / Care") return "Care/Healthcare";
  if (inference.inferredIndustry === "Nonprofit / Faith Community") return "Other";
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
  if (
    profile.confirmedIndustry ||
    profile.userCorrectedIndustry ||
    profile.industryStatus === "needs_clarification"
  ) {
    return false;
  }

  const inferredBusinessType = businessTypeFromInference(profile);

  return Boolean(
    zoraIndustryConfidenceScore(profile.industryConfidence) >= 0.7 &&
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
  if (/\b(church|ministry|ministries|faith[-\s]?based|non[-\s]?profit|nonprofit|community organization|congregation)\b/i.test(text)) {
    return "Nonprofit / Faith Community";
  }
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
  const hasZillow = /\bzillow\b/i.test(text);
  const hasOrganic = /\borganic|seo|search\b/i.test(text);

  if (hasZillow && hasOrganic) return "Zillow and organic search";
  if (hasZillow) return "Zillow";
  if (/\btrulia\b/i.test(text)) return "Trulia";
  if (/\bredfin\b/i.test(text)) return "Redfin";
  if (/\b(?:ad|ads|paid traffic|google ads|facebook ads|meta ads)\b/i.test(text)) return "Ads";
  if (/\breferrals?\b/i.test(text)) return "Referrals";
  if (hasOrganic) return "Organic search";
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
  if (analysis.offerKey || analysis.isProductLineQuestion) score += 0.24;
  if (analysis.businessType && analysis.challenge) score += 0.08;

  return Math.min(0.96, Number(score.toFixed(2)));
}

export function analyzeZoraMessage(message: string): ZoraMessageAnalysis {
  const outOfScope = isOutOfScopeQuestion(message);
  const companyBackground = outOfScope
    ? {
        isCompanyBackgroundQuestion: false,
        subtype: "general_company" as const,
        confidence: "Low" as const,
      }
    : detectCompanyBackgroundIntent(message);
  const founderFollowup = outOfScope
    ? {
        isFounderFollowup: false,
        subtype: "identity" as const,
        confidence: "Low" as const,
      }
    : detectFounderFollowupIntent(message);
  const businessModelCorrection = outOfScope
    ? {}
    : detectBusinessModelCorrection(message);
  const realEstateLeadSystemInquiry = outOfScope
    ? false
    : isRealEstateLeadSystemInquiry(message);
  const businessType = outOfScope ? undefined : firstMatch(message, businessTypePatterns);
  const platform = outOfScope ? undefined : firstMatch(message, platformPatterns);
  const toolsMentioned = outOfScope ? undefined : extractToolsMentioned(message);
  const industry = outOfScope ? undefined : extractIndustry(message, businessType);
  const websiteUrl = outOfScope ? undefined : extractWebsiteUrl(message);
  const hasNoWebsite = outOfScope
    ? undefined
    : hasNoWebsiteAnswer(message) || isPreLaunchWebsiteBuildRequest(message) || undefined;
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
  const currentTopic = outOfScope
    ? undefined
    : realEstateLeadSystemInquiry
      ? "lead_capture"
      : extractCurrentTopic(message, challenge);
  const revenue = outOfScope ? {} : parseRevenue(message);
  const email = outOfScope ? undefined : extractEmail(message);
  const visitorName = extractVisitorName(message);
  const conversionRate = outOfScope ? undefined : extractConversionRate(message);
  const funnelStage = outOfScope ? undefined : extractFunnelStage(message);
  const dropoffDetail = outOfScope ? undefined : extractDropoffDetail(message);
  const productScope = outOfScope ? undefined : extractProductScope(message);
  const cartBuildSource = outOfScope ? undefined : extractCartBuildSource(message);
  const shippingPricing = outOfScope ? undefined : extractShippingPricing(message);
  const recommendationSetup =
    outOfScope || isManualStrategyReviewRequest(message)
      ? undefined
      : extractRecommendationSetup(message);
  const leadDestination = outOfScope ? undefined : extractLeadDestination(message);
  const notificationChannel = outOfScope ? undefined : extractNotificationChannel(message);
  const desiredOutcome = outOfScope ? undefined : extractDesiredOutcome(message);
  const terminologyTerm = outOfScope ? undefined : detectTerminologyQuestion(message);
  const actionIntent = outOfScope
    ? undefined
    : detectZoraActionIntent({
        message,
        websiteUrl,
      });
  const productLineQuestion = outOfScope ? false : isOpzixProductLineQuestion(message);
  const offerDetection = outOfScope
    ? { offerKey: null, confidence: "Low" as const, matchedTerms: [], isOfferQuestion: false }
    : detectOpzixOfferIntent(message);
  const hasOfferIntent =
    Boolean(offerDetection.offerKey) && offerDetection.confidence !== "Low";
  const consultingConcept = outOfScope || productLineQuestion || hasOfferIntent
    ? { concept: null, confidence: "Low" as const, matchedTerms: [] }
    : detectOpzixBrainConcept(message);
  const hasConsultingConcept =
    Boolean(consultingConcept.concept) && consultingConcept.confidence !== "Low";
  const intent: ZoraIntent = outOfScope
    ? "out_of_scope"
    : businessModelCorrection.correctedIndustry || businessModelCorrection.correctedBusinessModel
      ? "business_model_correction"
    : founderFollowup.isFounderFollowup ||
        (companyBackground.isCompanyBackgroundQuestion && !productLineQuestion)
      ? "company_background"
    : isScannerFailureMessage(message)
      ? "scanner_failure"
    : isTrustSkepticismMessage(message)
      ? "trust_skepticism"
    : isScannerExecutionRequest(message) || isDiagnoseExecutionRequest(message)
      ? "scanner_execute"
    : isFreeAuditPricingQuestion(message) || isPricingQuestion(message)
      ? "pricing"
    : terminologyTerm
      ? "terminology"
    : actionIntent?.isAction
      ? "action_request"
    : productLineQuestion || hasOfferIntent
      ? "offer_catalog"
    : hasConsultingConcept || isConsultingExperienceQuestion(message)
      ? "consulting_concept"
    : isThanksMessage(message)
      ? "thanks"
      : isCasualAcknowledgmentMessage(message)
        ? "acknowledgement"
      : isSmallTalkQuestion(message)
        ? "small_talk"
        : isManualStrategyReviewRequest(message) || isReviewRequest(message)
            ? "review_request"
          : isRecommendationQuestion(message)
            ? "recommendation"
            : isAuditRequest(message)
              ? "audit_request"
              : isBookingRequest(message)
                ? "booking_request"
                : realEstateLeadSystemInquiry || isConsultantQuestion(message)
                  ? "consultant"
                  : isCapabilityQuestion(message)
                    ? "capability"
                    : isFocusRequest(message)
                      ? "focus_request"
                      : isNextStepRequest(message)
                        ? "next_step"
                        : isTimelineQuestion(message)
                          ? "timeline"
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
    rawMessage: message,
    companyBackgroundSubtype: founderFollowup.isFounderFollowup
      ? "founder"
      : companyBackground.isCompanyBackgroundQuestion
        ? companyBackground.subtype
        : undefined,
    founderFollowupSubtype: founderFollowup.isFounderFollowup
      ? founderFollowup.subtype
      : undefined,
    terminologyTerm,
    actionIntent,
    correctedIndustry: businessModelCorrection.correctedIndustry,
    correctedBusinessModel: businessModelCorrection.correctedBusinessModel,
    confirmedIndustry: businessModelCorrection.confirmedIndustry,
    industryStatus: businessModelCorrection.industryStatus,
    userCorrectedIndustry: businessModelCorrection.userCorrectedIndustry,
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
    offerKey: offerDetection.offerKey || undefined,
    offerMatchedTerms: offerDetection.matchedTerms.length
      ? offerDetection.matchedTerms
      : undefined,
    isProductLineQuestion: productLineQuestion || undefined,
    consultingConcept: consultingConcept.concept || undefined,
    conceptConfidence: consultingConcept.concept ? consultingConcept.confidence : undefined,
    conceptMatchedTerms: consultingConcept.matchedTerms.length
      ? consultingConcept.matchedTerms
      : undefined,
    hasWebsiteOrLandingPage,
    hasNoWebsite,
    scannerBlocked: isScannerFailureMessage(message) ? true : undefined,
    scannerBlockedReason: isScannerFailureMessage(message) ? scannerBlockedReason(message) : undefined,
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
    if (businessTypeConflict) {
      addChange(changes, "confirmedIndustry", nextProfile.confirmedIndustry, analysis.businessType);
      nextProfile.confirmedIndustry = analysis.businessType;
    }
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

  if (analysis.confirmedIndustry) {
    const confirmedBusinessType = businessTypeForConfirmedIndustry(analysis.confirmedIndustry);

    addChange(changes, "confirmedIndustry", nextProfile.confirmedIndustry, analysis.confirmedIndustry);
    nextProfile.confirmedIndustry = analysis.confirmedIndustry;
    addChange(changes, "industryStatus", nextProfile.industryStatus, "confirmed");
    nextProfile.industryStatus = "confirmed";
    addChange(changes, "userCorrectedIndustry", nextProfile.userCorrectedIndustry, true);
    nextProfile.userCorrectedIndustry = true;
    addChange(changes, "industryConfidence", nextProfile.industryConfidence, 1);
    nextProfile.industryConfidence = 1;

    if (confirmedBusinessType) {
      addChange(changes, "businessType", nextProfile.businessType, confirmedBusinessType);
      nextProfile.businessType = confirmedBusinessType;
    }

    if (nextProfile.industryProfile) {
      addChange(changes, "industryProfile", nextProfile.industryProfile.industry, undefined);
      delete nextProfile.industryProfile;
    }
    addChange(changes, "industry", nextProfile.industry, analysis.confirmedIndustry);
    nextProfile.industry = analysis.confirmedIndustry;
    addChange(changes, "inferredIndustry", nextProfile.inferredIndustry, null);
    nextProfile.inferredIndustry = null;
    addChange(changes, "inferredBusinessModel", nextProfile.inferredBusinessModel, null);
    nextProfile.inferredBusinessModel = null;
    addChange(changes, "inferredFunnelType", nextProfile.inferredFunnelType, null);
    nextProfile.inferredFunnelType = null;
    addChange(changes, "needsBusinessTypeClarification", nextProfile.needsBusinessTypeClarification, false);
    nextProfile.needsBusinessTypeClarification = false;
    addChange(changes, "industryMismatchResolved", nextProfile.industryMismatchResolved, true);
    nextProfile.industryMismatchResolved = true;
  }

  if (analysis.correctedIndustry) {
    const correctedProfile = correctedIndustryProfile(analysis.correctedIndustry, [
      `user correction: ${analysis.rawMessage || "business model correction"}`,
    ]);

    if (correctedProfile) {
      applyIndustryProfile(nextProfile, correctedProfile, changes);
      addChange(
        changes,
        "businessModelCorrection",
        nextProfile.businessModelCorrection,
        analysis.correctedBusinessModel,
      );
      nextProfile.businessModelCorrection = analysis.correctedBusinessModel;
      addChange(
        changes,
        "inferredBusinessModel",
        nextProfile.inferredBusinessModel,
        analysis.correctedBusinessModel,
      );
      nextProfile.inferredBusinessModel = analysis.correctedBusinessModel;
      addChange(
        changes,
        "inferredIndustry",
        nextProfile.inferredIndustry,
        "B2B Supply Platform",
      );
      nextProfile.inferredIndustry = "B2B Supply Platform";
      addChange(
        changes,
        "confirmedIndustry",
        nextProfile.confirmedIndustry,
        "B2B Supply Platform",
      );
      nextProfile.confirmedIndustry = "B2B Supply Platform";
      addChange(
        changes,
        "inferredFunnelType",
        nextProfile.inferredFunnelType,
        correctedProfile.buyerJourney,
      );
      nextProfile.inferredFunnelType = correctedProfile.buyerJourney;
      addChange(changes, "needsBusinessTypeClarification", nextProfile.needsBusinessTypeClarification, false);
      nextProfile.needsBusinessTypeClarification = false;
      addChange(changes, "industryMismatchResolved", nextProfile.industryMismatchResolved, true);
      nextProfile.industryMismatchResolved = true;
      addChange(changes, "currentTopic", nextProfile.currentTopic, "lead_capture");
      nextProfile.currentTopic = "lead_capture";
      addChange(changes, "currentTopicDepth", nextProfile.currentTopicDepth, 1);
      nextProfile.currentTopicDepth = 1;
    }
  } else if (analysis.intent === "business_model_correction" && !analysis.confirmedIndustry) {
    addChange(
      changes,
      "businessModelCorrection",
      nextProfile.businessModelCorrection,
      analysis.correctedBusinessModel,
    );
    nextProfile.businessModelCorrection = analysis.correctedBusinessModel;
    addChange(changes, "userCorrectedIndustry", nextProfile.userCorrectedIndustry, true);
    nextProfile.userCorrectedIndustry = true;
    addChange(changes, "industryStatus", nextProfile.industryStatus, "needs_clarification");
    nextProfile.industryStatus = "needs_clarification";
    addChange(changes, "industryConfidence", nextProfile.industryConfidence, 0);
    nextProfile.industryConfidence = 0;

    if (nextProfile.industryProfile) {
      addChange(changes, "industryProfile", nextProfile.industryProfile.industry, undefined);
      delete nextProfile.industryProfile;
    }
    if (nextProfile.industry) {
      addChange(changes, "industry", nextProfile.industry, undefined);
      delete nextProfile.industry;
    }
    if (nextProfile.inferredIndustry) {
      addChange(changes, "inferredIndustry", nextProfile.inferredIndustry, null);
      nextProfile.inferredIndustry = null;
    }
    if (nextProfile.inferredBusinessModel) {
      addChange(changes, "inferredBusinessModel", nextProfile.inferredBusinessModel, null);
      nextProfile.inferredBusinessModel = null;
    }
    if (nextProfile.inferredFunnelType) {
      addChange(changes, "inferredFunnelType", nextProfile.inferredFunnelType, null);
      nextProfile.inferredFunnelType = null;
    }
    if (nextProfile.recommendedFocusAreas) {
      addChange(changes, "recommendedFocusAreas", nextProfile.recommendedFocusAreas.join(", "), undefined);
      delete nextProfile.recommendedFocusAreas;
    }
    if (nextProfile.primaryBottlenecks) {
      addChange(changes, "primaryBottlenecks", nextProfile.primaryBottlenecks.join(", "), undefined);
      delete nextProfile.primaryBottlenecks;
    }
    if (nextProfile.industryEvidence) {
      addChange(changes, "industryEvidence", nextProfile.industryEvidence.join(", "), undefined);
      delete nextProfile.industryEvidence;
    }
    if (nextProfile.buyerJourney) {
      addChange(changes, "buyerJourney", nextProfile.buyerJourney, undefined);
      delete nextProfile.buyerJourney;
    }
    addChange(changes, "needsBusinessTypeClarification", nextProfile.needsBusinessTypeClarification, false);
    nextProfile.needsBusinessTypeClarification = false;
    addChange(changes, "industryMismatchResolved", nextProfile.industryMismatchResolved, false);
    nextProfile.industryMismatchResolved = false;
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

  if (analysis.offerKey) {
    const sameOffer = nextProfile.lastMentionedOffer === analysis.offerKey;
    const nextDepth = sameOffer ? (nextProfile.currentTopicDepth || 1) + 1 : 1;

    addChange(changes, "lastMentionedOffer", nextProfile.lastMentionedOffer, analysis.offerKey);
    nextProfile.lastMentionedOffer = analysis.offerKey;
    addChange(changes, "currentTopic", nextProfile.currentTopic, analysis.offerKey);
    nextProfile.currentTopic = analysis.offerKey;
    addChange(changes, "currentSubtopic", nextProfile.currentSubtopic, analysis.offerKey);
    nextProfile.currentSubtopic = analysis.offerKey;
    addChange(changes, "currentTopicDepth", nextProfile.currentTopicDepth, nextDepth);
    nextProfile.currentTopicDepth = nextDepth;
  }

  if (analysis.consultingConcept) {
    const sameConcept =
      nextProfile.detectedConcept === analysis.consultingConcept ||
      nextProfile.currentSubtopic === analysis.consultingConcept;
    const nextDepth = sameConcept ? (nextProfile.currentTopicDepth || 0) + 1 : 0;
    const conceptTopic = topicForConsultingConcept(analysis.consultingConcept);

    addChange(changes, "detectedConcept", nextProfile.detectedConcept, analysis.consultingConcept);
    nextProfile.detectedConcept = analysis.consultingConcept;
    addChange(changes, "conceptConfidence", nextProfile.conceptConfidence, analysis.conceptConfidence);
    nextProfile.conceptConfidence = analysis.conceptConfidence;
    addChange(
      changes,
      "conceptMatchedTerms",
      nextProfile.conceptMatchedTerms?.join(", "),
      analysis.conceptMatchedTerms?.join(", "),
    );
    nextProfile.conceptMatchedTerms = analysis.conceptMatchedTerms;
    addChange(changes, "currentSubtopic", nextProfile.currentSubtopic, analysis.consultingConcept);
    nextProfile.currentSubtopic = analysis.consultingConcept;
    addChange(changes, "currentTopicDepth", nextProfile.currentTopicDepth, nextDepth);
    nextProfile.currentTopicDepth = nextDepth;

    if (conceptTopic) {
      addChange(changes, "currentTopic", nextProfile.currentTopic, conceptTopic);
      nextProfile.currentTopic = conceptTopic;
    }
  }

  if (analysis.websiteUrl) {
    addChange(changes, "websiteUrl", nextProfile.websiteUrl, analysis.websiteUrl);
    nextProfile.websiteUrl = analysis.websiteUrl;
    const inference = inferIndustryFromUrl(analysis.websiteUrl);
    const canApplyUrlInference =
      !nextProfile.confirmedIndustry &&
      !nextProfile.userCorrectedIndustry &&
      nextProfile.industryStatus !== "needs_clarification";
    if (canApplyUrlInference && (inference.industryConfidence ?? 0) > 0) {
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
      canApplyUrlInference &&
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

  if (analysis.scannerBlocked) {
    addChange(changes, "scannerBlocked", nextProfile.scannerBlocked, true);
    nextProfile.scannerBlocked = true;
  }

  if (analysis.scannerBlockedReason) {
    addChange(
      changes,
      "scannerBlockedReason",
      nextProfile.scannerBlockedReason,
      analysis.scannerBlockedReason,
    );
    nextProfile.scannerBlockedReason = analysis.scannerBlockedReason;
  }

  if (analysis.email) {
    addChange(changes, "email", nextProfile.email, analysis.email);
    nextProfile.email = analysis.email;
  }

  const industryProfile = analysis.intent === "business_model_correction"
    || nextProfile.confirmedIndustry
    || nextProfile.userCorrectedIndustry
    || nextProfile.industryStatus === "needs_clarification"
    ? undefined
    : detectZoraIndustry({
    userMessage: [
      analysis.rawMessage,
      analysis.industry,
      analysis.desiredOutcome,
      analysis.leadSource,
      nextProfile.trafficIntentText,
      analysis.websiteUrl ? normalizeDomainContext(analysis.websiteUrl) : "",
    ]
      .filter(Boolean)
      .join(" "),
    websiteUrl: analysis.websiteUrl ?? nextProfile.websiteUrl,
    businessType: nextProfile.businessType,
    platformHint: analysis.platform ?? nextProfile.platform,
  });
  if (industryProfile) {
    applyIndustryProfile(nextProfile, industryProfile, changes);
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
  const contextualBusinessCorrection = detectBusinessModelCorrection(
    analysis.rawMessage || "",
    currentProfile,
  );

  if (
    (contextualBusinessCorrection.correctedIndustry ||
      contextualBusinessCorrection.correctedBusinessModel ||
      contextualBusinessCorrection.confirmedIndustry) &&
    analysis.intent !== "out_of_scope"
  ) {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      intent: "business_model_correction",
      correctedIndustry: contextualBusinessCorrection.correctedIndustry,
      correctedBusinessModel: contextualBusinessCorrection.correctedBusinessModel,
      confirmedIndustry: contextualBusinessCorrection.confirmedIndustry,
      industryStatus: contextualBusinessCorrection.industryStatus,
      userCorrectedIndustry: contextualBusinessCorrection.userCorrectedIndustry,
      businessType: analysis.businessType || currentProfile.businessType,
      currentTopic: contextualBusinessCorrection.confirmedIndustry
        ? undefined
        : "lead_capture",
    });
  }

  const contextualFounderFollowup = detectFounderFollowupIntent(
    analysis.rawMessage || "",
    currentProfile,
  );

  if (
    contextualFounderFollowup.isFounderFollowup &&
    analysis.intent !== "out_of_scope"
  ) {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      intent: "company_background",
      companyBackgroundSubtype: "founder",
      founderFollowupSubtype: contextualFounderFollowup.subtype,
    });
  }

  const contextualActionIntent = detectZoraActionIntent({
    message: analysis.rawMessage || "",
    websiteUrl: analysis.websiteUrl || currentProfile.websiteUrl,
  });

  if (
    contextualActionIntent.isAction &&
    analysis.intent !== "out_of_scope" &&
    analysis.intent !== "company_background" &&
    analysis.intent !== "pricing" &&
    analysis.intent !== "terminology"
  ) {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      intent: "action_request",
      actionIntent: contextualActionIntent,
      websiteUrl: analysis.websiteUrl,
    });
  }

  const contextualPreLaunchBuild =
    currentProfile.hasNoWebsite &&
    /\b(?:want to|need to|ready to|planning to|looking to)?\s*(?:build|create|launch|make)\s+(?:one|it)\b/i.test(
      analysis.rawMessage || "",
    );

  if (contextualPreLaunchBuild && analysis.intent !== "company_background") {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      intent: "consultant",
      hasNoWebsite: true,
      hasWebsiteOrLandingPage: false,
      challenge: analysis.challenge || "Website",
    });
  }

  const nonEcommerceLeadSourceAnswer =
    currentProfile.businessType &&
    currentProfile.businessType !== "Ecommerce" &&
    Boolean(analysis.leadSource) &&
    (analysis.currentTopic === "product_discovery" ||
      Boolean(
        analysis.funnelStage ||
          analysis.dropoffDetail ||
          analysis.productScope ||
          analysis.cartBuildSource ||
          analysis.shippingPricing ||
          analysis.recommendationSetup,
      ));

  if (nonEcommerceLeadSourceAnswer) {
    const { confidenceScore, ...analysisWithoutConfidence } = analysis;
    void confidenceScore;

    return withRecalculatedConfidence({
      ...analysisWithoutConfidence,
      currentTopic: undefined,
      funnelStage: undefined,
      dropoffDetail: undefined,
      productScope: undefined,
      cartBuildSource: undefined,
      shippingPricing: undefined,
      recommendationSetup: undefined,
    });
  }

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
  const industry = profile.industryProfile?.industry;
  const auditIndustries: Array<ZoraIndustry | undefined> = [
    "ecommerce_dtc",
    "b2b_supply_platform",
    "industrial_b2b_catalog",
    "marketplace_retail",
  ];
  const strategyIndustries: Array<ZoraIndustry | undefined> = [
    "real_estate",
    "healthcare_care",
    "nonprofit_faith_community",
    "service_business",
    "local_service",
    "education",
    "restaurant_hospitality",
  ];
  const auditChallenges: Array<ZoraChallenge | undefined> = [
    "Conversion",
    "Tracking",
    "Website",
  ];
  const strategyChallenges: Array<ZoraChallenge | undefined> = [
    "Operations",
    "Follow-up",
  ];

  if (profile.hasNoWebsite) {
    return "strategy_call";
  }

  if (
    profile.websiteUrl &&
    auditIndustries.includes(industry) &&
    (auditChallenges.includes(profile.challenge) ||
      industry === "industrial_b2b_catalog" ||
      industry === "b2b_supply_platform" ||
      industry === "marketplace_retail")
  ) {
    return "free_audit";
  }

  if (
    !profile.websiteUrl ||
    strategyIndustries.includes(industry) ||
    strategyChallenges.includes(profile.challenge)
  ) {
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
  const hasBusinessContext = Boolean(
    profile.businessType ||
      profile.challenge ||
      profile.websiteUrl ||
      profile.hasNoWebsite ||
      profile.hasWebsiteOrLandingPage ||
      profile.industryProfile,
  );

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

  if (eventType === "company_background" && hasBusinessContext) {
    return "warm";
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

function focusAreas(profile: ZoraLeadProfile) {
  if (profile.industryStatus === "needs_clarification") {
    return ["business model clarification", "customer type", "primary action path", "operational handoff"];
  }

  if (profile.confirmedIndustry === "domain_registrar") {
    return [
      "domain search and registration flow",
      "DNS setup clarity",
      "hosting and email add-on path",
      "account onboarding",
      "renewal and transfer guidance",
      "support handoff",
    ];
  }

  if (profile.confirmedIndustry === "infrastructure_provider") {
    return [
      "technical onboarding",
      "integration documentation",
      "account setup",
      "usage visibility",
      "support handoff",
    ];
  }

  if (profile.confirmedIndustry === "saas_software") {
    return [
      "activation path",
      "trial or demo conversion",
      "onboarding friction",
      "feature education",
      "account expansion signals",
    ];
  }

  if (profile.confirmedIndustry === "marketplace") {
    return [
      "supply and demand pathing",
      "search and matching",
      "seller or vendor onboarding",
      "trust and availability",
      "account flow",
    ];
  }

  if (profile.confirmedIndustry === "agency_services") {
    return [
      "offer clarity",
      "proof and positioning",
      "lead capture",
      "booking flow",
      "follow-up handoff",
    ];
  }

  if (profile.industryProfile?.recommendedFocusAreas?.length) {
    return profile.industryProfile.recommendedFocusAreas;
  }

  if (profile.primaryBottlenecks?.length) {
    return profile.primaryBottlenecks.slice(0, 5);
  }

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

  if (profile.industryProfile?.industry === "nonprofit_faith_community") {
    return [
      "campus discovery",
      "service time clarity",
      "connection forms",
      "small group path",
      "volunteer routing",
      "localized follow-up",
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

  if (profile.businessType === "Other") {
    return "For community organizations, the path should help visitors move from online interest into a clear local next step.";
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

function websiteHostLabel(profile: ZoraLeadProfile) {
  const raw = profile.websiteUrl || "";
  const host = raw
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .split(/[/?#]/)[0];

  if (/dickssportinggoods\.com/i.test(host)) return "Dick's Sporting Goods";
  if (!host) return "this website";
  return host;
}

function isDicksSportingGoods(profile: ZoraLeadProfile) {
  return /dickssportinggoods\.com/i.test(profile.websiteUrl || "");
}

function enterpriseRetailSpecifics(profile: ZoraLeadProfile) {
  if (isDicksSportingGoods(profile)) {
    return "For Dick's Sporting Goods specifically, I would not frame this as a basic landing-page issue. I would look at complex retail flows: mobile category navigation across sporting departments, size and availability filtering, local Pick Up In Store clarity, rewards/account login friction, and checkout behavior across a very large catalog.";
  }

  if (profile.industryProfile?.industry === "marketplace_retail") {
    return "For a large retail or marketplace site, I would not frame this as a basic landing-page issue. I would look at search/departments, mobile filtering, local availability, pickup or delivery clarity, account flow, and checkout behavior across a large catalog.";
  }

  return `For ${websiteHostLabel(profile)}, I would make the review specific by checking the actual visitor path, offer clarity, conversion friction, tracking visibility, and follow-up or checkout handoff instead of treating the earlier framework as a confirmed audit.`;
}

export function buildZoraDiagnosis(profile: ZoraLeadProfile) {
  const areas = joinList(focusAreas(profile));
  const industry = profile.industryProfile?.industry;
  const contextParts = [
    profile.platform ? `on ${profile.platform}` : "",
    profile.annualRevenueText ? `at about ${profile.annualRevenueText}` : "",
  ].filter(Boolean);
  const contextText =
    contextParts.length > 0 ? ` ${contextParts.join(" ")}` : "";

  if (profile.industryStatus === "needs_clarification") {
    return "Thanks. Help me understand the business model a little better before I make another recommendation.";
  }

  if (profile.confirmedIndustry === "domain_registrar") {
    return `Since this is a domain registrar${contextText}, I would focus on ${areas}. The key path is domain search -> registration -> DNS setup -> hosting or email add-ons -> account onboarding -> renewal, transfer, and support guidance.`;
  }

  if (profile.confirmedIndustry === "infrastructure_provider") {
    return `Since this is an infrastructure provider${contextText}, I would focus on ${areas}. The key path is technical evaluation -> account setup -> integration guidance -> usage visibility -> support handoff.`;
  }

  if (profile.confirmedIndustry === "saas_software") {
    return `Since this is a SaaS or software business${contextText}, I would focus on ${areas}. The key path is value proof -> trial or demo -> onboarding -> activation -> expansion or retention.`;
  }

  if (profile.confirmedIndustry === "marketplace") {
    return `Since this is a marketplace${contextText}, I would focus on ${areas}. The key path is helping buyers and sellers understand supply, trust, matching, account flow, and fulfillment or activation.`;
  }

  if (profile.confirmedIndustry === "agency_services") {
    return `Since this is an agency or services business${contextText}, I would focus on ${areas}. The key path is positioning -> proof -> inquiry -> booking -> follow-up ownership.`;
  }

  if (industry === "real_estate") {
    return `Because this looks like a real estate business${contextText}, I would first look at ${areas}. For operations, the key path is inquiry -> agent assignment -> CRM follow-up -> booking -> source tracking.`;
  }

  if (industry === "industrial_b2b_catalog") {
    return `Because this looks like a B2B catalog${contextText}, I would focus on ${areas}. The important path is whether buyers can search, filter, compare specs, and move from product/category pages into cart, quote, or account workflows.`;
  }

  if (industry === "b2b_supply_platform") {
    return `Because this looks like a B2B supply or ecommerce infrastructure platform${contextText}, I would focus on ${areas}. The important path is whether merchants understand the supply network, trust the setup path, connect inventory or tools cleanly, and see enough logistics visibility to keep using the ecosystem.`;
  }

  if (industry === "healthcare_care") {
    return `Because this looks like a care or healthcare services business${contextText}, I would focus on ${areas}. The critical path is service clarity, trust proof, intake requests, referral handoff, response time, and internal routing.`;
  }

  if (industry === "nonprofit_faith_community") {
    return `Because this looks like a faith-based or community organization${contextText}, I would focus on ${areas}. The critical path is online experience -> local campus discovery -> connection form -> small group, serving, or care follow-up.`;
  }

  if (industry === "ecommerce_dtc") {
    return `Because this looks like a DTC ecommerce store${contextText}, I would review ${areas}. The main path is mobile product discovery, product-page confidence, reviews, shipping/returns clarity, checkout trust, tracking, and email/SMS follow-up.`;
  }

  if (industry === "marketplace_retail") {
    return `Because this looks like marketplace or enterprise retail${contextText}, I would review ${areas}. Public-page evidence may be directional, so I would validate search/departments, pickup/delivery, account/cart path, availability, and measurement confidence.`;
  }

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

function buildBusinessModelCorrectionResponse(profile: ZoraLeadProfile) {
  if (profile.industryStatus === "confirmed" && profile.confirmedIndustry) {
    if (profile.confirmedIndustry === "domain_registrar") {
      return "Got it. I will treat this as a domain registrar, not a DTC ecommerce store. Future recommendations should focus on domain registration, DNS setup clarity, hosting or email add-ons, customer onboarding, account management, renewals, transfers, and support handoff.";
    }

    return `Got it. I will treat this as ${profile.confirmedIndustry.replace(/_/g, " ")} and ignore the earlier inferred industry. Future recommendations should use that confirmed business model instead of the previous URL-based guess.`;
  }

  if (profile.industryStatus === "needs_clarification") {
    return "Thanks. Help me understand the business model a little better.";
  }

  if (profile.industryProfile?.industry === "b2b_supply_platform") {
    return "My mistake. I completely misread the architecture. If you are running a B2B supply, dropshipping, or turnkey ecosystem platform rather than a traditional DTC storefront, the strategy changes entirely.\n\nInstead of standard retail product pages, the conversion bottleneck usually lives in merchant acquisition, onboarding friction, integration clarity, supplier logistics visibility, and whether store owners quickly understand how the ecosystem helps them operate.\n\nLet's pivot there. Since this is a platform model, do you lose more people during the initial sign-up workflow, or further down when they try to connect products, inventory, or tools?";
  }

  return "My mistake. I should adjust to your business model instead of repeating my earlier assumption. I will treat your correction as the source of truth and reframe the diagnosis from there.\n\nThanks. Help me understand the business model a little better.";
}

function buildRecommendationRoadmap(profile: ZoraLeadProfile): ZoraRoadmapStep[] {
  if (profile.hasNoWebsite) {
    const isRealEstate = profile.businessType === "Real Estate";
    return [
      {
        title: isRealEstate
          ? "Seller/Buyer Offer Architecture"
          : "Pre-Launch Offer Architecture",
        reason: isRealEstate
          ? "A real estate site should start with a clear seller or buyer promise before design starts."
          : "The first version should be shaped around a clear offer and audience before design starts.",
        validation: isRealEstate
          ? "Map seller versus buyer audience, local proof, valuation or consultation offer, first landing page sections, and the primary CTA."
          : "Map target audience, core offer, first landing page sections, proof needs, and the primary CTA.",
        expectedImpact: isRealEstate
          ? "Give traffic a clear path into a seller or buyer inquiry from day one."
          : "Give launch traffic a clear path instead of sending visitors into a vague first version.",
        costRange: "Scope after strategy review",
        timeline: "1-2 weeks",
      },
      {
        title: isRealEstate
          ? "Booking, CRM, and Source Tracking Plan"
          : "Lead Capture and Follow-Up Plan",
        reason: isRealEstate
          ? "Buyer and seller inquiries need immediate routing, booking clarity, and source tracking from launch."
          : "New inquiries need a clear owner, confirmation path, and follow-up process from the first campaign.",
        validation: isRealEstate
          ? "Define form fields, booking path, CRM routing, source tags, response ownership, and first-response notifications."
          : "Define form fields, booking or intake flow, CRM/email routing, tracking events, response ownership, and launch reporting.",
        expectedImpact: isRealEstate
          ? "Make the first version measurable and ready for seller or buyer traffic."
          : "Make the first version measurable and easier to improve after launch.",
        costRange: "Scope after strategy review",
        timeline: "1-2 weeks",
      },
    ];
  }

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

  if (profile.confirmedIndustry === "domain_registrar") {
    return [
      {
        title: "Domain Search and Registration Flow Review",
        reason:
          "For a registrar, the first growth question is whether visitors can search, compare, choose, and register a domain without confusion or trust loss.",
        validation:
          "Review domain search clarity, TLD suggestions, pricing transparency, availability states, transfer messaging, and registration steps.",
        expectedImpact:
          "Reduce drop-off before account creation and make the first registration path easier to complete.",
        costRange: "$1,000-$3,000",
        timeline: "1-2 weeks",
      },
      {
        title: "DNS, Hosting, and Account Onboarding Review",
        reason:
          "The registrar experience continues after purchase; DNS setup, hosting/email add-ons, renewals, transfers, and support handoff shape retention.",
        validation:
          "Validate DNS setup guidance, account dashboard clarity, hosting/email cross-sell timing, renewal reminders, transfer flows, and support escalation paths.",
        expectedImpact:
          "Improve activation and reduce support friction after a customer registers or transfers a domain.",
        costRange: "$2,000-$5,000",
        timeline: "2-3 weeks",
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

  if (profile.industryProfile?.industry === "nonprofit_faith_community") {
    return [
      {
        title: "Community Path Review",
        reason:
          "Faith-based and community visitors need a simple path from online experience to local connection.",
        validation:
          "Review service times, campus discovery, sermon pathways, connection forms, small group entry points, volunteer routing, and localized follow-up.",
        expectedImpact:
          "Help online visitors become active local participants with less confusion.",
        costRange: "Scope after review",
        timeline: "1-2 weeks",
      },
      {
        title: "Localized Follow-Up Routing",
        reason:
          "Connection forms and volunteer interest lose momentum when they do not reach the right campus or ministry team quickly.",
        validation:
          "Check form destinations, campus assignment, automated email or text follow-up, volunteer application routing, and response ownership.",
        expectedImpact:
          "Improve continuity from online interest to local community engagement.",
        costRange: "Scope after review",
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
  if (profile.confirmedIndustry === "domain_registrar") {
    const roadmap = buildRecommendationRoadmap(profile);
    const first = roadmap[0];
    const second = roadmap[1];

    return [
      `What I would do first: ${first.title}.`,
      `Why: ${first.reason}`,
      `What I would validate: ${first.validation}`,
      `Expected impact: ${first.expectedImpact}`,
      second
        ? `What comes second: ${second.title}. ${second.reason}`
        : "",
      "The next step should be based on the domain registration and account-management path, not the earlier ecommerce assumption.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (profile.trafficIntentCategory === "conversion_rate_optimization") {
    return [
      "I would start with the conversion path, not a visual redesign.",
      "The first things I would check are whether the landing page matches the ad promise, whether product discovery is obvious on mobile, whether checkout introduces surprise or risk, and whether tracking shows where intent drops.",
      "If one of those is weak, more traffic usually just creates more expensive leakage.",
    ].join(" ");
  }

  if (profile.trafficIntentCategory === "website_rebuild") {
    return [
      "I would not start with a full rebuild assumption.",
      "First, I would separate engineering problems from growth system problems: offer clarity, tracking reliability, conversion friction, and implementation scope.",
      "That tells us whether the right move is a focused fix, a staged rebuild, or a deeper systems project.",
    ].join(" ");
  }

  if (profile.trafficIntentCategory === "ai_automation_crm") {
    return [
      "I would start by mapping the intake and follow-up handoff before choosing an AI or CRM tool.",
      "The key question is where customer intent gets lost: form capture, routing, owner assignment, response time, reminders, or reporting.",
      "Automation should clarify ownership and next action, not just add another layer on top of a messy process.",
    ].join(" ");
  }

  if (!hasProfileDiagnosisSignal(profile)) {
    return "I can recommend a roadmap, but I need one business detail first: what type of business is this, and what feels stuck right now?";
  }

  if (profile.industryProfile?.industry === "marketplace_retail") {
    return [
      "My primary recommendation is to audit your customer pathing.",
      "For a footprint of this size, traffic loss rarely comes down to one weak landing page. It is usually a clarity mismatch between visitor intent, product/service availability, account flow, and fulfillment options.",
      "I would validate three things first:",
      "1. Mobile pathing: can a user on a smartphone reach a core action quickly without fighting dense navigation?",
      "2. Intent segmentation: does the page separate immediate pickup, delivery, account, pharmacy, and shopping intent fast enough?",
      "3. Measurement integrity: can the team see where users drop off, or are search, cart, account, and fulfillment paths blended together in reporting?",
      "If you want to turn those assumptions into hard data, the most practical first step is the free audit so the live page can be checked before scoping work.",
    ].join("\n");
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
    profile.hasNoWebsite
      ? "The next step should be based on a clear launch roadmap, not a guessed scope."
      : "The next step should be based on evidence from the live path, not a guessed scope.",
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
    return `For ${step.title}, I would not price it from chat alone. I would first confirm the live path, platform constraints, and business impact, then scope the smallest useful fix or the broader system work if the evidence supports it.`;
  }

  if (/\bhow long|timeline|weeks?|months?|take\b/i.test(message)) {
    return `For ${step.title}, I would not estimate timing before validation. The timeline depends on access, platform constraints, content readiness, and whether the issue is a focused fix or a broader system problem.`;
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

function buildTerminologyResponse(
  profile: ZoraLeadProfile,
  term: ZoraTerminologyTerm | undefined,
) {
  const website = profile.websiteUrl || "the website";
  const domainContext = profile.websiteUrl ? normalizeDomainContext(profile.websiteUrl) : "";

  if (term === "dtc_store") {
    const dswContext = /(^|\s)(stores\s+)?dsw\s+com(\s|$)/i.test(domainContext)
      ? "For stores.dsw.com, the nuance is that DSW carries third-party footwear brands, but the digital experience still uses direct-to-shopper retail mechanics: category browsing, store or product discovery, size and style filtering, availability cues, cart or purchase paths, and mobile decision friction."
      : `For ${website}, I am using that label directionally: if shoppers browse, evaluate, and take action directly on the site, the conversion mechanics are closer to direct retail than to a pure wholesale or distributor model.`;

    return [
      "By DTC store, I mean Direct-to-Consumer: a business sells directly to the end shopper through its own digital storefront or owned customer path instead of only selling through a middleman distributor.",
      dswContext,
      "So the practical diagnostic question is: are shoppers losing momentum in navigation and filters, on product or availability pages, or closer to cart and checkout?",
    ].join("\n\n");
  }

  if (term === "audit") {
    return [
      "An audit is a structured review of the visible customer journey: how visitors arrive, understand the offer, move through the site, take action, and get tracked or followed up with.",
      "For Zora, the free audit means using the website URL as the starting point to look for likely conversion, UX, tracking, and handoff gaps before recommending a fix.",
      "If you want to run it, I just need the website URL you want reviewed.",
    ].join("\n\n");
  }

  if (term === "product_discovery") {
    return [
      "Product discovery means how easily shoppers can find the right product, size, category, brand, location, or option.",
      `For ${website}, I would look at whether search, categories, filters, product cards, and availability cues help visitors narrow choices quickly.`,
      "The diagnostic question is: do visitors get stuck before they find the right item, or after they reach the product/details page?",
    ].join("\n\n");
  }

  if (term === "checkout_trust") {
    return [
      "Checkout trust means whether a shopper feels safe and clear enough to finish the purchase or next step.",
      "That usually comes from visible pricing, delivery or pickup clarity, return policy confidence, payment trust, and no surprise friction late in the path.",
      "The diagnostic question is: do shoppers abandon because of uncertainty, unexpected costs, or technical friction?",
    ].join("\n\n");
  }

  if (term === "tracking_visibility") {
    return [
      "Tracking visibility means knowing which traffic sources, pages, and customer actions are actually creating leads, purchases, appointments, or other valuable outcomes.",
      "Without it, the team can see activity but not which part of the journey is producing business value.",
      "The diagnostic question is: can you see the drop-off by source and page, or only broad traffic totals?",
    ].join("\n\n");
  }

  if (term === "crm_routing") {
    return [
      "CRM routing means sending each inquiry to the right pipeline, owner, status, and follow-up path automatically.",
      "It matters because lead capture is only useful if the business knows who owns the next action.",
      "The diagnostic question is: when a lead comes in, does the right person get the right context immediately?",
    ].join("\n\n");
  }

  if (term === "conversion_path") {
    return [
      "A conversion path is the sequence a visitor follows from landing on the site to taking the desired action.",
      "For ecommerce or retail, that often means landing page, category or search, product or availability detail, cart, checkout, and post-purchase or follow-up.",
      "The diagnostic question is: where does the visitor lose confidence or momentum in that sequence?",
    ].join("\n\n");
  }

  return "Good question. I mean the practical business meaning behind the term, not jargon for its own sake. Tell me which phrase you want me to unpack and I’ll translate it into what it means for the customer journey.";
}

function buildActionIntentResponse(
  profile: ZoraLeadProfile,
  actionIntent: ZoraActionIntent | undefined,
) {
  if (!actionIntent?.isAction) {
    return "What would you like to do next: run the audit, book a strategy call, or ask a question?";
  }

  if (
    actionIntent.actionType === "start_audit" ||
    actionIntent.actionType === "diagnose_growth_system"
  ) {
    if (profile.websiteUrl) {
      return "Absolutely - I'll send you to the free audit with that URL prefilled.";
    }

    return "Yes - what website URL should I use for the audit?";
  }

  if (actionIntent.actionType === "book_strategy_call") {
    return "Absolutely - I'll open the strategy call booking page.";
  }

  if (actionIntent.actionType === "download_pdf") {
    if (!actionIntent.needsMissingContext) {
      return "Absolutely - I'll download the audit PDF.";
    }

    return "Once an audit report is generated, I can help you download the PDF.";
  }

  if (actionIntent.actionType === "open_report") {
    if (!actionIntent.needsMissingContext) {
      return "Absolutely - I'll open the audit report.";
    }

    return "Once an audit report is generated, I can help you open the report.";
  }

  if (actionIntent.actionType === "ask_question") {
    return "Sure - what would you like to ask?";
  }

  return "What would you like to do next?";
}

function actionObjectForIntent(
  profile: ZoraLeadProfile,
  actionIntent: ZoraActionIntent | undefined,
): ZoraResponse["action"] | undefined {
  if (!actionIntent?.isAction) return undefined;

  if (
    (actionIntent.actionType === "start_audit" ||
      actionIntent.actionType === "diagnose_growth_system") &&
    profile.websiteUrl
  ) {
    return { type: "start_audit", url: profile.websiteUrl };
  }

  if (actionIntent.actionType === "book_strategy_call") {
    return { type: "book_strategy_call" };
  }

  if (actionIntent.actionType === "download_pdf" && !actionIntent.needsMissingContext) {
    return { type: "download_pdf" };
  }

  if (actionIntent.actionType === "open_report" && !actionIntent.needsMissingContext) {
    return { type: "open_report" };
  }

  return undefined;
}

function companyBackgroundContextReturn(profile: ZoraLeadProfile) {
  if (profile.hasNoWebsite) {
    return "Back to your situation: since you do not have a live site yet, I would stay on pre-launch architecture: offer clarity, target audience, first landing page structure, lead capture, booking or intake flow, tracking from day one, and CRM/email follow-up.";
  }

  if (profile.businessType && !profile.challenge) {
    return `Back to your situation: you selected ${profile.businessType}. The next useful question is what feels most stuck: traffic, conversion, follow-up, operations, tracking, or not sure.`;
  }

  if (hasProfileDiagnosisSignal(profile)) {
    return `Back to your situation: based on what you've shared, I would stay focused on ${joinList(
      focusAreas(profile),
    )}.`;
  }

  return "What kind of business are you building or improving?";
}

function buildCompanyBackgroundResponse(
  profile: ZoraLeadProfile,
  subtype: ZoraCompanyBackgroundSubtype = "general_company",
  founderSubtype?: ZoraFounderFollowupSubtype,
) {
  const company = OPZIX_COMPANY_PROFILE;
  const founder = company.founder;
  let answer: string;

  switch (subtype) {
    case "owner":
      answer = `${company.ownershipStatement} ${company.whatOpzixDoes}`;
      break;
    case "ceo":
      answer = `${company.companyName} is led by ${founder.name}, also known as Max, the ${founder.title} behind the platform. ${founder.founderStatement}`;
      break;
    case "founder":
      answer =
        founderSubtype === "background" || founderSubtype === "experience"
          ? `${founder.name}, also known as Max, is the ${founder.title} of ${company.companyName}. He is a ${founder.background} focused on ${joinList(founder.expertise)}.`
          : `${founder.name}, also known as Max, is the ${founder.title} of ${company.companyName}. He is a ${founder.background}.`;
      break;
    case "legitimacy":
      answer = `Yes, ${company.companyName} is a real independent company, and ${company.launchStage} You can find it at ${company.domain}. ${company.philosophy}`;
      break;
    case "what_is_opzix":
      answer = `${company.companyName} is an ${company.positioning}. ${company.whatOpzixDoes}`;
      break;
    case "who_are_you":
      answer = `You're talking to Zora, ${company.companyName}'s AI Growth Consultant. ${company.companyName} is an ${company.positioning} at ${company.domain}.`;
      break;
    case "general_company":
    default:
      answer = `${company.companyName} is an ${company.positioning}. ${company.ownershipStatement}`;
      break;
  }

  return `${answer}\n\n${companyBackgroundContextReturn(profile)}`;
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
    return `${profile.visitorName ? `You're welcome, ${profile.visitorName}.` : "You're welcome."} Since there is no live site yet, the best next step is a strategy call to map the first landing page, offer, follow-up path, and launch timeline.`;
  }

  return `${profile.visitorName ? `You're welcome, ${profile.visitorName}.` : "You're welcome."} When you're ready, the next best step is either the free audit for a website-based diagnosis or a strategy call for planning the system.`;
}

function buildAcknowledgementResponse(profile: ZoraLeadProfile) {
  if (profile.scannerBlocked) {
    return "Exactly. Since the automated scan is blocked here, the useful next step is a manual strategy review instead of repeating the same audit path.";
  }

  if (profile.currentTopic) {
    const label = topicLabel(profile.currentTopic);
    const depth = Math.max(profile.currentTopicDepth || 1, 2);
    const insight =
      industryDeepeningInsight({ ...profile, currentTopicDepth: depth }, depth) ||
      topicDepthInsight(profile.currentTopic, depth);

    return [
      `Exactly. The reason I'd stay on ${label} is that it determines whether the rest of the funnel has a fair chance.`,
      insight ||
        "If this part is unclear, the next steps in the journey inherit that confusion and become harder to diagnose.",
      "Do you want me to explain what I'd check on the page, or how I'd fix it?",
    ].join(" ");
  }

  if (profile.hasNoWebsite) {
    return "Exactly. Since there is no live site yet, the focus shifts to pre-launch growth strategy: landing page architecture, the core offer, lead capture, follow-up, and tracking from day one. The best next step is a strategy call to map the launch timeline.";
  }

  if (profile.websiteUrl) {
    return "Glad that resonated. Since I have your URL and we have isolated the core focus, the cleanest next step is to get actual data from the live page with the free audit, or map the broader system manually on a strategy call.";
  }

  return "Glad that makes sense. The next useful step is to anchor this to a live URL if one exists, or map the business system first if the site is not ready yet.";
}

function buildPostRecommendationAcknowledgementResponse(
  profile: ZoraLeadProfile,
  acknowledgementCount: number,
) {
  if (profile.scannerBlocked) {
    return acknowledgementCount > 1
      ? "Would you like to book a strategy call so we can review the site manually?"
      : "Glad that makes sense. Since the automated scanner is blocked for this domain, the next step is a manual strategy review rather than another audit attempt.";
  }

  if (profile.hasNoWebsite) {
    return acknowledgementCount > 1
      ? "Would you like to book a strategy call to map the launch blueprint?"
      : "Glad that makes sense. Since there is no live site to audit yet, the next step is to map the implementation plan on a strategy call.";
  }

  return acknowledgementCount > 1
    ? "Would you like to run the audit now or book a strategy call?"
    : "Glad that makes sense. The next step is either to validate it with the free audit or map the implementation plan on a strategy call.";
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
  if (isFreeAuditPricingQuestion(message)) {
    if (profile.hasNoWebsite) {
      return "Yes, it is free once there is a live page to review. Since you are pre-launch, the better next step is mapping the landing page architecture, core offer, lead capture, follow-up, and tracking before you spend on traffic.";
    }

    if (profile.websiteUrl) {
      return "The audit is completely free. We use an automated scanner to pinpoint visible leaks on your site because Opzix believes in showing value upfront before discussing a project.";
    }

    return "Yes, the audit is 100% free. If you have a live URL, the scanner maps public-page blind spots in about 60 seconds so you have a data-backed starting point.";
  }

  if (profile.recommendationRoadmap?.length && isRoadmapSpecificFollowUp(message)) {
    return buildRoadmapFollowUpResponse(message, profile.recommendationRoadmap);
  }

  if (profile.trafficIntentCategory === "website_rebuild") {
    return "Cost depends on three layers: strategy, implementation scope, and business risk. Before pricing a rebuild, I would separate what actually needs engineering from what needs offer clarity, tracking cleanup, conversion-path improvement, or better operational handoff.";
  }

  if (profile.trafficIntentCategory === "ai_automation_crm") {
    return "Cost depends on how much of the intake, CRM routing, follow-up, and reporting process needs to be designed before automation is useful. The expensive mistake is automating a messy handoff before the ownership rules are clear.";
  }

  return `${greetingPrefix(profile)}For paid work, I would not give a serious price before understanding the platform, implementation depth, and business impact. The free audit is the best first step when there is a live URL; a strategy call is better when the question is broader than the visible website.`;
}

function buildClarifyingResponse(profile: ZoraLeadProfile = {}) {
  if (profile.businessType && !profile.challenge) {
    return `You selected ${profile.businessType}. What's the biggest challenge right now: getting traffic, converting visitors, lead follow-up, operations, tracking, or not sure?`;
  }

  return buildOpzixBrainLowConfidenceFallback().message;
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
    zoraIndustryConfidenceScore(profile.industryConfidence) < 0.7
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

function buildScannerFailureResponse(profile: ZoraLeadProfile) {
  const site = websiteHostLabel(profile);
  const reason = profile.scannerBlockedReason || "anti-bot protection";

  return [
    `That makes sense. ${site === "this website" ? "This domain" : site} appears to be blocking automated access with ${reason}, so I would not keep pushing the free audit for this domain.`,
    `${enterpriseRetailSpecifics(profile)} Because the automated scanner cannot read the page cleanly, the better path is a manual strategy review where we inspect the key flows directly.`,
  ].join(" ");
}

function buildTrustSkepticismResponse(profile: ZoraLeadProfile) {
  const scannerContext = profile.scannerBlocked
    ? " The automated scan is also blocked on this domain, so I should not pretend that framework came from a completed scanner run."
    : " I do not have your internal analytics or a completed scanner result in this chat, so I should keep the recommendation directional until we validate it.";

  return [
    "You're right to call that out.",
    `That was a high-level structural framework, not a fully tailored website-specific audit.${scannerContext}`,
    enterpriseRetailSpecifics(profile),
    profile.scannerBlocked
      ? "The honest next step is a manual strategy review, not another generic checklist or another scanner CTA."
      : "The honest next step is to validate those assumptions against the actual page path before treating them as findings.",
  ].join(" ");
}

function buildAuditRequestResponse(profile: ZoraLeadProfile, message = "") {
  if (profile.scannerBlocked) {
    return buildScannerFailureResponse(profile);
  }

  if (isAuditInformationIntent(message)) {
    if (profile.hasNoWebsite) {
      return "The audit is for live websites, so it is not the right tool before the site exists. For now, the better path is mapping the launch blueprint: offer, page path, lead capture, follow-up, and tracking.";
    }

    return "The free audit reviews public website signals like page clarity, conversion friction, tracking visibility, technical reliability, and customer-journey gaps. It is meant to turn assumptions into a practical improvement roadmap before you spend money on redesigns, ads, or automation.";
  }

  if (profile.hasNoWebsite) {
    return "Since there is no live site yet, the best next step is a strategy call to map the first version, core offer, landing page path, and follow-up plan.";
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

function strategicTopicForProfile(profile: ZoraLeadProfile): ZoraTopic {
  if (profile.challenge === "Tracking") return "tracking_visibility";
  if (profile.challenge === "Follow-up") return "follow_up_handoff";
  if (profile.challenge === "Website") return "landing_page";
  if (profile.businessType === "Ecommerce" && profile.challenge === "Conversion") {
    return profile.funnelStage === "Checkout" || profile.dropoffDetail
      ? "checkout_confidence"
      : "product_discovery";
  }
  if (profile.businessType === "Real Estate") {
    return profile.leadSource ? "offer_clarity" : "lead_capture";
  }
  if (profile.businessType === "Care/Healthcare") return "lead_capture";
  if (profile.businessType === "Service Business") return "lead_capture";
  return "offer_clarity";
}

function buildStrategyReviewResponse(profile: ZoraLeadProfile) {
  const business = profile.businessType
    ? businessContextLabel(profile.businessType)
    : "this business";
  const urlContext = profile.websiteUrl ? ` using ${profile.websiteUrl} as context` : "";
  const leadSourceContext = profile.leadSource
    ? ` Since you mentioned ${profile.leadSource.toLowerCase()}, I would treat the traffic source and landing path as one connected system.`
    : "";

  if (profile.businessType === "Real Estate") {
    return [
      `Based on the context you've given me${urlContext}, I would review this as a real-estate lead-generation strategy, not as a confirmed audit finding.`,
      `What stands out: the strategy should separate buyer, seller, local-search, and brand-intent visitors instead of pushing everyone into the same generic path.${leadSourceContext}`,
      "What I'd question: whether visitors can quickly tell which path fits them, why this team is credible in that market, and what happens after they submit or book.",
      "What I'd validate: landing page promise, local proof, seller/buyer CTAs, form or booking flow, source tracking, and CRM follow-up ownership.",
      "What good looks like: organic, referral, or paid visitors land on a clear path, see proof that matches their intent, and enter a follow-up process that preserves the source and lead type.",
      "Most likely bottleneck: unclear lead path or weak handoff between visitor intent, capture action, and follow-up.",
    ].join("\n");
  }

  if (profile.businessType === "Ecommerce") {
    return [
      `Based on the context you've given me${urlContext}, I would review the strategy directionally before treating anything as a scanner-confirmed finding.`,
      "What stands out: the key question is whether traffic can move from intent to product confidence to checkout without unnecessary friction.",
      "What I'd question: whether the landing page matches the traffic promise, whether shoppers can find the right product quickly, and whether checkout introduces late doubt.",
      `What I'd validate: ${joinList(focusAreas(profile))}.`,
      "What good looks like: the path from first click to product decision to checkout feels obvious, trustworthy, and measurable.",
      "Most likely bottleneck: conversion-path friction or mismatched visitor intent.",
    ].join("\n");
  }

  return [
    `Based on the context you've given me${urlContext}, I would review the ${business} strategy as a directional consultant opinion, not a completed audit.`,
    "What stands out: the next move should be chosen from the customer journey, not from a generic service menu.",
    "What I'd question: where the visitor raises their hand, how the team follows up, and whether tracking shows which source produced qualified demand.",
    `What I'd validate: ${joinList(focusAreas(profile))}.`,
    "What good looks like: the offer, capture step, follow-up owner, and reporting view all agree on the same next action.",
    "Most likely bottleneck: customer journey clarity or follow-up handoff.",
  ].join("\n");
}

function buildReviewRequestResponse(profile: ZoraLeadProfile, message = "") {
  if (isManualStrategyReviewRequest(message)) {
    return buildStrategyReviewResponse(profile);
  }

  if (profile.hasNoWebsite) {
    return "Based on the context you've given me, I would review this as a pre-launch strategy. Directionally, I would look at the first offer, landing page structure, lead capture path, follow-up ownership, and launch tracking before you spend on traffic.";
  }

  if (!profile.websiteUrl) {
    return "I can give you an initial opinion, but I need the website URL first. I will keep it directional unless we run the audit.";
  }

  const industry = profile.industryProfile?.industry;
  const business = profile.businessType
    ? businessContextLabel(profile.businessType)
    : industry
      ? industry.replace(/_/g, " ")
      : "business";
  const context = [
    `URL: ${profile.websiteUrl}`,
    profile.businessType ? `business type: ${business}` : "",
    profile.challenge ? `stated challenge: ${profile.challenge.toLowerCase()}` : "",
  ]
    .filter(Boolean)
    .join(", ");

  const likelyBottleneck =
    profile.challenge === "Follow-up"
      ? "lead capture to follow-up handoff"
      : profile.challenge === "Tracking"
        ? "measurement visibility"
        : profile.challenge === "Conversion"
          ? "visitor confidence and conversion path friction"
          : industry === "marketplace_retail"
            ? "intent routing between search, account, pickup/delivery, and availability"
            : industry === "industrial_b2b_catalog"
              ? "product discovery into quote/cart/account workflows"
              : industry === "healthcare_care"
                ? "trust, intake clarity, and response routing"
                : "customer journey clarity";

  return [
    `Based on the context you've given me (${context}), I can give you a directional review without claiming the audit has run.`,
    `What stands out: this looks like ${business} context, so I would judge the page by how quickly it helps the visitor understand the next useful action.`,
    `What I'd question: whether the page is matching the visitor's intent clearly enough, and whether the team can see what happens after that visitor takes action.`,
    `What I'd validate: ${joinList(focusAreas(profile))}. Without running the audit yet, I would treat those as hypotheses, not confirmed findings.`,
    "What good looks like: the visitor sees the right path quickly, the CTA matches their intent, and tracking or follow-up makes the next step visible to the business.",
    `Most likely bottleneck: ${likelyBottleneck}.`,
  ].join("\n");
}

function buildLeadSourceResponse(profile: ZoraLeadProfile) {
  const source = profile.leadSource?.toLowerCase() || "that source";
  const websiteContext = profile.websiteUrl
    ? ` I can use ${profile.websiteUrl} as context, but I would still treat this as directional until the audit or a manual review confirms it.`
    : "";

  if (profile.businessType === "Real Estate") {
    return [
      `That helps. For real estate traffic from ${source}, I would look at the match between the searcher's intent and the first page they land on.${websiteContext}`,
      "What stands out: organic visitors usually arrive with a very specific question, such as neighborhood fit, home value, agent credibility, or available listings.",
      "What I'd validate: whether the page separates buyer versus seller intent, shows local proof quickly, makes the next action clear, and preserves the lead source in the CRM.",
      "What good looks like: the visitor lands on a path that matches their intent and the team can see whether that lead came from organic search, referral, ads, or social.",
      "Recommended next step: review the highest-traffic entry page and the first lead-capture or booking step before changing traffic strategy.",
    ].join("\n");
  }

  if (profile.businessType === "Service Business" || profile.businessType === "Care/Healthcare") {
    return [
      `That helps. If leads are coming from ${source}, I would check whether the page and follow-up process match that visitor's urgency.${websiteContext}`,
      "What I'd validate: service promise, trust proof, form friction, response ownership, source tracking, and missed-lead recovery.",
      "Recommended next step: map the first inquiry path from source to follow-up before buying more traffic.",
    ].join("\n");
  }

  return `${buildZoraDiagnosis(profile)} ${followUpQuestion(profile)}`;
}

function scannerHrefForProfile(profile: ZoraLeadProfile) {
  if (!profile.websiteUrl) return undefined;

  return `/tools/ecommerce-audit-scanner?source=zora&url=${encodeURIComponent(
    profile.websiteUrl,
  )}`;
}

function buildScannerExecutionResponse(profile: ZoraLeadProfile) {
  if (profile.scannerBlocked) {
    return buildScannerFailureResponse(profile);
  }

  if (profile.hasNoWebsite) {
    return "There is no live site to scan yet. The right next step is a strategy call to map the launch blueprint.";
  }

  if (!profile.websiteUrl) {
    return "What website should I scan?";
  }

  return "Initiating the technical architecture scan for your domain now. Standby for the roadmap.";
}

function buildHandoffResponse(
  profile: ZoraLeadProfile,
  message: string,
  previousStage?: ZoraConversationStage,
) {
  if (profile.hasNoWebsite) {
    if (isHandoffExecutionMessage(message)) {
      return "Perfect. Since there is no live site yet, the next step is a strategy call to map the pre-launch blueprint and launch timeline.";
    }

    return "Great. Since there is no live site yet, the next step is mapping the pre-launch blueprint: offer, landing page structure, lead capture, follow-up, tracking, and launch timeline.";
  }

  if (isHandoffExecutionMessage(message)) {
    if (profile.websiteUrl) {
      return `Perfect. I'll use ${profile.websiteUrl} as the starting point.`;
    }

    return "Perfect. What website URL should I use as the starting point?";
  }

  if (previousStage === "recommendation") {
    return "Great. The next step is turning these assumptions into data. Would you like to run the audit or review the strategy manually?";
  }

  if (previousStage === "next_step") {
    return "Would you like to run the audit or review the strategy manually?";
  }

  if (profile.websiteUrl) {
    return "Great. We have enough context to move forward. Would you like to run the audit or review the strategy manually?";
  }

  return "Great. To move forward cleanly, I need the website URL for an audit, or we can review the strategy manually.";
}

function buildBookingRequestResponse(profile: ZoraLeadProfile) {
  return `${greetingPrefix(profile)}A strategy call is the best next step if you want help deciding what to fix first and what scope makes sense.`;
}

function buildNoWebsiteResponse() {
  return "Got it. Since there is no live site yet, the focus shifts to pre-launch growth strategy: landing page architecture, the core offer, lead capture, follow-up, tracking, and launch timeline.";
}

function buildRealEstateLeadSystemResponse(profile: ZoraLeadProfile) {
  const source = profile.leadSource || "Zillow and organic traffic";
  const launchContext = profile.hasNoWebsite
    ? " Since you do not have a website yet, I would treat this as a lead engine from scratch, not just a website build."
    : "";

  return [
    `That gives us a strong blueprint to build from.${launchContext} For a real estate business using ${source}, the goal is not a pretty brochure site; it is an automated lead capture, validation, and nurture system.`,
    "The biggest leak is response latency. Zillow and portal leads are volatile, and organic visitors are usually comparing agents, neighborhoods, or listing options. If a lead waits hours for a response, they often book with someone else.",
    "What I would architect first: a focused buyer/seller landing path, localized proof, a high-utility capture offer such as a valuation, neighborhood guide, or showing request, and form or calendar routing into a CRM like Follow Up Boss, HubSpot, KVCore, or a similar pipeline.",
    "The system should trigger an SMS/email follow-up within about 60 seconds, tag the source as Zillow or organic, qualify budget/timeline/location, and route serious buyers or sellers directly toward your calendar while filtering weaker leads in the background.",
    "Recommended next step: map the lead flow from source -> landing page -> CRM -> instant follow-up -> booked appointment. Since this is pre-launch architecture, a strategy call is the cleanest way to sketch the data flow before design starts.",
  ].join("\n");
}

function buildConsultantResponse(profile: ZoraLeadProfile, message: string) {
  if (
    profile.recommendationRoadmap?.length &&
    isRoadmapFollowUp(message) &&
    isRoadmapSpecificFollowUp(message)
  ) {
    return buildRoadmapFollowUpResponse(message, profile.recommendationRoadmap);
  }

  if (isStrategyCallInformationQuestion(message)) {
    return [
      "A strategy call is useful when you need to understand whether the issues in your website, funnel, tracking, follow-up, or operations are actually affecting revenue or lead quality.",
      "The point is not just to book time on a calendar. It is to review the context, identify the highest-impact bottleneck, and decide whether the right next step is a focused fix, a fuller system build, or no major build yet.",
      "During the call, we would usually look at the audit context or your current customer path, map where momentum is leaking, and turn that into a practical priority order. Some businesses only need a few targeted improvements; others uncover disconnected systems that need a clearer roadmap.",
      "I can also explain what happens during the call or help interpret your audit results.",
    ].join("\n\n");
  }

  if (
    (profile.businessType === "Real Estate" || isRealEstateLeadSystemInquiry(message)) &&
    isRealEstateLeadSystemInquiry(message)
  ) {
    return buildRealEstateLeadSystemResponse(profile);
  }

  if (
    profile.hasNoWebsite &&
    /\b(build|create|launch|make)\s+(?:one|it|a\s+website|a\s+site|a\s+landing page|new website|new site|new landing page)\b/i.test(
      message,
    )
  ) {
    return "Since you do not have a website yet, I would treat this as pre-launch architecture, not a redesign. The first step is mapping the offer, target audience, first landing page structure, lead capture, booking or intake flow, tracking from day one, and CRM/email follow-up before design starts.";
  }

  if (/\bshopify\b.+\bbigcommerce\b|\bbigcommerce\b.+\bshopify\b/i.test(message)) {
    return "Shopify is usually the cleaner path for DTC stores that need speed, app ecosystem, and simpler operations. BigCommerce can make sense for more complex catalogs, B2B pricing, multi-store needs, or tighter backend requirements. The right choice depends on catalog complexity, checkout rules, integrations, team workflow, and how much control you need over operations.";
  }

  if (/\b(should i run ads|run ads|ads|advertising|scale traffic)\b/i.test(message)) {
    if (profile.hasNoWebsite) {
      return "Since there is no live site yet, I would not start with ads. I would first map the offer, target audience, landing page structure, lead capture, tracking from day one, and follow-up path so traffic has somewhere clear to go.";
    }

    return "What this means: ads only help when the path after the click can convert and follow up. Traffic flows into conversion, then follow-up, then operations.\nWhat I would check: landing-page match, offer clarity, mobile path, tracking, and whether leads or carts are handled quickly.\nWhy it matters: more traffic will not solve conversion leaks; it usually makes the leak more expensive.\nRecommendation: if conversion is weak, fix the site path first. If conversion is strong, scale traffic. If leads exist but close rate is weak, fix follow-up and operations before buying more traffic.";
  }

  if (isWebsiteBuildOrRebuildQuestion(message)) {
    if (profile.hasNoWebsite) {
      return "Since you do not have a website yet, I would treat this as pre-launch architecture, not a redesign. The first step is mapping the offer, target audience, first landing page structure, lead capture, booking or intake flow, tracking from day one, and CRM/email follow-up before design starts.";
    }

    if (profile.businessType === "Real Estate") {
      return "For a real estate business, I would not start with a generic new website. I would scope the site around the lead path: seller or buyer offer, local proof, valuation or consultation CTA, fast follow-up, source tracking, and a page structure that supports ads, organic search, and referrals. The first decision is whether you need a focused landing path or a fuller brand/site rebuild. A strategy call is usually the better next step for scoping that before treating it like a fixed website project.";
    }

    return "What this means: I would compare cost to improve against cost to replace before recommending a rebuild.\nWhat I would check: platform limits, technical debt, page/template constraints, tracking gaps, integration needs, and whether the current site blocks growth.\nWhy it matters: a rebuild is only worth it when the architecture is limiting the business, not just because the site feels imperfect.\nRecommendation: default to a focused fix first. Consider rebuild only if platform limitations, severe technical debt, or architecture constraints are confirmed.";
  }

  if (/\b(audit process|how does the audit|free audit|audit work)\b/i.test(message)) {
    if (profile.hasNoWebsite) {
      return "What this means: the live-page review comes later, once there is a page to evaluate.\nWhat I would map first: landing page structure, core offer, lead capture, follow-up ownership, and launch tracking.\nWhy it matters: pre-launch planning prevents you from sending traffic into an unclear path.\nRecommendation: start with a strategy call to shape the first version before spending on traffic.";
    }

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

function buildConsultingKnowledgeResponse(
  profile: ZoraLeadProfile,
  message: string,
  concept?: OpzixBrainConcept,
) {
  const activeConcept =
    concept || profile.detectedConcept || toConsultingConcept(profile.currentSubtopic);

  if (isConsultingExperienceQuestion(message)) {
    return buildConsultingExperienceAnswer({
      concept: activeConcept,
      websiteUrl: profile.websiteUrl,
    });
  }

  if (!activeConcept) {
    return buildConsultantResponse(profile, message);
  }

  return buildOpzixBrainAnswer({
    concept: activeConcept,
    industry: zoraIndustryForBrain(profile),
    businessType: profile.businessType,
    challenge: profile.challenge,
    websiteUrl: profile.websiteUrl,
    topicDepth: profile.currentTopicDepth,
  }).message;
}

function zoraIndustryForBrain(profile: ZoraLeadProfile): OpzixBrainIndustry | undefined {
  if (isKnownBrainIndustry(profile.industryProfile?.industry)) {
    return profile.industryProfile.industry;
  }
  if (isKnownBrainIndustry(profile.confirmedIndustry)) return profile.confirmedIndustry;
  if (isKnownBrainIndustry(profile.industry)) return profile.industry;
  return undefined;
}

function isKnownBrainIndustry(value: unknown): value is OpzixBrainIndustry {
  return (
    value === "ecommerce_dtc" ||
    value === "industrial_b2b_catalog" ||
    value === "marketplace_retail" ||
    value === "real_estate" ||
    value === "healthcare_care" ||
    value === "service_business" ||
    value === "local_service" ||
    value === "education" ||
    value === "restaurant_hospitality" ||
    value === "unknown"
  );
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

function topicDisplayLabel(profile: ZoraLeadProfile, topic: ZoraTopic) {
  if (profile.industryProfile?.industry === "nonprofit_faith_community") {
    if (topic === "lead_capture") return "connection path";
    if (topic === "follow_up_handoff") return "localized follow-up";
    if (topic === "offer_clarity") return "community invitation";
  }

  return topicLabel(topic);
}

function topicResponseParts(profile: ZoraLeadProfile, topic: ZoraTopic) {
  const business = businessShortLabel(profile);
  const industry = profile.industryProfile?.industry;

  if (industry === "real_estate" && topic === "offer_clarity") {
    return {
      happening:
        "The page may not be separating buyer, seller, valuation, and agent-brand intent clearly enough for a visitor to know which path fits them.",
      matters:
        "Real estate visitors usually arrive with a specific intent. If the path is too general, qualified buyers or sellers hesitate before they ever become a lead.",
      validate:
        "I would validate buyer versus seller CTAs, valuation flow, local proof, listing authority, booking options, and how each inquiry enters the CRM.",
      good:
        "A good real estate path makes the visitor's role obvious, proves local credibility quickly, and routes the lead to the right follow-up owner.",
      next:
        "I would review the hero, buyer/seller segmentation, valuation CTA, agent or market proof, booking flow, and CRM/source tracking.",
    };
  }

  if (industry === "real_estate" && topic === "lead_capture") {
    return {
      happening:
        "Interested buyers or sellers may not have a specific enough path to raise their hand, so high-intent visitors can leave without becoming trackable leads.",
      matters:
        "Real estate leads are time-sensitive and intent-specific. A generic contact path makes it harder to separate seller valuation intent, buyer search intent, and general brand inquiries.",
      validate:
        "I would validate seller versus buyer CTAs, valuation or consultation forms, appointment paths, call buttons, source capture, and CRM assignment.",
      good:
        "Good real estate lead capture makes the visitor's role obvious, asks only for useful routing context, and sends the lead to the right follow-up owner quickly.",
      next:
        "I would review the primary CTA, valuation path, contact or booking form, mobile call path, confirmation message, and CRM/source fields.",
    };
  }

  if (industry === "healthcare_care" && topic === "lead_capture") {
    return {
      happening:
        "Families, referral partners, or potential clients may not have a clear, reassuring way to ask for help or start intake.",
      matters:
        "In care and healthcare services, trust and response clarity matter as much as the form itself. Unclear intake can delay high-intent inquiries.",
      validate:
        "I would validate service eligibility, referral paths, intake questions, privacy-safe messaging, confirmation copy, response ownership, and follow-up timing.",
      good:
        "Good intake feels simple, respectful, and specific enough for the team to route the request without adding unnecessary friction.",
      next:
        "I would review service pages, request-care CTAs, referral forms, confirmation messages, routing rules, and missed-inquiry recovery.",
    };
  }

  if (industry === "healthcare_care" && topic === "follow_up_handoff") {
    return {
      happening:
        "Patient or care inquiries may be entering the system, but the handoff from digital intake into scheduling, coordination, or referral follow-up may be too slow or unclear.",
      matters:
        "In healthcare, delay feels like risk. If an appointment request or care inquiry sits unresolved, patients often call another provider or facility before the team responds.",
      validate:
        "I would validate appointment request routing, provider or location assignment, patient coordinator alerts, HIPAA-aware form handling, response-time tracking, and missed-request escalation.",
      good:
        "Good healthcare follow-up routes each intake request to the right team quickly, preserves patient context, and makes ownership visible without exposing sensitive information unnecessarily.",
      next:
        "I would review intake forms, appointment CTAs, provider-directory handoff, scheduling-center alerts, confirmation messages, and response-time reporting.",
    };
  }

  if (industry === "nonprofit_faith_community" && topic === "lead_capture") {
    return {
      happening:
        "A new visitor may be inspired online but still lack a clear path into a local campus, small group, volunteer opportunity, or care request.",
      matters:
        "Community momentum depends on immediacy. If someone has to dig through internal pages to find service times, campus details, or the right connection form, their intent can fade before they take a physical next step.",
      validate:
        "I would validate campus discovery, service times, sermon-to-campus paths, connection forms, small group entry points, volunteer interest forms, and localized follow-up.",
      good:
        "A good connection path makes the next step obvious and routes each person toward the right local community touchpoint quickly.",
      next:
        "I would review the homepage, campus finder, service times, connection forms, group sign-up, volunteer routing, and first follow-up message.",
    };
  }

  if (industry === "nonprofit_faith_community" && topic === "follow_up_handoff") {
    return {
      happening:
        "Connection forms or volunteer interest may be submitted, but the routing into a campus, group, ministry, or care team may be delayed or unclear.",
      matters:
        "If follow-up does not happen quickly, online momentum can collapse before the visitor becomes part of the local community.",
      validate:
        "I would validate form destinations, campus assignment, ministry ownership, automated email or text follow-up, volunteer application routing, and response timing.",
      good:
        "Good localized follow-up sends each request to the right owner and gives the visitor a clear next step within a day.",
      next:
        "I would review connection-form routing, campus assignment rules, volunteer workflows, confirmation messages, and local follow-up timing.",
    };
  }

  if (industry === "nonprofit_faith_community" && topic === "offer_clarity") {
    return {
      happening:
        "The site may not be making the primary invitation clear enough for a first-time visitor, online viewer, or local family.",
      matters:
        "People arrive with different intents: watch a sermon, find a campus, get help, join a group, serve, or give. If the invitation is fragmented, momentum slows.",
      validate:
        "I would validate first-time visitor paths, campus CTAs, service times, sermon pathways, youth or family programs, group sign-up, and volunteer next steps.",
      good:
        "A good community invitation helps someone understand where they fit and what to do next without decoding internal structure.",
      next:
        "I would review top navigation, homepage CTAs, campus pages, sermon pages, connection forms, and group or volunteer entry points.",
    };
  }

  if (industry === "industrial_b2b_catalog" && topic === "product_discovery") {
    return {
      happening:
        "Buyers may know the part, spec, or category they need, but the site may make them work too hard to find and compare it.",
      matters:
        "B2B catalog friction can look like low demand, but the real issue is often search, filtering, specs, or the path from product research into quote/cart/account workflows.",
      validate:
        "I would validate SKU search, category taxonomy, filters, specs, datasheets, product-card detail, availability, quote/cart path, and account purchasing flow.",
      good:
        "Good B2B discovery lets a buyer move from need to exact item quickly and gives enough detail to proceed without calling for basic clarification.",
      next:
        "I would review top categories, internal search, filters, product templates, spec visibility, and the quote/cart/account handoff.",
    };
  }

  if (industry === "marketplace_retail" && topic === "tracking_visibility") {
    return {
      happening:
        "The public experience may show only part of the journey, so measurement needs to separate search, availability, cart/account, pickup, delivery, and checkout signals.",
      matters:
        "Large retail paths contain many micro-decisions. If they are measured as one blended conversion path, teams can miss the actual bottleneck.",
      validate:
        "I would validate search and department events, availability interactions, pickup/delivery selection, account/cart transitions, checkout events, and reporting consistency.",
      good:
        "Good retail tracking shows where intent appears, where it slows down, and whether the issue is product availability, path clarity, account friction, or checkout.",
      next:
        "I would review event coverage by journey stage, not just final conversion reporting.",
    };
  }

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

function deepeningFrameworkForProfile(profile: ZoraLeadProfile) {
  const industry = profile.industryProfile?.industry;
  const text = [
    profile.industry,
    profile.desiredOutcome,
    profile.trafficIntentText,
    profile.leadSource,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (
    profile.businessType === "Care/Healthcare" ||
    industry === "healthcare_care" ||
    /\b(healthcare|care|medical|hospital|clinic|patient|patients|provider|practitioner|appointment|intake)\b/i.test(text)
  ) {
    return "healthcare_care_services";
  }

  if (
    industry === "nonprofit_faith_community" ||
    /\b(church|ministry|ministries|faith|nonprofit|non profit|community organization|campus|sermon|worship|small group|volunteer|serve|donate|giving)\b/i.test(text)
  ) {
    return "nonprofit_faith_community";
  }

  if (
    industry === "marketplace_retail" ||
    industry === "local_service" ||
    /\b(multi[-\s]?location|pharmacy|regional|hybrid retail|store locations?|pickup|local availability)\b/i.test(text)
  ) {
    return "hybrid_enterprise_retail";
  }

  if (
    profile.businessType === "Service Business" ||
    industry === "industrial_b2b_catalog" ||
    /\b(b2b|saas|consulting|logistics|commercial|agency|professional services?)\b/i.test(text)
  ) {
    return "b2b_lead_gen";
  }

  if (
    profile.businessType === "Ecommerce" ||
    industry === "ecommerce_dtc" ||
    /\b(high ticket|high-ticket|luxury|custom furniture|complex hardware|premium)\b/i.test(text)
  ) {
    return "high_ticket_ecommerce";
  }

  return undefined;
}

function industryDeepeningInsight(profile: ZoraLeadProfile, depth = 1) {
  const framework = deepeningFrameworkForProfile(profile);

  if (!framework) return "";

  const level = depth >= 3 ? 3 : depth >= 2 ? 2 : 1;

  if (framework === "healthcare_care_services") {
    if (level === 1) {
      return "Industry lens: for large healthcare organizations and care facilities, our growth audit focuses heavily on patient intake flows, provider directory navigation, digital appointment friction, HIPAA-compliant lead routing, and response time latency.";
    }

    if (level === 2) {
      return "Deeper lens: the biggest conversion barrier in healthcare is patient friction and trust shock. When a patient is seeking care, they are often stressed or anxious. If an intake portal or appointment booking flow requires too much information before showing provider availability, they abandon the screen and look for another local facility.";
    }

    return "System diagnosis: in care systems, the growth leak usually happens in the handoff between a digital form submission and the scheduling center's internal routing. If an online appointment request does not feed into a central patient coordination system with internal alerting, the request can fall into an email black hole and lose urgency fast.";
  }

  if (framework === "nonprofit_faith_community") {
    if (level === 1) {
      return "Community lens: for large organizations and faith-based communities, the bottleneck is digital-to-physical pathing: how smoothly a new visitor goes from streaming an experience online to connecting with a local campus, joining a small group, or signing up to serve.";
    }

    if (level === 2) {
      return "Deeper lens: the biggest breakdown in digital ministries is intent fragmentation. People are looking for immediate connection, whether that is finding a campus near them, watching a sermon, or getting their kids into youth programs. If the homepage makes them dig through internal ministry pages to find service times or local campus details, momentum breaks before they take a physical next step.";
    }

    return "System diagnosis: engagement leaks in non-profits typically happen in the digital onboarding infrastructure. If an online connection form or volunteer application does not instantly route to a central automated database that triggers localized email or text follow-up within 24 hours, engagement collapses. The site should act as an activation engine, moving an online viewer into active physical community participation.";
  }

  if (framework === "high_ticket_ecommerce") {
    if (level === 1) {
      return "Industry lens: for high-ticket e-commerce, we have to validate product page social proof, deep feature specs, and checkout financing clarity.";
    }

    if (level === 2) {
      return "Deeper lens: the core barrier is skepticism and financial friction. When an item costs $500+, a cold visitor acts like an investigator. If product images do not show macro-details, or dynamic shipping costs stay hidden until the final checkout step, the buyer feels immediate risk shock and abandons the cart.";
    }

    return "System diagnosis: high-ticket conversion relies on micro-conversions and asynchronous follow-up. I would check whether the system captures high-intent drop-offs early through partial checkout recovery, instead of expecting cold traffic to buy a premium product in one session without nurture.";
  }

  if (framework === "b2b_lead_gen") {
    if (level === 1) {
      return "Industry lens: for B2B lead generation, the focus is validating lead magnet alignment, form friction, and prominent case-study positioning.";
    }

    if (level === 2) {
      return "Deeper lens: the hurdle is time-to-value. B2B buyers protect their time aggressively. If the form asks for seven fields before value is clear, or the headline uses vague corporate jargon, the buyer does not understand what problem is solved and leaves.";
    }

    return "System diagnosis: a B2B site should not just be an informational brochure; it needs to qualify intent. If the site sends unqualified leads straight to the calendar, sales time gets wasted. The system should score intent on-page before pushing for manual booking.";
  }

  if (level === 1) {
    return "Industry lens: for multi-location and hybrid retail, the critical points are zip-code availability, store-level inventory clarity, and localized CTAs.";
  }

  if (level === 2) {
    return "Deeper lens: the leak is convenience ambiguity. A visitor on a hybrid site wants immediate logistics answers: is this in stock near me, can I pick it up today, or is this available in my area? Forcing them through a national catalog first creates geographic friction.";
  }

  return "System diagnosis: at this scale, the website is an interface for a complex supply chain. High bounce rates usually mean the front end is not communicating real-time local availability or fulfillment routing clearly to a mobile user on the move.";
}

function buildTopicResponse(profile: ZoraLeadProfile, topic: ZoraTopic) {
  if (isOpzixOfferKey(topic)) {
    return buildOpzixOfferAnswer({
      offerKey: topic,
      businessType: profile.businessType,
      industry: profile.confirmedIndustry || profile.industry,
      websiteUrl: profile.websiteUrl,
      userMessage: "",
    }).message;
  }

  const parts = topicResponseParts(profile, topic);
  const label = topicDisplayLabel(profile, topic);
  const trackedTopic = toTrackedTalkingPoint(topic);
  const effectiveDepth =
    hasRepeatedTalkingPoint(profile, trackedTopic) && (profile.currentTopicDepth || 1) <= 1
      ? 2
      : profile.currentTopicDepth;
  const depthInsight =
    industryDeepeningInsight(profile, effectiveDepth) ||
    topicDepthInsight(topic, effectiveDepth);

  if (!parts) return buildClarifyingResponse(profile);

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
    if (isOpzixOfferKey(profile.currentTopic)) {
      return buildOpzixOfferAnswer({
        offerKey: profile.currentTopic,
        businessType: profile.businessType,
        industry: profile.confirmedIndustry || profile.industry,
        websiteUrl: profile.websiteUrl,
        userMessage: "",
      }).message;
    }

    return buildTopicResponse(profile, profile.currentTopic);
  }

  const websiteContext = profile.websiteUrl
    ? ` I can use ${profile.websiteUrl} as context, but I would still validate the actual path with the scanner or a manual review before treating this as confirmed.`
    : "";

  if (profile.recommendationRoadmap?.length) {
    const first = profile.recommendationRoadmap[0];
    const currentPoint = talkingPointForResponse("recommendation", profile, "", profile.currentTopic);
    const depth =
      hasRepeatedTalkingPoint(profile, currentPoint) && (profile.currentTopicDepth || 1) <= 1
        ? 2
        : profile.currentTopicDepth || 1;
    const matrixInsight = industryDeepeningInsight(profile, depth);

    if (matrixInsight) {
      return matrixInsight;
    }

    if (profile.industryProfile?.industry === "marketplace_retail") {
      if (depth >= 3) {
        return `At this scale, I would look past web design alone. The deeper system question is whether the page promise, product availability, account flow, and fulfillment options agree with each other. If those systems are disconnected, more traffic can expose the confusion faster instead of solving it.${websiteContext}`;
      }

      return `The deeper issue is cognitive load. If a visitor has to decode multiple paths before they know whether to shop, refill, sign in, pick up, or get delivery, momentum drops before the page has a chance to convert.${websiteContext}`;
    }

    if (depth >= 3) {
      return `The deeper system question behind ${first.title} is whether the website, tracking, and follow-up process agree on what should happen next. If those pieces are disconnected, the team may keep treating symptoms instead of the bottleneck.${websiteContext}`;
    }

    return `The deeper issue behind ${first.title} is decision friction. A visitor may technically be able to move forward, but if the next step feels unclear, risky, or mismatched to their intent, they delay or leave.${websiteContext}`;
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
      return "Since there is no live site yet, the best next step is a strategy call to map the landing page, offer, and follow-up system.";
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
  if (profile.scannerBlocked) {
    return "Since automated scanning is blocked for this domain, the clean next step is a manual strategy review focused on the real customer paths: navigation, availability, account flow, checkout, and tracking visibility.";
  }

  if (profile.hasNoWebsite) {
    return "Since there is no live site yet, the best next step is a strategy call to map the landing page, offer, follow-up system, tracking, and launch timeline.";
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

function hasDeliveredProgressionStage(stage?: ZoraConversationStage) {
  return (
    stage === "diagnosis" ||
    stage === "deep_dive" ||
    stage === "recommendation" ||
    stage === "next_step" ||
    stage === "handoff"
  );
}

function inferConversationStage(profile: ZoraLeadProfile): ZoraConversationStage | undefined {
  if (profile.conversationStage) return profile.conversationStage;
  if (profile.recommendationRoadmap?.length) {
    return "recommendation";
  }
  if (profile.currentTopic || (profile.currentTopicDepth ?? 0) > 1) return "deep_dive";
  if (
    profile.recommendedNextStep &&
    (profile.businessType || profile.challenge || profile.websiteUrl || profile.hasNoWebsite)
  ) {
    return "diagnosis";
  }
  return undefined;
}

function hasConversationTopicChanged(
  analysis: ZoraMessageAnalysis,
  currentProfile: ZoraLeadProfile,
) {
  return Boolean(
    (analysis.businessType && analysis.businessType !== currentProfile.businessType) ||
      (analysis.challenge && analysis.challenge !== currentProfile.challenge) ||
      (analysis.websiteUrl && analysis.websiteUrl !== currentProfile.websiteUrl) ||
      (analysis.currentTopic && analysis.currentTopic !== currentProfile.currentTopic) ||
      analysis.intent === "pricing" ||
      analysis.intent === "timeline" ||
      analysis.intent === "booking_request" ||
      analysis.intent === "audit_request" ||
      analysis.intent === "review_request" ||
      analysis.intent === "scanner_execute" ||
      analysis.intent === "company_background" ||
      analysis.intent === "business_model_correction" ||
      analysis.intent === "capability" ||
      analysis.intent === "small_talk" ||
      analysis.intent === "out_of_scope",
  );
}

function nextConversationStage(
  intent: ZoraIntent,
  hasDiagnosis: boolean,
  previousStage: ZoraConversationStage | undefined,
  shouldContinueTopic: boolean,
  shouldContinueMomentum: boolean,
): ZoraConversationStage {
  if (
    intent === "handoff" ||
    intent === "action_request" ||
    intent === "scanner_execute" ||
    intent === "scanner_failure" ||
    intent === "booking_request"
  ) {
    return "handoff";
  }

  if (intent === "recommendation") return "recommendation";
  if (intent === "company_background") return previousStage || "qualification";
  if (intent === "business_model_correction") return "deep_dive";
  if (intent === "terminology") return "deep_dive";
  if (intent === "offer_catalog") return "deep_dive";
  if (intent === "consulting_concept") return "deep_dive";
  if (intent === "trust_skepticism") return "deep_dive";
  if (intent === "review_request") return "deep_dive";
  if (intent === "next_step" || intent === "audit_request") return "next_step";
  if (shouldContinueTopic || shouldContinueMomentum || intent === "focus_request") return "deep_dive";
  if (hasDiagnosis || intent === "diagnosis" || intent === "consultant") {
    return "diagnosis";
  }
  if (previousStage) return previousStage;
  return "qualification";
}

function toTrackedTalkingPoint(value?: string): ZoraTalkingPoint | undefined {
  if (isOpzixOfferKey(value)) return value;

  if (
    value === "offer_clarity" ||
    value === "conversion_path" ||
    value === "product_discovery" ||
    value === "trust_signals" ||
    value === "mobile_ux" ||
    value === "tracking_visibility" ||
    value === "analytics_dashboard" ||
    value === "follow_up_handoff" ||
    value === "follow_up_speed" ||
    value === "booking_flow" ||
    value === "crm_routing" ||
    value === "lead_capture" ||
    value === "ai_assistant" ||
    value === "backend_integrations" ||
    value === "support_ticket_flow" ||
    value === "email_sms_automation" ||
    value === "ads_readiness" ||
    value === "website_rebuild" ||
    value === "operations_workflow"
  ) {
    return value;
  }

  return undefined;
}

function toConsultingConcept(value?: string): OpzixBrainConcept | undefined {
  const tracked = toTrackedTalkingPoint(value);

  if (
    tracked === "offer_clarity" ||
    tracked === "conversion_path" ||
    tracked === "product_discovery" ||
    tracked === "trust_signals" ||
    tracked === "tracking_visibility" ||
    tracked === "follow_up_speed" ||
    tracked === "booking_flow" ||
    tracked === "crm_routing" ||
    tracked === "lead_capture" ||
    tracked === "ai_assistant"
  ) {
    return tracked;
  }

  if (tracked === "follow_up_handoff") return "follow_up_speed";
  if (tracked === "analytics_dashboard") return "tracking_visibility";

  return undefined;
}

function topicForConsultingConcept(concept: OpzixBrainConcept): ZoraTopic | undefined {
  if (concept === "offer_clarity") return "offer_clarity";
  if (concept === "tracking_visibility") return "tracking_visibility";
  if (concept === "follow_up_speed") return "follow_up_handoff";
  if (concept === "booking_flow") return "booking_flow";
  if (concept === "product_discovery") return "product_discovery";
  if (concept === "crm_routing") return "crm_routing";
  if (concept === "lead_capture" || concept === "ai_assistant") return "lead_capture";
  if (concept === "conversion_path" || concept === "trust_signals") {
    return "landing_page";
  }

  return undefined;
}

function talkingPointForResponse(
  intent: ZoraIntent,
  profile: ZoraLeadProfile,
  message: string,
  activeTopic?: ZoraTopic,
): ZoraTalkingPoint | undefined {
  if (intent === "consulting_concept") {
    return toTrackedTalkingPoint(profile.detectedConcept || profile.currentSubtopic);
  }

  const trackedTopic = toTrackedTalkingPoint(activeTopic || profile.currentTopic);

  if (trackedTopic) return trackedTopic;
  if (intent === "review_request" && isManualStrategyReviewRequest(message)) {
    return toTrackedTalkingPoint(strategicTopicForProfile(profile));
  }
  if (intent === "pricing" || /\b(cost|price|pricing|how much|investment)\b/i.test(message)) {
    return "ecommerce_cost_analysis";
  }
  if (
    intent === "audit_request" ||
    intent === "review_request" ||
    intent === "scanner_execute" ||
    /\b(audit process|how does the audit|free audit|audit cost|run the audit|scan my site)\b/i.test(
      message,
    )
  ) {
    return "audit_process";
  }
  if (profile.challenge === "Tracking") return "tracking_visibility";
  if (profile.challenge === "Follow-up") return "follow_up_handoff";
  if (profile.businessType === "Ecommerce") return "product_discovery";
  return undefined;
}

function hasRepeatedTalkingPoint(
  profile: ZoraLeadProfile,
  talkingPoint: ZoraTalkingPoint | undefined,
) {
  if (!talkingPoint) return false;
  return (profile.recentTalkingPoints || []).slice(0, 2).includes(talkingPoint);
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

  if (intent === "company_background") {
    return [] as ZoraResponse["recommendedActions"];
  }

  if (intent === "terminology") {
    return ["ask_question"] as ZoraResponse["recommendedActions"];
  }

  if (intent === "action_request") {
    return [] as ZoraResponse["recommendedActions"];
  }

  if (intent === "business_model_correction") {
    return [] as ZoraResponse["recommendedActions"];
  }

  if (intent === "clarify" && profile.businessType && !profile.challenge) {
    return [] as ZoraResponse["recommendedActions"];
  }

  if (profile.hasNoWebsite && intent !== "out_of_scope") {
    return ["strategy_call"] as ZoraResponse["recommendedActions"];
  }

  if (profile.scannerBlocked && intent !== "out_of_scope") {
    return ["strategy_call", "ask_question"] as ZoraResponse["recommendedActions"];
  }

  if (intent === "thanks") {
    if (repeatedSoftClose) {
      return [] as ZoraResponse["recommendedActions"];
    }

    return ["free_audit", "strategy_call"] as ZoraResponse["recommendedActions"];
  }
  if (intent === "acknowledgement") {
    if (profile.currentTopic) {
      if ((profile.currentTopicDepth || 1) >= 2) {
        return profile.websiteUrl
          ? (["free_audit", "ask_question"] as ZoraResponse["recommendedActions"])
          : (["strategy_call", "ask_question"] as ZoraResponse["recommendedActions"]);
      }

      return [] as ZoraResponse["recommendedActions"];
    }
    if (profile.hasNoWebsite) return ["strategy_call", "ask_question"] as ZoraResponse["recommendedActions"];
    return ["free_audit", "strategy_call", "ask_question"] as ZoraResponse["recommendedActions"];
  }

  if (intent === "timeline" && profile.recommendationRoadmap?.length) {
    return [] as ZoraResponse["recommendedActions"];
  }
  if (intent === "pricing") {
    return profile.websiteUrl
      ? (["free_audit", "strategy_call", "ask_question"] as ZoraResponse["recommendedActions"])
      : (["strategy_call", "ask_question"] as ZoraResponse["recommendedActions"]);
  }
  if (intent === "scanner_execute") {
    return profile.websiteUrl ? [] : (["ask_question"] as ZoraResponse["recommendedActions"]);
  }
  if (intent === "handoff") {
    if (profile.websiteUrl) {
      return ["free_audit", "strategy_call", "ask_question"] as ZoraResponse["recommendedActions"];
    }

    return ["strategy_call", "ask_question"] as ZoraResponse["recommendedActions"];
  }

  if (intent === "audit_request") {
    if (profile.hasNoWebsite) return ["strategy_call"] as ZoraResponse["recommendedActions"];
    if (profile.websiteUrl) return ["free_audit"] as ZoraResponse["recommendedActions"];
    return [] as ZoraResponse["recommendedActions"];
  }
  if (intent === "review_request") {
    return [] as ZoraResponse["recommendedActions"];
  }
  if (intent === "booking_request") return ["strategy_call"] as ZoraResponse["recommendedActions"];
  if (intent === "offer_catalog") return ["ask_question"] as ZoraResponse["recommendedActions"];
  if (intent === "consulting_concept") return ["ask_question"] as ZoraResponse["recommendedActions"];
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

function normalizeTrackedUserCommand(message: string) {
  const text = message.trim().toLowerCase();

  if (/^diagnose my growth system[.!?]*$/i.test(message)) return "diagnose_my_growth_system";
  if (/^run free audit[.!?]*$/i.test(message) || isScannerExecutionRequest(message)) {
    return "run_free_audit";
  }
  if (/^book strategy call[.!?]*$/i.test(message) || isBookingRequest(message)) {
    return "book_strategy_call";
  }
  if (/^ask a question[.!?]*$/i.test(message)) return "ask_question";
  if (/^faq[.!?]*$/i.test(message)) return "faq";
  if (/\b(high-level recommendation|high level recommendation|recommendation here)\b/i.test(message)) {
    return "high_level_recommendation";
  }
  if (/^(tell me more|more|why)[.!?]*$/i.test(text)) return "tell_me_more";
  if (/^(ok|okay|got it|interesting|nice)[.!?]*$/i.test(text)) return text.replace(/\W+/g, "_");

  return undefined;
}

function summarizeAssistantMessage(
  intent: ZoraIntent,
  reply: string,
  profile: ZoraLeadProfile,
) {
  const founderContext =
    intent === "company_background"
      ? "company background founder owner CEO Adim Odumefune Max"
      : "";
  const topicContext = [profile.businessType, profile.challenge, profile.currentTopic]
    .filter(Boolean)
    .join(" ");

  return [intent, founderContext, topicContext, reply.slice(0, 180)]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
}

function buildDuplicateCommandResponse(
  command: string | undefined,
  profile: ZoraLeadProfile,
  fallbackIntent: ZoraIntent,
) {
  if (command === "diagnose_my_growth_system" && hasProfileDiagnosisSignal(profile)) {
    if (profile.businessType === "Ecommerce") {
      return "Let's go one layer deeper. For an ecommerce store, product discovery and page confidence matter because most cold visitors decide whether to continue before they ever reach checkout. I would first check whether users can find the right product, understand the offer, trust the page, and see a clear next step on mobile.";
    }

    if (profile.businessType === "Real Estate") {
      return "Let's go one layer deeper. For real estate, the diagnosis should separate seller intent, buyer intent, local proof, capture path, booking flow, and CRM follow-up. The question is not just whether the page exists, but whether the right inquiry reaches the right person quickly.";
    }

    if (profile.hasNoWebsite) {
      return "Let's go one layer deeper. Since there is no live site yet, the diagnosis should become a launch blueprint: offer clarity, target audience, first landing page structure, lead capture, booking or intake flow, tracking from day one, and follow-up ownership.";
    }

    return `Let's go one layer deeper. I would focus on ${joinList(
      focusAreas(profile),
    )} because that is where the first useful bottleneck is most likely to show up.`;
  }

  if (
    command === "tell_me_more" ||
    command === "okay" ||
    command === "ok" ||
    command === "nice" ||
    command === "got_it" ||
    command === "interesting"
  ) {
    if (profile.currentTopic) {
      if (isOpzixOfferKey(profile.currentTopic)) {
        return buildOpzixOfferAnswer({
          offerKey: profile.currentTopic,
          businessType: profile.businessType,
          industry: profile.confirmedIndustry || profile.industry,
          websiteUrl: profile.websiteUrl,
          userMessage: command,
        }).message;
      }

      return buildTopicResponse(profile, profile.currentTopic);
    }

    if (profile.lastAssistantIntent || fallbackIntent) {
      return buildMomentumResponse(profile);
    }
  }

  if (command === "high_level_recommendation" && hasProfileDiagnosisSignal(profile)) {
    return buildRecommendationResponse({
      ...profile,
      recommendationRoadmap: profile.recommendationRoadmap || buildRecommendationRoadmap(profile),
    });
  }

  return "";
}

function actionsForOfferButtons(
  buttons?: OpzixOfferAnswer["suggestedButtons"],
) {
  if (!buttons) return undefined;

  return buttons.map((button) => {
    if (button === "Run Free Audit") return "free_audit";
    if (button === "Book Strategy Call") return "strategy_call";
    return "ask_question";
  }) as ZoraResponse["recommendedActions"];
}

function enforceNoWebsiteGuardrail(reply: string) {
  return reply
    .replace(/\bwebsite URL\b/gi, "live link")
    .replace(/\bfree audit scanner\b/gi, "pre-launch review")
    .replace(/\baudit scanner\b/gi, "review tool")
    .replace(/\bscanner\b/gi, "review tool")
    .replace(/\baudit\b/gi, "review")
    .replace(/\bscan\b/gi, "review");
}

function shouldPreferPreviousOfferThread(
  message: string,
  previousOffer: OpzixOfferKey | undefined,
  detectedOffer: OpzixOfferKey | undefined,
) {
  if (!previousOffer || !detectedOffer || previousOffer === detectedOffer) return false;

  const isExplicitSystemPair =
    /\b(shopify|bigcommerce|netsuite|erp|crm)\b.+\b(to|with|and)\b.+\b(shopify|bigcommerce|netsuite|erp|crm)\b/i.test(
      message,
    );
  if (isExplicitSystemPair) return false;

  return (
    /\b(they|it|that|this)\s+(need|needs|should|has|have)\s+to\b/i.test(message) ||
    /\bconnect(ed|ing)?\s+(to|with)\b/i.test(message)
  );
}

export function buildZoraResponse(
  message: string,
  currentProfile: ZoraLeadProfile = {},
): ZoraResponse {
  const currentUserCommand = normalizeTrackedUserCommand(message);
  const duplicateCommandCount =
    currentUserCommand && currentProfile.lastUserCommand === currentUserCommand
      ? (currentProfile.duplicateCommandCount || 0) + 1
      : 0;
  const analysis = applyProfileContextToAnalysis(
    analyzeZoraMessage(message),
    currentProfile,
  );
  const { leadProfile, profileChanges } = mergeLeadProfile(currentProfile, analysis);
  const previousStage = inferConversationStage(currentProfile);
  const topicChanged = hasConversationTopicChanged(analysis, currentProfile);
  const isPostRecommendationAck =
    isPostRecommendationAcknowledgementMessage(message) &&
    (currentProfile.lastAssistantMode === "high_level_recommendation" ||
      (currentProfile.lastAssistantMode === "cta_prompt" &&
        Boolean(currentProfile.postRecommendationAckCount)));
  const postRecommendationAckCount = isPostRecommendationAck
    ? (currentProfile.postRecommendationAckCount || 0) + 1
    : 0;
  const isIndustryClarificationMode =
    leadProfile.industryStatus === "needs_clarification" &&
    !leadProfile.confirmedIndustry &&
    analysis.intent !== "company_background" &&
    analysis.intent !== "out_of_scope";
  const isScannerBlockedAcknowledgement =
    leadProfile.scannerBlocked && isCasualAcknowledgmentMessage(message);
  const shouldAdvanceToHandoff =
    !isPostRecommendationAck &&
    !isIndustryClarificationMode &&
    !isScannerBlockedAcknowledgement &&
    isProgressionAgreementMessage(message) &&
    previousStage !== "handoff" &&
    hasDeliveredProgressionStage(previousStage) &&
    (!currentProfile.currentTopic || isHandoffExecutionMessage(message)) &&
    !topicChanged &&
    !leadProfile.needsBusinessTypeClarification;
  const shouldResumeRecommendationThread = isResumeRecommendationThreadRequest(message);
  if (
    (analysis.intent === "recommendation" || shouldResumeRecommendationThread) &&
    hasProfileDiagnosisSignal(leadProfile)
  ) {
    leadProfile.recommendationRoadmap = buildRecommendationRoadmap(leadProfile);
  }
  const shouldContinueMomentum =
    !isPostRecommendationAck &&
    !isIndustryClarificationMode &&
    !isScannerBlockedAcknowledgement &&
    !shouldAdvanceToHandoff &&
    previousStage !== "handoff" &&
    (analysis.intent === "acknowledgement" || analysis.intent === "clarify") &&
    isMomentumAcknowledgmentMessage(message) &&
    hasProfileDiagnosisSignal(leadProfile) &&
    !leadProfile.needsBusinessTypeClarification;
  const activeTopic = analysis.currentTopic || leadProfile.currentTopic;
  const activeConsultingConcept =
    analysis.consultingConcept ||
    (isTopicContinuationMessage(message) || isConsultingExperienceQuestion(message)
      ? toConsultingConcept(currentProfile.currentSubtopic || currentProfile.detectedConcept)
      : undefined);
  const contextualOfferKey =
    isOpzixOfferFollowUp(message) && currentProfile.lastMentionedOffer
      ? currentProfile.lastMentionedOffer
      : undefined;
  const activeOfferKey = shouldPreferPreviousOfferThread(
    message,
    contextualOfferKey,
    analysis.offerKey,
  )
    ? contextualOfferKey
    : analysis.offerKey || contextualOfferKey;
  const shouldUseProductLineAnswer = Boolean(analysis.isProductLineQuestion && !activeOfferKey);
  const shouldUseOfferCatalog =
    !isPostRecommendationAck &&
    !isIndustryClarificationMode &&
    !isScannerBlockedAcknowledgement &&
    !shouldAdvanceToHandoff &&
    previousStage !== "handoff" &&
    analysis.intent !== "out_of_scope" &&
    analysis.intent !== "company_background" &&
    analysis.intent !== "action_request" &&
    Boolean(activeOfferKey || shouldUseProductLineAnswer);
  const shouldContinueConsultingConcept =
    !isPostRecommendationAck &&
    !isIndustryClarificationMode &&
    !isScannerBlockedAcknowledgement &&
    !shouldAdvanceToHandoff &&
    previousStage !== "handoff" &&
    Boolean(activeConsultingConcept) &&
    (analysis.intent === "consulting_concept" ||
      isConsultingExperienceQuestion(message) ||
      ((analysis.intent === "acknowledgement" ||
        analysis.intent === "clarify" ||
        analysis.intent === "consultant" ||
        analysis.intent === "capability") &&
        isTopicContinuationMessage(message)));
  const shouldContinueTopic =
    !isPostRecommendationAck &&
    !isIndustryClarificationMode &&
    !isScannerBlockedAcknowledgement &&
    !shouldAdvanceToHandoff &&
    previousStage !== "handoff" &&
    Boolean(activeTopic) &&
    !isOpzixOfferKey(activeTopic) &&
    hasProfileDiagnosisSignal(leadProfile) &&
    (analysis.intent === "diagnosis" ||
      analysis.intent === "acknowledgement" ||
      analysis.intent === "clarify") &&
    (Boolean(analysis.currentTopic) || isTopicContinuationMessage(message)) &&
    !leadProfile.needsBusinessTypeClarification;
  const effectiveIntent: ZoraIntent =
    shouldAdvanceToHandoff
      ? "handoff"
      : isPostRecommendationAck
      ? "next_step"
      : isIndustryClarificationMode
      ? "business_model_correction"
      : isScannerBlockedAcknowledgement
      ? "next_step"
      : shouldUseOfferCatalog
      ? "offer_catalog"
      : shouldContinueConsultingConcept
      ? "consulting_concept"
      : shouldContinueTopic || shouldContinueMomentum
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
  const hasNewLeadSource = Boolean(analysis.leadSource);
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
  if (shouldContinueMomentum && !shouldContinueTopic) {
    const nextDepth = (currentProfile.currentTopicDepth || 1) + 1;
    addChange(profileChanges, "currentTopicDepth", leadProfile.currentTopicDepth, nextDepth);
    leadProfile.currentTopicDepth = nextDepth;
  }
  if (
    shouldContinueConsultingConcept &&
    activeConsultingConcept &&
    !analysis.consultingConcept
  ) {
    const nextDepth = (currentProfile.currentTopicDepth || 0) + 1;
    const conceptTopic = topicForConsultingConcept(activeConsultingConcept);
    addChange(profileChanges, "detectedConcept", leadProfile.detectedConcept, activeConsultingConcept);
    leadProfile.detectedConcept = activeConsultingConcept;
    addChange(profileChanges, "currentSubtopic", leadProfile.currentSubtopic, activeConsultingConcept);
    leadProfile.currentSubtopic = activeConsultingConcept;
    addChange(profileChanges, "currentTopicDepth", leadProfile.currentTopicDepth, nextDepth);
    leadProfile.currentTopicDepth = nextDepth;
    if (conceptTopic) {
      addChange(profileChanges, "currentTopic", leadProfile.currentTopic, conceptTopic);
      leadProfile.currentTopic = conceptTopic;
    }
  }
  if (
    shouldUseOfferCatalog &&
    activeOfferKey &&
    leadProfile.lastMentionedOffer !== activeOfferKey
  ) {
    const nextDepth = (currentProfile.currentTopicDepth || 1) + 1;
    addChange(profileChanges, "lastMentionedOffer", leadProfile.lastMentionedOffer, activeOfferKey);
    leadProfile.lastMentionedOffer = activeOfferKey;
    addChange(profileChanges, "currentTopic", leadProfile.currentTopic, activeOfferKey);
    leadProfile.currentTopic = activeOfferKey;
    addChange(profileChanges, "currentSubtopic", leadProfile.currentSubtopic, activeOfferKey);
    leadProfile.currentSubtopic = activeOfferKey;
    addChange(profileChanges, "currentTopicDepth", leadProfile.currentTopicDepth, nextDepth);
    leadProfile.currentTopicDepth = nextDepth;
  }
  const shouldAnchorStrategicTopic =
    (effectiveIntent === "review_request" ||
      (hasNewLeadSource && effectiveIntent !== "consulting_concept")) &&
    !leadProfile.currentTopic &&
    !leadProfile.needsBusinessTypeClarification;
  if (shouldAnchorStrategicTopic) {
    const strategicTopic = strategicTopicForProfile(leadProfile);
    addChange(profileChanges, "currentTopic", leadProfile.currentTopic, strategicTopic);
    addChange(profileChanges, "currentTopicDepth", leadProfile.currentTopicDepth, 1);
    leadProfile.currentTopic = strategicTopic;
    leadProfile.currentTopicDepth = 1;
  }
  const repeatedSoftClose =
    effectiveIntent === "thanks" &&
    (Boolean(currentProfile.hasSeenSoftClose) || isCasualAcknowledgmentMessage(message));
  const duplicateReply =
    !isPostRecommendationAck &&
    duplicateCommandCount > 0 &&
    effectiveIntent !== "company_background" &&
    effectiveIntent !== "out_of_scope"
      ? buildDuplicateCommandResponse(currentUserCommand, leadProfile, effectiveIntent)
      : "";
  const postRecommendationReply = isPostRecommendationAck
    ? buildPostRecommendationAcknowledgementResponse(leadProfile, postRecommendationAckCount)
    : "";
  const offerAnswer =
    effectiveIntent === "offer_catalog"
      ? activeOfferKey
        ? buildOpzixOfferAnswer({
            offerKey: activeOfferKey,
            businessType: leadProfile.businessType,
            industry: leadProfile.confirmedIndustry || leadProfile.industry,
            websiteUrl: leadProfile.websiteUrl,
            userMessage: message,
          })
        : buildOpzixProductLineAnswer()
      : undefined;
  const reply =
    duplicateReply ||
    postRecommendationReply ||
    (effectiveIntent === "out_of_scope"
      ? buildOutOfScopeResponse()
      : effectiveIntent === "business_model_correction"
        ? buildBusinessModelCorrectionResponse(leadProfile)
      : effectiveIntent === "company_background"
        ? buildCompanyBackgroundResponse(
            leadProfile,
            analysis.companyBackgroundSubtype,
            analysis.founderFollowupSubtype,
          )
      : effectiveIntent === "scanner_failure"
        ? buildScannerFailureResponse(leadProfile)
      : effectiveIntent === "trust_skepticism"
        ? buildTrustSkepticismResponse(leadProfile)
      : effectiveIntent === "thanks"
        ? buildThanksResponse(leadProfile, repeatedSoftClose)
        : effectiveIntent === "acknowledgement"
        ? buildAcknowledgementResponse(leadProfile)
        : effectiveIntent === "timeline"
          ? buildTimelineResponse(leadProfile, message)
        : effectiveIntent === "terminology"
          ? buildTerminologyResponse(leadProfile, analysis.terminologyTerm)
          : effectiveIntent === "pricing"
          ? buildPricingResponse(leadProfile, message)
          : effectiveIntent === "action_request"
          ? buildActionIntentResponse(leadProfile, analysis.actionIntent)
          : effectiveIntent === "offer_catalog"
          ? offerAnswer?.message || buildOpzixProductLineAnswer().message
            : effectiveIntent === "consulting_concept"
            ? buildConsultingKnowledgeResponse(leadProfile, message, activeConsultingConcept)
            : effectiveIntent === "scanner_execute"
              ? buildScannerExecutionResponse(leadProfile)
            : effectiveIntent === "handoff"
              ? buildHandoffResponse(leadProfile, message, previousStage)
            : effectiveIntent === "capability"
              ? buildCapabilityResponse(leadProfile)
              : effectiveIntent === "small_talk"
                ? buildSmallTalkResponse(leadProfile)
                  : effectiveIntent === "audit_request"
                    ? buildAuditRequestResponse(leadProfile, message)
                  : effectiveIntent === "review_request"
                    ? buildReviewRequestResponse(leadProfile, message)
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
                          : hasNewLeadSource
                            ? buildLeadSourceResponse(leadProfile)
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
                              : buildClarifyingResponse(leadProfile));

  if (effectiveIntent === "thanks" && !leadProfile.hasSeenSoftClose) {
    profileChanges.push("hasSeenSoftClose: undefined -> true");
    leadProfile.hasSeenSoftClose = true;
  }

  const conversationStage = nextConversationStage(
    effectiveIntent,
    hasDiagnosis,
    previousStage,
    shouldContinueTopic,
    shouldContinueMomentum,
  );
  addChange(profileChanges, "conversationStage", leadProfile.conversationStage, conversationStage);
  leadProfile.conversationStage = conversationStage;

  const shouldPrependTrafficIntentAnchor =
    Boolean(zoraTrafficIntentAnchor(leadProfile)) &&
    !currentProfile.businessType &&
    !currentProfile.challenge &&
    !currentProfile.websiteUrl &&
    (effectiveIntent === "diagnosis" ||
      effectiveIntent === "recommendation" ||
      effectiveIntent === "consultant" ||
      effectiveIntent === "next_step");
  const finalReply = shouldPrependTrafficIntentAnchor
    ? `${zoraTrafficIntentAnchor(leadProfile)}\n\n${reply}`
    : reply;
  const guardedFinalReply =
    leadProfile.hasNoWebsite &&
    effectiveIntent !== "company_background" &&
    effectiveIntent !== "scanner_execute"
    ? enforceNoWebsiteGuardrail(finalReply)
    : finalReply;

  if (currentUserCommand !== leadProfile.lastUserCommand) {
    addChange(profileChanges, "lastUserCommand", leadProfile.lastUserCommand, currentUserCommand);
  }
  addChange(
    profileChanges,
    "duplicateCommandCount",
    leadProfile.duplicateCommandCount,
    duplicateCommandCount,
  );
  addChange(profileChanges, "lastAssistantIntent", leadProfile.lastAssistantIntent, effectiveIntent);
  const nextLastAssistantMode: ZoraAssistantMode = isPostRecommendationAck
    ? "cta_prompt"
    : effectiveIntent === "recommendation"
      ? "high_level_recommendation"
      : effectiveIntent === "scanner_execute"
        ? "scanner_execution"
        : effectiveIntent === "company_background"
          ? "company_background"
          : hasDiagnosis
            ? "diagnosis"
            : effectiveIntent === "acknowledgement" ||
                effectiveIntent === "handoff" ||
                effectiveIntent === "next_step"
              ? "cta_prompt"
              : "other";
  const nextPostRecommendationAckCount = isPostRecommendationAck
    ? postRecommendationAckCount
    : effectiveIntent === "recommendation"
      ? 0
      : currentProfile.postRecommendationAckCount;
  addChange(
    profileChanges,
    "lastAssistantMode",
    leadProfile.lastAssistantMode,
    nextLastAssistantMode,
  );
  addChange(
    profileChanges,
    "postRecommendationAckCount",
    leadProfile.postRecommendationAckCount,
    nextPostRecommendationAckCount,
  );
  leadProfile.lastUserCommand = currentUserCommand;
  leadProfile.duplicateCommandCount = duplicateCommandCount;
  leadProfile.lastAssistantIntent = effectiveIntent;
  leadProfile.lastAssistantMode = nextLastAssistantMode;
  leadProfile.postRecommendationAckCount = nextPostRecommendationAckCount;
  leadProfile.lastAssistantMessageSummary = summarizeAssistantMessage(
    effectiveIntent,
    guardedFinalReply,
    leadProfile,
  );

  const offerRecentTalkingPointCandidate =
    offerAnswer && "recentTalkingPoint" in offerAnswer
      ? offerAnswer.recentTalkingPoint
      : undefined;
  const offerRecentTalkingPoint =
    typeof offerRecentTalkingPointCandidate === "string" &&
    isOpzixOfferKey(offerRecentTalkingPointCandidate)
      ? offerRecentTalkingPointCandidate
      : undefined;
  const recentTalkingPoint =
    offerRecentTalkingPoint ||
    talkingPointForResponse(
      effectiveIntent,
      leadProfile,
      message,
      activeTopic,
    );
  leadProfile.recentTalkingPoints = recentTalkingPoint
    ? [
        recentTalkingPoint,
        ...(currentProfile.recentTalkingPoints || []).filter(
          (point) => point !== recentTalkingPoint,
        ),
      ].slice(0, 5)
    : (currentProfile.recentTalkingPoints || []).slice(0, 5);

  const action =
    effectiveIntent === "action_request"
      ? actionObjectForIntent(leadProfile, analysis.actionIntent)
      : !leadProfile.scannerBlocked &&
          (effectiveIntent === "scanner_execute" ||
            (effectiveIntent === "handoff" && isHandoffExecutionMessage(message)))
        ? leadProfile.websiteUrl
          ? ({ type: "start_audit", url: leadProfile.websiteUrl } as const)
          : undefined
        : effectiveIntent === "booking_request"
          ? ({ type: "book_strategy_call" } as const)
          : undefined;
  const navigationHref =
    action?.type === "start_audit"
      ? scannerHrefForProfile({ ...leadProfile, websiteUrl: action.url })
      : undefined;
  const offerRecommendedActions =
    effectiveIntent === "offer_catalog"
      ? actionsForOfferButtons(offerAnswer?.suggestedButtons)
      : undefined;
  const recommendedActions = offerRecommendedActions || (isPostRecommendationAck
    ? leadProfile.scannerBlocked
      ? (["strategy_call", "ask_question"] as ZoraResponse["recommendedActions"])
      : leadProfile.hasNoWebsite
      ? (["strategy_call"] as ZoraResponse["recommendedActions"])
      : postRecommendationAckCount > 1
        ? (["free_audit", "strategy_call"] as ZoraResponse["recommendedActions"])
        : ([
            "free_audit",
            "strategy_call",
            "ask_question",
          ] as ZoraResponse["recommendedActions"])
    : actionsForIntent(
        effectiveIntent,
        hasDiagnosis,
        leadProfile,
        repeatedSoftClose,
      ));

  return {
    reply: guardedFinalReply,
    leadProfile,
    currentMessageAnalysis: analysis,
    confidenceScore: analysis.confidenceScore,
    profileChanges,
    responseMode: effectiveIntent,
    action,
    navigationHref,
    recentTalkingPoint,
    recommendedActions,
  };
}
