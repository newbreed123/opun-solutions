import { NextResponse } from "next/server";
import { launchScannerBrowser } from "@/lib/browser-launcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const startedAt = Date.now();
  let launchResult: Awaited<ReturnType<typeof launchScannerBrowser>> | null = null;

  try {
    launchResult = await launchScannerBrowser();
    const page = await launchResult.browser.newPage();
    await page.goto("https://example.com", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    const title = await page.title();
    await page.close().catch(() => undefined);
    await launchResult.browser.close().catch(() => undefined);

    const { browser: _browser, ...metadata } = launchResult;

    return NextResponse.json({
      success: true,
      title,
      using: metadata.using,
      executablePath: metadata.executablePath,
      executablePathExists: metadata.executablePathExists,
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
        timing: {
          elapsedMs: Date.now() - startedAt,
        },
      },
      { status: 500 },
    );
  }
}
