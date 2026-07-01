export type ZoraIndustry =
  | "ecommerce_dtc"
  | "b2b_supply_platform"
  | "industrial_b2b_catalog"
  | "marketplace_retail"
  | "real_estate"
  | "healthcare_care"
  | "nonprofit_faith_community"
  | "service_business"
  | "local_service"
  | "education"
  | "restaurant_hospitality"
  | "unknown";

export type ZoraIndustryProfile = {
  industry: ZoraIndustry;
  confidence: "High" | "Moderate" | "Low";
  evidence: string[];
  buyerJourney: string;
  primaryBottlenecks: string[];
  recommendedFocusAreas: string[];
  preferredNextStep: "audit" | "strategy_call" | "ask_followup";
};

type ZoraIndustryInput = {
  userMessage?: string;
  websiteUrl?: string;
  businessType?: string;
  platformHint?: string;
};

type IndustryRule = {
  industry: ZoraIndustry;
  keywords: RegExp[];
  buyerJourney: string;
  primaryBottlenecks: string[];
  recommendedFocusAreas: string[];
  preferredNextStep: ZoraIndustryProfile["preferredNextStep"];
};

const knownDomainHints: Record<string, ZoraIndustry> = {
  "serhant.com": "real_estate",
  "maxx-supply.com": "industrial_b2b_catalog",
  "pvcpipesupplies.com": "industrial_b2b_catalog",
  "allbirds.com": "ecommerce_dtc",
  "sellvia.com": "b2b_supply_platform",
  "amazon.com": "marketplace_retail",
  "walmart.com": "marketplace_retail",
  "target.com": "marketplace_retail",
  "cvs.com": "marketplace_retail",
  "walgreens.com": "marketplace_retail",
  "grainger.com": "industrial_b2b_catalog",
  "uline.com": "industrial_b2b_catalog",
  "mcmaster.com": "industrial_b2b_catalog",
  "fastenal.com": "industrial_b2b_catalog",
  "elevationchurch.org": "nonprofit_faith_community",
};

const rules: IndustryRule[] = [
  {
    industry: "nonprofit_faith_community",
    keywords: [
      /\bchurch\b/i,
      /\bministry\b/i,
      /\bministries\b/i,
      /\bfaith[-\s]?based\b/i,
      /\bnon[-\s]?profit\b/i,
      /\bnonprofit\b/i,
      /\bcommunity organization\b/i,
      /\bcongregation\b/i,
      /\bcampus\b/i,
      /\bsermons?\b/i,
      /\bworship\b/i,
      /\bsmall groups?\b/i,
      /\bvolunteer\b/i,
      /\bserve\b/i,
      /\bdonate\b/i,
      /\bgiving\b/i,
      /\belevation church\b/i,
      /\belevationchurch\b/i,
    ],
    buyerJourney:
      "online visitor -> mission or program discovery -> donation, volunteer, referral, support, or contact action -> timely follow-up",
    primaryBottlenecks: [
      "mission and program clarity",
      "donation or support path",
      "volunteer routing",
      "impact proof",
      "contact or referral follow-up",
      "tracking",
    ],
    recommendedFocusAreas: [
      "mission and program clarity",
      "donation or support path",
      "volunteer routing",
      "impact proof",
      "contact or referral follow-up",
      "tracking",
    ],
    preferredNextStep: "strategy_call",
  },
  {
    industry: "real_estate",
    keywords: [
      /\brealtor\b/i,
      /\breal estate\b/i,
      /\bbrokerage\b/i,
      /\bagent\b/i,
      /\blistings?\b/i,
      /\bbuyer leads?\b/i,
      /\bseller leads?\b/i,
      /\bhome valuation\b/i,
      /\bhomes for sale\b/i,
      /\bproperty search\b/i,
      /\bidx\b/i,
      /\bmls\b/i,
      /\bserhant\b/i,
    ],
    buyerJourney:
      "visitor -> buyer/seller intent -> local proof -> lead capture -> booking/CRM follow-up",
    primaryBottlenecks: [
      "seller/buyer offer clarity",
      "local proof",
      "lead capture",
      "appointment booking",
      "CRM follow-up",
      "speed-to-lead",
      "source tracking",
    ],
    recommendedFocusAreas: [
      "buyer vs seller offer",
      "home valuation path",
      "local proof",
      "lead capture",
      "booking CTA",
      "CRM/source tracking",
    ],
    preferredNextStep: "strategy_call",
  },
  {
    industry: "healthcare_care",
    keywords: [
      /\bhealth ?care\b/i,
      /\bcare agency\b/i,
      /\bhome care\b/i,
      /\bdisability\b/i,
      /\bidd\b/i,
      /\brespite\b/i,
      /\badult day\b/i,
      /\bresidential services?\b/i,
      /\breferrals?\b/i,
      /\bintake\b/i,
      /\bpatient\b/i,
      /\bclient intake\b/i,
      /\bwaiver\b/i,
      /\bmedicaid\b/i,
    ],
    buyerJourney:
      "visitor/referral partner -> service clarity -> trust proof -> intake request -> follow-up/routing",
    primaryBottlenecks: [
      "service clarity",
      "trust signals",
      "intake form friction",
      "referral handoff",
      "response process",
      "compliance-aware messaging",
      "staff/reputation proof",
    ],
    recommendedFocusAreas: [
      "service clarity",
      "intake flow",
      "referral handoff",
      "trust proof",
      "response routing",
    ],
    preferredNextStep: "strategy_call",
  },
  {
    industry: "b2b_supply_platform",
    keywords: [
      /\bsellvia\b/i,
      /\bdrop ?ship(?:ping)?\b/i,
      /\bdropshippers?\b/i,
      /\bturnkey\b/i,
      /\becommerce platform\b/i,
      /\be-?commerce platform\b/i,
      /\bsupplier platform\b/i,
      /\bsupply network\b/i,
      /\bmerchant onboarding\b/i,
      /\bmerchant acquisition\b/i,
      /\bvendor dashboard\b/i,
      /\bapi\b/i,
      /\bplugin\b/i,
      /\bintegration(?:s)?\b/i,
      /\bstore owners?\b/i,
      /\bstore setup\b/i,
      /\becosystem\b/i,
    ],
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
  },
  {
    industry: "industrial_b2b_catalog",
    keywords: [
      /\bpipe\b/i,
      /\bfittings?\b/i,
      /\bpvc\b/i,
      /\bindustrial\b/i,
      /\bsupply\b/i,
      /\bdistributor\b/i,
      /\bwholesale\b/i,
      /\bparts?\b/i,
      /\bsku\b/i,
      /\bspecs?\b/i,
      /\bdatasheets?\b/i,
      /\bquote\b/i,
      /\bcontractor\b/i,
      /\bprocurement\b/i,
      /\bmaxx[-\s]?supply\b/i,
      /\bpvcpipesupplies\b/i,
      /\bgrainger\b/i,
      /\buline\b/i,
      /\bfastenal\b/i,
      /\bmcmaster\b/i,
    ],
    buyerJourney:
      "buyer -> search/category -> SKU/spec review -> cart/quote/account -> procurement handoff",
    primaryBottlenecks: [
      "catalog discovery",
      "search visibility",
      "specifications",
      "category structure",
      "quote/cart path",
      "account workflow",
      "procurement handoff",
    ],
    recommendedFocusAreas: [
      "catalog discovery",
      "SKU search",
      "specifications",
      "category hierarchy",
      "quote/cart/account path",
    ],
    preferredNextStep: "audit",
  },
  {
    industry: "ecommerce_dtc",
    keywords: [
      /\be-?commerce\b/i,
      /\bshopify\b/i,
      /\bbigcommerce\b/i,
      /\bwoo ?commerce\b/i,
      /\bproduct pages?\b/i,
      /\badd to cart\b/i,
      /\bcheckout\b/i,
      /\bconversion rate\b/i,
      /\babandoned cart\b/i,
      /\breviews?\b/i,
      /\ballbirds\b/i,
      /\bfashion\b/i,
      /\bapparel\b/i,
      /\bbeauty\b/i,
      /\bsupplements?\b/i,
      /\bstore\b/i,
    ],
    buyerJourney:
      "visitor -> product discovery -> product page confidence -> cart -> checkout -> retention",
    primaryBottlenecks: [
      "product discovery",
      "mobile UX",
      "product page clarity",
      "reviews/trust",
      "checkout confidence",
      "tracking",
      "email/SMS follow-up",
    ],
    recommendedFocusAreas: [
      "mobile product discovery",
      "product-page confidence",
      "reviews/trust",
      "shipping/returns clarity",
      "checkout trust",
      "tracking",
      "email/SMS",
    ],
    preferredNextStep: "audit",
  },
  {
    industry: "marketplace_retail",
    keywords: [
      /\bamazon\b/i,
      /\bwalmart\b/i,
      /\btarget\b/i,
      /\bcvs\b/i,
      /\bwalgreens\b/i,
      /\benterprise retail\b/i,
      /\bmarketplace\b/i,
      /\bgrocery\b/i,
      /\bsupermarket\b/i,
      /\bpickup\b/i,
      /\bdelivery\b/i,
      /\bdepartments?\b/i,
      /\bweekly ad\b/i,
      /\bpharmacy\b/i,
    ],
    buyerJourney:
      "visitor -> search/departments -> availability/pickup/delivery -> cart/account -> checkout",
    primaryBottlenecks: [
      "search/departments",
      "pickup/delivery clarity",
      "account/cart path",
      "trust and availability",
      "dense navigation",
      "measurement confidence",
    ],
    recommendedFocusAreas: [
      "search/departments",
      "pickup/delivery clarity",
      "account/cart path",
      "availability",
      "measurement confidence",
    ],
    preferredNextStep: "audit",
  },
  {
    industry: "local_service",
    keywords: [
      /\blocal service\b/i,
      /\bplumb(?:er|ing)\b/i,
      /\bhvac\b/i,
      /\broof(?:er|ing)\b/i,
      /\belectrician\b/i,
      /\blandscap(?:e|ing)\b/i,
      /\bpest control\b/i,
      /\bauto repair\b/i,
      /\bhome services?\b/i,
      /\bnear me\b/i,
      /\bservice area\b/i,
      /\bestimate\b/i,
      /\bemergency service\b/i,
    ],
    buyerJourney:
      "local visitor -> service need -> trust/local proof -> call/form/booking -> dispatch/follow-up",
    primaryBottlenecks: [
      "service-area clarity",
      "local proof",
      "call/form capture",
      "booking or estimate path",
      "speed-to-lead",
      "review visibility",
      "source tracking",
    ],
    recommendedFocusAreas: [
      "service-area clarity",
      "local proof",
      "call/form CTA",
      "estimate path",
      "review visibility",
      "source tracking",
    ],
    preferredNextStep: "strategy_call",
  },
  {
    industry: "service_business",
    keywords: [
      /\bservice business\b/i,
      /\bagency\b/i,
      /\bconsulting\b/i,
      /\bcoaching\b/i,
      /\bcontractor\b/i,
      /\bcleaning\b/i,
      /\bmed spa\b/i,
      /\blaw firm\b/i,
      /\baccounting\b/i,
      /\bappointment\b/i,
      /\bbooking\b/i,
      /\bquote request\b/i,
      /\blead form\b/i,
    ],
    buyerJourney:
      "visitor -> service understanding -> trust proof -> inquiry/booking -> follow-up",
    primaryBottlenecks: [
      "offer clarity",
      "lead capture",
      "booking flow",
      "trust proof",
      "speed-to-lead",
      "CRM/email follow-up",
      "local proof",
    ],
    recommendedFocusAreas: [
      "offer clarity",
      "lead capture",
      "booking flow",
      "trust proof",
      "speed-to-lead",
      "CRM/email follow-up",
    ],
    preferredNextStep: "strategy_call",
  },
  {
    industry: "education",
    keywords: [
      /\bschool\b/i,
      /\bcourse\b/i,
      /\btraining\b/i,
      /\bacademy\b/i,
      /\beducation\b/i,
      /\benrollment\b/i,
      /\badmissions?\b/i,
      /\bstudent\b/i,
      /\bprogram\b/i,
    ],
    buyerJourney:
      "visitor -> program clarity -> trust/outcomes -> inquiry/enrollment -> follow-up",
    primaryBottlenecks: [
      "program clarity",
      "application/inquiry flow",
      "trust/outcomes",
      "booking/admissions",
      "follow-up",
    ],
    recommendedFocusAreas: [
      "program clarity",
      "outcomes proof",
      "inquiry flow",
      "admissions booking",
      "follow-up",
    ],
    preferredNextStep: "strategy_call",
  },
  {
    industry: "restaurant_hospitality",
    keywords: [
      /\brestaurant\b/i,
      /\bhotel\b/i,
      /\bhospitality\b/i,
      /\breservation\b/i,
      /\bmenu\b/i,
      /\bcatering\b/i,
      /\bevent booking\b/i,
    ],
    buyerJourney:
      "visitor -> menu/offer -> reservation/order/event inquiry -> confirmation/follow-up",
    primaryBottlenecks: [
      "menu clarity",
      "reservation path",
      "mobile CTA",
      "local proof",
      "follow-up",
      "event/catering capture",
    ],
    recommendedFocusAreas: [
      "menu clarity",
      "reservation path",
      "mobile CTA",
      "local proof",
      "event/catering capture",
    ],
    preferredNextStep: "strategy_call",
  },
];

const unknownProfile: ZoraIndustryProfile = {
  industry: "unknown",
  confidence: "Low",
  evidence: [],
  buyerJourney:
    "visitor -> offer understanding -> action path -> follow-up",
  primaryBottlenecks: [
    "offer clarity",
    "conversion path",
    "tracking",
    "follow-up",
  ],
  recommendedFocusAreas: [
    "customer journey",
    "offer clarity",
    "lead capture",
    "tracking",
    "follow-up",
  ],
  preferredNextStep: "ask_followup",
};

function normalizeDomain(value?: string) {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname
      .replace(/^www\./i, "")
      .toLowerCase();
  } catch {
    return raw.replace(/^https?:\/\//i, "").split("/")[0]?.replace(/^www\./i, "").toLowerCase() ?? "";
  }
}

function businessTypeEvidence(value?: string) {
  const normalized = String(value ?? "").toLowerCase();

  if (!normalized) return null;
  if (normalized.includes("real estate")) return "real_estate";
  if (normalized.includes("care") || normalized.includes("health")) return "healthcare_care";
  if (normalized.includes("ecommerce")) return "ecommerce_dtc";
  if (normalized.includes("service")) return "service_business";
  return null;
}

function confidenceFor(score: number): ZoraIndustryProfile["confidence"] {
  if (score >= 3) return "High";
  if (score >= 1.5) return "Moderate";
  return "Low";
}

function profileForRule(
  rule: IndustryRule,
  confidence: ZoraIndustryProfile["confidence"],
  evidence: string[],
): ZoraIndustryProfile {
  return {
    industry: rule.industry,
    confidence,
    evidence,
    buyerJourney: rule.buyerJourney,
    primaryBottlenecks: rule.primaryBottlenecks,
    recommendedFocusAreas: rule.recommendedFocusAreas,
    preferredNextStep: rule.preferredNextStep,
  };
}

export function detectZoraIndustry(input: ZoraIndustryInput): ZoraIndustryProfile {
  const domain = normalizeDomain(input.websiteUrl);
  const text = [
    input.userMessage,
    domain,
    input.businessType,
    input.platformHint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const businessIndustry = businessTypeEvidence(input.businessType);
  const domainIndustry =
    knownDomainHints[domain] ??
    Object.entries(knownDomainHints).find(([knownDomain]) =>
      domain.endsWith(knownDomain),
    )?.[1];

  const scored = rules
    .map((rule) => {
      const evidence: string[] = [];
      let score = 0;

      if (domainIndustry === rule.industry) {
        score += 3;
        evidence.push(`known domain: ${domain}`);
      }

      if (businessIndustry === rule.industry) {
        score += 1.5;
        evidence.push(`business type: ${input.businessType}`);
      }

      rule.keywords.forEach((pattern) => {
        const match = text.match(pattern)?.[0];
        if (match) {
          score += 1;
          evidence.push(`keyword: ${match}`);
        }
      });

      return { rule, score, evidence: Array.from(new Set(evidence)) };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const top = scored[0];

  if (!top) {
    return unknownProfile;
  }

  return profileForRule(top.rule, confidenceFor(top.score), top.evidence);
}
