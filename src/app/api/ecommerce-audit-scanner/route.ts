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
  businessImpact: string;
  recommendedAction: string;
  evidenceSummary: string;
};

const auditCategoryTemplates = [
  {
    key: "uxUiIssues",
    label: "Mobile Journey Clarity",
    score: 72,
    explanation:
      "Looks at mobile action clarity, readability, navigation pressure, and whether customers can quickly see the next step.",
    findingCategories: ["mobileConversion", "productDiscovery"],
  },
  {
    key: "conversionIssues",
    label: "Purchase Confidence",
    score: 68,
    explanation:
      "Checks whether visible trust, support, policy, and action cues are strong enough to support buying confidence.",
    findingCategories: ["trustSignals", "mobileConversion"],
  },
  {
    key: "technicalIssues",
    label: "Storefront Signal Reliability",
    score: 78,
    explanation:
      "Reviews metadata, visible platform confidence, console diagnostics, and page reliability signals from the public storefront.",
    findingCategories: ["platformVisibility", "metadataClarity"],
  },
  {
    key: "trackingIssues",
    label: "Marketing Visibility Review",
    score: 70,
    explanation:
      "Checks whether common public marketing and follow-up tools are visible enough to support attribution review.",
    findingCategories: ["marketingVisibility"],
  },
  {
    key: "operationsIssues",
    label: "Checkout Path Visibility",
    score: 70,
    explanation:
      "Looks at cart, checkout, support, returns, and lead/contact workflow visibility for operational continuity.",
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
    diagnostics.platformDetection.confidenceLabel === "Low confidence" ||
    diagnostics.platformDetection.confidenceLabel === "Needs Review"
  );
}

function buildHeuristicFindings(
  diagnostics: LiveDiagnosticsResult,
): HeuristicFinding[] {
  const findings: HeuristicFinding[] = [];
  const signals = diagnostics.storefrontSignals;
  const commerce = diagnostics.commerceFlowSignals;
  const marketingTools = visibleMarketingTools(diagnostics);
  const trustSignalCount = [
    signals.reviewSignalsVisible,
    signals.shippingReturnsVisible,
    signals.warrantyGuaranteeVisible,
    signals.paymentTrustVisible,
    signals.contactSupportVisible,
    signals.policyVisible,
  ].filter(Boolean).length;

  const addFinding = (finding: HeuristicFinding) => findings.push(finding);

  if (!signals.mobileCtaVisibleAboveFold) {
    addFinding({
      title: "Mobile CTA Visibility Needs Review",
      category: "mobileConversion",
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Mobile visitors may need extra scrolling or decision effort before they see a clear action path.",
      recommendedAction:
        "Review the mobile hero and first screen; make the primary shopping or contact action clear before the customer has to hunt for it.",
      evidenceSummary:
        "No strong CTA label was detected in the first mobile viewport from the loaded public page.",
    });
  }

  if (signals.mobileCrowdingRisk) {
    addFinding({
      title: "Mobile Readability May Be Crowded",
      category: "mobileConversion",
      severity: "Medium",
      confidence: "Needs Review",
      businessImpact:
        "Crowded first-screen content can make it harder for customers to understand the offer and next action quickly.",
      recommendedAction:
        "Review the mobile screenshot for spacing, competing messages, and whether the primary action remains visually dominant.",
      evidenceSummary:
        "The mobile first screen contains a dense amount of visible text or elements, so visual review is recommended.",
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
      recommendedAction:
        "Check the homepage, product page, cart, and checkout links manually to confirm customers can move from browsing to purchase without friction.",
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
      recommendedAction:
        "Review top navigation, category labels, collection links, and product pathways for clear browsing routes.",
      evidenceSummary:
        "The loaded page did not show strong product/category navigation and collection-link signals together.",
    });
  }

  if (!signals.searchVisible) {
    addFinding({
      title: "Store Search Visibility Needs Review",
      category: "productDiscovery",
      severity: "Medium",
      confidence: "Moderate",
      businessImpact:
        "Search helps high-intent shoppers bypass navigation friction and reach specific products faster.",
      recommendedAction:
        "Confirm whether search is visible on mobile and desktop, especially for larger catalogs.",
      evidenceSummary:
        "No visible search input or search-labeled navigation item was detected in the public page sample.",
    });
  }

  if (trustSignalCount <= 2) {
    addFinding({
      title: "Trust Signal Visibility Needs Review",
      category: "trustSignals",
      severity: "High",
      confidence: "Moderate",
      businessImpact:
        "Weak early trust cues can reduce purchase confidence, especially for new visitors comparing unfamiliar stores.",
      recommendedAction:
        "Bring shipping, returns, support, review, guarantee, or payment reassurance closer to the early browsing path.",
      evidenceSummary: `${trustSignalCount} of 6 common trust-signal groups were visible in the loaded storefront content.`,
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
      recommendedAction:
        "Check whether shipping, delivery, returns, or exchange messaging appears before checkout and near product decisions.",
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
      recommendedAction:
        "Confirm GA4, GTM, ad pixels, email capture, and conversion events with the marketing owner before scaling paid traffic.",
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
      recommendedAction:
        "Review whether analytics, ad pixels, email capture, and conversion events cover the full purchase journey.",
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
      recommendedAction:
        "Confirm that support, contact, chat, or email capture paths are visible from the primary storefront journey.",
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
      recommendedAction:
        "Review whether order status, delivery, shipping, returns, or refund information is easy to find before purchase.",
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
      recommendedAction:
        "Manually confirm platform clues from source assets, cart/checkout URLs, product URL patterns, and known CMS knowledge.",
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
      recommendedAction:
        "Add or refine the homepage meta description so it explains the store, offer, and audience clearly.",
      evidenceSummary: "No meta description was found in the loaded page metadata.",
    });
  }

  return findings.sort(
    (a, b) =>
      impactRank(b.severity) - impactRank(a.severity) ||
      severityWeight(b.severity) - severityWeight(a.severity),
  );
}

function applyLiveDiagnosticScoring(
  diagnostics: LiveDiagnosticsResult,
  findings: HeuristicFinding[],
) {
  const missingTitlePenalty = diagnostics.title ? 0 : 4;
  const missingDescriptionPenalty = diagnostics.metaDescription ? 0 : 4;
  const consolePenalty = Math.min(10, diagnostics.consoleErrors.length * 3);
  const failedRequestPenalty = Math.min(6, diagnostics.failedRequests.length * 2);

  return auditCategoryTemplates.map((category) => {
    let penalty = 0;
    const categoryFindings = findings.filter((finding) =>
      category.findingCategories.includes(finding.category),
    );

    if (category.key === "uxUiIssues") {
      penalty += missingTitlePenalty;
    }

    if (category.key === "conversionIssues") {
      penalty += missingDescriptionPenalty;
    }

    if (category.key === "technicalIssues") {
      penalty += consolePenalty + failedRequestPenalty;

    }

    if (category.key === "trackingIssues") {
      penalty += Math.min(6, diagnostics.consoleErrors.length * 2);
    }

    penalty += Math.min(
      24,
      categoryFindings.reduce(
        (total, finding) => total + severityWeight(finding.severity),
        0,
      ),
    );

    const score = Math.max(35, category.score - penalty);

    return {
      ...category,
      score,
      status: adjustedStatus(score),
      priority: adjustedPriority(score),
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
              `${finding.title}: ${finding.businessImpact} First action: ${finding.recommendedAction}`,
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
    return priorityFindings.map((finding, index) => ({
      title:
        index === 0
          ? "Highest Business Impact"
          : index === 1
            ? "Next Review Priority"
            : "Journey Review Priority",
      riskLabel: finding.title,
      severity: finding.severity,
      confidence: finding.confidence,
      explanation: finding.businessImpact,
      evidenceSummary: finding.evidenceSummary,
      recommendedFirstAction: finding.recommendedAction,
    }));
  }

  return categories
    .slice()
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((category) => ({
      title: "Manual Journey Review",
      riskLabel: category.label,
      severity: category.status,
      confidence: "Needs Review",
      explanation:
        "No high-impact public-page heuristic finding was detected, so this area should be manually confirmed in context.",
      evidenceSummary:
        "The lightweight scan did not find a specific issue with enough evidence to escalate.",
      recommendedFirstAction:
        "Review the visible customer journey manually before making platform-specific or redesign recommendations.",
    }));
}

function buildRecommendedNextSteps(findings: HeuristicFinding[]) {
  if (findings.length === 0) {
    return [
      {
        action:
          "Manually review the homepage, product discovery path, cart, checkout, and support links.",
        why: "The public-page heuristics did not surface a high-impact issue, so manual journey confirmation is the safest next step.",
      },
    ];
  }

  return findings.slice(0, 5).map((finding) => ({
    action: finding.recommendedAction,
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
