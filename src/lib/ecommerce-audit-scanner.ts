import { randomUUID } from "crypto";
import { mkdir, readdir, stat, unlink } from "fs/promises";
import path from "path";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";

const screenshotDir = path.join(process.cwd(), "public", "audit-screenshots");
const screenshotPublicPath = "/api/audit-screenshot";
const screenshotMaxAgeMs = 1000 * 60 * 60;
const navigationTimeoutMs = 15000;

type ViewportScanResult = {
  screenshotUrl: string | null;
  screenshotError?: string;
};

export type LiveDiagnosticsResult = {
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  desktopScreenshotUrl: string | null;
  mobileScreenshotUrl: string | null;
  consoleErrors: string[];
  failedRequests: string[];
  warnings: string[];
  scanError?: string;
};

type ViewportDefinition = {
  name: "desktop" | "mobile";
  width: number;
  height: number;
  isMobile?: boolean;
  deviceScaleFactor?: number;
  userAgent?: string;
};

const desktopViewport: ViewportDefinition = {
  name: "desktop",
  width: 1440,
  height: 1200,
};

const mobileViewport: ViewportDefinition = {
  name: "mobile",
  width: 390,
  height: 1200,
  isMobile: true,
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
};

export async function runLightweightEcommerceDiagnostics(
  website: string,
): Promise<LiveDiagnosticsResult> {
  await ensureScreenshotDir();
  await cleanupOldScreenshots();

  const scanId = randomUUID();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  const warnings: string[] = [];
  let browser: Browser | null = null;

  try {
    browser = await launchBrowser();

    const desktop = await scanViewport({
      browser,
      website,
      viewport: desktopViewport,
      scanId,
      consoleErrors,
      failedRequests,
    });

    const mobile = await scanViewport({
      browser,
      website,
      viewport: mobileViewport,
      scanId,
      consoleErrors,
      failedRequests,
    });

    if (!desktop.title) {
      warnings.push("Page title is missing. Titles help users and search engines understand the page context.");
    }

    if (!desktop.metaDescription) {
      warnings.push("Meta description is missing. Descriptions can improve search snippets and page clarity.");
    }

    if (desktop.screenshotError) {
      warnings.push(desktop.screenshotError);
    }

    if (mobile.screenshotError) {
      warnings.push(mobile.screenshotError);
    }

    return {
      finalUrl: desktop.finalUrl || website,
      title: desktop.title,
      metaDescription: desktop.metaDescription,
      desktopScreenshotUrl: desktop.screenshotUrl,
      mobileScreenshotUrl: mobile.screenshotUrl,
      consoleErrors: uniqueMessages(consoleErrors).slice(0, 6),
      failedRequests: uniqueMessages(failedRequests).slice(0, 6),
      warnings,
    };
  } catch (error) {
    return {
      finalUrl: website,
      title: null,
      metaDescription: null,
      desktopScreenshotUrl: null,
      mobileScreenshotUrl: null,
      consoleErrors: uniqueMessages(consoleErrors).slice(0, 6),
      failedRequests: uniqueMessages(failedRequests).slice(0, 6),
      warnings,
      scanError: friendlyScanError(error),
    };
  } finally {
    if (browser) {
      await browser.close().catch(() => undefined);
    }
  }
}

async function scanViewport({
  browser,
  website,
  viewport,
  scanId,
  consoleErrors,
  failedRequests,
}: {
  browser: Browser;
  website: string;
  viewport: ViewportDefinition;
  scanId: string;
  consoleErrors: string[];
  failedRequests: string[];
}) {
  let context: BrowserContext | null = null;

  try {
    context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor ?? 1,
      isMobile: viewport.isMobile ?? false,
      userAgent: viewport.userAgent,
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();
    attachDiagnostics(page, consoleErrors, failedRequests);

    const response = await page.goto(website, {
      waitUntil: "domcontentloaded",
      timeout: navigationTimeoutMs,
    });

    if (!response) {
      throw new Error("The page did not return a response.");
    }

    if (response.status() >= 400) {
      throw new Error(`The page returned HTTP ${response.status()}.`);
    }

    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => undefined);

    const metadata =
      viewport.name === "desktop"
        ? await extractMetadata(page)
        : { title: null, metaDescription: null };

    const screenshot = await captureScreenshot(page, scanId, viewport);

    return {
      finalUrl: page.url(),
      title: metadata.title,
      metaDescription: metadata.metaDescription,
      ...screenshot,
    };
  } finally {
    if (context) {
      await context.close().catch(() => undefined);
    }
  }
}

function attachDiagnostics(
  page: Page,
  consoleErrors: string[],
  failedRequests: string[],
) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(trimDiagnostic(message.text()));
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(trimDiagnostic(error.message));
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    failedRequests.push(
      trimDiagnostic(`${request.url()} - ${failure?.errorText ?? "request failed"}`),
    );
  });
}

async function extractMetadata(page: Page) {
  const title = cleanMetadataValue(await page.title().catch(() => ""));
  const metaDescription = cleanMetadataValue(
    await page
      .locator('meta[name="description"], meta[property="og:description"]')
      .first()
      .getAttribute("content")
      .catch(() => ""),
  );

  return {
    title,
    metaDescription,
  };
}

async function captureScreenshot(
  page: Page,
  scanId: string,
  viewport: ViewportDefinition,
): Promise<ViewportScanResult> {
  const filename = `${scanId}-${viewport.name}.png`;
  const filepath = path.join(screenshotDir, filename);

  try {
    await page.screenshot({
      path: filepath,
      fullPage: false,
      animations: "disabled",
      timeout: 10000,
    });

    return {
      screenshotUrl: `${screenshotPublicPath}/${filename}`,
    };
  } catch {
    return {
      screenshotUrl: null,
      screenshotError: `${viewport.name} screenshot could not be captured for this URL.`,
    };
  }
}

async function launchBrowser() {
  const launchOptions = {
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  };

  try {
    return await chromium.launch({
      ...launchOptions,
      channel: "chrome",
    });
  } catch {
    return chromium.launch(launchOptions);
  }
}

async function ensureScreenshotDir() {
  await mkdir(screenshotDir, { recursive: true });
}

async function cleanupOldScreenshots() {
  const now = Date.now();

  try {
    const files = await readdir(screenshotDir);

    await Promise.all(
      files
        .filter((file) => file.endsWith(".png"))
        .map(async (file) => {
          const filepath = path.join(screenshotDir, file);
          const fileStat = await stat(filepath);

          if (now - fileStat.mtimeMs > screenshotMaxAgeMs) {
            await unlink(filepath);
          }
        }),
    );
  } catch {
    // Cleanup is best effort only; scans should not fail because of stale files.
  }
}

function uniqueMessages(messages: string[]) {
  return Array.from(new Set(messages.filter(Boolean)));
}

function cleanMetadataValue(value: string | null) {
  const clean = value?.replace(/\s+/g, " ").trim();
  return clean || null;
}

function trimDiagnostic(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

function friendlyScanError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown scanner error.";

  if (/timeout/i.test(message)) {
    return "The page took too long to respond. Try again later or use a faster-loading URL.";
  }

  if (/ERR_NAME_NOT_RESOLVED|ENOTFOUND|ERR_TUNNEL|ERR_CONNECTION|net::/i.test(message)) {
    return "The URL could not be reached. Check that the domain is public and accessible.";
  }

  if (/HTTP 4|HTTP 5/i.test(message)) {
    return "The page responded with an error status. Try a public storefront page instead.";
  }

  return "The scanner could not complete diagnostics for this URL. The site may block automated browsers or require additional access.";
}
