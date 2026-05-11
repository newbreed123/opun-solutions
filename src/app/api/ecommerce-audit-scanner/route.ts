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

const mockAuditCategories = [
  {
    key: "uxUiIssues",
    label: "UX/UI Issues",
    score: 72,
    status: "Watchlist",
    explanation:
      "The storefront likely has usable foundations, but visual hierarchy and mobile clarity should be reviewed before scaling traffic.",
    priority: "Medium",
    issues: [
      "Navigation may need clearer paths to high-intent product or service pages.",
      "Primary calls to action should be visually consistent across key entry pages.",
      "Mobile product or offer sections should be checked for scanability and spacing.",
    ],
  },
  {
    key: "conversionIssues",
    label: "Conversion Issues",
    score: 64,
    status: "Needs Attention",
    explanation:
      "Conversion paths may be leaking qualified visitors because the next step, trust signals, or offer clarity could be stronger.",
    priority: "High",
    issues: [
      "The above-the-fold value proposition should clearly explain who the store is for and why visitors should act now.",
      "Trust signals near checkout, lead capture, or booking steps may need stronger placement.",
      "Abandoned visitor paths should be reviewed for email capture, assistant prompts, or retargeting readiness.",
    ],
  },
  {
    key: "technicalIssues",
    label: "Technical Issues",
    score: 78,
    status: "Stable Foundation",
    explanation:
      "Technical foundations appear workable for this MVP report, but speed, metadata, and template stability should still be verified.",
    priority: "Medium",
    issues: [
      "Core page speed, image weight, and script loading should be reviewed before scaling paid traffic.",
      "Structured data and metadata should be checked for product, collection, and business context.",
      "Key templates should be tested across mobile breakpoints for layout stability.",
    ],
  },
  {
    key: "trackingIssues",
    label: "Tracking Issues",
    score: 58,
    status: "High Priority",
    explanation:
      "Tracking should be reviewed early because unclear events and attribution can make growth decisions unreliable.",
    priority: "High",
    issues: [
      "Analytics events should clearly separate page views, product interest, checkout steps, and completed conversions.",
      "Ad tracking should be reviewed for duplicated, missing, or unclear conversion events.",
      "Lead source and campaign attribution should connect to forms, bookings, and follow-up workflows.",
    ],
  },
  {
    key: "operationsIssues",
    label: "Ecommerce Operations Issues",
    score: 61,
    status: "High Priority",
    explanation:
      "Operations should be mapped because order handling, support, and backend handoffs often create hidden customer friction.",
    priority: "High",
    issues: [
      "Order handling, fraud review, shipping, and support handoffs should be mapped as one connected workflow.",
      "Customer support questions should route into a clear inbox, dashboard, or ticket process.",
      "Backend systems should be reviewed for manual re-entry, delayed updates, and disconnected notifications.",
    ],
  },
];

const recommendedNextSteps = [
  {
    action:
      "Review the homepage, collection/product pages, and checkout path against the highest-priority conversion issues.",
    why: "These pages usually decide whether traffic becomes product interest, checkout intent, or a lost visitor.",
  },
  {
    action:
      "Map the customer journey from traffic source to purchase, inquiry, support, and follow-up.",
    why: "A connected journey makes it easier to see where customers hesitate and where the team needs better handoff.",
  },
  {
    action: "Audit analytics and ad conversion events before increasing traffic spend.",
    why: "Clean tracking keeps paid traffic decisions grounded in reliable conversion and revenue signals.",
  },
  {
    action:
      "Identify where AI assistance, CRM/email routing, or dashboard visibility could reduce manual work.",
    why: "Operational clarity helps the team respond faster and reduces repeated manual coordination.",
  },
  {
    action:
      "Book a focused ecommerce systems audit for a human review of the actual storefront and operations.",
    why: "The tool shows signals; a human review can connect those signals to business context and priorities.",
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

function applyLiveDiagnosticScoring(diagnostics: LiveDiagnosticsResult) {
  const missingTitlePenalty = diagnostics.title ? 0 : 4;
  const missingDescriptionPenalty = diagnostics.metaDescription ? 0 : 4;
  const consolePenalty = Math.min(10, diagnostics.consoleErrors.length * 3);
  const failedRequestPenalty = Math.min(6, diagnostics.failedRequests.length * 2);

  return mockAuditCategories.map((category) => {
    let penalty = 0;
    const issues = [...category.issues];

    if (category.key === "uxUiIssues") {
      penalty += missingTitlePenalty;

      if (!diagnostics.title) {
        issues.push(
          "The page title is missing, which can make the page feel less clear in browser tabs and search results.",
        );
      }
    }

    if (category.key === "conversionIssues") {
      penalty += missingDescriptionPenalty;

      if (!diagnostics.metaDescription) {
        issues.push(
          "The meta description is missing, which can weaken the page's search snippet and first-impression clarity.",
        );
      }
    }

    if (category.key === "technicalIssues") {
      penalty += consolePenalty + failedRequestPenalty;

      if (diagnostics.consoleErrors.length > 0) {
        issues.push(
          "Console errors were detected and should be reviewed because they may affect page behavior or tracking.",
        );
      }

      if (diagnostics.failedRequests.length > 0) {
        issues.push(
          "Some network requests failed during the scan and should be checked for missing scripts, blocked assets, or third-party issues.",
        );
      }
    }

    if (category.key === "trackingIssues") {
      penalty += Math.min(6, diagnostics.consoleErrors.length * 2);
    }

    const score = Math.max(35, category.score - penalty);

    return {
      ...category,
      score,
      status: adjustedStatus(score),
      priority: adjustedPriority(score),
      issues,
    };
  });
}

function buildExecutiveSummary({
  categories,
  diagnostics,
  overallScore,
}: {
  categories: ReturnType<typeof applyLiveDiagnosticScoring>;
  diagnostics: LiveDiagnosticsResult;
  overallScore: number;
}) {
  const lowestCategories = [...categories].sort((a, b) => a.score - b.score).slice(0, 2);
  const opportunityLabels = lowestCategories.map((category) =>
    category.label.replace(" Issues", "").toLowerCase(),
  );
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
      ? `The scan detected ${diagnostics.platformDetection.name} as the likely storefront platform with ${diagnostics.platformDetection.confidence}% confidence.`
      : "The storefront platform could not be identified reliably from the visible page assets.";

  const flowSentence =
    diagnostics.commerceFlowSignals.checkoutVisible || diagnostics.commerceFlowSignals.cartVisible
      ? "The cart and checkout path are visible enough to suggest a working commerce flow in this review."
      : "Commerce flow signals are not clearly visible, which can make it harder to assess checkout readiness and conversion friction.";

  return {
    summary: `${condition} ${diagnosticsSentence}`,
    highestImpactOpportunities: opportunityLabels.map((label) =>
      `Prioritize ${label} because it is currently one of the lowest-scoring areas in the report.`,
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

function buildTopPriorityRisks(categories: ReturnType<typeof applyLiveDiagnosticScoring>) {
  const conversion = findCategory(categories, "conversionIssues");
  const ux = findCategory(categories, "uxUiIssues");
  const operations = findCategory(categories, "operationsIssues");

  return [
    {
      title: "Highest Revenue Risk",
      riskLabel: conversion.label,
      severity: conversion.status,
      explanation:
        conversion.issues[0] ??
        "Conversion friction may keep qualified visitors from becoming buyers or inquiries.",
      recommendedFirstAction:
        "Review the primary offer, CTA path, trust signals, and checkout or inquiry steps first.",
    },
    {
      title: "Highest UX Friction",
      riskLabel: ux.label,
      severity: ux.status,
      explanation:
        ux.issues[0] ??
        "UX friction can make it harder for visitors to find the right product, answer, or next step.",
      recommendedFirstAction:
        "Check the mobile path, navigation clarity, and above-the-fold decision support.",
    },
    {
      title: "Highest Operational Friction",
      riskLabel: operations.label,
      severity: operations.status,
      explanation:
        operations.issues[0] ??
        "Operational gaps can create manual work after the customer takes action.",
      recommendedFirstAction:
        "Map order handling, support routing, backend handoffs, and team notifications.",
    },
  ];
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

    const categories = applyLiveDiagnosticScoring(diagnostics);
    const overallScore = Math.round(
      categories.reduce((total, category) => total + category.score, 0) /
        categories.length,
    );
    const executiveSummary = buildExecutiveSummary({
      categories,
      diagnostics,
      overallScore,
    });
    const topPriorityRisks = buildTopPriorityRisks(categories);

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
            "The report combines mock audit categories with lightweight live diagnostics for metadata, screenshots, console errors, and failed requests.",
          summary:
            "This internal MVP still uses mock strategic analysis, but now includes real lightweight diagnostics from the submitted URL. A future version can add Lighthouse, AI analysis, tracking detection, and deeper ecommerce workflow checks.",
          executiveSummary,
          topPriorityRisks,
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
