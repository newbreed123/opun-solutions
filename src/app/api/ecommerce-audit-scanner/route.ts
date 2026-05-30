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
  runLightweightEcommerceDiagnostics,
  type LiveDiagnosticsResult,
} from "@/lib/ecommerce-audit-scanner";
import {
  buildExecutiveOpportunityText,
  sanitizeEvidenceText,
  summarizeCtaLabels,
} from "@/lib/evidence-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  recommendedFirstAction: string;
};

type ScoreExplanation = {
  whyAssigned: string;
  evidenceInfluenced: string;
  whatWouldImprove: string;
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
  summary: string;
  notes: BenchmarkNote[];
  benchmarkTags: string[];
  recurringPositivePatterns: string[];
  recurringNegativePatterns: string[];
  signalScore: number;
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

const knownEducationContentDomains = [
  "pearson.com",
  "education.adp.com",
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

function classifyStorefrontReviewContext({
  website,
  diagnostics,
}: {
  website: string;
  diagnostics: LiveDiagnosticsResult;
}): StorefrontReviewContext {
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
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const supportingSignals: string[] = [];

  const isKnownEnterprise = domainMatches(domain, knownEnterpriseRetailDomains);
  const isKnownEducationContent = domainMatches(domain, knownEducationContentDomains);
  const platformIsEnterprise = platform.name === "Enterprise / Custom Commerce Stack";
  const cartOrCheckoutVisible = commerce.cartVisible || commerce.checkoutVisible;
  const catalogSignalsVisible =
    commerce.productCatalogVisible ||
    storefront.productNavigationVisible ||
    storefront.collectionLinksVisible ||
    storefront.searchVisible;
  const productCatalogPathVisible =
    commerce.productCatalogVisible ||
    storefront.productNavigationVisible ||
    storefront.collectionLinksVisible;
  const leadPathVisible = commerce.formVisible || storefront.leadCaptureVisible;
  const ctaVisible = commerce.ctaVisible || commerce.ctaCount > 0;
  const hasStandardPlatformConfidence =
    platform.name !== "Unknown" &&
    platform.name !== "Needs Manual Review" &&
    platform.name !== "Enterprise / Custom Commerce Stack" &&
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
  ]);

  if (isKnownEnterprise) {
    supportingSignals.push("Known major enterprise retail domain.");
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
    return {
      siteType: platformIsEnterprise ? "custom-enterprise" : "enterprise-retail",
      confidence: catalogSignalsVisible || hasCommerceLanguage ? "High" : "Moderate",
      reason:
        "The public page appears to be part of a large or custom commerce environment where platform and purchase-path details may be intentionally abstracted.",
      supportingSignals: supportingSignals.slice(0, 5),
    };
  }

  if (
    cartOrCheckoutVisible &&
    hasCommerceLanguage &&
    (productCatalogPathVisible || hasStandardPlatformConfidence)
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

  if ((leadPathVisible || ctaVisible || hasLeadGenLanguage) && !cartOrCheckoutVisible && !catalogSignalsVisible) {
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
): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);

  const addFinding = (finding: HeuristicFinding) =>
    findings.push({
      ...finding,
      evidenceSummary: sanitizeEvidenceText(finding.evidenceSummary),
      recommendedFirstAction: sanitizeEvidenceText(
        finding.recommendedFirstAction,
        { maxLength: 220 },
      ),
    });

  if (!signals.mobileCtaVisibleAboveFold) {
    addFinding({
      title: "Mobile CTA Visibility Needs Review",
      category: "mobileConversion",
      primaryCategory: "conversionIssues",
      secondaryCategories: ["uxUiIssues"],
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Primary mobile CTA visibility may weaken after the hero section, making the next step less obvious for mobile shoppers.",
      recommendedFirstAction: mobileCtaFirstAction(diagnostics),
      evidenceSummary:
        `No strong CTA was detected in the first mobile viewport. ${summarizeCtaLabels(commerce.ctaLabels)} Mobile first-screen links: ${signals.mobileAboveFoldLinkCount}.`,
    });
  }

  if (signals.mobileCrowdingRisk) {
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

  if (!commerce.cartVisible || !commerce.checkoutVisible) {
    addFinding({
      title: "Cart / Checkout Path Needs Review",
      category: "operationsContinuity",
      primaryCategory: "conversionIssues",
      secondaryCategories: ["operationsIssues"],
      severity: !commerce.cartVisible && !commerce.checkoutVisible ? "Critical" : "High",
      confidence: "Moderate",
      businessImpact:
        "If cart or checkout cues are not easy to find, purchase intent can leak before a customer reaches the buying path.",
      recommendedFirstAction: cartCheckoutFirstAction(diagnostics),
      evidenceSummary: `Cart visibility: ${commerce.cartVisible ? "visible" : "not visible"}; checkout visibility: ${commerce.checkoutVisible ? "visible" : "not visible"}.`,
    });
  }

  if (!signals.productNavigationVisible || !signals.collectionLinksVisible) {
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

  if (!signals.searchVisible) {
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

  if (trustSignalsVisible <= 2) {
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

  if (!signals.shippingReturnsVisible) {
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

  if (marketingTools.length === 0) {
    addFinding({
      title: "Marketing Attribution Visibility Appears Limited",
      category: "marketingVisibility",
      primaryCategory: "trackingIssues",
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Limited visible analytics or marketing tags can make campaign performance harder to trust before increasing spend.",
      recommendedFirstAction:
        "Verify GA4/GTM, ad pixels, email capture, and purchase or lead conversion events before scaling paid traffic.",
      evidenceSummary:
        "No supported marketing tools were detected from public page markup, visible DOM content, or loaded frontend assets.",
    });
  } else if (marketingTools.length === 1) {
    addFinding({
      title: "Tracking Stack Appears Limited",
      category: "marketingVisibility",
      primaryCategory: "trackingIssues",
      severity: "Medium",
      confidence: "Moderate",
      businessImpact:
        "A thin visible tracking stack may leave gaps in attribution, retargeting, or customer follow-up visibility.",
      recommendedFirstAction:
        "Map the visible tag to the full purchase path and confirm whether missing analytics, pixel, or email events are intentionally handled server-side.",
      evidenceSummary: `Visible supported marketing tool: ${marketingTools[0].label}.`,
    });
  }

  if (!signals.leadCaptureVisible && !signals.contactSupportVisible) {
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

  if (!signals.orderReturnsLanguageVisible) {
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

  if (platformNeedsManualReview(diagnostics)) {
    addFinding({
      title: "Platform Visibility Needs Manual Review",
      category: "platformVisibility",
      primaryCategory: "technicalIssues",
      severity: "Medium",
      confidence: "Needs Review",
      businessImpact:
        "Platform-specific recommendations should wait until the storefront foundation is confirmed.",
      recommendedFirstAction:
        "Confirm platform clues from source assets, cart and checkout URLs, product URL patterns, and admin or team knowledge before making platform-specific recommendations.",
      evidenceSummary:
        diagnostics.platformDetection.explanation ??
        "The scanner did not find enough reliable public-page evidence to confidently identify the platform.",
    });
  }

  if (!diagnostics.metaDescription) {
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
) {
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalsVisible = trustSignalCount(diagnostics);
  const categoryFindings = findingsInfluencingCategory(
    findings,
    key as AuditCategoryKey,
  );
  const findingPressure = Math.min(
    14,
    categoryFindings.reduce(
      (total, finding) => total + Math.ceil(severityWeight(finding.severity) / 2),
      0,
    ),
  );

  if (key === "uxUiIssues") {
    return (
      findingPressure +
      (!signals.mobileCtaVisibleAboveFold ? 5 : 0) +
      (signals.mobileCrowdingRisk ? 4 : 0) +
      (!signals.productNavigationVisible ? 4 : 0) +
      (!signals.collectionLinksVisible ? 3 : 0) +
      (!signals.searchVisible ? 2 : 0) +
      Math.min(4, Math.floor(signals.mobileAboveFoldLinkCount / 18)) +
      Math.min(3, signals.genericNavigationCount) +
      (signals.mobileVisibleTextLength > 2400 ? 3 : signals.mobileVisibleTextLength > 1600 ? 2 : 0) +
      (commerce.ctaCount === 0 ? 2 : commerce.ctaCount === 1 ? 1 : 0)
    );
  }

  if (key === "conversionIssues") {
    return (
      findingPressure +
      (6 - trustSignalsVisible) * 2 +
      (!signals.shippingReturnsVisible ? 4 : 0) +
      (!signals.contactSupportVisible ? 3 : 0) +
      (!signals.warrantyGuaranteeVisible ? 2 : 0) +
      (!signals.policyVisible ? 2 : 0) +
      (!signals.paymentTrustVisible ? 3 : 0) +
      (!signals.reviewSignalsVisible ? 2 : 0) +
      (!signals.mobileCtaVisibleAboveFold ? 3 : 0)
    );
  }

  if (key === "technicalIssues") {
    return (
      findingPressure +
      (diagnostics.title ? 0 : 3) +
      (diagnostics.metaDescription ? 0 : 3) +
      (platformNeedsManualReview(diagnostics) ? 8 : 0) +
      (diagnostics.platformDetection.confidence > 0 && diagnostics.platformDetection.confidence < 65 ? 3 : 0) +
      (diagnostics.platformDetection.confidenceLabel === "Moderate confidence" ? 1 : 0) +
      Math.min(10, diagnostics.consoleErrors.length * 3) +
      Math.min(7, diagnostics.failedRequests.length * 2)
    );
  }

  if (key === "trackingIssues") {
    return (
      findingPressure +
      (marketingTools.length === 0 ? 18 : marketingTools.length === 1 ? 10 : marketingTools.length === 2 ? 5 : 0) +
      (!signals.leadCaptureVisible ? 3 : 0) +
      (!signals.contactSupportVisible ? 2 : 0) +
      Math.min(5, diagnostics.consoleErrors.length) +
      Math.min(4, diagnostics.failedRequests.length)
    );
  }

  return (
    findingPressure +
    (!commerce.cartVisible ? 9 : 0) +
    (!commerce.checkoutVisible ? 9 : 0) +
    (!signals.contactSupportVisible ? 5 : 0) +
    (!signals.orderReturnsLanguageVisible ? 5 : 0) +
    (!signals.shippingReturnsVisible ? 3 : 0) +
    (!signals.leadCaptureVisible ? 2 : 0) +
    (!signals.policyVisible ? 2 : 0) +
    (!signals.searchVisible && commerce.productCatalogVisible ? 1 : 0)
  );
}

function buildScoreExplanation({
  key,
  score,
  diagnostics,
  findings,
}: {
  key: string;
  score: number;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
}): ScoreExplanation {
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
    return {
      whyAssigned: `Assigned as ${scoreBand} because mobile CTA, navigation, search, and first-screen density signals were evaluated together.`,
      evidenceInfluenced: driver
        ? `${driver}; search visible: ${signals.searchVisible ? "yes" : "no"}; first-screen links: ${signals.mobileAboveFoldLinkCount}; first-screen text estimate: ${signals.mobileVisibleTextLength} characters.${secondaryContext}`
        : `Search visible: ${signals.searchVisible ? "yes" : "no"}; first-screen links: ${signals.mobileAboveFoldLinkCount}; generic navigation cues: ${signals.genericNavigationCount}; first-screen text estimate: ${signals.mobileVisibleTextLength} characters.${secondaryContext}`,
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

function applyLiveDiagnosticScoring(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
) {
  return auditCategoryTemplates.map((category) => {
    const categoryFindings = findingsOwnedByCategory(findings, category.key);
    const influencingFindings = findingsInfluencingCategory(findings, category.key);
    const score = Math.max(
      35,
      Math.min(96, category.score - categoryEvidencePenalty(category.key, diagnostics, findings)),
    );
    const scoreExplanation = buildScoreExplanation({
      key: category.key,
      score,
      diagnostics,
      findings,
    });
    const statusDetail =
      categoryFindings[0]?.title ??
      categoryStatusDetailFallback(category.key, score, diagnostics);

    return {
      ...category,
      score,
      status: adjustedStatus(score),
      statusDetail,
      priority: adjustedPriority(score),
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

function buildExecutiveSummary({
  categories,
  diagnostics,
  findings,
  overallScore,
  identityProfile,
  reviewContext,
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
  identityProfile: StorefrontIdentityProfile;
  reviewContext: StorefrontReviewContext;
}) {
  const profile = resolveNarrativeArchetype({ categories, diagnostics, findings });
  const weightedFindings = narrativeSortedFindings(findings, profile.archetype);
  const siteTypeSummary = buildSiteTypeExecutiveSummary({
    reviewContext,
    diagnostics,
    findings: weightedFindings,
  });

  if (siteTypeSummary) {
    return {
      ...siteTypeSummary,
      summary: sanitizeEvidenceText(
        `${identityProfile.identitySummary} ${siteTypeSummary.summary}`,
      ),
      businessInterpretation: sanitizeEvidenceText(siteTypeSummary.businessInterpretation),
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

  const topFindings = findings.slice(0, 3);
  const businessInterpretation = `${profile.toneHints.interpretation} Review the strongest visible findings and verify them against the customer journey before making deeper recommendations.`;

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
): PrimaryOperationalConcern | null {
  const weightedFindings = narrativeSortedFindings(findings, profile.archetype);
  const connectedFindings = connectedInsight
    ? connectedInsight.findingTitles
        .map((title) => findByTitle(findings, title))
        .filter((finding): finding is HeuristicFinding => Boolean(finding))
    : [];
  const leadCandidate = weightedFindings[0];
  const supportingFindings =
    connectedFindings.some((finding) => finding.title === leadCandidate?.title)
      ? narrativeSortedFindings(connectedFindings, profile.archetype)
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
    connectedInsight && supportingFindings.some((finding) => connectedInsight.findingTitles.includes(finding.title))
      ? connectedInsight.insight
      : `The dominant ${profile.archetype.replace(/-/g, " ")} pattern should lead the review before secondary issues are treated as the main story.`;

  const firstAction = buildIdentityAwareFirstAction(
    leadFinding.recommendedFirstAction,
    identityProfile,
  );

  return {
    title: concernTitle,
    riskLabel: concernTitle,
    severity: leadFinding.severity,
    confidence: leadFinding.confidence,
    explanation: `${concernInsight} Supporting findings: ${relatedPhrase}. Addressing this first should clarify the customer journey before lower-impact refinements are prioritized.`,
    evidenceSummary: sanitizeEvidenceText(
      supportingFindings
        .map((finding) => finding.evidenceSummary)
        .slice(0, 2)
        .join(" "),
    ),
    recommendedFirstAction: sanitizeEvidenceText(
      `${firstAction} Then confirm the related ${relatedTitles.length > 1 ? "signals" : "signal"} in the same journey walkthrough.`,
      { maxLength: 240 },
    ),
    supportingFindings: relatedTitles,
  };
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

function assertNarrativeSpecificity({
  narrative,
  reviewContext,
}: {
  narrative: string;
  reviewContext: StorefrontReviewContext;
}) {
  const genericTemplatePattern =
    /lead issue for this|secondary issues to keep in view|this scan reads like/i;
  const ecommerceFlowPattern = /checkout|cart|purchase path|storefront journey/i;

  if (genericTemplatePattern.test(narrative)) {
    return reviewContext.siteType === "non-ecommerce-or-unclear"
      ? buildNonEcommerceNarrative({ reviewContext })
      : narrative.replace(genericTemplatePattern, "").trim();
  }

  if (
    reviewContext.siteType === "non-ecommerce-or-unclear" &&
    ecommerceFlowPattern.test(narrative)
  ) {
    return buildNonEcommerceNarrative({ reviewContext });
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
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
  connectedInsight: ConnectedInsight | null;
  identityProfile: StorefrontIdentityProfile;
  reviewContext: StorefrontReviewContext;
}) {
  const profile = resolveNarrativeArchetype({ categories, diagnostics, findings });
  const priorityFindings = narrativeSortedFindings(findings, profile.archetype).slice(0, 4);
  const narrative = buildSiteTypeAuditNarrative({
    diagnostics,
    priorityFindings,
    connectedInsight,
    identityProfile,
    profile,
    reviewContext,
  });

  return sanitizeEvidenceText(
    assertNarrativeSpecificity({ narrative, reviewContext }),
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
) {
  const priorityFindings = narrativeSortedFindings(findings, profile.archetype).slice(0, 3);

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
) {
  if (findings.length === 0) {
    return [
      {
        title: "Manual Customer Journey Confirmation",
        evidenceClue:
          "No single high-impact public-page issue crossed the scanner threshold.",
        action:
          "Manually review the homepage, product discovery path, cart, checkout, and support links.",
        why: "The public-page heuristics did not surface a high-impact issue, so manual journey confirmation is the safest next step.",
      },
    ];
  }

  const sortedFindings = narrativeSortedFindings(findings, profile.archetype);
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

  for (const finding of sortedFindings) {
    if (selected.length >= 3) {
      break;
    }

    if (!selected.includes(finding)) {
      selected.push(finding);
    }
  }

  return selected.slice(0, 3).map((finding) => ({
    title: finding.title,
    evidenceClue: finding.evidenceSummary,
    action: finding.recommendedFirstAction,
    why: finding.businessImpact,
  }));
}

function pushUnique(items: string[], item: string) {
  if (!items.includes(item)) {
    items.push(item);
  }
}

function buildBenchmarkContext(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
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

  const mobileIsStrong =
    signals.mobileCtaVisibleAboveFold &&
    !signals.mobileCrowdingRisk &&
    signals.mobileAboveFoldLinkCount <= 18 &&
    signals.mobileVisibleTextLength <= 1800;
  const mobileIsWeak =
    has("Mobile CTA Visibility Needs Review") ||
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

  return {
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
            : "a brand-focused commerce storefront";

  const maturityPhrase =
    commerceMaturity === "advanced"
      ? "It shows a more mature purchase and measurement footprint."
      : commerceMaturity === "moderate"
        ? "It appears to have a moderate visible commerce path."
        : "It is still in an early or lightly signaled commerce phase.";

  return `The storefront reads like ${scalePhrase}; ${maturityPhrase}`;
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

  return "This storefront should be reviewed in the context of its visible commerce and trust signals.";
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

  return "Treat the findings as connected signals that should be validated in a manual storefront walkthrough.";
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
  const platform = diagnostics.platformDetection;

  const hostIsEnterprise = /(?:amazon|walmart|target|costco|bestbuy|homedepot|lowes|sears|macys|nike|adidas|apple|microsoft|google|intel|dell|hp|ikea|verizon|att|samsung|sony)/i.test(host);
  const educationHost = /(?:\.edu|academy|course|learning|training|university|college)/i.test(host);
  const platformIsCustomEnterprise =
    platform.name === "Enterprise / Custom Commerce Stack" ||
    platform.name === "Unknown" ||
    platform.confidence < 60;
  const commercePathVisible =
    commerce.cartVisible ||
    commerce.checkoutVisible ||
    signals.productNavigationVisible ||
    signals.collectionLinksVisible ||
    signals.searchVisible;
  const trackingDepth = marketingTools.length;
  const hasLeadCapture = signals.leadCaptureVisible;

  const businessScale =
    hostIsEnterprise
      ? "enterprise"
      : educationHost
        ? "education"
        : hasLeadCapture
          ? "lead-capture"
          : commercePathVisible
            ? "growth"
            : "brand";

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
        : "early";

  const operationalPattern =
    hostIsEnterprise
      ? "enterprise-retail"
      : educationHost
        ? "education-commerce"
        : hasLeadCapture
          ? "lead-capture"
          : signals.productNavigationVisible || signals.collectionLinksVisible || signals.searchVisible
            ? "catalog-commerce"
            : "brand-commerce";

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

export async function POST(request: Request) {
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
    const diagnostics = await runLightweightEcommerceDiagnostics(values.website);

    if (diagnostics.scanError) {
      return NextResponse.json(
        {
          success: false,
          error: diagnostics.scanError,
          diagnostics,
        },
        { status: 502 },
      );
    }

    const heuristicFindings = buildHeuristicFindings(diagnostics);
    const categories = applyLiveDiagnosticScoring(diagnostics, heuristicFindings);
    const overallScore = Math.round(
      categories.reduce((total, category) => total + category.score, 0) /
        categories.length,
    );
    const narrativeProfile = resolveNarrativeArchetype({
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
    const executiveSummary = buildExecutiveSummary({
      categories,
      diagnostics,
      findings: heuristicFindings,
      overallScore,
      identityProfile,
      reviewContext: storefrontReviewContext,
    });
    const connectedInsight = buildConnectedInsight(heuristicFindings);
    const auditNarrative = buildAuditNarrative({
      categories,
      diagnostics,
      findings: heuristicFindings,
      overallScore,
      connectedInsight,
      identityProfile,
      reviewContext: storefrontReviewContext,
    });
    const primaryOperationalConcern = buildPrimaryOperationalConcern(
      heuristicFindings,
      connectedInsight,
      narrativeProfile,
      identityProfile,
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
      narrativeProfile,
    );
    const recommendedNextSteps = buildRecommendedNextSteps(
      heuristicFindings,
      narrativeProfile,
    );
    const benchmarkContext = buildBenchmarkContext(diagnostics, heuristicFindings);

    logDevelopmentSubmission("Ecommerce audit scanner", {
      website: values.website,
      submittedAt,
      scannerMode: "mock",
    });

    return NextResponse.json(
      {
        success: true,
        audit: {
          website: values.website,
          mode: "mock",
          generatedAt: submittedAt,
          overallScore,
          overallStatus: adjustedStatus(overallScore),
          overallExplanation:
            "The report combines lightweight live diagnostics with ecommerce heuristics for customer journey, trust, discovery, tracking, and operational visibility.",
          summary:
            "This internal review uses public-page diagnostics and rule-based ecommerce heuristics. Findings should guide practical review priorities while uncertain signals remain marked for manual confirmation.",
          executiveSummary,
          auditNarrative,
          currentNarrativeArchetype: narrativeProfile.archetype,
          storefrontIdentityProfile: identityProfile,
          storefrontReviewContext,
          siteType: storefrontReviewContext.siteType,
          siteTypeReason: storefrontReviewContext.reason,
          connectedInsight,
          primaryOperationalConcern,
          topPriorityRisks,
          heuristicFindings,
          diagnostics,
          categories,
          recommendedNextSteps,
          benchmarkTags: benchmarkContext.benchmarkTags,
          benchmarkContext,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ecommerce audit scanner error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Sorry, we could not generate the audit preview right now. Please try again in a moment.",
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
