import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const REPORT_MD_PATH = join(ROOT_DIR, "docs", "qa", "prd-016-qa-customers-report.md");
const REPORT_JSON_PATH = join(ROOT_DIR, "docs", "qa", "prd-016-qa-customers-report.json");

const REQUIRED_FEATURE_CODES = [
  "idx_property_search",
  "crm",
  "ai_property_assistant",
  "analytics",
  "automated_follow_up",
  "advanced_crm",
  "ai_isa",
  "internal_ai",
  "team_management",
  "lead_routing",
  "brokerage_reporting",
];

const FEATURE_SEED = {
  idx_property_search: {
    name: "IDX Property Search",
    description: "MLS/IDX-powered home search experience.",
    category: "platform",
  },
  crm: {
    name: "CRM",
    description: "Contact organization and follow-up foundation.",
    category: "operations",
  },
  ai_property_assistant: {
    name: "AI Buyer Advisor",
    description: "AI guidance for buyer questions and next steps.",
    category: "ai",
  },
  analytics: {
    name: "Analytics",
    description: "Core platform activity and conversion visibility.",
    category: "intelligence",
  },
  automated_follow_up: {
    name: "Automated Follow-up",
    description: "Repeatable follow-up reminders and workflows.",
    category: "automation",
  },
  advanced_crm: {
    name: "Advanced CRM",
    description: "Deeper pipeline and sales visibility.",
    category: "operations",
  },
  ai_isa: {
    name: "AI ISA",
    description: "AI-supported lead qualification and booking workflows.",
    category: "ai",
  },
  internal_ai: {
    name: "Internal AI Assistant",
    description: "Private business assistant for internal operations.",
    category: "ai",
  },
  team_management: {
    name: "Team Management",
    description: "Team member management and operating visibility.",
    category: "brokerage",
  },
  lead_routing: {
    name: "Lead Routing",
    description: "Route leads to the right person or workflow.",
    category: "brokerage",
  },
  brokerage_reporting: {
    name: "Brokerage Reporting",
    description: "Brokerage-level dashboards and reporting.",
    category: "brokerage",
  },
};

const PLAN_EXPECTATIONS = {
  launch: {
    idx_property_search: true,
    crm: true,
    ai_property_assistant: true,
    analytics: true,
    automated_follow_up: false,
    advanced_crm: false,
    ai_isa: false,
    internal_ai: false,
    team_management: false,
    lead_routing: false,
    brokerage_reporting: false,
  },
  growth: {
    idx_property_search: true,
    crm: true,
    ai_property_assistant: true,
    analytics: true,
    automated_follow_up: true,
    advanced_crm: true,
    ai_isa: false,
    internal_ai: false,
    team_management: false,
    lead_routing: false,
    brokerage_reporting: false,
  },
};

const QA_CUSTOMERS = [
  {
    key: "agentA",
    label: "Test Agent A",
    emailEnv: "QA_AGENT_A_EMAIL",
    passwordEnv: "QA_AGENT_A_PASSWORD",
    user: { firstName: "Angela", lastName: "Carter" },
    organization: {
      name: "Test Agent A Realty",
      slug: "test-agent-a-realty",
      organizationType: "agent",
      timezone: "America/New_York",
      status: "onboarding",
    },
    role: "owner",
    planCode: "launch",
    onboarding: {
      currentStep: "business",
      completionPercent: 35,
      brokerage: "Northstar Realty",
      licenseState: "NC",
      primaryMarket: "Charlotte",
      serviceAreas: ["Charlotte", "Matthews", "Huntersville"],
      currentWebsite: "https://example-agent-a.com",
      goals: ["buyer leads", "local visibility", "lead organization"],
    },
  },
  {
    key: "agentB",
    label: "Test Agent B",
    emailEnv: "QA_AGENT_B_EMAIL",
    passwordEnv: "QA_AGENT_B_PASSWORD",
    user: { firstName: "Marcus", lastName: "Bennett" },
    organization: {
      name: "Test Agent B Group",
      slug: "test-agent-b-group",
      organizationType: "team",
      timezone: "America/Chicago",
      status: "onboarding",
    },
    role: "owner",
    planCode: "growth",
    onboarding: {
      currentStep: "mls_idx",
      completionPercent: 65,
      brokerage: "Summit Homes Group",
      licenseState: "TX",
      primaryMarket: "Dallas",
      serviceAreas: ["Dallas", "Plano", "Frisco"],
      currentWebsite: "https://example-agent-b.com",
      goals: ["seller leads", "automated follow-up", "conversion tracking"],
    },
  },
];

async function main() {
  loadDotEnv(".env");
  loadDotEnv(".env.local");

  const customers = [];
  const report = {
    generatedAt: new Date().toISOString(),
    status: "running",
    seedMethod: "npm run seed:qa-customers",
    activationMethod:
      "QA users are created or reused through Supabase Admin Auth. The seed sets locally configured QA passwords for those exact QA emails and does not send invitation email by default.",
    authMethod:
      "Password sessions use POST /auth/v1/token?grant_type=password. The prior failure came from POST /auth/v1/admin/generate_link type=magiclink followed by POST /auth/v1/verify; generate_link does not send email.",
    initialAudit: [],
    customers: [],
    tenantIsolation: [],
    failure: null,
  };

  try {
    assertSeedingAllowed();

    const config = getConfig();
    validateQaEmails();

    report.initialAudit = await auditExistingQaData(config);
    writeReport(report);

    validateQaPasswords();

    await ensurePlansAndFeatures(config);

    for (const customer of QA_CUSTOMERS) {
      const seeded = await seedCustomer(config, customer);
      customers.push(seeded);
      report.customers = customers.map(reportCustomer);
      writeReport(report);
    }

    for (const customer of customers) {
      try {
        customer.session = await customerSession(config, customer);
      } catch (error) {
        customer.session = {
          status: "failed",
          operation: "POST /auth/v1/token?grant_type=password",
          error: errorReport(error),
        };
        throw error;
      } finally {
        report.customers = customers.map(reportCustomer);
        writeReport(report);
      }
    }

    report.tenantIsolation = await runTenantIsolationChecks(config, customers);
    report.status = report.tenantIsolation.every((check) => check.passed)
      ? "passed"
      : "failed";
    writeReport(report);

    printReportSummary(report);

    if (report.status !== "passed") {
      throw new Error("QA tenant-isolation checks failed.");
    }
  } catch (error) {
    report.status = "failed";
    report.failure = errorReport(error);
    report.customers = customers.map(reportCustomer);
    writeReport(report);
    printReportSummary(report);
    throw error;
  }
}

function loadDotEnv(filename) {
  const filePath = join(ROOT_DIR, filename);
  if (!existsSync(filePath)) return;

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = unquoteEnvValue(rawValue.trim());
  }
}

function unquoteEnvValue(value) {
  const quote = value[0];
  if ((quote === "'" || quote === '"') && value.endsWith(quote)) {
    return value.slice(1, -1);
  }
  return value;
}

function assertSeedingAllowed() {
  const productionLike =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (
    productionLike &&
    process.env.OPZIX_QA_SEEDING_ENABLED?.trim().toLowerCase() !== "true"
  ) {
    throw new Error(
      "QA seeding is disabled in production. Set OPZIX_QA_SEEDING_ENABLED=true to run intentionally.",
    );
  }
}

function getConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim()?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const configuredAnonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const missing = [];
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    supabaseUrl,
    serviceRoleKey,
    authGatewayKey: configuredAnonKey || serviceRoleKey,
    authGatewayKeySource: configuredAnonKey ? "anon" : "service_role_gateway",
  };
}

function validateQaEmails() {
  const emails = QA_CUSTOMERS.map((customer) => ({
    label: customer.label,
    env: customer.emailEnv,
    email: normalizedEmail(process.env[customer.emailEnv]),
  }));

  const missing = emails.filter((entry) => !entry.email).map((entry) => entry.env);
  if (missing.length > 0) {
    throw new Error(`Missing QA email environment variables: ${missing.join(", ")}.`);
  }

  const invalid = emails.filter((entry) => !isEmailLike(entry.email));
  if (invalid.length > 0) {
    throw new Error(
      `Invalid QA email environment variables: ${invalid
        .map((entry) => entry.env)
        .join(", ")}`,
    );
  }

  if (emails[0].email === emails[1].email) {
    throw new Error("QA_AGENT_A_EMAIL and QA_AGENT_B_EMAIL must be different.");
  }
}

function validateQaPasswords() {
  const entries = QA_CUSTOMERS.map((customer) => ({
    env: customer.passwordEnv,
    password: process.env[customer.passwordEnv] ?? "",
    email: normalizedEmail(process.env[customer.emailEnv]),
  }));

  const missing = entries.filter((entry) => !entry.password).map((entry) => entry.env);
  if (missing.length > 0) {
    throw new Error(`Missing QA password environment variables: ${missing.join(", ")}.`);
  }

  const passwordErrors = entries.flatMap((entry) =>
    strongPasswordErrors(entry.password, entry.email).map(
      (error) => `${entry.env} ${error}`,
    ),
  );
  if (passwordErrors.length > 0) {
    throw new Error(`Weak QA password configuration: ${passwordErrors.join("; ")}.`);
  }
}

async function auditExistingQaData(config) {
  const audit = [];

  for (const customer of QA_CUSTOMERS) {
    const email = normalizedEmail(process.env[customer.emailEnv]);
    const authUsers = await findAuthUsersByEmail(config, email);
    const authUser = authUsers[0] ?? null;
    const organizations = await serviceSelect(config, "organizations", {
      select: "id,name,slug,organization_type,timezone,status",
      slug: `eq.${customer.organization.slug}`,
      limit: 2,
    });
    const organization = organizations[0] ?? null;
    const profiles = authUser
      ? await serviceSelect(config, "profiles", {
          select: "user_id",
          user_id: `eq.${authUser.id}`,
          limit: 2,
        })
      : [];
    const memberships =
      authUser && organization
        ? await serviceSelect(config, "organization_members", {
            select: "id",
            organization_id: `eq.${organization.id}`,
            user_id: `eq.${authUser.id}`,
            limit: 2,
          })
        : [];
    const subscriptions = organization
      ? await serviceSelect(config, "organization_subscriptions", {
          select: "organization_id",
          organization_id: `eq.${organization.id}`,
          limit: 2,
        })
      : [];
    const onboarding = organization
      ? await serviceSelect(config, "organization_onboarding", {
          select: "organization_id",
          organization_id: `eq.${organization.id}`,
          limit: 2,
        })
      : [];
    const onboardingData = organization
      ? await serviceSelect(config, "organization_onboarding_data", {
          select: "organization_id,section",
          organization_id: `eq.${organization.id}`,
        })
      : [];

    audit.push({
      key: customer.key,
      label: customer.label,
      authUser: authUser
        ? {
            id: authUser.id,
            countByNormalizedEmail: authUsers.length,
            emailConfirmedAt: authUser.email_confirmed_at ?? null,
            bannedUntil: authUser.banned_until ?? null,
            userMetadataKeys: Object.keys(authUser.user_metadata ?? {}).sort(),
            passwordIdentityDetected: hasPasswordIdentity(authUser),
          }
        : null,
      records: {
        authUsersByNormalizedEmail: authUsers.length,
        profile: profiles.length,
        organizationsBySlug: organizations.length,
        membership: memberships.length,
        subscription: subscriptions.length,
        onboarding: onboarding.length,
        onboardingData: onboardingData.length,
      },
    });
  }

  return audit;
}

async function seedCustomer(config, customer) {
  const email = normalizedEmail(process.env[customer.emailEnv]);
  const password = process.env[customer.passwordEnv] ?? "";
  const authUser = await ensureAuthUser(config, customer, email, password);
  const now = new Date().toISOString();

  const profile = await upsertOne(config, "profiles", "user_id", {
    user_id: authUser.id,
    first_name: customer.user.firstName,
    last_name: customer.user.lastName,
    preferred_name: customer.user.firstName,
    timezone: customer.organization.timezone,
    updated_at: now,
  });

  const organization = await upsertOne(config, "organizations", "slug", {
    name: customer.organization.name,
    slug: customer.organization.slug,
    organization_type: customer.organization.organizationType,
    timezone: customer.organization.timezone,
    status: customer.organization.status,
    updated_at: now,
  });

  const membership = await upsertOne(config, "organization_members", "organization_id,user_id", {
    organization_id: organization.id,
    user_id: authUser.id,
    role: customer.role,
    status: "active",
    joined_at: now,
    updated_at: now,
  });

  const plan = await getPlanByCode(config, customer.planCode);
  const subscription = await upsertOne(
    config,
    "organization_subscriptions",
    "organization_id",
    {
      organization_id: organization.id,
      plan_id: plan.id,
      status: "active",
      ends_at: null,
      updated_at: now,
    },
  );

  const onboarding = await upsertOne(
    config,
    "organization_onboarding",
    "organization_id",
    {
      organization_id: organization.id,
      current_step: customer.onboarding.currentStep,
      completion_percent: customer.onboarding.completionPercent,
      status: "in_progress",
      submitted_at: null,
      reviewed_at: null,
      updated_at: now,
    },
  );

  for (const row of onboardingDataRows(customer, organization.id)) {
    await upsertOne(config, "organization_onboarding_data", "organization_id,section", {
      ...row,
      updated_at: now,
    });
  }

  await recordAuditEvent(config, {
    actor_user_id: authUser.id,
    organization_id: organization.id,
    event_name: "qa_customer_seeded",
    target_type: "organization",
    target_id: organization.id,
    metadata: {
      prd: "PRD-016",
      qa_key: customer.key,
      plan_code: customer.planCode,
      onboarding_completion_percent: customer.onboarding.completionPercent,
    },
  });

  const entitlements = await entitlementMapForOrganization(config, organization.id);
  const entitlementResults = expectedEntitlementResults(
    PLAN_EXPECTATIONS[customer.planCode],
    entitlements,
  );

  return {
    key: customer.key,
    label: customer.label,
    authUserId: authUser.id,
    authUserCreated: authUser.created,
    authUserAudit: authUser.audit,
    credentialStatus: authUser.credentialStatus,
    activation: authUser.activation,
    emailEnv: customer.emailEnv,
    passwordEnv: customer.passwordEnv,
    profile,
    organization,
    membership,
    plan,
    subscription,
    onboarding,
    entitlementResults,
    session: null,
  };
}

async function ensurePlansAndFeatures(config) {
  const now = new Date().toISOString();
  const planRows = [
    { code: "launch", name: "Launch", status: "active", updated_at: now },
    { code: "growth", name: "Growth", status: "active", updated_at: now },
  ];

  for (const plan of planRows) {
    await upsertOne(config, "plans", "code", plan);
  }

  for (const [code, feature] of Object.entries(FEATURE_SEED)) {
    await upsertOne(config, "features", "code", {
      code,
      name: feature.name,
      description: feature.description,
      category: feature.category,
      updated_at: now,
    });
  }

  for (const [planCode, expectations] of Object.entries(PLAN_EXPECTATIONS)) {
    const plan = await getPlanByCode(config, planCode);
    for (const [featureCode, enabled] of Object.entries(expectations)) {
      const feature = await getFeatureByCode(config, featureCode);
      await upsertOne(config, "plan_features", "plan_id,feature_id", {
        plan_id: plan.id,
        feature_id: feature.id,
        access_level: enabled ? "available" : "unavailable",
        limits_json: {},
        updated_at: now,
      });
    }
  }
}

async function ensureAuthUser(config, customer, email, password) {
  const existingUser = await findAuthUserByEmail(config, email);
  if (existingUser) {
    if (normalizedEmail(existingUser.email) !== email) {
      throw new Error(`Refusing to update credentials for non-matching QA email in ${customer.emailEnv}.`);
    }
    const updatedUser = await adminAuthRequest(
      config,
      `/auth/v1/admin/users/${existingUser.id}`,
      {
        method: "PUT",
        operationName: `Supabase Admin Auth updateUserById ${customer.label}`,
        body: {
          password,
          email_confirm: true,
          user_metadata: {
            ...(existingUser.user_metadata ?? {}),
            full_name: `${customer.user.firstName} ${customer.user.lastName}`,
            qa_customer: customer.key,
            prd: "PRD-016",
          },
        },
      },
    );

    return {
      id: existingUser.id,
      created: false,
      credentialStatus: "password_set_by_admin",
      audit: authAudit(updatedUser, existingUser),
      activation: {
        status: "existing_user_reused",
        safeAction:
          "Use the local QA password configured for this exact QA email. No invitation email is sent by default.",
        emailSentBySeed: false,
      },
    };
  }

  const createdUser = await adminAuthRequest(config, "/auth/v1/admin/users", {
    method: "POST",
    operationName: `Supabase Admin Auth createUser ${customer.label}`,
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `${customer.user.firstName} ${customer.user.lastName}`,
        qa_customer: customer.key,
        prd: "PRD-016",
      },
    },
  });

  return {
    id: createdUser.id,
    created: true,
    credentialStatus: "password_set_by_admin",
    audit: authAudit(createdUser),
    activation: {
      status: "auth_user_created",
      safeAction:
        "Use the local QA password configured for this exact QA email. No invitation email is sent by default.",
      emailSentBySeed: false,
    },
  };
}

async function findAuthUserByEmail(config, email) {
  const users = await findAuthUsersByEmail(config, email);
  if (users.length > 1) {
    throw new Error(`Duplicate Supabase Auth users found for normalized QA email ${redactedEmail(email)}.`);
  }
  return users[0] ?? null;
}

async function findAuthUsersByEmail(config, email) {
  const matches = [];
  let page = 1;
  while (page <= 100) {
    const result = await adminAuthRequest(
      config,
      `/auth/v1/admin/users?page=${page}&per_page=1000`,
      {
        method: "GET",
        operationName: "Supabase Admin Auth listUsers",
      },
    );
    const users = Array.isArray(result) ? result : result.users ?? [];
    matches.push(...users.filter((user) => normalizedEmail(user.email) === email));
    if (users.length < 1000) return matches;
    page += 1;
  }
  throw new Error("Could not locate auth user because Auth user pagination exceeded 100 pages.");
}

async function runTenantIsolationChecks(config, customers) {
  const agentA = customers.find((customer) => customer.key === "agentA");
  const agentB = customers.find((customer) => customer.key === "agentB");
  const sessionA = agentA?.session;
  const sessionB = agentB?.session;

  if (!agentA || !agentB || !sessionA?.accessToken || !sessionB?.accessToken) {
    return [
      {
        name: "Tenant isolation checks",
        passed: false,
        details: { reason: "verification sessions were not available for both QA users" },
      },
    ];
  }

  const checks = [];
  const add = (name, passed, details = {}) => {
    checks.push({ name, passed: Boolean(passed), details });
  };

  const aOwnOrg = await restSelect(config, "organizations", sessionA.accessToken, {
    select: "id,slug,name",
    id: `eq.${agentA.organization.id}`,
  });
  add("Agent A can read Agent A organization", aOwnOrg.length === 1, {
    rowsReturned: aOwnOrg.length,
  });

  const aOtherOrg = await restSelect(config, "organizations", sessionA.accessToken, {
    select: "id,slug,name",
    id: `eq.${agentB.organization.id}`,
  });
  add("Agent A cannot read Agent B organization", aOtherOrg.length === 0, {
    rowsReturned: aOtherOrg.length,
  });

  const aOtherOnboarding = await restSelect(
    config,
    "organization_onboarding",
    sessionA.accessToken,
    {
      select: "organization_id,completion_percent,status",
      organization_id: `eq.${agentB.organization.id}`,
    },
  );
  const originalBOnboarding = await serviceSelectOne(config, "organization_onboarding", {
    select: "organization_id,completion_percent,status",
    organization_id: `eq.${agentB.organization.id}`,
  });
  const blockedUpdate = await restPatch(
    config,
    "organization_onboarding",
    sessionA.accessToken,
    { organization_id: `eq.${agentB.organization.id}` },
    { completion_percent: 64, updated_at: new Date().toISOString() },
  );
  const finalBOnboarding = await serviceSelectOne(config, "organization_onboarding", {
    select: "organization_id,completion_percent,status",
    organization_id: `eq.${agentB.organization.id}`,
  });
  add(
    "Agent A cannot read or update Agent B onboarding",
    aOtherOnboarding.length === 0 &&
      blockedUpdate.length === 0 &&
      finalBOnboarding.completion_percent === originalBOnboarding.completion_percent,
    {
      readRowsReturned: aOtherOnboarding.length,
      updateRowsReturned: blockedUpdate.length,
      unchangedCompletionPercent: finalBOnboarding.completion_percent,
    },
  );

  const aOtherProfile = await restSelect(config, "profiles", sessionA.accessToken, {
    select: "user_id,first_name,last_name",
    user_id: `eq.${agentB.authUserId}`,
  });
  add("Agent A cannot read Agent B profile through customer APIs", aOtherProfile.length === 0, {
    rowsReturned: aOtherProfile.length,
  });

  const aOtherSubscription = await restSelect(
    config,
    "organization_subscriptions",
    sessionA.accessToken,
    {
      select: "organization_id,plan_id,status",
      organization_id: `eq.${agentB.organization.id}`,
    },
  );
  add("Agent A cannot access Agent B entitlements", aOtherSubscription.length === 0, {
    subscriptionRowsReturned: aOtherSubscription.length,
  });

  const bOtherRecords = await Promise.all([
    restSelect(config, "organizations", sessionB.accessToken, {
      select: "id",
      id: `eq.${agentA.organization.id}`,
    }),
    restSelect(config, "organization_onboarding", sessionB.accessToken, {
      select: "organization_id",
      organization_id: `eq.${agentA.organization.id}`,
    }),
    restSelect(config, "profiles", sessionB.accessToken, {
      select: "user_id",
      user_id: `eq.${agentA.authUserId}`,
    }),
  ]);
  add("Agent B cannot access Agent A records", bOtherRecords.every((rows) => rows.length === 0), {
    organizationRowsReturned: bOtherRecords[0].length,
    onboardingRowsReturned: bOtherRecords[1].length,
    profileRowsReturned: bOtherRecords[2].length,
  });

  const aInjectedOrgData = await restSelect(
    config,
    "organization_onboarding_data",
    sessionA.accessToken,
    {
      select: "organization_id,section",
      organization_id: `eq.${agentB.organization.id}`,
    },
  );
  add(
    "Changing organization_id in a browser request does not bypass server authorization",
    aInjectedOrgData.length === 0,
    { rowsReturned: aInjectedOrgData.length },
  );

  const aRestrictedFeatures = [
    "automated_follow_up",
    "advanced_crm",
    "ai_isa",
    "internal_ai",
    "team_management",
    "lead_routing",
    "brokerage_reporting",
  ];
  const launchRestricted = aRestrictedFeatures.map((featureCode) => ({
    featureCode,
    allowed: agentA.entitlementResults[featureCode]?.actualEnabled === true,
  }));
  add("Launch-only restricted features remain blocked for Agent A", launchRestricted.every((row) => !row.allowed), {
    features: launchRestricted,
  });

  const bGrowthFeatures = [
    "idx_property_search",
    "crm",
    "ai_property_assistant",
    "analytics",
    "automated_follow_up",
    "advanced_crm",
  ];
  const growthAvailable = bGrowthFeatures.map((featureCode) => ({
    featureCode,
    allowed: agentB.entitlementResults[featureCode]?.actualEnabled === true,
  }));
  add("Growth entitlements are available to Agent B", growthAvailable.every((row) => row.allowed), {
    features: growthAvailable,
  });

  const serverRestricted = await canServerAccessFeature(config, {
    userId: agentA.authUserId,
    organizationId: agentB.organization.id,
    featureCode: "automated_follow_up",
  });
  const serverOwnRestricted = await canServerAccessFeature(config, {
    userId: agentA.authUserId,
    organizationId: agentA.organization.id,
    featureCode: "automated_follow_up",
  });
  add(
    "Server-side authorization blocks restricted features even when manually constructed",
    serverRestricted.allowed === false && serverOwnRestricted.allowed === false,
    {
      crossTenantAllowed: serverRestricted.allowed,
      ownLaunchRestrictedAllowed: serverOwnRestricted.allowed,
    },
  );

  return checks;
}

async function canServerAccessFeature(config, { userId, organizationId, featureCode }) {
  const membership = await serviceSelect(config, "organization_members", {
    select: "id",
    user_id: `eq.${userId}`,
    organization_id: `eq.${organizationId}`,
    status: "eq.active",
    limit: 1,
  });
  if (membership.length === 0) return { allowed: false, reason: "not_active_member" };

  const entitlements = await entitlementMapForOrganization(config, organizationId);
  const entitlement = entitlements[featureCode];
  return {
    allowed: entitlement?.accessLevel !== undefined && entitlement.accessLevel !== "unavailable",
    reason: entitlement?.accessLevel ?? "missing_feature",
  };
}

async function customerSession(config, customer) {
  const email = normalizedEmail(process.env[customer.emailEnv]);
  const password = process.env[customer.passwordEnv] ?? "";
  const session = await anonAuthRequest(config, "/auth/v1/token?grant_type=password", {
    method: "POST",
    operationName: `Supabase Auth password grant ${customer.label}`,
    body: {
      email,
      password,
    },
  });
  if (!session.access_token) {
    throw new SafeOperationError({
      operation: `Supabase Auth password grant ${customer.label}`,
      status: 200,
      code: null,
      message: "Supabase did not return an access token.",
    });
  }

  return {
    status: "passed",
    operation: "POST /auth/v1/token?grant_type=password",
    accessToken: session.access_token,
  };
}

function onboardingDataRows(customer, organizationId) {
  const marker = `PRD-016 ${customer.label}`;
  const serviceAreas = customer.onboarding.serviceAreas.join(", ");
  const goals = customer.onboarding.goals.join(", ");

  return [
    {
      organization_id: organizationId,
      section: "account",
      data_json: {
        qa_marker: marker,
        preferred_name: customer.user.firstName,
        timezone: customer.organization.timezone,
        phone: "QA placeholder only",
      },
    },
    {
      organization_id: organizationId,
      section: "business",
      data_json: {
        qa_marker: marker,
        business_type: customer.organization.organizationType,
        brokerage_name: customer.onboarding.brokerage,
        license_state: customer.onboarding.licenseState,
        service_areas: serviceAreas,
        primary_market: customer.onboarding.primaryMarket,
        current_website_url: customer.onboarding.currentWebsite,
        current_crm: customer.key === "agentA" ? "Spreadsheet lead tracker" : "Shared team pipeline",
        primary_goals: goals,
      },
    },
    {
      organization_id: organizationId,
      section: "connections",
      data_json: {
        qa_marker: marker,
        google_calendar_status: customer.key === "agentA" ? "not connected - QA A" : "requested - QA B",
        email_provider_status: customer.key === "agentA" ? "manual follow-up" : "team inbox review",
        crm_status: customer.key === "agentA" ? "needs organization" : "pipeline import planned",
        existing_website_status: customer.onboarding.currentWebsite,
        domain_provider: "QA placeholder",
      },
    },
    {
      organization_id: organizationId,
      section: "mls_idx",
      data_json: {
        qa_marker: marker,
        mls_organization: customer.key === "agentA" ? "Canopy MLS QA" : "NTREIS QA",
        participant_name: `${customer.user.firstName} ${customer.user.lastName}`,
        brokerage: customer.onboarding.brokerage,
        intended_domain: customer.onboarding.currentWebsite,
        approval_status: customer.key === "agentA" ? "information gathering" : "brokerage approval queued",
        internal_notes: `${marker} onboarding data is intentionally distinguishable.`,
      },
    },
    {
      organization_id: organizationId,
      section: "growth_goals",
      data_json: {
        qa_marker: marker,
        buyer_leads: customer.key === "agentA" ? "primary goal" : "secondary",
        listings: customer.key === "agentA" ? "not first priority" : "primary goal",
        follow_up: customer.key === "agentA" ? "lead organization needed" : "automation requested",
        local_visibility: customer.key === "agentA" ? "primary goal" : "market expansion",
        internal_ai: "not requested",
        team_building: customer.key === "agentA" ? "solo agent" : "team workflow",
        success_90_days: goals,
      },
    },
    {
      organization_id: organizationId,
      section: "review",
      data_json: {
        qa_marker: marker,
        requested_growth_services: goals,
        missing_fields: customer.key === "agentA" ? "Lead source mapping incomplete" : "Conversion tracking baseline incomplete",
        next_steps: customer.key === "agentA" ? "Review buyer lead flow" : "Review seller follow-up automation",
      },
    },
  ];
}

async function getPlanByCode(config, code) {
  return serviceSelectOne(config, "plans", {
    select: "id,code,name,status",
    code: `eq.${code}`,
    limit: 1,
  });
}

async function getFeatureByCode(config, code) {
  return serviceSelectOne(config, "features", {
    select: "id,code,name,description,category",
    code: `eq.${code}`,
    limit: 1,
  });
}

async function entitlementMapForOrganization(config, organizationId) {
  const subscription = await serviceSelectOne(config, "organization_subscriptions", {
    select: "organization_id,plan_id,status",
    organization_id: `eq.${organizationId}`,
    limit: 1,
  });
  const [features, planFeatures, overrides] = await Promise.all([
    serviceSelect(config, "features", {
      select: "id,code,name,description,category",
      code: `in.(${REQUIRED_FEATURE_CODES.join(",")})`,
    }),
    serviceSelect(config, "plan_features", {
      select: "plan_id,feature_id,access_level,limits_json",
      plan_id: `eq.${subscription.plan_id}`,
    }),
    serviceSelect(config, "organization_feature_overrides", {
      select: "organization_id,feature_id,enabled,limits_json",
      organization_id: `eq.${organizationId}`,
    }),
  ]);

  const planByFeatureId = new Map(planFeatures.map((row) => [row.feature_id, row]));
  const overrideByFeatureId = new Map(overrides.map((row) => [row.feature_id, row]));
  const entitlements = {};

  for (const feature of features) {
    const override = overrideByFeatureId.get(feature.id);
    const planFeature = planByFeatureId.get(feature.id);
    entitlements[feature.code] = {
      accessLevel: override
        ? override.enabled
          ? "available"
          : "unavailable"
        : planFeature?.access_level ?? "unavailable",
      source: override ? "override" : "plan",
    };
  }

  return entitlements;
}

function expectedEntitlementResults(expectations, actual) {
  return Object.fromEntries(
    Object.entries(expectations).map(([featureCode, expectedEnabled]) => {
      const accessLevel = actual[featureCode]?.accessLevel ?? "unavailable";
      const actualEnabled = accessLevel !== "unavailable";
      return [
        featureCode,
        {
          expectedEnabled,
          actualEnabled,
          accessLevel,
          passed: actualEnabled === expectedEnabled,
        },
      ];
    }),
  );
}

async function upsertOne(config, table, onConflict, row) {
  const result = await serviceRest(config, table, {
    method: "POST",
    query: { on_conflict: onConflict },
    body: row,
    prefer: "resolution=merge-duplicates,return=representation",
  });
  if (!Array.isArray(result) || !result[0]) {
    throw new Error(`Upsert into ${table} did not return a row.`);
  }
  return result[0];
}

async function recordAuditEvent(config, event) {
  const existing = await serviceSelect(config, "customer_account_audit_events", {
    select: "id",
    event_name: `eq.${event.event_name}`,
    target_type: `eq.${event.target_type}`,
    target_id: `eq.${event.target_id}`,
    limit: 1,
  });
  if (existing.length > 0) return { status: "reused" };

  await serviceRest(config, "customer_account_audit_events", {
    method: "POST",
    body: event,
    prefer: "return=minimal",
  });
  return { status: "created" };
}

async function serviceSelectOne(config, table, query) {
  const rows = await serviceSelect(config, table, query);
  if (!rows[0]) throw new Error(`No ${table} row matched the expected QA seed query.`);
  return rows[0];
}

async function serviceSelect(config, table, query) {
  const result = await serviceRest(config, table, { method: "GET", query });
  return Array.isArray(result) ? result : [];
}

async function restSelect(config, table, accessToken, query) {
  const result = await customerRest(config, table, accessToken, {
    method: "GET",
    query,
  });
  return Array.isArray(result) ? result : [];
}

async function restPatch(config, table, accessToken, query, body) {
  const result = await customerRest(config, table, accessToken, {
    method: "PATCH",
    query,
    body,
    prefer: "return=representation",
  });
  return Array.isArray(result) ? result : [];
}

async function serviceRest(config, table, options) {
  return supabaseRest(config, table, config.serviceRoleKey, config.serviceRoleKey, options);
}

async function customerRest(config, table, accessToken, options) {
  return supabaseRest(config, table, config.authGatewayKey, accessToken, options);
}

async function supabaseRest(config, table, apiKey, bearer, options) {
  const endpoint = new URL(`${config.supabaseUrl}/rest/v1/${table}`);
  Object.entries(options.query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") endpoint.searchParams.set(key, String(value));
  });

  const operation = `Supabase REST ${table} ${options.method}`;
  const response = await safeFetch(operation, endpoint, {
    method: options.method,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${bearer}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return parseSupabaseResponse(response, operation);
}

async function adminAuthRequest(config, path, options) {
  const operation =
    options.operationName ?? `Supabase Admin Auth ${options.method} ${path.split("?")[0]}`;
  const response = await safeFetch(operation, `${config.supabaseUrl}${path}`, {
    method: options.method,
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return parseSupabaseResponse(response, operation);
}

async function anonAuthRequest(config, path, options) {
  const operation = options.operationName ?? `Supabase Auth ${options.method} ${path}`;
  const response = await safeFetch(operation, `${config.supabaseUrl}${path}`, {
    method: options.method,
    headers: {
      apikey: config.authGatewayKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return parseSupabaseResponse(response, operation);
}

async function safeFetch(operation, input, init) {
  try {
    return await fetch(input, init);
  } catch (error) {
    throw new SafeOperationError({
      operation,
      status: 0,
      code: null,
      message: error instanceof Error && error.message ? error.message : "fetch failed",
    });
  }
}

async function parseSupabaseResponse(response, operation) {
  const text = await response.text();
  const payload = text ? safeJson(text) : null;
  if (!response.ok) {
    throw new SafeOperationError({
      operation,
      status: response.status,
      code: supabaseErrorCode(payload),
      message: supabaseError(payload),
    });
  }
  return payload;
}

class SafeOperationError extends Error {
  constructor({ operation, status, code, message }) {
    super(`${operation} failed with status ${status}: ${message || "Unknown Supabase error."}`);
    this.name = "SafeOperationError";
    this.operation = operation;
    this.status = status;
    this.code = code ?? null;
    this.safeMessage = message || "Unknown Supabase error.";
  }
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function supabaseError(payload) {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object") return "Unknown Supabase error.";
  return [payload.message, payload.error, payload.error_description, payload.msg, payload.hint]
    .filter((value) => typeof value === "string" && value)
    .join(" ");
}

function supabaseErrorCode(payload) {
  if (!payload || typeof payload !== "object") return null;
  return stringOrNull(payload.code) ?? stringOrNull(payload.error_code);
}

function writeReport(report) {
  mkdirSync(dirname(REPORT_MD_PATH), { recursive: true });
  const safeReport = {
    ...report,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(REPORT_JSON_PATH, `${JSON.stringify(safeReport, null, 2)}\n`);
  writeFileSync(REPORT_MD_PATH, markdownReport(safeReport));
}

function markdownReport(report) {
  const auditRows = (report.initialAudit ?? [])
    .map(
      (row) =>
        `| ${row.label} | ${row.records.authUsersByNormalizedEmail} | ${row.authUser?.id ?? "not found"} | ${row.authUser?.emailConfirmedAt ?? "n/a"} | ${row.authUser?.bannedUntil ?? "none"} | ${row.authUser?.passwordIdentityDetected ? "yes" : "no"} | ${row.records.profile} | ${row.records.organizationsBySlug} | ${row.records.membership} | ${row.records.subscription} | ${row.records.onboarding} | ${row.records.onboardingData} |`,
    )
    .join("\n");
  const customerRows = report.customers
    .map(
      (customer) =>
        `| ${customer.label} | ${customer.authUserId} | ${customer.organizationId} | ${customer.membershipId} | ${customer.assignedPlanCode} | ${customer.onboardingPercent}% | ${customer.stageStatus.authUser} | ${customer.stageStatus.profile} | ${customer.stageStatus.organization} | ${customer.stageStatus.subscription} | ${customer.stageStatus.verificationSession} |`,
    )
    .join("\n");
  const entitlementRows = report.customers
    .flatMap((customer) =>
      Object.entries(customer.entitlements).map(
        ([featureCode, result]) =>
          `| ${customer.label} | ${featureCode} | ${result.expectedEnabled ? "enabled" : "disabled"} | ${result.actualEnabled ? "enabled" : "disabled"} | ${result.accessLevel} | ${result.passed ? "pass" : "fail"} |`,
      ),
    )
    .join("\n");
  const isolationRows = report.tenantIsolation
    .map((check) => `| ${check.name} | ${check.passed ? "pass" : "fail"} | ${oneLine(JSON.stringify(check.details ?? {}))} |`)
    .join("\n");
  const failure = report.failure
    ? `\n## Failure\n\n- Operation: ${report.failure.operation ?? "unknown"}\n- HTTP status: ${report.failure.status ?? "n/a"}\n- Supabase code: ${report.failure.code ?? "n/a"}\n- Message: ${report.failure.message}\n`
    : "";

  return `# PRD-016 QA Customers Report

Generated: ${report.generatedAt}

Status: ${report.status ?? "unknown"}

Seed method: \`${report.seedMethod}\`

Activation method: ${report.activationMethod}

Auth method: ${report.authMethod ?? "not recorded"}

No passwords, service-role keys, refresh tokens, access tokens, raw activation links, or authorization headers are included in this report.

Default QA seeding does not send invitation email. QA users authenticate with the locally configured QA credentials. Real customer invitation delivery remains a separate production-readiness task.

## Existing Data Audit

| Customer | Auth users by email | Auth user ID | Email confirmed at | Banned until | Password identity detectable | Profiles | Orgs by slug | Memberships | Subscriptions | Onboarding | Onboarding data rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${auditRows || "| Not run | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |"}

## Customers

| Customer | Auth user ID | Organization ID | Membership ID | Plan | Onboarding | Auth user | Profile | Organization | Subscription | Verification session |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${customerRows || "| Not run | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |"}

## Entitlements

| Customer | Feature | Expected | Actual | Access level | Result |
| --- | --- | --- | --- | --- | --- |
${entitlementRows || "| Not run | n/a | n/a | n/a | n/a | n/a |"}

## Tenant Isolation

| Check | Result | Details |
| --- | --- | --- |
${isolationRows || "| Not run | n/a | n/a |"}
${failure}
`;
}

function normalizedEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function isEmailLike(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function relativePath(filePath) {
  return filePath.replace(`${ROOT_DIR}\\`, "").replace(`${ROOT_DIR}/`, "");
}

function reportCustomer(customer) {
  return {
    key: customer.key,
    label: customer.label,
    authUserId: customer.authUserId,
    authUserCreated: customer.authUserCreated,
    authUserAudit: customer.authUserAudit,
    organizationId: customer.organization.id,
    membershipId: customer.membership.id,
    assignedPlanCode: customer.plan.code,
    subscriptionStatus: customer.subscription.status,
    onboardingPercent: customer.onboarding.completion_percent,
    entitlements: customer.entitlementResults,
    activation: customer.activation,
    stageStatus: {
      authUser: customer.authUserCreated ? "created" : "reused",
      credentials: customer.credentialStatus ?? "unknown",
      profile: "upserted",
      organization: "upserted",
      membership: "upserted",
      subscription: "assigned",
      onboarding: "upserted",
      onboardingData: "upserted",
      verificationSession:
        customer.session?.status === "passed"
          ? "passed"
          : customer.session?.status === "failed"
            ? "failed"
            : "not_run",
      isolationChecks: "reported separately",
    },
  };
}

function authAudit(user, fallback = null) {
  const source = user && user.id ? user : fallback;
  return {
    id: source?.id ?? null,
    emailConfirmedAt: source?.email_confirmed_at ?? null,
    bannedUntil: source?.banned_until ?? null,
    userMetadataKeys: Object.keys(source?.user_metadata ?? {}).sort(),
    passwordIdentityDetected: hasPasswordIdentity(source),
  };
}

function hasPasswordIdentity(user) {
  const identities = Array.isArray(user?.identities) ? user.identities : [];
  return identities.some((identity) => identity.provider === "email");
}

function strongPasswordErrors(password, email) {
  const errors = [];
  if (password.length < 14) errors.push("must be at least 14 characters");
  if (!/[a-z]/.test(password)) errors.push("must include lowercase");
  if (!/[A-Z]/.test(password)) errors.push("must include uppercase");
  if (!/[0-9]/.test(password)) errors.push("must include a digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("must include a symbol");
  const localPart = email.split("@")[0]?.toLowerCase();
  if (localPart && password.toLowerCase().includes(localPart)) {
    errors.push("must not include the email local part");
  }
  if (/password|temporary|testagent|opzix/i.test(password)) {
    errors.push("must not include obvious test words");
  }
  return errors;
}

function printReportSummary(report) {
  console.log(`PRD-016 QA customer seed ${report.status}.`);
  console.log(`Report: ${relativePath(REPORT_MD_PATH)}`);
  for (const customer of report.customers ?? []) {
    console.log(
      `${customer.label}: auth ${customer.stageStatus.authUser}; profile ${customer.stageStatus.profile}; organization ${customer.stageStatus.organization}; subscription ${customer.stageStatus.subscription}; verification ${customer.stageStatus.verificationSession}.`,
    );
  }
  if (report.failure) {
    console.log(
      `Failure: ${report.failure.operation ?? "unknown"} status ${report.failure.status ?? "n/a"} code ${report.failure.code ?? "n/a"} - ${report.failure.message}`,
    );
  }
}

function errorReport(error) {
  if (error instanceof SafeOperationError) {
    return {
      operation: error.operation,
      status: error.status,
      code: error.code,
      message: safeErrorMessage(error.safeMessage),
    };
  }
  return {
    operation: "script",
    status: null,
    code: null,
    message: safeErrorMessage(error instanceof Error ? error.message : String(error)),
  };
}

function stringOrNull(value) {
  return typeof value === "string" && value ? value : null;
}

function oneLine(value) {
  return value.replace(/\s+/g, " ").replace(/\|/g, "\\|");
}

function redactedEmail(email) {
  const [local, domain] = email.split("@");
  return `${local?.slice(0, 2) || "qa"}***@${domain || "redacted"}`;
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/access_token=[^&\s]+/gi, "access_token=[redacted]")
    .replace(/refresh_token=[^&\s]+/gi, "refresh_token=[redacted]")
    .replace(/token_hash=[^&\s]+/gi, "token_hash=[redacted]")
    .replace(/password["']?\s*[:=]\s*["'][^"']+["']/gi, 'password:"[redacted]"')
    .replace(/apikey["']?\s*[:=]\s*["'][^"']+["']/gi, 'apikey:"[redacted]"')
    .replace(/Authorization["']?\s*[:=]\s*["'][^"']+["']/gi, 'Authorization:"[redacted]"')
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+/g, "Bearer [redacted]");
}

main().catch((error) => {
  console.error(`QA customer seed failed: ${safeErrorMessage(error)}`);
  process.exitCode = 1;
});
