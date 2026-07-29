import { redirect } from "next/navigation";
import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";
import { requireCustomerUser } from "./auth";
import {
  defaultOnboardingStep,
  normalizeOnboardingStep,
  onboardingCompletionPercent,
} from "./onboarding";
import type {
  CustomerContext,
  Entitlement,
  FeatureAccessLevel,
  FeatureRow,
  OnboardingDataRow,
  OnboardingRow,
  OnboardingStepCode,
  OrganizationFeatureOverrideRow,
  OrganizationMemberRow,
  OrganizationRow,
  OrganizationSubscriptionRow,
  PlanFeatureRow,
  PlanRow,
  ProfileRow,
} from "./types";

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; data: T; error: string };

const ACTIVE_PLAN_STATUSES = new Set(["trialing", "active"]);

export async function requireCustomerContext(): Promise<CustomerContext> {
  const user = await requireCustomerUser();
  const context = await getCustomerContextForUser(user);
  if (!context) redirect("/login?error=no-organization");
  return context;
}

export async function getCustomerContextForUser(
  user: Awaited<ReturnType<typeof requireCustomerUser>>,
) {
  if (!hasSupabaseAdminConfig()) return null;

  const memberships = await supabaseAdminFetch<OrganizationMemberRow[]>(
    "organization_members",
    {
      query: {
        select: "id,organization_id,user_id,role,status,invited_at,joined_at",
        user_id: `eq.${user.id}`,
        status: "eq.active",
        limit: 1,
      },
    },
  );
  const membership = memberships.ok ? memberships.data[0] : null;
  if (!membership) return null;

  const [profiles, organizations, onboarding, onboardingData] = await Promise.all([
    supabaseAdminFetch<ProfileRow[]>("profiles", {
      query: {
        select:
          "user_id,first_name,last_name,preferred_name,phone,avatar_url,timezone,created_at,updated_at",
        user_id: `eq.${user.id}`,
        limit: 1,
      },
    }),
    supabaseAdminFetch<OrganizationRow[]>("organizations", {
      query: {
        select:
          "id,name,slug,organization_type,timezone,status,created_at,updated_at",
        id: `eq.${membership.organization_id}`,
        limit: 1,
      },
    }),
    supabaseAdminFetch<OnboardingRow[]>("organization_onboarding", {
      query: {
        select:
          "organization_id,current_step,completion_percent,status,submitted_at,reviewed_at,created_at,updated_at",
        organization_id: `eq.${membership.organization_id}`,
        limit: 1,
      },
    }),
    supabaseAdminFetch<OnboardingDataRow[]>("organization_onboarding_data", {
      query: {
        select: "organization_id,section,data_json,updated_at",
        organization_id: `eq.${membership.organization_id}`,
        order: "updated_at.desc",
      },
    }),
  ]);

  const organization = organizations.ok ? organizations.data[0] : null;
  if (!organization) return null;

  const subscription = await activeSubscription(organization.id);
  const plan = subscription ? await planById(subscription.plan_id) : null;
  const entitlements = plan
    ? await entitlementsForOrganization(organization.id, plan.id)
    : [];

  return {
    user,
    profile: profiles.ok ? profiles.data[0] ?? null : null,
    organization,
    membership,
    plan,
    subscription,
    onboarding: onboarding.ok ? onboarding.data[0] ?? null : null,
    onboardingData: onboardingData.ok ? onboardingData.data : [],
    entitlements,
  };
}

export async function canAccessFeature({
  userId,
  organizationId,
  featureCode,
}: {
  userId: string;
  organizationId: string;
  featureCode: string;
}) {
  const membership = await activeMembershipForUserOrganization({
    userId,
    organizationId,
  });
  if (!membership) {
    return unavailable(featureCode, "Feature");
  }

  const subscription = await activeSubscription(organizationId);
  if (!subscription) {
    return unavailable(featureCode, "Feature");
  }

  const feature = await featureByCode(featureCode);
  if (!feature) return unavailable(featureCode, featureCode);

  const base = await supabaseAdminFetch<PlanFeatureRow[]>("plan_features", {
    query: {
      select: "plan_id,feature_id,access_level,limits_json",
      plan_id: `eq.${subscription.plan_id}`,
      feature_id: `eq.${feature.id}`,
      limit: 1,
    },
  });
  const override = await featureOverride(organizationId, feature.id);

  if (override) return entitlementFromOverride(feature, override);
  if (base.ok && base.data[0]) return entitlementFromPlan(feature, base.data[0]);
  return unavailable(feature.code, feature.name);
}

export async function saveOnboardingSection({
  organizationId,
  section,
  data,
  submit,
}: {
  organizationId: string;
  section: OnboardingStepCode;
  data: Record<string, string | string[]>;
  submit?: boolean;
}) {
  const currentStep = normalizeOnboardingStep(section);
  const status = submit ? "submitted" : "in_progress";
  const completionPercent = submit
    ? 100
    : onboardingCompletionPercent(currentStep);

  const dataResult = await supabaseAdminFetch<null>(
    "organization_onboarding_data",
    {
      method: "POST",
      query: { on_conflict: "organization_id,section" },
      body: {
        organization_id: organizationId,
        section,
        data_json: data,
        updated_at: new Date().toISOString(),
      },
      prefer: "resolution=merge-duplicates,returning=minimal",
    },
  );

  if (!dataResult.ok) return dataResult;

  const onboardingResult = await supabaseAdminFetch<null>("organization_onboarding", {
    method: "POST",
    query: { on_conflict: "organization_id" },
    body: {
      organization_id: organizationId,
      current_step: currentStep,
      completion_percent: completionPercent,
      status,
      submitted_at: submit ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    prefer: "resolution=merge-duplicates,returning=minimal",
  });

  if (onboardingResult.ok) {
    const eventName = submit
      ? "onboarding_completed"
      : section === defaultOnboardingStep
        ? "onboarding_started"
        : "onboarding_step_completed";

    await recordCustomerAccountEvent({
      organizationId,
      eventName,
      targetType: "organization_onboarding",
      targetId: section,
      metadata: { section, completionPercent },
    });

    if (section === "mls_idx") {
      await recordCustomerAccountEvent({
        organizationId,
        eventName: "mls_information_submitted",
        targetType: "organization_onboarding",
        targetId: section,
        metadata: { section },
      });
    }

    if (section === "growth_goals") {
      await recordCustomerAccountEvent({
        organizationId,
        eventName: "growth_service_requested",
        targetType: "organization_onboarding",
        targetId: section,
        metadata: { section },
      });
    }
  }

  return onboardingResult;
}

export async function listCustomerOrganizations(): Promise<
  Result<OrganizationSummary[]>
> {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false,
      data: [],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  const organizations = await supabaseAdminFetch<OrganizationRow[]>(
    "organizations",
    {
      query: {
        select:
          "id,name,slug,organization_type,timezone,status,created_at,updated_at",
        order: "created_at.desc",
        limit: 100,
      },
    },
  );
  if (!organizations.ok) {
    return { ok: false, data: [], error: organizations.error };
  }

  const summaries = await Promise.all(
    organizations.data.map(async (organization) => {
      const [subscription, onboarding, members] = await Promise.all([
        activeSubscription(organization.id),
        supabaseAdminFetch<OnboardingRow[]>("organization_onboarding", {
          query: {
            select:
              "organization_id,current_step,completion_percent,status,submitted_at,reviewed_at,created_at,updated_at",
            organization_id: `eq.${organization.id}`,
            limit: 1,
          },
        }),
        supabaseAdminFetch<OrganizationMemberRow[]>("organization_members", {
          query: {
            select: "id,organization_id,user_id,role,status,invited_at,joined_at",
            organization_id: `eq.${organization.id}`,
          },
        }),
      ]);
      const plan = subscription ? await planById(subscription.plan_id) : null;

      return {
        organization,
        plan,
        subscription,
        onboarding: onboarding.ok ? onboarding.data[0] ?? null : null,
        activeMembers: members.ok
          ? members.data.filter((member) => member.status === "active").length
          : 0,
      };
    }),
  );

  return { ok: true, data: summaries };
}

export type OrganizationSummary = {
  organization: OrganizationRow;
  plan: PlanRow | null;
  subscription: OrganizationSubscriptionRow | null;
  onboarding: OnboardingRow | null;
  activeMembers: number;
};

async function entitlementsForOrganization(organizationId: string, planId: string) {
  const [features, planFeatures, overrides] = await Promise.all([
    supabaseAdminFetch<FeatureRow[]>("features", {
      query: {
        select: "id,code,name,description,category",
        order: "category.asc,name.asc",
      },
    }),
    supabaseAdminFetch<PlanFeatureRow[]>("plan_features", {
      query: {
        select: "plan_id,feature_id,access_level,limits_json",
        plan_id: `eq.${planId}`,
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
  ]);

  if (!features.ok || !planFeatures.ok) return [];

  const planFeatureByFeatureId = new Map(
    planFeatures.data.map((row) => [row.feature_id, row]),
  );
  const overrideByFeatureId = new Map(
    overrides.ok ? overrides.data.map((row) => [row.feature_id, row]) : [],
  );

  return features.data.map((feature) => {
    const override = overrideByFeatureId.get(feature.id);
    if (override) return entitlementFromOverride(feature, override);
    const planFeature = planFeatureByFeatureId.get(feature.id);
    return planFeature
      ? entitlementFromPlan(feature, planFeature)
      : unavailable(
          feature.code,
          feature.name,
          feature.description ?? "",
          feature.category,
        );
  });
}

async function activeSubscription(organizationId: string) {
  const result = await supabaseAdminFetch<OrganizationSubscriptionRow[]>(
    "organization_subscriptions",
    {
      query: {
        select:
          "organization_id,plan_id,status,starts_at,ends_at,external_subscription_id",
        organization_id: `eq.${organizationId}`,
        order: "starts_at.desc",
        limit: 1,
      },
    },
  );
  const subscription = result.ok ? result.data[0] : null;
  return subscription && ACTIVE_PLAN_STATUSES.has(subscription.status)
    ? subscription
    : null;
}

async function planById(planId: string) {
  const result = await supabaseAdminFetch<PlanRow[]>("plans", {
    query: {
      select: "id,code,name,status",
      id: `eq.${planId}`,
      limit: 1,
    },
  });
  return result.ok ? result.data[0] ?? null : null;
}

async function featureByCode(featureCode: string) {
  const result = await supabaseAdminFetch<FeatureRow[]>("features", {
    query: {
      select: "id,code,name,description,category",
      code: `eq.${featureCode}`,
      limit: 1,
    },
  });
  return result.ok ? result.data[0] ?? null : null;
}

async function featureOverride(organizationId: string, featureId: string) {
  const result = await supabaseAdminFetch<OrganizationFeatureOverrideRow[]>(
    "organization_feature_overrides",
    {
      query: {
        select: "organization_id,feature_id,enabled,limits_json,reason",
        organization_id: `eq.${organizationId}`,
        feature_id: `eq.${featureId}`,
        limit: 1,
      },
    },
  );
  return result.ok ? result.data[0] ?? null : null;
}

async function activeMembershipForUserOrganization({
  userId,
  organizationId,
}: {
  userId: string;
  organizationId: string;
}) {
  const result = await supabaseAdminFetch<OrganizationMemberRow[]>(
    "organization_members",
    {
      query: {
        select: "id,organization_id,user_id,role,status,invited_at,joined_at",
        organization_id: `eq.${organizationId}`,
        user_id: `eq.${userId}`,
        status: "eq.active",
        limit: 1,
      },
    },
  );

  return result.ok ? result.data[0] ?? null : null;
}

function entitlementFromPlan(
  feature: FeatureRow,
  planFeature: PlanFeatureRow,
): Entitlement {
  return {
    featureCode: feature.code,
    featureName: feature.name,
    description: feature.description ?? "",
    category: feature.category,
    accessLevel: planFeature.access_level,
    limits: planFeature.limits_json ?? {},
    source: "plan",
  };
}

function entitlementFromOverride(
  feature: FeatureRow,
  override: OrganizationFeatureOverrideRow,
): Entitlement {
  return {
    featureCode: feature.code,
    featureName: feature.name,
    description: feature.description ?? "",
    category: feature.category,
    accessLevel: override.enabled ? "available" : "unavailable",
    limits: override.limits_json ?? {},
    source: "override",
  };
}

function unavailable(
  featureCode: string,
  featureName: string,
  description = "",
  category = "platform",
): Entitlement {
  return {
    featureCode,
    featureName,
    description,
    category,
    accessLevel: "unavailable" satisfies FeatureAccessLevel,
    limits: {},
    source: "plan",
  };
}

async function recordCustomerAccountEvent({
  organizationId,
  eventName,
  targetType,
  targetId,
  metadata = {},
}: {
  organizationId: string;
  eventName: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  await supabaseAdminFetch<null>("customer_account_audit_events", {
    method: "POST",
    body: {
      organization_id: organizationId,
      event_name: eventName,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      metadata,
    },
    prefer: "returning=minimal",
  });
}
