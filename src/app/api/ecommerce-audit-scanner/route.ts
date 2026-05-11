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
          overallScore: 67,
          overallStatus: "Needs Strategic Review",
          overallExplanation:
            "The mock scan suggests the store should be reviewed as a connected ecommerce system, not just a set of individual pages.",
          summary:
            "This MVP scanner returns a structured sample audit. A future version can connect real crawling, performance checks, analytics validation, and ecommerce workflow diagnostics.",
          categories: mockAuditCategories,
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
