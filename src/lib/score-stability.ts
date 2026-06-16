import type { AuditScanRow } from "@/lib/audit-scan-log";

export type ScoreStabilityLabel = "Stable" | "Moderate" | "Unstable";

export type ScoreStabilityChange = {
  fromScanId: string;
  toScanId: string;
  fromCreatedAt: string;
  toCreatedAt: string;
  fromScore: number;
  toScore: number;
  scoreDelta: number;
  reasons: string[];
};

export type ScoreStabilitySummary = {
  domain: string;
  scanCount: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  scoreVariance: number;
  scoreStdDev: number;
  scoreVariation: number;
  scoreStability: ScoreStabilityLabel;
  latestChangeReasons: string[];
  scanChanges: ScoreStabilityChange[];
};

export function buildScoreStabilityByDomain(scans: AuditScanRow[]) {
  const groups = new Map<string, AuditScanRow[]>();

  scans.forEach((scan) => {
    const domain = domainForScan(scan);
    const group = groups.get(domain) ?? [];
    group.push(scan);
    groups.set(domain, group);
  });

  const summaries = new Map<string, ScoreStabilitySummary>();

  groups.forEach((group, domain) => {
    summaries.set(domain, analyzeDomainScoreStability(domain, group));
  });

  return summaries;
}

export function domainForScan(scan: AuditScanRow) {
  const normalized = scan.normalized_domain?.trim().toLowerCase();
  if (normalized) {
    return normalized;
  }

  try {
    return new URL(scan.url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return (
      scan.url
        .replace(/^https?:\/\//i, "")
        .split("/")[0]
        ?.replace(/^www\./, "")
        .toLowerCase() || "unknown"
    );
  }
}

function analyzeDomainScoreStability(
  domain: string,
  scans: AuditScanRow[],
): ScoreStabilitySummary {
  const orderedScans = [...scans].sort(
    (left, right) =>
      new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
  );
  const scores = orderedScans.map((scan) => scan.score);
  const scanCount = scores.length;
  const averageScore =
    scanCount === 0
      ? 0
      : scores.reduce((total, score) => total + score, 0) / scanCount;
  const minScore = scanCount === 0 ? 0 : Math.min(...scores);
  const maxScore = scanCount === 0 ? 0 : Math.max(...scores);
  const scoreVariation = maxScore - minScore;
  const scoreVariance =
    scanCount === 0
      ? 0
      : scores.reduce(
          (total, score) => total + Math.pow(score - averageScore, 2),
          0,
        ) / scanCount;
  const scoreStdDev = Math.sqrt(scoreVariance);
  const scanChanges = buildScanChanges(orderedScans);

  return {
    domain,
    scanCount,
    averageScore,
    minScore,
    maxScore,
    scoreVariance,
    scoreStdDev,
    scoreVariation,
    scoreStability: classifyScoreStability(scoreVariation),
    latestChangeReasons: scanChanges[0]?.reasons ?? [],
    scanChanges,
  };
}

function classifyScoreStability(scoreVariation: number): ScoreStabilityLabel {
  if (scoreVariation <= 3) {
    return "Stable";
  }

  if (scoreVariation <= 8) {
    return "Moderate";
  }

  return "Unstable";
}

function buildScanChanges(scans: AuditScanRow[]) {
  const changes: ScoreStabilityChange[] = [];

  for (let index = 0; index < scans.length - 1; index += 1) {
    const current = scans[index];
    const previous = scans[index + 1];
    const scoreDelta = current.score - previous.score;
    const reasons = changeReasons(previous, current, scoreDelta);

    changes.push({
      fromScanId: previous.scan_id,
      toScanId: current.scan_id,
      fromCreatedAt: previous.created_at,
      toCreatedAt: current.created_at,
      fromScore: previous.score,
      toScore: current.score,
      scoreDelta,
      reasons,
    });
  }

  return changes;
}

function changeReasons(
  previous: AuditScanRow,
  current: AuditScanRow,
  scoreDelta: number,
) {
  const reasons: string[] = [];

  addChangedReason(
    reasons,
    "Confidence changed",
    confidenceLabel(previous),
    confidenceLabel(current),
  );
  addChangedReason(
    reasons,
    "Visual metrics changed",
    visualMetricsLabel(previous),
    visualMetricsLabel(current),
  );
  addChangedReason(
    reasons,
    "Page type changed",
    cleanValue(previous.submitted_page_type),
    cleanValue(current.submitted_page_type),
  );
  addChangedReason(
    reasons,
    "Benchmark changed",
    benchmarkLabel(previous),
    benchmarkLabel(current),
  );
  addChangedReason(
    reasons,
    "Finding count changed",
    `${arrayLength(previous.top_issues)} findings`,
    `${arrayLength(current.top_issues)} findings`,
  );
  addChangedReason(
    reasons,
    "Evidence unavailable changed",
    evidenceUnavailableLabel(previous),
    evidenceUnavailableLabel(current),
  );

  if (reasons.length === 0 && scoreDelta !== 0) {
    reasons.push(
      `Score changed ${formatSignedNumber(scoreDelta)} points without a stored confidence, visual, page-type, benchmark, finding-count, or evidence-availability change.`,
    );
  }

  if (reasons.length === 0) {
    reasons.push("No tracked scoring inputs changed between these scans.");
  }

  return reasons;
}

function addChangedReason(
  reasons: string[],
  label: string,
  previousValue: string,
  currentValue: string,
) {
  if (previousValue !== currentValue) {
    reasons.push(`${label}: ${previousValue} -> ${currentValue}.`);
  }
}

function confidenceLabel(scan: AuditScanRow) {
  return [
    cleanValue(scan.scoring_confidence),
    cleanValue(scan.site_type_confidence_label),
    cleanValue(scan.platform_confidence_label),
  ].join(" / ");
}

function visualMetricsLabel(scan: AuditScanRow) {
  return typeof scan.visual_ux_score === "number"
    ? `visual UX ${scan.visual_ux_score}`
    : "visual UX unavailable";
}

function benchmarkLabel(scan: AuditScanRow) {
  return [
    cleanValue(scan.benchmark_group),
    cleanValue(scan.benchmark_label),
    typeof scan.benchmark_percentile_estimate === "number"
      ? `p${scan.benchmark_percentile_estimate}`
      : "no percentile",
  ].join(" / ");
}

function evidenceUnavailableLabel(scan: AuditScanRow) {
  return evidenceUnavailable(scan) ? "unavailable evidence present" : "evidence available";
}

function evidenceUnavailable(scan: AuditScanRow) {
  const text = flattenText([
    scan.scoring_confidence,
    scan.scan_coverage,
    scan.top_issues,
    scan.submitted_page_type_evidence,
    scan.site_type_evidence,
  ]);

  return (
    cleanValue(scan.scoring_confidence).toLowerCase() === "low" ||
    scan.visual_ux_score == null ||
    /\b(unavailable|insufficient|unknown|failed|missing|could not|not available)\b/i.test(
      text,
    )
  );
}

function flattenText(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map(flattenText).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>)
      .map(flattenText)
      .join(" ");
  }

  return String(value);
}

function arrayLength(value: unknown[] | undefined) {
  return Array.isArray(value) ? value.length : 0;
}

function cleanValue(value: string | number | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || "unknown";
}

function formatSignedNumber(value: number) {
  return value > 0 ? `+${value}` : String(value);
}
