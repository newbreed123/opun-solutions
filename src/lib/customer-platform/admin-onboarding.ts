import { supabaseAdminFetch } from "@/lib/supabase-admin";
import {
  signAssetUrls,
  type OnboardingAssetRow,
  type SignedOnboardingAsset,
} from "./onboarding-assets";
import { getCustomerAdminDetail } from "./admin-store";
import type { OnboardingDataRow } from "./types";

export type { SignedOnboardingAsset };

export type OnboardingReviewState =
  | "submitted"
  | "under_review"
  | "information_requested"
  | "ready_for_implementation"
  | "approved_for_launch_work";

export type OnboardingReviewRow = {
  organization_id: string;
  review_status: OnboardingReviewState;
  original_submitted_at: string | null;
  last_customer_update_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OnboardingInternalNoteRow = {
  id: string;
  organization_id: string;
  note: string;
  created_by: string | null;
  created_at: string;
};

export type OnboardingInformationRequestRow = {
  id: string;
  organization_id: string;
  status: "open" | "resolved" | "cancelled";
  requested_items: unknown;
  message: string | null;
  created_by: string | null;
  created_at: string;
  resolved_at: string | null;
};

export async function getCustomerAdminOnboardingReview(organizationId: string) {
  const customer = await getCustomerAdminDetail(organizationId);
  if (!customer) return null;

  const [dataResult, reviewResult, notesResult, requestsResult, assetsResult] =
    await Promise.all([
      supabaseAdminFetch<OnboardingDataRow[]>("organization_onboarding_data", {
        query: {
          select: "organization_id,section,data_json,updated_at",
          organization_id: `eq.${organizationId}`,
          order: "updated_at.desc",
        },
      }),
      supabaseAdminFetch<OnboardingReviewRow[]>(
        "organization_onboarding_reviews",
        {
          query: {
            select:
              "organization_id,review_status,original_submitted_at,last_customer_update_at,created_at,updated_at",
            organization_id: `eq.${organizationId}`,
            limit: 1,
          },
        },
      ),
      supabaseAdminFetch<OnboardingInternalNoteRow[]>(
        "organization_onboarding_internal_notes",
        {
          query: {
            select: "id,organization_id,note,created_by,created_at",
            organization_id: `eq.${organizationId}`,
            order: "created_at.desc",
            limit: 50,
          },
        },
      ),
      supabaseAdminFetch<OnboardingInformationRequestRow[]>(
        "organization_onboarding_information_requests",
        {
          query: {
            select:
              "id,organization_id,status,requested_items,message,created_by,created_at,resolved_at",
            organization_id: `eq.${organizationId}`,
            order: "created_at.desc",
            limit: 50,
          },
        },
      ),
      supabaseAdminFetch<OnboardingAssetRow[]>("organization_onboarding_assets", {
        query: {
          select:
            "id,organization_id,section,asset_type,bucket,object_path,filename,mime_type,size_bytes,uploaded_by,uploaded_at,created_at",
          organization_id: `eq.${organizationId}`,
          order: "created_at.desc",
          limit: 100,
        },
      }),
    ]);

  const assets = await Promise.all(
    (assetsResult.ok ? assetsResult.data : []).map(signAssetUrls),
  );

  return {
    customer,
    onboardingData: dataResult.ok ? dataResult.data : [],
    review: reviewResult.ok ? reviewResult.data[0] ?? null : null,
    notes: notesResult.ok ? notesResult.data : [],
    requests: requestsResult.ok ? requestsResult.data : [],
    assets,
    missingTables: [
      !reviewResult.ok ? "organization_onboarding_reviews" : "",
      !notesResult.ok ? "organization_onboarding_internal_notes" : "",
      !requestsResult.ok
        ? "organization_onboarding_information_requests"
        : "",
      !assetsResult.ok ? "organization_onboarding_assets" : "",
    ].filter(Boolean),
  };
}
