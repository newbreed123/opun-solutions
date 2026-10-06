import { supabaseAdminFetch } from "@/lib/supabase-admin";
import type {
  CustomerInvitationRow,
  FeatureRow,
  OnboardingDataRow,
  OnboardingRow,
  OrganizationCommercialTermsRow,
  OrganizationFeatureOverrideRow,
  OrganizationRow,
  OrganizationSubscriptionRow,
  PlanFeatureRow,
  PlanRow,
  ProfileRow,
} from "./types";

type AdminOrganization = OrganizationRow & {
  metadata: Record<string, unknown>;
};

type AuditEventRow = {
  event_name: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

type MemberRow = {
  id: string;
  status: string;
};

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; data: T; error: string };

export type CustomerAdminSummary = {
  organization: AdminOrganization;
  invitation: CustomerInvitationRow | null;
  customerName: string;
  plan: PlanRow | null;
  subscription: OrganizationSubscriptionRow | null;
  terms: OrganizationCommercialTermsRow | null;
  onboarding: OnboardingRow | null;
  activeMembers: number;
  lastActivity: AuditEventRow | null;
  isQa: boolean;
};

export type CustomerAdminDetail = CustomerAdminSummary & {
  profile: ProfileRow | null;
  features: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: string;
    enabled: boolean;
    source: "plan" | "override";
  }[];
  mlsData: Record<string, unknown> | null;
  recentActivity: AuditEventRow[];
};

const ORGANIZATION_SELECT =
  "id,name,slug,organization_type,timezone,status,created_at,updated_at,metadata";
const INVITATION_SELECT =
  "id,organization_id,email,first_name,last_name,auth_user_id,plan_code,status,invitation_state,invited_at,accepted_at,last_error,metadata,updated_at";
const ONBOARDING_SELECT =
  "organization_id,current_step,completion_percent,status,submitted_at,reviewed_at,created_at,updated_at";

export async function listCustomerAdminOrganizations(): Promise<
  Result<CustomerAdminSummary[]>
> {
  const organizations = await supabaseAdminFetch<AdminOrganization[]>(
    "organizations",
    {
      query: {
        select: ORGANIZATION_SELECT,
        order: "created_at.desc",
        limit: 100,
      },
    },
  );

  if (!organizations.ok) {
    return { ok: false, data: [], error: organizations.error };
  }

  try {
    const data = await Promise.all(
      organizations.data.map((organization) =>
        summarizeOrganization(organization),
      ),
    );
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Customer account details could not be loaded.",
    };
  }
}

export async function getCustomerAdminDetail(
  organizationId: string,
): Promise<CustomerAdminDetail | null> {
  const organizationResult = await supabaseAdminFetch<AdminOrganization[]>(
    "organizations",
    {
      query: {
        select: ORGANIZATION_SELECT,
        id: `eq.${organizationId}`,
        limit: 1,
      },
    },
  );
  if (!organizationResult.ok) throw new Error(organizationResult.error);
  const organization = organizationResult.data[0];
  if (!organization) return null;

  const summary = await summarizeOrganization(organization);
  const invitation = summary.invitation;
  const [
    profileResult,
    featuresResult,
    overridesResult,
    planFeaturesResult,
    onboardingDataResult,
    activityResult,
  ] = await Promise.all([
    invitation?.auth_user_id
      ? supabaseAdminFetch<ProfileRow[]>("profiles", {
          query: {
            select:
              "user_id,first_name,last_name,preferred_name,phone,avatar_url,timezone,created_at,updated_at",
            user_id: `eq.${invitation.auth_user_id}`,
            limit: 1,
          },
        })
      : Promise.resolve({ ok: true as const, data: [], status: 200 }),
    supabaseAdminFetch<FeatureRow[]>("features", {
      query: {
        select: "id,code,name,description,category",
        order: "category.asc,name.asc",
      },
    }),
    supabaseAdminFetch<OrganizationFeatureOverrideRow[]>(
      "organization_feature_overrides",
      {
        query: {
          select: "organization_id,feature_id,enabled,limits_json,reason",
          organization_id: `eq.${organizationId}`,
        },
      },
    ),
    summary.subscription
      ? supabaseAdminFetch<PlanFeatureRow[]>("plan_features", {
          query: {
            select: "plan_id,feature_id,access_level,limits_json",
            plan_id: `eq.${summary.subscription.plan_id}`,
          },
        })
      : Promise.resolve({ ok: true as const, data: [], status: 200 }),
    supabaseAdminFetch<OnboardingDataRow[]>(
      "organization_onboarding_data",
      {
        query: {
          select: "organization_id,section,data_json,updated_at",
          organization_id: `eq.${organizationId}`,
          section: "eq.mls_idx",
          limit: 1,
        },
      },
    ),
    supabaseAdminFetch<AuditEventRow[]>(
      "customer_account_audit_events",
      {
        query: {
          select: "event_name,created_at,metadata",
          organization_id: `eq.${organizationId}`,
          order: "created_at.desc",
          limit: 20,
        },
      },
    ),
  ]);

  const profiles = unwrap(profileResult);
  const features = unwrap(featuresResult);
  const overrides = unwrap(overridesResult);
  const planFeatures = unwrap(planFeaturesResult);
  const onboardingData = unwrap(onboardingDataResult);
  const activity = unwrap(activityResult);
  const overridesById = new Map(
    overrides.map((override) => [override.feature_id, override]),
  );
  const planFeaturesById = new Map(
    planFeatures.map((feature) => [feature.feature_id, feature]),
  );
  const effectiveFeatures = features.map((feature) => {
    const override = overridesById.get(feature.id);
    const planFeature = planFeaturesById.get(feature.id);
    return {
      id: feature.id,
      code: feature.code,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      enabled: override
        ? override.enabled
        : Boolean(
            planFeature &&
              ["available", "available_with_limit"].includes(
                planFeature.access_level,
              ),
          ),
      source: override ? ("override" as const) : ("plan" as const),
    };
  });
  const mlsData = onboardingData[0]?.data_json ?? null;

  return {
    ...summary,
    profile: profiles[0] ?? null,
    features: effectiveFeatures,
    mlsData,
    recentActivity: activity,
  };
}

async function summarizeOrganization(
  organization: AdminOrganization,
): Promise<CustomerAdminSummary> {
  const [
    invitationsResult,
    subscriptionsResult,
    termsResult,
    onboardingResult,
    membersResult,
    activityResult,
  ] = await Promise.all([
    supabaseAdminFetch<CustomerInvitationRow[]>(
      "organization_invitations",
      {
        query: {
          select: INVITATION_SELECT,
          organization_id: `eq.${organization.id}`,
          order: "updated_at.desc",
          limit: 1,
        },
      },
    ),
    supabaseAdminFetch<OrganizationSubscriptionRow[]>(
      "organization_subscriptions",
      {
        query: {
          select:
            "organization_id,plan_id,status,starts_at,ends_at,external_subscription_id",
          organization_id: `eq.${organization.id}`,
          order: "starts_at.desc",
          limit: 1,
        },
      },
    ),
    supabaseAdminFetch<OrganizationCommercialTermsRow[]>(
      "organization_commercial_terms",
      {
        query: {
          select:
            "organization_id,setup_fee,monthly_subscription,currency,created_at,updated_at",
          organization_id: `eq.${organization.id}`,
          limit: 1,
        },
      },
    ),
    supabaseAdminFetch<OnboardingRow[]>("organization_onboarding", {
      query: {
        select: ONBOARDING_SELECT,
        organization_id: `eq.${organization.id}`,
        limit: 1,
      },
    }),
    supabaseAdminFetch<MemberRow[]>("organization_members", {
      query: {
        select: "id,status",
        organization_id: `eq.${organization.id}`,
      },
    }),
    supabaseAdminFetch<AuditEventRow[]>(
      "customer_account_audit_events",
      {
        query: {
          select: "event_name,created_at,metadata",
          organization_id: `eq.${organization.id}`,
          order: "created_at.desc",
          limit: 1,
        },
      },
    ),
  ]);
  const invitations = unwrap(invitationsResult);
  const subscriptions = unwrap(subscriptionsResult);
  const terms = unwrap(termsResult);
  const onboardings = unwrap(onboardingResult);
  const members = unwrap(membersResult);
  const activity = unwrap(activityResult);
  const invitation = invitations[0] ?? null;
  const subscription = subscriptions[0] ?? null;
  const plan = subscription
    ? await loadPlan(subscription.plan_id)
    : null;
  const profile = invitation?.auth_user_id
    ? await loadProfile(invitation.auth_user_id)
    : null;
  const customerName =
    profile?.preferred_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    [invitation?.first_name, invitation?.last_name].filter(Boolean).join(" ") ||
    "Not invited";
  const lastActivity = activity[0] ?? null;
  const isQa =
    organization.metadata?.is_qa === true ||
    invitation?.metadata?.is_qa === true ||
    Boolean(
      lastActivity &&
        (lastActivity.event_name.startsWith("qa_") ||
          lastActivity.metadata?.qa_marker ||
          lastActivity.metadata?.qa_key),
    );

  return {
    organization,
    invitation,
    customerName,
    plan,
    subscription,
    terms: terms[0] ?? null,
    onboarding: onboardings[0] ?? null,
    activeMembers: members.filter(
      (member) => member.status === "active",
    ).length,
    lastActivity,
    isQa,
  };
}

function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: string }) {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function loadPlan(planId: string) {
  const result = await supabaseAdminFetch<PlanRow[]>("plans", {
    query: {
      select: "id,code,name,status",
      id: `eq.${planId}`,
      limit: 1,
    },
  });
  if (!result.ok) throw new Error(result.error);
  return result.data[0] ?? null;
}

async function loadProfile(userId: string) {
  const result = await supabaseAdminFetch<ProfileRow[]>("profiles", {
    query: {
      select:
        "user_id,first_name,last_name,preferred_name,phone,avatar_url,timezone,created_at,updated_at",
      user_id: `eq.${userId}`,
      limit: 1,
    },
  });
  if (!result.ok) throw new Error(result.error);
  return result.data[0] ?? null;
}
