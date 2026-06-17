import { NextResponse } from "next/server";
import {
  browserLauncherServerExternalPackages,
  launchScannerBrowser,
} from "@/lib/browser-launcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const startedAt = Date.now();
  let launchResult: Awaited<ReturnType<typeof launchScannerBrowser>> | null = null;

  try {
    launchResult = await launchScannerBrowser();
    const context = await launchResult.browser.newContext({
      viewport: { width: 1440, height: 1200 },
      deviceScaleFactor: 1,
      isMobile: false,
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    const title = await page.title();
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
    await launchResult.browser.close().catch(() => undefined);

    const { browser: _browser, ...metadata } = launchResult;

    return NextResponse.json({
      success: true,
      title,
      using: metadata.using,
      executablePath: metadata.executablePath,
      executablePathExists: metadata.executablePathExists,
      sparticuzChromiumBinPath: metadata.sparticuzChromiumBinPath,
      sparticuzChromiumBinExists: metadata.sparticuzChromiumBinExists,
      contextCreated: true,
      pageCreated: true,
      serverExternalPackagesConfigured: true,
      serverExternalPackages: browserLauncherServerExternalPackages,
      timing: {
        elapsedMs: Date.now() - startedAt,
      },
      runtime: {
        nodeEnv: metadata.nodeEnv,
        vercel: metadata.vercel,
        platform: metadata.platform,
        nextRuntime: metadata.runtime,
      },
    });
  } catch (error) {
    await launchResult?.browser.close().catch(() => undefined);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : "UnknownError",
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? error.cause : undefined,
        metadata:
          error && typeof error === "object" && "metadata" in error
            ? (error as { metadata?: unknown }).metadata
            : null,
        serverExternalPackagesConfigured: true,
        serverExternalPackages: browserLauncherServerExternalPackages,
        timing: {
          elapsedMs: Date.now() - startedAt,
        },
      },
      { status: 500 },
    );
  }
}
