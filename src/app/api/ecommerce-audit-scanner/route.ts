import { NextResponse } from "next/server";
import {
  buildFriendlyValidationError,
  FieldDefinition,
  getMissingRequiredFields,
  isValidHttpUrl,
  logDevelopmentSubmission,
  methodNotAllowedResponse,
  readJsonBody,
  toCleanStringRecord,
  ValidationIssue,
} from "@/lib/form-submissions";
import {
  addScannerStageLog,
  finalizeScannerDiagnostics,
  runLightweightEcommerceDiagnostics,
  type LiveDiagnosticsResult,
} from "@/lib/ecommerce-audit-scanner";
import {
  classifySiteType,
  getScanReliabilityIssue,
  type SiteClassification,
} from "@/lib/site-classifier";
import {
  createAuditScanId,
  listAuditScans,
  logAuditScan,
  normalizeScanDomain,
} from "@/lib/audit-scan-log";
import {
  buildScoreStabilityByDomain,
  type ScoreStabilitySummary,
} from "@/lib/score-stability";
import {
  buildExecutiveOpportunityText,
  sanitizeEvidenceText,
  summarizeCtaLabels,
} from "@/lib/evidence-cleanup";
import {
  analyzeVisualUx,
  type VisualUxDiagnosticsResult,
} from "@/lib/visual-ux-diagnostics";
import {
  buildScannerDebugRecord,
  saveScannerDebugRecord,
} from "@/lib/scanner-debug-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const scannerFields: FieldDefinition[] = [
  { key: "website", label: "website URL", required: true, aliases: ["url"] },
];

type HeuristicSeverity = "Low" | "Medium" | "High" | "Critical";
type HeuristicConfidence = "Low" | "Moderate" | "High" | "Needs Review";
type HeuristicCategory =
  | "mobileConversion"
  | "trustSignals"
  | "productDiscovery"
  | "marketingVisibility"
  | "operationsContinuity"
  | "platformVisibility"
  | "visualUx"
  | "metadataClarity";

type AuditCategoryKey =
  | "uxUiIssues"
  | "conversionIssues"
  | "technicalIssues"
  | "trackingIssues"
  | "operationsIssues";

type HeuristicFinding = {
  title: string;
  category: HeuristicCategory;
  primaryCategory: AuditCategoryKey;
  secondaryCategories?: AuditCategoryKey[];
  severity: HeuristicSeverity;
  confidence: HeuristicConfidence;
  evidenceSummary: string;
  businessImpact: string;
  revenueImpact?: RevenueImpactEstimate;
  recommendedFirstAction: string;
};

type ScoreExplanation = {
  whyAssigned: string;
  evidenceInfluenced: string;
  whatWouldImprove: string;
};

type EvidenceState = "Positive" | "Negative" | "Unknown";
type ScoringConfidence = "High" | "Moderate" | "Low";

type ScoringEvidenceState = {
  visualMetricsAvailable: boolean;
  domExtractionAvailable: boolean;
  fullPageDomAvailable: boolean;
  fullPageLinksUnexpectedZero: boolean;
  scoringConfidence: ScoringConfidence;
  scoringConfidenceNote: string;
  categoryEvidenceState: Record<AuditCategoryKey, EvidenceState>;
  categoryConfidence: Record<AuditCategoryKey, ScoringConfidence>;
};

type VisualUxState = {
  available: boolean;
  score: number | null;
  confidence: "High" | "Moderate" | "Low" | "Unavailable";
  findings: VisualUxDiagnosticsResult["findings"];
  reducers: string[];
  positiveSignals: string[];
};

type PositiveUxSignalLabel = "strong" | "moderate" | "weak" | "unknown";

type PositiveUxSignal = {
  score: number;
  label: PositiveUxSignalLabel;
  evidence: string[];
  scoreImpact: number;
};

type PositiveUxSignalKey =
  | "searchProminence"
  | "categoryVisibility"
  | "productDensity"
  | "trustSignals"
  | "hierarchyStrength"
  | "navigationClarity"
  | "commerceConfidence"
  | "visualConsistency"
  | "cartVisibility"
  | "checkoutVisibility"
  | "accountVisibility"
  | "productDiscoveryStrength";

type PositiveUxSignals = Record<PositiveUxSignalKey, PositiveUxSignal>;

type OverallScoreExplanation = {
  positiveSignals: string[];
  majorPenalties: string[];
  scoreReducers?: string[];
  whyThisScore: string;
  scoringConfidence?: ScoringConfidence;
  confidenceNote?: string;
  benchmarkContext?: BenchmarkContext;
  scanCoverage?: ScanCoverage;
  pageType?: PageTypeDetection;
};

type ScoreExplanationSnapshot = {
  overallScore: number;
  scoringConfidence: ScoringConfidence;
  scoringConfidenceNote: string;
  positiveSignals: string[];
  scoreReducers: string[];
  benchmarkContext?: BenchmarkContext;
  benchmarkGroup?: string;
  benchmarkLabel?: string;
  visualMetricsAvailable: boolean;
  visualUxScore: number | null;
  evidenceUnknown: boolean;
  categoryScores: {
    key: AuditCategoryKey;
    label: string;
    score: number;
    status: string;
    evidenceState?: EvidenceState;
    scoringConfidence?: ScoringConfidence;
    whatWouldImprove?: string;
  }[];
  whatWouldIncreaseScore: string[];
};

type ScoreNarrative = {
  overallScore: number;
  strongestPositives: string[];
  strongestReducers: string[];
  confidence: ScoringConfidence;
  confidenceExplanation: string;
  explanation: string;
  whatWouldIncreaseScore: string[];
  scoreChangeContext?: {
    scanCount: number;
    minScore: number;
    maxScore: number;
    scoreVariation: number;
    scoreStability: ScoreStabilitySummary["scoreStability"];
    latestChangeReasons: string[];
    explanation: string;
  };
};

type EcommerceMaturityTier =
  | "enterprise"
  | "mature"
  | "developing"
  | "early"
  | "unclear";

type EcommerceMaturityScore = {
  maturityScore: number;
  maturityTier: EcommerceMaturityTier;
  positiveSignals: string[];
  maturityReducers: string[];
  explanation: string;
};

type CoverageSignalSet = {
  cartVisible: boolean;
  checkoutVisible: boolean;
  searchVisible: boolean;
  categoryProductVisible: boolean;
  productCardCount: number;
  ctaVisible: boolean;
  trustSignalsVisible: boolean;
  shippingReturnsVisible: boolean;
  orderReturnsVisible: boolean;
  accountLoginVisible: boolean;
  supportContactVisible: boolean;
  visualUxFindingCount?: number;
  visualUxScore?: number | null;
};

type ScanCoverage = {
  submittedUrlOnly: boolean;
  screenshotMode: "viewport" | "full-page";
  domCoverage: "visible" | "full-page";
  scoringCoverage: "above-fold" | "near-fold" | "full-page";
  aboveFoldCoverage: string;
  nearFoldCoverage: string;
  fullPageDomCoverage: string;
  screenshotCoverage: string;
  scoringCoverageSummary: string;
  coverageWarnings: string[];
  aboveFoldSignals: CoverageSignalSet;
  nearFoldSignals: CoverageSignalSet;
  fullPageSignals: CoverageSignalSet;
  visualSignals: CoverageSignalSet;
  manualConfirmationSignals: {
    platformNeedsReview: boolean;
    trackingNeedsReview: boolean;
    screenshotModeRequiresInterpretation: boolean;
  };
  coverageSummary: string;
  explanation: string;
};

type OverallScoringResult = {
  overallScore: number;
  positiveUxSignals: PositiveUxSignals;
  ecommerceMaturity: EcommerceMaturityScore;
  scoreExplanation: OverallScoreExplanation;
};

type ConnectedInsight = {
  title: string;
  insight: string;
  findingTitles: string[];
};

type PrimaryOperationalConcern = {
  title: string;
  riskLabel: string;
  severity: HeuristicSeverity;
  confidence: HeuristicConfidence;
  explanation: string;
  evidenceSummary: string;
  recommendedFirstAction: string;
  supportingFindings: string[];
};

type StorefrontIdentityProfile = {
  domain: string;
  businessScale:
    | "enterprise"
    | "growth"
    | "brand"
    | "education"
    | "lead-capture"
    | "unknown";
  architectureStyle:
    | "standard-platform"
    | "enterprise-custom"
    | "custom"
    | "unknown";
  commerceMaturity: "advanced" | "moderate" | "early" | "unknown";
  operationalPattern:
    | "enterprise-retail"
    | "catalog-commerce"
    | "brand-commerce"
    | "education-commerce"
    | "lead-capture"
    | "unknown";
  platformConfidence: "high" | "moderate" | "low" | "unknown";
  identitySignals: string[];
  identitySummary: string;
  identityOpening: string;
  identityFraming: string;
};

type StorefrontReviewSiteType =
  | "ecommerce-storefront"
  | "enterprise-retail"
  | "catalog-commerce"
  | "lead-generation"
  | "education/content-commerce"
  | "non-ecommerce-or-unclear"
  | "custom-enterprise";

type StorefrontReviewContext = {
  siteType: StorefrontReviewSiteType;
  confidence: HeuristicConfidence;
  reason: string;
  supportingSignals: string[];
};

type BenchmarkNote = {
  message: string;
  evidence: string;
  tags: string[];
  tone: "positive" | "negative" | "mixed";
};

type BenchmarkContext = {
  benchmarkGroup: string;
  percentileEstimate: number | null;
  benchmarkLabel:
    | "Top Tier"
    | "Above Average"
    | "Average"
    | "Below Average"
    | "Needs Work"
    | "Insufficient Data";
  comparisonBasis: string[];
  strengthsVsBenchmark: string[];
  weaknessesVsBenchmark: string[];
  explanation: string;
  summary: string;
  notes: BenchmarkNote[];
  benchmarkTags: string[];
  recurringPositivePatterns: string[];
  recurringNegativePatterns: string[];
  signalScore: number;
};

type PageTypeDetection = {
  submittedPageType:
    | "Homepage"
    | "Product Detail Page"
    | "Collection / Category Page"
    | "Cart / Checkout"
    | "Landing Page"
    | "Lead Capture / Service Page"
    | "Content / Article Page"
    | "Unknown";
  confidence: number;
  evidence: string[];
  scoringNote: string;
};

type CompetitiveComparison = {
  comparisonSet: string[];
  expectedPatterns: string[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
};

type RevenueImpactEstimate = {
  findingTitle: string;
  riskArea:
    | "Conversion"
    | "Average Order Value"
    | "Lead Quality"
    | "Trust"
    | "Tracking"
    | "Operations"
    | "Engagement";
  likelyImpact: string;
  severity: HeuristicSeverity;
  confidence: HeuristicConfidence;
  explanation: string;
};

type RevenueImpactSummary = {
  summary: string;
  estimates: RevenueImpactEstimate[];
  revenueRiskAreas: string[];
};

type RecommendationRoadmapStep = {
  stepNumber: number;
  title: string;
  cost: string;
  timeline: string;
  rationale: string;
  validationTarget: string;
  expectedImpact: string;
  roiRationale: string;
  sourceFinding?: string;
  riskArea?: RevenueImpactEstimate["riskArea"];
  confidence?: HeuristicConfidence;
};

type RecommendationRoadmap = {
  summary: string;
  primaryRecommendation: string;
  source: {
    scanId: string;
    domain: string;
    siteType: string;
    benchmarkGroup: string;
    score: number;
  };
  steps: RecommendationRoadmapStep[];
  step1?: RecommendationRoadmapStep;
  step2?: RecommendationRoadmapStep;
  step3?: RecommendationRoadmapStep;
  step4?: RecommendationRoadmapStep;
  step5?: RecommendationRoadmapStep;
  step6?: RecommendationRoadmapStep;
  step7?: RecommendationRoadmapStep;
};

type RecommendationRoadmapInputStep = {
  title: string;
  action: string;
  why: string;
  evidenceClue?: string;
};

const knownEnterpriseRetailDomains = [
  "amazon.com",
  "walmart.com",
  "target.com",
  "apple.com",
  "bestbuy.com",
  "nike.com",
  "costco.com",
  "homedepot.com",
  "lowes.com",
];

const knownGroceryRetailDomains = [
  "sprouts.com",
  "publix.com",
  "harristeeter.com",
  "kroger.com",
  "wholefoodsmarket.com",
  "safeway.com",
  "albertsons.com",
  "wegmans.com",
  "heb.com",
  "meijer.com",
  "stopandshop.com",
];

const groceryFlowEnterpriseDomains = ["walmart.com"];

const groceryRetailTerms = [
  "grocery",
  "groceries",
  "fresh produce",
  "organic food",
  "natural food",
  "pickup",
  "delivery",
  "curbside",
  "weekly ad",
  "store locator",
  "pharmacy",
  "deli",
  "bakery",
  "meat",
  "seafood",
  "prepared foods",
  "vitamins",
  "supplements",
  "coupons",
  "loyalty",
  "rewards",
  "shop by aisle",
  "departments",
  "recipes",
  "catering",
];

const knownEducationContentDomains = [
  "pearson.com",
  "education.adp.com",
];

const knownHealthcareCommerceDomains = [
  "cvs.com",
  "walgreens.com",
  "riteaid.com",
  "healthwarehouse.com",
  "1mg.com",
];

const knownB2BCommerceDomains = [
  "grainger.com",
  "uline.com",
  "mcmaster.com",
  "fastenal.com",
];

function safeHost(value: string | null | undefined) {
  if (!value) return "";

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0]?.replace(/^www\./, "").toLowerCase() ?? "";
  }
}

function domainMatches(domain: string, candidates: string[]) {
  return candidates.some((candidate) => domain === candidate || domain.endsWith(`.${candidate}`));
}

function textHasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function textMatches(text: string, terms: string[]) {
  return terms.filter((term) => text.includes(term));
}

function hasIndustrialSupplyEvidence(text: string) {
  const strongCatalogSignal =
    /plumbing|pvc|cpvc|pipe|pipes|fittings?|valves?|flange|coupling|elbow|adapter|schedule 40|schedule 80|replacement parts?|part number|sku|specification|datasheet|technical/i.test(
      text,
    );
  const b2bSupplySignal =
    /industrial|supply|distributor|wholesale|contractor|trade/i.test(text) &&
    /catalog|quote|rfq|procurement|sku|part number|specification|technical|product|category|search/i.test(
      text,
    );

  return strongCatalogSignal || b2bSupplySignal;
}

function hasGroceryRetailEvidence(host: string, text: string) {
  const matches = textMatches(text, groceryRetailTerms);
  const isKnownGrocery = domainMatches(host, knownGroceryRetailDomains);

  if (!isKnownGrocery && hasIndustrialSupplyEvidence(text)) {
    return false;
  }

  const isEnterpriseGroceryFlow =
    domainMatches(host, groceryFlowEnterpriseDomains) &&
    (matches.length >= 3 || /\/(grocery|groceries|food|pickup-delivery|cp\/food|browse\/food)\b/i.test(text));

  return isKnownGrocery || isEnterpriseGroceryFlow || matches.length >= 4;
}

function classifyStorefrontReviewContext({
  website,
  diagnostics,
}: {
  website: string;
  diagnostics: LiveDiagnosticsResult;
}): StorefrontReviewContext {
  const reliabilityIssue = getScanReliabilityIssue(diagnostics, website);

  if (reliabilityIssue) {
    return {
      siteType: "non-ecommerce-or-unclear",
      confidence: "Needs Review",
      reason: reliabilityIssue.reason,
      supportingSignals: reliabilityIssue.evidence.slice(0, 5),
    };
  }

  const commerce = diagnostics.commerceFlowSignals;
  const storefront = diagnostics.storefrontSignals;
  const domain = safeHost(diagnostics.finalUrl || website);
  const platform = diagnostics.platformDetection;
  const pageCorpus = [
    diagnostics.title,
    diagnostics.metaDescription,
    diagnostics.finalUrl,
    diagnostics.commerceFlowSignals.ctaLabels.join(" "),
    diagnostics.conversionSignals.ctaLabels.join(" "),
    diagnostics.storefrontSignals.mobileCtaLabels.join(" "),
    diagnostics.fullPageDomSignals.ctaLabels.join(" "),
    diagnostics.fullPageDomSignals.productLinks.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const supportingSignals: string[] = [];

  const isKnownEnterprise = domainMatches(domain, knownEnterpriseRetailDomains);
  const isKnownEducationContent = domainMatches(domain, knownEducationContentDomains);
  const isKnownIndustrialCatalog = /(?:maxx-supply\.com|maxxsupply\.com|pvcsupply\.com|pvcfittingsonline\.com|supplyhouse\.com|grainger\.com|uline\.com|mcmaster\.com|fastenal\.com|motion\.com|globalindustrial\.com)$/i.test(domain);
  const platformIsEnterprise = platform.name === "Enterprise / Custom Commerce Stack";
  const cartOrCheckoutVisible = commerce.cartVisible || commerce.checkoutVisible;
  const fullPage = diagnostics.fullPageDomSignals;
  const productEvidenceVisible =
    commerce.productCatalogVisible ||
    storefront.productNavigationVisible ||
    storefront.collectionLinksVisible ||
    fullPage.categoryProductVisible ||
    fullPage.productCardCount >= 2 ||
    fullPage.productLinks.length >= 2;
  const catalogSignalsVisible =
    productEvidenceVisible || (storefront.searchVisible && cartOrCheckoutVisible);
  const productCatalogPathVisible =
    productEvidenceVisible;
  const leadPathVisible = commerce.formVisible || storefront.leadCaptureVisible;
  const ctaVisible = commerce.ctaVisible || commerce.ctaCount > 0;
  const nonStandardPlatformNames = [
    "Unknown",
    "Needs Manual Review",
    "Enterprise / Custom Commerce Stack",
    "Not an ecommerce storefront",
    "Ecommerce probability unclear",
    "Platform not confidently identified",
  ];
  const hasStandardPlatformConfidence =
    !nonStandardPlatformNames.includes(platform.name) &&
    platform.confidence >= 70;
  const hasCommerceLanguage = textHasAny(pageCorpus, [
    "shop",
    "cart",
    "checkout",
    "product",
    "category",
    "collection",
    "buy",
    "order",
    "shipping",
    "returns",
    "store",
    "sku",
    "part",
    "catalog",
    "industrial",
    "supply",
  ]);
  const hasEducationLanguage = textHasAny(pageCorpus, [
    "education",
    "learning",
    "course",
    "training",
    "academy",
    "certification",
    "student",
    "school",
    "university",
    "class",
  ]);
  const hasLeadGenLanguage = textHasAny(pageCorpus, [
    "contact",
    "book",
    "schedule",
    "request",
    "demo",
    "consultation",
    "quote",
    "talk to",
    "get started",
    "apply",
    "portfolio",
    "services",
    "wedding",
    "event",
    "music",
    "lesson",
    "performance",
  ]);
  const hasStrongCommerceEvidence =
    (productEvidenceVisible && cartOrCheckoutVisible) ||
    (productEvidenceVisible && hasStandardPlatformConfidence) ||
    (isKnownEnterprise && (catalogSignalsVisible || hasCommerceLanguage));
  const leadGenOutweighsCommerce =
    (leadPathVisible || hasLeadGenLanguage || ctaVisible) &&
    !productEvidenceVisible &&
    !isKnownEnterprise;

  if (isKnownEnterprise) {
    supportingSignals.push("Known major enterprise retail domain.");
  }

  if (isKnownIndustrialCatalog) {
    supportingSignals.push("Known industrial distributor or B2B catalog ecommerce domain.");
  }

  if (platformIsEnterprise) {
    supportingSignals.push("Public platform evidence points to a custom or heavily abstracted commerce stack.");
  } else if (!hasStandardPlatformConfidence) {
    supportingSignals.push("Standard platform confidence is not strong enough for platform-specific assumptions.");
  }

  if (cartOrCheckoutVisible) {
    supportingSignals.push("Cart or checkout signals are visible in the public sample.");
  }

  if (catalogSignalsVisible) {
    supportingSignals.push("Product, category, collection, or search signals are visible.");
  }

  if (leadPathVisible || ctaVisible) {
    supportingSignals.push("CTA or form signals are visible.");
  }

  if (hasEducationLanguage) {
    supportingSignals.push("Page language points to an education, learning, course, or content journey.");
  }

  if (isKnownEducationContent || (hasEducationLanguage && !productCatalogPathVisible)) {
    return {
      siteType: "education/content-commerce",
      confidence: isKnownEducationContent ? "High" : "Moderate",
      reason:
        "The public evidence points more strongly to an education, course, account, or content journey than to a standard retail checkout flow.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  if (platformIsEnterprise || isKnownEnterprise) {
    if (!hasStrongCommerceEvidence) {
      return {
        siteType: leadGenOutweighsCommerce
          ? "lead-generation"
          : "non-ecommerce-or-unclear",
        confidence: leadGenOutweighsCommerce ? "High" : "Needs Review",
        reason:
          "The public page does not expose enough product, category, cart, or checkout evidence to classify it as enterprise retail.",
        supportingSignals: supportingSignals.slice(0, 5),
      };
    }

    return {
      siteType: platformIsEnterprise ? "custom-enterprise" : "enterprise-retail",
      confidence: catalogSignalsVisible || hasCommerceLanguage ? "High" : "Moderate",
      reason:
        "The public page appears to be part of a large or custom commerce environment where platform and purchase-path details may be intentionally abstracted.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  if (
    isKnownIndustrialCatalog ||
    (hasStandardPlatformConfidence && (productCatalogPathVisible || hasCommerceLanguage))
  ) {
    return {
      siteType: cartOrCheckoutVisible ? "ecommerce-storefront" : "catalog-commerce",
      confidence: isKnownIndustrialCatalog || hasStandardPlatformConfidence ? "High" : "Moderate",
      reason: cartOrCheckoutVisible
        ? "The public page exposes standard ecommerce platform evidence and purchase-path signals."
        : "The public page exposes standard ecommerce platform or industrial catalog evidence, but cart or checkout is not clearly visible in this sample.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  if (
    cartOrCheckoutVisible &&
    hasCommerceLanguage &&
    productCatalogPathVisible &&
    (hasStandardPlatformConfidence || commerce.cartVisible || commerce.checkoutVisible)
  ) {
    return {
      siteType: "ecommerce-storefront",
      confidence: catalogSignalsVisible && cartOrCheckoutVisible ? "High" : "Moderate",
      reason:
        "The public page exposes enough catalog and purchase-path evidence to treat it as a storefront review.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  if (productCatalogPathVisible && hasCommerceLanguage && !cartOrCheckoutVisible) {
    return {
      siteType: "catalog-commerce",
      confidence: "Moderate",
      reason:
        "The public page exposes product discovery signals, but the cart or checkout path is not clearly visible in this sample.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  if ((leadPathVisible || ctaVisible || hasLeadGenLanguage) && !hasStrongCommerceEvidence) {
    return {
      siteType: "lead-generation",
      confidence: leadPathVisible || hasLeadGenLanguage ? "High" : "Moderate",
      reason:
        "The visible journey appears to route users toward a CTA, form, or handoff rather than a standard product checkout.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  return {
    siteType: "non-ecommerce-or-unclear",
    confidence: "Needs Review",
    reason:
      "The submitted page does not expose enough public catalog, cart, checkout, or lead-path evidence to classify it as a standard ecommerce storefront.",
    supportingSignals: supportingSignals.length
      ? supportingSignals.slice(0, 5)
      : ["No complete public ecommerce journey was visible in the lightweight scan."],
  };
}

const auditCategoryTemplates = [
  {
    key: "uxUiIssues",
    label: "UX/UI",
    score: 88,
    purpose:
      "Readability, spacing, visual hierarchy, navigation clarity, layout crowding, and discoverability.",
  },
  {
    key: "conversionIssues",
    label: "Conversion",
    score: 86,
    purpose:
      "CTA visibility, purchase momentum, cart/checkout continuity, trust, and conversion friction.",
  },
  {
    key: "technicalIssues",
    label: "Technical",
    score: 84,
    purpose:
      "Console errors, failed requests, metadata, rendering confidence, and technical reliability.",
  },
  {
    key: "trackingIssues",
    label: "Tracking",
    score: 84,
    purpose:
      "Analytics visibility, attribution visibility, marketing tags, and event tracking concerns.",
  },
  {
    key: "operationsIssues",
    label: "Ecommerce Operations",
    score: 86,
    purpose:
      "Support/contact visibility, fulfillment communication, operational continuity, and workflow handoff.",
  },
] satisfies Array<{
  key: AuditCategoryKey;
  label: string;
  score: number;
  purpose: string;
}>;

function adjustedStatus(score: number) {
  if (score < 65) {
    return "High Priority";
  }

  if (score < 80) {
    return "Needs Review";
  }

  return "Healthy";
}

function adjustedPriority(score: number) {
  if (score < 65) {
    return "High";
  }

  if (score < 80) {
    return "Medium";
  }

  return "Low";
}

function severityWeight(severity: HeuristicSeverity) {
  if (severity === "Critical") {
    return 18;
  }

  if (severity === "High") {
    return 12;
  }

  if (severity === "Medium") {
    return 7;
  }

  return 3;
}

function impactRank(severity: HeuristicSeverity) {
  return severity === "Critical"
    ? 4
    : severity === "High"
      ? 3
      : severity === "Medium"
        ? 2
        : 1;
}

function confidenceRank(confidence: HeuristicConfidence) {
  return confidence === "High"
    ? 3
    : confidence === "Moderate"
      ? 2
      : confidence === "Needs Review"
        ? 1
        : 0;
}

function findingImpactScore(finding: HeuristicFinding) {
  const categoryWeight =
    finding.primaryCategory === "conversionIssues" ||
    finding.primaryCategory === "operationsIssues"
      ? 3
      : finding.primaryCategory === "uxUiIssues" ||
          finding.primaryCategory === "trackingIssues"
        ? 2
        : 1;

  return impactRank(finding.severity) * 10 + categoryWeight + confidenceRank(finding.confidence);
}

function archetypeTextForFinding(finding: HeuristicFinding) {
  return [
    finding.title,
    finding.category,
    finding.primaryCategory,
    finding.secondaryCategories?.join(" "),
    finding.evidenceSummary,
    finding.businessImpact,
    finding.recommendedFirstAction,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function calculateNarrativeWeight(
  finding: HeuristicFinding,
  archetype: NarrativeArchetype,
) {
  const affinity = archetypeAffinity[archetype] ?? archetypeAffinity["balanced-review"];
  const text = archetypeTextForFinding(finding);
  const severityScore = severityWeight(finding.severity) * 2.4;
  const impactScore = findingImpactScore(finding);
  const confidenceScore =
    finding.confidence === "High"
      ? 7
      : finding.confidence === "Moderate"
        ? 5
        : finding.confidence === "Needs Review"
          ? 4
          : 1;
  const categoryAffinity = affinity.findingCategories.includes(finding.category)
    ? 24
    : 0;
  const ownerAffinity = affinity.primaryCategories.includes(finding.primaryCategory)
    ? 18
    : 0;
  const secondaryAffinity = (finding.secondaryCategories ?? []).some((category) =>
    affinity.primaryCategories.includes(category),
  )
    ? 8
    : 0;
  const keywordMatches = affinity.keywords.filter((keyword) =>
    text.includes(keyword),
  ).length;
  const vocabularyMatches = affinity.vocabulary.filter((keyword) =>
    text.includes(keyword.toLowerCase()),
  ).length;
  const businessImpactAffinity = affinity.keywords.some((keyword) =>
    finding.businessImpact.toLowerCase().includes(keyword),
  )
    ? 8
    : 0;

  return (
    severityScore +
    impactScore +
    confidenceScore +
    categoryAffinity +
    ownerAffinity +
    secondaryAffinity +
    keywordMatches * 4 +
    vocabularyMatches * 3 +
    businessImpactAffinity
  );
}

function narrativeSortedFindings(
  findings: HeuristicFinding[],
  archetype: NarrativeArchetype,
) {
  return findings
    .slice()
    .sort(
      (left, right) =>
        calculateNarrativeWeight(right, archetype) -
          calculateNarrativeWeight(left, archetype) ||
        findingImpactScore(right) - findingImpactScore(left) ||
        severityWeight(right.severity) - severityWeight(left.severity),
    );
}

function calculateNarrativeModeWeight(
  finding: HeuristicFinding,
  narrativeProfile?: NarrativeProfile,
) {
  if (narrativeProfile?.narrativeMode !== "Grocery / Supermarket Retail") {
    return 0;
  }

  const text = archetypeTextForFinding(finding);
  const customerJourneyTerms = [
    "search",
    "department",
    "category",
    "catalog",
    "navigation",
    "pickup",
    "delivery",
    "curbside",
    "weekly ad",
    "coupon",
    "promotion",
    "loyalty",
    "reward",
    "store locator",
    "mobile",
    "cart",
    "checkout",
    "product discovery",
  ];
  const groceryConfidenceTerms = [
    "fresh",
    "availability",
    "fulfillment",
    "timing",
    "support",
    "trust",
  ];
  const platformTerms = [
    "platform visibility",
    "platform confidence",
    "manual review",
    "platform-specific",
    "magento",
    "shopify",
    "bigcommerce",
    "woocommerce",
  ];

  const customerJourneyBoost = customerJourneyTerms.filter((term) => text.includes(term)).length * 18;
  const confidenceBoost = groceryConfidenceTerms.some((term) => text.includes(term)) ? 24 : 0;
  const platformPenalty =
    platformTerms.some((term) => text.includes(term)) && finding.severity !== "Critical"
      ? -70
      : 0;

  return customerJourneyBoost + confidenceBoost + platformPenalty;
}

function narrativeSortedFindingsForProfile(
  findings: HeuristicFinding[],
  archetype: NarrativeArchetype,
  narrativeProfile?: NarrativeProfile,
) {
  if (!narrativeProfile) {
    return narrativeSortedFindings(findings, archetype);
  }

  return findings
    .slice()
    .sort(
      (left, right) =>
        calculateNarrativeWeight(right, archetype) +
          calculateNarrativeModeWeight(right, narrativeProfile) -
          (calculateNarrativeWeight(left, archetype) +
            calculateNarrativeModeWeight(left, narrativeProfile)) ||
        findingImpactScore(right) - findingImpactScore(left) ||
        severityWeight(right.severity) - severityWeight(left.severity),
    );
}

function findingInfluencesCategory(
  finding: HeuristicFinding,
  categoryKey: AuditCategoryKey,
) {
  return (
    finding.primaryCategory === categoryKey ||
    finding.secondaryCategories?.includes(categoryKey) === true
  );
}

function findingsOwnedByCategory(
  findings: HeuristicFinding[],
  categoryKey: AuditCategoryKey,
) {
  return findings.filter((finding) => finding.primaryCategory === categoryKey);
}

function findingsInfluencingCategory(
  findings: HeuristicFinding[],
  categoryKey: AuditCategoryKey,
) {
  return findings.filter((finding) => findingInfluencesCategory(finding, categoryKey));
}

function visibleMarketingTools(diagnostics: LiveDiagnosticsResult) {
  return diagnostics.technologyDetections.filter(
    (tool) =>
      tool.detected &&
      [
        "googleAnalytics",
        "googleTagManager",
        "metaPixel",
        "klaviyo",
        "mailchimp",
      ].includes(tool.key),
  );
}

function platformNeedsManualReview(diagnostics: LiveDiagnosticsResult) {
  return (
    diagnostics.platformDetection.name === "Unknown" ||
    diagnostics.platformDetection.name === "Enterprise / Custom Commerce Stack" ||
    diagnostics.platformDetection.name === "Needs Manual Review" ||
    diagnostics.platformDetection.name === "Not an ecommerce storefront" ||
    diagnostics.platformDetection.name === "Ecommerce probability unclear" ||
    diagnostics.platformDetection.name === "Platform not confidently identified" ||
    diagnostics.platformDetection.confidenceLabel === "Low confidence" ||
    diagnostics.platformDetection.confidenceLabel === "Needs Review"
  );
}

function trustSignalCount(diagnostics: LiveDiagnosticsResult) {
  const signals = diagnostics.storefrontSignals;
  return [
    signals.reviewSignalsVisible,
    signals.shippingReturnsVisible,
    signals.warrantyGuaranteeVisible,
    signals.paymentTrustVisible,
    signals.contactSupportVisible,
    signals.policyVisible,
  ].filter(Boolean).length;
}

function visibleEvidenceList(items: string[]) {
  return items.length > 0 ? items.join(", ") : "none detected";
}

function isEnterpriseVisibilityContext(
  diagnostics: LiveDiagnosticsResult,
  siteClassification?: SiteClassification,
  visualUxDiagnostics?: VisualUxDiagnosticsResult,
) {
  const host = safeHost(diagnostics.finalUrl);
  const combined = [
    siteClassification?.siteType,
    diagnostics.platformDetection.platformName,
    visualUxDiagnostics?.uxArchetype,
    diagnostics.title,
    diagnostics.metaDescription,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    domainMatches(host, knownEnterpriseRetailDomains) ||
    domainMatches(host, knownHealthcareCommerceDomains) ||
    /enterprise|marketplace|healthcare commerce|pharmacy retail|custom commerce|pharmacy|prescription|rx|otc|patient/.test(
      combined,
    )
  );
}

function healthcareCommerceCorpus(diagnostics: LiveDiagnosticsResult) {
  return [
    diagnostics.title,
    diagnostics.metaDescription,
    diagnostics.finalUrl,
    diagnostics.commerceFlowSignals.ctaLabels.join(" "),
    diagnostics.conversionSignals.ctaLabels.join(" "),
    diagnostics.storefrontSignals.mobileCtaLabels.join(" "),
    diagnostics.fullPageDomSignals.ctaLabels.join(" "),
    diagnostics.fullPageDomSignals.productLinks.join(" "),
    diagnostics.desktopVisualMetrics?.visibleTextSample,
    diagnostics.mobileVisualMetrics?.visibleTextSample,
    ...(diagnostics.desktopVisualMetrics?.visibleLinks ?? []),
    ...(diagnostics.mobileVisualMetrics?.visibleLinks ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function enterpriseRetailJourneySignalCount(diagnostics: LiveDiagnosticsResult) {
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const text = healthcareCommerceCorpus(diagnostics);
  const discoveryVisible =
    signals.productNavigationVisible ||
    signals.collectionLinksVisible ||
    commerce.productCatalogVisible ||
    fullPage.categoryProductVisible ||
    fullPage.productCardCount > 0 ||
    fullPage.productLinks.length > 0;
  const fulfillmentPathVisible =
    /pickup|delivery|ship to|store locator|nearby store|curbside|same day/.test(
      text,
    );
  const accountOrReorderVisible =
    fullPage.accountLoginVisible ||
    /account|sign in|login|log in|reorder|buy it again|purchase history/.test(
      text,
    );
  const departmentPathVisible =
    /department|departments|category|categories|shop by|aisle|grocery|pharmacy|electronics|home|fashion|beauty/.test(
      text,
    );

  return [
    signals.searchVisible || fullPage.searchVisible,
    discoveryVisible,
    commerce.cartVisible || fullPage.cartVisible,
    fulfillmentPathVisible,
    accountOrReorderVisible,
    departmentPathVisible,
    commerce.ctaCount > 0 || fullPage.ctaLabels.length > 0,
  ].filter(Boolean).length;
}

function isHealthcareCommerceContext(
  diagnostics: LiveDiagnosticsResult,
  siteClassification?: SiteClassification,
  visualUxDiagnostics?: VisualUxDiagnosticsResult,
) {
  const host = safeHost(diagnostics.finalUrl);
  const combined = [
    siteClassification?.siteType,
    diagnostics.platformDetection.platformName,
    visualUxDiagnostics?.uxArchetype,
    healthcareCommerceCorpus(diagnostics),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    domainMatches(host, knownHealthcareCommerceDomains) ||
    /healthcare commerce|pharmacy retail|pharmacy|prescription|rx|otc|patient|clinic|appointment|vaccination|medication/.test(
      combined,
    )
  );
}

function healthcareJourneySignalCount(diagnostics: LiveDiagnosticsResult) {
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const text = healthcareCommerceCorpus(diagnostics);
  const accountVisible =
    fullPage.accountLoginVisible ||
    /account|sign in|login|log in|my cvs|extra care|extracare/.test(text);
  const healthcarePathVisible =
    /pharmacy|prescription|rx|otc|appointment|vaccination|minuteclinic|store locator|coupons|deals/.test(
      text,
    );
  const discoveryVisible =
    signals.productNavigationVisible ||
    signals.collectionLinksVisible ||
    commerce.productCatalogVisible ||
    fullPage.categoryProductVisible ||
    fullPage.productCardCount > 0 ||
    fullPage.productLinks.length > 0;

  return [
    signals.searchVisible || fullPage.searchVisible,
    discoveryVisible,
    accountVisible,
    healthcarePathVisible,
    commerce.cartVisible || fullPage.cartVisible || commerce.checkoutVisible || fullPage.checkoutVisible,
    commerce.ctaCount > 0 || fullPage.ctaLabels.length > 0,
  ].filter(Boolean).length;
}

function isConfidenceReducerFinding(finding: HeuristicFinding) {
  return (
    finding.confidence === "Needs Review" ||
    /visibility needs confirmation|confidence needs confirmation|manual review|enterprise tracking|server-side|consent-based|hidden/i.test(
      `${finding.title} ${finding.businessImpact} ${finding.evidenceSummary}`,
    )
  );
}

function buildScoringEvidenceState(
  diagnostics: LiveDiagnosticsResult,
  visualUxDiagnostics: VisualUxDiagnosticsResult,
  siteClassification?: SiteClassification,
): ScoringEvidenceState {
  const fullPage = diagnostics.fullPageDomSignals;
  const fullPageDomAvailable =
    fullPage.visibleLinkCount > 0 ||
    fullPage.headingCount > 0 ||
    fullPage.buttonCount > 0 ||
    fullPage.formCount > 0 ||
    fullPage.productCardCount > 0;
  const visualMetricsAvailable = visualUxDiagnostics.visualMetricsAvailable;
  const domExtractionAvailable = Boolean(
    diagnostics.desktopVisualMetrics ||
      diagnostics.mobileVisualMetrics ||
      fullPageDomAvailable,
  );
  const fullPageLinksUnexpectedZero = Boolean(
    !diagnostics.scanError &&
      diagnostics.finalUrl &&
      fullPage.visibleLinkCount === 0,
  );
  const rootCauseText = [
    diagnostics.scanDiagnostics?.error?.category,
    diagnostics.scanDiagnostics?.error?.message,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const subsystemFailed =
    !visualMetricsAvailable ||
    !domExtractionAvailable ||
    fullPageLinksUnexpectedZero ||
    /visual metrics|dom extraction|selector|page blocked|blocked|captcha/.test(rootCauseText);
  const enterpriseVisibilityContext = isEnterpriseVisibilityContext(
    diagnostics,
    siteClassification,
    visualUxDiagnostics,
  );
  const visibilityConfidenceLimited =
    enterpriseVisibilityContext &&
    (visibleMarketingTools(diagnostics).length <= 1 ||
      platformNeedsManualReview(diagnostics));
  const scoringConfidence: ScoringConfidence = subsystemFailed
    ? "Low"
    : visibilityConfidenceLimited ||
        diagnostics.warnings.length > 0 ||
        diagnostics.failedRequests.length > 0
      ? "Moderate"
      : "High";
  const unknownDomCategory = !domExtractionAvailable || fullPageLinksUnexpectedZero;
  const nonStorefrontReview = isNonStorefrontClassification(
    siteClassification?.siteType,
  );
  const categoryEvidenceState: Record<AuditCategoryKey, EvidenceState> = {
    uxUiIssues:
      nonStorefrontReview || !visualMetricsAvailable || unknownDomCategory
        ? "Unknown"
        : "Negative",
    conversionIssues: nonStorefrontReview || unknownDomCategory ? "Unknown" : "Negative",
    technicalIssues: subsystemFailed && rootCauseText ? "Negative" : "Negative",
    trackingIssues: unknownDomCategory ? "Unknown" : "Negative",
    operationsIssues: nonStorefrontReview || unknownDomCategory ? "Unknown" : "Negative",
  };
  const categoryConfidence: Record<AuditCategoryKey, ScoringConfidence> = {
    uxUiIssues: categoryEvidenceState.uxUiIssues === "Unknown" ? "Low" : scoringConfidence,
    conversionIssues:
      categoryEvidenceState.conversionIssues === "Unknown" ? "Low" : scoringConfidence,
    technicalIssues: scoringConfidence,
    trackingIssues:
      categoryEvidenceState.trackingIssues === "Unknown" ? "Low" : scoringConfidence,
    operationsIssues:
      categoryEvidenceState.operationsIssues === "Unknown" ? "Low" : scoringConfidence,
  };
  const scoringConfidenceNote =
    scoringConfidence === "Low"
      ? "Some scanner subsystems could not evaluate this page. Findings should be treated as directional until visual and DOM extraction complete successfully."
      : visibilityConfidenceLimited
        ? "Some enterprise visibility signals were intentionally opaque or not exposed publicly, so tracking and platform findings reduce confidence more than score."
      : scoringConfidence === "Moderate"
        ? "Some public-page evidence was partial, so the score should be reviewed with the diagnostic details nearby."
        : "Core scanner subsystems collected enough evidence for a normal confidence score.";

  return {
    visualMetricsAvailable,
    domExtractionAvailable,
    fullPageDomAvailable,
    fullPageLinksUnexpectedZero,
    scoringConfidence,
    scoringConfidenceNote,
    categoryEvidenceState,
    categoryConfidence,
  };
}

function isNonStorefrontClassification(siteType: string | null | undefined) {
  const normalized = (siteType ?? "").toLowerCase();

  return (
    normalized.includes("non-ecommerce") ||
    normalized.includes("lead generation") ||
    normalized.includes("service business")
  );
}

function categoryEvidenceKnown(
  evidenceState: ScoringEvidenceState | undefined,
  key: AuditCategoryKey,
) {
  return evidenceState?.categoryEvidenceState[key] !== "Unknown";
}

function buildVisualUxState(
  visualUxDiagnostics: VisualUxDiagnosticsResult,
): VisualUxState {
  const score = usableVisualUxScore(visualUxDiagnostics);
  const findings = visualUxDiagnostics.findings ?? [];
  const reducers = [
    ...findings.map((finding) => finding.title),
    ...(visualUxDiagnostics.desktopConcerns ?? []),
    ...(visualUxDiagnostics.mobileConcerns ?? []),
  ].filter(Boolean);
  const positiveSignals =
    score !== null && score >= 80
      ? [
          `Visual UX score ${score}/100`,
          visualUxDiagnostics.summary,
        ].filter(Boolean)
      : [];

  return {
    available: score !== null,
    score,
    confidence: visualUxDiagnostics.visualUxConfidence,
    findings,
    reducers,
    positiveSignals,
  };
}

function missingTrustSignalLabels(diagnostics: LiveDiagnosticsResult) {
  const signals = diagnostics.storefrontSignals;
  const missing = [
    !signals.reviewSignalsVisible ? "reviews or testimonials" : "",
    !signals.shippingReturnsVisible ? "shipping or returns" : "",
    !signals.warrantyGuaranteeVisible ? "warranty or guarantee" : "",
    !signals.paymentTrustVisible ? "secure payment cues" : "",
    !signals.contactSupportVisible ? "support or contact" : "",
    !signals.policyVisible ? "policy links" : "",
  ].filter(Boolean);

  return missing.length > 0 ? missing.join(", ") : "no major trust groups missing";
}

function categoryStatusDetailFallback(
  key: string,
  score: number,
  diagnostics: LiveDiagnosticsResult,
) {
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);

  if (key === "uxUiIssues") {
    if (!signals.mobileCtaVisibleAboveFold) return "Mobile Primary Action Not Evident Above Fold";
    if (!signals.searchVisible) return "Store Search Not Prominent";
    if (signals.mobileCrowdingRisk) return "First-Screen Mobile Density Elevated";
    return score >= 80 ? "Mobile Journey Signals Look Stable" : "Mobile Journey Evidence Needs Confirmation";
  }

  if (key === "conversionIssues") {
    if (trustSignalsVisible <= 2) return "Purchase Confidence Cues Are Thin";
    if (!signals.shippingReturnsVisible) return "Shipping / Returns Reassurance Limited";
    return score >= 80 ? "Purchase Confidence Signals Look Stable" : "Conversion Evidence Needs Confirmation";
  }

  if (key === "technicalIssues") {
    if (platformNeedsManualReview(diagnostics)) return "Platform Evidence Needs Manual Confirmation";
    if (diagnostics.consoleErrors.length > 0) return "Frontend Console Issues Observed";
    if (diagnostics.failedRequests.length > 0) return "Failed Frontend Requests Observed";
    return score >= 80 ? "Technical Signals Look Stable" : "Technical Evidence Needs Confirmation";
  }

  if (key === "trackingIssues") {
    if (marketingTools.length === 0) return "Marketing Attribution Tags Not Visible";
    if (marketingTools.length === 1) return "Tracking Stack Appears Thin";
    return score >= 80 ? "Tracking Visibility Looks Stable" : "Tracking Evidence Needs Confirmation";
  }

  if (!commerce.cartVisible && !commerce.checkoutVisible) return "Cart and Checkout Entry Points Not Clear";
  if (!commerce.cartVisible) return "Cart Entry Point Not Clear";
  if (!commerce.checkoutVisible) return "Checkout Entry Point Not Clear";
  if (!signals.contactSupportVisible) return "Support Path Not Prominent";
  return score >= 80 ? "Commerce Operations Signals Look Stable" : "Operations Evidence Needs Confirmation";
}

function mobileCtaFirstAction(diagnostics: LiveDiagnosticsResult) {
  const labels = diagnostics.commerceFlowSignals.ctaLabels
    .filter((label, index, labels) => labels.indexOf(label) === index)
    .slice(0, 2);

  if (labels.length > 0) {
    return `Reuse the strongest existing CTA (${labels.join(" or ")}) inside the first mobile viewport and make it visually distinct from secondary links.`;
  }

  return "Add one clear primary shopping, product, or contact CTA inside the first mobile viewport and keep it visually separate from secondary links.";
}

function mobileCrowdingFirstAction(diagnostics: LiveDiagnosticsResult) {
  const signals = diagnostics.storefrontSignals;

  if (signals.mobileAboveFoldLinkCount >= 24) {
    return `Reduce first-screen mobile link clusters; this scan saw ${signals.mobileAboveFoldLinkCount} visible links before scroll, so secondary navigation should move behind a clearer menu hierarchy.`;
  }

  if (signals.mobileVisibleTextLength >= 2200) {
    return `Trim first-screen mobile copy and promotional text; this scan counted about ${signals.mobileVisibleTextLength} visible text characters before scroll.`;
  }

  return `Rebalance the first mobile viewport around one primary action; this scan saw ${signals.mobileAboveFoldLinkCount} links and about ${signals.mobileVisibleTextLength} text characters before scroll.`;
}

function cartCheckoutFirstAction(diagnostics: LiveDiagnosticsResult) {
  const commerce = diagnostics.commerceFlowSignals;

  if (!commerce.cartVisible && !commerce.checkoutVisible) {
    return "Add clear cart and checkout entry points to the header, product area, or cart drawer so shoppers can move from browsing to buying.";
  }

  if (!commerce.cartVisible) {
    return "Expose the cart entry point near product decisions and persistent navigation so shoppers can recover purchase intent quickly.";
  }

  return "Make the checkout entry point clear from cart-adjacent areas so shoppers can move from cart review to purchase without hunting.";
}

function productDiscoveryFirstAction(diagnostics: LiveDiagnosticsResult) {
  const signals = diagnostics.storefrontSignals;

  if (!signals.productNavigationVisible && !signals.collectionLinksVisible) {
    return "Add visible product categories or collections to the main navigation and first browsing section.";
  }

  if (!signals.productNavigationVisible) {
    return "Rename or restructure top navigation so product categories are obvious before shoppers open deeper menus.";
  }

  return "Add collection or product links in the early browsing path so category intent does not depend only on generic navigation.";
}

function buildHeuristicFindings(
  diagnostics: LiveDiagnosticsResult,
  visualUxDiagnostics?: VisualUxDiagnosticsResult,
  siteClassification?: SiteClassification,
  evidenceState?: ScoringEvidenceState,
): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const enterpriseVisibilityContext = isEnterpriseVisibilityContext(
    diagnostics,
    siteClassification,
    visualUxDiagnostics,
  );
  const canEvaluate = (key: AuditCategoryKey) =>
    categoryEvidenceKnown(evidenceState, key);

  const addFinding = (finding: HeuristicFinding) =>
    findings.push({
      ...finding,
      evidenceSummary: sanitizeEvidenceText(finding.evidenceSummary),
      recommendedFirstAction: sanitizeEvidenceText(
        finding.recommendedFirstAction,
        { maxLength: 220 },
      ),
    });

  if (canEvaluate("conversionIssues") && !signals.mobileCtaVisibleAboveFold) {
    const healthcareMultiPathHomepage =
      isHealthcareCommerceContext(diagnostics, siteClassification, visualUxDiagnostics) &&
      healthcareJourneySignalCount(diagnostics) >= 4;
    const enterpriseMultiEntryHomepage =
      !healthcareMultiPathHomepage &&
      enterpriseVisibilityContext &&
      enterpriseRetailJourneySignalCount(diagnostics) >= 4;

    addFinding({
      title: healthcareMultiPathHomepage
        ? "Mobile Journey Priority Needs Review"
        : enterpriseMultiEntryHomepage
          ? "Mobile Journey Entry Priority Needs Review"
          : "Mobile CTA Visibility Needs Review",
      category: "mobileConversion",
      primaryCategory: "conversionIssues",
      secondaryCategories: ["uxUiIssues"],
      severity: healthcareMultiPathHomepage || enterpriseMultiEntryHomepage ? "Medium" : "High",
      confidence: "Moderate",
      businessImpact: healthcareMultiPathHomepage
        ? "Healthcare commerce homepages often support prescriptions, appointments, store lookup, account access, coupons, and shopping at once, so this is a journey-priority issue rather than proof that conversion is weak."
        : enterpriseMultiEntryHomepage
          ? "Enterprise retail homepages often convert through search, departments, pickup, delivery, reorder, account, and cart entry points, so the absence of one dominant promo CTA should be treated as journey prioritization rather than weak conversion."
        : "Primary mobile CTA visibility may weaken after the hero section, making the next step less obvious for mobile shoppers.",
      recommendedFirstAction: enterpriseMultiEntryHomepage
        ? "Confirm search, departments, pickup, delivery, reorder, account, and cart are visually prioritized as the primary enterprise retail entry paths before treating secondary service CTAs as conversion drivers."
        : mobileCtaFirstAction(diagnostics),
      evidenceSummary: healthcareMultiPathHomepage
        ? `No single dominant mobile CTA was detected, but ${healthcareJourneySignalCount(diagnostics)} healthcare commerce journey signal groups were visible. ${summarizeCtaLabels(commerce.ctaLabels)} Mobile first-screen links: ${signals.mobileAboveFoldLinkCount}.`
        : enterpriseMultiEntryHomepage
          ? `No single dominant mobile CTA was detected, but ${enterpriseRetailJourneySignalCount(diagnostics)} enterprise retail journey signal groups were visible. ${summarizeCtaLabels(commerce.ctaLabels)} Mobile first-screen links: ${signals.mobileAboveFoldLinkCount}.`
        : `No strong CTA was detected in the first mobile viewport. ${summarizeCtaLabels(commerce.ctaLabels)} Mobile first-screen links: ${signals.mobileAboveFoldLinkCount}.`,
    });
  }

  if (canEvaluate("uxUiIssues") && signals.mobileCrowdingRisk) {
    addFinding({
      title: "Mobile Readability May Be Crowded",
      category: "mobileConversion",
      primaryCategory: "uxUiIssues",
      secondaryCategories: ["conversionIssues"],
      severity: "Medium",
      confidence: "Needs Review",
      businessImpact:
        "Dense first-screen content can make the primary action compete with navigation, promotional copy, or secondary links.",
      recommendedFirstAction: mobileCrowdingFirstAction(diagnostics),
      evidenceSummary:
        `The mobile first viewport showed ${signals.mobileAboveFoldLinkCount} visible links and about ${signals.mobileVisibleTextLength} visible text characters, which triggered a crowding risk.`,
    });
  }

  if (canEvaluate("conversionIssues") && (!commerce.cartVisible || !commerce.checkoutVisible)) {
    const enterpriseMarketplaceContext =
      String(visualUxDiagnostics?.uxArchetype ?? "").toLowerCase().includes("enterprise") ||
      String(visualUxDiagnostics?.uxArchetype ?? "").toLowerCase().includes("marketplace") ||
      diagnostics.platformDetection.platformName === "Enterprise / Custom Commerce Stack";
    const enterpriseCommercePathVisible =
      enterpriseMarketplaceContext &&
      (commerce.cartVisible ||
        fullPage.cartVisible ||
        fullPage.accountLoginVisible ||
        fullPage.categoryProductVisible);

    addFinding({
      title: enterpriseCommercePathVisible
        ? "Checkout Path Ownership Needs Confirmation"
        : "Cart / Checkout Path Needs Review",
      category: "operationsContinuity",
      primaryCategory: "conversionIssues",
      secondaryCategories: ["operationsIssues"],
      severity: enterpriseCommercePathVisible
        ? "Low"
        : !commerce.cartVisible && !commerce.checkoutVisible
          ? "Critical"
          : "High",
      confidence: "Moderate",
      businessImpact: enterpriseCommercePathVisible
        ? "Enterprise marketplaces often route checkout after cart, account, location, or product selection, so homepage checkout absence should not dominate the customer-facing score."
        : "If cart or checkout cues are not easy to find, purchase intent can leak before a customer reaches the buying path.",
      recommendedFirstAction: enterpriseCommercePathVisible
        ? "Confirm cart, account, fulfillment, and checkout ownership from the actual transaction path before treating homepage checkout visibility as a conversion defect."
        : cartCheckoutFirstAction(diagnostics),
      evidenceSummary: `Cart visibility: ${commerce.cartVisible || fullPage.cartVisible ? "visible" : "not visible"}; checkout visibility: ${commerce.checkoutVisible || fullPage.checkoutVisible ? "visible" : "not visible"}; enterprise commerce path: ${enterpriseCommercePathVisible ? "visible" : "not confirmed"}.`,
    });
  }

  if (canEvaluate("uxUiIssues") && (!signals.productNavigationVisible || !signals.collectionLinksVisible)) {
    addFinding({
      title: "Product Discovery Clarity Needs Review",
      category: "productDiscovery",
      primaryCategory: "uxUiIssues",
      secondaryCategories: ["conversionIssues"],
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Customers may need too many steps to find products, categories, or collections from the first storefront experience.",
      recommendedFirstAction: productDiscoveryFirstAction(diagnostics),
      evidenceSummary:
        `Product/category navigation: ${signals.productNavigationVisible ? "visible" : "not visible"}; collection/product links: ${signals.collectionLinksVisible ? "visible" : "not visible"}.`,
    });
  }

  if (canEvaluate("uxUiIssues") && !signals.searchVisible) {
    addFinding({
      title: "Store Search Visibility Needs Review",
      category: "productDiscovery",
      primaryCategory: "uxUiIssues",
      secondaryCategories: ["conversionIssues"],
      severity: "Medium",
      confidence: "Moderate",
      businessImpact:
        "Store search does not appear prominently in the visible navigation, which may slow product discovery for catalog-heavy stores.",
      recommendedFirstAction:
        "Expose search in the desktop header and mobile menu, then confirm it returns useful product and category results.",
      evidenceSummary:
        "No visible search input or search-labeled navigation item was detected in the public page sample.",
    });
  }

  visualUxDiagnostics?.findings.forEach((finding) => {
    addFinding({
      title: finding.title,
      category: "visualUx",
      primaryCategory: "uxUiIssues",
      secondaryCategories:
        finding.title.includes("Product Discovery") ||
        finding.title.includes("Mobile Content")
          ? ["conversionIssues"]
          : undefined,
      severity: finding.severity,
      confidence:
        finding.confidence === "High"
          ? "High"
          : finding.confidence === "Moderate"
            ? "Moderate"
            : "Low",
      businessImpact: finding.businessImpact,
      recommendedFirstAction: finding.recommendedFirstAction,
      evidenceSummary: finding.evidenceSummary,
    });
  });

  if (canEvaluate("conversionIssues") && trustSignalsVisible <= 2) {
    addFinding({
      title: "Trust Signal Visibility Needs Review",
      category: "trustSignals",
      primaryCategory: "conversionIssues",
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Weak early trust cues can reduce purchase confidence, especially for new visitors comparing unfamiliar stores.",
      recommendedFirstAction:
        "Add the strongest reassurance cues near product decisions: reviews, shipping/returns, support, guarantee, secure payment, or policies.",
      evidenceSummary: `${trustSignalsVisible} of 6 common trust-signal groups were visible. Missing or weak groups: ${missingTrustSignalLabels(diagnostics)}.`,
    });
  }

  if (canEvaluate("conversionIssues") && !signals.shippingReturnsVisible) {
    addFinding({
      title: "Shipping and Returns Messaging Not Prominent",
      category: "trustSignals",
      primaryCategory: "conversionIssues",
      secondaryCategories: ["operationsIssues"],
      severity: "Medium",
      confidence: "Moderate",
      businessImpact:
        "Shipping and returns clarity helps customers decide whether buying now feels low-risk.",
      recommendedFirstAction:
        "Place shipping, delivery, returns, or exchange messaging near product detail decisions and in the cart path.",
      evidenceSummary:
        "The scan did not find prominent shipping, delivery, returns, exchange, or refund wording in visible page content.",
    });
  }

  if (canEvaluate("trackingIssues") && marketingTools.length === 0) {
    addFinding({
      title: enterpriseVisibilityContext
        ? "Measurement Visibility Needs Confirmation"
        : "Marketing Attribution Visibility Appears Limited",
      category: "marketingVisibility",
      primaryCategory: "trackingIssues",
      severity: enterpriseVisibilityContext ? "Low" : "High",
      confidence: enterpriseVisibilityContext ? "Needs Review" : "Moderate",
      businessImpact: enterpriseVisibilityContext
        ? "Enterprise healthcare, retail, banking, and insurance sites often hide, delay, consent-gate, or move analytics server-side, so missing public tags should reduce measurement confidence rather than imply weak tracking quality."
        : "Limited visible analytics or marketing tags can make campaign performance harder to trust before increasing spend.",
      recommendedFirstAction:
        "Confirm client-side, server-side, consent-based, and delayed analytics coverage with internal tag documentation or analytics access before treating public tag visibility as a performance defect.",
      evidenceSummary: enterpriseVisibilityContext
        ? "No supported marketing tools were visible in public markup, but enterprise tracking may be hidden, delayed, consent-based, or server-side."
        : "No supported marketing tools were detected from public page markup, visible DOM content, or loaded frontend assets.",
    });
  } else if (canEvaluate("trackingIssues") && marketingTools.length === 1) {
    addFinding({
      title: enterpriseVisibilityContext
        ? "Measurement Visibility Needs Confirmation"
        : "Tracking Stack Appears Limited",
      category: "marketingVisibility",
      primaryCategory: "trackingIssues",
      severity: enterpriseVisibilityContext ? "Low" : "Medium",
      confidence: enterpriseVisibilityContext ? "Needs Review" : "Moderate",
      businessImpact: enterpriseVisibilityContext
        ? "Only one public analytics signal was visible, but enterprise tracking may be hidden, delayed, consent-based, or server-side. This is a confidence limitation, not confirmed weak tracking."
        : "A thin visible tracking stack may leave gaps in attribution, retargeting, or customer follow-up visibility.",
      recommendedFirstAction:
        "Map the visible tag to the full purchase path and confirm whether analytics, pixel, email, or conversion events are intentionally handled server-side or behind consent.",
      evidenceSummary: `Visible supported marketing tool: ${marketingTools[0].label}.`,
    });
  }

  if (canEvaluate("operationsIssues") && !signals.leadCaptureVisible && !signals.contactSupportVisible) {
    addFinding({
      title: "Support or Lead Path Visibility Limited",
      category: "operationsContinuity",
      primaryCategory: "operationsIssues",
      secondaryCategories: ["conversionIssues"],
      severity: "Medium",
      confidence: "Moderate",
      businessImpact:
        "When customers cannot quickly find support or a lead path, questions can turn into abandoned sessions.",
      recommendedFirstAction:
        "Add a clear support, contact, chat, or email capture route from the primary storefront journey.",
      evidenceSummary:
        "The loaded page did not show a clear form, newsletter, contact, support, or help-center signal.",
    });
  }

  if (canEvaluate("operationsIssues") && !signals.orderReturnsLanguageVisible) {
    addFinding({
      title: "Order and Returns Communication Needs Review",
      category: "operationsContinuity",
      primaryCategory: "operationsIssues",
      secondaryCategories: ["conversionIssues"],
      severity: "Medium",
      confidence: "Moderate",
      businessImpact:
        "Clear order, delivery, and returns communication reduces support load and post-purchase uncertainty.",
      recommendedFirstAction:
        "Surface order status, delivery, shipping, return, exchange, or refund information before checkout.",
      evidenceSummary:
        "No strong order status, delivery, shipping, return, exchange, or refund language was detected.",
    });
  }

  if (canEvaluate("technicalIssues") && platformNeedsManualReview(diagnostics)) {
    addFinding({
      title: enterpriseVisibilityContext
        ? "Platform Confidence Needs Confirmation"
        : "Platform Visibility Needs Manual Review",
      category: "platformVisibility",
      primaryCategory: "technicalIssues",
      severity: enterpriseVisibilityContext ? "Low" : "Medium",
      confidence: "Needs Review",
      businessImpact: enterpriseVisibilityContext
        ? "Platform opacity is normal for large healthcare, retail, marketplace, banking, and insurance sites. It should reduce platform confidence, not count as a customer-facing platform problem."
        : "Platform-specific recommendations should wait until the storefront foundation is confirmed.",
      recommendedFirstAction:
        "Confirm platform clues from source assets, cart and checkout URLs, product URL patterns, and admin or team knowledge before making platform-specific recommendations.",
      evidenceSummary:
        diagnostics.platformDetection.explanation ??
        "The scanner did not find enough reliable public-page evidence to confidently identify the platform.",
    });
  }

  if (canEvaluate("technicalIssues") && !diagnostics.metaDescription) {
    addFinding({
      title: "Search Snippet Clarity Needs Review",
      category: "metadataClarity",
      primaryCategory: "technicalIssues",
      severity: "Low",
      confidence: "High",
      businessImpact:
        "Missing or unclear metadata can weaken search snippets and first-impression relevance.",
      recommendedFirstAction:
        "Add or refine the homepage meta description so it explains the store, offer, and audience clearly.",
      evidenceSummary: "No meta description was found in the loaded page metadata.",
    });
  }

  return findings.sort(
    (a, b) =>
      findingImpactScore(b) - findingImpactScore(a) ||
      severityWeight(b.severity) - severityWeight(a.severity),
  );
}

function categoryEvidencePenalty(
  key: string,
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
  siteClassification?: SiteClassification,
  evidenceState?: ScoringEvidenceState,
) {
  if (
    evidenceState?.categoryEvidenceState[key as AuditCategoryKey] === "Unknown"
  ) {
    return 0;
  }

  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const categoryFindings = findingsInfluencingCategory(
    findings,
    key as AuditCategoryKey,
  );
  const enterpriseVisibilityContext = isEnterpriseVisibilityContext(
    diagnostics,
    siteClassification,
  );
  const enterpriseMultiEntryHomepage =
    enterpriseVisibilityContext &&
    enterpriseRetailJourneySignalCount(diagnostics) >= 4;
  const findingPressure = Math.min(
    14,
    categoryFindings
      .filter((finding) => !isConfidenceReducerFinding(finding))
      .reduce(
        (total, finding) => total + Math.ceil(severityWeight(finding.severity) / 2),
        0,
      ),
  );

  if (key === "uxUiIssues") {
    const visualFindings = categoryFindings.filter((finding) => finding.category === "visualUx");
    const visualPenalty = Math.min(
      8,
      visualFindings.reduce(
        (total, finding) => total + (finding.severity === "High" ? 4 : finding.severity === "Medium" ? 2 : 1),
        0,
      ),
    );

    return (
      findingPressure +
      visualPenalty +
      (!signals.mobileCtaVisibleAboveFold ? (enterpriseMultiEntryHomepage ? 1 : 5) : 0) +
      (signals.mobileCrowdingRisk ? 4 : 0) +
      (!signals.productNavigationVisible && !fullPage.categoryProductVisible ? 4 : 0) +
      (!signals.collectionLinksVisible && !fullPage.categoryProductVisible ? 3 : 0) +
      (!signals.searchVisible && !fullPage.searchVisible ? 2 : 0) +
      Math.min(4, Math.floor(signals.mobileAboveFoldLinkCount / 18)) +
      Math.min(3, signals.genericNavigationCount) +
      (signals.mobileVisibleTextLength > 2400 ? 3 : signals.mobileVisibleTextLength > 1600 ? 2 : 0) +
      (commerce.ctaCount === 0 ? 2 : commerce.ctaCount === 1 ? 1 : 0)
    );
  }

  if (key === "conversionIssues") {
    const effectiveTrustSignalsVisible = Math.max(
      trustSignalsVisible,
      fullPage.trustSignalsVisible ? 2 : 0,
    );

    return (
      findingPressure +
      (6 - effectiveTrustSignalsVisible) * 2 +
      (!signals.shippingReturnsVisible && !fullPage.shippingReturnsVisible ? 4 : 0) +
      (!signals.contactSupportVisible && !fullPage.supportContactVisible ? 3 : 0) +
      (!signals.warrantyGuaranteeVisible ? 2 : 0) +
      (!signals.policyVisible ? 2 : 0) +
      (!signals.paymentTrustVisible ? 3 : 0) +
      (!signals.reviewSignalsVisible ? 2 : 0) +
      (!signals.mobileCtaVisibleAboveFold ? (enterpriseMultiEntryHomepage ? 1 : 3) : 0)
    );
  }

  if (key === "technicalIssues") {
    const siteType = siteClassification?.siteType.toLowerCase() ?? "";
    const isEnterpriseOrMarketplace =
      siteType.includes("enterprise") ||
      siteType.includes("marketplace") ||
      enterpriseVisibilityContext;
    const platformReviewPenalty = platformNeedsManualReview(diagnostics)
      ? isEnterpriseOrMarketplace
        ? 0
        : 8
      : 0;
    const lowConfidencePenalty =
      diagnostics.platformDetection.confidence > 0 && diagnostics.platformDetection.confidence < 65
        ? isEnterpriseOrMarketplace
          ? 1
          : 3
        : 0;
    const consolePenalty = isEnterpriseOrMarketplace
      ? Math.min(2, diagnostics.consoleErrors.length)
      : Math.min(10, diagnostics.consoleErrors.length * 3);
    const failedRequestPenalty = isEnterpriseOrMarketplace
      ? Math.min(2, diagnostics.failedRequests.length)
      : Math.min(7, diagnostics.failedRequests.length * 2);

    return (
      findingPressure +
      (diagnostics.title ? 0 : 3) +
      (diagnostics.metaDescription ? 0 : 3) +
      platformReviewPenalty +
      lowConfidencePenalty +
      (diagnostics.platformDetection.confidenceLabel === "Moderate confidence" ? 1 : 0) +
      consolePenalty +
      failedRequestPenalty
    );
  }

  if (key === "trackingIssues") {
    const trackingVisibilityPenalty =
      marketingTools.length === 0
        ? enterpriseVisibilityContext
          ? 2
          : 18
        : marketingTools.length === 1
          ? enterpriseVisibilityContext
            ? 1
            : 10
          : marketingTools.length === 2
            ? enterpriseVisibilityContext
              ? 0
              : 5
            : 0;

    return (
      findingPressure +
      trackingVisibilityPenalty +
      (!signals.leadCaptureVisible ? 3 : 0) +
      (!signals.contactSupportVisible ? 2 : 0) +
      (enterpriseVisibilityContext ? 0 : Math.min(5, diagnostics.consoleErrors.length)) +
      (enterpriseVisibilityContext ? 0 : Math.min(4, diagnostics.failedRequests.length))
    );
  }

  const supportOnlyOperationsPenalty =
    (signals.contactSupportVisible || fullPage.supportContactVisible) &&
    !signals.orderReturnsLanguageVisible &&
    !fullPage.orderReturnsVisible &&
    !signals.shippingReturnsVisible &&
    !fullPage.shippingReturnsVisible
      ? 5
      : 0;

  return (
    findingPressure +
    (!commerce.cartVisible && !fullPage.cartVisible ? 9 : 0) +
    (!commerce.checkoutVisible && !fullPage.checkoutVisible ? 9 : 0) +
    (!signals.contactSupportVisible && !fullPage.supportContactVisible ? 5 : 0) +
    (!signals.orderReturnsLanguageVisible && !fullPage.orderReturnsVisible ? 5 : 0) +
    (!signals.shippingReturnsVisible && !fullPage.shippingReturnsVisible ? 3 : 0) +
    supportOnlyOperationsPenalty +
    (!signals.leadCaptureVisible ? 2 : 0) +
    (!signals.policyVisible ? 2 : 0) +
    (!signals.searchVisible && !fullPage.searchVisible && commerce.productCatalogVisible ? 1 : 0)
  );
}

function buildScoreExplanation({
  key,
  score,
  diagnostics,
  findings,
  evidenceState,
  visualUxState,
  positiveUxSignals,
}: {
  key: string;
  score: number;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  evidenceState?: ScoringEvidenceState;
  visualUxState?: VisualUxState;
  positiveUxSignals?: PositiveUxSignals;
}): ScoreExplanation {
  const categoryKey = key as AuditCategoryKey;

  if (evidenceState?.categoryEvidenceState[categoryKey] === "Unknown") {
    if (categoryKey === "uxUiIssues") {
      return {
        whyAssigned:
          "Visual metrics unavailable, so UX/UI was not fully scored.",
        evidenceInfluenced:
          "Visual UX was unavailable and navigation, product discovery, and mobile hierarchy signals were treated as directional only.",
        whatWouldImprove:
          "Rerun the scan when visual metrics and DOM extraction complete successfully, then review UX/UI with full evidence.",
      };
    }

    return {
      whyAssigned:
        "Assigned as low-confidence because the scanner could not fully evaluate this evidence area.",
      evidenceInfluenced:
        "Subsystem evidence was unavailable, so missing signals were treated as unknown instead of negative.",
      whatWouldImprove:
        "Rerun the scan when visual and DOM extraction complete successfully, then review this category again.",
    };
  }

  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const primaryFindings = findingsOwnedByCategory(findings, key as AuditCategoryKey);
  const influencingFindings = findingsInfluencingCategory(
    findings,
    key as AuditCategoryKey,
  );
  const driver = primaryFindings[0]?.title;
  const secondaryInfluenceCount = Math.max(
    0,
    influencingFindings.length - primaryFindings.length,
  );
  const secondaryContext =
    secondaryInfluenceCount > 0
      ? ` ${secondaryInfluenceCount} related cross-category signal${secondaryInfluenceCount === 1 ? "" : "s"} also influenced the score.`
      : "";
  const scoreBand =
    score < 65 ? "high-priority" : score < 80 ? "needs-review" : "healthy";

  if (key === "uxUiIssues") {
    const visualScoreText =
      visualUxState?.available && typeof visualUxState.score === "number"
        ? `${visualUxState.score}/100`
        : "unavailable";
    const confidenceText =
      visualUxState?.confidence ?? evidenceState?.categoryConfidence.uxUiIssues ?? "Moderate";
    const productDiscovery =
      positiveUxSignals?.productDiscoveryStrength.label ?? "unknown";
    const navigationClarity =
      positiveUxSignals?.navigationClarity.label ?? "unknown";
    const mobileHierarchy =
      signals.mobileCrowdingRisk
        ? "crowded"
        : signals.mobileCtaVisibleAboveFold
          ? "clear enough for this scan"
          : "needs confirmation";

    return {
      whyAssigned: `Assigned as ${scoreBand} from Visual UX score (${visualScoreText}), product discovery, navigation clarity, mobile hierarchy, and confidence level (${confidenceText}).`,
      evidenceInfluenced: driver
        ? `${driver}; product discovery: ${productDiscovery}; navigation clarity: ${navigationClarity}; mobile hierarchy: ${mobileHierarchy}; search visible: ${signals.searchVisible ? "yes" : "no"}; first-screen links: ${signals.mobileAboveFoldLinkCount}.${secondaryContext}`
        : `Visual UX: ${visualScoreText}; product discovery: ${productDiscovery}; navigation clarity: ${navigationClarity}; mobile hierarchy: ${mobileHierarchy}; search visible: ${signals.searchVisible ? "yes" : "no"}; generic navigation cues: ${signals.genericNavigationCount}.${secondaryContext}`,
      whatWouldImprove:
        "Lighter mobile density, clearer visual hierarchy, visible search, and clearer product/category paths would raise this score.",
    };
  }

  if (key === "conversionIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} based on purchase momentum, CTA visibility, checkout continuity, and purchase-confidence cues.`,
      evidenceInfluenced: driver
        ? `${driver}; trust-signal groups visible: ${trustSignalsVisible} of 6; cart: ${commerce.cartVisible ? "visible" : "not visible"}; checkout: ${commerce.checkoutVisible ? "visible" : "not visible"}.${secondaryContext}`
        : `${trustSignalsVisible} of 6 trust-signal groups were visible; missing or weak groups: ${missingTrustSignalLabels(diagnostics)}; mobile CTA above fold: ${signals.mobileCtaVisibleAboveFold ? "yes" : "no"}.${secondaryContext}`,
      whatWouldImprove:
        "A prominent buying action, clear cart or checkout path, reviews, shipping/returns clarity, and payment reassurance near product decisions would improve it.",
    };
  }

  if (key === "technicalIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} from platform confidence, metadata, console errors, and failed request evidence.`,
      evidenceInfluenced: driver
        ? `${driver}; platform: ${diagnostics.platformDetection.name} (${diagnostics.platformDetection.confidenceLabel}, ${diagnostics.platformDetection.confidence}%); console errors: ${diagnostics.consoleErrors.length}; failed requests: ${diagnostics.failedRequests.length}.`
        : `Platform: ${diagnostics.platformDetection.name} (${diagnostics.platformDetection.confidenceLabel}, ${diagnostics.platformDetection.confidence}%); console errors: ${diagnostics.consoleErrors.length}; failed requests: ${diagnostics.failedRequests.length}.`,
      whatWouldImprove:
        "Clearer platform evidence, clean metadata, fewer console errors, and fewer failed frontend requests would improve this score.",
    };
  }

  if (key === "trackingIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} from visible analytics, tag manager, pixel, and email/lead-capture signals.`,
      evidenceInfluenced: driver
        ? `${driver}; detected ${marketingTools.length} supported marketing tool${marketingTools.length === 1 ? "" : "s"}: ${visibleEvidenceList(marketingTools.map((tool) => tool.label))}.`
        : `Detected ${marketingTools.length} supported marketing tool${marketingTools.length === 1 ? "" : "s"}: ${visibleEvidenceList(marketingTools.map((tool) => tool.label))}. Lead capture visible: ${signals.leadCaptureVisible ? "yes" : "no"}.`,
      whatWouldImprove:
        "Visible GA4/GTM, ad pixels, email capture, and confirmed conversion events across the buying path would improve this score.",
    };
  }

  return {
    whyAssigned: `Assigned as ${scoreBand} from cart, checkout, support, returns, and order communication visibility.`,
    evidenceInfluenced: driver
      ? `${driver}; support/contact: ${signals.contactSupportVisible ? "visible" : "not visible"}; order/returns language: ${signals.orderReturnsLanguageVisible ? "visible" : "not visible"}; shipping/returns: ${signals.shippingReturnsVisible ? "visible" : "not visible"}.${secondaryContext}`
      : `Support/contact: ${signals.contactSupportVisible ? "visible" : "not visible"}; order/returns language: ${signals.orderReturnsLanguageVisible ? "visible" : "not visible"}; shipping/returns: ${signals.shippingReturnsVisible ? "visible" : "not visible"}.${secondaryContext}`,
    whatWouldImprove:
      "Visible support, order status, shipping, returns, and fulfillment communication would improve it.",
  };
}

function adjustCategoryScoreForEcommerceMaturity({
  key,
  score,
  diagnostics,
  findings,
  siteClassification,
  visualUxDiagnostics,
  ecommerceMaturity,
  positiveUxSignals,
}: {
  key: AuditCategoryKey;
  score: number;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  siteClassification?: SiteClassification;
  visualUxDiagnostics?: VisualUxDiagnosticsResult;
  ecommerceMaturity?: EcommerceMaturityScore;
  positiveUxSignals?: PositiveUxSignals;
}) {
  if (!siteClassification || !visualUxDiagnostics || !ecommerceMaturity || !positiveUxSignals) {
    return score;
  }

  const visualUxScore = usableVisualUxScore(visualUxDiagnostics);
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const visualArchetype = String(visualUxDiagnostics.uxArchetype ?? "");
  const isEnterprise = isEnterpriseOrMarketplaceContext(
    siteClassification.siteType,
    visualArchetype,
  );
  const isIndustrial = isIndustrialB2bContext(
    siteClassification.siteType,
    visualArchetype,
  );
  const isHealthcareCommerce = isHealthcareCommerceContext(
    diagnostics,
    siteClassification,
    visualUxDiagnostics,
  );
  const healthcareJourneySignals = isHealthcareCommerce
    ? healthcareJourneySignalCount(diagnostics)
    : 0;
  const hasSevereVisualOrMobileIssue = findings.some(
    (finding) =>
      (finding.severity === "High" || finding.severity === "Critical") &&
      /visual|layout|mobile|hierarchy|content-to-product|grid-to-content/i.test(finding.title),
  );
  const hasHighB2bCatalogFriction = findings.some(
    (finding) =>
      (finding.severity === "High" || finding.severity === "Critical") &&
      /layout|content-to-product|grid-to-content|catalog|discovery|part|spec|mobile/i.test(finding.title),
  );
  const hasSevereCartCheckoutIssue = findings.some(
    (finding) =>
      (finding.severity === "High" || finding.severity === "Critical") &&
      /cart|checkout/i.test(finding.title),
  );
  const hasCriticalCustomerFacingIssue = findings.some(
    (finding) =>
      finding.severity === "Critical" &&
      (finding.primaryCategory === "uxUiIssues" ||
        finding.primaryCategory === "conversionIssues" ||
        finding.primaryCategory === "operationsIssues"),
  );
  let adjustedScore = score;

  if (isEnterprise && ecommerceMaturity.maturityScore >= 75) {
    if (key === "uxUiIssues" && visualUxScore !== null && visualUxScore >= 75 && !hasSevereVisualOrMobileIssue) {
      adjustedScore = Math.max(adjustedScore, visualUxScore >= 84 ? 84 : 80);
    }

    if (
      key === "conversionIssues" &&
      positiveUxSignals.commerceConfidence.score >= 65 &&
      positiveUxSignals.productDiscoveryStrength.score >= 70 &&
      !hasSevereCartCheckoutIssue
    ) {
      adjustedScore = Math.max(adjustedScore, 86);
    }

    if (
      key === "operationsIssues" &&
      positiveUxSignals.accountVisibility.score >= 60 &&
      positiveUxSignals.commerceConfidence.score >= 65
    ) {
      adjustedScore = Math.max(adjustedScore, 86);
    }

    if (key === "technicalIssues" && platformNeedsManualReview(diagnostics)) {
      adjustedScore = Math.max(adjustedScore, 78);
    }
  }

  if (isHealthcareCommerce && healthcareJourneySignals >= 4 && !hasCriticalCustomerFacingIssue) {
    if (key === "uxUiIssues" && visualUxScore !== null && visualUxScore >= 50) {
      adjustedScore = Math.max(adjustedScore, hasSevereVisualOrMobileIssue ? 68 : 74);
    }

    if (key === "conversionIssues" && !hasSevereCartCheckoutIssue) {
      const conversionFloor =
        positiveUxSignals.commerceConfidence.score >= 65 &&
        positiveUxSignals.productDiscoveryStrength.score >= 65
          ? 76
          : 72;
      adjustedScore = Math.max(adjustedScore, conversionFloor);
    }
  }

  if (isIndustrial && visualUxScore !== null && visualUxScore < 55 && hasHighB2bCatalogFriction) {
    if (key === "uxUiIssues") {
      adjustedScore = Math.min(adjustedScore, 60);
    }

    if (key === "conversionIssues") {
      adjustedScore = Math.min(adjustedScore, 66);
    }
  }

  if (
    key === "operationsIssues" &&
    (signals.contactSupportVisible || fullPage.supportContactVisible) &&
    !signals.shippingReturnsVisible &&
    !fullPage.shippingReturnsVisible &&
    !signals.orderReturnsLanguageVisible &&
    !fullPage.orderReturnsVisible &&
    !signals.policyVisible
  ) {
    adjustedScore = Math.min(adjustedScore, isEnterprise ? 76 : 70);
  }

  if (
    key === "operationsIssues" &&
    isIndustrial &&
    ((!signals.shippingReturnsVisible && !fullPage.shippingReturnsVisible) ||
      (!signals.orderReturnsLanguageVisible && !fullPage.orderReturnsVisible)) &&
    !commerce.checkoutVisible &&
    !fullPage.checkoutVisible
  ) {
    adjustedScore = Math.min(adjustedScore, 68);
  }

  return Math.max(35, Math.min(96, Math.round(adjustedScore)));
}

function usableVisualUxScore(visualUxDiagnostics: VisualUxDiagnosticsResult) {
  return visualUxDiagnostics.visualMetricsAvailable &&
    typeof visualUxDiagnostics.score === "number"
    ? visualUxDiagnostics.score
    : null;
}

function isSevereCustomerFacingUxReducer(finding: HeuristicFinding) {
  if (finding.severity !== "High" && finding.severity !== "Critical") {
    return false;
  }

  const haystack = [
    finding.title,
    finding.category,
    finding.evidenceSummary,
    finding.businessImpact,
  ]
    .join(" ")
    .toLowerCase();

  if (/navigation density|marketplace complexity|promotional competition/.test(haystack)) {
    return false;
  }

  return /visual|layout|mobile|hierarchy|readability|crowding|product|discovery|search|cta|cart|checkout/.test(
    haystack,
  );
}

function synchronizeUxUiScoreWithVisualState({
  score,
  visualUxState,
  findings,
  positiveUxSignals,
}: {
  score: number;
  visualUxState: VisualUxState;
  findings: HeuristicFinding[];
  positiveUxSignals?: PositiveUxSignals;
}) {
  if (!visualUxState.available || visualUxState.score === null) {
    return score;
  }

  const hasSevereCustomerFacingReducer = findings.some(
    isSevereCustomerFacingUxReducer,
  );

  if (visualUxState.score >= 80 && !hasSevereCustomerFacingReducer) {
    return Math.max(score, visualUxState.score >= 84 ? 78 : 75);
  }

  if (visualUxState.score < 55) {
    const strongFallbackSignals = Boolean(
      positiveUxSignals &&
        positiveUxSignals.productDiscoveryStrength.score >= 75 &&
        positiveUxSignals.navigationClarity.score >= 75 &&
        positiveUxSignals.hierarchyStrength.score >= 65,
    );

    return Math.min(score, strongFallbackSignals ? 64 : 59);
  }

  return score;
}

function applyLiveDiagnosticScoring(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
  siteClassification?: SiteClassification,
  visualUxDiagnostics?: VisualUxDiagnosticsResult,
  ecommerceMaturity?: EcommerceMaturityScore,
  positiveUxSignals?: PositiveUxSignals,
  evidenceState?: ScoringEvidenceState,
) {
  const visualUxState = visualUxDiagnostics
    ? buildVisualUxState(visualUxDiagnostics)
    : null;

  return auditCategoryTemplates.map((category) => {
    const categoryEvidenceState =
      evidenceState?.categoryEvidenceState[category.key] ?? "Negative";
    const categoryConfidence =
      evidenceState?.categoryConfidence[category.key] ?? "High";
    const scoreUnavailable =
      category.key === "uxUiIssues" && visualUxState?.available === false;
    const categoryFindings = findingsOwnedByCategory(findings, category.key);
    const influencingFindings = findingsInfluencingCategory(findings, category.key);
    const scoreImpactFindings = [...categoryFindings, ...influencingFindings].filter(
      (finding) => !isConfidenceReducerFinding(finding),
    );
    const evidenceScore =
      categoryEvidenceState === "Unknown"
        ? 72
        : Math.max(
            35,
            Math.min(96, category.score - categoryEvidencePenalty(
              category.key,
              diagnostics,
              findings,
              siteClassification,
              evidenceState,
            )),
          );
    const adjustedScore =
      categoryEvidenceState === "Unknown"
        ? evidenceScore
        : adjustCategoryScoreForEcommerceMaturity({
            key: category.key,
            score: evidenceScore,
            diagnostics,
            findings,
            siteClassification,
            visualUxDiagnostics,
            ecommerceMaturity,
            positiveUxSignals,
          });
    const score =
      category.key === "uxUiIssues" && visualUxState
        ? synchronizeUxUiScoreWithVisualState({
            score: adjustedScore,
            visualUxState,
            findings: [...categoryFindings, ...influencingFindings],
            positiveUxSignals,
          })
        : adjustedScore;
    const resolvedEvidenceState: EvidenceState =
      categoryEvidenceState === "Unknown"
        ? "Unknown"
        : score >= 80 && scoreImpactFindings.length === 0
          ? "Positive"
          : "Negative";
    const scoreExplanation = buildScoreExplanation({
      key: category.key,
      score,
      diagnostics,
      findings,
      evidenceState,
      visualUxState: visualUxState ?? undefined,
      positiveUxSignals,
    });
    const statusDetail =
      scoreUnavailable
        ? "Visual metrics unavailable, so UX/UI was not fully scored."
        : categoryEvidenceState === "Unknown"
          ? "Evidence unavailable"
          :
      categoryFindings[0]?.title ??
      categoryStatusDetailFallback(category.key, score, diagnostics);

    return {
      ...category,
      score,
      scoreUnavailable,
      status:
        resolvedEvidenceState === "Unknown"
          ? "Evidence Unknown"
          : adjustedStatus(score),
      statusDetail,
      evidenceState: resolvedEvidenceState,
      scoringConfidence: categoryConfidence,
      priority:
        resolvedEvidenceState === "Unknown"
          ? "Medium"
          : adjustedPriority(score),
      explanation: `${scoreExplanation.whyAssigned} ${scoreExplanation.evidenceInfluenced} ${scoreExplanation.whatWouldImprove}`,
      scoreExplanation,
      issues:
        categoryFindings.length > 0
          ? categoryFindings.map((finding) => finding.title)
          : influencingFindings.length > 0
            ? [
                `Related signals influenced this score but are owned by other sections: ${influencingFindings
                  .map((finding) => finding.title)
                  .join(", ")}.`,
              ]
            : ["No high-impact public-page issue was detected in this category during the lightweight review."],
      findings: categoryFindings,
      influencingFindings: influencingFindings.map((finding) => finding.title),
    };
  });
}

function buildScoreMismatchWarnings(
  visualUxDiagnostics: VisualUxDiagnosticsResult,
  categories: ReturnType<typeof applyLiveDiagnosticScoring>,
) {
  const warnings: string[] = [];
  const visualUxScore = usableVisualUxScore(visualUxDiagnostics);
  const uxUiCategory = categories.find(
    (category) => category.key === "uxUiIssues",
  );

  if (!uxUiCategory) {
    return warnings;
  }

  if (
    visualUxScore !== null &&
    visualUxScore >= 80 &&
    !uxUiCategory.scoreUnavailable &&
    uxUiCategory.score < 70
  ) {
    warnings.push("Score mismatch: Visual UX strong but UX/UI low");
  }

  if (
    visualUxScore === null &&
    !uxUiCategory.scoreUnavailable &&
    uxUiCategory.score > 65
  ) {
    warnings.push("Score mismatch: Visual UX unavailable but UX/UI appears scored");
  }

  return warnings;
}

function positiveSignalLabel(score: number): PositiveUxSignalLabel {
  if (score >= 75) return "strong";
  if (score >= 50) return "moderate";
  if (score > 0) return "weak";
  return "unknown";
}

function positiveSignal(score: number, evidence: string[]): PositiveUxSignal {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  const label = positiveSignalLabel(normalizedScore);
  const scoreImpact =
    label === "strong" ? 1.6 : label === "moderate" ? 0.8 : label === "weak" ? 0.2 : 0;

  return {
    score: normalizedScore,
    label,
    evidence: evidence.filter(Boolean).slice(0, 3),
    scoreImpact,
  };
}

function signalSummary(name: string, signal: PositiveUxSignal) {
  return `${name}: ${signal.label}${signal.evidence.length > 0 ? ` (${signal.evidence[0]})` : ""}`;
}

function buildScanCoverage(
  diagnostics: LiveDiagnosticsResult,
  visualUxDiagnostics: VisualUxDiagnosticsResult,
): ScanCoverage {
  const storefront = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const desktopMetrics = diagnostics.desktopVisualMetrics;
  const mobileMetrics = diagnostics.mobileVisualMetrics;
  const aboveFoldSignals: CoverageSignalSet = {
    cartVisible: commerce.cartVisible && storefront.mobileCtaLabels.some((label) => /cart|bag|basket/i.test(label)),
    checkoutVisible: storefront.mobileCtaLabels.some((label) => /checkout|buy now|order now/i.test(label)),
    searchVisible:
      (desktopMetrics?.firstSearchInputY ?? null) !== null ||
      (mobileMetrics?.firstSearchInputY ?? null) !== null,
    categoryProductVisible:
      (desktopMetrics?.productCardsAboveFold ?? 0) > 0 ||
      (mobileMetrics?.productCardsAboveFold ?? 0) > 0 ||
      storefront.productNavigationVisible,
    productCardCount: Math.max(
      desktopMetrics?.productCardsAboveFold ?? 0,
      mobileMetrics?.productCardsAboveFold ?? 0,
    ),
    ctaVisible: storefront.mobileCtaVisibleAboveFold,
    trustSignalsVisible: storefront.reviewSignalsVisible || storefront.paymentTrustVisible,
    shippingReturnsVisible: false,
    orderReturnsVisible: false,
    accountLoginVisible: storefront.genericNavigationCount > 0,
    supportContactVisible: false,
  };
  const nearFoldSignals: CoverageSignalSet = {
    cartVisible: commerce.cartVisible,
    checkoutVisible: commerce.checkoutVisible,
    searchVisible: storefront.searchVisible,
    categoryProductVisible:
      storefront.productNavigationVisible ||
      storefront.collectionLinksVisible ||
      commerce.productCatalogVisible,
    productCardCount: Math.max(
      desktopMetrics?.productCardBounds?.length ?? 0,
      mobileMetrics?.productCardBounds?.length ?? 0,
    ),
    ctaVisible: commerce.ctaVisible || storefront.mobileCtaVisibleAboveFold,
    trustSignalsVisible:
      storefront.reviewSignalsVisible ||
      storefront.paymentTrustVisible ||
      storefront.warrantyGuaranteeVisible,
    shippingReturnsVisible: storefront.shippingReturnsVisible,
    orderReturnsVisible: storefront.orderReturnsLanguageVisible,
    accountLoginVisible: storefront.genericNavigationCount > 0,
    supportContactVisible: storefront.contactSupportVisible,
  };
  const fullPageSignals: CoverageSignalSet = {
    cartVisible: fullPage.cartVisible || commerce.cartVisible,
    checkoutVisible: fullPage.checkoutVisible || commerce.checkoutVisible,
    searchVisible: fullPage.searchVisible || storefront.searchVisible,
    categoryProductVisible:
      fullPage.categoryProductVisible ||
      storefront.productNavigationVisible ||
      storefront.collectionLinksVisible ||
      commerce.productCatalogVisible,
    productCardCount: Math.max(
      fullPage.productCardCount,
      desktopMetrics?.productCardBounds?.length ?? 0,
      mobileMetrics?.productCardBounds?.length ?? 0,
    ),
    ctaVisible: fullPage.ctaVisible || commerce.ctaVisible,
    trustSignalsVisible:
      fullPage.trustSignalsVisible ||
      storefront.reviewSignalsVisible ||
      storefront.paymentTrustVisible ||
      storefront.warrantyGuaranteeVisible,
    shippingReturnsVisible: fullPage.shippingReturnsVisible || storefront.shippingReturnsVisible,
    orderReturnsVisible: fullPage.orderReturnsVisible || storefront.orderReturnsLanguageVisible,
    accountLoginVisible: fullPage.accountLoginVisible || storefront.genericNavigationCount > 0,
    supportContactVisible: fullPage.supportContactVisible || storefront.contactSupportVisible,
  };
  const visualSignals: CoverageSignalSet = {
    cartVisible: false,
    checkoutVisible: false,
    searchVisible: false,
    categoryProductVisible: visualUxDiagnostics.findings.some((finding) =>
      /product|category|catalog|grid|discovery/i.test(finding.title),
    ),
    productCardCount: Math.max(
      desktopMetrics?.productCardBounds?.length ?? 0,
      mobileMetrics?.productCardBounds?.length ?? 0,
    ),
    ctaVisible: visualUxDiagnostics.findings.some((finding) =>
      /cta|action|hierarchy/i.test(finding.title),
    ),
    trustSignalsVisible: false,
    shippingReturnsVisible: false,
    orderReturnsVisible: false,
    accountLoginVisible: false,
    supportContactVisible: visualUxDiagnostics.findings.some((finding) =>
      /widget|chat|support/i.test(finding.title),
    ),
    visualUxFindingCount: visualUxDiagnostics.findings.length,
    visualUxScore: visualUxDiagnostics.score,
  };
  const coverageWarnings = [
    !diagnostics.screenshotSuccess
      ? "Screenshot capture did not complete successfully, so visual evidence should be manually confirmed."
      : null,
    !visualUxDiagnostics.visualMetricsAvailable
      ? "Visual UX metrics were unavailable, so first-impression layout scoring is low confidence."
      : null,
    fullPage.visibleLinkCount === 0
      ? "Full-page DOM extraction returned zero visible links; deeper page signals may be incomplete."
      : null,
  ].filter((warning): warning is string => Boolean(warning));
  const screenshotCoverage =
    diagnostics.screenshotModeUsed === "fullPage"
      ? "Full-page screenshots were attempted for visual review."
      : diagnostics.screenshotModeUsed === "viewport"
        ? "Viewport screenshots were used for visual review."
        : "Screenshot capture was skipped or unavailable.";
  const scoringCoverageSummary =
    "This score uses above-the-fold evidence for first impression and full-page DOM evidence for operations, trust, product discovery, and support signals on the submitted URL only.";

  return {
    submittedUrlOnly: true,
    screenshotMode: diagnostics.screenshotModeUsed === "fullPage" ? "full-page" : "viewport",
    domCoverage: "full-page",
    scoringCoverage: "full-page",
    aboveFoldCoverage:
      "Above-fold evidence carries the most weight for first impression, mobile hierarchy, primary CTA clarity, search prominence, and visual UX.",
    nearFoldCoverage:
      "Near-fold evidence supports product discovery, early navigation, secondary CTAs, and reassurance cues that appear shortly after the first viewport.",
    fullPageDomCoverage:
      "Full-page DOM evidence counts for catalog/product links, support, account, shipping/returns, policy, forms, and operational continuity signals.",
    screenshotCoverage,
    scoringCoverageSummary,
    coverageWarnings,
    aboveFoldSignals,
    nearFoldSignals,
    fullPageSignals,
    visualSignals,
    manualConfirmationSignals: {
      platformNeedsReview: platformNeedsManualReview(diagnostics),
      trackingNeedsReview: visibleMarketingTools(diagnostics).length < 2,
      screenshotModeRequiresInterpretation: true,
    },
    coverageSummary: scoringCoverageSummary,
    explanation:
      "The scanner reviews the submitted URL only. Above-the-fold and near-fold signals influence first-impression UX, while full-page DOM sampling influences deeper product discovery, trust, shipping/returns, account, support, and operations scoring.",
  };
}

function isEnterpriseOrMarketplaceContext(siteType: string, visualArchetype?: string | null) {
  const normalizedSiteType = siteType.toLowerCase();

  if (
    normalizedSiteType.includes("non-ecommerce") ||
    normalizedSiteType.includes("lead generation") ||
    normalizedSiteType.includes("lead-generation") ||
    normalizedSiteType.includes("service business")
  ) {
    return false;
  }

  const combined = `${normalizedSiteType} ${visualArchetype ?? ""}`.toLowerCase();
  return (
    normalizedSiteType.includes("enterprise") ||
    normalizedSiteType.includes("marketplace") ||
    (combined.includes("enterprise retail") && !normalizedSiteType.includes("dtc"))
  );
}

function isIndustrialB2bContext(siteType: string, visualArchetype?: string | null) {
  const combined = `${siteType} ${visualArchetype ?? ""}`.toLowerCase();
  return combined.includes("industrial") || combined.includes("b2b");
}

function buildPositiveUxSignals({
  diagnostics,
  visualUxDiagnostics,
  siteClassification,
}: {
  diagnostics: LiveDiagnosticsResult;
  visualUxDiagnostics: VisualUxDiagnosticsResult;
  siteClassification: SiteClassification;
}): PositiveUxSignals {
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const desktopMetrics = diagnostics.desktopVisualMetrics;
  const mobileMetrics = diagnostics.mobileVisualMetrics;
  const visualArchetype = String(visualUxDiagnostics.uxArchetype ?? "");
  const visualUxScore = usableVisualUxScore(visualUxDiagnostics);
  const visualUnavailableEvidence =
    visualUxDiagnostics.unavailableReason ??
    "Visual UX metrics were unavailable for this scan.";
  const isEnterprise = isEnterpriseOrMarketplaceContext(siteClassification.siteType, visualArchetype);
  const isIndustrial = isIndustrialB2bContext(siteClassification.siteType, visualArchetype);
  const trustCount = trustSignalCount(diagnostics);
  const textAndLinks = [
    desktopMetrics?.visibleTextSample,
    mobileMetrics?.visibleTextSample,
    ...(desktopMetrics?.visibleLinks ?? []),
    ...(mobileMetrics?.visibleLinks ?? []),
    ...commerce.ctaLabels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const accountVisible = /account|sign in|login|log in|my account|profile/.test(textAndLinks);
  const quoteOrProcurementVisible = /quote|rfq|account|procurement|purchase order|part number|sku/.test(textAndLinks);
  const productModules = Math.max(
    desktopMetrics?.productCardsAboveFold ?? 0,
    mobileMetrics?.productCardsAboveFold ?? 0,
    fullPage.productCardCount,
  );
  const severeVisualTitles = visualUxDiagnostics.findings
    .filter((finding) => finding.severity === "High")
    .map((finding) => finding.title.toLowerCase());
  const hasSevereLayoutIssue = severeVisualTitles.some((title) =>
    /layout|content-to-product|grid-to-content|discovery|hierarchy|whitespace/.test(title),
  );
  const hasVisualConsistency =
    visualUxScore !== null &&
    visualUxScore >= 75 &&
    !hasSevereLayoutIssue &&
    (desktopMetrics?.productCardHeightVariance ?? 0) < 0.7 &&
    (desktopMetrics?.productCardSpacingVariance ?? 0) < 0.75;
  const categoryVisible =
    signals.productNavigationVisible ||
    signals.collectionLinksVisible ||
    commerce.productCatalogVisible ||
    fullPage.categoryProductVisible;
  const discoveryBase =
    (signals.searchVisible || fullPage.searchVisible ? 30 : 0) +
    (signals.productNavigationVisible || fullPage.categoryProductVisible ? 25 : 0) +
    (signals.collectionLinksVisible || fullPage.productLinks.length > 0 ? 20 : 0) +
    (productModules > 0 ? 20 : 0) +
    (isIndustrial && quoteOrProcurementVisible ? 5 : 0);

  return {
    searchProminence: positiveSignal(
      signals.searchVisible || fullPage.searchVisible || (desktopMetrics?.firstSearchInputY ?? null) !== null
        ? isEnterprise || isIndustrial
          ? 95
          : 85
        : 20,
      signals.searchVisible || fullPage.searchVisible
        ? ["Search is visible in the submitted URL sample."]
        : ["Search was not clearly visible above the fold."],
    ),
    categoryVisibility: positiveSignal(
      signals.productNavigationVisible && signals.collectionLinksVisible
        ? 90
        : categoryVisible
          ? 65
          : 20,
      [
        `Product navigation: ${signals.productNavigationVisible ? "visible" : "not visible"}.`,
        `Collection/product links: ${signals.collectionLinksVisible || fullPage.productLinks.length > 0 ? "visible" : "not visible"}.`,
      ],
    ),
    productDensity: positiveSignal(
      productModules >= (isEnterprise ? 6 : isIndustrial ? 3 : 2)
        ? 92
        : productModules > 0
          ? 68
          : 18,
      [`${productModules} product/card module${productModules === 1 ? "" : "s"} visible in sampled viewports.`],
    ),
    trustSignals: positiveSignal(
      trustCount >= 4 ? 88 : trustCount >= 2 ? 62 : trustCount > 0 ? 38 : 12,
      [`${trustCount} of 6 trust-signal groups were visible.`],
    ),
    hierarchyStrength: positiveSignal(
      visualUxScore === null
        ? 0
        : visualUxScore >= 80 && !signals.mobileCrowdingRisk
        ? 88
        : visualUxScore >= 65
          ? 64
          : visualUxScore >= 45
            ? 38
            : 18,
      visualUxScore === null
        ? [visualUnavailableEvidence]
        : [
            `Visual UX score is ${visualUxScore}/100.`,
            signals.mobileCrowdingRisk ? "Mobile first-screen density risk was detected." : "No mobile crowding risk was flagged.",
          ],
    ),
    navigationClarity: positiveSignal(
      isEnterprise && signals.searchVisible && categoryVisible
        ? 88
        : signals.searchVisible && categoryVisible
          ? 78
          : categoryVisible
            ? 58
            : 22,
      [
        signals.searchVisible ? "Search is visible." : "Search visibility is weak.",
        categoryVisible ? "Category or product navigation is visible." : "Category/product navigation is weak.",
      ],
    ),
    commerceConfidence: positiveSignal(
      (commerce.cartVisible || fullPage.cartVisible) &&
        (commerce.checkoutVisible || fullPage.checkoutVisible) &&
        categoryVisible
        ? 90
        : (commerce.cartVisible ||
              commerce.checkoutVisible ||
              fullPage.cartVisible ||
              fullPage.checkoutVisible) &&
            categoryVisible
          ? 68
          : categoryVisible
            ? 48
            : 18,
      [
        `Cart: ${commerce.cartVisible || fullPage.cartVisible ? "visible" : "not visible"}.`,
        `Checkout: ${commerce.checkoutVisible || fullPage.checkoutVisible ? "visible" : "not visible"}.`,
        categoryVisible ? "Product/catalog path is visible." : "Product/catalog path is not clear.",
      ],
    ),
    visualConsistency: positiveSignal(
      visualUxScore === null
        ? 0
        : hasVisualConsistency
          ? 88
          : visualUxScore >= 65
            ? 64
            : visualUxScore >= 50
              ? 42
              : 18,
      visualUxScore === null
        ? [visualUnavailableEvidence]
        : [
            hasVisualConsistency
              ? "Visual diagnostics did not find severe layout consistency issues."
              : visualUxDiagnostics.summary,
          ],
    ),
    cartVisibility: positiveSignal(
      commerce.cartVisible || fullPage.cartVisible ? 90 : 20,
      [commerce.cartVisible || fullPage.cartVisible ? "Cart entry point is visible in the submitted URL evidence." : "Cart entry point was not clearly visible."],
    ),
    checkoutVisibility: positiveSignal(
      commerce.checkoutVisible || fullPage.checkoutVisible ? 88 : 20,
      [commerce.checkoutVisible || fullPage.checkoutVisible ? "Checkout entry point is visible in the submitted URL evidence." : "Checkout entry point was not clearly visible."],
    ),
    accountVisibility: positiveSignal(
      accountVisible || fullPage.accountLoginVisible || (isIndustrial && quoteOrProcurementVisible) ? 82 : 28,
      [
        accountVisible
          ? "Account or sign-in path is visible."
          : fullPage.accountLoginVisible
            ? "Account or login language appears in the full-page DOM sample."
          : isIndustrial && quoteOrProcurementVisible
            ? "Quote, SKU, or procurement language is visible."
            : "Account/procurement path was not prominent.",
      ],
    ),
    productDiscoveryStrength: positiveSignal(
      Math.min(100, discoveryBase),
      [
        signals.searchVisible ? "Search supports product discovery." : "Search support is weak.",
        signals.productNavigationVisible || signals.collectionLinksVisible
          ? "Product/category paths support discovery."
          : "Product/category paths are weak.",
        productModules > 0 ? "Product modules are visible." : "Product modules were not visible above fold.",
      ],
    ),
  };
}

function calculateEcommerceMaturityScore({
  diagnostics,
  findings,
  visualUxDiagnostics,
  siteClassification,
  positiveUxSignals,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  visualUxDiagnostics: VisualUxDiagnosticsResult;
  siteClassification: SiteClassification;
  positiveUxSignals?: PositiveUxSignals;
}): EcommerceMaturityScore {
  const signals =
    positiveUxSignals ??
    buildPositiveUxSignals({
      diagnostics,
      visualUxDiagnostics,
      siteClassification,
    });
  const visualUxScore = usableVisualUxScore(visualUxDiagnostics);
  const visualArchetype = String(visualUxDiagnostics.uxArchetype ?? "");
  if (isNonStorefrontClassification(siteClassification.siteType)) {
    return {
      maturityScore: 0,
      maturityTier: "unclear",
      positiveSignals: [],
      maturityReducers: [
        "The submitted URL does not expose a confirmed ecommerce storefront.",
      ],
      explanation:
        "Ecommerce maturity was not scored because the public evidence points to a lead-generation, service, or unclear non-storefront page rather than a retail checkout flow.",
    };
  }

  const isEnterprise = isEnterpriseOrMarketplaceContext(
    siteClassification.siteType,
    visualArchetype,
  );
  const isIndustrial = isIndustrialB2bContext(
    siteClassification.siteType,
    visualArchetype,
  );
  const severeCustomerFacingFindings = findings.filter(
    (finding) =>
      (finding.severity === "High" || finding.severity === "Critical") &&
      (finding.primaryCategory === "uxUiIssues" ||
        finding.primaryCategory === "conversionIssues" ||
        finding.primaryCategory === "operationsIssues"),
  );
  const b2bCatalogReducers = severeCustomerFacingFindings.filter((finding) =>
    /layout|content-to-product|grid-to-content|discovery|catalog|part|spec|mobile/i.test(
      finding.title,
    ),
  );
  const maturityWeights: Array<[PositiveUxSignalKey, number]> = [
    ["searchProminence", 0.15],
    ["categoryVisibility", 0.12],
    ["productDensity", 0.11],
    ["navigationClarity", 0.11],
    ["commerceConfidence", 0.12],
    ["productDiscoveryStrength", 0.13],
    ["hierarchyStrength", 0.1],
    ["visualConsistency", 0.08],
    ["trustSignals", 0.04],
    ["accountVisibility", 0.04],
  ];
  const activeMaturityWeights = maturityWeights.filter(([key]) =>
    visualUxScore !== null || (key !== "hierarchyStrength" && key !== "visualConsistency"),
  );
  const maturityWeightTotal = activeMaturityWeights.reduce(
    (total, [, weight]) => total + weight,
    0,
  );
  const maturityScore = Math.round(
    activeMaturityWeights.reduce(
      (total, [key, weight]) => total + signals[key].score * weight,
      0,
    ) / maturityWeightTotal,
  );
  const positiveSignals = buildTopPositiveSignalSummaries(signals);
  const maturityReducers: string[] = [];

  if (visualUxScore === null) {
    maturityReducers.push("Visual UX maturity was unavailable because visual metrics could not be calculated.");
  } else if (visualUxScore < 60) {
    maturityReducers.push(`Visual UX maturity is limited (${visualUxScore}/100).`);
  }

  if (signals.searchProminence.label === "weak" || signals.searchProminence.label === "unknown") {
    maturityReducers.push("Search prominence is weak for the detected business model.");
  }

  if (signals.productDiscoveryStrength.label === "weak" || signals.productDiscoveryStrength.label === "unknown") {
    maturityReducers.push("Product discovery strength is weak in the sampled public page.");
  }

  if (isIndustrial && b2bCatalogReducers.length > 0) {
    maturityReducers.push(
      `${b2bCatalogReducers[0].title} reduces B2B catalog confidence.`,
    );
  }

  if (!isEnterprise && signals.commerceConfidence.score < 55) {
    maturityReducers.push("Cart, checkout, and product path confidence is limited.");
  }

  const tier: EcommerceMaturityTier =
    isEnterprise && maturityScore >= 75
      ? "enterprise"
      : maturityScore >= 75
        ? "mature"
        : maturityScore >= 58
          ? "developing"
          : maturityScore >= 35
            ? "early"
            : "unclear";
  const explanation = isEnterprise
    ? "Enterprise retail maturity is judged mainly by search, category paths, account/cart visibility, product density, and customer-facing journey strength, not by whether the platform is publicly exposed."
    : isIndustrial
      ? "B2B catalog maturity is judged mainly by search or part lookup, product/category hierarchy, specification access signals, visual alignment, and mobile catalog usability."
      : "Ecommerce maturity is judged by customer-facing discovery, hierarchy, trust, cart/checkout clarity, and visible commerce paths.";

  return {
    maturityScore: Math.max(0, Math.min(100, maturityScore)),
    maturityTier: tier,
    positiveSignals,
    maturityReducers: maturityReducers.slice(0, 4),
    explanation,
  };
}

function buildTopPositiveSignalSummaries(positiveUxSignals: PositiveUxSignals) {
  const labels: Partial<Record<PositiveUxSignalKey, string>> = {
    searchProminence: "Search prominence",
    categoryVisibility: "Category visibility",
    productDensity: "Product density",
    trustSignals: "Trust signals",
    hierarchyStrength: "Hierarchy strength",
    navigationClarity: "Navigation clarity",
    commerceConfidence: "Commerce confidence",
    visualConsistency: "Visual consistency",
    cartVisibility: "Cart visibility",
    checkoutVisibility: "Checkout visibility",
    accountVisibility: "Account/procurement visibility",
    productDiscoveryStrength: "Product discovery strength",
  };

  return (Object.entries(positiveUxSignals) as [PositiveUxSignalKey, PositiveUxSignal][])
    .filter(([, signal]) => signal.label === "strong" || signal.label === "moderate")
    .sort(([, left], [, right]) => right.score - left.score)
    .slice(0, 4)
    .map(([key, signal]) => signalSummary(labels[key] ?? key, signal));
}

function buildMajorPenaltySummaries({
  findings,
  siteClassification,
  visualUxDiagnostics,
}: {
  findings: HeuristicFinding[];
  siteClassification: SiteClassification;
  visualUxDiagnostics: VisualUxDiagnosticsResult;
}) {
  const isEnterprise = isEnterpriseOrMarketplaceContext(
    siteClassification.siteType,
    String(visualUxDiagnostics.uxArchetype ?? ""),
  );

  return findings
    .filter((finding) => finding.severity === "High" || finding.severity === "Critical")
    .map((finding) => {
      const isPlatformOpacity = /platform|manual review|platform evidence/i.test(finding.title);
      const weight = isPlatformOpacity && isEnterprise ? 1 : finding.severity === "Critical" ? 5 : 3;
      return {
        weight,
        text: `${finding.title}: ${finding.evidenceSummary}`,
      };
    })
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 4)
    .map((item) => sanitizeEvidenceText(item.text, { maxLength: 180 }));
}

function calculateSeverityAdjustedPenalty({
  findings,
  siteClassification,
  visualUxDiagnostics,
}: {
  findings: HeuristicFinding[];
  siteClassification: SiteClassification;
  visualUxDiagnostics: VisualUxDiagnosticsResult;
}) {
  const isEnterprise = isEnterpriseOrMarketplaceContext(
    siteClassification.siteType,
    String(visualUxDiagnostics.uxArchetype ?? ""),
  );
  const isIndustrial = isIndustrialB2bContext(
    siteClassification.siteType,
    String(visualUxDiagnostics.uxArchetype ?? ""),
  );
  const penalty = findings.reduce((total, finding) => {
    if (isConfidenceReducerFinding(finding)) return total;
    const isPlatformOpacity = /platform|manual review|platform evidence/i.test(finding.title);
    if (isPlatformOpacity && isEnterprise) return total + 0.5;
    if (finding.severity === "Critical") return total + 4;
    if (finding.severity === "High") {
      const customerFacing =
        finding.primaryCategory === "uxUiIssues" ||
        finding.primaryCategory === "conversionIssues" ||
        finding.primaryCategory === "operationsIssues";
      const b2bCatalogIssue =
        isIndustrial &&
        /layout|content-to-product|grid-to-content|discovery|catalog|part|spec/i.test(finding.title);
      return total + (b2bCatalogIssue ? 3.5 : customerFacing ? 2.5 : 1.5);
    }
    if (finding.severity === "Medium") return total + 0.6;
    return total;
  }, 0);

  return Math.min(isEnterprise ? 8 : 12, penalty);
}

function buildScoreWhy({
  score,
  positiveSignals,
  majorPenalties,
  ecommerceMaturity,
  siteClassification,
  visualUxDiagnostics,
  evidenceState,
}: {
  score: number;
  positiveSignals: string[];
  majorPenalties: string[];
  ecommerceMaturity: EcommerceMaturityScore;
  siteClassification: SiteClassification;
  visualUxDiagnostics: VisualUxDiagnosticsResult;
  evidenceState?: ScoringEvidenceState;
}) {
  if (evidenceState?.scoringConfidence === "Low") {
    return evidenceState.scoringConfidenceNote;
  }

  if (!visualUxDiagnostics.visualMetricsAvailable || visualUxDiagnostics.score === null) {
    return "Visual UX metrics were unavailable for this scan, so the score was calculated primarily from navigation, commerce, tracking, operations, and DOM signals.";
  }

  const visualArchetype = String(visualUxDiagnostics.uxArchetype ?? "");
  const isEnterprise = isEnterpriseOrMarketplaceContext(siteClassification.siteType, visualArchetype);
  const isIndustrial = isIndustrialB2bContext(siteClassification.siteType, visualArchetype);

  if (isEnterprise) {
    return score >= 75
      ? `Strong marketplace-scale discovery, navigation, and commerce signals support an ${ecommerceMaturity.maturityTier} maturity read. Score reducers are mainly measurement/platform visibility or density risks, not basic ecommerce maturity.`
      : `Enterprise retail maturity signals are present (${ecommerceMaturity.maturityScore}/100), but the score stays lower because customer-facing confidence signals or visual hierarchy evidence were not strong enough to offset the reducers.`;
  }

  if (isIndustrial) {
    return score <= 65
      ? `Visible commerce infrastructure is present, but the ${ecommerceMaturity.maturityTier} maturity read is constrained by catalog discovery, mobile hierarchy, specification access, or layout imbalance.`
      : `B2B catalog signals are reasonably mature (${ecommerceMaturity.maturityScore}/100), with the score shaped by product discovery strength and the remaining catalog usability risks.`;
  }

  if (positiveSignals.length > majorPenalties.length) {
    return "Positive ecommerce maturity signals offset some findings, so the score reflects both visible strengths and the remaining review priorities.";
  }

  return "The score is limited by the strongest customer-facing findings, with positive signals included where the public scan showed mature ecommerce patterns.";
}

function businessScoreLabel(value: string, mode: "positive" | "reducer") {
  const normalized = value.toLowerCase();

  if (/checkout|cart|purchase|buy/i.test(normalized)) {
    return mode === "positive" ? "Purchase path visibility" : "Checkout path confidence";
  }

  if (/trust|review|security|policy|return|shipping/i.test(normalized)) {
    return mode === "positive" ? "Trust signal visibility" : "Trust signal visibility";
  }

  if (/mobile|cta|call.to.action|action/i.test(normalized)) {
    return mode === "positive" ? "Mobile action clarity" : "Mobile CTA visibility";
  }

  if (/search/i.test(normalized)) {
    return "Search visibility";
  }

  if (/product|category|catalog|collection|sku|discovery/i.test(normalized)) {
    return "Product discovery";
  }

  if (/navigation|hierarchy|menu/i.test(normalized)) {
    return "Navigation clarity";
  }

  if (/enterprise|marketplace|maturity|retail/i.test(normalized)) {
    return "Enterprise retail maturity";
  }

  if (/tracking|analytics|measurement/i.test(normalized)) {
    return "Tracking confidence";
  }

  if (/platform|evidence|confidence|unknown|unavailable/i.test(normalized)) {
    return mode === "positive" ? "Public evidence coverage" : "Scanner confidence";
  }

  if (/support|account|contact|procurement|quote/i.test(normalized)) {
    return "Support and account path";
  }

  if (/visual|layout|density|content/i.test(normalized)) {
    return mode === "positive" ? "Visual clarity" : "Visual purchase-path clarity";
  }

  return sanitizeEvidenceText(value.replace(/\([^)]*\)/g, ""), { maxLength: 70 });
}

function uniqueBusinessLabels(values: string[], mode: "positive" | "reducer") {
  return Array.from(
    new Set(
      values
        .map((value) => businessScoreLabel(value, mode))
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function categoryReducerLabels(
  categories: ReturnType<typeof applyLiveDiagnosticScoring>,
) {
  const categoryLabels: Record<AuditCategoryKey, string> = {
    uxUiIssues: "Product discovery and navigation clarity",
    conversionIssues: "Checkout path confidence",
    technicalIssues: "Platform confidence",
    trackingIssues: "Tracking confidence",
    operationsIssues: "Trust and support visibility",
  };

  return categories
    .filter((category) => category.score < 70)
    .sort((left, right) => left.score - right.score)
    .map((category) => categoryLabels[category.key])
    .filter(Boolean);
}

function fallbackPositiveLabels({
  positiveUxSignals,
  ecommerceMaturity,
}: {
  positiveUxSignals: PositiveUxSignals;
  ecommerceMaturity: EcommerceMaturityScore;
}) {
  const labels: string[] = [];

  if (positiveUxSignals.productDensity.label === "strong") {
    labels.push("Product discovery");
  }

  if (
    positiveUxSignals.categoryVisibility.label === "strong" ||
    positiveUxSignals.hierarchyStrength.label === "strong"
  ) {
    labels.push("Navigation clarity");
  }

  if (positiveUxSignals.searchProminence.label === "strong") {
    labels.push("Search visibility");
  }

  if (ecommerceMaturity.maturityTier === "enterprise") {
    labels.push("Enterprise retail maturity");
  }

  return labels;
}

function buildScoreNarrative({
  overallScore,
  scoreExplanation,
  scoreExplanationSnapshot,
  scoringConfidence,
  scoringConfidenceNote,
  categories,
  positiveUxSignals,
  ecommerceMaturity,
  siteClassification,
  visualUxDiagnostics,
}: {
  overallScore: number;
  scoreExplanation: OverallScoreExplanation;
  scoreExplanationSnapshot: ScoreExplanationSnapshot;
  scoringConfidence: ScoringConfidence;
  scoringConfidenceNote: string;
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  positiveUxSignals: PositiveUxSignals;
  ecommerceMaturity: EcommerceMaturityScore;
  siteClassification: SiteClassification;
  visualUxDiagnostics: VisualUxDiagnosticsResult;
}): ScoreNarrative {
  const strongestPositives = [
    ...uniqueBusinessLabels(scoreExplanation.positiveSignals, "positive"),
    ...fallbackPositiveLabels({ positiveUxSignals, ecommerceMaturity }),
  ].filter((value, index, list) => list.indexOf(value) === index).slice(0, 4);
  const strongestReducers = [
    ...uniqueBusinessLabels(scoreExplanation.majorPenalties, "reducer"),
    ...categoryReducerLabels(categories),
  ].filter((value, index, list) => list.indexOf(value) === index).slice(0, 4);
  const positiveText =
    strongestPositives.length > 0
      ? strongestPositives.slice(0, 3).join(", ")
      : "some commerce strengths";
  const reducerText =
    strongestReducers.length > 0
      ? strongestReducers.slice(0, 3).join(", ")
      : "the remaining customer-path uncertainty";
  const visualArchetype = String(visualUxDiagnostics.uxArchetype ?? "");
  const enterpriseContext = isEnterpriseOrMarketplaceContext(
    siteClassification.siteType,
    visualArchetype,
  );
  const explanation = `The score landed at ${overallScore} because it is a weighted outcome. The scanner could see ${positiveText}, but ${reducerText} pulled the overall score down.`;
  const confidenceExplanation =
    scoringConfidence === "Low"
      ? "This score is directional because some scanner subsystems could not fully evaluate the page."
      : enterpriseContext
        ? "Because this is an enterprise retail site, some systems may intentionally be hidden from public view. The score should be treated as directional rather than a complete assessment."
        : scoringConfidenceNote ||
          "This score is based on public-page evidence, not private analytics or platform access.";

  return {
    overallScore,
    strongestPositives,
    strongestReducers,
    confidence: scoringConfidence,
    confidenceExplanation,
    explanation,
    whatWouldIncreaseScore: scoreExplanationSnapshot.whatWouldIncreaseScore
      .map((item) => sanitizeEvidenceText(item.replace(/[.;\s]+$/g, ""), { maxLength: 120 }))
      .filter(Boolean)
      .slice(0, 4),
  };
}

async function buildScoreChangeContext(
  url: string,
): Promise<ScoreNarrative["scoreChangeContext"]> {
  const scans = await listAuditScans();

  if (!scans.ok) {
    return undefined;
  }

  const domain = normalizeScanDomain(url);
  const summary = buildScoreStabilityByDomain(scans.data).get(domain);

  if (!summary || summary.scanCount <= 1 || summary.scoreVariation === 0) {
    return undefined;
  }

  return {
    scanCount: summary.scanCount,
    minScore: summary.minScore,
    maxScore: summary.maxScore,
    scoreVariation: summary.scoreVariation,
    scoreStability: summary.scoreStability,
    latestChangeReasons: summary.latestChangeReasons.slice(0, 4),
    explanation:
      `I see previous scans of this domain scored differently (${summary.minScore}-${summary.maxScore}). This usually happens when different evidence was visible, visual metrics succeeded or failed, dynamic content changed, or confidence changed. The most recent score reflects the evidence available during this scan.`,
  };
}

function calculateOverallScoringResult({
  baseScore,
  categories,
  findings,
  visualUxDiagnostics,
  diagnostics,
  siteClassification,
  positiveUxSignals: providedPositiveUxSignals,
  ecommerceMaturity: providedEcommerceMaturity,
  evidenceState,
}: {
  baseScore: number;
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  findings: HeuristicFinding[];
  visualUxDiagnostics: VisualUxDiagnosticsResult;
  diagnostics: LiveDiagnosticsResult;
  siteClassification: SiteClassification;
  positiveUxSignals?: PositiveUxSignals;
  ecommerceMaturity?: EcommerceMaturityScore;
  evidenceState?: ScoringEvidenceState;
}): OverallScoringResult {
  const positiveUxSignals =
    providedPositiveUxSignals ??
    buildPositiveUxSignals({
      diagnostics,
      visualUxDiagnostics,
      siteClassification,
    });
  const ecommerceMaturity =
    providedEcommerceMaturity ??
    calculateEcommerceMaturityScore({
      diagnostics,
      findings,
      visualUxDiagnostics,
      siteClassification,
      positiveUxSignals,
    });
  const categoryScore = (key: AuditCategoryKey) =>
    categories.find((category) => category.key === key)?.score ?? baseScore;
  const visualUxScore = usableVisualUxScore(visualUxDiagnostics);
  const categoryWeights: Array<[AuditCategoryKey, number]> = [
    ["uxUiIssues", 0.35],
    ["conversionIssues", 0.3],
    ["technicalIssues", 0.15],
    ["trackingIssues", 0.1],
    ["operationsIssues", 0.1],
  ];
  const activeCategoryWeights = categoryWeights.filter(([key]) =>
    (visualUxScore !== null || key !== "uxUiIssues") &&
    evidenceState?.categoryEvidenceState[key] !== "Unknown",
  );
  const categoryWeightTotal = activeCategoryWeights.reduce(
    (total, [, weight]) => total + weight,
    0,
  );
  const weightedCategoryScores =
    activeCategoryWeights.length >= 2 && categoryWeightTotal > 0
      ? Math.round(
          activeCategoryWeights.reduce(
            (total, [key, weight]) => total + categoryScore(key) * weight,
            0,
          ) / categoryWeightTotal,
        )
      : 70;
  const positiveUxSignalBoost = Math.min(
    12,
    Object.values(positiveUxSignals).reduce((total, signal) => total + signal.scoreImpact, 0),
  );
  const severityAdjustedPenalties = calculateSeverityAdjustedPenalty({
    findings,
    siteClassification,
    visualUxDiagnostics,
  });
  const visualArchetype = String(visualUxDiagnostics.uxArchetype ?? "");
  const isEnterprise = isEnterpriseOrMarketplaceContext(siteClassification.siteType, visualArchetype);
  const isIndustrial = isIndustrialB2bContext(siteClassification.siteType, visualArchetype);
  const positiveSignals = buildTopPositiveSignalSummaries(positiveUxSignals);
  const majorPenalties = buildMajorPenaltySummaries({
    findings,
    siteClassification,
    visualUxDiagnostics,
  });
  let overallScore = Math.round(
    weightedCategoryScores + positiveUxSignalBoost - severityAdjustedPenalties,
  );

  if (evidenceState?.scoringConfidence === "Low") {
    overallScore = Math.max(65, Math.min(82, overallScore));
  }
  const hasSevereMobileOrCheckoutIssue = findings.some(
    (finding) =>
      finding.severity === "Critical" ||
      (finding.severity === "High" && /mobile|checkout|cart/i.test(finding.title)),
  );
  const hasStrongEnterpriseMaturity =
    isEnterprise &&
    diagnostics.platformDetection.ecommerceProbability.label !== "Low" &&
    ecommerceMaturity.maturityScore >= 75 &&
    positiveUxSignals.searchProminence.label === "strong" &&
    positiveUxSignals.categoryVisibility.label !== "weak" &&
    positiveUxSignals.productDensity.label === "strong" &&
    visualUxScore !== null &&
    visualUxScore >= 75 &&
    !hasSevereMobileOrCheckoutIssue;

  if (hasStrongEnterpriseMaturity) {
    overallScore = Math.max(overallScore, visualUxScore >= 84 ? 86 : 82);
  }

  const hasB2bCatalogFriction = findings.some(
    (finding) =>
      finding.severity === "High" &&
      /layout|content-to-product|grid-to-content|discovery|catalog|part|spec|mobile/i.test(finding.title),
  );

  if (isIndustrial && visualUxScore !== null && visualUxScore < 55 && hasB2bCatalogFriction) {
    overallScore = Math.min(overallScore, 65);
  }

  overallScore = Math.max(35, Math.min(96, overallScore));

  return {
    overallScore,
    positiveUxSignals,
    ecommerceMaturity,
    scoreExplanation: {
      positiveSignals,
      majorPenalties,
      whyThisScore: buildScoreWhy({
        score: overallScore,
        positiveSignals,
        majorPenalties,
        ecommerceMaturity,
        siteClassification,
        visualUxDiagnostics,
        evidenceState,
      }),
      scoringConfidence: evidenceState?.scoringConfidence,
      confidenceNote: evidenceState?.scoringConfidenceNote,
    },
  };
}

type NarrativeArchetype =
  | "conversion-friction"
  | "trust-deficit"
  | "technical-risk"
  | "operational-clarity"
  | "discovery-breakdown"
  | "measurement-confidence-gap"
  | "mobile-clarity-risk"
  | "checkout-continuity-risk"
  | "balanced-review";

type NarrativeArchetypeProfile = {
  archetype: NarrativeArchetype;
  concernOrder: string[];
  emphasis: string[];
  vocabulary: string[];
  toneHints: {
    headline: string;
    interpretation: string;
    opening: string;
  };
  operationalFraming: string;
};

type NarrativeProfile = {
  archetype: NarrativeArchetype;
  siteType: StorefrontReviewSiteType;
  siteTypeConfidence: HeuristicConfidence;
  siteTypeReason: string;
  ecommerceProbability: {
    label: string;
    probability: number;
  };
  platformConfidence: {
    label: string;
    score: number;
    platformName: string;
  };
  narrativeMode: string;
  concernPriority: string;
  languageRules: string[];
  businessModel: string;
  businessContext: string;
  priorityTheme: string;
  narrativeOpening: string;
  narrativeProfileSummary: string;
  topFindingTitles: string[];
  recommendedFirstAction: string;
  recommendedActionStyle: string;
};

type Interpretation = {
  businessMeaning: string;
  operationalConcern: string;
  customerImpact: string;
  reviewDirection: string;
};

type ArchetypeAffinity = {
  findingCategories: HeuristicCategory[];
  primaryCategories: AuditCategoryKey[];
  keywords: string[];
  vocabulary: string[];
};

const archetypeAffinity: Record<NarrativeArchetype, ArchetypeAffinity> = {
  "technical-risk": {
    findingCategories: ["platformVisibility", "metadataClarity", "marketingVisibility"],
    primaryCategories: ["technicalIssues", "trackingIssues"],
    keywords: [
      "platform",
      "confidence",
      "failed",
      "request",
      "console",
      "diagnostic",
      "frontend",
      "reliability",
      "stability",
      "script",
      "tracking",
      "measurement",
      "metadata",
    ],
    vocabulary: [
      "operational reliability",
      "platform confidence",
      "script execution",
      "storefront stability",
      "implementation certainty",
      "measurement confidence",
    ],
  },
  "measurement-confidence-gap": {
    findingCategories: ["marketingVisibility", "platformVisibility"],
    primaryCategories: ["trackingIssues", "technicalIssues"],
    keywords: [
      "tracking",
      "attribution",
      "analytics",
      "measurement",
      "tag",
      "pixel",
      "conversion event",
      "campaign",
    ],
    vocabulary: [
      "measurement confidence",
      "signal trust",
      "attribution evidence",
      "campaign visibility",
      "conversion-event certainty",
    ],
  },
  "trust-deficit": {
    findingCategories: ["trustSignals", "operationsContinuity"],
    primaryCategories: ["conversionIssues", "operationsIssues"],
    keywords: [
      "trust",
      "review",
      "guarantee",
      "warranty",
      "shipping",
      "returns",
      "support",
      "payment",
      "confidence",
      "reassurance",
    ],
    vocabulary: [
      "reassurance",
      "purchase confidence",
      "hesitation",
      "decision certainty",
      "buying comfort",
    ],
  },
  "discovery-breakdown": {
    findingCategories: ["productDiscovery"],
    primaryCategories: ["uxUiIssues", "conversionIssues"],
    keywords: [
      "search",
      "category",
      "collection",
      "product",
      "navigation",
      "discovery",
      "browse",
      "find",
    ],
    vocabulary: [
      "product intent",
      "navigation clarity",
      "browse-to-buy path",
      "search visibility",
      "category flow",
    ],
  },
  "conversion-friction": {
    findingCategories: ["mobileConversion", "operationsContinuity", "trustSignals"],
    primaryCategories: ["conversionIssues", "uxUiIssues"],
    keywords: [
      "cta",
      "action",
      "cart",
      "checkout",
      "purchase",
      "conversion",
      "buy",
      "friction",
      "momentum",
    ],
    vocabulary: [
      "action path",
      "purchase momentum",
      "CTA hierarchy",
      "checkout readiness",
      "conversion flow",
    ],
  },
  "checkout-continuity-risk": {
    findingCategories: ["operationsContinuity", "mobileConversion"],
    primaryCategories: ["conversionIssues", "operationsIssues"],
    keywords: ["cart", "checkout", "purchase", "buy", "path", "continuity"],
    vocabulary: [
      "purchase continuity",
      "cart visibility",
      "checkout readiness",
      "intent handoff",
      "conversion flow",
    ],
  },
  "mobile-clarity-risk": {
    findingCategories: ["mobileConversion", "productDiscovery"],
    primaryCategories: ["uxUiIssues", "conversionIssues"],
    keywords: ["mobile", "cta", "action", "readability", "crowding", "first screen", "hierarchy"],
    vocabulary: [
      "first-screen clarity",
      "mobile action path",
      "CTA hierarchy",
      "screen density",
      "purchase momentum",
    ],
  },
  "operational-clarity": {
    findingCategories: ["operationsContinuity", "trustSignals"],
    primaryCategories: ["operationsIssues", "conversionIssues"],
    keywords: [
      "order",
      "returns",
      "shipping",
      "support",
      "fulfillment",
      "handoff",
      "workflow",
      "contact",
    ],
    vocabulary: [
      "order communication",
      "support handoff",
      "returns clarity",
      "fulfillment expectations",
      "post-purchase confidence",
    ],
  },
  "balanced-review": {
    findingCategories: [
      "mobileConversion",
      "trustSignals",
      "productDiscovery",
      "marketingVisibility",
      "operationsContinuity",
      "platformVisibility",
      "metadataClarity",
    ],
    primaryCategories: [
      "uxUiIssues",
      "conversionIssues",
      "technicalIssues",
      "trackingIssues",
      "operationsIssues",
    ],
    keywords: ["journey", "confidence", "conversion", "tracking", "support"],
    vocabulary: [
      "customer journey balance",
      "signal confidence",
      "review priority",
      "storefront readiness",
    ],
  },
};

function resolveNarrativeArchetype({
  categories,
  diagnostics,
  findings,
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): NarrativeArchetypeProfile {
  const trackingScore = categories.find((category) => category.key === "trackingIssues")?.score ?? 100;
  const technicalScore = categories.find((category) => category.key === "technicalIssues")?.score ?? 100;
  const operationsScore = categories.find((category) => category.key === "operationsIssues")?.score ?? 100;
  const conversionScore = categories.find((category) => category.key === "conversionIssues")?.score ?? 100;
  const uxScore = categories.find((category) => category.key === "uxUiIssues")?.score ?? 100;
  const topFindingTitles = findings.map((finding) => finding.title.toLowerCase());
  const trackingToolCount = diagnostics.technologyDetections.filter((tool) => tool.detected).length;
  const productDiscoveryVisible =
    diagnostics.storefrontSignals.productNavigationVisible ||
    diagnostics.storefrontSignals.collectionLinksVisible ||
    diagnostics.storefrontSignals.searchVisible;
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const cartVisible = diagnostics.commerceFlowSignals.cartVisible;
  const checkoutVisible = diagnostics.commerceFlowSignals.checkoutVisible;

  let archetype: NarrativeArchetype = "balanced-review";

  if (
    diagnostics.consoleErrors.length > 0 ||
    diagnostics.failedRequests.length > 0 ||
    platformNeedsManualReview(diagnostics) ||
    technicalScore <= Math.min(trackingScore, operationsScore, conversionScore, uxScore)
  ) {
    archetype = "technical-risk";
  } else if (
    trackingToolCount <= 1 ||
    topFindingTitles.some((title) => title.includes("tracking") || title.includes("attribution"))
  ) {
    archetype = "measurement-confidence-gap";
  } else if (
    !cartVisible ||
    !checkoutVisible ||
    topFindingTitles.some((title) => title.includes("checkout") || title.includes("cart"))
  ) {
    archetype = "checkout-continuity-risk";
  } else if (
    diagnostics.storefrontSignals.mobileCrowdingRisk ||
    topFindingTitles.some((title) => title.includes("mobile cta") || title.includes("mobile"))
  ) {
    archetype = "mobile-clarity-risk";
  } else if (
    !productDiscoveryVisible ||
    topFindingTitles.some((title) => title.includes("product discovery") || title.includes("search") || title.includes("navigation"))
  ) {
    archetype = "discovery-breakdown";
  } else if (
    trustSignalsVisible <= 3 ||
    topFindingTitles.some((title) => title.includes("trust"))
  ) {
    archetype = "trust-deficit";
  } else if (operationsScore < 80) {
    archetype = "operational-clarity";
  } else if (conversionScore < 80) {
    archetype = "conversion-friction";
  }

  const toneHints = {
    headline:
      archetype === "measurement-confidence-gap"
        ? "This scan shows visible storefront structure, but the main risk is whether the public tracking and attribution signals are reliable enough to trust next-step decisions."
        : archetype === "technical-risk"
          ? "This scan shows a functioning storefront shell, but the stronger concern is operational reliability and frontend stability before optimization work proceeds."
          : archetype === "checkout-continuity-risk"
            ? "This scan points to a store where the purchase path exists, but the cart and checkout continuity should be reviewed before scaling traffic."
            : archetype === "mobile-clarity-risk"
              ? "This scan points to a mobile experience that needs clearer action hierarchy so shoppers know what to do next."
              : archetype === "discovery-breakdown"
                ? "This scan points to a storefront with visible commerce signals, but the product discovery path is the most likely source of shopper friction."
                : archetype === "trust-deficit"
                  ? "This scan points to a storefront that should build more purchase confidence before treating the findings as optimization-ready."
                  : archetype === "operational-clarity"
                    ? "This scan points to a storefront that may be workable, but the operational story still needs clearer support, shipping, and follow-up cues."
                    : archetype === "conversion-friction"
                      ? "This scan points to a storefront that has conversion elements, but the customer path still feels harder to follow than it should."
                      : "This scan points to a storefront with multiple visible commerce signals, but several areas still need closer review before deeper optimization.",
    interpretation:
      archetype === "measurement-confidence-gap"
        ? "That matters because marketing and conversion teams need clean signal paths before they can trust campaign and funnel analysis."
        : archetype === "technical-risk"
          ? "That matters because platform uncertainty and frontend errors can distort both customer experience and measurement."
          : archetype === "checkout-continuity-risk"
            ? "That matters because purchase intent can leak when the cart and checkout path are not clearly connected."
            : archetype === "mobile-clarity-risk"
              ? "That matters because mobile shoppers decide on the first visible action, and unclear mobile hierarchy can stall the path to purchase."
              : archetype === "discovery-breakdown"
                ? productDiscoveryVisible
                  ? "That matters because shoppers need a smoother discovery path to turn browsing into buying."
                  : "That matters because a weaker discovery path can make the store feel harder to use than it actually is."
                : archetype === "trust-deficit"
                  ? "That matters because purchase confidence is often the difference between clicking and converting on a public storefront."
                  : archetype === "operational-clarity"
                    ? "That matters because operational gaps in support, returns, and shipping language can reduce shopper trust before checkout."
                    : archetype === "conversion-friction"
                      ? "That matters because conversion friction is often the first thing that keeps good traffic from turning into actual customers."
                      : "That matters because the team needs to understand not just what is visible, but what should be prioritized next in the customer journey.",
    opening:
      archetype === "measurement-confidence-gap"
        ? "This scan shows visible storefront elements, but the more important review is whether the data behind them is reliable enough to act on."
        : archetype === "technical-risk"
          ? "This scan shows the storefront from a public-page perspective, and the stronger concern is technical reliability rather than just interface polish."
          : archetype === "checkout-continuity-risk"
            ? "This scan shows the purchase path is present, and the key question is whether cart and checkout stay connected for the shopper."
            : archetype === "mobile-clarity-risk"
              ? "This scan shows mobile commerce signals, but the key story is whether the first screen makes the next action clear."
              : archetype === "discovery-breakdown"
                ? "This scan shows some visible commerce signals, but the discovery path is the area most likely to slow shoppers down."
                : archetype === "trust-deficit"
                  ? "This scan shows a storefront with visible signals, but the more important review is whether shoppers feel confident enough to move forward."
                  : archetype === "operational-clarity"
                    ? "This scan shows a store that can function, but the real question is how clearly it communicates support, shipping, and next-step logistics."
                    : archetype === "conversion-friction"
                      ? "This scan shows the storefront has conversion elements, but the focus should be on how easy it is to follow the customer path."
                      : "This scan shows visible commerce structure and a few review areas that matter before deeper optimization.",
  };

  const concernOrder =
    archetype === "technical-risk"
      ? ["operational reliability", "measurement confidence", "storefront continuity"]
      : archetype === "trust-deficit"
        ? ["customer hesitation", "reassurance clarity", "conversion confidence"]
        : archetype === "discovery-breakdown"
          ? ["product intent friction", "navigation clarity", "browse-to-buy continuity"]
          : archetype === "checkout-continuity-risk"
            ? ["path continuity", "cart visibility", "checkout confidence"]
            : archetype === "mobile-clarity-risk"
              ? ["first-screen clarity", "CTA visibility", "mobile hierarchy"]
              : archetype === "measurement-confidence-gap"
                ? ["tracking visibility", "attribution evidence", "signal trust"]
                : archetype === "operational-clarity"
                  ? ["support and fulfillment clarity", "returns visibility", "handoff confidence"]
                  : archetype === "conversion-friction"
                    ? ["action clarity", "trust cues", "checkout path"]
                    : ["customer journey balance", "signal confidence", "review priority"];

  const emphasis =
    archetype === "technical-risk"
      ? ["front-end stability", "platform confidence", "operational review"]
      : archetype === "trust-deficit"
        ? ["trust cues", "reassurance messaging", "early purchase confidence"]
        : archetype === "discovery-breakdown"
          ? ["product findability", "navigation cues", "browse flow"]
          : archetype === "checkout-continuity-risk"
            ? ["cart and checkout", "purchase path", "intent handoff"]
            : archetype === "mobile-clarity-risk"
              ? ["mobile action signal", "screen hierarchy", "primary action visibility"]
              : archetype === "measurement-confidence-gap"
                ? ["tracking tools", "analytics visibility", "campaign trust"]
                : archetype === "operational-clarity"
                  ? ["support and shipping", "post-purchase clarity", "handoff confidence"]
                  : archetype === "conversion-friction"
                    ? ["CTA clarity", "economic friction", "checkout readiness"]
                    : ["journey clarity", "signal confidence", "review readiness"];

  const operationalFraming =
    archetype === "technical-risk"
      ? "Review the platform signal, any failed requests, and frontend errors before making optimization recommendations."
      : archetype === "trust-deficit"
        ? "Review how reassurance signals are presented before treating the experience as optimization-ready."
        : archetype === "discovery-breakdown"
          ? "Review the product discovery path, search, and navigation before assuming shoppers can easily find what they came for."
          : archetype === "checkout-continuity-risk"
            ? "Review the path from product selection to checkout as one connected flow before scaling traffic."
            : archetype === "mobile-clarity-risk"
              ? "Review the first mobile viewport and primary action hierarchy before drawing conclusions about conversion fixes."
              : archetype === "measurement-confidence-gap"
                ? "Review tracking tool visibility and attribution evidence before trusting conversion signals."
                : archetype === "operational-clarity"
                  ? "Review support, returns, and fulfillment messaging as part of operational readiness."
                  : archetype === "conversion-friction"
                    ? "Review action clarity and trust cues before optimizing for more traffic."
                    : "Review the most visible customer journey gaps and signal confidence before deeper recommendations.";

  return {
    archetype,
    concernOrder,
    emphasis,
    vocabulary: archetypeAffinity[archetype].vocabulary,
    toneHints,
    operationalFraming,
  };
}

function interpretTechnicalFinding({
  diagnostics,
  findings,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): Interpretation {
  const technicalFinding =
    findings.find((finding) => finding.primaryCategory === "technicalIssues") ||
    findings.find((finding) => finding.category === "platformVisibility") ||
    findings[0];
  const platform = diagnostics.platformDetection.name;
  const foundPlatform = platform && platform !== "Unknown" ? platform : "an unknown platform";
  const issueCount = diagnostics.failedRequests.length + diagnostics.consoleErrors.length;
  const platformMeaning =
    platform === "Enterprise / Custom Commerce Stack"
      ? "That means standard-platform assumptions should wait until the custom or hybrid architecture is manually confirmed."
      : foundPlatform === "an unknown platform"
        ? "That makes it harder to plan specific fixes."
        : "That means we should verify whether the detected platform assumptions are accurate.";

  return {
    businessMeaning: `The public scan suggests platform reliability and script execution are the key operational risks. ${platformMeaning}`,
    operationalConcern: `If the storefront is not stable, fixes in tracking, checkout, or product discovery may not behave consistently.`,
    customerImpact: issueCount > 0
      ? `Shoppers may experience inconsistent behavior or interrupted checkout if these frontend issues remain. `
      : `This remains a moderate concern because platform confidence affects how reliably the storefront will behave under traffic.`,
    reviewDirection: `Review the detected platform evidence, failed frontend requests, and console noise before moving to conversion or trust recommendations.`,
  };
}

function interpretTrustFinding({
  diagnostics,
  findings,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): Interpretation {
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const trustFinding = findings.find((finding) => finding.category === "trustSignals");

  return {
    businessMeaning: trustSignalsVisible >= 4
      ? "The store shows enough reassurance signals to support shoppers through the early buying decision."
      : "The store is missing enough trust cues that shoppers may hesitate before committing to a purchase.",
    operationalConcern: trustFinding
      ? `The evidence points to ${trustFinding.title.toLowerCase()} as the review area. `
      : "The evidence points to trust building as a broader gap in the visible experience. ",
    customerImpact: trustSignalsVisible >= 4
      ? "Shoppers are more likely to feel confident enough to continue toward checkout."
      : "Shoppers may abandon if they do not see clear reassurance around shipping, returns, or support.",
    reviewDirection: "Review the visible trust and reassurance cues, especially reviews, shipping, returns, contact, and payment signals, before making confidence-based recommendations.",
  };
}

function interpretDiscoveryFinding({
  diagnostics,
  findings,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): Interpretation {
  const discoveryFinding =
    findings.find((finding) => finding.category === "productDiscovery") ||
    findings.find((finding) => finding.title.includes("Search")) ||
    findings[0];
  const discoveryVisible =
    diagnostics.storefrontSignals.productNavigationVisible ||
    diagnostics.storefrontSignals.collectionLinksVisible ||
    diagnostics.storefrontSignals.searchVisible;

  return {
    businessMeaning: discoveryVisible
      ? "There is a recognizable browse path, but it may still force shoppers to work harder than necessary." 
      : "The store may be asking customers to find products without enough discovery cues, which slows decision making.",
    operationalConcern: discoveryFinding
      ? `The scan highlights ${discoveryFinding.title.toLowerCase()} as the main discovery concern. `
      : "The discovery path is the main area to review. ",
    customerImpact: discoveryVisible
      ? "Shoppers may still struggle to find the right products quickly."
      : "Shoppers may drop out before they can reach product detail or checkout.",
    reviewDirection: "Review navigation, category cues, collection visibility, and search presence before assuming product intent is easy to capture.",
  };
}

function interpretTrackingFinding({
  diagnostics,
  findings,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): Interpretation {
  const trackingTools = visibleMarketingTools(diagnostics);
  const trackingFinding = findings.find((finding) => finding.primaryCategory === "trackingIssues");

  return {
    businessMeaning: trackingTools.length >= 2
      ? "Tracking visibility looks more reliable, which supports measurement and attribution confidence." 
      : "Limited visible tracking tools can make campaign performance and conversion signals harder to trust.",
    operationalConcern: trackingFinding
      ? `The evidence points to ${trackingFinding.title.toLowerCase()} as the most important measurement review. `
      : "The tracking layer needs a manual review to confirm what is actually being captured. ",
    customerImpact: trackingTools.length >= 2
      ? "This makes it easier to interpret results when you optimize traffic."
      : "This raises the risk that good traffic improvements may not be visible in analytics.",
    reviewDirection: "Review visible analytics and marketing tags before treating the scan as a reliable signal source for conversion decisions.",
  };
}

function interpretOperationalFinding({
  diagnostics,
  findings,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): Interpretation {
  const commerce = diagnostics.commerceFlowSignals;
  const operationalFinding = findings.find((finding) => finding.primaryCategory === "operationsIssues") || findings[0];

  return {
    businessMeaning: commerce.cartVisible && commerce.checkoutVisible
      ? "The experience has the basic purchase path, but the handoff from browsing to buying still needs scrutiny." 
      : "The purchase path is not clearly visible enough to move ahead without a deeper customer journey review.",
    operationalConcern: operationalFinding
      ? `The evidence points to ${operationalFinding.title.toLowerCase()} as the operational risk. `
      : "The operational path is the most important thing to validate before optimization. ",
    customerImpact: commerce.cartVisible && commerce.checkoutVisible
      ? "Shoppers have a route to buy, but they may still lose confidence if the path feels disjointed."
      : "Shoppers may never reach checkout if they can't find the cart or payment path clearly.",
    reviewDirection: "Review cart, checkout, support, and post-purchase messaging together as a connected operations story.",
  };
}

function interpretCTAFinding({
  diagnostics,
  findings,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): Interpretation {
  const mobileCtaFinding = findings.find((finding) => finding.title.includes("Mobile CTA")) || findings[0];
  const ctaVisible = diagnostics.storefrontSignals.mobileCtaVisibleAboveFold;

  return {
    businessMeaning: ctaVisible
      ? "A visible primary action is a good start, but it still needs clarity in how it leads shoppers through the next step." 
      : "Without a clear mobile action, shoppers may hesitate and the purchase path may stall early.",
    operationalConcern: mobileCtaFinding
      ? `The evidence points to ${mobileCtaFinding.title.toLowerCase()} as the mobile clarity concern. `
      : "The mobile action path is the main issue to validate. ",
    customerImpact: ctaVisible
      ? "Shoppers are more likely to know what to do next, but only if the action is unmistakable."
      : "Shoppers may lose momentum before they can choose a product or proceed to checkout.",
    reviewDirection: "Review mobile action placement, label clarity, and visual hierarchy before assuming the mobile path is ready."
  };
}

function buildSiteTypeExecutiveSummary({
  reviewContext,
  diagnostics,
  findings,
}: {
  reviewContext: StorefrontReviewContext;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}) {
  const topFindings = findings.slice(0, 3);
  const opportunities = topFindings.map((finding) =>
    buildExecutiveOpportunityText({
      title: finding.title,
      evidence: finding.evidenceSummary,
      action: finding.recommendedFirstAction,
    }),
  );

  if (reviewContext.siteType === "non-ecommerce-or-unclear") {
    return {
      summary:
        "The submitted page does not expose a complete ecommerce journey from public evidence, so the review should first confirm whether this is the correct commerce entry point.",
      highestImpactOpportunities: opportunities,
      businessInterpretation:
        "Treat this as a routing and context check before judging checkout, cart, or product conversion performance. The next review should confirm whether the buying path lives on another URL, behind account access, or outside the public page sample.",
    };
  }

  if (reviewContext.siteType === "enterprise-retail" || reviewContext.siteType === "custom-enterprise") {
    return {
      summary:
        "This looks like an enterprise or custom commerce environment where the public page intentionally exposes limited platform and transaction detail.",
      highestImpactOpportunities: opportunities,
      businessInterpretation:
        "The first priority is manual confirmation of platform, catalog, cart, checkout, and measurement architecture before making platform-specific recommendations.",
    };
  }

  if (reviewContext.siteType === "catalog-commerce") {
    return {
      summary:
        "The scan reads as a catalog-led commerce review: product discovery is visible, but the full browse-to-buy path is not fully exposed in the public sample.",
      highestImpactOpportunities: opportunities,
      businessInterpretation:
        "Prioritize category clarity, search visibility, product links, and the handoff from browsing into purchase or enquiry before treating checkout friction as the main issue.",
    };
  }

  if (reviewContext.siteType === "lead-generation") {
    return {
      summary:
        "The submitted page behaves more like a lead-generation path than a standard retail storefront.",
      highestImpactOpportunities: opportunities,
      businessInterpretation:
        "The review should focus on CTA clarity, form visibility, trust cues, and the operational handoff after a visitor shows intent.",
    };
  }

  if (reviewContext.siteType === "education/content-commerce") {
    return {
      summary:
        "The page appears to sit in an education, course, account, or content journey rather than a straightforward retail checkout path.",
      highestImpactOpportunities: opportunities,
      businessInterpretation:
        "The next review should clarify whether users are expected to browse courses, sign in, request access, or move into a separate commerce flow.",
    };
  }

  return null;
}

function deriveBusinessModelLabel(siteType: StorefrontReviewSiteType) {
  switch (siteType) {
    case "enterprise-retail":
      return "enterprise retail experience";
    case "custom-enterprise":
      return "custom enterprise commerce experience";
    case "catalog-commerce":
      return "catalog-commerce storefront";
    case "lead-generation":
      return "lead-generation or enquiry flow";
    case "education/content-commerce":
      return "education and content commerce journey";
    case "non-ecommerce-or-unclear":
      return "unclear or informational public entry point";
    default:
      return "standard ecommerce storefront";
  }
}

function deriveBusinessModelSummary(siteType: StorefrontReviewSiteType) {
  switch (siteType) {
    case "enterprise-retail":
    case "custom-enterprise":
      return "This review should treat the page as a partial enterprise commerce window rather than a full retail storefront.";
    case "catalog-commerce":
      return "This review should treat the page as a catalog-led experience where product discovery and category flow matter more than a public checkout path.";
    case "lead-generation":
      return "This review should treat the page as a lead capture or enquiry experience rather than a standard cart-and-checkout storefront.";
    case "education/content-commerce":
      return "This review should treat the page as a content or education path, where access, trust, and next-step clarity matter more than immediate transaction flow.";
    case "non-ecommerce-or-unclear":
      return "This review should treat the page as an unclear public commerce entry point until the actual buying path can be confirmed.";
    default:
      return "This review should treat the page as a storefront journey with a focus on conversion, trust, and measurement.";
  }
}

function normalizeNarrativeMode(value: string) {
  return value.trim().toLowerCase().replace(/\s*\/\s*/g, " / ");
}

function inferNarrativeMode({
  diagnostics,
  identityProfile,
  reviewContext,
  siteClassification,
}: {
  diagnostics: LiveDiagnosticsResult;
  identityProfile: StorefrontIdentityProfile;
  reviewContext: StorefrontReviewContext;
  siteClassification: SiteClassification;
}) {
  const classified = normalizeNarrativeMode(siteClassification.siteType);
  const host = safeHost(diagnostics.finalUrl || identityProfile.domain);
  const text = [
    diagnostics.title,
    diagnostics.metaDescription,
    diagnostics.finalUrl,
    diagnostics.commerceFlowSignals.ctaLabels.join(" "),
    diagnostics.conversionSignals.ctaLabels.join(" "),
    diagnostics.storefrontSignals.mobileCtaLabels.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (reviewContext.siteType === "lead-generation") return "Lead Generation / Service Business";
  if (reviewContext.siteType === "non-ecommerce-or-unclear") return "Non-Ecommerce / Unclear";

  if (domainMatches(host, knownEnterpriseRetailDomains)) return "Enterprise Retail";
  if (domainMatches(host, knownHealthcareCommerceDomains)) return "Healthcare Commerce";
  if (domainMatches(host, knownB2BCommerceDomains)) return "B2B Commerce";
  if (domainMatches(host, knownEducationContentDomains)) return "Education Commerce";

  if (classified.includes("marketplace")) return "Marketplace";
  if (
    classified.includes("b2b") ||
    classified.includes("industrial") ||
    hasIndustrialSupplyEvidence(text)
  ) {
    return "B2B Commerce";
  }
  if (classified.includes("grocery") || hasGroceryRetailEvidence(host, text)) {
    return "Grocery / Supermarket Retail";
  }
  if (classified.includes("education")) return "Education Commerce";
  if (classified.includes("subscription")) return "Subscription Commerce";
  if (classified.includes("healthcare")) return "Healthcare Commerce";
  if (classified.includes("lead generation") || classified.includes("service")) {
    return "Lead Generation / Service Business";
  }
  if (classified.includes("non-ecommerce") || classified.includes("unclear")) {
    return "Non-Ecommerce / Unclear";
  }
  if (classified.includes("enterprise")) return "Enterprise Retail";
  if (classified.includes("dtc")) return "DTC Brand";

  if (reviewContext.siteType === "enterprise-retail" || reviewContext.siteType === "custom-enterprise") {
    return "Enterprise Retail";
  }
  if (reviewContext.siteType === "education/content-commerce") return "Education Commerce";
  if (reviewContext.siteType === "catalog-commerce") {
    if (textHasAny(text, ["wholesale", "bulk", "distributor", "request a quote", "rfq", "procurement", "part number", "sku"])) {
      return "B2B Commerce";
    }

    return "B2B Commerce";
  }
  if (textHasAny(text, ["subscription", "subscribe", "membership", "monthly", "recurring", "plan"])) {
    return "Subscription Commerce";
  }
  if (textHasAny(text, ["patient", "provider", "medical", "pharmacy", "healthcare", "prescription"])) {
    return "Healthcare Commerce";
  }
  if (textHasAny(text, ["seller", "vendor", "marketplace", "sell on"])) return "Marketplace";

  return "DTC Brand";
}

function applyKnownDomainNarrativeOverrides({
  config,
  host,
  mode,
}: {
  config: ReturnType<typeof narrativeModeConfig>;
  host: string;
  mode: string;
}) {
  if (mode !== "Enterprise Retail") {
    return config;
  }

  if (domainMatches(host, ["amazon.com"])) {
    return {
      ...config,
      businessContext:
        "marketplace-scale retail environment where catalog breadth, seller/account paths, platform abstraction, and measurement confidence all affect optimization decisions",
      concernPriority:
        "marketplace-scale discovery, seller/account paths, platform abstraction, measurement confidence, and frontend observability",
      opening:
        "This scan reads like a marketplace-scale retail environment where the main question is how confidently the public page exposes discovery, account, platform, and measurement signals across a very large catalog.",
    };
  }

  if (domainMatches(host, ["walmart.com"])) {
    return {
      ...config,
      businessContext:
        "omnichannel enterprise retail environment where catalog discovery, fulfillment expectations, platform abstraction, and measurement confidence shape the review",
      concernPriority:
        "omnichannel catalog discovery, fulfillment handoff, platform abstraction, measurement confidence, and frontend observability",
      opening:
        "This scan reads like an omnichannel enterprise retail environment where the public page must balance catalog discovery, fulfillment expectations, platform abstraction, and measurement confidence.",
    };
  }

  return config;
}

function narrativeModeConfig(mode: string) {
  switch (mode) {
    case "Grocery / Supermarket Retail":
      return {
        businessContext:
          "grocery and supermarket retail journey where shoppers need search, departments, weekly ads, pickup or delivery, store location, availability, loyalty, and cart clarity",
        concernPriority:
          "search, departments, weekly ad or promotions, pickup/delivery clarity, store location, loyalty/rewards, and cart path",
        recommendedActionStyle:
          "Review the mobile path from search or departments into pickup/delivery, weekly ad, product discovery, and cart/checkout. Confirm platform ownership separately before making platform-specific recommendations.",
        languageRules: [
          "Use grocery discovery, departments, pickup/delivery, weekly ad, store location, and loyalty language.",
          "Prioritize customer-facing shopping paths before internal platform uncertainty.",
          "Avoid generic DTC product storytelling or lifestyle-brand framing.",
        ],
        opening:
          "This looks like grocery / supermarket retail, where shoppers need to move quickly from grocery intent into search, departments, weekly ad, pickup/delivery, store location, or cart.",
      };
    case "Enterprise Retail":
      return {
        businessContext:
          "large-scale retail environment with abstracted platform signals, high operational complexity, and measurement decisions that should be validated before optimization",
        concernPriority:
          "platform, measurement, catalog, checkout ownership, and frontend observability",
        recommendedActionStyle:
          "Confirm the actual commerce architecture, tracking stack, and cart/checkout ownership before making platform-specific recommendations.",
        languageRules: [
          "Discuss enterprise complexity and platform abstraction.",
          "Prioritize measurement confidence and operational reliability.",
          "Avoid implying the public scan can see internal architecture.",
        ],
        opening:
          "This scan reads like a large-scale retail environment where the main question is not whether commerce exists, but how confidently the public page exposes platform, tracking, and operational signals.",
      };
    case "Marketplace":
      return {
        businessContext:
          "marketplace-style experience where buyer/seller trust, product discovery, account paths, and transaction confidence shape the review",
        concernPriority:
          "buyer/seller trust, marketplace navigation, seller/account paths, and transaction confidence",
        recommendedActionStyle:
          "Map buyer, seller, account, product discovery, and transaction paths before treating the page like a single-brand checkout.",
        languageRules: [
          "Separate buyer and seller trust when possible.",
          "Focus on marketplace navigation and account paths.",
          "Avoid single-brand DTC assumptions.",
        ],
        opening:
          "This looks like a marketplace-style experience where discovery, account paths, and transaction confidence matter more than a single linear product-to-checkout journey.",
      };
    case "B2B Commerce":
      return {
        businessContext:
          "business-buyer journey where catalog discovery, SKU lookup, quote/account workflows, and procurement handoff matter more than impulse checkout",
        concernPriority:
          "catalog discovery, SKU/part lookup, quote request, account login, and procurement handoff",
        recommendedActionStyle:
          "Map the buyer journey from category discovery to product detail, quote request, account login, and procurement handoff.",
        languageRules: [
          "Use business buyer and procurement language.",
          "Treat quote/request workflows as conversion paths.",
          "Avoid assuming consumer checkout is the only goal.",
        ],
        opening:
          "This scan reads closer to a B2B commerce journey, where buyers need to move from catalog discovery into quote, account, or procurement action with confidence.",
      };
    case "Education Commerce":
      return {
        businessContext:
          "education-commerce experience where course/catalog discovery, account access, enrollment clarity, and content-to-commerce handoff drive the review",
        concernPriority:
          "course/catalog discovery, account paths, enrollment or purchase clarity, and content-to-commerce handoff",
        recommendedActionStyle:
          "Confirm whether the main path is course discovery, account login, enrollment, direct purchase, or lead capture.",
        languageRules: [
          "Use learner, student, course, account, and enrollment language.",
          "Avoid treating all missing cart signals as retail checkout failures.",
          "Clarify whether the path is content, account, enrollment, purchase, or lead capture.",
        ],
        opening:
          "This appears closer to an education-commerce experience than a standard retail storefront, so the review should focus on course/catalog discovery, account paths, and whether enrollment or checkout flows are clearly exposed.",
      };
    case "Subscription Commerce":
      return {
        businessContext:
          "subscription experience where plan clarity, recurring value, trust before commitment, renewal/cancellation confidence, and CTA clarity matter",
        concernPriority:
          "plan clarity, recurring value, trust before subscription, cancellation/renewal confidence, and CTA clarity",
        recommendedActionStyle:
          "Review plan clarity, recurring value proof, trust placement, renewal/cancellation reassurance, and subscription CTA hierarchy.",
        languageRules: [
          "Frame conversion as commitment confidence.",
          "Mention recurring value and renewal/cancellation reassurance.",
          "Avoid one-time checkout-only framing.",
        ],
        opening:
          "This reads like a subscription-commerce path where the visitor needs to understand the plan, recurring value, trust cues, and commitment terms before acting.",
      };
    case "Healthcare Commerce":
      return {
        businessContext:
          "healthcare commerce path where patient/provider trust, product clarity, support/accessibility, and purchase reassurance must be handled carefully",
        concernPriority:
          "patient/provider trust, support clarity, product confidence, accessibility, and purchase reassurance",
        recommendedActionStyle:
          "Review product clarity, trust proof, support/accessibility cues, and purchase reassurance with compliance-sensitive language.",
        languageRules: [
          "Use careful, compliance-sensitive wording.",
          "Focus on patient/provider trust and support clarity.",
          "Avoid aggressive conversion language.",
        ],
        opening:
          "This looks like a healthcare-commerce experience where clarity, reassurance, support access, and careful trust signals matter as much as the transaction path.",
      };
    case "Lead Generation / Service Business":
      return {
        businessContext:
          "lead-generation or service-business page where consultation flow, form clarity, trust proof, contact handoff, and service positioning are the conversion path",
        concernPriority:
          "offer clarity, form placement, trust proof, consultation path, and contact handoff",
        recommendedActionStyle:
          "Review the offer clarity, trust proof, form placement, and contact handoff before treating the page as ecommerce.",
        languageRules: [
          "Use consultation, appointment, quote, and contact language.",
          "Do not assume cart or checkout should exist.",
          "Treat form/contact intent as the conversion path.",
        ],
        opening:
          "This page does not behave like a standard ecommerce storefront. The first question is whether the goal is lead capture, consultation requests, or a separate commerce journey.",
      };
    case "Non-Ecommerce / Unclear":
      return {
        businessContext:
          "unclear public entry point where the first review question is whether the submitted URL is informational, lead-generation, account-driven, or the wrong commerce entry point",
        concernPriority:
          "commerce-entry-point validation, informational intent, missing product/cart/checkout flow, and manual review before ecommerce assumptions",
        recommendedActionStyle:
          "Confirm whether this submitted URL is the correct commerce entry point before making ecommerce, platform, cart, or checkout recommendations.",
        languageRules: [
          "Avoid standard ecommerce assumptions.",
          "Do not criticize missing cart/checkout unless the URL should transact.",
          "Focus on URL purpose and manual confirmation.",
        ],
        opening:
          "This submitted URL does not expose enough public ecommerce flow to treat it like a standard storefront.",
      };
    case "DTC Brand":
    default:
      return {
        businessContext:
          "brand-owned commerce experience where mobile clarity, trust signals, product storytelling, purchase momentum, and checkout confidence shape the review",
        concernPriority:
          "mobile clarity, trust signals, product storytelling, purchase momentum, and checkout confidence",
        recommendedActionStyle:
          "Review the mobile hero, primary CTA, product storytelling, trust placement, and checkout entry point as one purchase journey.",
        languageRules: [
          "Use brand-owned shopping experience language.",
          "Focus on mobile clarity, trust, product story, and purchase momentum.",
          "Connect product discovery to checkout confidence.",
        ],
        opening:
          "This looks like a brand-owned commerce experience where mobile clarity, trust signals, and product-to-purchase momentum matter most.",
      };
  }
}

function buildNarrativeProfile({
  diagnostics,
  findings,
  identityProfile,
  profile,
  reviewContext,
  siteClassification,
  primaryOperationalConcern,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  identityProfile: StorefrontIdentityProfile;
  profile: NarrativeArchetypeProfile;
  reviewContext: StorefrontReviewContext;
  siteClassification: SiteClassification;
  primaryOperationalConcern?: PrimaryOperationalConcern | null;
}): NarrativeProfile {
  const narrativeMode = inferNarrativeMode({
    diagnostics,
    identityProfile,
    reviewContext,
    siteClassification,
  });
  const topFindings = narrativeSortedFindingsForProfile(
    findings,
    profile.archetype,
    { narrativeMode } as NarrativeProfile,
  ).slice(0, 3);
  const topFindingTitles = topFindings.map((finding) => finding.title);
  const host = safeHost(diagnostics.finalUrl || identityProfile.domain);
  const modeConfig = applyKnownDomainNarrativeOverrides({
    config: narrativeModeConfig(narrativeMode),
    host,
    mode: narrativeMode,
  });
  const businessModel = siteClassification.siteType || deriveBusinessModelLabel(reviewContext.siteType);
  const priorityTheme =
    modeConfig.concernPriority ||
    (profile.emphasis.length > 0
      ? profile.emphasis[0]
      : profile.concernOrder[0] ?? "customer journey review");
  const defaultAction =
    primaryOperationalConcern?.recommendedFirstAction ??
    (modeConfig.recommendedActionStyle ||
      buildIdentityAwareFirstAction(
      topFindings[0]?.recommendedFirstAction ||
        "Review the visible journey before making deeper assumptions.",
      identityProfile,
    ));
  const narrativeOpening = modeConfig.opening;
  const narrativeProfileSummary = sanitizeEvidenceText(
    `${narrativeOpening} ${modeConfig.businessContext} ${
      topFindingTitles.length > 0
        ? `The leading scan signals are ${topFindingTitles.join(", ")}.`
        : "The page should be reviewed in context of its visible public signals."
    }`,
    { maxLength: 320 },
  );

  return {
    archetype: profile.archetype,
    siteType: reviewContext.siteType,
    siteTypeConfidence: reviewContext.confidence,
    siteTypeReason: reviewContext.reason,
    ecommerceProbability: {
      label: diagnostics.platformDetection.ecommerceProbability.label,
      probability: diagnostics.platformDetection.ecommerceProbability.probability,
    },
    platformConfidence: {
      label: diagnostics.platformDetection.confidenceLabel,
      score: diagnostics.platformDetection.confidence,
      platformName: diagnostics.platformDetection.name,
    },
    narrativeMode,
    concernPriority: modeConfig.concernPriority,
    languageRules: modeConfig.languageRules,
    businessModel,
    businessContext: modeConfig.businessContext,
    priorityTheme,
    narrativeOpening,
    narrativeProfileSummary,
    topFindingTitles,
    recommendedFirstAction: sanitizeEvidenceText(defaultAction, { maxLength: 240 }),
    recommendedActionStyle: modeConfig.recommendedActionStyle,
  };
}

function buildExecutiveSummary({
  categories,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
  reviewContext,
  profile,
  narrativeProfile,
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
  identityProfile: StorefrontIdentityProfile;
  reviewContext: StorefrontReviewContext;
  profile: NarrativeArchetypeProfile;
  narrativeProfile?: NarrativeProfile;
}) {
  const weightedFindings = narrativeSortedFindingsForProfile(
    findings,
    profile.archetype,
    narrativeProfile,
  );
  const topVisualFinding = findHighSeverityVisualUxFinding(weightedFindings);
  const topFinding = topVisualFinding ?? weightedFindings[0];
  const siteTypeSummary = buildSiteTypeExecutiveSummary({
    reviewContext,
    diagnostics,
    findings: weightedFindings,
  });

  if (
    siteTypeSummary &&
    (reviewContext.siteType === "lead-generation" ||
      reviewContext.siteType === "non-ecommerce-or-unclear")
  ) {
    return siteTypeSummary;
  }

  if (narrativeProfile) {
    const initialOpportunities = weightedFindings.slice(0, 3).map((finding) =>
      buildExecutiveOpportunityText({
        title: finding.title,
        evidence: finding.evidenceSummary,
        action:
          finding === topFinding
            ? narrativeProfile.recommendedActionStyle
            : finding.recommendedFirstAction,
      }),
    );
    const opportunities = topVisualFinding
      ? [
          buildExecutiveOpportunityText({
            title: topVisualFinding.title,
            evidence: topVisualFinding.evidenceSummary,
            action: topVisualFinding.recommendedFirstAction,
          }),
          ...initialOpportunities.filter(
            (opportunity) => !opportunity.includes(topVisualFinding.title),
          ),
        ].slice(0, 3)
      : initialOpportunities;
    const probabilityPhrase =
      narrativeProfile.ecommerceProbability.label === "Low"
        ? "Ecommerce probability is low, so this should not be judged like a standard storefront until the correct commerce entry point is confirmed."
        : narrativeProfile.ecommerceProbability.label === "Unclear"
          ? "Ecommerce probability is unclear, so commerce-flow conclusions should stay directional."
          : narrativeProfile.ecommerceProbability.label === "Moderate"
            ? "Ecommerce probability is moderate, so platform and journey assumptions should be manually confirmed."
            : "Ecommerce probability is high enough to review the visible journey as commerce-oriented.";
    const platformPhrase =
      /low|needs review|unknown/i.test(narrativeProfile.platformConfidence.label) ||
      narrativeProfile.platformConfidence.platformName === "Enterprise / Custom Commerce Stack" ||
      narrativeProfile.platformConfidence.platformName === "Platform not confidently identified"
        ? `Platform confidence is ${narrativeProfile.platformConfidence.label.toLowerCase()}, so platform-specific recommendations should stay conservative.`
        : `Platform evidence points to ${narrativeProfile.platformConfidence.platformName}, but implementation details still need manual confirmation.`;
    const topFindingPhrase = topFinding
      ? `The leading finding is ${topFinding.title.toLowerCase()}, which affects ${topFinding.businessImpact.toLowerCase()}`
      : "The scan did not surface one dominant public-page finding, so the first review should validate the visible journey manually.";

    return {
      summary: sanitizeEvidenceText(
        `${narrativeProfile.narrativeOpening} ${probabilityPhrase} ${topFindingPhrase}`,
        { maxLength: 520 },
      ),
      highestImpactOpportunities: opportunities,
      businessInterpretation: sanitizeEvidenceText(
        `${narrativeProfile.businessContext}. ${platformPhrase} The review should prioritize ${narrativeProfile.concernPriority}.`,
        { maxLength: 520 },
      ),
    };
  }

  if (siteTypeSummary) {
    return {
      ...siteTypeSummary,
      summary: sanitizeEvidenceText(
        `${identityProfile.identitySummary} ${siteTypeSummary.summary}`,
      ),
      businessInterpretation: sanitizeEvidenceText(
        `${profile.toneHints.interpretation} ${siteTypeSummary.businessInterpretation}`,
      ),
    };
  }

  const summaryBuilder = summaryBuilders[profile.archetype] ?? buildBalancedReviewSummary;
  const result = summaryBuilder({
    profile,
    categories,
    diagnostics,
    findings: weightedFindings,
    overallScore,
    identityProfile,
  });

  return {
    ...result,
    summary: sanitizeEvidenceText(
      `${identityProfile.identitySummary} ${result.summary}`,
    ),
  };
}

function buildTechnicalRiskSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}): {
  summary: string;
  highestImpactOpportunities: string[];
  businessInterpretation: string;
} {
  const interpretation = interpretTechnicalFinding({ diagnostics, findings });
  const topFinding = findings.find((finding) => finding.primaryCategory === "technicalIssues") ?? findings[0];
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${profile.operationalFraming} ${interpretation.customerImpact}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: topFinding
      ? [
          buildExecutiveOpportunityText({
            title: topFinding.title,
            evidence: topFinding.evidenceSummary,
            action: topFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildTrustDeficitSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretTrustFinding({ diagnostics, findings });
  const topFinding = findings.find((finding) => finding.category === "trustSignals");
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${interpretation.customerImpact} ${profile.operationalFraming}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: topFinding
      ? [
          buildExecutiveOpportunityText({
            title: topFinding.title,
            evidence: topFinding.evidenceSummary,
            action: topFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildDiscoveryBreakdownSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretDiscoveryFinding({ diagnostics, findings });
  const discoveryFinding = findings.find((finding) => finding.category === "productDiscovery") ?? findings[0];
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${interpretation.customerImpact} ${profile.operationalFraming}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: discoveryFinding
      ? [
          buildExecutiveOpportunityText({
            title: discoveryFinding.title,
            evidence: discoveryFinding.evidenceSummary,
            action: discoveryFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildCheckoutContinuityRiskSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretOperationalFinding({ diagnostics, findings });
  const checkoutFinding = findings.find((finding) => finding.title.includes("Cart / Checkout")) ?? findings[0];
  const summary = `${profile.toneHints.headline} ${profile.operationalFraming} ${interpretation.customerImpact}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: checkoutFinding
      ? [
          buildExecutiveOpportunityText({
            title: checkoutFinding.title,
            evidence: checkoutFinding.evidenceSummary,
            action: checkoutFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildMobileClarityRiskSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretCTAFinding({ diagnostics, findings });
  const mobileFinding = findings.find((finding) => finding.title.includes("Mobile CTA")) ?? findings[0];
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${interpretation.customerImpact} ${profile.operationalFraming}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: mobileFinding
      ? [
          buildExecutiveOpportunityText({
            title: mobileFinding.title,
            evidence: mobileFinding.evidenceSummary,
            action: mobileFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildMeasurementConfidenceGapSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretTrackingFinding({ diagnostics, findings });
  const trackingFinding = findings.find((finding) => finding.primaryCategory === "trackingIssues") ?? findings[0];
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${interpretation.customerImpact} ${profile.operationalFraming}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: trackingFinding
      ? [
          buildExecutiveOpportunityText({
            title: trackingFinding.title,
            evidence: trackingFinding.evidenceSummary,
            action: trackingFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildOperationalClaritySummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretOperationalFinding({ diagnostics, findings });
  const operationalFinding = findings.find((finding) => finding.primaryCategory === "operationsIssues") ?? findings[0];
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${profile.operationalFraming} ${interpretation.customerImpact}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: operationalFinding
      ? [
          buildExecutiveOpportunityText({
            title: operationalFinding.title,
            evidence: operationalFinding.evidenceSummary,
            action: operationalFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildConversionFrictionSummary({
  profile,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore?: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const interpretation = interpretCTAFinding({ diagnostics, findings });
  const conversionFinding = findings.find((finding) => finding.primaryCategory === "conversionIssues") ?? findings[0];
  const summary = `${profile.toneHints.headline} ${interpretation.operationalConcern} ${interpretation.customerImpact} ${profile.operationalFraming}`;
  const businessInterpretation = `${interpretation.businessMeaning} ${interpretation.reviewDirection}`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: conversionFinding
      ? [
          buildExecutiveOpportunityText({
            title: conversionFinding.title,
            evidence: conversionFinding.evidenceSummary,
            action: conversionFinding.recommendedFirstAction,
          }),
        ]
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

function buildBalancedReviewSummary({
  profile,
  categories,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
}: {
  profile: NarrativeArchetypeProfile;
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
  identityProfile: StorefrontIdentityProfile;
}) {
  const trackingToolCount = diagnostics.technologyDetections.filter((tool) => tool.detected).length;
  const cartVisible = diagnostics.commerceFlowSignals.cartVisible;
  const checkoutVisible = diagnostics.commerceFlowSignals.checkoutVisible;
  const productDiscoveryVisible =
    diagnostics.storefrontSignals.productNavigationVisible ||
    diagnostics.storefrontSignals.collectionLinksVisible ||
    diagnostics.storefrontSignals.searchVisible;

  const summary = `${profile.toneHints.headline} The scan shows ${trackingToolCount} visible marketing tool${trackingToolCount === 1 ? "" : "s"}, ${cartVisible && checkoutVisible ? "a visible purchase path" : "a purchase path that still needs confirmation"}, and ${productDiscoveryVisible ? "product discovery signals" : "limited discovery signals"}. ${profile.operationalFraming}`;

  const topVisualFinding = findHighSeverityVisualUxFinding(findings);
  const topFindings = topVisualFinding
    ? [
        topVisualFinding,
        ...findings.filter((finding) => finding !== topVisualFinding).slice(0, 2),
      ]
    : findings.slice(0, 3);
  const businessInterpretation = `${profile.toneHints.interpretation} ${
    topVisualFinding
      ? `A high-priority visual UX concern is ${topVisualFinding.title.toLowerCase()}.`
      : ""
  } Review the strongest visible findings and verify them against the customer journey before making deeper recommendations.`;

  return {
    summary: sanitizeEvidenceText(summary),
    highestImpactOpportunities: topFindings.length > 0
      ? topFindings.map((finding) =>
          buildExecutiveOpportunityText({
            title: finding.title,
            evidence: finding.evidenceSummary,
            action: finding.recommendedFirstAction,
          }),
        )
      : [],
    businessInterpretation: sanitizeEvidenceText(businessInterpretation),
  };
}

const summaryBuilders: Record<
  NarrativeArchetype,
  (args: {
    profile: NarrativeArchetypeProfile;
    categories: ReturnType<typeof applyLiveDiagnosticScoring>;
    diagnostics: LiveDiagnosticsResult;
    findings: HeuristicFinding[];
    overallScore: number;
    identityProfile: StorefrontIdentityProfile;
  }) => {
    summary: string;
    highestImpactOpportunities: string[];
    businessInterpretation: string;
  }
> = {
  "technical-risk": buildTechnicalRiskSummary,
  "trust-deficit": buildTrustDeficitSummary,
  "discovery-breakdown": buildDiscoveryBreakdownSummary,
  "checkout-continuity-risk": buildCheckoutContinuityRiskSummary,
  "mobile-clarity-risk": buildMobileClarityRiskSummary,
  "measurement-confidence-gap": buildMeasurementConfidenceGapSummary,
  "operational-clarity": buildOperationalClaritySummary,
  "conversion-friction": buildConversionFrictionSummary,
  "balanced-review": buildBalancedReviewSummary,
};

function findByTitle(findings: HeuristicFinding[], title: string) {
  return findings.find((finding) => finding.title === title);
}

function hasFinding(findings: HeuristicFinding[], title: string) {
  return Boolean(findByTitle(findings, title));
}

function connectedFindingTitles(
  findings: HeuristicFinding[],
  titles: string[],
) {
  return titles.filter((title) => hasFinding(findings, title));
}

function buildConnectedInsight(findings: HeuristicFinding[]): ConnectedInsight | null {
  const mobileCta = "Mobile CTA Visibility Needs Review";
  const trust = "Trust Signal Visibility Needs Review";
  const discovery = "Product Discovery Clarity Needs Review";
  const search = "Store Search Visibility Needs Review";
  const checkout = "Cart / Checkout Path Needs Review";
  const attribution = "Marketing Attribution Visibility Appears Limited";
  const tracking = "Tracking Stack Appears Limited";
  const support = "Support or Lead Path Visibility Limited";
  const returns = "Order and Returns Communication Needs Review";

  if (hasFinding(findings, mobileCta) && hasFinding(findings, trust)) {
    return {
      title: "Mobile Purchase Confidence Gap",
      insight:
        "Mobile shoppers may see the offer before they see enough confidence-building signals to act.",
      findingTitles: connectedFindingTitles(findings, [mobileCta, trust]),
    };
  }

  if (
    (hasFinding(findings, discovery) || hasFinding(findings, search)) &&
    hasFinding(findings, checkout)
  ) {
    return {
      title: "Browse-to-Buy Continuity Gap",
      insight:
        "Customers may struggle to move from browsing to buying without a clearer product discovery and purchase path.",
      findingTitles: connectedFindingTitles(findings, [discovery, search, checkout]),
    };
  }

  if (
    (hasFinding(findings, attribution) || hasFinding(findings, tracking)) &&
    findings.some((finding) => finding.primaryCategory === "conversionIssues")
  ) {
    return {
      title: "Conversion Measurement Confidence Gap",
      insight:
        "Conversion improvements may be harder to measure until attribution visibility is cleaned up.",
      findingTitles: connectedFindingTitles(findings, [
        attribution,
        tracking,
        mobileCta,
        trust,
        checkout,
      ]),
    };
  }

  if (hasFinding(findings, discovery) && hasFinding(findings, search)) {
    return {
      title: "Product Discovery Clarity Gap",
      insight:
        "Shoppers may need extra effort to understand where products live and how to search the catalog.",
      findingTitles: connectedFindingTitles(findings, [discovery, search]),
    };
  }

  if (hasFinding(findings, mobileCta) && hasFinding(findings, discovery)) {
    return {
      title: "Mobile Decision Path Gap",
      insight:
        "The mobile path may ask shoppers to understand the catalog before the next purchase action is clear.",
      findingTitles: connectedFindingTitles(findings, [mobileCta, discovery, search]),
    };
  }

  if (
    hasFinding(findings, trust) &&
    (hasFinding(findings, support) || hasFinding(findings, returns))
  ) {
    return {
      title: "Confidence and Support Visibility Gap",
      insight:
        "Purchase confidence and post-purchase reassurance appear connected, so trust and support cues should be reviewed together.",
      findingTitles: connectedFindingTitles(findings, [trust, support, returns]),
    };
  }

  return null;
}

function buildPrimaryOperationalConcern(
  findings: HeuristicFinding[],
  connectedInsight: ConnectedInsight | null,
  profile: NarrativeArchetypeProfile,
  identityProfile: StorefrontIdentityProfile,
  narrativeProfile?: NarrativeProfile,
): PrimaryOperationalConcern | null {
  const weightedFindings = narrativeSortedFindingsForProfile(
    findings,
    profile.archetype,
    narrativeProfile,
  );
  const connectedFindings = connectedInsight
    ? connectedInsight.findingTitles
        .map((title) => findByTitle(findings, title))
        .filter((finding): finding is HeuristicFinding => Boolean(finding))
    : [];
  const leadCandidate = weightedFindings[0];
  const supportingFindings =
    connectedFindings.some((finding) => finding.title === leadCandidate?.title)
      ? narrativeSortedFindingsForProfile(connectedFindings, profile.archetype, narrativeProfile)
      : weightedFindings.slice(0, 2);

  const leadFinding = supportingFindings[0] ?? findings[0];

  if (!leadFinding) {
    return null;
  }

  const relatedTitles = supportingFindings
    .map((finding) => finding.title)
    .filter((title, index, titles) => titles.indexOf(title) === index)
    .slice(0, 4);
  const relatedPhrase =
    relatedTitles.length > 1
      ? relatedTitles.join(", ")
      : leadFinding.title;
  const concernTitle = connectedInsight?.title ?? leadFinding.title;
  const concernInsight =
    narrativeProfile
      ? narrativePrimaryConcernText(narrativeProfile)
      : connectedInsight && supportingFindings.some((finding) => connectedInsight.findingTitles.includes(finding.title))
      ? connectedInsight.insight
      : `The dominant ${profile.archetype.replace(/-/g, " ")} pattern should lead the review before secondary issues are treated as the main story.`;

  const firstAction =
    narrativeProfile?.recommendedActionStyle ||
    buildIdentityAwareFirstAction(
      leadFinding.recommendedFirstAction,
      identityProfile,
    );

  return {
    title: narrativeProfile?.concernPriority
      ? `${narrativeProfile.narrativeMode} Priority`
      : concernTitle,
    riskLabel: narrativeProfile?.concernPriority
      ? narrativeProfile.concernPriority
      : concernTitle,
    severity: leadFinding.severity,
    confidence: leadFinding.confidence,
    explanation: `${concernInsight} Supporting findings: ${relatedPhrase}. Addressing this first should clarify the ${narrativeProfile?.narrativeMode.toLowerCase() ?? "customer journey"} before lower-impact refinements are prioritized.`,
    evidenceSummary: sanitizeEvidenceText(
      supportingFindings
        .map((finding) => finding.evidenceSummary)
        .slice(0, 2)
        .join(" "),
    ),
    recommendedFirstAction: sanitizeEvidenceText(
      `${firstAction} Then confirm the related ${relatedTitles.length > 1 ? "signals" : "signal"} in the same ${narrativeProfile?.narrativeMode.toLowerCase() ?? "journey"} walkthrough.`,
      { maxLength: 240 },
    ),
    supportingFindings: relatedTitles,
  };
}

function narrativePrimaryConcernText(profile: NarrativeProfile) {
  switch (profile.narrativeMode) {
    case "Enterprise Retail":
      return "The primary concern is whether the public scan exposes enough reliable platform and measurement evidence to support optimization decisions at enterprise scale.";
    case "Grocery / Supermarket Retail":
      return "The primary concern is whether shoppers can quickly move from grocery intent into the right path: search, departments, weekly ad, pickup/delivery, store location, or cart. Platform uncertainty matters internally, but the customer-facing review should focus first on how easily shoppers can find and act.";
    case "B2B Commerce":
      return "The primary concern is whether business buyers can move from product/category discovery to quote, account, or procurement action without friction.";
    case "Education Commerce":
      return "The primary concern is whether learners or buyers can clearly move from course/catalog discovery into the right account, enrollment, or purchase path.";
    case "Lead Generation / Service Business":
      return "The primary concern is whether the page builds enough trust and clarity to move visitors into a contact or consultation request.";
    case "Non-Ecommerce / Unclear":
      return "The primary concern is whether this submitted URL is the right commerce entry point or primarily an informational, account-driven, or lead-generation page.";
    case "Marketplace":
      return "The primary concern is whether buyers, sellers, and account paths have enough discovery and trust clarity to support confident transactions.";
    case "Subscription Commerce":
      return "The primary concern is whether visitors understand the plan, recurring value, trust cues, and commitment terms before subscribing.";
    case "Healthcare Commerce":
      return "The primary concern is whether product clarity, support access, and reassurance are strong enough for a healthcare-sensitive purchase path.";
    case "DTC Brand":
    default:
      return "The primary concern is whether the brand-owned shopping path maintains enough mobile clarity, trust, product story, and purchase momentum.";
  }
}

function conciseFindingSentence(finding: HeuristicFinding | undefined) {
  if (!finding) {
    return "The next useful step is to manually walk the visible journey before assigning platform-specific fixes.";
  }

  return `${finding.title} should be reviewed first because ${finding.businessImpact.toLowerCase()}`;
}

function secondaryFindingSentence(findings: HeuristicFinding[]) {
  if (findings.length === 0) {
    return "";
  }

  return `Other visible signals to validate are ${findings
    .map((finding) => finding.title.toLowerCase())
    .join(", ")}.`;
}

function platformNarrativeContext(diagnostics: LiveDiagnosticsResult) {
  if (platformNeedsManualReview(diagnostics)) {
    return "Platform-specific recommendations should wait until a manual review confirms the commerce architecture.";
  }

  return `${diagnostics.platformDetection.name} evidence is visible enough to support a platform-aware review, while still needing human confirmation before implementation work.`;
}

function trackingNarrativeContext(diagnostics: LiveDiagnosticsResult) {
  const marketingTools = visibleMarketingTools(diagnostics);

  if (marketingTools.length === 0) {
    return "Measurement visibility should also be checked, because public tracking evidence is limited in the loaded page.";
  }

  return `The scan saw ${marketingTools.length} supported marketing signal${marketingTools.length === 1 ? "" : "s"}, so measurement should be validated against the actual conversion or lead events.`;
}

function buildEcommerceStorefrontNarrative({
  diagnostics,
  priorityFindings,
  identityProfile,
  profile,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
  identityProfile: StorefrontIdentityProfile;
  profile: NarrativeArchetypeProfile;
}) {
  const leadFinding = priorityFindings[0];

  return [
    identityProfile.identityOpening ||
      "This page exposes enough ecommerce signals to review it as a storefront journey.",
    "The story should stay close to the customer path: discovery, primary action, cart or checkout readiness, trust, and measurement.",
    conciseFindingSentence(leadFinding),
    secondaryFindingSentence(priorityFindings.slice(1, 3)),
    profile.operationalFraming,
    trackingNarrativeContext(diagnostics),
  ].filter(Boolean).join(" ");
}

function buildEnterpriseRetailNarrative({
  diagnostics,
  priorityFindings,
  reviewContext,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
  reviewContext: StorefrontReviewContext;
}) {
  return [
    "This looks less like a standard plug-and-play storefront scan and more like a public view into an enterprise commerce environment.",
    "The main story is visibility: platform, catalog, cart, checkout, and measurement details may be hidden behind custom services, account flows, regional routing, or abstracted frontend architecture.",
    conciseFindingSentence(priorityFindings[0]),
    secondaryFindingSentence(priorityFindings.slice(1, 3)),
    reviewContext.reason,
    platformNarrativeContext(diagnostics),
  ].filter(Boolean).join(" ");
}

function buildCatalogCommerceNarrative({
  diagnostics,
  priorityFindings,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
}) {
  return [
    "This scan is best read as a catalog-commerce review, not a full checkout-flow review.",
    "The useful question is whether shoppers can understand the category structure, search or browse products, and find the next commercial step without extra effort.",
    conciseFindingSentence(priorityFindings[0]),
    secondaryFindingSentence(priorityFindings.slice(1, 3)),
    "Cart and checkout conclusions should stay conservative until the buying path is confirmed from the correct product or transaction URL.",
    trackingNarrativeContext(diagnostics),
  ].filter(Boolean).join(" ");
}

function buildLeadGenerationNarrative({
  diagnostics,
  priorityFindings,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
}) {
  return [
    "This page behaves more like a lead-generation or enquiry path than a retail checkout path.",
    "The review should focus on whether the CTA is clear, whether trust signals support the decision, and whether the handoff after form or contact intent is operationally clean.",
    conciseFindingSentence(priorityFindings[0]),
    secondaryFindingSentence(priorityFindings.slice(1, 3)),
    "Cart or checkout absence should not be treated as a failure unless this URL is meant to sell directly.",
    trackingNarrativeContext(diagnostics),
  ].filter(Boolean).join(" ");
}

function buildEducationContentNarrative({
  diagnostics,
  priorityFindings,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
}) {
  return [
    "This page appears to sit inside an education, course, account, or content journey rather than a straightforward retail checkout flow.",
    "The story should focus on learning-path clarity, account or course access, catalogue discovery, and whether ecommerce checkout is actually the right expectation for this URL.",
    conciseFindingSentence(priorityFindings[0]),
    secondaryFindingSentence(priorityFindings.slice(1, 3)),
    "A manual review should confirm whether users are meant to browse content, log in, request access, or move into a separate payment flow.",
    trackingNarrativeContext(diagnostics),
  ].filter(Boolean).join(" ");
}

function buildNonEcommerceNarrative({
  reviewContext,
}: {
  reviewContext: StorefrontReviewContext;
}) {
  return [
    "This page does not expose enough public ecommerce flow to treat it like a standard storefront.",
    "The review should focus on whether this URL is the right commerce entry point, whether the buying path lives elsewhere, or whether the site is primarily informational, lead-generation, or account-driven.",
    reviewContext.reason,
    reviewContext.supportingSignals.length > 0
      ? `Visible context: ${reviewContext.supportingSignals.join(" ")}`
      : "",
  ].filter(Boolean).join(" ");
}

function buildSiteTypeAuditNarrative({
  diagnostics,
  priorityFindings,
  connectedInsight,
  identityProfile,
  profile,
  reviewContext,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
  connectedInsight: ConnectedInsight | null;
  identityProfile: StorefrontIdentityProfile;
  profile: NarrativeArchetypeProfile;
  reviewContext: StorefrontReviewContext;
}) {
  const narrative =
    reviewContext.siteType === "non-ecommerce-or-unclear"
      ? buildNonEcommerceNarrative({ reviewContext })
      : reviewContext.siteType === "enterprise-retail" || reviewContext.siteType === "custom-enterprise"
        ? buildEnterpriseRetailNarrative({ diagnostics, priorityFindings, reviewContext })
        : reviewContext.siteType === "catalog-commerce"
          ? buildCatalogCommerceNarrative({ diagnostics, priorityFindings })
          : reviewContext.siteType === "lead-generation"
            ? buildLeadGenerationNarrative({ diagnostics, priorityFindings })
            : reviewContext.siteType === "education/content-commerce"
              ? buildEducationContentNarrative({ diagnostics, priorityFindings })
              : buildEcommerceStorefrontNarrative({
                  diagnostics,
                  priorityFindings,
                  identityProfile,
                  profile,
                });

  return connectedInsight?.insight && reviewContext.siteType === "ecommerce-storefront"
    ? `${narrative} ${connectedInsight.insight}`
    : narrative;
}

function buildProfileAuditNarrative({
  diagnostics,
  priorityFindings,
  connectedInsight,
  narrativeProfile,
}: {
  diagnostics: LiveDiagnosticsResult;
  priorityFindings: HeuristicFinding[];
  connectedInsight: ConnectedInsight | null;
  narrativeProfile: NarrativeProfile;
}) {
  const leadFinding = priorityFindings[0];
  const secondary = secondaryFindingSentence(priorityFindings.slice(1, 3));
  const ecommerceLow = narrativeProfile.ecommerceProbability.label === "Low";
  const ecommerceUnclear =
    narrativeProfile.ecommerceProbability.label === "Unclear" ||
    narrativeProfile.ecommerceProbability.label === "Moderate";
  const platformUncertain =
    /low|needs review|unknown/i.test(narrativeProfile.platformConfidence.label) ||
    [
      "Enterprise / Custom Commerce Stack",
      "Platform not confidently identified",
      "Not an ecommerce storefront",
      "Ecommerce probability unclear",
      "Unknown",
    ].includes(narrativeProfile.platformConfidence.platformName);
  const leadSentence = leadFinding
    ? conciseFindingSentence(leadFinding)
    : "The first useful review is to validate the visible user journey before assigning implementation fixes.";
  const probabilitySentence = ecommerceLow
    ? "Because ecommerce probability is low, missing cart or checkout evidence should be treated as a context signal, not a storefront failure."
    : ecommerceUnclear
      ? "Because ecommerce probability is not fully settled from this URL, the scan should stay cautious about purchase-flow assumptions."
      : "Because ecommerce probability is high enough, the visible commercial journey can be reviewed as a meaningful public signal.";
  const platformSentence = platformUncertain
    ? "Platform uncertainty matters here because implementation advice can change once the actual commerce architecture is confirmed."
    : "";
  const connectedSentence =
    connectedInsight && narrativeProfile.narrativeMode === "DTC Brand"
      ? connectedInsight.insight
      : "";

  return sanitizeEvidenceText(
    [
      narrativeProfile.narrativeOpening,
      `For this ${narrativeProfile.businessModel.toLowerCase()}, the business risk centers on ${narrativeProfile.concernPriority}.`,
      probabilitySentence,
      leadSentence,
      secondary,
      platformSentence,
      trackingNarrativeContext(diagnostics),
      connectedSentence,
    ]
      .filter(Boolean)
      .join(" "),
    { maxLength: 900 },
  );
}

function assertNarrativeSpecificity({
  narrative,
  reviewContext,
}: {
  narrative: string;
  reviewContext: StorefrontReviewContext;
}) {
  const genericTemplatePattern =
    /lead issue for this|secondary issues to keep in view/i;
  const ecommerceFlowPattern = /checkout|cart|purchase path|storefront journey/i;

  if (genericTemplatePattern.test(narrative)) {
    return reviewContext.siteType === "non-ecommerce-or-unclear"
      ? buildNonEcommerceNarrative({ reviewContext })
      : narrative.replace(genericTemplatePattern, "").trim();
  }

  if (
    (reviewContext.siteType === "non-ecommerce-or-unclear" ||
      reviewContext.siteType === "lead-generation") &&
    ecommerceFlowPattern.test(narrative)
  ) {
    return reviewContext.siteType === "lead-generation"
      ? [
          "This page behaves more like a lead-generation or enquiry path than a retail checkout path.",
          "The review should focus on CTA clarity, trust cues, contact flow, and the handoff after a visitor shows intent.",
          reviewContext.reason,
        ].filter(Boolean).join(" ")
      : buildNonEcommerceNarrative({ reviewContext });
  }

  return narrative;
}

function buildAuditNarrative({
  categories,
  diagnostics,
  findings,
  overallScore,
  connectedInsight,
  identityProfile,
  reviewContext,
  narrativeProfile,
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
  connectedInsight: ConnectedInsight | null;
  identityProfile: StorefrontIdentityProfile;
  reviewContext: StorefrontReviewContext;
  narrativeProfile?: NarrativeProfile;
}) {
  const profile = resolveNarrativeArchetype({ categories, diagnostics, findings });
  const priorityFindings = narrativeSortedFindingsForProfile(
    findings,
    profile.archetype,
    narrativeProfile,
  ).slice(0, 4);
  if (narrativeProfile) {
    return assertNarrativeSpecificity({
      narrative: buildProfileAuditNarrative({
        diagnostics,
        priorityFindings,
        connectedInsight,
        narrativeProfile,
      }),
      reviewContext,
    });
  }

  const narrative = buildSiteTypeAuditNarrative({
    diagnostics,
    priorityFindings,
    connectedInsight,
    identityProfile,
    profile,
    reviewContext,
  });

  const framedNarrative = `${profile.toneHints.opening} ${profile.toneHints.interpretation} ${narrative}`.trim();

  return sanitizeEvidenceText(
    assertNarrativeSpecificity({ narrative: framedNarrative, reviewContext }),
    { maxLength: 850 },
  );
}

function findCategory(
  categories: ReturnType<typeof applyLiveDiagnosticScoring>,
  key: string,
) {
  return categories.find((category) => category.key === key) ?? categories[0];
}

function buildTopPriorityRisks(
  findings: HeuristicFinding[],
  categories: ReturnType<typeof applyLiveDiagnosticScoring>,
  profile: NarrativeArchetypeProfile,
  narrativeProfile?: NarrativeProfile,
) {
  const weightedFindings = narrativeSortedFindingsForProfile(
    findings,
    profile.archetype,
    narrativeProfile,
  );
  const topVisualFinding = findHighSeverityVisualUxFinding(weightedFindings);
  const priorityFindings = topVisualFinding
    ? [
        topVisualFinding,
        ...weightedFindings.filter((finding) => finding !== topVisualFinding).slice(0, 2),
      ]
    : weightedFindings.slice(0, 3);

  if (priorityFindings.length > 0) {
    return priorityFindings.map((finding) => ({
      title: finding.title,
      riskLabel: finding.title,
      severity: finding.severity,
      confidence: finding.confidence,
      explanation: finding.businessImpact,
      evidenceSummary: finding.evidenceSummary,
      recommendedFirstAction: finding.recommendedFirstAction,
    }));
  }

  return categories
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((category) => ({
      title: "Manual Journey Review",
      riskLabel:
        category.key === "technicalIssues"
          ? "Technical Signal Evidence Needs Manual Confirmation"
          : category.key === "conversionIssues"
            ? "Conversion Evidence Needs Manual Confirmation"
            : category.key === "trackingIssues"
              ? "Tracking Evidence Needs Manual Confirmation"
              : category.key === "operationsIssues"
                ? "Checkout and Operations Evidence Needs Manual Confirmation"
                : "UX/UI Evidence Needs Manual Confirmation",
      severity: category.status,
      confidence: "Needs Review",
      explanation:
        "No high-impact public-page heuristic finding was detected, so this area should be manually confirmed in context.",
      evidenceSummary:
        "The lightweight scan did not find a specific issue with enough evidence to escalate.",
      recommendedFirstAction:
        "Walk the visible customer journey from homepage to product discovery, cart or lead path, and support before making platform-specific recommendations.",
    }));
}

function buildRecommendedNextSteps(
  findings: HeuristicFinding[],
  profile: NarrativeArchetypeProfile,
  narrativeProfile?: NarrativeProfile,
) {
  const firstStep = narrativeProfile
    ? {
        title: `${narrativeProfile.narrativeMode} Journey Confirmation`,
        evidenceClue: narrativeProfile.narrativeProfileSummary,
        action: narrativeProfile.recommendedActionStyle,
        why: `This scan is framed as ${narrativeProfile.businessContext}, so the first action should validate the right journey before narrower fixes.`,
      }
    : null;

  if (findings.length === 0) {
    return [
      firstStep ?? {
        title: "Manual Customer Journey Confirmation",
        evidenceClue:
          "No single high-impact public-page issue crossed the scanner threshold.",
        action:
          "Manually review the homepage, product discovery path, cart, checkout, and support links.",
        why: "The public-page heuristics did not surface a high-impact issue, so manual journey confirmation is the safest next step.",
      },
    ];
  }

  const sortedFindings = narrativeSortedFindingsForProfile(
    findings,
    profile.archetype,
    narrativeProfile,
  );
  const selected: HeuristicFinding[] = [];
  const addFirstMatch = (predicate: (finding: HeuristicFinding) => boolean) => {
    const match = sortedFindings.find(
      (finding) => !selected.includes(finding) && predicate(finding),
    );

    if (match) {
      selected.push(match);
    }
  };

  const affinity = archetypeAffinity[profile.archetype];
  addFirstMatch(
    (finding) =>
      affinity.findingCategories.includes(finding.category) ||
      affinity.primaryCategories.includes(finding.primaryCategory),
  );
  addFirstMatch((finding) =>
    (finding.secondaryCategories ?? []).some((category) =>
      affinity.primaryCategories.includes(category),
    ),
  );

  const topVisualFinding = findHighSeverityVisualUxFinding(sortedFindings);
  if (topVisualFinding && !selected.includes(topVisualFinding)) {
    selected.push(topVisualFinding);
  }

  for (const finding of sortedFindings) {
    if (selected.length >= 3) {
      break;
    }

    if (!selected.includes(finding)) {
      selected.push(finding);
    }
  }

  const findingSteps = selected.slice(0, firstStep ? 2 : 3).map((finding) => ({
    title: finding.title,
    evidenceClue: finding.evidenceSummary,
    action: finding.recommendedFirstAction,
    why: finding.businessImpact,
  }));

  return firstStep ? [firstStep, ...findingSteps] : findingSteps;
}

function pushUnique(items: string[], item: string) {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function benchmarkLabelForPercentile(
  percentile: number,
  scoringConfidence: ScoringConfidence,
): BenchmarkContext["benchmarkLabel"] {
  if (scoringConfidence === "Low") return "Insufficient Data";
  if (percentile >= 85) return "Top Tier";
  if (percentile >= 70) return "Above Average";
  if (percentile >= 55) return "Average";
  if (percentile >= 40) return "Below Average";
  return "Needs Work";
}

function benchmarkGroupForScan({
  diagnostics,
  siteClassification,
  reviewContext,
}: {
  diagnostics: LiveDiagnosticsResult;
  siteClassification: SiteClassification;
  reviewContext: StorefrontReviewContext;
}) {
  const combined = `${siteClassification.siteType} ${reviewContext.siteType} ${diagnostics.platformDetection.platformName}`.toLowerCase();
  const url = diagnostics.finalUrl.toLowerCase();
  const host = safeHost(diagnostics.finalUrl);
  const healthcareCorpus = [
    combined,
    url,
    diagnostics.title,
    diagnostics.metaDescription,
    diagnostics.desktopVisualMetrics?.visibleTextSample,
    diagnostics.mobileVisualMetrics?.visibleTextSample,
    diagnostics.fullPageDomSignals.ctaLabels.join(" "),
    diagnostics.fullPageDomSignals.productLinks.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (reviewContext.siteType === "non-ecommerce-or-unclear") {
    return "General Web Conversion";
  }

  if (
    isNonStorefrontClassification(siteClassification.siteType) ||
    reviewContext.siteType === "lead-generation"
  ) {
    return "Local Service / Lead Generation";
  }

  if (
    domainMatches(host, knownHealthcareCommerceDomains) ||
    /healthcare commerce|pharmacy|prescription|rx|clinic|patient|otc|medication|cvs|walgreens|riteaid|healthwarehouse/i.test(
      healthcareCorpus,
    )
  ) {
    return "Healthcare Commerce / Pharmacy Retail";
  }

  if (/grainger|uline|supply|industrial|b2b|parts|wholesale/i.test(combined + " " + url)) {
    return "Industrial B2B / Catalog Commerce";
  }

  if (/amazon|walmart|target|marketplace|enterprise/i.test(combined + " " + url)) {
    return "Enterprise Retail / Marketplace";
  }

  if (/education|course|training|content/i.test(combined)) {
    return "Education / Content Commerce";
  }

  if (/shopify|dtc|brand|woocommerce|bigcommerce/i.test(combined)) {
    return "DTC Brand / Specialty Store";
  }

  return "General Web Conversion";
}

function percentileFromScore({
  overallScore,
  visualUxDiagnostics,
  scoringConfidence,
}: {
  overallScore: number;
  visualUxDiagnostics: VisualUxDiagnosticsResult;
  scoringConfidence: ScoringConfidence;
}) {
  if (scoringConfidence === "Low") {
    return Math.max(30, Math.min(60, Math.round(overallScore * 0.7)));
  }

  const visualScore = usableVisualUxScore(visualUxDiagnostics);
  const blended =
    visualScore === null
      ? overallScore
      : Math.round(overallScore * 0.72 + visualScore * 0.28);

  return Math.max(5, Math.min(95, blended));
}

function detectSubmittedPageType({
  diagnostics,
  siteClassification,
}: {
  diagnostics: LiveDiagnosticsResult;
  siteClassification: SiteClassification;
}): PageTypeDetection {
  const finalUrl = diagnostics.finalUrl || "";
  const path = (() => {
    try {
      return new URL(finalUrl).pathname.toLowerCase();
    } catch {
      return finalUrl.toLowerCase();
    }
  })();
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const text = [
    diagnostics.title,
    diagnostics.metaDescription,
    diagnostics.desktopVisualMetrics?.visibleTextSample,
    diagnostics.mobileVisualMetrics?.visibleTextSample,
    ...commerce.ctaLabels,
    ...fullPage.ctaLabels,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const evidence: string[] = [];
  let submittedPageType: PageTypeDetection["submittedPageType"] = "Unknown";
  let confidence = 48;
  const isRootPath = path === "/" || path === "" || path === "/home";
  const isCartOrCheckoutPath = /\/(cart|checkout|basket|bag)(\/|$)/i.test(path);

  if (isNonStorefrontClassification(siteClassification.siteType)) {
    submittedPageType = "Unknown";
    confidence = 42;
    evidence.push("The site classification is unclear or non-ecommerce, so page type needs manual confirmation.");
  } else if (isRootPath) {
    submittedPageType = "Homepage";
    confidence = 80;
    evidence.push("Submitted URL resolves to the root/home path.");
  } else if (isCartOrCheckoutPath) {
    submittedPageType = "Cart / Checkout";
    confidence = 82;
    evidence.push("Submitted URL path is a cart, basket, bag, or checkout path.");
  } else if (
    /\/(products?|p|item|sku)\//i.test(path) ||
    (fullPage.productCardCount <= 2 && /add to cart|buy now|quantity|sku|variant/i.test(text))
  ) {
    submittedPageType = "Product Detail Page";
    confidence = 78;
    evidence.push("Product-detail language or URL structure was detected.");
  } else if (
    /\/(collections?|category|catalog|shop|store|products)(\/|$)/i.test(path) ||
    fullPage.productCardCount >= 6 ||
    fullPage.productLinks.length >= 6
  ) {
    submittedPageType = "Collection / Category Page";
    confidence = 76;
    evidence.push("Collection/catalog URL or multiple product links/cards were detected.");
  } else if (
    isNonStorefrontClassification(siteClassification.siteType) ||
    (/contact|quote|estimate|consult|book|schedule|service/i.test(text) &&
      !commerce.productCatalogVisible)
  ) {
    submittedPageType = "Lead Capture / Service Page";
    confidence = 74;
    evidence.push("Lead, service, form, or contact-oriented signals were stronger than product purchase signals.");
  } else if (/\/(blog|article|guide|resources|learn|news)\//i.test(path)) {
    submittedPageType = "Content / Article Page";
    confidence = 78;
    evidence.push("Content URL pattern was detected.");
  } else if (/\/(landing|lp|offer|promo)\//i.test(path)) {
    submittedPageType = "Landing Page";
    confidence = 70;
    evidence.push("Landing or campaign URL pattern was detected.");
  }

  if (commerce.checkoutVisible && submittedPageType !== "Cart / Checkout") {
    evidence.push("Checkout signals exist in page assets or DOM, but the submitted URL is not a checkout page.");
  }

  if (commerce.formVisible && submittedPageType !== "Lead Capture / Service Page") {
    evidence.push("A form is visible and may influence conversion-path scoring.");
  }

  if (fullPage.visibleLinkCount === 0) {
    confidence = Math.min(confidence, 45);
    evidence.push("Full-page DOM link extraction returned zero links, lowering page-type confidence.");
  }

  return {
    submittedPageType,
    confidence,
    evidence: evidence.slice(0, 5),
    scoringNote:
      submittedPageType === "Homepage"
        ? "Homepage scoring emphasizes first impression, navigation clarity, primary CTA visibility, and early discovery signals."
        : submittedPageType === "Lead Capture / Service Page"
          ? "Lead/service scoring emphasizes offer clarity, trust, form/contact paths, and service intent instead of ecommerce cart assumptions."
          : submittedPageType === "Product Detail Page"
            ? "Product-detail scoring emphasizes product confidence, purchase CTA clarity, trust, shipping/returns, and variant/order evidence."
            : submittedPageType === "Collection / Category Page"
              ? "Collection scoring emphasizes product discovery, filtering/search visibility, merchandising clarity, and path-to-product momentum."
              : "This page type is directional; the score should be interpreted with the submitted URL's page purpose in mind.",
  };
}

function buildCompetitiveComparison({
  benchmarkContext,
  pageType,
}: {
  benchmarkContext: BenchmarkContext;
  pageType: PageTypeDetection;
}): CompetitiveComparison {
  const group = benchmarkContext.benchmarkGroup;
  const comparisonSet =
    group === "Enterprise Retail / Marketplace"
      ? ["Amazon", "Walmart", "Target", "Best Buy"]
      : group === "Healthcare Commerce / Pharmacy Retail"
        ? ["CVS", "Walgreens", "Rite Aid", "HealthWarehouse"]
      : group === "Industrial B2B / Catalog Commerce"
        ? ["Grainger", "Uline", "McMaster-Carr", "Fastenal"]
        : group === "Local Service / Lead Generation"
          ? ["High-performing local service sites", "Booking-focused service pages", "Quote-request competitors"]
          : group === "DTC Brand / Specialty Store"
            ? ["Shopify Plus brand stores", "Specialty DTC competitors", "Category leaders"]
            : ["Comparable public websites in the same conversion context"];
  const expectedPatterns =
    pageType.submittedPageType === "Lead Capture / Service Page"
      ? [
          "Clear service positioning above the fold.",
          "Visible contact, quote, booking, or consultation path.",
          "Trust proof near the primary action.",
        ]
      : [
          "Fast path from first impression to discovery or action.",
          "Visible trust and reassurance before commitment.",
          "Clear tracking and operational signals for follow-up confidence.",
        ];

  return {
    comparisonSet,
    expectedPatterns,
    strengths: benchmarkContext.strengthsVsBenchmark.slice(0, 3),
    weaknesses: benchmarkContext.weaknessesVsBenchmark.slice(0, 3),
    explanation: `Use ${group} as the primary comparison set for this ${pageType.submittedPageType.toLowerCase()} scan. The comparison is directional and based on visible public-page evidence, not private analytics or revenue data.`,
  };
}

function revenueRiskAreaForFinding(finding: HeuristicFinding): RevenueImpactEstimate["riskArea"] {
  const text = `${finding.title} ${finding.category} ${finding.businessImpact}`.toLowerCase();
  if (/tracking|analytics|attribution|pixel|tag/.test(text)) return "Tracking";
  if (/trust|review|policy|shipping|return|warranty|reassurance/.test(text)) return "Trust";
  if (/support|contact|operation|fulfillment|order|account/.test(text)) return "Operations";
  if (/lead|form|quote|booking|contact/.test(text)) return "Lead Quality";
  if (/aov|bundle|upsell|cross-sell|merchandising|promotion/.test(text)) return "Average Order Value";
  if (/mobile|cta|checkout|cart|conversion|buy/.test(text)) return "Conversion";
  return "Engagement";
}

function estimateRevenueImpactForFinding(
  finding: HeuristicFinding,
): RevenueImpactEstimate {
  const riskArea = revenueRiskAreaForFinding(finding);
  const likelyImpact =
    riskArea === "Conversion"
      ? "May reduce the share of visitors who progress from interest to action."
      : riskArea === "Average Order Value"
        ? "May limit merchandising, bundling, or product-comparison opportunities that raise order value."
        : riskArea === "Lead Quality"
          ? "May reduce qualified inquiries or make intent harder to route."
          : riskArea === "Trust"
            ? "May increase hesitation before purchase, quote request, booking, or contact."
            : riskArea === "Tracking"
              ? "May make revenue attribution and follow-up performance harder to validate."
              : riskArea === "Operations"
                ? "May create support load, order uncertainty, or fulfillment friction."
                : "May reduce engagement before visitors reach a decisive action.";

  return {
    findingTitle: finding.title,
    riskArea,
    likelyImpact,
    severity: finding.severity,
    confidence: finding.confidence,
    explanation: `${finding.businessImpact} ${likelyImpact}`,
  };
}

function buildRevenueImpactSummary(
  findings: HeuristicFinding[],
): RevenueImpactSummary {
  const estimates = findings
    .slice()
    .sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity))
    .slice(0, 6)
    .map(estimateRevenueImpactForFinding);
  const revenueRiskAreas = Array.from(
    new Set(estimates.map((estimate) => estimate.riskArea)),
  );

  return {
    summary:
      estimates.length > 0
        ? "Revenue impact is estimated directionally from the finding type, severity, and visible public-page evidence. It does not use private analytics or claim a precise dollar value."
        : "No specific revenue-impact estimates were generated because the scan did not surface enough prioritized findings.",
    estimates,
    revenueRiskAreas,
  };
}

function roadmapTextForStep(step: RecommendationRoadmapInputStep) {
  return `${step.title} ${step.action} ${step.why}`.toLowerCase();
}

function roadmapStepCommercialModel({
  text,
  stepNumber,
  siteType,
  benchmarkGroup,
}: {
  text: string;
  stepNumber: number;
  siteType: string;
  benchmarkGroup: string;
}) {
  const context = `${text} ${siteType} ${benchmarkGroup}`.toLowerCase();
  const isEnterprise = /enterprise|marketplace|custom/.test(context);
  const isB2b = /b2b|industrial|catalog|distributor|procurement|quote|sku/.test(context);

  if (/trust|review|policy|shipping|return|warranty|reassurance/.test(context)) {
    return {
      cost: "$500-$2,000",
      timeline: "1-2 weeks",
      roiRationale:
        "Trust work is usually a smaller lift and can reduce hesitation near the buying path quickly.",
    };
  }

  if (/mobile|hierarchy|cta|above.fold|first screen/.test(context)) {
    return {
      cost: "$1,000-$4,000",
      timeline: "1-3 weeks",
      roiRationale:
        "Mobile hierarchy work is usually high leverage because many visitors decide whether to continue from the first screen.",
    };
  }

  if (/search|filter|navigation|category|collection/.test(context)) {
    return {
      cost: isEnterprise ? "$5,000-$15,000" : "$1,000-$3,000",
      timeline: isEnterprise ? "4-8 weeks" : "1-3 weeks",
      roiRationale:
        "Search and navigation improvements usually pay off when customers already have product intent but need a faster path.",
    };
  }

  if (/product discovery|catalog|sku|specification|product detail/.test(context)) {
    return {
      cost: isB2b ? "$2,000-$5,000" : "$1,500-$4,000",
      timeline: "2-4 weeks",
      roiRationale:
        "Discovery validation has strong ROI because it confirms where buyers lose momentum before deeper redesign work starts.",
    };
  }

  if (/tracking|analytics|attribution|pixel|tag/.test(context)) {
    return {
      cost: "$1,000-$3,000",
      timeline: "1-3 weeks",
      roiRationale:
        "Measurement fixes improve ROI confidence by showing which changes actually affect conversion or lead quality.",
    };
  }

  return {
    cost: stepNumber === 1 ? "$1,000-$3,000" : "$1,000-$4,000",
    timeline: stepNumber === 1 ? "1-3 weeks" : "2-4 weeks",
    roiRationale:
      "This is sized as a focused improvement step, not a full redesign or platform rebuild.",
  };
}

function roadmapValidationTarget(text: string) {
  const normalized = text.toLowerCase();

  if (/grocery|supermarket|pickup|delivery|department/.test(normalized)) {
    return "Search usage, department navigation, pickup or delivery entry, cart continuation, and mobile first-screen behavior.";
  }

  if (/catalog|product|category|sku|specification|search|navigation/.test(normalized)) {
    return "Category -> Product -> Cart or Quote -> Checkout, including where buyers search again, loop back, or hesitate.";
  }

  if (/trust|review|policy|shipping|return|support|contact/.test(normalized)) {
    return "Trust proof near the buying path, shipping or returns clarity, contact access, and buyer confidence before action.";
  }

  if (/mobile|cta|hierarchy|first screen/.test(normalized)) {
    return "Mobile first-screen clarity, primary CTA visibility, scroll depth, and whether the next step is obvious.";
  }

  if (/tracking|analytics|attribution/.test(normalized)) {
    return "Analytics coverage, conversion events, lead or cart events, attribution, and whether performance can be measured.";
  }

  return "The visible journey from first impression to commercial action, including where customers hesitate or lose confidence.";
}

function normalizeRoadmapTitle(title: string, action: string, stepNumber: number) {
  return title.trim() || action.trim() || `Roadmap Step ${stepNumber}`;
}

function fallbackRoadmapSteps({
  siteType,
  benchmarkGroup,
}: {
  siteType: string;
  benchmarkGroup: string;
}): RecommendationRoadmapInputStep[] {
  const context = `${siteType} ${benchmarkGroup}`.toLowerCase();

  if (/b2b|industrial|catalog|distributor/.test(context)) {
    return [
      {
        title: "Validate Product Discovery",
        action:
          "Walk the buyer journey from category discovery to product detail, cart or quote, and checkout.",
        why:
          "B2B buyers need to find the right product, SKU, or specification before trust and checkout improvements can pay off.",
      },
      {
        title: "Store Search Visibility",
        action:
          "Move search, category filters, and key product groups into a clearer early browsing path.",
        why:
          "Search and category clarity reduce loops for buyers who already know what they need.",
      },
      {
        title: "Mobile Content Hierarchy",
        action:
          "Reduce first-screen crowding and make product discovery, search, and the primary action easier to see on mobile.",
        why:
          "Mobile buyers need a clear first-screen path before they scroll into catalog detail.",
      },
      {
        title: "Trust / Specification Access",
        action:
          "Place trust proof, shipping or returns details, support access, certifications, and technical specifications closer to product decisions.",
        why:
          "B2B buyers often need confidence and specification access before cart, quote, or procurement handoff.",
      },
      {
        title: "Measurement Validation",
        action:
          "Confirm analytics coverage for search usage, category engagement, quote starts, cart starts, account login, and checkout or procurement handoff.",
        why:
          "Measurement validation shows whether the roadmap steps are improving buyer behavior instead of only changing the page visually.",
      },
    ];
  }

  return [
    {
      title: "Validate Primary Customer Path",
      action:
        "Walk the journey from first impression to product or service decision and primary action.",
      why:
        "This confirms the highest-impact friction before design or platform work expands.",
    },
    {
      title: "Fix the Confirmed Constraint",
      action:
        "Apply the smallest UX, content, trust, or measurement change that removes the validated friction.",
      why:
        "Focused fixes usually produce better ROI than broad redesign work before the issue is confirmed.",
    },
    {
      title: "Strengthen Trust Signals",
      action:
        "Move reassurance, support, policy, or proof points closer to the decision point.",
      why:
        "Trust proof can improve confidence without requiring a full rebuild.",
    },
    {
      title: "Confirm Impact",
      action:
        "Review analytics, conversion events, and the next score reducer after the first change ships.",
      why:
        "The next priority should come from observed behavior, not only from a static scan.",
    },
    {
      title: "Improve Mobile Hierarchy",
      action:
        "Make the primary action and decision path clearer in the first mobile viewport.",
      why:
        "Mobile hierarchy improvements can lift clarity without requiring a full redesign.",
    },
    {
      title: "Measurement Validation",
      action:
        "Confirm analytics, conversion events, and follow-up tracking before expanding the project.",
      why:
        "Measurement validation keeps later roadmap decisions tied to observed behavior.",
    },
  ];
}

function buildRecommendationRoadmap({
  scanId,
  website,
  siteType,
  benchmarkGroup,
  overallScore,
  recommendedNextSteps,
  revenueImpactSummary,
}: {
  scanId: string;
  website: string;
  siteType: string;
  benchmarkGroup: string;
  overallScore: number;
  recommendedNextSteps: RecommendationRoadmapInputStep[];
  revenueImpactSummary: RevenueImpactSummary;
}): RecommendationRoadmap {
  const baseSteps = [
    ...recommendedNextSteps,
    ...fallbackRoadmapSteps({ siteType, benchmarkGroup }),
  ];
  const dedupedSteps: typeof baseSteps = [];

  for (const step of baseSteps) {
    const normalizedTitle = normalizeRoadmapTitle(step.title, step.action, dedupedSteps.length + 1);
    if (
      dedupedSteps.some((existing) =>
        normalizeRoadmapTitle(existing.title, existing.action, 1).toLowerCase() ===
        normalizedTitle.toLowerCase(),
      )
    ) {
      continue;
    }

    dedupedSteps.push({ ...step, title: normalizedTitle });

    if (dedupedSteps.length >= 7) {
      break;
    }
  }

  const steps = dedupedSteps.slice(0, 7).map((step, index) => {
    const stepNumber = index + 1;
    const text = roadmapTextForStep(step);
    const revenueImpact = revenueImpactSummary.estimates.find(
      (estimate) =>
        estimate.findingTitle === step.title ||
        text.includes(estimate.findingTitle.toLowerCase()) ||
        estimate.explanation.toLowerCase().includes(step.title.toLowerCase()),
    );
    const commercialModel = roadmapStepCommercialModel({
      text,
      stepNumber,
      siteType,
      benchmarkGroup,
    });

    return {
      stepNumber,
      title: step.title,
      cost: commercialModel.cost,
      timeline: commercialModel.timeline,
      rationale: step.why,
      validationTarget: roadmapValidationTarget(text),
      expectedImpact:
        revenueImpact?.likelyImpact ||
        "A clearer customer path and a more measurable next action.",
      roiRationale: commercialModel.roiRationale,
      sourceFinding: step.evidenceClue || step.title,
      riskArea: revenueImpact?.riskArea,
      confidence: revenueImpact?.confidence,
    };
  });

  const roadmap: RecommendationRoadmap = {
    summary:
      "A structured recommendation roadmap for answering what comes next, the directional planning range, the expected timeline, and the likely ROI.",
    primaryRecommendation: steps[0]?.title ?? "Validate Primary Customer Path",
    source: {
      scanId,
      domain: normalizeScanDomain(website),
      siteType,
      benchmarkGroup,
      score: overallScore,
    },
    steps,
  };

  steps.forEach((step) => {
    const key = `step${step.stepNumber}` as
      | "step1"
      | "step2"
      | "step3"
      | "step4"
      | "step5"
      | "step6"
      | "step7";
    roadmap[key] = step;
  });

  return roadmap;
}

function attachRevenueImpactToFindings(
  findings: HeuristicFinding[],
  revenueImpactSummary: RevenueImpactSummary,
): HeuristicFinding[] {
  return findings.map((finding) => ({
    ...finding,
    revenueImpact: revenueImpactSummary.estimates.find(
      (estimate) => estimate.findingTitle === finding.title,
    ),
  }));
}

function buildBenchmarkContext(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
  {
    overallScore,
    visualUxDiagnostics,
    siteClassification,
    reviewContext,
    scoringConfidence,
  }: {
    overallScore: number;
    visualUxDiagnostics: VisualUxDiagnosticsResult;
    siteClassification: SiteClassification;
    reviewContext: StorefrontReviewContext;
    scoringConfidence: ScoringConfidence;
  },
): BenchmarkContext {
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const tags: string[] = [];
  const notes: BenchmarkNote[] = [];
  const positivePatterns: string[] = [];
  const negativePatterns: string[] = [];
  const addNote = (note: BenchmarkNote) => notes.push(note);
  const findingTitles = findings.map((finding) => finding.title);
  const has = (title: string) => findingTitles.includes(title);
  const enterpriseMultiEntryHomepage =
    isEnterpriseVisibilityContext(diagnostics, siteClassification, visualUxDiagnostics) &&
    enterpriseRetailJourneySignalCount(diagnostics) >= 4;

  const mobileIsStrong =
    signals.mobileCtaVisibleAboveFold &&
    !signals.mobileCrowdingRisk &&
    signals.mobileAboveFoldLinkCount <= 18 &&
    signals.mobileVisibleTextLength <= 1800;
  const mobileIsWeak =
    (!enterpriseMultiEntryHomepage && has("Mobile CTA Visibility Needs Review")) ||
    has("Mobile Readability May Be Crowded");

  if (mobileIsStrong) {
    pushUnique(tags, "strong-mobile-clarity");
    positivePatterns.push("Mobile clarity is supported by visible CTA evidence and controlled first-screen density.");
    addNote({
      message:
        "This storefront shows stronger mobile clarity against the scanner's current internal comparison criteria.",
      evidence: `Mobile CTA above fold: yes; first-screen links: ${signals.mobileAboveFoldLinkCount}; crowding risk: no.`,
      tags: ["strong-mobile-clarity"],
      tone: "positive",
    });
  } else if (mobileIsWeak) {
    pushUnique(tags, "weak-mobile-clarity");
    negativePatterns.push("Mobile clarity is pressured by CTA visibility or first-screen density signals.");
    addNote({
      message:
        "Mobile clarity appears weaker than stronger internal examples and should be reviewed before interpreting conversion friction.",
      evidence: `Mobile CTA above fold: ${signals.mobileCtaVisibleAboveFold ? "yes" : "no"}; first-screen links: ${signals.mobileAboveFoldLinkCount}; crowding risk: ${signals.mobileCrowdingRisk ? "yes" : "no"}.`,
      tags: ["weak-mobile-clarity"],
      tone: "negative",
    });
  }

  if (signals.mobileCtaVisibleAboveFold && commerce.ctaCount >= 2) {
    pushUnique(tags, "strong-cta-visibility");
    positivePatterns.push("CTA visibility is supported by above-fold mobile evidence and multiple action labels.");
  } else if (
    enterpriseMultiEntryHomepage &&
    has("Mobile Journey Entry Priority Needs Review")
  ) {
    pushUnique(tags, "enterprise-journey-entry-visible");
    positivePatterns.push("Enterprise journey entry points are visible through search, departments, fulfillment, reorder, account, or cart paths.");
    addNote({
      message:
        "A single promo-style CTA was not required because multiple enterprise retail journey entries were visible.",
      evidence: `Visible enterprise journey signal groups: ${enterpriseRetailJourneySignalCount(diagnostics)}; ${summarizeCtaLabels(commerce.ctaLabels)}`,
      tags: ["enterprise-journey-entry-visible"],
      tone: "mixed",
    });
  } else if (has("Mobile CTA Visibility Needs Review") || commerce.ctaCount <= 1) {
    pushUnique(tags, "weak-cta-visibility");
    negativePatterns.push("CTA visibility may require manual review because the primary action is not strongly evidenced.");
    addNote({
      message:
        "The primary action appears less visible than strong internal examples where the next step is clear early.",
      evidence: `Mobile CTA above fold: ${signals.mobileCtaVisibleAboveFold ? "yes" : "no"}; ${summarizeCtaLabels(commerce.ctaLabels)}`,
      tags: ["weak-cta-visibility"],
      tone: "negative",
    });
  }

  if (
    signals.productNavigationVisible &&
    signals.collectionLinksVisible &&
    signals.searchVisible
  ) {
    pushUnique(tags, "strong-product-discovery");
    positivePatterns.push("Product discovery has visible navigation, collection/product links, and search.");
    addNote({
      message:
        "Product discovery appears comparatively clear under the scanner's current internal criteria.",
      evidence:
        "Product/category navigation, collection/product links, and search were all visible in the public-page sample.",
      tags: ["strong-product-discovery"],
      tone: "positive",
    });
  } else if (
    has("Product Discovery Clarity Needs Review") ||
    has("Store Search Visibility Needs Review")
  ) {
    pushUnique(tags, "weak-product-discovery");
    negativePatterns.push("Product discovery is pressured by missing category, collection, or search visibility.");
    addNote({
      message:
        "This storefront appears to rely heavily on discovery before purchase confidence becomes clear.",
      evidence: `Product/category navigation: ${signals.productNavigationVisible ? "visible" : "not visible"}; collection/product links: ${signals.collectionLinksVisible ? "visible" : "not visible"}; search: ${signals.searchVisible ? "visible" : "not visible"}.`,
      tags: ["weak-product-discovery"],
      tone: "negative",
    });
  }

  if (trustSignalsVisible >= 4) {
    pushUnique(tags, "strong-trust-signals");
    positivePatterns.push("Trust visibility is supported by several reassurance groups.");
  } else if (
    has("Trust Signal Visibility Needs Review") ||
    has("Shipping and Returns Messaging Not Prominent")
  ) {
    pushUnique(tags, "weak-trust-signals");
    negativePatterns.push("Trust visibility is limited around reassurance, policy, support, or shipping signals.");
    addNote({
      message:
        "Trust-building elements appear less visible than stronger internal review examples.",
      evidence: `${trustSignalsVisible} of 6 trust-signal groups were visible; missing or weak groups: ${missingTrustSignalLabels(diagnostics)}.`,
      tags: ["weak-trust-signals"],
      tone: "negative",
    });
  }

  if (commerce.cartVisible && commerce.checkoutVisible) {
    pushUnique(tags, "strong-checkout-continuity");
    positivePatterns.push("Checkout continuity is supported by visible cart and checkout cues.");
  } else if (has("Cart / Checkout Path Needs Review")) {
    pushUnique(tags, "weak-checkout-continuity");
    negativePatterns.push("Checkout continuity is pressured by limited cart or checkout visibility.");
    addNote({
      message:
        "The browse-to-buy path appears less continuous than strong internal examples.",
      evidence: `Cart visibility: ${commerce.cartVisible ? "visible" : "not visible"}; checkout visibility: ${commerce.checkoutVisible ? "visible" : "not visible"}.`,
      tags: ["weak-checkout-continuity"],
      tone: "negative",
    });
  }

  if (marketingTools.length >= 2) {
    pushUnique(tags, "strong-tracking-visibility");
    positivePatterns.push("Tracking visibility is supported by multiple detected analytics or marketing tools.");
    addNote({
      message:
        "Tracking visibility appears stronger than the scanner's baseline internal examples, which may make follow-up measurement easier to validate.",
      evidence: `Detected supported marketing tools: ${visibleEvidenceList(marketingTools.map((tool) => tool.label))}.`,
      tags: ["strong-tracking-visibility"],
      tone: "positive",
    });
  } else if (
    has("Marketing Attribution Visibility Appears Limited") ||
    has("Tracking Stack Appears Limited")
  ) {
    pushUnique(tags, "weak-tracking-visibility");
    negativePatterns.push("Tracking visibility is limited or thin in public-page evidence.");
    addNote({
      message:
        "Measurement confidence may be weaker than strong internal examples until attribution visibility is confirmed.",
      evidence: `Detected ${marketingTools.length} supported marketing tool${marketingTools.length === 1 ? "" : "s"}: ${visibleEvidenceList(marketingTools.map((tool) => tool.label))}.`,
      tags: ["weak-tracking-visibility"],
      tone: "negative",
    });
  }

  if (
    signals.contactSupportVisible &&
    signals.orderReturnsLanguageVisible &&
    signals.shippingReturnsVisible
  ) {
    pushUnique(tags, "strong-operational-clarity");
    positivePatterns.push("Operational clarity is supported by support, returns, and shipping/order language.");
  } else if (
    has("Support or Lead Path Visibility Limited") ||
    has("Order and Returns Communication Needs Review") ||
    has("Shipping and Returns Messaging Not Prominent")
  ) {
    pushUnique(tags, "weak-operational-clarity");
    negativePatterns.push("Operational clarity is pressured by support, returns, or fulfillment communication gaps.");
    addNote({
      message:
        "Operational reassurance appears less explicit than strong internal examples.",
      evidence: `Support/contact: ${signals.contactSupportVisible ? "visible" : "not visible"}; order/returns language: ${signals.orderReturnsLanguageVisible ? "visible" : "not visible"}; shipping/returns: ${signals.shippingReturnsVisible ? "visible" : "not visible"}.`,
      tags: ["weak-operational-clarity"],
      tone: "negative",
    });
  }

  const signalScore = tags.reduce((score, tag) => {
    if (tag.startsWith("strong-")) return score + 1;
    if (tag.startsWith("weak-")) return score - 1;
    return score;
  }, 0);
  const strongCount = tags.filter((tag) => tag.startsWith("strong-")).length;
  const weakCount = tags.filter((tag) => tag.startsWith("weak-")).length;
  const summary =
    weakCount > strongCount
      ? "Compared with stronger storefront patterns in the current internal review set, this scan leans toward improvement opportunities."
      : strongCount > weakCount
        ? "Compared with stronger storefront patterns in the current internal review set, this scan shows several more positive signals."
        : "Compared with stronger storefront patterns in the current internal review set, this scan is mixed, with both clearer signals and review areas visible.";
  const benchmarkGroup = benchmarkGroupForScan({
    diagnostics,
    siteClassification,
    reviewContext,
  });
  const rawPercentileEstimate = percentileFromScore({
    overallScore,
    visualUxDiagnostics,
    scoringConfidence,
  });
  const percentileEstimate =
    scoringConfidence === "Low" ? null : rawPercentileEstimate;
  const benchmarkLabel = benchmarkLabelForPercentile(
    rawPercentileEstimate,
    scoringConfidence,
  );
  const comparisonBasis = [
    `Benchmark group: ${benchmarkGroup}`,
    `Overall score: ${overallScore}/100`,
    usableVisualUxScore(visualUxDiagnostics) === null
      ? "Visual UX score: unavailable"
      : `Visual UX score: ${usableVisualUxScore(visualUxDiagnostics)}/100`,
    `Scoring confidence: ${scoringConfidence}`,
    `Visible evidence tags: ${tags.length > 0 ? tags.join(", ") : "mixed or limited"}`,
  ];
  const strengthsVsBenchmark =
    positivePatterns.length > 0
      ? positivePatterns.slice(0, 4)
      : ["No standout strengths were strong enough to classify against the benchmark group."];
  const weaknessesVsBenchmark =
    negativePatterns.length > 0
      ? negativePatterns.slice(0, 4)
      : ["No major benchmark weaknesses were detected from the public-page evidence."];
  const explanation =
    scoringConfidence === "Low"
      ? `Benchmark available for ${benchmarkGroup}, but confidence is low because scanner evidence was incomplete. Additional validation is required before assigning a percentile or competitive rank.`
      : `Directional benchmark based on Opzix internal scoring model and visible public-page evidence. This submitted URL is compared against ${benchmarkGroup}, with an estimated ${rawPercentileEstimate}th percentile position and ${benchmarkLabel.toLowerCase()} label.`;

  return {
    benchmarkGroup,
    percentileEstimate,
    benchmarkLabel,
    comparisonBasis,
    strengthsVsBenchmark,
    weaknessesVsBenchmark,
    explanation,
    summary,
    notes: notes.slice(0, 5),
    benchmarkTags: tags,
    recurringPositivePatterns: positivePatterns.slice(0, 5),
    recurringNegativePatterns: negativePatterns.slice(0, 5),
    signalScore,
  };
}

function getHostFromUrl(website: string) {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return website;
  }
}

function buildIdentitySummary({
  businessScale,
  commerceMaturity,
}: {
  businessScale: StorefrontIdentityProfile["businessScale"];
  commerceMaturity: StorefrontIdentityProfile["commerceMaturity"];
}) {
  const scalePhrase =
    businessScale === "enterprise"
      ? "an enterprise retail storefront"
      : businessScale === "education"
        ? "an education commerce storefront"
        : businessScale === "lead-capture"
          ? "a lead-capture or service-focused storefront"
          : businessScale === "growth"
            ? "a growth-stage commerce storefront"
            : "an unclear public entry point";

  const maturityPhrase =
    commerceMaturity === "advanced"
      ? "It shows a more mature purchase and measurement footprint."
      : commerceMaturity === "moderate"
        ? "It appears to have a moderate visible commerce path."
        : commerceMaturity === "early"
          ? "It is still in an early or lightly signaled commerce phase."
          : "A commerce path was not visible enough to score confidently.";

  return `The submitted page reads like ${scalePhrase}; ${maturityPhrase}`;
}

function buildIdentityOpening({
  businessScale,
  operationalPattern,
}: {
  businessScale: StorefrontIdentityProfile["businessScale"];
  operationalPattern: StorefrontIdentityProfile["operationalPattern"];
}) {
  if (operationalPattern === "enterprise-retail") {
    return "This scan reads like an enterprise retail experience, so the customer journey should be reviewed with platform confidence, trust continuity, and checkout clarity in mind.";
  }

  if (operationalPattern === "catalog-commerce") {
    return "This storefront feels like catalog-driven commerce, so product discovery, search, and category flow should be examined alongside purchase cues.";
  }

  if (operationalPattern === "brand-commerce") {
    return "This is likely a brand-focused commerce experience, so marketing signal clarity and a clean path to purchase should be balanced.";
  }

  if (operationalPattern === "education-commerce") {
    return "This appears to be an education or course commerce experience, so lead capture, discovery, and support signals should be reviewed carefully.";
  }

  if (operationalPattern === "lead-capture") {
    return "This looks like a lead-capture or service commerce storefront, so form paths, support cues, and purchase intent signals should be confirmed.";
  }

  return "This submitted URL should be manually confirmed before treating it as a storefront or commerce entry point.";
}

function buildIdentityFraming({
  operationalPattern,
}: {
  operationalPattern: StorefrontIdentityProfile["operationalPattern"];
}) {
  if (operationalPattern === "enterprise-retail") {
    return "Treat the findings as part of a coordinated retail experience where platform, cart, and trust signals are all connected.";
  }

  if (operationalPattern === "catalog-commerce") {
    return "Treat the findings as part of a catalog discovery path where navigation clarity influences purchase momentum.";
  }

  if (operationalPattern === "brand-commerce") {
    return "Treat the findings as part of a brand commerce path where promotional and transactional evidence both matter.";
  }

  if (operationalPattern === "education-commerce") {
    return "Treat the findings as part of an education or training commerce flow where discovery and lead capture can be subtle.";
  }

  if (operationalPattern === "lead-capture") {
    return "Treat the findings as part of a lead-capture or service path where contact and support signals are central.";
  }

  return "Treat the findings as a URL-purpose check before making storefront, platform, cart, checkout, or catalog assumptions.";
}

function buildStorefrontIdentityProfile({
  website,
  diagnostics,
}: {
  website: string;
  diagnostics: LiveDiagnosticsResult;
}): StorefrontIdentityProfile {
  const host = getHostFromUrl(website);
  const marketingTools = visibleMarketingTools(diagnostics);
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const fullPage = diagnostics.fullPageDomSignals;
  const platform = diagnostics.platformDetection;

  const hostIsEnterprise = /(?:amazon|walmart|target|costco|bestbuy|homedepot|lowes|sears|macys|nike|adidas|apple|microsoft|google|intel|dell|hp|ikea|verizon|att|samsung|sony)/i.test(host);
  const educationHost = /(?:\.edu|academy|course|learning|training|university|college)/i.test(host);
  const platformIsCustomEnterprise =
    platform.name === "Enterprise / Custom Commerce Stack" ||
    platform.name === "Unknown" ||
    platform.confidence < 60;
  const productEvidenceVisible =
    commerce.productCatalogVisible ||
    signals.productNavigationVisible ||
    signals.collectionLinksVisible ||
    fullPage.categoryProductVisible ||
    fullPage.productCardCount >= 2 ||
    fullPage.productLinks.length >= 2;
  const commercePathVisible =
    productEvidenceVisible &&
    (commerce.cartVisible ||
      commerce.checkoutVisible ||
      signals.productNavigationVisible ||
      signals.collectionLinksVisible ||
      signals.searchVisible);
  const standardPlatformVisible =
    !platformIsCustomEnterprise && platform.confidence >= 70;
  const trackingDepth = marketingTools.length;
  const hasLeadCapture = signals.leadCaptureVisible;

  let businessScale: StorefrontIdentityProfile["businessScale"] = "unknown";
  if (hostIsEnterprise) {
    businessScale = "enterprise";
  } else if (educationHost) {
    businessScale = "education";
  } else if (commercePathVisible || (productEvidenceVisible && standardPlatformVisible)) {
    businessScale = "growth";
  } else if (hasLeadCapture) {
    businessScale = "lead-capture";
  }

  const architectureStyle =
    platformIsCustomEnterprise && hostIsEnterprise
      ? "enterprise-custom"
      : platformIsCustomEnterprise
        ? "custom"
        : "standard-platform";

  const commerceMaturity =
    commerce.cartVisible && commerce.checkoutVisible && trackingDepth >= 2
      ? "advanced"
      : commerce.cartVisible || commerce.checkoutVisible || commercePathVisible
        ? "moderate"
        : productEvidenceVisible || standardPlatformVisible
          ? "early"
          : "unknown";

  let operationalPattern: StorefrontIdentityProfile["operationalPattern"] = "unknown";
  if (hostIsEnterprise && commercePathVisible) {
    operationalPattern = "enterprise-retail";
  } else if (educationHost) {
    operationalPattern = "education-commerce";
  } else if (productEvidenceVisible || standardPlatformVisible) {
    operationalPattern = "catalog-commerce";
  } else if (hasLeadCapture) {
    operationalPattern = "lead-capture";
  }

  const platformConfidence =
    platform.confidenceLabel === "High confidence"
      ? "high"
      : platform.confidenceLabel === "Moderate confidence"
        ? "moderate"
        : platform.confidenceLabel === "Low confidence"
          ? "low"
          : "unknown";

  const identitySignals = [
    host ? `host: ${host}` : "host: unknown",
    `platform: ${platform.name}`,
    `platform confidence: ${platform.confidenceLabel}`,
    `commerce path visible: ${commercePathVisible ? "yes" : "no"}`,
    `marketing tools detected: ${trackingDepth}`,
    `lead capture visible: ${hasLeadCapture ? "yes" : "no"}`,
  ];

  return {
    domain: host,
    businessScale,
    architectureStyle,
    commerceMaturity,
    operationalPattern,
    platformConfidence,
    identitySignals,
    identitySummary: buildIdentitySummary({ businessScale, commerceMaturity }),
    identityOpening: buildIdentityOpening({ businessScale, operationalPattern }),
    identityFraming: buildIdentityFraming({ operationalPattern }),
  };
}

function buildIdentityAwareFirstAction(
  defaultAction: string,
  identityProfile: StorefrontIdentityProfile,
) {
  const trimmedAction = defaultAction.trim();
  if (!trimmedAction) {
    return trimmedAction;
  }

  const baseAction =
    trimmedAction.charAt(0).toLowerCase() + trimmedAction.slice(1);
  const prefix =
    identityProfile.operationalPattern === "enterprise-retail"
      ? "For this enterprise-style storefront, first validate the purchase path and trust continuity, then"
      : identityProfile.operationalPattern === "catalog-commerce"
        ? "For a catalog-led storefront, first confirm product discovery and category flow, then"
        : identityProfile.operationalPattern === "brand-commerce"
          ? "For this brand-focused storefront, first verify the customer journey from marketing to purchase, then"
          : identityProfile.operationalPattern === "education-commerce"
            ? "For this education commerce experience, first validate discovery and lead path clarity, then"
            : identityProfile.operationalPattern === "lead-capture"
              ? "For this lead-capture storefront, first confirm the form and support path, then"
              : "First,";

  return sanitizeEvidenceText(`${prefix} ${baseAction}`, { maxLength: 240 });
}

function avoidRepeatedNarrativeText(
  current: string,
  compareTexts: Array<string | undefined | null>,
) {
  const currentSentence = current.split(/([.!?])\s+/)[0]?.trim();

  if (!currentSentence) {
    return current;
  }

  const normalizedCurrent = currentSentence.toLowerCase();
  const reuseDetected = compareTexts.some((text) => {
    if (!text) return false;
    const otherSentence = text.split(/([.!?])\s+/)[0]?.trim();
    return otherSentence?.toLowerCase() === normalizedCurrent;
  });

  if (!reuseDetected) {
    return current;
  }

  if (current.startsWith("This review")) {
    return current.replace("This review", "Overall, this scan indicates");
  }

  return `Overall, ${current.charAt(0).toLowerCase()}${current.slice(1)}`;
}

function avoidRepeatedActionText(
  currentAction: string,
  compareTexts: Array<string | undefined | null>,
) {
  const trimmed = currentAction.trim();
  if (!trimmed) return trimmed;

  const reuseDetected = compareTexts.some(
    (text) => text != null && text.trim() === trimmed,
  );

  if (!reuseDetected) {
    return trimmed;
  }

  return `${trimmed} Confirm this in a manual storefront walkthrough to keep the review distinct.`;
}

function dedupeNarrativeSections({
  executiveSummary,
  auditNarrative,
  primaryOperationalConcern,
  firstAction,
}: {
  executiveSummary: {
    summary: string;
    highestImpactOpportunities: string[];
    businessInterpretation: string;
  };
  auditNarrative: string;
  primaryOperationalConcern: PrimaryOperationalConcern | null;
  firstAction?: {
    title: string;
    evidenceClue: string;
    action: string;
    why: string;
  };
}) {
  const bannedGeneric = [
    {
      pattern: /functioning storefront shell/gi,
      replacement: "visible public-page structure",
    },
    {
      pattern: /operational reliability and frontend stability/gi,
      replacement: "technical reliability and public-page signal quality",
    },
  ];
  const clean = (value: string) =>
    bannedGeneric.reduce(
      (text, rule) => text.replace(rule.pattern, rule.replacement),
      value,
    );
  const firstSentence = (value: string) => value.split(/(?<=[.!?])\s+/)[0]?.trim() ?? "";
  const summaryFirst = firstSentence(executiveSummary.summary).toLowerCase();
  let nextNarrative = clean(auditNarrative);
  let nextSummary = clean(executiveSummary.summary);
  let nextInterpretation = clean(executiveSummary.businessInterpretation);

  if (summaryFirst && firstSentence(nextNarrative).toLowerCase() === summaryFirst) {
    nextNarrative = nextNarrative.replace(firstSentence(nextNarrative), "The deeper review should now connect that context to the most important visible evidence.");
  }

  if (
    primaryOperationalConcern &&
    firstSentence(primaryOperationalConcern.explanation).toLowerCase() === summaryFirst
  ) {
    primaryOperationalConcern.explanation = `Operationally, ${primaryOperationalConcern.explanation.charAt(0).toLowerCase()}${primaryOperationalConcern.explanation.slice(1)}`;
  }

  if (
    primaryOperationalConcern &&
    firstAction?.action &&
    primaryOperationalConcern.recommendedFirstAction.trim() === firstAction.action.trim()
  ) {
    primaryOperationalConcern.recommendedFirstAction = `${primaryOperationalConcern.recommendedFirstAction} Use the supporting findings to confirm the same path from a second angle.`;
  }

  if (firstAction && nextInterpretation.includes(firstAction.action)) {
    nextInterpretation = nextInterpretation.replace(firstAction.action, "that first journey confirmation");
  }

  executiveSummary.summary = sanitizeEvidenceText(nextSummary, { maxLength: 560 });
  executiveSummary.businessInterpretation = sanitizeEvidenceText(nextInterpretation, { maxLength: 560 });

  return {
    executiveSummary,
    auditNarrative: sanitizeEvidenceText(nextNarrative, { maxLength: 900 }),
    primaryOperationalConcern,
    firstAction,
  };
}

type IntelligenceCategory = {
  key: string;
  score: number;
  status?: string;
};

function deriveScanIntelligence({
  categories,
  diagnostics,
  findings,
  identityProfile,
  narrativeArchetype,
  overallScore,
  overallStatus,
  reviewContext,
}: {
  categories: IntelligenceCategory[];
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  identityProfile: StorefrontIdentityProfile;
  narrativeArchetype: string;
  overallScore: number;
  overallStatus: string;
  reviewContext: StorefrontReviewContext;
}) {
  return {
    archetype: withUnknown(narrativeArchetype),
    industry: deriveIndustry(identityProfile, reviewContext),
    platform: withUnknown(diagnostics.platformDetection.name || "Unknown"),
    siteType: withUnknown(reviewContext.siteType),
    trafficReadiness: deriveTrafficReadiness({
      findings,
      overallScore,
      overallStatus,
    }),
    trackingReadiness: deriveTrackingReadiness(categories, findings),
    trustReadiness: deriveTrustReadiness(categories, findings),
    checkoutReadiness: deriveCheckoutReadiness(diagnostics, findings),
    mobileReadiness: deriveMobileReadiness(categories, diagnostics, findings),
  };
}

function deriveIndustry(
  identityProfile: StorefrontIdentityProfile,
  reviewContext: StorefrontReviewContext,
) {
  if (identityProfile.operationalPattern === "enterprise-retail") {
    return "retail";
  }

  if (identityProfile.operationalPattern === "education-commerce") {
    return "education";
  }

  if (identityProfile.operationalPattern === "lead-capture") {
    return "lead-generation";
  }

  if (
    identityProfile.operationalPattern === "catalog-commerce" ||
    identityProfile.operationalPattern === "brand-commerce" ||
    reviewContext.siteType === "ecommerce-storefront" ||
    reviewContext.siteType === "catalog-commerce"
  ) {
    return "ecommerce";
  }

  return "unknown";
}

function deriveTrafficReadiness({
  findings,
  overallScore,
  overallStatus,
}: {
  findings: HeuristicFinding[];
  overallScore: number;
  overallStatus: string;
}) {
  const hasMajorBlocker = findings.some(
    (finding) =>
      finding.severity === "Critical" ||
      (finding.severity === "High" && finding.confidence !== "Low"),
  );

  if (overallStatus === "High Priority" || overallScore < 65 || hasMajorBlocker) {
    return "high-priority";
  }

  if (overallStatus === "Healthy" && overallScore >= 80) {
    return "ready";
  }

  return "needs-review";
}

function deriveTrackingReadiness(
  categories: IntelligenceCategory[],
  findings: HeuristicFinding[],
) {
  const category = getCategory(categories, "trackingIssues");
  const trackingFindings = findingsWithText(findings, [
    "tracking",
    "attribution",
    "analytics",
    "pixel",
    "tag",
  ]);

  if (!category && trackingFindings.length === 0) {
    return "unknown";
  }

  if (
    category &&
    (category.score < 65 ||
      trackingFindings.some((finding) =>
        `${finding.title} ${finding.evidenceSummary}`.toLowerCase().includes("limited"),
      ))
  ) {
    return "limited";
  }

  if (category && category.score >= 80 && trackingFindings.length === 0) {
    return "strong";
  }

  return "needs-review";
}

function deriveTrustReadiness(
  categories: IntelligenceCategory[],
  findings: HeuristicFinding[],
) {
  const conversion = getCategory(categories, "conversionIssues");
  const trustFindings = findingsWithText(findings, [
    "trust",
    "confidence",
    "shipping",
    "returns",
    "payment",
    "support",
    "warranty",
    "guarantee",
    "reassurance",
  ]);

  if (!conversion && trustFindings.length === 0) {
    return "unknown";
  }

  if (
    trustFindings.some(
      (finding) => finding.severity === "Critical" || finding.severity === "High",
    ) ||
    (conversion && conversion.score < 65)
  ) {
    return "limited";
  }

  if (conversion && conversion.score >= 80 && trustFindings.length === 0) {
    return "strong";
  }

  return "needs-review";
}

function deriveCheckoutReadiness(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
) {
  const commerce = diagnostics.commerceFlowSignals;
  const checkoutFindings = findingsWithText(findings, ["cart", "checkout"]);

  if (!commerce) {
    return "unknown";
  }

  if (commerce.cartVisible && commerce.checkoutVisible && checkoutFindings.length === 0) {
    return "visible";
  }

  if (!commerce.cartVisible && !commerce.checkoutVisible) {
    return "limited";
  }

  return "needs-review";
}

function deriveMobileReadiness(
  categories: IntelligenceCategory[],
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
) {
  const ux = getCategory(categories, "uxUiIssues");
  const signals = diagnostics.storefrontSignals;
  const mobileFindings = findingsWithText(findings, [
    "mobile",
    "readability",
    "crowd",
    "cta visibility",
  ]);

  if (!signals && !ux && mobileFindings.length === 0) {
    return "unknown";
  }

  if (
    signals.mobileCrowdingRisk ||
    mobileFindings.some((finding) =>
      `${finding.title} ${finding.evidenceSummary}`.toLowerCase().includes("crowd"),
    ) ||
    (ux && ux.score < 65)
  ) {
    return "crowded";
  }

  if (signals.mobileCtaVisibleAboveFold && ux && ux.score >= 80) {
    return "strong";
  }

  return "needs-review";
}

function getCategory(categories: IntelligenceCategory[], key: AuditCategoryKey) {
  return categories.find((category) => category.key === key);
}

function findingsWithText(findings: HeuristicFinding[], terms: string[]) {
  return findings.filter((finding) => {
    const text = [
      finding.title,
      finding.category,
      finding.evidenceSummary,
      finding.businessImpact,
      finding.recommendedFirstAction,
    ]
      .join(" ")
      .toLowerCase();

    return terms.some((term) => text.includes(term));
  });
}

function findHighSeverityVisualUxFinding(findings: HeuristicFinding[]) {
  return findings.find(
    (finding) =>
      finding.category === "visualUx" &&
      (finding.severity === "High" || finding.severity === "Critical"),
  );
}

function withUnknown(value: string | null | undefined) {
  return value?.trim() || "unknown";
}

export async function POST(request: Request) {
  let submittedWebsite = "unknown";
  let latestDiagnostics: LiveDiagnosticsResult | null = null;
  let latestScore: number | null = null;
  let latestStatus: string | null = null;

  try {
    const body = await readJsonBody(request);
    const values = toCleanStringRecord(body, scannerFields);

    if (!values) {
      return NextResponse.json(
        {
          success: false,
          error:
            "We could not read the scanner request. Please try submitting again.",
        },
        { status: 400 }
      );
    }

    const issues: ValidationIssue[] = getMissingRequiredFields(
      values,
      scannerFields
    );

    if (values.website && !isValidHttpUrl(values.website)) {
      issues.push({
        field: "website",
        message:
          "Please enter a valid website URL beginning with http:// or https://.",
      });
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: buildFriendlyValidationError(issues),
          fields: issues,
        },
        { status: 400 }
      );
    }

    const submittedAt = new Date().toISOString();
    submittedWebsite = values.website;
    const diagnostics = await runLightweightEcommerceDiagnostics(values.website);
    latestDiagnostics = diagnostics;

    if (diagnostics.scanError) {
      const browserLaunchFailed = diagnostics.scanError === "Browser launch failed";

      await saveScannerDebugRecord(
        buildScannerDebugRecord({
          url: values.website,
          success: false,
          status: diagnostics.scanError,
          rootCause: diagnostics.scanDiagnostics?.error ?? null,
          diagnostics,
        }),
      );

      return NextResponse.json(
        {
          success: false,
          scannerAvailable: !browserLaunchFailed,
          reason: browserLaunchFailed ? "Browser launch failed" : diagnostics.scanError,
          error: diagnostics.scanError,
          currentStage: diagnostics.scanDiagnostics?.currentStage,
          failedUrl:
            diagnostics.scanDiagnostics?.error?.failedUrl ??
            diagnostics.finalUrl ??
            values.website,
          rootCause: diagnostics.scanDiagnostics?.error,
          timingMetrics: diagnostics.scanDiagnostics?.timings,
          scanDiagnostics: diagnostics.scanDiagnostics,
        },
        { status: 200 },
      );
    }

    const reportGenerationStart = Date.now();
    addScannerStageLog(diagnostics.scanDiagnostics, "report_generation", "Generating audit report", {
      url: diagnostics.finalUrl || values.website,
    });

    const siteClassification = classifySiteType({ diagnostics, website: values.website });
    const visualUxDiagnostics = analyzeVisualUx({
      desktopScreenshot: diagnostics.desktopScreenshotUrl,
      mobileScreenshot: diagnostics.mobileScreenshotUrl,
      desktopDomMetrics: diagnostics.desktopVisualMetrics,
      mobileDomMetrics: diagnostics.mobileVisualMetrics,
      visibleText: [
        diagnostics.desktopVisualMetrics?.visibleTextSample,
        diagnostics.mobileVisualMetrics?.visibleTextSample,
      ]
        .filter(Boolean)
        .join(" "),
      visibleLinks: [
        ...(diagnostics.desktopVisualMetrics?.visibleLinks ?? []),
        ...(diagnostics.mobileVisualMetrics?.visibleLinks ?? []),
      ],
      productSignals: diagnostics.storefrontSignals,
      commerceSignals: diagnostics.commerceFlowSignals,
      siteType: siteClassification.siteType,
      platformName: diagnostics.platformDetection.platformName,
      scannedUrl: diagnostics.finalUrl || values.website,
    });
    console.info("Visual UX metrics debug", {
      website: values.website,
      finalUrl: diagnostics.finalUrl,
      visualMetricsDebug: visualUxDiagnostics.visualMetricsDebug,
    });
    const scoringEvidenceState = buildScoringEvidenceState(
      diagnostics,
      visualUxDiagnostics,
      siteClassification,
    );
    const heuristicFindings = buildHeuristicFindings(
      diagnostics,
      visualUxDiagnostics,
      siteClassification,
      scoringEvidenceState,
    );
    const scanCoverage = buildScanCoverage(diagnostics, visualUxDiagnostics);
    const positiveUxSignals = buildPositiveUxSignals({
      diagnostics,
      visualUxDiagnostics,
      siteClassification,
    });
    const ecommerceMaturity = calculateEcommerceMaturityScore({
      diagnostics,
      findings: heuristicFindings,
      visualUxDiagnostics,
      siteClassification,
      positiveUxSignals,
    });
    const categories = applyLiveDiagnosticScoring(
      diagnostics,
      heuristicFindings,
      siteClassification,
      visualUxDiagnostics,
      ecommerceMaturity,
      positiveUxSignals,
      scoringEvidenceState,
    );
    const scoreMismatchWarnings = buildScoreMismatchWarnings(
      visualUxDiagnostics,
      categories,
    );
    const baseOverallScore = Math.round(
      categories.reduce((total, category) => total + category.score, 0) /
        categories.length,
    );
    const overallScoring = calculateOverallScoringResult({
      baseScore: baseOverallScore,
      categories,
      findings: heuristicFindings,
      visualUxDiagnostics,
      diagnostics,
      siteClassification,
      positiveUxSignals,
      ecommerceMaturity,
      evidenceState: scoringEvidenceState,
    });
    const overallScore = overallScoring.overallScore;
    let scoreExplanation = overallScoring.scoreExplanation;
    const narrativeArchetypeProfile = resolveNarrativeArchetype({
      categories,
      diagnostics,
      findings: heuristicFindings,
    });
    const identityProfile = buildStorefrontIdentityProfile({
      website: values.website,
      diagnostics,
    });
    const storefrontReviewContext = classifyStorefrontReviewContext({
      website: values.website,
      diagnostics,
    });
    let narrativeProfile = buildNarrativeProfile({
      diagnostics,
      findings: heuristicFindings,
      identityProfile,
      profile: narrativeArchetypeProfile,
      reviewContext: storefrontReviewContext,
      siteClassification,
    });
    let executiveSummary = buildExecutiveSummary({
      categories,
      diagnostics,
      findings: heuristicFindings,
      overallScore,
      identityProfile,
      reviewContext: storefrontReviewContext,
      profile: narrativeArchetypeProfile,
      narrativeProfile,
    });
    const connectedInsight = buildConnectedInsight(heuristicFindings);
    let auditNarrative = buildAuditNarrative({
      categories,
      diagnostics,
      findings: heuristicFindings,
      overallScore,
      connectedInsight,
      identityProfile,
      reviewContext: storefrontReviewContext,
      narrativeProfile,
    });
    let primaryOperationalConcern = buildPrimaryOperationalConcern(
      heuristicFindings,
      connectedInsight,
      narrativeArchetypeProfile,
      identityProfile,
      narrativeProfile,
    );

    if (primaryOperationalConcern) {
      primaryOperationalConcern.recommendedFirstAction = avoidRepeatedActionText(
        primaryOperationalConcern.recommendedFirstAction,
        [executiveSummary.summary, auditNarrative],
      );
    }

    executiveSummary.summary = avoidRepeatedNarrativeText(
      executiveSummary.summary,
      [auditNarrative, primaryOperationalConcern?.explanation],
    );

    const topPriorityRisks = buildTopPriorityRisks(
      heuristicFindings,
      categories,
      narrativeArchetypeProfile,
      narrativeProfile,
    );
    let recommendedNextSteps = buildRecommendedNextSteps(
      heuristicFindings,
      narrativeArchetypeProfile,
      narrativeProfile,
    );
    const dedupedNarrative = dedupeNarrativeSections({
      executiveSummary,
      auditNarrative,
      primaryOperationalConcern,
      firstAction: recommendedNextSteps[0],
    });
    executiveSummary = dedupedNarrative.executiveSummary;
    auditNarrative = dedupedNarrative.auditNarrative;
    primaryOperationalConcern = dedupedNarrative.primaryOperationalConcern;
    if (dedupedNarrative.firstAction) {
      recommendedNextSteps = [
        dedupedNarrative.firstAction,
        ...recommendedNextSteps.slice(1),
      ];
    }
    const pageTypeDetection = detectSubmittedPageType({
      diagnostics,
      siteClassification,
    });
    const benchmarkContext = buildBenchmarkContext(diagnostics, heuristicFindings, {
      overallScore,
      visualUxDiagnostics,
      siteClassification,
      reviewContext: storefrontReviewContext,
      scoringConfidence: scoringEvidenceState.scoringConfidence,
    });
    const competitiveComparison = buildCompetitiveComparison({
      benchmarkContext,
      pageType: pageTypeDetection,
    });
    const revenueImpactSummary = buildRevenueImpactSummary(heuristicFindings);
    const heuristicFindingsWithRevenueImpact = attachRevenueImpactToFindings(
      heuristicFindings,
      revenueImpactSummary,
    );
    scoreExplanation = {
      ...scoreExplanation,
      scoreReducers: scoreExplanation.majorPenalties,
      benchmarkContext,
      scanCoverage,
      pageType: pageTypeDetection,
    };
    const scoreExplanationSnapshot: ScoreExplanationSnapshot = {
      overallScore,
      scoringConfidence: scoringEvidenceState.scoringConfidence,
      scoringConfidenceNote: scoringEvidenceState.scoringConfidenceNote,
      positiveSignals: scoreExplanation.positiveSignals.slice(0, 5),
      scoreReducers: scoreExplanation.majorPenalties.slice(0, 5),
      benchmarkContext,
      benchmarkGroup: benchmarkContext.benchmarkGroup,
      benchmarkLabel: benchmarkContext.benchmarkLabel,
      visualMetricsAvailable: visualUxDiagnostics.visualMetricsAvailable,
      visualUxScore: visualUxDiagnostics.score,
      evidenceUnknown:
        scoringEvidenceState.scoringConfidence === "Low" ||
        !visualUxDiagnostics.visualMetricsAvailable ||
        Object.values(scoringEvidenceState.categoryEvidenceState).some(
          (state) => state === "Unknown",
        ),
      categoryScores: categories.map((category) => ({
        key: category.key,
        label: category.label,
        score: category.score,
        status: category.status,
        evidenceState: category.evidenceState,
        scoringConfidence: category.scoringConfidence,
        whatWouldImprove: category.scoreExplanation?.whatWouldImprove,
      })),
      whatWouldIncreaseScore: [
        ...categories
          .map((category) => category.scoreExplanation?.whatWouldImprove)
          .filter((item): item is string => Boolean(item))
          .slice(0, 4),
        ...recommendedNextSteps
          .map((step) => step.action)
          .filter(Boolean)
          .slice(0, 2),
      ].slice(0, 5),
    };
    const scoreNarrative = buildScoreNarrative({
      overallScore,
      scoreExplanation,
      scoreExplanationSnapshot,
      scoringConfidence: scoringEvidenceState.scoringConfidence,
      scoringConfidenceNote: scoringEvidenceState.scoringConfidenceNote,
      categories,
      positiveUxSignals,
      ecommerceMaturity,
      siteClassification,
      visualUxDiagnostics,
    });
    const scanId = createAuditScanId();
    const overallStatus = adjustedStatus(overallScore);
    latestScore = overallScore;
    latestStatus = overallStatus;
    const recommendationRoadmap = buildRecommendationRoadmap({
      scanId,
      website: values.website,
      siteType: narrativeProfile.narrativeMode,
      benchmarkGroup: benchmarkContext.benchmarkGroup,
      overallScore,
      recommendedNextSteps,
      revenueImpactSummary,
    });
    const primaryConcernTitle =
      primaryOperationalConcern?.title ||
      primaryOperationalConcern?.riskLabel ||
      topPriorityRisks[0]?.title ||
      topPriorityRisks[0]?.riskLabel ||
      "Primary audit concern";
    const intelligence = deriveScanIntelligence({
      categories,
      diagnostics,
      findings: heuristicFindings,
      identityProfile,
      narrativeArchetype: narrativeArchetypeProfile.archetype,
      overallScore,
      overallStatus,
      reviewContext: storefrontReviewContext,
    });

    logDevelopmentSubmission("Ecommerce audit scanner", {
      website: values.website,
      submittedAt,
      scannerMode: "mock",
      scanId,
    });

    let audit = {
      scanId,
      website: values.website,
      mode: "mock",
      generatedAt: submittedAt,
      overallScore,
      overallStatus,
      overallExplanation:
        scoreExplanation.whyThisScore,
      scoringConfidence: scoringEvidenceState.scoringConfidence,
      scoringConfidenceNote: scoringEvidenceState.scoringConfidenceNote,
      scoreMismatchWarnings,
      evidenceState: scoringEvidenceState,
      scoreExplanation,
      scoreExplanationSnapshot,
      scoreNarrative,
      positiveUxSignals,
      ecommerceMaturity,
      scanCoverage,
      summary:
        isNonStorefrontClassification(siteClassification.siteType)
          ? "This submitted URL does not expose enough product, cart, checkout, or catalog evidence to treat it as an ecommerce storefront. Findings should focus on page purpose, lead/contact flow, and manual confirmation before making ecommerce assumptions."
          : scoringEvidenceState.scoringConfidence === "Low"
          ? "Some scanner subsystems could not evaluate this page. Findings should be treated as directional until visual and DOM extraction complete successfully."
          : "This internal review uses public-page diagnostics and rule-based ecommerce heuristics. Findings should guide practical review priorities while uncertain signals remain marked for manual confirmation.",
      executiveSummary,
      auditNarrative,
      currentNarrativeArchetype: narrativeProfile.archetype,
      narrativeProfile,
      storefrontIdentityProfile: identityProfile,
      storefrontReviewContext,
      siteType: narrativeProfile.narrativeMode,
      siteTypeReason: narrativeProfile.narrativeProfileSummary,
      connectedInsight,
      primaryOperationalConcern,
      topPriorityRisks,
      heuristicFindings: heuristicFindingsWithRevenueImpact,
      visualUxDiagnostics,
      visualMetricsDebug: visualUxDiagnostics.visualMetricsDebug,
      diagnostics,
      categories,
      recommendedNextSteps,
      recommendationRoadmap,
      benchmarkTags: benchmarkContext.benchmarkTags,
      benchmarkContext,
      submittedPageType: pageTypeDetection,
      competitiveComparison,
      revenueImpactSummary,
    };

    await logAuditScan({
      scanId,
      url: values.website,
      score: overallScore,
      status: overallStatus,
      primaryConcern: primaryConcernTitle,
      archetype: intelligence.archetype,
      industry: intelligence.industry,
      platform: intelligence.platform,
      siteType: narrativeProfile.narrativeMode,
      siteTypeConfidenceLabel: siteClassification.confidenceLabel,
      siteTypeConfidenceScore: siteClassification.confidenceScore,
      siteTypeEvidence: siteClassification.evidence,
      ecommerceProbabilityLabel:
        diagnostics.platformDetection.ecommerceProbability.label,
      ecommerceProbabilityScore:
        diagnostics.platformDetection.ecommerceProbability.probability,
      platformConfidenceLabel: diagnostics.platformDetection.confidenceLabel,
      platformConfidenceScore: diagnostics.platformDetection.confidence,
      platformEvidence: diagnostics.platformDetection.evidence,
      narrativeMode: narrativeProfile.narrativeMode,
      businessContext: narrativeProfile.businessContext,
      recommendedActionStyle: narrativeProfile.recommendedActionStyle,
      trafficReadiness: intelligence.trafficReadiness,
      trackingReadiness: intelligence.trackingReadiness,
      trustReadiness: intelligence.trustReadiness,
      checkoutReadiness: intelligence.checkoutReadiness,
      mobileReadiness: intelligence.mobileReadiness,
      visualUxScore: visualUxDiagnostics.score ?? undefined,
      visualUxFindings: visualUxDiagnostics.findings,
      visualUxSummary: visualUxDiagnostics.summary,
      visualUxMobileConcerns: visualUxDiagnostics.mobileConcerns,
      visualUxDesktopConcerns: visualUxDiagnostics.desktopConcerns,
      topIssues: topPriorityRisks.slice(0, 3).map((risk) => ({
        title: risk.title,
        riskLabel: risk.riskLabel,
        severity: risk.severity,
        confidence: risk.confidence,
        revenueImpact: revenueImpactSummary.estimates.find(
          (estimate) => estimate.findingTitle === risk.riskLabel || estimate.findingTitle === risk.title,
        ),
      })),
      benchmarkTags: benchmarkContext.benchmarkTags,
      benchmarkGroup: benchmarkContext.benchmarkGroup,
      benchmarkPercentileEstimate: benchmarkContext.percentileEstimate,
      benchmarkLabel: benchmarkContext.benchmarkLabel,
      benchmarkExplanation: benchmarkContext.explanation,
      submittedPageType: pageTypeDetection.submittedPageType,
      submittedPageTypeConfidence: pageTypeDetection.confidence,
      submittedPageTypeEvidence: pageTypeDetection.evidence,
      scoringConfidence: scoringEvidenceState.scoringConfidence,
      revenueRiskAreas: revenueImpactSummary.revenueRiskAreas,
      recommendationRoadmap,
      competitiveContext: competitiveComparison,
      scanCoverage,
    });
    const scoreChangeContext = await buildScoreChangeContext(values.website);

    if (scoreChangeContext) {
      audit = {
        ...audit,
        scoreNarrative: {
          ...audit.scoreNarrative,
          scoreChangeContext,
        },
      };
    }

    finalizeScannerDiagnostics(diagnostics.scanDiagnostics, {
      success: true,
      finalUrl: diagnostics.finalUrl || values.website,
      reportGenerationMs: Date.now() - reportGenerationStart,
    });
    await saveScannerDebugRecord(
      buildScannerDebugRecord({
        url: values.website,
        success: true,
        score: overallScore,
        visualUxScore: visualUxDiagnostics.score,
        visualMetricsAvailable: visualUxDiagnostics.visualMetricsAvailable,
        visualUxConfidence: visualUxDiagnostics.visualUxConfidence,
        scoringConfidence: scoringEvidenceState.scoringConfidence,
        scoreMismatchWarnings,
        siteType: siteClassification.siteType,
        status: overallStatus,
        diagnostics,
      }),
    );

    return NextResponse.json(
      {
        success: true,
        audit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ecommerce audit scanner error:", error);
    const rootCause = {
      category: "Report generation failed",
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      failedUrl: latestDiagnostics?.finalUrl ?? submittedWebsite,
      elapsedTimeMs: 0,
      stage: "report_generation" as const,
    };

    if (latestDiagnostics?.scanDiagnostics) {
      addScannerStageLog(
        latestDiagnostics.scanDiagnostics,
        "report_generation",
        rootCause.category,
        {
          level: "error",
          url: latestDiagnostics.finalUrl || submittedWebsite,
        },
      );
      latestDiagnostics.scanDiagnostics.error = rootCause;
      finalizeScannerDiagnostics(latestDiagnostics.scanDiagnostics, {
        success: false,
      });
    }

    await saveScannerDebugRecord(
      buildScannerDebugRecord({
        url: submittedWebsite,
        success: false,
        score: latestScore,
        status: latestStatus ?? "Report generation failed",
        rootCause,
        diagnostics: latestDiagnostics,
      }),
    );

    return NextResponse.json(
      {
        success: false,
        error: "Report generation failed",
        rootCause,
      },
      { status: 500 }
    );
  }
}

function unsupportedMethod() {
  return NextResponse.json(methodNotAllowedResponse(), {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export const GET = unsupportedMethod;
export const PUT = unsupportedMethod;
export const PATCH = unsupportedMethod;
export const DELETE = unsupportedMethod;
export const OPTIONS = unsupportedMethod;
