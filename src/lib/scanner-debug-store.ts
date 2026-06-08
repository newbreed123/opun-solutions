import { mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";
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
  status?: string | null;
  rootCause?: ScannerDebugRecord["rootCause"];
  diagnostics?: LiveDiagnosticsResult | null;
  scanDiagnostics?: ScannerDiagnostics | null;
  createdAt?: string;
};

const scannerDebugFilename = "opzix-scanner-debug.json";
const scannerDebugStorePaths = [
  path.join(/* turbopackIgnore: true */ process.cwd(), ".next", "cache", scannerDebugFilename),
  path.join(/* turbopackIgnore: true */ process.cwd(), "tmp", scannerDebugFilename),
];

export function buildScannerDebugRecord({
  url,
  success,
  score = null,
  status,
  rootCause = null,
  diagnostics = null,
  scanDiagnostics = diagnostics?.scanDiagnostics ?? null,
  createdAt = new Date().toISOString(),
}: BuildScannerDebugRecordOptions): ScannerDebugRecord {
  return {
    scanId: scanDiagnostics?.scanId ?? null,
    url,
    finalUrl: diagnostics?.finalUrl ?? scanDiagnostics?.finalUrl ?? null,
    success,
    score,
    status: status ?? (success ? "complete" : "failed"),
    rootCause: rootCause ?? scanDiagnostics?.error ?? null,
    currentStage: scanDiagnostics?.currentStage ?? "unknown",
    timingMetrics: scanDiagnostics?.timings ?? null,
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

export async function saveScannerDebugRecord(record: ScannerDebugRecord) {
  const content = `${JSON.stringify(record, null, 2)}\n`;
  let lastError: unknown = null;

  for (const filepath of scannerDebugStorePaths) {
    try {
      await mkdir(path.dirname(filepath), { recursive: true });
      await writeFile(filepath, content, "utf8");
      return { ok: true, path: filepath };
    } catch (error) {
      lastError = error;
    }
  }

  console.warn("[scanner-debug] failed to persist latest debug record", lastError);
  return { ok: false, error: lastError };
}

export async function readLatestScannerDebugRecord() {
  const records = await Promise.all(
    scannerDebugStorePaths.map(async (filepath) => {
      try {
        const [content, fileStat] = await Promise.all([
          readFile(filepath, "utf8"),
          stat(filepath),
        ]);
        const parsed = JSON.parse(content) as ScannerDebugRecord;
        return { record: parsed, mtimeMs: fileStat.mtimeMs };
      } catch {
        return null;
      }
    }),
  );

  return records
    .filter((entry): entry is { record: ScannerDebugRecord; mtimeMs: number } =>
      Boolean(entry),
    )
    .sort((left, right) => {
      const leftCreatedAt = Date.parse(left.record.createdAt);
      const rightCreatedAt = Date.parse(right.record.createdAt);
      return (
        (Number.isFinite(rightCreatedAt) ? rightCreatedAt : right.mtimeMs) -
        (Number.isFinite(leftCreatedAt) ? leftCreatedAt : left.mtimeMs)
      );
    })[0]?.record ?? null;
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
