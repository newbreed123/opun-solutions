import type {
  ZoraBusinessType,
  ZoraChallenge,
  ZoraConversationStage,
  ZoraLeadProfile,
  ZoraTopic,
} from "@/lib/zora-assistant";

export type ZoraVerticalTarget =
  | "ecommerce_dtc"
  | "ecommerce_b2b"
  | "marketplace_or_enterprise_retail"
  | "real_estate"
  | "healthcare_care"
  | "nonprofit_community"
  | "service_business"
  | "b2b_saas_infrastructure"
  | "domain_registrar"
  | "unknown";

export type ZoraContextMessage = {
  role?: string;
  text?: string;
  content?: string;
  message?: string;
};

export type ZoraContextEngineInput = {
  messages?: Array<string | ZoraContextMessage>;
  websiteUrl?: string | null;
  businessType?: ZoraBusinessType | string;
  challenge?: ZoraChallenge | string;
  hasWebsite?: boolean | null;
  currentStep?: string | null;
  conversationStage?: ZoraConversationStage | string;
  currentTopic?: ZoraTopic | string;
  currentSubtopic?: string | null;
  inferredIndustry?: string | null;
  confirmedIndustry?: string | null;
  industryStatus?: string | null;
  recentTalkingPoints?: string[];
};

export type ZoraContextEngineOutput = {
  verticalTarget: ZoraVerticalTarget;
  businessModel: string;
  funnelType: string;
  hasWebsite: boolean | null;
  lockedBusinessType?: string;
  lockedChallenge?: string;
  verticalDirectives: {
    use: string[];
    avoid: string[];
    uncertaintyLanguage: string;
  };
  guardrails: string[];
  nextStepBias: "free_audit" | "strategy_call" | "ask_followup";
};

const DIRECTIVES: Record<
  ZoraVerticalTarget,
  { use: string[]; avoid: string[]; businessModel: string; funnelType: string }
> = {
  ecommerce_dtc: {
    use: [
      "product discovery",
      "product pages",
      "mobile UX",
      "checkout confidence",
      "reviews",
      "shipping/returns",
      "email/SMS",
      "conversion tracking",
    ],
    avoid: [],
    businessModel: "DTC ecommerce",
    funnelType: "visitor -> product discovery -> product page -> cart -> checkout -> retention",
  },
  ecommerce_b2b: {
    use: [
      "quote paths",
      "account-based purchasing",
      "product catalog clarity",
      "reorder flows",
      "procurement",
      "distributor workflows",
      "sales rep handoff",
      "tracking visibility",
    ],
    avoid: ["consumer checkout assumptions", "DTC-only recommendations"],
    businessModel: "B2B ecommerce / industrial commerce",
    funnelType: "buyer -> catalog/search -> quote/cart/account -> procurement handoff",
  },
  marketplace_or_enterprise_retail: {
    use: [
      "search/departments",
      "availability",
      "account path",
      "pickup/delivery",
      "localized fulfillment",
      "measurement confidence",
    ],
    avoid: ["small-store platform assumptions", "theme-only fixes"],
    businessModel: "marketplace or enterprise retail",
    funnelType: "visitor -> search/departments -> availability/account/cart -> fulfillment",
  },
  real_estate: {
    use: [
      "buyer leads",
      "seller leads",
      "listings",
      "local authority",
      "appointment booking",
      "CRM routing",
      "speed-to-lead",
      "source tracking",
    ],
    avoid: ["cart", "checkout", "shipping", "product discovery", "inventory"],
    businessModel: "real estate lead generation",
    funnelType: "visitor -> buyer/seller intent -> local proof -> lead capture -> booking/CRM follow-up",
  },
  healthcare_care: {
    use: [
      "intake",
      "referral flow",
      "care inquiries",
      "appointment requests",
      "trust proof",
      "service clarity",
      "response process",
      "care coordinators",
    ],
    avoid: ["carts", "checkout", "product cards", "inventory", "shoppers"],
    businessModel: "healthcare / care services",
    funnelType: "visitor/referral partner -> service clarity -> intake request -> care routing",
  },
  nonprofit_community: {
    use: [
      "visitors",
      "members",
      "donors",
      "volunteers",
      "engagement paths",
      "onboarding",
      "connection",
      "registration",
      "events",
      "community journey",
    ],
    avoid: ["pipeline", "sales", "checkout", "cart", "revenue funnel"],
    businessModel: "nonprofit / community organization",
    funnelType: "visitor -> digital engagement -> connection/registration -> local or community follow-up",
  },
  service_business: {
    use: [
      "lead capture",
      "booking flow",
      "reviews",
      "service pages",
      "speed-to-lead",
      "local landing pages",
      "follow-up",
    ],
    avoid: ["cart", "checkout", "shipping", "product cards"],
    businessModel: "service business",
    funnelType: "visitor -> service need -> trust proof -> call/form/booking -> follow-up",
  },
  b2b_saas_infrastructure: {
    use: [
      "demo requests",
      "onboarding",
      "activation",
      "sales handoff",
      "product education",
      "technical trust",
      "integration path",
      "usage visibility",
    ],
    avoid: ["DTC storefront assumptions", "shipping", "cart-first diagnosis"],
    businessModel: "B2B SaaS / infrastructure platform",
    funnelType: "visitor -> product education -> demo/signup -> onboarding -> activation/sales handoff",
  },
  domain_registrar: {
    use: [
      "domain search",
      "domain registration",
      "DNS setup",
      "hosting/email add-ons",
      "account onboarding",
      "renewals",
      "domain transfers",
      "support handoff",
    ],
    avoid: ["DTC ecommerce", "product discovery", "checkout", "shipping", "cart abandonment"],
    businessModel: "domain registrar",
    funnelType: "visitor -> domain search -> registration -> DNS/hosting setup -> account management",
  },
  unknown: {
    use: ["customer journey", "offer clarity", "lead capture", "tracking", "follow-up"],
    avoid: ["unconfirmed industry labels", "platform-specific assumptions"],
    businessModel: "unknown",
    funnelType: "visitor -> offer understanding -> action path -> follow-up",
  },
};

function textFromMessages(messages: ZoraContextEngineInput["messages"]) {
  return (messages || [])
    .map((message) => {
      if (typeof message === "string") return message;
      return message.text || message.content || message.message || "";
    })
    .filter(Boolean)
    .join(" ");
}

function normalizeUrl(value?: string | null) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || raw;
  }
}

function hasAny(text: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function verticalFromSignals(input: ZoraContextEngineInput): ZoraVerticalTarget {
  const domain = normalizeUrl(input.websiteUrl);
  const combined = [
    textFromMessages(input.messages),
    domain,
    input.businessType,
    input.confirmedIndustry,
    input.inferredIndustry,
    input.currentTopic,
    input.currentSubtopic,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const confirmed = String(input.confirmedIndustry || "").toLowerCase();

  if (confirmed) {
    if (/domain registrar|registrar|domains?|dns|porkbun|namecheap|godaddy/.test(confirmed)) return "domain_registrar";
    if (/real estate|realtor|brokerage|zillow|compass|serhant/.test(confirmed)) return "real_estate";
    if (/health|care|clinic|medical|therapy|disability/.test(confirmed)) return "healthcare_care";
    if (/nonprofit|non-profit|church|ministry|community/.test(confirmed)) return "nonprofit_community";
    if (/b2b.*(saas|platform|infrastructure)|software|api/.test(confirmed)) return "b2b_saas_infrastructure";
    if (/b2b|wholesale|distributor|industrial|supply/.test(confirmed)) return "ecommerce_b2b";
    if (/marketplace|enterprise retail/.test(confirmed)) return "marketplace_or_enterprise_retail";
    if (/service/.test(confirmed)) return "service_business";
    if (/ecommerce|dtc|shopify|store/.test(confirmed)) return "ecommerce_dtc";
  }

  if (input.industryStatus === "needs_clarification") {
    return "unknown";
  }

  if (hasAny(combined, [/\b(zillow|trulia|redfin|compass|serhant|realtor|real estate|brokerage|listings?)\b/])) {
    return "real_estate";
  }
  if (hasAny(combined, [/\b(care|healthcare|therapy|clinic|medical|disability|respite|waiver|patient|intake)\b/])) {
    return "healthcare_care";
  }
  if (
    hasAny(combined, [/\b(church|ministry|ministries|nonprofit|non-profit|donor|volunteer|members?|sermon|worship)\b/]) ||
    (domain.endsWith(".org") && !hasAny(combined, [/\b(care|health|clinic|therapy|patient|medical)\b/]))
  ) {
    return "nonprofit_community";
  }
  if (hasAny(combined, [/\b(sellvia|saas|software|api|platform|infrastructure|integration|demo request|activation|onboarding)\b/])) {
    return "b2b_saas_infrastructure";
  }
  if (hasAny(combined, [/\b(supply|industrial|wholesale|distributor|parts|procurement|quote|account-based|reorder)\b/])) {
    return "ecommerce_b2b";
  }
  if (hasAny(combined, [/\b(amazon|walmart|target|cvs|walgreens|marketplace|enterprise retail|pickup|delivery|departments?)\b/])) {
    return "marketplace_or_enterprise_retail";
  }
  if (hasAny(combined, [/\b(shopify|cart|checkout|products?|product page|add to cart|shipping|returns|dtc|online store)\b/])) {
    return "ecommerce_dtc";
  }
  if (
    input.businessType === "Service Business" ||
    hasAny(combined, [/\b(service business|booking|appointment|reviews|local landing|contractor|agency)\b/])
  ) {
    return "service_business";
  }
  if (input.businessType === "Ecommerce") return "ecommerce_dtc";
  if (input.businessType === "Real Estate") return "real_estate";
  if (input.businessType === "Care/Healthcare") return "healthcare_care";

  return "unknown";
}

export function buildZoraContext(input: ZoraContextEngineInput): ZoraContextEngineOutput {
  const hasWebsite =
    input.hasWebsite === false
      ? false
      : input.hasWebsite === true || input.websiteUrl
        ? true
        : null;
  const verticalTarget = verticalFromSignals(input);
  const directives = DIRECTIVES[verticalTarget];
  const guardrails = [
    "Answer direct interrupts before normal consulting scripts.",
    "Do not repeat a checklist used in the last two assistant turns.",
    "Use uncertainty language for inferred context; treat confirmedIndustry and selected businessType as stronger than URL guesses.",
  ];

  if (hasWebsite === false) {
    guardrails.push(
      "No live website is confirmed: never ask for a website URL again, never offer scanner/audit language, and use pre-launch architecture language.",
      "Primary CTA should be Book Strategy Call.",
    );
  }

  if (input.recentTalkingPoints?.length) {
    guardrails.push(`Recent talking points to avoid repeating verbatim: ${input.recentTalkingPoints.slice(0, 5).join(", ")}.`);
  }

  if (input.industryStatus === "needs_clarification") {
    guardrails.push(
      "Industry correction is unresolved: do not reuse previous inferred industry recommendations. Ask for business-model clarification.",
    );
  }

  const nextStepBias =
    hasWebsite === false
      ? "strategy_call"
      : hasWebsite === true &&
          ["ecommerce_dtc", "ecommerce_b2b", "marketplace_or_enterprise_retail", "b2b_saas_infrastructure"].includes(
            verticalTarget,
          )
        ? "free_audit"
        : input.businessType || input.challenge
          ? "strategy_call"
          : "ask_followup";

  return {
    verticalTarget,
    businessModel: directives.businessModel,
    funnelType: directives.funnelType,
    hasWebsite,
    lockedBusinessType: input.businessType || undefined,
    lockedChallenge: input.challenge || undefined,
    verticalDirectives: {
      use: directives.use,
      avoid: directives.avoid,
      uncertaintyLanguage: input.confirmedIndustry
        ? "The user-confirmed vertical should be treated as the source of truth."
        : "Use 'appears to be' or ask a clarification question when context is inferred.",
    },
    guardrails,
    nextStepBias,
  };
}

export function zoraContextPromptBlock(context: ZoraContextEngineOutput) {
  return [
    "[CENTRALIZED CONTEXT ENGINE]",
    `- verticalTarget: ${context.verticalTarget}`,
    `- businessModel: ${context.businessModel}`,
    `- funnelType: ${context.funnelType}`,
    `- hasWebsite: ${context.hasWebsite === null ? "unknown" : String(context.hasWebsite)}`,
    context.lockedBusinessType ? `- lockedBusinessType: ${context.lockedBusinessType}` : "",
    context.lockedChallenge ? `- lockedChallenge: ${context.lockedChallenge}` : "",
    `- nextStepBias: ${context.nextStepBias}`,
    `- Use this vocabulary: ${context.verticalDirectives.use.join(", ")}`,
    context.verticalDirectives.avoid.length
      ? `- Avoid this vocabulary unless the user used it first: ${context.verticalDirectives.avoid.join(", ")}`
      : "",
    `- Uncertainty rule: ${context.verticalDirectives.uncertaintyLanguage}`,
    ...context.guardrails.map((guardrail) => `- ${guardrail}`),
  ]
    .filter(Boolean)
    .join("\n");
}

export function contextInputFromProfile(
  profile: ZoraLeadProfile,
  extras: Partial<ZoraContextEngineInput> = {},
): ZoraContextEngineInput {
  return {
    websiteUrl: profile.websiteUrl,
    businessType: profile.businessType,
    challenge: profile.challenge,
    hasWebsite: profile.hasNoWebsite
      ? false
      : profile.hasWebsiteOrLandingPage || profile.websiteUrl
        ? true
        : extras.hasWebsite ?? null,
    conversationStage: profile.conversationStage,
    currentTopic: profile.currentTopic,
    currentSubtopic: profile.currentSubtopic,
    inferredIndustry: profile.inferredIndustry || String(profile.industry || ""),
    confirmedIndustry: profile.confirmedIndustry,
    industryStatus: profile.industryStatus,
    recentTalkingPoints: profile.recentTalkingPoints,
    ...extras,
  };
}
