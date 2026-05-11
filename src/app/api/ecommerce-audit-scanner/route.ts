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
  "Review the homepage, collection/product pages, and checkout path against the highest-priority conversion issues.",
  "Map the customer journey from traffic source to purchase, inquiry, support, and follow-up.",
  "Audit analytics and ad conversion events before increasing traffic spend.",
  "Identify where AI assistance, CRM/email routing, or dashboard visibility could reduce manual work.",
  "Book a focused ecommerce systems audit for a human review of the actual storefront and operations.",
];

function adjustedStatus(score: number) {
  if (score < 65) {
    return "High Priority";
  }

  if (score < 80) {
    return "Watchlist";
  }

  return "Stable Foundation";
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
