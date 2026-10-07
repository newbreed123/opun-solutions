import { supabaseAdminFetch } from "@/lib/supabase-admin";

export type LaunchStage =
  | "onboarding_received"
  | "discovery_review"
  | "mls_brokerage_approval"
  | "brand_content"
  | "website_development"
  | "ai_lead_setup"
  | "quality_assurance"
  | "client_review"
  | "ready_to_launch"
  | "live";

export type LaunchStatusRow = {
  organization_id: string;
  current_stage: LaunchStage;
  progress_percent: number;
  customer_status: string | null;
  latest_update: string | null;
  next_customer_action: string | null;
  estimated_launch_window: string | null;
  updated_at: string;
};

export type LaunchUpdateRow = {
  id: string;
  organization_id: string;
  stage: LaunchStage;
  progress_percent: number;
  customer_message: string | null;
  next_customer_action: string | null;
  estimated_launch_window: string | null;
  created_by: string | null;
  created_at: string;
};

export type LaunchProgress = {
  status: LaunchStatusRow;
  updates: LaunchUpdateRow[];
};

export const launchStages: Array<{
  code: LaunchStage;
  label: string;
  defaultProgress: number;
}> = [
  { code: "onboarding_received", label: "Onboarding received", defaultProgress: 10 },
  { code: "discovery_review", label: "Discovery review", defaultProgress: 20 },
  { code: "mls_brokerage_approval", label: "MLS & brokerage approval", defaultProgress: 30 },
  { code: "brand_content", label: "Brand & content", defaultProgress: 40 },
  { code: "website_development", label: "Website development", defaultProgress: 55 },
  { code: "ai_lead_setup", label: "AI & lead setup", defaultProgress: 65 },
  { code: "quality_assurance", label: "Quality assurance", defaultProgress: 78 },
  { code: "client_review", label: "Client review", defaultProgress: 88 },
  { code: "ready_to_launch", label: "Ready to launch", defaultProgress: 95 },
  { code: "live", label: "Live", defaultProgress: 100 },
];

export async function getOrganizationLaunchProgress(
  organizationId: string,
): Promise<LaunchProgress> {
  const [statusResult, updatesResult] = await Promise.all([
    supabaseAdminFetch<LaunchStatusRow[]>("organization_launch_status", {
      query: {
        select:
          "organization_id,current_stage,progress_percent,customer_status,latest_update,next_customer_action,estimated_launch_window,updated_at",
        organization_id: `eq.${organizationId}`,
        limit: 1,
      },
    }),
    supabaseAdminFetch<LaunchUpdateRow[]>("organization_launch_updates", {
      query: {
        select:
          "id,organization_id,stage,progress_percent,customer_message,next_customer_action,estimated_launch_window,created_by,created_at",
        organization_id: `eq.${organizationId}`,
        order: "created_at.desc",
        limit: 20,
      },
    }),
  ]);

  const fallback = defaultLaunchStatus(organizationId);
  return {
    status: statusResult.ok ? statusResult.data[0] ?? fallback : fallback,
    updates: updatesResult.ok ? updatesResult.data : [],
  };
}

export async function saveOrganizationLaunchUpdate({
  organizationId,
  stage,
  progressPercent,
  customerStatus,
  latestUpdate,
  nextCustomerAction,
  estimatedLaunchWindow,
}: {
  organizationId: string;
  stage: LaunchStage;
  progressPercent: number;
  customerStatus: string;
  latestUpdate: string;
  nextCustomerAction: string;
  estimatedLaunchWindow: string;
}) {
  const now = new Date().toISOString();
  const [statusResult, updateResult] = await Promise.all([
    supabaseAdminFetch<null>("organization_launch_status", {
      method: "POST",
      query: { on_conflict: "organization_id" },
      body: {
        organization_id: organizationId,
        current_stage: stage,
        progress_percent: progressPercent,
        customer_status: customerStatus || launchStageLabel(stage),
        latest_update: latestUpdate || null,
        next_customer_action: nextCustomerAction || null,
        estimated_launch_window: estimatedLaunchWindow || null,
        updated_at: now,
      },
      prefer: "resolution=merge-duplicates,returning=minimal",
    }),
    supabaseAdminFetch<null>("organization_launch_updates", {
      method: "POST",
      body: {
        organization_id: organizationId,
        stage,
        progress_percent: progressPercent,
        customer_message: latestUpdate || null,
        next_customer_action: nextCustomerAction || null,
        estimated_launch_window: estimatedLaunchWindow || null,
        created_by: "opzix-admin-session",
      },
      prefer: "returning=minimal",
    }),
  ]);

  if (!statusResult.ok) return statusResult;
  return updateResult;
}

export function defaultProgressForStage(stage: LaunchStage) {
  return launchStages.find((item) => item.code === stage)?.defaultProgress ?? 10;
}

export function launchStageLabel(stage: LaunchStage) {
  return launchStages.find((item) => item.code === stage)?.label ?? "Launch progress";
}

export function isLaunchStage(value: string): value is LaunchStage {
  return launchStages.some((stage) => stage.code === value);
}

function defaultLaunchStatus(organizationId: string): LaunchStatusRow {
  return {
    organization_id: organizationId,
    current_stage: "onboarding_received",
    progress_percent: 10,
    customer_status: "Onboarding received",
    latest_update:
      "Opzix will review your onboarding details and prepare your launch plan.",
    next_customer_action: "No action needed right now.",
    estimated_launch_window: null,
    updated_at: new Date(0).toISOString(),
  };
}
