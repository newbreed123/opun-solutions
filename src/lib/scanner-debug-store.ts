import "server-only";

import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  LiveDiagnosticsResult,
  ScannerDiagnostics,
  ScannerErrorDiagnostic,
  ScannerStage,
  ScannerStageLog,
  ScannerTimingMetrics,
} from "@/lib/ecommerce-audit-scanner";

export type ScannerDebugRecord = {
  scanId: string | null;
  url: string;
  finalUrl: string | null;
  success: boolean;
  score: number | null;
  visualUxScore: number | null;
  visualMetricsAvailable: boolean;
  visualUxConfidence: "High" | "Moderate" | "Low" | "Unavailable";
  scoringConfidence: "High" | "Moderate" | "Low";
  scoreMismatchWarnings: string[];
  siteType: string | null;
  pageType: string;
  benchmark: string;
  scanTimeMs: number | null;
  status: string;
  rootCause: ScannerErrorDiagnostic | Record<string, unknown> | null;
  currentStage: ScannerStage | "unknown";
  timingMetrics: ScannerTimingMetrics | null;
  screenshotSuccess: boolean;
  screenshotModeUsed: ScannerDiagnostics["screenshotModeUsed"] | "unknown";
  screenshotWarnings: string[];
  navigation: {
    status: "success" | "failed" | "not_run" | "unknown";
    httpStatus: number | null;
    finalUrl: string | null;
    error: string | null;
  };
  domExtraction: {
    status: "success" | "failed" | "not_run" | "unknown";
    desktopMetricsCaptured: boolean;
    mobileMetricsCaptured: boolean;
    fullPageLinkCount: number | null;
    error: string | null;
  };
  stageLogs: ScannerStageLog[];
  createdAt: string;
};

type BuildScannerDebugRecordOptions = {
  url: string;
  success: boolean;
  score?: number | null;
  visualUxScore?: number | null;
  visualMetricsAvailable?: boolean;
  visualUxConfidence?: ScannerDebugRecord["visualUxConfidence"];
  scoringConfidence?: ScannerDebugRecord["scoringConfidence"];
  scoreMismatchWarnings?: string[];
  siteType?: string | null;
  pageType?: string | null;
  benchmark?: string | null;
  status?: string | null;
  rootCause?: ScannerDebugRecord["rootCause"];
  diagnostics?: LiveDiagnosticsResult | null;
  scanDiagnostics?: ScannerDiagnostics | null;
  createdAt?: string;
};

const DEBUG_DIR = path.join(
  /* turbopackIgnore: true */ process.cwd(),
  ".next",
  "cache",
  "opzix-debug",
);
const DEBUG_FILE = path.join(DEBUG_DIR, "scanner-debug.json");

export function buildScannerDebugRecord({
  url,
  success,
  score = null,
  visualUxScore = null,
  visualMetricsAvailable = typeof visualUxScore === "number",
  visualUxConfidence = visualMetricsAvailable ? "High" : "Low",
  scoringConfidence = visualMetricsAvailable ? "High" : "Low",
  scoreMismatchWarnings = [],
  siteType = null,
  pageType = null,
  benchmark = null,
  status,
  rootCause = null,
  diagnostics = null,
  scanDiagnostics = diagnostics?.scanDiagnostics ?? null,
  createdAt = new Date().toISOString(),
}: BuildScannerDebugRecordOptions): ScannerDebugRecord {
  const finalUrl = diagnostics?.finalUrl ?? scanDiagnostics?.finalUrl ?? null;
  const timingMetrics = scanDiagnostics?.timings ?? null;

  return {
    scanId: scanDiagnostics?.scanId ?? null,
    url,
    finalUrl,
    success,
    score,
    visualUxScore,
    visualMetricsAvailable,
    visualUxConfidence,
    scoringConfidence,
    scoreMismatchWarnings,
    siteType,
    pageType: pageType ?? derivePageType(finalUrl ?? url),
    benchmark: benchmark ?? deriveBenchmarkLabel(score, visualUxScore),
    scanTimeMs: timingMetrics?.totalScanMs ?? null,
    status: status ?? (success ? "complete" : "failed"),
    rootCause: rootCause ?? scanDiagnostics?.error ?? null,
    currentStage: scanDiagnostics?.currentStage ?? "unknown",
    timingMetrics,
    screenshotSuccess:
      scanDiagnostics?.screenshotSuccess ?? diagnostics?.screenshotSuccess ?? false,
    screenshotModeUsed:
      scanDiagnostics?.screenshotModeUsed ??
      diagnostics?.screenshotModeUsed ??
      "unknown",
    screenshotWarnings:
      scanDiagnostics?.screenshotWarnings ?? diagnostics?.screenshotWarnings ?? [],
    navigation: deriveNavigationStatus(scanDiagnostics, diagnostics),
    domExtraction: deriveDomExtractionStatus(scanDiagnostics, diagnostics),
    stageLogs: scanDiagnostics?.stageLogs ?? [],
    createdAt,
  };
}

function deriveBenchmarkLabel(
  score: number | null,
  visualUxScore: number | null,
) {
  const combinedScore =
    typeof score === "number" && typeof visualUxScore === "number"
      ? Math.round(score * 0.7 + visualUxScore * 0.3)
      : score ?? visualUxScore;

  if (typeof combinedScore !== "number") return "Unknown";
  if (combinedScore >= 90) return "Top Tier";
  if (combinedScore >= 80) return "Strong";
  if (combinedScore >= 65) return "Needs Review";
  return "High Priority";
}

function derivePageType(value: string) {
  try {
    const url = new URL(value);
    const path = url.pathname.toLowerCase().replace(/\/+$/, "") || "/";

    if (path === "/") return "Homepage";
    if (/\/(cart|basket|bag)\b/.test(path)) return "Cart";
    if (/\/checkout\b/.test(path)) return "Checkout";
    if (/\/(search|find)\b/.test(path)) return "Search Results";
    if (/\/(products?|p|item|sku)\b/.test(path)) return "Product Page";
    if (/\/(collections?|categories?|catalog|departments?|shop)\b/.test(path)) {
      return "Category Page";
    }

    return "Interior Page";
  } catch {
    return "Unknown";
  }
}

export async function saveScannerDebugRecord(record: ScannerDebugRecord) {
  const content = `${JSON.stringify(record, null, 2)}\n`;

  try {
    await mkdir(DEBUG_DIR, { recursive: true });
    await writeFile(DEBUG_FILE, content, "utf8");
    return { ok: true, path: DEBUG_FILE };
  } catch (error) {
    console.warn("[scanner-debug] failed to persist latest debug record", error);
    return { ok: false, error };
  }
}

export async function readLatestScannerDebugRecord() {
  try {
    const [content] = await Promise.all([
      readFile(DEBUG_FILE, "utf8"),
      stat(DEBUG_FILE),
    ]);

    return normalizeScannerDebugRecord(
      JSON.parse(content) as Partial<ScannerDebugRecord>,
    );
  } catch {
    return null;
  }
}

function normalizeScannerDebugRecord(
  record: Partial<ScannerDebugRecord>,
): ScannerDebugRecord {
  const timingMetrics = record.timingMetrics ?? null;

  return {
    scanId: record.scanId ?? null,
    url: record.url ?? "unknown",
    finalUrl: record.finalUrl ?? null,
    success: record.success ?? false,
    score: record.score ?? null,
    visualUxScore: record.visualUxScore ?? null,
    visualMetricsAvailable:
      record.visualMetricsAvailable ?? typeof record.visualUxScore === "number",
    visualUxConfidence:
      record.visualUxConfidence ??
      (typeof record.visualUxScore === "number" ? "High" : "Low"),
    scoringConfidence:
      record.scoringConfidence ??
      (record.visualMetricsAvailable === false ? "Low" : "High"),
    scoreMismatchWarnings: record.scoreMismatchWarnings ?? [],
    siteType: record.siteType ?? null,
    pageType: record.pageType ?? derivePageType(record.finalUrl ?? record.url ?? ""),
    benchmark:
      record.benchmark ??
      deriveBenchmarkLabel(record.score ?? null, record.visualUxScore ?? null),
    scanTimeMs: record.scanTimeMs ?? timingMetrics?.totalScanMs ?? null,
    status: record.status ?? (record.success ? "complete" : "failed"),
    rootCause: record.rootCause ?? null,
    currentStage: record.currentStage ?? "unknown",
    timingMetrics,
    screenshotSuccess: record.screenshotSuccess ?? false,
    screenshotModeUsed: record.screenshotModeUsed ?? "unknown",
    screenshotWarnings: record.screenshotWarnings ?? [],
    navigation: record.navigation ?? {
      status: "unknown",
      httpStatus: null,
      finalUrl: record.finalUrl ?? null,
      error: null,
    },
    domExtraction: record.domExtraction ?? {
      status: "unknown",
      desktopMetricsCaptured: false,
      mobileMetricsCaptured: false,
      fullPageLinkCount: null,
      error: null,
    },
    stageLogs: record.stageLogs ?? [],
    createdAt: record.createdAt ?? new Date(0).toISOString(),
  };
}

function deriveNavigationStatus(
  scanDiagnostics: ScannerDiagnostics | null,
  diagnostics: LiveDiagnosticsResult | null,
): ScannerDebugRecord["navigation"] {
  const navigationCompleteLog = scanDiagnostics?.stageLogs.find(
    (log) => log.stage === "navigation_complete",
  );
  const navigationStarted = scanDiagnostics?.stageLogs.some(
    (log) => log.stage === "navigation_start",
  );
  const navigationError =
    scanDiagnostics?.error?.stage === "navigation_start" ||
    scanDiagnostics?.error?.stage === "navigation_complete"
      ? scanDiagnostics.error
      : null;
  const httpStatusMatch = navigationCompleteLog?.message.match(/HTTP\s+(\d{3})/i);
  const httpStatus = httpStatusMatch ? Number.parseInt(httpStatusMatch[1], 10) : null;

  return {
    status: navigationCompleteLog
      ? "success"
      : navigationError
        ? "failed"
        : navigationStarted
          ? "unknown"
          : "not_run",
    httpStatus,
    finalUrl:
      navigationCompleteLog?.url ??
      diagnostics?.finalUrl ??
      scanDiagnostics?.finalUrl ??
      null,
    error: navigationError?.message ?? null,
  };
}

function deriveDomExtractionStatus(
  scanDiagnostics: ScannerDiagnostics | null,
  diagnostics: LiveDiagnosticsResult | null,
): ScannerDebugRecord["domExtraction"] {
  const domExtractionStarted = scanDiagnostics?.stageLogs.some(
    (log) => log.stage === "dom_extraction",
  );
  const domExtractionError =
    scanDiagnostics?.error?.stage === "dom_extraction" ? scanDiagnostics.error : null;
  const desktopMetricsCaptured = Boolean(diagnostics?.desktopVisualMetrics);
  const mobileMetricsCaptured = Boolean(diagnostics?.mobileVisualMetrics);
  const fullPageLinkCount = diagnostics?.fullPageDomSignals.visibleLinkCount ?? null;
  const domSuccess =
    desktopMetricsCaptured || mobileMetricsCaptured || Boolean(fullPageLinkCount);

  return {
    status: domSuccess
      ? "success"
      : domExtractionError
        ? "failed"
        : domExtractionStarted
          ? "unknown"
          : "not_run",
    desktopMetricsCaptured,
    mobileMetricsCaptured,
    fullPageLinkCount,
    error: domExtractionError?.message ?? null,
  };
}
