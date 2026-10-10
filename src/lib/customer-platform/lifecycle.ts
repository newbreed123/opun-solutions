import {
  getSupabaseAdminConfig,
  supabaseAdminFetch,
  supabaseAdminRpc,
} from "@/lib/supabase-admin";
import type { OrganizationStatus } from "./types";

const PROTECTED_PRODUCTION_ORGANIZATION_NAMES = new Set([
  "Good Fortune Homes",
  "BrittanyFlannigan",
]);

type OrganizationLifecycleRow = {
  id: string;
  name: string;
  status: OrganizationStatus;
  metadata: Record<string, unknown>;
  is_test_account?: boolean;
};

type CountRow = { exact_count?: number };
type MemberLifecycleRow = {
  id: string;
  user_id: string;
  status: string;
};
type InvitationLifecycleRow = {
  id: string;
  auth_user_id: string | null;
};
type SubscriptionLifecycleRow = {
  status: string;
  external_subscription_id: string | null;
};
type AssetLifecycleRow = {
  bucket: string;
  object_path: string;
};
type DeletionJobState =
  | "pending"
  | "storage_cleanup"
  | "storage_complete"
  | "database_cleanup"
  | "completed"
  | "failed";
type DeletionJobRow = {
  id: string;
  target_organization_id: string;
  organization_name: string;
  state: DeletionJobState;
  storage_completed_at: string | null;
};

export type CustomerDeletionSummary = {
  organizationId: string;
  organizationName: string;
  organizationStatus: OrganizationStatus;
  isTestAccount: boolean;
  organizationMembers: number;
  authIdentities: number;
  sharedAuthRelationships: number;
  invitations: number;
  onboardingRecords: number;
  onboardingAssets: number;
  storageObjects: number;
  launchUpdates: number;
  notesAndInformationRequests: number;
  subscriptionsAndEntitlements: number;
  financialDependencies: number;
  auditEvents: number;
  activeDeletionJobState: DeletionJobState | null;
  associatedExternalData: string[];
  protectedReasons: string[];
  canDelete: boolean;
};

export async function loadCustomerDeletionSummary(organizationId: string) {
  const organization = await loadOrganization(organizationId);
  if (!organization) return null;

  const [
    members,
    invitations,
    onboarding,
    onboardingData,
    assets,
    launchStatus,
    launchUpdates,
    notes,
    informationRequests,
    subscriptions,
    featureOverrides,
    commercialTerms,
    auditEvents,
    activeDeletionJobs,
  ] = await Promise.all([
    supabaseAdminFetch<MemberLifecycleRow[]>("organization_members", {
      query: {
        select: "id,user_id,status",
        organization_id: `eq.${organizationId}`,
      },
    }),
    supabaseAdminFetch<InvitationLifecycleRow[]>("organization_invitations", {
      query: {
        select: "id,auth_user_id",
        organization_id: `eq.${organizationId}`,
      },
    }),
    countRows("organization_onboarding", organizationId),
    countRows("organization_onboarding_data", organizationId),
    supabaseAdminFetch<AssetLifecycleRow[]>("organization_onboarding_assets", {
      query: {
        select: "bucket,object_path",
        organization_id: `eq.${organizationId}`,
      },
    }),
    countRows("organization_launch_status", organizationId),
    countRows("organization_launch_updates", organizationId),
    countRows("organization_onboarding_internal_notes", organizationId),
    countRows("organization_onboarding_information_requests", organizationId),
    supabaseAdminFetch<SubscriptionLifecycleRow[]>(
      "organization_subscriptions",
      {
        query: {
          select: "status,external_subscription_id",
          organization_id: `eq.${organizationId}`,
        },
      },
    ),
    countRows("organization_feature_overrides", organizationId),
    countRows("organization_commercial_terms", organizationId),
    countRows("customer_account_audit_events", organizationId),
    supabaseAdminFetch<DeletionJobRow[]>("customer_organization_deletion_jobs", {
      query: {
        select: "id,target_organization_id,organization_name,state,storage_completed_at",
        target_organization_id: `eq.${organizationId}`,
        state: "neq.completed",
        order: "created_at.desc",
        limit: 1,
      },
    }),
  ]);

  const memberRows = unwrap(members);
  const invitationRows = unwrap(invitations);
  const assetRows = unwrap(assets);
  const subscriptionRows = unwrap(subscriptions);
  const authIdentityIds = new Set(
    [
      ...memberRows.map((member) => member.user_id),
      ...invitationRows
        .map((invitation) => invitation.auth_user_id)
        .filter((value): value is string => Boolean(value)),
    ].filter(Boolean),
  );
  const sharedAuthRelationships = await countSharedAuthRelationships({
    organizationId,
    authIdentityIds: Array.from(authIdentityIds),
  });
  const activeDeletionJobState = activeDeletionJobs.ok
    ? activeDeletionJobs.data[0]?.state ?? null
    : null;
  const financialDependencies = subscriptionRows.filter(
    (subscription) =>
      ["trialing", "active", "past_due"].includes(subscription.status) ||
      Boolean(subscription.external_subscription_id),
  ).length;
  const protectedReasons = protectedDeletionReasons({
    organization,
    financialDependencies,
  });

  return {
    organizationId,
    organizationName: organization.name,
    organizationStatus: organization.status,
    isTestAccount: organization.is_test_account === true,
    organizationMembers: memberRows.length,
    authIdentities: authIdentityIds.size,
    sharedAuthRelationships,
    invitations: invitationRows.length,
    onboardingRecords: countValue(onboarding) + countValue(onboardingData),
    onboardingAssets: assetRows.length,
    storageObjects: assetRows.length,
    launchUpdates: countValue(launchStatus) + countValue(launchUpdates),
    notesAndInformationRequests: countValue(notes) + countValue(informationRequests),
    subscriptionsAndEntitlements:
      subscriptionRows.length + countValue(featureOverrides) + countValue(commercialTerms),
    financialDependencies,
    auditEvents: countValue(auditEvents),
    activeDeletionJobState,
    associatedExternalData: [
      "Website, CRM, analytics, and AI datasets are not represented by dedicated PRD-016 tables in this repository.",
    ],
    protectedReasons,
    canDelete: protectedReasons.length === 0,
  } satisfies CustomerDeletionSummary;
}

export async function archiveCustomerOrganization(organizationId: string) {
  const result = await supabaseAdminRpc<null>("archive_customer_organization", {
    p_organization_id: organizationId,
  });
  if (!result.ok) {
    return { ok: false as const, error: result.error, status: result.status };
  }
  return { ok: true as const };
}

export async function restoreCustomerOrganization(organizationId: string) {
  const result = await supabaseAdminRpc<null>("restore_customer_organization", {
    p_organization_id: organizationId,
  });
  if (!result.ok) {
    return { ok: false as const, error: result.error, status: result.status };
  }
  return { ok: true as const };
}

export async function permanentlyDeleteCustomerOrganization({
  organizationId,
  confirmationName,
}: {
  organizationId: string;
  confirmationName: string;
}) {
  const summary = await loadCustomerDeletionSummary(organizationId);
  if (!summary) {
    return { ok: false as const, error: "Organization was not found." };
  }
  if (confirmationName !== summary.organizationName) {
    await recordLifecycleEvent(
      organizationId,
      "customer_organization_delete_confirmation_rejected",
    );
    return {
      ok: false as const,
      error: "The confirmation name did not match the organization name.",
    };
  }
  if (!summary.canDelete) {
    await recordLifecycleEvent(
      organizationId,
      "customer_organization_delete_blocked",
      { reason: summary.protectedReasons.join("; ") },
    );
    return {
      ok: false as const,
      error: "Permanent deletion is blocked for this organization.",
    };
  }

  const job = await getOrCreateDeletionJob(summary);
  if (!job.ok) return job;

  const assets = await supabaseAdminFetch<AssetLifecycleRow[]>(
    "organization_onboarding_assets",
    {
      query: {
        select: "bucket,object_path",
        organization_id: `eq.${organizationId}`,
      },
    },
  );
  if (!assets.ok) {
    await failDeletionJob(job.data.id, assets.error);
    return assets;
  }

  const scopedAssets = validateStorageScope(organizationId, assets.data);
  if (!scopedAssets.ok) {
    await failDeletionJob(job.data.id, scopedAssets.error);
    return scopedAssets;
  }

  const storageStarted = await updateDeletionJob(job.data.id, {
    state: "storage_cleanup",
    storage_cleanup_started_at: new Date().toISOString(),
    error_message: null,
    failed_at: null,
  });
  if (!storageStarted.ok) return storageStarted;

  const storageDeleted = await deleteStorageObjects(assets.data);
  if (!storageDeleted.ok) {
    await failDeletionJob(job.data.id, storageDeleted.error);
    await recordLifecycleEvent(
      organizationId,
      "customer_organization_delete_storage_failed",
      { error: storageDeleted.error },
    );
    return storageDeleted;
  }

  const storageComplete = await updateDeletionJob(job.data.id, {
    state: "storage_complete",
    storage_completed_at: new Date().toISOString(),
    storage_objects_deleted: assets.data.length,
  });
  if (!storageComplete.ok) return storageComplete;

  await recordLifecycleEvent(organizationId, "customer_organization_delete_started", {
    deletionJobId: job.data.id,
    organizationName: summary.organizationName,
    storageObjects: String(assets.data.length),
  });

  const completed = await supabaseAdminRpc<null>(
    "complete_customer_organization_deletion",
    { p_deletion_job_id: job.data.id },
  );
  if (!completed.ok) {
    await failDeletionJob(job.data.id, completed.error);
    return {
      ok: false as const,
      error: sanitizeError(completed.error),
      status: completed.status,
    };
  }

  return { ok: true as const };
}

async function loadOrganization(organizationId: string) {
  const result = await supabaseAdminFetch<OrganizationLifecycleRow[]>(
    "organizations",
    {
      query: {
        select: "id,name,status,metadata,is_test_account",
        id: `eq.${organizationId}`,
        limit: 1,
      },
    },
  );
  if (!result.ok) throw new Error(result.error);
  return result.data[0] ?? null;
}

async function countRows(table: string, organizationId: string) {
  return supabaseAdminFetch<CountRow[]>(table, {
    query: {
      select: "exact_count:count()",
      organization_id: `eq.${organizationId}`,
    },
  });
}

async function countSharedAuthRelationships({
  organizationId,
  authIdentityIds,
}: {
  organizationId: string;
  authIdentityIds: string[];
}) {
  if (!authIdentityIds.length) return 0;
  const result = await supabaseAdminFetch<MemberLifecycleRow[]>(
    "organization_members",
    {
      query: {
        select: "id,user_id,status",
        user_id: `in.(${authIdentityIds.join(",")})`,
        organization_id: `neq.${organizationId}`,
      },
    },
  );
  if (!result.ok) throw new Error(result.error);
  return result.data.length;
}

function protectedDeletionReasons({
  organization,
  financialDependencies,
}: {
  organization: OrganizationLifecycleRow;
  financialDependencies: number;
}) {
  const reasons: string[] = [];
  if (organization.status !== "archived") {
    reasons.push("Organization must be archived before permanent deletion.");
  }
  if (organization.is_test_account !== true) {
    reasons.push("Permanent deletion is restricted to confirmed QA / test organizations.");
  }
  if (PROTECTED_PRODUCTION_ORGANIZATION_NAMES.has(organization.name)) {
    reasons.push("This production organization is explicitly protected from deletion.");
  }
  if (financialDependencies > 0) {
    reasons.push(
      "Subscription or external billing dependency is present; archive instead until financial retention is resolved.",
    );
  }
  return reasons;
}

async function getOrCreateDeletionJob(summary: CustomerDeletionSummary) {
  const existing = await supabaseAdminFetch<DeletionJobRow[]>(
    "customer_organization_deletion_jobs",
    {
      query: {
        select: "id,target_organization_id,organization_name,state,storage_completed_at",
        target_organization_id: `eq.${summary.organizationId}`,
        state: "neq.completed",
        order: "created_at.desc",
        limit: 1,
      },
    },
  );
  if (!existing.ok) return existing;
  const reusable = existing.data[0];
  if (reusable) {
    if (reusable.state === "failed") {
      const resetState: DeletionJobState = reusable.storage_completed_at
        ? "storage_complete"
        : "pending";
      const reset = await updateDeletionJob(reusable.id, {
        state: resetState,
        error_message: null,
        failed_at: null,
        updated_at: new Date().toISOString(),
      });
      if (!reset.ok) return reset;
    }
    return { ok: true as const, data: reusable, status: 200 };
  }

  const created = await supabaseAdminFetch<DeletionJobRow[]>(
    "customer_organization_deletion_jobs",
    {
      method: "POST",
      body: {
        target_organization_id: summary.organizationId,
        organization_name: summary.organizationName,
        organization_status: summary.organizationStatus,
        state: "pending",
        requested_by: "opzix-admin-session",
        dependency_summary: deletionDependencySnapshot(summary),
        storage_objects_planned: summary.storageObjects,
        auth_users_deleted: false,
      },
      prefer: "return=representation",
    },
  );
  if (!created.ok) {
    return {
      ok: false as const,
      error: sanitizeError(created.error),
      status: created.status,
    };
  }
  return { ok: true as const, data: created.data[0], status: created.status };
}

async function updateDeletionJob(
  jobId: string,
  body: Record<string, string | number | null>,
) {
  const updated = await supabaseAdminFetch<null>(
    "customer_organization_deletion_jobs",
    {
      method: "PATCH",
      query: { id: `eq.${jobId}` },
      body: {
        ...body,
        updated_at: new Date().toISOString(),
      },
      prefer: "return=minimal",
    },
  );
  if (!updated.ok) {
    return {
      ok: false as const,
      error: sanitizeError(updated.error),
      status: updated.status,
    };
  }
  return { ok: true as const };
}

async function failDeletionJob(jobId: string, error: string) {
  return updateDeletionJob(jobId, {
    state: "failed",
    error_message: sanitizeError(error),
    failed_at: new Date().toISOString(),
  });
}

function validateStorageScope(organizationId: string, assets: AssetLifecycleRow[]) {
  const unsafeAsset = assets.find(
    (asset) => !asset.object_path.startsWith(`${organizationId}/`),
  );
  if (unsafeAsset) {
    return {
      ok: false as const,
      error:
        "Storage cleanup blocked because at least one asset path is outside the target organization scope.",
    };
  }
  return { ok: true as const };
}

async function deleteStorageObjects(assets: AssetLifecycleRow[]) {
  const config = getSupabaseAdminConfig();
  if (!config || !assets.length) return { ok: true as const };

  const byBucket = new Map<string, string[]>();
  assets.forEach((asset) => {
    const paths = byBucket.get(asset.bucket) ?? [];
    paths.push(asset.object_path);
    byBucket.set(asset.bucket, paths);
  });

  for (const [bucket, prefixes] of byBucket.entries()) {
    const response = await fetch(
      `${config.url}/storage/v1/object/${encodeURIComponent(bucket)}`,
      {
        method: "DELETE",
        headers: {
          apikey: config.serviceRoleKey,
          Authorization: `Bearer ${config.serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prefixes }),
      },
    ).catch(() => null);
    if (!response?.ok) {
      return {
        ok: false as const,
        error: `Storage cleanup failed for bucket ${bucket}.`,
      };
    }
  }

  return { ok: true as const };
}

async function recordLifecycleEvent(
  organizationId: string,
  eventName: string,
  metadata: Record<string, string> = {},
) {
  await supabaseAdminFetch<null>("customer_account_audit_events", {
    method: "POST",
    body: {
      organization_id: organizationId,
      event_name: eventName,
      target_type: "organization",
      target_id: organizationId,
      metadata: { ...metadata, actor: "opzix-admin-session" },
    },
    prefer: "return=minimal",
  });
}

function deletionDependencySnapshot(summary: CustomerDeletionSummary) {
  return {
    organizationMembers: summary.organizationMembers,
    authIdentities: summary.authIdentities,
    sharedAuthRelationships: summary.sharedAuthRelationships,
    invitations: summary.invitations,
    onboardingRecords: summary.onboardingRecords,
    onboardingAssets: summary.onboardingAssets,
    storageObjects: summary.storageObjects,
    launchUpdates: summary.launchUpdates,
    notesAndInformationRequests: summary.notesAndInformationRequests,
    subscriptionsAndEntitlements: summary.subscriptionsAndEntitlements,
    financialDependencies: summary.financialDependencies,
    auditEvents: summary.auditEvents,
    authUsersDeleted: false,
  };
}

function unwrap<T>(result: { ok: true; data: T } | { ok: false; error: string }) {
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

function countValue(result: { ok: true; data: CountRow[] } | { ok: false }) {
  return result.ok ? result.data[0]?.exact_count ?? 0 : 0;
}

function sanitizeError(error: string) {
  return error
    .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[token]")
    .slice(0, 500);
}
