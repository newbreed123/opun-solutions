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

const auditFields: FieldDefinition[] = [
  { key: "name", label: "name", required: true },
  { key: "email", label: "email", required: true },
  { key: "website", label: "website URL", required: true },
  { key: "businessType", label: "business type", required: true },
  { key: "revenue", label: "monthly revenue range", required: true },
  { key: "biggestIssue", label: "biggest issue", required: true },
  { key: "runningAds", label: "ad status", required: true },
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

    logDevelopmentSubmission("Ecommerce audit", values);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your ecommerce audit request has been received.",
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
