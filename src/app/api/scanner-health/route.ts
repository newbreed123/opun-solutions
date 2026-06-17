import { NextResponse } from "next/server";
import {
  getScannerRuntimeInfo,
  runLightweightEcommerceDiagnostics,
} from "@/lib/ecommerce-audit-scanner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const healthCheckUrls = [
  "https://example.com",
  "https://allbirds.com",
  "https://uline.com",
];

export async function GET() {
  const startedAt = Date.now();
  const results = [];

  for (const url of healthCheckUrls) {
    const diagnostics = await runLightweightEcommerceDiagnostics(url);
    const scanDiagnostics = diagnostics.scanDiagnostics;
    const domSuccess = Boolean(
      diagnostics.desktopVisualMetrics ||
        diagnostics.mobileVisualMetrics ||
        diagnostics.fullPageDomSignals.visibleLinkCount > 0,
    );
    const reportGenerationSuccess = !diagnostics.scanError && domSuccess;

    results.push({
      url,
      success: !diagnostics.scanError && domSuccess,
      navigationTime: scanDiagnostics?.timings.navigationMs ?? null,
      screenshotSuccess: scanDiagnostics?.screenshotSuccess ?? Boolean(
        diagnostics.desktopScreenshotUrl || diagnostics.mobileScreenshotUrl,
      ),
      screenshotModeUsed: scanDiagnostics?.screenshotModeUsed ?? "skipped",
      screenshotWarnings: scanDiagnostics?.screenshotWarnings ?? diagnostics.screenshotWarnings,
      domSuccess,
      reportGenerationSuccess,
      currentStage: scanDiagnostics?.currentStage ?? null,
      timingMetrics: scanDiagnostics?.timings ?? null,
      rootCause: diagnostics.scanError ? scanDiagnostics?.error ?? null : null,
      stageLogs: scanDiagnostics?.stageLogs ?? [],
    });
  }

  return NextResponse.json({
    success: results.every((result) => result.success),
    totalElapsedMs: Date.now() - startedAt,
    runtime: await getScannerRuntimeInfo(),
    results,
  });
}
