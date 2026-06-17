import { existsSync } from "fs";
import chromium from "@sparticuz/chromium";
import { chromium as playwrightChromium, type Browser, type LaunchOptions } from "playwright-core";
import playwrightCorePackage from "playwright-core/package.json";

export type BrowserLaunchUsing = "sparticuz-chromium" | "local-playwright";

export type ScannerBrowserLaunchMetadata = {
  nodeEnv: string | undefined;
  vercel: string | undefined;
  platform: NodeJS.Platform;
  runtime: string | undefined;
  using: BrowserLaunchUsing;
  executablePath?: string;
  executablePathExists: boolean | null;
  launchOptions: {
    args?: string[];
    channel?: string;
    executablePath?: string;
    headless?: boolean;
  };
};

export type ScannerBrowserLaunchResult = ScannerBrowserLaunchMetadata & {
  browser: Browser;
};

export type BrowserLauncherRuntimeInfo = {
  nodeEnv: string;
  nextRuntime: string;
  platform: NodeJS.Platform;
  playwrightVersion: string;
  vercel: string;
  packageStrategy: BrowserLaunchUsing;
  browserExecutablePath: string;
  browserExecutablePathSource: string;
  executablePathExists: boolean | null;
};

export class ScannerBrowserLaunchError extends Error {
  metadata: ScannerBrowserLaunchMetadata;
  cause?: unknown;

  constructor(error: unknown, metadata: ScannerBrowserLaunchMetadata) {
    super(error instanceof Error ? error.message : String(error));
    this.name = error instanceof Error ? error.name : "ScannerBrowserLaunchError";
    this.stack = error instanceof Error ? error.stack : this.stack;
    this.cause = error instanceof Error ? error.cause : error;
    this.metadata = metadata;
  }
}

function isProductionBrowserRuntime() {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

function localBrowserExecutablePath() {
  return (
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?.trim() ||
    process.env.BROWSER_EXECUTABLE_PATH?.trim() ||
    process.env.CHROME_EXECUTABLE_PATH?.trim() ||
    undefined
  );
}

function chromiumHeadless() {
  return (chromium as typeof chromium & { headless?: boolean }).headless ?? true;
}

function executablePathExists(executablePath: string | undefined) {
  if (!executablePath) return null;

  try {
    return existsSync(executablePath);
  } catch {
    return false;
  }
}

function launchMetadata(
  using: BrowserLaunchUsing,
  executablePath: string | undefined,
  launchOptions: LaunchOptions,
): ScannerBrowserLaunchMetadata {
  return {
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL,
    platform: process.platform,
    runtime: process.env.NEXT_RUNTIME,
    using,
    executablePath,
    executablePathExists: executablePathExists(executablePath),
    launchOptions: {
      args: Array.isArray(launchOptions.args) ? launchOptions.args : undefined,
      channel: launchOptions.channel,
      executablePath: launchOptions.executablePath,
      headless:
        typeof launchOptions.headless === "boolean"
          ? launchOptions.headless
          : undefined,
    },
  };
}

function logLaunchFailure(error: unknown, metadata: ScannerBrowserLaunchMetadata) {
  console.error("[browser-launcher failed]", {
    message: error instanceof Error ? error.message : String(error),
    name: error instanceof Error ? error.name : "UnknownError",
    stack: error instanceof Error ? error.stack : undefined,
    cause: error instanceof Error ? error.cause : undefined,
    metadata,
  });
}

export async function launchScannerBrowser(): Promise<ScannerBrowserLaunchResult> {
  const isProduction = isProductionBrowserRuntime();
  const using: BrowserLaunchUsing = isProduction
    ? "sparticuz-chromium"
    : "local-playwright";
  let executablePath: string | undefined;
  let launchOptions: LaunchOptions = {};

  try {
    if (isProduction) {
      chromium.setGraphicsMode = false;
      executablePath = await chromium.executablePath();
      launchOptions = {
        args: chromium.args,
        executablePath,
        headless: chromiumHeadless(),
      };
    } else {
      executablePath = localBrowserExecutablePath();
      launchOptions = executablePath
        ? {
            executablePath,
            headless: true,
          }
        : {
            headless: true,
          };
    }

    const metadata = launchMetadata(using, executablePath, launchOptions);

    console.log("[browser-launcher]", {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      platform: process.platform,
      runtime: process.env.NEXT_RUNTIME,
      using,
      executablePath,
      executablePathExists: metadata.executablePathExists,
    });

    const browser = await playwrightChromium.launch(launchOptions);

    return {
      ...metadata,
      browser,
    };
  } catch (error) {
    const metadata = launchMetadata(using, executablePath, launchOptions ?? {});
    logLaunchFailure(error, metadata);
    throw new ScannerBrowserLaunchError(error, metadata);
  }
}

export async function getBrowserLauncherRuntimeInfo(): Promise<BrowserLauncherRuntimeInfo> {
  const isProduction = isProductionBrowserRuntime();
  const packageStrategy: BrowserLaunchUsing = isProduction
    ? "sparticuz-chromium"
    : "local-playwright";
  let browserExecutablePath = "unknown";
  let browserExecutablePathSource: string = packageStrategy;

  try {
    browserExecutablePath = isProduction
      ? await chromium.executablePath()
      : localBrowserExecutablePath() ?? playwrightChromium.executablePath();
    browserExecutablePathSource = isProduction
      ? "sparticuz-chromium"
      : localBrowserExecutablePath()
        ? "development-env-override"
        : "playwright-default-development";
  } catch (error) {
    browserExecutablePath = `unavailable: ${error instanceof Error ? error.message : String(error)}`;
    browserExecutablePathSource = "unavailable";
  }

  return {
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    nextRuntime: process.env.NEXT_RUNTIME ?? "nodejs",
    platform: process.platform,
    playwrightVersion: playwrightCorePackage.version,
    vercel: process.env.VERCEL ?? "0",
    packageStrategy,
    browserExecutablePath,
    browserExecutablePathSource,
    executablePathExists: browserExecutablePath.startsWith("unavailable:")
      ? false
      : executablePathExists(browserExecutablePath),
  };
}
