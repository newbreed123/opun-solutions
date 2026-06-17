import { NextRequest, NextResponse } from "next/server";
import {
  buildFriendlyValidationError,
  FieldDefinition,
  getMissingRequiredFields,
  isValidEmail,
  isValidHttpUrl,
  logDevelopmentSubmission,
  methodNotAllowedResponse,
  readJsonBody,
  toCleanStringRecord,
  ValidationIssue,
} from "@/lib/form-submissions";
import {
  CONTACT_EMAIL,
  logSuccessfulLeadSubmission,
  sendLeadNotification,
} from "@/lib/lead-notifications";
import { markAuditScanContactSubmitted } from "@/lib/audit-scan-log";
import { normalizeLead } from "@/lib/leads";

const auditFields: FieldDefinition[] = [
  { key: "name", label: "name", required: true },
  { key: "email", label: "email", required: true },
  { key: "website", label: "website URL", required: true },
  { key: "businessType", label: "business type", required: true },
  { key: "revenue", label: "monthly revenue range", required: true },
  { key: "biggestIssue", label: "biggest issue", required: true },
  { key: "runningAds", label: "ad status", required: true },
  { key: "sourcePage", label: "source page", aliases: ["source"] },
  { key: "scanId", label: "scan ID" },
  { key: "scannedUrl", label: "scanned URL" },
  { key: "auditScore", label: "audit score", aliases: ["score"] },
  { key: "auditStatus", label: "audit status", aliases: ["status"] },
  { key: "primaryConcern", label: "primary concern" },
];

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonBody(request);
    const values = toCleanStringRecord(body, auditFields);

    if (!values) {
      return NextResponse.json(
        {
          success: false,
          error:
            "We could not read your audit request. Please try submitting again.",
        },
        { status: 400 }
      );
    }

    const issues: ValidationIssue[] = getMissingRequiredFields(
      values,
      auditFields
    );

    if (values.email && !isValidEmail(values.email)) {
      issues.push({
        field: "email",
        message: "Please enter a valid email address.",
      });
    }

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

    const lead = normalizeLead(values, {
      leadType: "ecommerce-audit",
      defaultSourcePage: "ecommerce-audit",
    });

    logDevelopmentSubmission("Ecommerce audit", lead);
    const notification = await sendLeadNotification(lead);

    if (!notification.ok) {
      console.error("Ecommerce audit notification failed:", notification);
      return NextResponse.json(
        {
          success: false,
          error:
            `We received your audit request, but notification delivery is not configured. Please email ${CONTACT_EMAIL} directly.`,
          notification,
        },
        { status: 503 },
      );
    }

    logSuccessfulLeadSubmission(lead);
    await markAuditScanContactSubmitted({
      scanId: lead.scanId,
      scannedUrl: lead.scannedUrl,
      contactEmail: lead.email,
      contactName: lead.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your ecommerce audit request has been received.",
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ecommerce audit form error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Sorry, we could not process your audit request right now. Please try again in a moment.",
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
