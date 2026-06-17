import {
  hasSupabaseAdminConfig,
  supabaseAdminFetch,
} from "@/lib/supabase-admin";

export type AuditScanLogInput = {
  scanId: string;
  url: string;
  score: number;
  status: string;
  primaryConcern: string;
  archetype: string;
  industry: string;
  platform: string;
  siteType: string;
  siteTypeConfidenceLabel?: string;
  siteTypeConfidenceScore?: number;
  siteTypeEvidence?: unknown[];
  ecommerceProbabilityLabel?: string;
  ecommerceProbabilityScore?: number;
  platformConfidenceLabel?: string;
  platformConfidenceScore?: number;
  platformEvidence?: unknown[];
  narrativeMode?: string;
  businessContext?: string;
  recommendedActionStyle?: string;
  trafficReadiness: string;
  trackingReadiness: string;
  trustReadiness: string;
  checkoutReadiness: string;
  mobileReadiness: string;
  visualUxScore?: number;
  visualUxFindings?: unknown[];
  visualUxSummary?: string;
  visualUxMobileConcerns?: unknown[];
  visualUxDesktopConcerns?: unknown[];
  topIssues: unknown[];
  benchmarkTags: string[];
  benchmarkGroup?: string;
  benchmarkPercentileEstimate?: number | null;
  benchmarkLabel?: string;
  benchmarkExplanation?: string;
  submittedPageType?: string;
  submittedPageTypeConfidence?: number;
  submittedPageTypeEvidence?: unknown[];
  scoringConfidence?: string;
  revenueRiskAreas?: unknown[];
  recommendationRoadmap?: unknown;
  competitiveContext?: unknown;
  scanCoverage?: unknown;
  source?: string;
};

export type AuditScanContactInput = {
  scanId?: string;
  scannedUrl?: string;
  contactEmail?: string;
  contactName?: string;
};

export type AuditScanRow = {
  id: string;
  scan_id: string;
  url: string;
  normalized_domain: string;
  score: number;
  status: string;
  primary_concern: string;
  archetype: string | null;
  industry: string | null;
  platform: string;
  site_type: string;
  site_type_confidence_label: string | null;
  site_type_confidence_score: number | null;
  site_type_evidence: unknown[];
  ecommerce_probability_label: string | null;
  ecommerce_probability_score: number | null;
  platform_confidence_label: string | null;
  platform_confidence_score: number | null;
  platform_evidence: unknown[];
  narrative_mode: string | null;
  business_context: string | null;
  recommended_action_style: string | null;
  traffic_readiness: string | null;
  tracking_readiness: string | null;
  trust_readiness: string | null;
  checkout_readiness: string | null;
  mobile_readiness: string | null;
  visual_ux_score?: number | null;
  visual_ux_findings?: unknown[];
  visual_ux_summary?: string | null;
  visual_ux_mobile_concerns?: unknown[];
  visual_ux_desktop_concerns?: unknown[];
  top_issues: unknown[];
  benchmark_tags: string[];
  benchmark_group?: string | null;
  benchmark_percentile_estimate?: number | null;
  benchmark_label?: string | null;
  benchmark_explanation?: string | null;
  submitted_page_type?: string | null;
  submitted_page_type_confidence?: number | null;
  submitted_page_type_evidence?: unknown[];
  scoring_confidence?: string | null;
  revenue_risk_areas?: unknown[];
  recommendation_roadmap?: unknown;
  competitive_context?: unknown;
  scan_coverage?: unknown;
  contact_submitted: boolean;
  contact_email: string | null;
  contact_name: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type AuditScanFilters = {
  contacted?: "yes" | "no";
  status?: string;
  primaryConcern?: string;
};

const AUDIT_SCAN_LEGACY_SELECT =
  "id,scan_id,url,normalized_domain,score,status,primary_concern,archetype,industry,platform,site_type,site_type_confidence_label,site_type_confidence_score,site_type_evidence,ecommerce_probability_label,ecommerce_probability_score,platform_confidence_label,platform_confidence_score,platform_evidence,narrative_mode,business_context,recommended_action_style,traffic_readiness,tracking_readiness,trust_readiness,checkout_readiness,mobile_readiness,top_issues,benchmark_tags,contact_submitted,contact_email,contact_name,source,created_at,updated_at";

export function createAuditScanId() {
  return crypto.randomUUID();
}

export function normalizeScanDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.replace(/^www\./, "")
      .toLowerCase() ?? "";
  }
}

export async function logAuditScan(input: AuditScanLogInput) {
  if (!hasSupabaseAdminConfig()) {
    console.warn(
      "Audit scan logging skipped: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
    return { ok: false, skipped: true, error: "not-configured" };
  }

  const row = {
    scan_id: input.scanId,
    url: input.url,
    normalized_domain: normalizeScanDomain(input.url),
    score: input.score,
    status: input.status,
    primary_concern: input.primaryConcern,
    archetype: withUnknownFallback(input.archetype),
    industry: withUnknownFallback(input.industry),
    platform: withUnknownFallback(input.platform),
    site_type: withUnknownFallback(input.siteType),
    site_type_confidence_label: withUnknownFallback(input.siteTypeConfidenceLabel ?? ""),
    site_type_confidence_score: input.siteTypeConfidenceScore ?? null,
    site_type_evidence: input.siteTypeEvidence ?? [],
    ecommerce_probability_label: withUnknownFallback(
      input.ecommerceProbabilityLabel ?? "",
    ),
    ecommerce_probability_score: input.ecommerceProbabilityScore ?? null,
    platform_confidence_label: withUnknownFallback(
      input.platformConfidenceLabel ?? "",
    ),
    platform_confidence_score: input.platformConfidenceScore ?? null,
    platform_evidence: input.platformEvidence ?? [],
    narrative_mode: withUnknownFallback(input.narrativeMode ?? ""),
    business_context: withUnknownFallback(input.businessContext ?? ""),
    recommended_action_style: withUnknownFallback(input.recommendedActionStyle ?? ""),
    traffic_readiness: withUnknownFallback(input.trafficReadiness),
    tracking_readiness: withUnknownFallback(input.trackingReadiness),
    trust_readiness: withUnknownFallback(input.trustReadiness),
    checkout_readiness: withUnknownFallback(input.checkoutReadiness),
    mobile_readiness: withUnknownFallback(input.mobileReadiness),
    visual_ux_score: input.visualUxScore ?? null,
    visual_ux_findings: input.visualUxFindings ?? [],
    visual_ux_summary: input.visualUxSummary ?? null,
    visual_ux_mobile_concerns: input.visualUxMobileConcerns ?? [],
    visual_ux_desktop_concerns: input.visualUxDesktopConcerns ?? [],
    top_issues: input.topIssues,
    benchmark_tags: input.benchmarkTags,
    benchmark_group: withUnknownFallback(input.benchmarkGroup ?? ""),
    benchmark_percentile_estimate: input.benchmarkPercentileEstimate ?? null,
    benchmark_label: withUnknownFallback(input.benchmarkLabel ?? ""),
    benchmark_explanation: input.benchmarkExplanation ?? null,
    submitted_page_type: withUnknownFallback(input.submittedPageType ?? ""),
    submitted_page_type_confidence: input.submittedPageTypeConfidence ?? null,
    submitted_page_type_evidence: input.submittedPageTypeEvidence ?? [],
    scoring_confidence: withUnknownFallback(input.scoringConfidence ?? ""),
    revenue_risk_areas: input.revenueRiskAreas ?? [],
    recommendation_roadmap: input.recommendationRoadmap ?? {},
    competitive_context: input.competitiveContext ?? {},
    scan_coverage: input.scanCoverage ?? {},
    source: input.source ?? "opzix-audit",
  };

  const baseRow = {
    scan_id: input.scanId,
    url: input.url,
    normalized_domain: normalizeScanDomain(input.url),
    score: input.score,
    status: input.status,
    primary_concern: input.primaryConcern,
    platform: withUnknownFallback(input.platform),
    site_type: withUnknownFallback(input.siteType),
    top_issues: input.topIssues,
    benchmark_tags: input.benchmarkTags,
    source: input.source ?? "opzix-audit",
  };

  const isSchemaCacheOrMissingColumnError = (error: unknown) => {
    const message = String(error).toLowerCase();
    return (
      message.includes("column") && message.includes("does not exist") ||
      message.includes("missing column") ||
      message.includes("schema cache") ||
      message.includes("relation .* does not exist") ||
      message.includes("invalid query")
    );
  };

  try {
    const result = await supabaseAdminFetch<null>("audit_scans", {
      method: "POST",
      body: row,
      prefer: "returning=minimal",
    });

    if (!result.ok) {
      const error = result.error || "Unknown Supabase error";
      if (isSchemaCacheOrMissingColumnError(error)) {
        console.warn(
          "Audit scan logging retrying with base fields due to optional column/schema error:",
          error,
        );
        const retryResult = await supabaseAdminFetch<null>("audit_scans", {
          method: "POST",
          body: baseRow,
          prefer: "returning=minimal",
        });

        if (!retryResult.ok) {
          console.warn("Audit scan logging fallback failed:", retryResult.error);
          return { ok: false, skipped: false, error: retryResult.error };
        }

        return { ok: true, skipped: false };
      }

      console.warn("Audit scan logging failed:", error);
      return { ok: false, skipped: false, error };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    const formattedError = String(error);
    if (isSchemaCacheOrMissingColumnError(formattedError)) {
      console.warn(
        "Audit scan logging retrying with base fields due to optional column/schema error:",
        formattedError,
      );
      try {
        const retryResult = await supabaseAdminFetch<null>("audit_scans", {
          method: "POST",
          body: baseRow,
          prefer: "returning=minimal",
        });

        if (!retryResult.ok) {
          console.warn("Audit scan logging fallback failed:", retryResult.error);
          return { ok: false, skipped: false, error: retryResult.error };
        }

        return { ok: true, skipped: false };
      } catch (fallbackError) {
        console.warn("Audit scan logging fallback failed:", fallbackError);
        return { ok: false, skipped: false, error: String(fallbackError) };
      }
    }

    console.warn("Audit scan logging failed:", error);
    return { ok: false, skipped: false, error: formattedError };
  }
}

export async function markAuditScanContactSubmitted(
  input: AuditScanContactInput,
) {
  if (!input.scanId && !input.scannedUrl) {
    return { ok: false, skipped: true, error: "missing-attribution" };
  }

  if (!hasSupabaseAdminConfig()) {
    console.warn(
      "Audit scan contact attribution skipped: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.",
    );
    return { ok: false, skipped: true, error: "not-configured" };
  }

  const filters = input.scanId
    ? { scan_id: `eq.${input.scanId}` }
    : { url: `eq.${input.scannedUrl}` };

  try {
    const result = await supabaseAdminFetch<null>("audit_scans", {
      method: "PATCH",
      query: filters,
      body: {
        contact_submitted: true,
        contact_email: input.contactEmail || null,
        contact_name: input.contactName || null,
        updated_at: new Date().toISOString(),
      },
      prefer: "returning=minimal",
    });

    if (!result.ok) {
      console.warn("Audit scan contact attribution failed:", result.error);
      return { ok: false, skipped: false, error: result.error };
    }

    return { ok: true, skipped: false };
  } catch (error) {
    console.warn("Audit scan contact attribution failed:", error);
    return { ok: false, skipped: false, error: String(error) };
  }
}

export async function listAuditScans(filters: AuditScanFilters = {}) {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as AuditScanRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  const query: Record<string, string | number | undefined> = {
    select:
      "id,scan_id,url,normalized_domain,score,status,primary_concern,archetype,industry,platform,site_type,site_type_confidence_label,site_type_confidence_score,site_type_evidence,ecommerce_probability_label,ecommerce_probability_score,platform_confidence_label,platform_confidence_score,platform_evidence,narrative_mode,business_context,recommended_action_style,traffic_readiness,tracking_readiness,trust_readiness,checkout_readiness,mobile_readiness,top_issues,benchmark_tags,benchmark_group,benchmark_percentile_estimate,benchmark_label,benchmark_explanation,submitted_page_type,submitted_page_type_confidence,submitted_page_type_evidence,scoring_confidence,revenue_risk_areas,recommendation_roadmap,competitive_context,scan_coverage,contact_submitted,contact_email,contact_name,source,created_at,updated_at",
    order: "created_at.desc",
    limit: 100,
  };

  if (filters.contacted === "yes") {
    query.contact_submitted = "eq.true";
  }

  if (filters.contacted === "no") {
    query.contact_submitted = "eq.false";
  }

  if (filters.status) {
    query.status = `eq.${filters.status}`;
  }

  if (filters.primaryConcern) {
    query.primary_concern = `eq.${filters.primaryConcern}`;
  }

  const result = await safeAuditScanListFetch(query);

  if (!result.ok) {
    return {
      ok: false as const,
      data: [] as AuditScanRow[],
      error: result.error,
    };
  }

  return {
    ok: true as const,
    data: result.data ?? [],
    error: "",
  };
}

export async function listAuditInsightScans() {
  if (!hasSupabaseAdminConfig()) {
    return {
      ok: false as const,
      data: [] as AuditScanRow[],
      error: "Supabase admin environment variables are not configured.",
    };
  }

  const result = await safeAuditScanListFetch({
    select:
      "id,scan_id,url,normalized_domain,score,status,primary_concern,archetype,industry,platform,site_type,site_type_confidence_label,site_type_confidence_score,site_type_evidence,ecommerce_probability_label,ecommerce_probability_score,platform_confidence_label,platform_confidence_score,platform_evidence,narrative_mode,business_context,recommended_action_style,traffic_readiness,tracking_readiness,trust_readiness,checkout_readiness,mobile_readiness,top_issues,benchmark_tags,benchmark_group,benchmark_percentile_estimate,benchmark_label,benchmark_explanation,submitted_page_type,submitted_page_type_confidence,submitted_page_type_evidence,scoring_confidence,revenue_risk_areas,recommendation_roadmap,competitive_context,scan_coverage,contact_submitted,contact_email,contact_name,source,created_at,updated_at",
    order: "created_at.desc",
    limit: 5000,
  });

  if (!result.ok) {
    return {
      ok: false as const,
      data: [] as AuditScanRow[],
      error: result.error,
    };
  }

  return {
    ok: true as const,
    data: result.data ?? [],
    error: "",
  };
}

function withUnknownFallback(value: string) {
  return value.trim() || "unknown";
}

async function safeAuditScanListFetch(
  query: Record<string, string | number | undefined>,
) {
  try {
    const result = await supabaseAdminFetch<AuditScanRow[]>("audit_scans", {
      query,
    });

    if (!result.ok && shouldRetryAuditListWithLegacySelect(result.error)) {
      return await supabaseAdminFetch<AuditScanRow[]>("audit_scans", {
        query: {
          ...query,
          select: AUDIT_SCAN_LEGACY_SELECT,
        },
      });
    }

    return result;
  } catch (error) {
    return {
      ok: false as const,
      data: [] as AuditScanRow[],
      status: 0,
      error:
        error instanceof Error
          ? error.message
          : "Could not reach Supabase audit scan storage.",
    };
  }
}

function shouldRetryAuditListWithLegacySelect(error: unknown) {
  const message = String(error).toLowerCase();
  return (
    message.includes("column") && message.includes("does not exist") ||
    message.includes("missing column") ||
    message.includes("schema cache")
  );
}
