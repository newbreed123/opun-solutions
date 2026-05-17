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

type HeuristicFinding = {
  title: string;
  category: HeuristicCategory;
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

const auditCategoryTemplates = [
  {
    key: "uxUiIssues",
    label: "UX/UI",
    score: 88,
    findingCategories: ["mobileConversion", "productDiscovery"],
  },
  {
    key: "conversionIssues",
    label: "Conversion",
    score: 86,
    findingCategories: ["trustSignals", "mobileConversion"],
  },
  {
    key: "technicalIssues",
    label: "Technical",
    score: 84,
    findingCategories: ["platformVisibility", "metadataClarity"],
  },
  {
    key: "trackingIssues",
    label: "Tracking",
    score: 84,
    findingCategories: ["marketingVisibility"],
  },
  {
    key: "operationsIssues",
    label: "Ecommerce Operations",
    score: 86,
    findingCategories: ["operationsContinuity"],
  },
];

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
    finding.category === "mobileConversion" ||
    finding.category === "operationsContinuity"
      ? 3
      : finding.category === "trustSignals" ||
          finding.category === "productDiscovery" ||
          finding.category === "marketingVisibility"
        ? 2
        : 1;

  return impactRank(finding.severity) * 10 + categoryWeight + confidenceRank(finding.confidence);
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
  const labels = diagnostics.commerceFlowSignals.ctaLabels.slice(0, 2);

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

  const addFinding = (finding: HeuristicFinding) => findings.push(finding);

  if (!signals.mobileCtaVisibleAboveFold) {
    addFinding({
      title: "Mobile CTA Visibility Needs Review",
      category: "mobileConversion",
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Primary mobile CTA visibility may weaken after the hero section, making the next step less obvious for mobile shoppers.",
      recommendedFirstAction: mobileCtaFirstAction(diagnostics),
      evidenceSummary:
        `No strong CTA was detected in the first mobile viewport. Desktop CTA labels sampled: ${visibleEvidenceList(commerce.ctaLabels.slice(0, 4))}; mobile first-screen links: ${signals.mobileAboveFoldLinkCount}.`,
    });
  }

  if (signals.mobileCrowdingRisk) {
    addFinding({
      title: "Mobile Readability May Be Crowded",
      category: "mobileConversion",
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
  const categoryFindings = findings.filter((finding) => {
    const template = auditCategoryTemplates.find((item) => item.key === key);
    return template?.findingCategories.includes(finding.category) ?? false;
  });
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
  const categoryFindings = findings.filter((finding) => {
    const template = auditCategoryTemplates.find((item) => item.key === key);
    return template?.findingCategories.includes(finding.category) ?? false;
  });
  const driver = categoryFindings[0]?.title;
  const scoreBand =
    score < 65 ? "high-priority" : score < 80 ? "needs-review" : "healthy";

  if (key === "uxUiIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} because mobile CTA, navigation, search, and first-screen density signals were evaluated together.`,
      evidenceInfluenced: driver
        ? `${driver}; mobile CTA above fold: ${signals.mobileCtaVisibleAboveFold ? "yes" : "no"}; search visible: ${signals.searchVisible ? "yes" : "no"}; first-screen links: ${signals.mobileAboveFoldLinkCount}; first-screen text estimate: ${signals.mobileVisibleTextLength} characters.`
        : `Mobile CTA above fold: ${signals.mobileCtaVisibleAboveFold ? "yes" : "no"}; search visible: ${signals.searchVisible ? "yes" : "no"}; first-screen links: ${signals.mobileAboveFoldLinkCount}; generic navigation cues: ${signals.genericNavigationCount}.`,
      whatWouldImprove:
        "A clearer first-screen CTA, lighter mobile header density, visible search, and clearer product/category paths would raise this score.",
    };
  }

  if (key === "conversionIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} based on visible reassurance, CTA clarity, and purchase-confidence cues.`,
      evidenceInfluenced: `${trustSignalsVisible} of 6 trust-signal groups were visible; missing or weak groups: ${missingTrustSignalLabels(diagnostics)}; mobile CTA above fold: ${signals.mobileCtaVisibleAboveFold ? "yes" : "no"}.`,
      whatWouldImprove:
        "More visible reviews, shipping/returns clarity, payment reassurance, support, and policy cues near product decisions would improve it.",
    };
  }

  if (key === "technicalIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} from platform confidence, metadata, console errors, and failed request evidence.`,
      evidenceInfluenced: `Platform: ${diagnostics.platformDetection.name} (${diagnostics.platformDetection.confidenceLabel}, ${diagnostics.platformDetection.confidence}%); console errors: ${diagnostics.consoleErrors.length}; failed requests: ${diagnostics.failedRequests.length}.`,
      whatWouldImprove:
        "Clearer platform evidence, clean metadata, fewer console errors, and fewer failed frontend requests would improve this score.",
    };
  }

  if (key === "trackingIssues") {
    return {
      whyAssigned: `Assigned as ${scoreBand} from visible analytics, tag manager, pixel, and email/lead-capture signals.`,
      evidenceInfluenced: `Detected ${marketingTools.length} supported marketing tool${marketingTools.length === 1 ? "" : "s"}: ${visibleEvidenceList(marketingTools.map((tool) => tool.label))}. Lead capture visible: ${signals.leadCaptureVisible ? "yes" : "no"}.`,
      whatWouldImprove:
        "Visible GA4/GTM, ad pixels, email capture, and confirmed conversion events across the buying path would improve this score.",
    };
  }

  return {
    whyAssigned: `Assigned as ${scoreBand} from cart, checkout, support, returns, and order communication visibility.`,
    evidenceInfluenced: `Cart: ${commerce.cartVisible ? "visible" : "not visible"}; checkout: ${commerce.checkoutVisible ? "visible" : "not visible"}; support/contact: ${signals.contactSupportVisible ? "visible" : "not visible"}; order/returns language: ${signals.orderReturnsLanguageVisible ? "visible" : "not visible"}.`,
    whatWouldImprove:
      "Clear cart and checkout entry points, visible support, and accessible shipping, returns, and order-status communication would improve it.",
  };
}

function applyLiveDiagnosticScoring(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
) {
  return auditCategoryTemplates.map((category) => {
    const categoryFindings = findings.filter((finding) =>
      category.findingCategories.includes(finding.category),
    );
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
          : ["No high-impact public-page issue was detected in this category during the lightweight review."],
      findings: categoryFindings,
    };
  });
}

function buildExecutiveSummary({
  categories,
  diagnostics,
  findings,
  overallScore,
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
}) {
  const highestImpactFindings = findings.slice(0, 3);
  const diagnosticFlags = [
    !diagnostics.title ? "missing page title" : "",
    !diagnostics.metaDescription ? "missing meta description" : "",
    diagnostics.consoleErrors.length > 0 ? "console errors" : "",
    diagnostics.failedRequests.length > 0 ? "failed network requests" : "",
  ].filter(Boolean);

  const condition =
    overallScore < 65
      ? "This store should be treated as a high-priority systems review before more traffic is pushed into the funnel."
      : overallScore < 80
        ? "This store has a workable foundation, but several conversion, tracking, or operations signals need review before scaling."
        : "This store appears to have a healthy foundation, with the biggest value likely coming from focused optimization rather than urgent repair.";

  const diagnosticsSentence =
    diagnosticFlags.length > 0
      ? `The live diagnostics flagged ${diagnosticFlags.join(", ")}, which may create uncertainty for conversion measurement or page reliability.`
      : "The lightweight live diagnostics did not detect critical console or metadata issues during this scan.";

  const platformSentence =
    diagnostics.platformDetection.name !== "Unknown"
      ? `The scan detected ${diagnostics.platformDetection.name} as the likely storefront platform with ${diagnostics.platformDetection.confidenceLabel.toLowerCase()} (${diagnostics.platformDetection.confidence}%).`
      : "Platform visibility is limited and should be manually confirmed before making platform-specific recommendations.";

  const flowSentence =
    diagnostics.commerceFlowSignals.checkoutVisible || diagnostics.commerceFlowSignals.cartVisible
      ? "The cart and checkout path are visible enough to suggest a working commerce flow in this review."
      : "Commerce flow signals are not clearly visible, which can make it harder to assess checkout readiness and conversion friction.";

  const prioritySentence =
    highestImpactFindings.length > 0
      ? `The highest-impact review items are ${highestImpactFindings
          .map((finding) => finding.title.toLowerCase())
          .join(", ")}.`
      : "No high-impact public-page issue was detected, so the next review should focus on manual journey confirmation.";

  return {
    summary: `${condition} ${diagnosticsSentence} ${prioritySentence}`,
    highestImpactOpportunities:
      highestImpactFindings.length > 0
        ? highestImpactFindings.map(
            (finding) =>
              `${finding.title}: ${finding.evidenceSummary} ${finding.businessImpact} First action: ${finding.recommendedFirstAction}`,
          )
        : categories
            .slice()
            .sort((a, b) => a.score - b.score)
            .slice(0, 2)
            .map(
              (category) =>
                `${category.label}: manually confirm the customer journey because no high-impact heuristic finding was detected.`,
            ),
    businessInterpretation:
      `The practical business question is not only whether the storefront looks good, but whether visitors can understand the offer, move through the buying path, and leave clean data for the team to act on. ${platformSentence} ${flowSentence} Tracking and marketing tool visibility matters because it determines whether decision-makers can trust the conversion data and optimize media spend effectively.`,
  };
}

function buildAuditNarrative({
  diagnostics,
  findings,
  overallScore,
}: {
  diagnostics: LiveDiagnosticsResult;
  findings: HeuristicFinding[];
  overallScore: number;
}) {
  const priorityFindings = findings.slice(0, 3);
  const commerce = diagnostics.commerceFlowSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const commerceStructure =
    commerce.cartVisible || commerce.checkoutVisible || commerce.productCatalogVisible
      ? "visible commerce structure"
      : "limited visible commerce structure";
  const urgency =
    overallScore < 65
      ? "should be treated as a high-priority ecommerce systems review"
      : overallScore < 80
        ? "has a workable base, but needs focused review before scaling traffic"
        : "appears structurally healthy, with the best gains likely coming from focused optimization";
  const platformContext = platformNeedsManualReview(diagnostics)
    ? "Platform evidence needs manual confirmation before platform-specific fixes are planned."
    : `${diagnostics.platformDetection.name} evidence is visible enough to support a platform-aware discussion.`;
  const trackingContext =
    marketingTools.length === 0
      ? "Marketing attribution visibility appears limited in the loaded storefront."
      : `${marketingTools.length} supported marketing signal${marketingTools.length === 1 ? "" : "s"} ${marketingTools.length === 1 ? "was" : "were"} visible.`;

  if (priorityFindings.length === 0) {
    return `The store shows ${commerceStructure} and ${urgency}. No single public-page issue dominated the scan, so the next useful step is a manual walkthrough of product discovery, purchase path, support visibility, and tracking confidence. ${platformContext} ${trackingContext}`;
  }

  const focusAreas = priorityFindings
    .map((finding) => finding.title.toLowerCase())
    .join(", ");
  const highestImpact = priorityFindings[0];

  return `The store shows ${commerceStructure} and ${urgency}. The audit story is led by ${highestImpact.title.toLowerCase()}: ${highestImpact.evidenceSummary} The highest-value improvements appear to be ${focusAreas}. ${platformContext} ${trackingContext}`;
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
) {
  const priorityFindings = findings.slice(0, 3);

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

function buildRecommendedNextSteps(findings: HeuristicFinding[]) {
  const priorityFindings = findings
    .slice()
    .sort((a, b) => findingImpactScore(b) - findingImpactScore(a))
    .slice(0, 5);

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

  return priorityFindings.map((finding) => ({
    title: finding.title,
    evidenceClue: finding.evidenceSummary,
    action: finding.recommendedFirstAction,
    why: finding.businessImpact,
  }));
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
    const executiveSummary = buildExecutiveSummary({
      categories,
      diagnostics,
      findings: heuristicFindings,
      overallScore,
    });
    const auditNarrative = buildAuditNarrative({
      diagnostics,
      findings: heuristicFindings,
      overallScore,
    });
    const topPriorityRisks = buildTopPriorityRisks(heuristicFindings, categories);
    const recommendedNextSteps = buildRecommendedNextSteps(heuristicFindings);

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
          topPriorityRisks,
          heuristicFindings,
          diagnostics,
          categories,
          recommendedNextSteps,
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
