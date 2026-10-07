import type { OnboardingStepCode } from "./types";

export type OnboardingFieldConfig = {
  name: string;
  label: string;
  type: "text" | "tel" | "url" | "email" | "textarea";
  required?: boolean;
  adminVisible?: boolean;
  readiness?: "required" | "optional" | "opzix_obtained";
};

export type OnboardingFieldGroup = {
  title: string;
  helper: string;
  fields: OnboardingFieldConfig[];
};

export type OnboardingSectionConfig = {
  code: OnboardingStepCode;
  adminTitle: string;
  groups: OnboardingFieldGroup[];
};

export const onboardingSectionSchema: OnboardingSectionConfig[] = [
  {
    code: "account",
    adminTitle: "Account",
    groups: [
      {
        title: "Your Account",
        helper:
          "Confirm how we should address you and which timezone should shape your launch schedule.",
        fields: [
          { name: "preferred_name", label: "Preferred name", type: "text" },
          { name: "timezone", label: "Timezone", type: "text" },
          { name: "phone", label: "Phone", type: "tel" },
        ],
      },
    ],
  },
  {
    code: "business",
    adminTitle: "Business",
    groups: [
      {
        title: "Your Business",
        helper:
          "Tell us the business structure and licensing context for your platform.",
        fields: [
          { name: "business_type", label: "Business type", type: "text" },
          { name: "brokerage_name", label: "Brokerage name", type: "text" },
          {
            name: "license_number",
            label: "Real Estate License Number",
            type: "text",
            required: true,
            readiness: "required",
          },
          {
            name: "license_state",
            label: "License state",
            type: "text",
            required: true,
            readiness: "required",
          },
          { name: "years_in_business", label: "Years in business", type: "text" },
          { name: "team_size", label: "Team size", type: "text" },
        ],
      },
      {
        title: "Your Market",
        helper:
          "Share the markets and communities your launch experience should emphasize.",
        fields: [
          { name: "primary_market", label: "Primary market", type: "text" },
          { name: "service_areas", label: "Service areas", type: "textarea" },
        ],
      },
      {
        title: "Your Current Tools",
        helper:
          "Help us understand what you already use so launch setup can fit your workflow.",
        fields: [
          { name: "current_website_url", label: "Current website", type: "url" },
          { name: "current_crm", label: "Current CRM", type: "text" },
        ],
      },
      {
        title: "Your Goals",
        helper:
          "Tell us what outcomes should guide the first version of your Opzix platform.",
        fields: [
          { name: "primary_goals", label: "Primary goals", type: "textarea" },
        ],
      },
    ],
  },
  {
    code: "brand",
    adminTitle: "Brand",
    groups: [
      {
        title: "Brand Details",
        helper:
          "Share the public-facing assets and details your launch team should prepare.",
        fields: [
          { name: "brand_colors", label: "Brand colors", type: "text" },
          { name: "biography", label: "Biography", type: "textarea" },
          { name: "business_phone", label: "Business phone", type: "tel" },
          { name: "public_email", label: "Public email", type: "email" },
          { name: "social_links", label: "Social links", type: "textarea" },
          { name: "domain_details", label: "Domain details", type: "textarea" },
        ],
      },
    ],
  },
  {
    code: "connections",
    adminTitle: "Connections",
    groups: [
      {
        title: "Connected Tools",
        helper:
          "Let us know which tools are ready, planned, or need launch-team help.",
        fields: [
          { name: "google_calendar_status", label: "Google Calendar status", type: "text" },
          { name: "email_provider_status", label: "Email provider status", type: "text" },
          { name: "crm_status", label: "Current CRM connection status", type: "text" },
          { name: "google_business_status", label: "Google Business Profile interest/status", type: "text" },
          { name: "google_ads_status", label: "Google Ads interest/status", type: "text" },
          { name: "existing_website_status", label: "Existing website status", type: "text" },
          { name: "domain_provider", label: "Domain provider", type: "text" },
        ],
      },
    ],
  },
  {
    code: "mls_idx",
    adminTitle: "MLS / IDX",
    groups: [
      {
        title: "MLS & IDX Setup",
        helper:
          "Provide the details needed to begin IDX approval and configuration.",
        fields: [
          {
            name: "mls_organization",
            label: "MLS organization",
            type: "text",
            required: true,
            readiness: "required",
          },
          {
            name: "participant_name",
            label: "Agent legal name / participant name",
            type: "text",
            required: true,
            readiness: "required",
          },
          {
            name: "brokerage",
            label: "Brokerage",
            type: "text",
            required: true,
            readiness: "required",
          },
          {
            name: "mls_identifier",
            label: "MLS member ID / subscriber ID",
            type: "text",
            required: true,
            readiness: "required",
          },
          {
            name: "broker_name",
            label: "Broker / Managing Broker Name",
            type: "text",
            required: true,
            readiness: "required",
          },
          {
            name: "broker_email",
            label: "Broker Email",
            type: "email",
            required: true,
            readiness: "required",
          },
          {
            name: "office_id",
            label: "Office ID (if known)",
            type: "text",
            readiness: "optional",
          },
          {
            name: "brokerage_approval_contact",
            label: "Brokerage approval contact (if known)",
            type: "text",
            readiness: "optional",
          },
          { name: "intended_domain", label: "Intended website domain", type: "text" },
          { name: "approval_status", label: "Approval status", type: "text" },
          { name: "authorization_references", label: "Authorization documents or references", type: "textarea" },
        ],
      },
    ],
  },
  {
    code: "growth_goals",
    adminTitle: "Goals",
    groups: [
      {
        title: "Growth Priorities",
        helper:
          "Help us prioritize the tools and services that will matter most after launch.",
        fields: [
          { name: "buyer_leads", label: "Do you need more buyer leads?", type: "text" },
          { name: "listings", label: "Do you want more listings?", type: "text" },
          { name: "follow_up", label: "Are you losing leads because follow-up is inconsistent?", type: "text" },
          { name: "local_visibility", label: "Do you want more local visibility?", type: "text" },
          { name: "google_ads", label: "Are you interested in Google Ads?", type: "text" },
          { name: "internal_ai", label: "Do you want an internal AI assistant?", type: "text" },
          { name: "team_building", label: "Are you building a team?", type: "text" },
          { name: "success_90_days", label: "What would make the platform successful in the next 90 days?", type: "textarea" },
        ],
      },
    ],
  },
  {
    code: "review",
    adminTitle: "Review",
    groups: [
      {
        title: "Launch Review",
        helper:
          "Confirm anything you want the Opzix team to review before launch.",
        fields: [
          { name: "requested_growth_services", label: "Requested growth services", type: "textarea" },
          { name: "missing_fields", label: "Known incomplete fields", type: "textarea" },
          { name: "next_steps", label: "Next steps to discuss with Opzix", type: "textarea" },
        ],
      },
    ],
  },
];

export type MlsReadinessRequirement = {
  label: string;
  section: OnboardingStepCode;
  keys: string[];
  source: "customer_required" | "customer_optional" | "opzix_obtained";
};

export const mlsReadinessRequirements: MlsReadinessRequirement[] = [
  {
    label: "Agent legal name",
    section: "mls_idx",
    keys: ["participant_name"],
    source: "customer_required",
  },
  {
    label: "License number",
    section: "business",
    keys: ["license_number"],
    source: "customer_required",
  },
  {
    label: "License state",
    section: "business",
    keys: ["license_state"],
    source: "customer_required",
  },
  {
    label: "Brokerage",
    section: "mls_idx",
    keys: ["brokerage", "brokerage_name"],
    source: "customer_required",
  },
  {
    label: "MLS organization",
    section: "mls_idx",
    keys: ["mls_organization"],
    source: "customer_required",
  },
  {
    label: "MLS member ID",
    section: "mls_idx",
    keys: ["mls_identifier"],
    source: "customer_required",
  },
  {
    label: "Broker name",
    section: "mls_idx",
    keys: ["broker_name"],
    source: "customer_required",
  },
  {
    label: "Broker email",
    section: "mls_idx",
    keys: ["broker_email"],
    source: "customer_required",
  },
  {
    label: "Office ID",
    section: "mls_idx",
    keys: ["office_id"],
    source: "customer_optional",
  },
  {
    label: "Brokerage approval contact",
    section: "mls_idx",
    keys: ["brokerage_approval_contact"],
    source: "customer_optional",
  },
];

export function fieldGroupsForStep(stepCode: OnboardingStepCode) {
  return (
    onboardingSectionSchema.find((section) => section.code === stepCode)
      ?.groups ?? []
  );
}

export function flattenedOnboardingFields() {
  return onboardingSectionSchema.flatMap((section) =>
    section.groups.flatMap((group) =>
      group.fields.map((field) => ({
        step: section.adminTitle,
        section: section.code,
        group: group.title,
        ...field,
        required: field.required === true,
        adminVisible: field.adminVisible !== false,
      })),
    ),
  );
}
