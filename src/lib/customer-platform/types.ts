export type OrganizationType = "agent" | "team" | "brokerage" | "other";
export type OrganizationStatus = "active" | "onboarding" | "suspended" | "archived";
export type MemberRole = "owner" | "admin" | "agent" | "staff" | "viewer";
export type MemberStatus = "invited" | "active" | "suspended" | "removed";
export type PlanCode =
  | "launch"
  | "growth"
  | "performance"
  | "brokerage"
  | "custom";
export type FeatureAccessLevel =
  | "available"
  | "unavailable"
  | "available_with_limit";
export type OnboardingStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "reviewed";

export type CustomerUser = {
  id: string;
  email: string;
};

export type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  organization_type: OrganizationType;
  timezone: string;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
};

export type CustomerInvitationRow = {
  id: string;
  organization_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  auth_user_id: string | null;
  plan_code: PlanCode | null;
  status: string;
  invitation_state:
    | "draft"
    | "invite_pending"
    | "invited"
    | "activated"
    | "invite_failed";
  invited_at: string;
  accepted_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
};

export type OrganizationCommercialTermsRow = {
  organization_id: string;
  setup_fee: number;
  monthly_subscription: number;
  currency: "USD";
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  invited_at: string | null;
  joined_at: string | null;
};

export type PlanRow = {
  id: string;
  code: PlanCode;
  name: string;
  status: "active" | "inactive" | "archived";
};

export type FeatureRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
};

export type PlanFeatureRow = {
  plan_id: string;
  feature_id: string;
  access_level: FeatureAccessLevel;
  limits_json: Record<string, unknown> | null;
};

export type OrganizationSubscriptionRow = {
  organization_id: string;
  plan_id: string;
  status: "trialing" | "active" | "past_due" | "cancelled" | "suspended";
  starts_at: string;
  ends_at: string | null;
  external_subscription_id: string | null;
};

export type OrganizationFeatureOverrideRow = {
  organization_id: string;
  feature_id: string;
  enabled: boolean;
  limits_json: Record<string, unknown> | null;
  reason: string | null;
};

export type OnboardingRow = {
  organization_id: string;
  current_step: OnboardingStepCode;
  completion_percent: number;
  status: OnboardingStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingDataRow = {
  organization_id: string;
  section: OnboardingStepCode;
  data_json: Record<string, unknown> | null;
  updated_at: string;
};

export type OnboardingStepCode =
  | "account"
  | "business"
  | "brand"
  | "connections"
  | "mls_idx"
  | "growth_goals"
  | "review";

export type Entitlement = {
  featureCode: string;
  featureName: string;
  description: string;
  category: string;
  accessLevel: FeatureAccessLevel;
  limits: Record<string, unknown>;
  source: "plan" | "override";
};

export type CustomerContext = {
  user: CustomerUser;
  profile: ProfileRow | null;
  organization: OrganizationRow;
  membership: OrganizationMemberRow;
  plan: PlanRow | null;
  subscription: OrganizationSubscriptionRow | null;
  onboarding: OnboardingRow | null;
  onboardingData: OnboardingDataRow[];
  entitlements: Entitlement[];
};
