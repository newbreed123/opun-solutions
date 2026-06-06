import { NextRequest, NextResponse } from "next/server";
import {
  buildFriendlyValidationError,
  FieldDefinition,
  getMissingRequiredFields,
  isValidEmail,
  logDevelopmentSubmission,
  methodNotAllowedResponse,
  readJsonBody,
  toCleanStringRecord,
  ValidationIssue,
} from "@/lib/form-submissions";
import {
  logSuccessfulLeadSubmission,
  sendLeadNotification,
} from "@/lib/lead-notifications";
import { markAuditScanContactSubmitted } from "@/lib/audit-scan-log";
import { normalizeLead } from "@/lib/leads";

const contactFields: FieldDefinition[] = [
  { key: "name", label: "name", required: true },
  { key: "email", label: "email", required: true },
  { key: "businessType", label: "business type", required: true },
  {
    key: "serviceNeeded",
    label: "service needed",
    required: true,
    aliases: ["service"],
  },
  { key: "projectDescription", label: "project details", required: true },
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
    const values = toCleanStringRecord(body, contactFields);

    if (!values) {
      return NextResponse.json(
        {
          success: false,
          error: "We could not read your inquiry. Please try submitting again.",
        },
        { status: 400 }
      );
    }

    const issues: ValidationIssue[] = getMissingRequiredFields(
      values,
      contactFields
    );

    if (values.email && !isValidEmail(values.email)) {
      issues.push({
        field: "email",
        message: "Please enter a valid email address.",
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
      leadType: "contact",
      defaultSourcePage: "contact-general",
    });

    logDevelopmentSubmission("Contact form", lead);
    const notification = await sendLeadNotification(lead);

    if (!notification.ok) {
      console.error("Contact notification failed:", notification);
      return NextResponse.json(
        {
          success: false,
          error:
            "We received your inquiry, but notification delivery is not configured. Please email hello@opzix.com directly.",
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
        message: "Thank you! Your inquiry has been received.",
        notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Sorry, we could not process your inquiry right now. Please try again in a moment.",
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
