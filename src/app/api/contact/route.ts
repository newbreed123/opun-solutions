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

    logDevelopmentSubmission("Contact form", values);

    return NextResponse.json(
      {
        success: true,
        message: "Thank you! Your inquiry has been received.",
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
