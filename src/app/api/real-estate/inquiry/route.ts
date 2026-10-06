import { NextRequest, NextResponse } from "next/server";
import {
  buildFriendlyValidationError,
  FieldDefinition,
  getMissingRequiredFields,
  isValidEmail,
  methodNotAllowedResponse,
  readJsonBody,
  toCleanStringRecord,
  ValidationIssue,
} from "@/lib/form-submissions";
import { brittanySiteConfig } from "@/content/brittany";
import { formatPrice } from "@/lib/real-estate/listings/format";
import {
  canShowPreviewListings,
  getListingSearchRepository,
} from "@/lib/real-estate/listings/repository";
import { normalizeLead } from "@/lib/leads";
import { sendLeadNotification } from "@/lib/lead-notifications";

const inquiryFields: FieldDefinition[] = [
  { key: "name", label: "name", required: true },
  { key: "email", label: "email" },
  { key: "phone", label: "phone" },
  { key: "preferredContactMethod", label: "preferred contact method", required: true },
  { key: "message", label: "message" },
  { key: "listingKey", label: "listing key", required: true },
  { key: "listingId", label: "MLS number" },
  { key: "listingAddress", label: "listing address" },
  { key: "listingPrice", label: "listing price" },
  { key: "inquiryType", label: "inquiry type", required: true },
  { key: "pageUrl", label: "page URL" },
];

export async function POST(request: NextRequest) {
  try {
    if (!canShowPreviewListings()) {
      return NextResponse.json(
        {
          success: false,
          error:
            `${brittanySiteConfig.agentFirstName}'s home search is being prepared. Please call, text, or email ${brittanySiteConfig.agentFirstName} directly.`,
        },
        { status: 503 },
      );
    }

    const body = await readJsonBody(request);
    const values = toCleanStringRecord(body, inquiryFields);

    if (!values) {
      return NextResponse.json(
        {
          success: false,
          error: "We could not read your message. Please try again.",
        },
        { status: 400 },
      );
    }

    const issues: ValidationIssue[] = getMissingRequiredFields(
      values,
      inquiryFields,
    );

    if (!values.email && !values.phone) {
      issues.push({
        field: "email",
        message: "Please add a phone number or email address.",
      });
    }

    if (values.email && !isValidEmail(values.email)) {
      issues.push({
        field: "email",
        message: "Please enter a valid email address.",
      });
    }

    const home = await getListingSearchRepository().getByKey(values.listingKey);
    if (!home) {
      issues.push({
        field: "listingKey",
        message: "Please choose a home before sending your message.",
      });
    }

    if (issues.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: buildFriendlyValidationError(issues),
          fields: issues,
        },
        { status: 400 },
      );
    }

    const listingAddress = home
      ? `${home.streetAddress}, ${home.city}, ${home.state} ${home.postalCode}`
      : values.listingAddress;

    const lead = normalizeLead(
      {
        ...values,
        email: values.email,
        serviceNeeded: `${brittanySiteConfig.agentFirstName} home inquiry`,
        businessType: "Real estate buyer",
        sourcePage: "real-estate-homes",
        listingId: home?.listingId ?? values.listingId,
        listingAddress,
        listingPrice: home ? formatPrice(home.price) : values.listingPrice,
        projectDescription: buildInquiryMessage({
          values,
          listingAddress,
          listingPrice: home ? formatPrice(home.price) : values.listingPrice,
        }),
      },
      {
        leadType: "real-estate-inquiry",
        defaultSourcePage: "real-estate-homes",
      },
    );

    const notification = await sendLeadNotification(lead, {
      recipient: brittanySiteConfig.leadDestinationEmail,
    });

    if (!notification.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            `We saved your message, but could not notify ${brittanySiteConfig.agentFirstName} right now. Please call or text her directly.`,
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Thanks. ${brittanySiteConfig.agentFirstName} will get your message.`,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        error:
          `We could not send your message right now. Please call or text ${brittanySiteConfig.agentFirstName} directly.`,
      },
      { status: 500 },
    );
  }
}

function buildInquiryMessage({
  values,
  listingAddress,
  listingPrice,
}: {
  values: Record<string, string>;
  listingAddress: string;
  listingPrice: string;
}) {
  return [
    `Inquiry type: ${values.inquiryType}`,
    `Listing key: ${values.listingKey}`,
    values.listingId ? `MLS number: ${values.listingId}` : "",
    `Address: ${listingAddress}`,
    `Price: ${listingPrice}`,
    `Current page URL: ${values.pageUrl}`,
    values.message ? `Message: ${values.message}` : "",
  ]
    .filter(Boolean)
    .join("\n");
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
