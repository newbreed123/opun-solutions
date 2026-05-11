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

type ViewportMetadata = {
  title: string | null;
  metaDescription: string | null;
  technologyDetections: TechnologyDetection[];
  platformDetection: PlatformDetection;
  commerceFlowSignals: CommerceFlowSignals;
  conversionSignals: ConversionSignals;
};

export type PlatformName =
  | "Shopify"
  | "BigCommerce"
  | "WooCommerce"
  | "Magento / Adobe Commerce"
  | "Unknown";

export type PlatformDetection = {
  name: PlatformName;
  confidence: number;
  details: string[];
};

export type CommerceFlowSignals = {
  cartVisible: boolean;
  checkoutVisible: boolean;
  productCatalogVisible: boolean;
  formVisible: boolean;
  ctaVisible: boolean;
  ctaCount: number;
  ctaLabels: string[];
};

export type LiveDiagnosticsResult = {
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  desktopScreenshotUrl: string | null;
  mobileScreenshotUrl: string | null;
  technologyDetections: TechnologyDetection[];
  platformDetection: PlatformDetection;
  commerceFlowSignals: CommerceFlowSignals;
  conversionSignals: ConversionSignals;
  consoleErrors: string[];
  failedRequests: string[];
  warnings: string[];
  scanError?: string;
};

export type TechnologyDetection = {
  key:
    | "googleAnalytics"
    | "googleTagManager"
    | "metaPixel"
    | "klaviyo"
    | "mailchimp"
    | "shopify"
    | "bigCommerce"
    | "wooCommerce"
    | "magento";
  label: string;
  detected: boolean;
  description: string;
  signals: string[];
};

export type ConversionSignals = {
  formCount: number;
  inputCount: number;
  ctaCount: number;
  ctaLabels: string[];
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
      technologyDetections: desktop.technologyDetections,
      platformDetection: desktop.platformDetection,
      commerceFlowSignals: desktop.commerceFlowSignals,
      conversionSignals: desktop.conversionSignals,
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
      technologyDetections: defaultTechnologyDetections(),
      platformDetection: defaultPlatformDetection(),
      commerceFlowSignals: defaultCommerceFlowSignals(),
      conversionSignals: defaultConversionSignals(),
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

    const metadata: ViewportMetadata =
      viewport.name === "desktop"
        ? await extractMetadata(page)
        : {
            title: null,
            metaDescription: null,
            technologyDetections: defaultTechnologyDetections(),
            platformDetection: defaultPlatformDetection(),
            commerceFlowSignals: defaultCommerceFlowSignals(),
            conversionSignals: defaultConversionSignals(),
          };

    const screenshot = await captureScreenshot(page, scanId, viewport);

    return {
      finalUrl: page.url(),
      ...metadata,
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
  const signalDetection = await detectPageSignals(page);

  return {
    title,
    metaDescription,
    ...signalDetection,
  };
}

const trackingToolRules = [
  {
    key: "googleAnalytics",
    label: "Google Analytics / GA4",
    description:
      "Looks for GA4, gtag, analytics.js, or Google Analytics collection scripts.",
    patterns: [
      /gtag\s*\(/i,
      /G-[A-Z0-9]{4,}/i,
      /google-analytics\.com/i,
      /analytics\.js/i,
      /\bga\s*\(/i,
    ],
  },
  {
    key: "googleTagManager",
    label: "Google Tag Manager",
    description:
      "Looks for GTM container scripts, GTM IDs, or dataLayer setup.",
    patterns: [/googletagmanager\.com\/gtm\.js/i, /GTM-[A-Z0-9]+/i, /dataLayer/i],
  },
  {
    key: "metaPixel",
    label: "Meta Pixel",
    description:
      "Looks for Meta/Facebook pixel scripts, fbq, or browser pixel requests.",
    patterns: [/fbq\s*\(/i, /connect\.facebook\.net\/.*fbevents\.js/i, /facebook\.com\/tr/i, /_fbp/i],
  },
  {
    key: "klaviyo",
    label: "Klaviyo",
    description:
      "Looks for Klaviyo onsite scripts, forms, or _learnq tracking setup.",
    patterns: [/klaviyo/i, /static\.klaviyo\.com/i, /_learnq/i],
  },
  {
    key: "mailchimp",
    label: "Mailchimp",
    description:
      "Looks for Mailchimp embedded forms, list-manage links, or tracking snippets.",
    patterns: [/mailchimp/i, /list-manage\.com/i, /chimpstatic\.com/i, /mc\.list-manage\.com/i],
  },
] as const;

const platformIndicatorRules = [
  {
    key: "shopify",
    label: "Shopify Indicators",
    description:
      "Looks for Shopify CDN assets, theme objects, Shopify analytics, or cart endpoints.",
    patterns: [
      /cdn\.shopify\.com/i,
      /ShopifyAnalytics/i,
      /Shopify\.theme/i,
      /myshopify\.com/i,
      /\/cart\.js/i,
      /\/products\//i,
      /\/collections\//i,
    ],
  },
  {
    key: "bigCommerce",
    label: "BigCommerce Indicators",
    description:
      "Looks for BigCommerce stencil assets, store APIs, or checkout/cart patterns.",
    patterns: [
      /cdn\d*\.bigcommerce\.com/i,
      /bigcommerce\.com/i,
      /stencil\.io/i,
      /checkout\.php/i,
      /cart\.php/i,
      /cartAction\.php/i,
      /bcapp/i,
    ],
  },
  {
    key: "wooCommerce",
    label: "WooCommerce Indicators",
    description:
      "Looks for WordPress WooCommerce assets, plugin paths, or add-to-cart parameters.",
    patterns: [
      /woocommerce/i,
      /wp-content\/plugins\/woocommerce/i,
      /add-to-cart=/i,
      /wc-add-to-cart/i,
      /wp-json\/wc\/store/i,
      /checkout\/order-received/i,
    ],
  },
  {
    key: "magento",
    label: "Magento Indicators",
    description:
      "Looks for Magento or Adobe Commerce storefront scripts, checkout paths, and UI components.",
    patterns: [
      /mage\.js/i,
      /Magento/i,
      /checkout\/cart/i,
      /minicart/i,
      /Magento_Ui/i,
      /requirejs\.config/i,
    ],
  },
] as const;

export function detectTechnologyDetections(signalText: string): TechnologyDetection[] {
  const checks = [...trackingToolRules, ...platformIndicatorRules] as const;

  return checks.map((check) => {
    const signals = check.patterns
      .filter((pattern) => pattern.test(signalText))
      .map((pattern) => pattern.source)
      .slice(0, 3);

    return {
      key: check.key,
      label: check.label,
      detected: signals.length > 0,
      description: check.description,
      signals,
    };
  });
}

export function detectEcommercePlatform(signalText: string): PlatformDetection {
  const platformScores: Array<{
    name: PlatformName;
    count: number;
    details: string[];
  }> = platformIndicatorRules.map((rule) => {
    const matches = rule.patterns.filter((pattern) => pattern.test(signalText));
    return {
      name:
        rule.key === "shopify"
          ? "Shopify"
          : rule.key === "bigCommerce"
          ? "BigCommerce"
          : rule.key === "wooCommerce"
          ? "WooCommerce"
          : "Magento / Adobe Commerce",
      count: matches.length,
      details: matches.map((pattern) => `Matched ${pattern.source}`),
    };
  });

  const best = platformScores.sort((a, b) => b.count - a.count)[0];

  if (!best || best.count === 0) {
    return {
      name: "Unknown",
      confidence: 0,
      details: [
        "No clear storefront platform indicators were detected from page assets or scripts.",
      ],
    };
  }

  return {
    name: best.name,
    confidence: Math.min(100, 40 + best.count * 25),
    details:
      best.details.length > 0
        ? best.details
        : [
            `Detected a strong ${best.name} storefront signal based on visible platform indicators.`,
          ],
  };
}

export function detectCommerceFlowSignals(
  signalText: string,
  ctaLabels: string[],
  formCount: number,
  inputCount: number,
): CommerceFlowSignals {
  const cartVisible = /\/cart|\bcart\b|add-to-cart|add to bag|basket\b|bag\b/i.test(
    signalText,
  );
  const checkoutVisible = /checkout|place order|complete order|order now|buy now/i.test(
    signalText,
  );
  const productCatalogVisible = /\/products|\/collections|product-category|shop\//i.test(
    signalText,
  );

  return {
    cartVisible,
    checkoutVisible,
    productCatalogVisible,
    formVisible: formCount > 0,
    ctaVisible: ctaLabels.length > 0,
    ctaCount: ctaLabels.length,
    ctaLabels,
  };
}

async function detectPageSignals(page: Page) {
  try {
    const pageData = await page.evaluate(() => {
      const scriptText = Array.from(document.scripts)
        .map((script) => `${script.src || ""} ${script.textContent || ""}`)
        .join(" ");
      const iframeSources = Array.from(document.querySelectorAll("iframe"))
        .map((iframe) => iframe.getAttribute("src") || "")
        .join(" ");
      const linkSources = Array.from(
        document.querySelectorAll("link[href], a[href], img[src], source[src]"),
      )
        .map((element) => {
          const href = element.getAttribute("href") || "";
          const src = element.getAttribute("src") || "";
          return `${href} ${src}`;
        })
        .join(" ");
      const pageMarkup = document.documentElement.innerHTML.slice(0, 500000);

      const visibleText = Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);

          if (
            style.display === "none" ||
            style.visibility === "hidden" ||
            htmlElement.offsetParent === null
          ) {
            return "";
          }

          if (htmlElement instanceof HTMLInputElement) {
            return htmlElement.value || htmlElement.getAttribute("aria-label") || "";
          }

          return (
            htmlElement.textContent ||
            htmlElement.getAttribute("aria-label") ||
            htmlElement.getAttribute("title") ||
            ""
          ).trim();
        })
        .filter(Boolean)
        .join(" ");

      const ctaPattern =
        /add to cart|buy now|checkout|book|schedule|contact|get started|subscribe|sign up|request|quote|audit|demo|call|learn more|shop now/i;

      const ctaLabels = Array.from(
        document.querySelectorAll("a, button, input[type='submit']"),
      )
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const label = htmlElement.textContent || htmlElement.getAttribute("aria-label") || "";
          return label.replace(/\s+/g, " ").trim();
        })
        .filter((label) => label && ctaPattern.test(label))
        .slice(0, 10);

      return {
        scriptText,
        iframeSources,
        linkSources,
        pageMarkup,
        visibleText,
        ctaLabels,
        formCount: document.querySelectorAll("form").length,
        inputCount: document.querySelectorAll(
          "input:not([type='hidden']), textarea, select",
        ).length,
      };
    });

    const signalText = (
      `${pageData.scriptText} ${pageData.iframeSources} ${pageData.linkSources} ${pageData.pageMarkup} ${pageData.visibleText}`.slice(
        0,
        500000,
      )
    );

    return {
      technologyDetections: detectTechnologyDetections(signalText),
      platformDetection: detectEcommercePlatform(signalText),
      commerceFlowSignals: detectCommerceFlowSignals(
        signalText,
        pageData.ctaLabels,
        pageData.formCount,
        pageData.inputCount,
      ),
      conversionSignals: {
        formCount: pageData.formCount,
        inputCount: pageData.inputCount,
        ctaCount: pageData.ctaLabels.length,
        ctaLabels: pageData.ctaLabels,
      },
    };
  } catch {
    return {
      technologyDetections: defaultTechnologyDetections(),
      platformDetection: defaultPlatformDetection(),
      commerceFlowSignals: defaultCommerceFlowSignals(),
      conversionSignals: defaultConversionSignals(),
    };
  }
}

function defaultTechnologyDetections(): TechnologyDetection[] {
  return [
    {
      key: "googleAnalytics",
      label: "Google Analytics / GA4",
      detected: false,
      description: "Looks for GA4, gtag, analytics.js, or Google Analytics collection scripts.",
      signals: [],
    },
    {
      key: "googleTagManager",
      label: "Google Tag Manager",
      detected: false,
      description: "Looks for GTM container scripts, GTM IDs, or dataLayer setup.",
      signals: [],
    },
    {
      key: "metaPixel",
      label: "Meta Pixel",
      detected: false,
      description: "Looks for Meta/Facebook pixel scripts, fbq, or browser pixel requests.",
      signals: [],
    },
    {
      key: "klaviyo",
      label: "Klaviyo",
      detected: false,
      description: "Looks for Klaviyo onsite scripts, forms, or _learnq tracking setup.",
      signals: [],
    },
    {
      key: "mailchimp",
      label: "Mailchimp",
      detected: false,
      description: "Looks for Mailchimp embedded forms, list-manage links, or tracking snippets.",
      signals: [],
    },
    {
      key: "shopify",
      label: "Shopify Indicators",
      detected: false,
      description: "Looks for Shopify CDN assets, theme objects, Shopify analytics, or cart endpoints.",
      signals: [],
    },
    {
      key: "bigCommerce",
      label: "BigCommerce Indicators",
      detected: false,
      description: "Looks for BigCommerce stencil assets, store APIs, or checkout/cart patterns.",
      signals: [],
    },
    {
      key: "wooCommerce",
      label: "WooCommerce Indicators",
      detected: false,
      description: "Looks for WordPress WooCommerce assets, plugin paths, or add-to-cart parameters.",
      signals: [],
    },
    {
      key: "magento",
      label: "Magento Indicators",
      detected: false,
      description: "Looks for Magento or Adobe Commerce storefront scripts, checkout paths, and UI components.",
      signals: [],
    },
  ];
}

function defaultPlatformDetection(): PlatformDetection {
  return {
    name: "Unknown",
    confidence: 0,
    details: [
      "No clear storefront platform indicators were detected from the lightweight scan.",
    ],
  };
}

function defaultCommerceFlowSignals(): CommerceFlowSignals {
  return {
    cartVisible: false,
    checkoutVisible: false,
    productCatalogVisible: false,
    formVisible: false,
    ctaVisible: false,
    ctaCount: 0,
    ctaLabels: [],
  };
}

function defaultConversionSignals(): ConversionSignals {
  return {
    formCount: 0,
    inputCount: 0,
    ctaCount: 0,
    ctaLabels: [],
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
