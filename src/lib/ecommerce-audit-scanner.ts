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
  storefrontSignals: StorefrontReviewSignals;
};

export type PlatformName =
  | "Shopify"
  | "BigCommerce"
  | "WooCommerce"
  | "Magento / Adobe Commerce"
  | "Unknown";

export type PlatformConfidenceLabel =
  | "High confidence"
  | "Moderate confidence"
  | "Low confidence"
  | "Needs Review"
  | "Unknown";

export type PlatformDetection = {
  name: PlatformName;
  confidence: number;
  confidenceLabel: PlatformConfidenceLabel;
  details: string[];
  explanation?: string;
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
  storefrontSignals: StorefrontReviewSignals;
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

export type StorefrontReviewSignals = {
  mobileCtaVisibleAboveFold: boolean;
  mobileCtaLabels: string[];
  mobileAboveFoldLinkCount: number;
  mobileVisibleTextLength: number;
  mobileCrowdingRisk: boolean;
  searchVisible: boolean;
  reviewSignalsVisible: boolean;
  shippingReturnsVisible: boolean;
  warrantyGuaranteeVisible: boolean;
  paymentTrustVisible: boolean;
  contactSupportVisible: boolean;
  policyVisible: boolean;
  productNavigationVisible: boolean;
  collectionLinksVisible: boolean;
  genericNavigationCount: number;
  leadCaptureVisible: boolean;
  orderReturnsLanguageVisible: boolean;
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
      storefrontSignals: combineStorefrontSignals(
        desktop.storefrontSignals,
        mobile.storefrontSignals,
      ),
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
      storefrontSignals: defaultStorefrontReviewSignals(),
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
            storefrontSignals: await extractStorefrontReviewSignals(page),
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

type PlatformIndicatorRule = {
  key: "shopify" | "bigCommerce" | "wooCommerce" | "magento";
  label: string;
  description: string;
  strong: RegExp[];
  weak: RegExp[];
};

const platformIndicatorRules: readonly PlatformIndicatorRule[] = [
  {
    key: "shopify",
    label: "Shopify Indicators",
    description:
      "Looks for Shopify-specific theme objects, CDN assets, and script globals rather than generic storefront terms.",
    strong: [
      /cdn\.shopify\.com/i,
      /\bShopify\b/i,
      /Shopify\.theme/i,
      /Shopify\.routes/i,
      /ShopifyAnalytics/i,
      /myshopify\.com/i,
    ],
    weak: [
      /\/products\//i,
      /\/collections\//i,
      /\/cart(?:\.js)?/i,
      /\bcheckout\b/i,
      /\bcart\b/i,
    ],
  },
  {
    key: "bigCommerce",
    label: "BigCommerce Indicators",
    description:
      "Looks for BigCommerce storefront assets, stencil references, and BigCommerce-specific cart or checkout endpoints.",
    strong: [
      /cdn11\.bigcommerce\.com/i,
      /cdn\d*\.bigcommerce\.com/i,
      /\bbcData\b/i,
      /bigcommerce\.com/i,
      /\bStencil\b/i,
      /\bstencil\b/i,
      /cart\.php/i,
      /checkout\.php/i,
      /cartAction\.php/i,
      /bcapp/i,
    ],
    weak: [
      /\bcheckout\b/i,
      /\bcart\b/i,
      /\/cart\/|\/checkout\//i,
      /checkout\/cart/i,
    ],
  },
  {
    key: "wooCommerce",
    label: "WooCommerce Indicators",
    description:
      "Looks for WooCommerce plugin paths, WordPress storefront assets, and WooCommerce cart fragments.",
    strong: [
      /wp-content\/plugins\/woocommerce/i,
      /\bwoocommerce\b/i,
      /wc_cart_fragments/i,
      /wc-ajax/i,
      /wp-json\/wc\/store/i,
    ],
    weak: [
      /\/cart\//i,
      /\/checkout\//i,
      /checkout\/order-received/i,
    ],
  },
  {
    key: "magento",
    label: "Magento Indicators",
    description:
      "Looks for Magento and Adobe Commerce storefront modules, requirejs configs, and static asset versioning.",
    strong: [
      /Magento_/i,
      /mage\.js/i,
      /mage\//i,
      /requirejs-config\.js/i,
      /customer-data/i,
      /\/static\/version/i,
      /Magento_Ui/i,
      /minicart/i,
    ],
    weak: [
      /checkout\/cart/i,
      /\bcheckout\b/i,
      /\bcart\b/i,
    ],
  },
] as const;

export function detectTechnologyDetections(signalText: string): TechnologyDetection[] {
  const checks = [...trackingToolRules, ...platformIndicatorRules] as const;

  return checks.map((check) => {
    const patterns =
      "patterns" in check ? check.patterns : [...check.strong, ...check.weak];
    const signals = patterns
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

function platformNameFromKey(key: PlatformIndicatorRule["key"]): PlatformName {
  return key === "shopify"
    ? "Shopify"
    : key === "bigCommerce"
    ? "BigCommerce"
    : key === "wooCommerce"
    ? "WooCommerce"
    : "Magento / Adobe Commerce";
}

function getConfidenceLabel(score: number): PlatformConfidenceLabel {
  if (score >= 65) {
    return "High confidence";
  }

  if (score >= 45) {
    return "Moderate confidence";
  }

  if (score >= 20) {
    return "Low confidence";
  }

  return "Unknown";
}

export function detectEcommercePlatform(signalText: string): PlatformDetection {
  const platformScores = platformIndicatorRules.map((rule) => {
    const strongMatches = rule.strong.filter((pattern) => pattern.test(signalText));
    const weakMatches = rule.weak.filter((pattern) => pattern.test(signalText));
    let score = strongMatches.length * 22 + weakMatches.length * 6;

    if (strongMatches.length > 0) {
      score += 10;
    }

    if (rule.key === "shopify" && strongMatches.length === 0 && weakMatches.length > 0) {
      score = Math.min(score, 18);
    }

    return {
      name: platformNameFromKey(rule.key),
      score,
      strongCount: strongMatches.length,
      weakCount: weakMatches.length,
      details: [
        ...strongMatches.map((pattern) => `Strong signal: ${pattern.source}`),
        ...weakMatches.map((pattern) => `Weak signal: ${pattern.source}`),
      ],
    };
  });

  const sorted = [...platformScores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const runnerUp = sorted[1] ?? { score: 0 };

  if (!top || top.score < 20) {
    return {
      name: "Unknown",
      confidence: 0,
      confidenceLabel: "Unknown",
      details: [
        "No clear storefront platform indicators were detected from page assets or scripts.",
      ],
      explanation:
        "Platform detection did not find enough specific signals to identify the storefront platform confidently.",
    };
  }

  if (
    runnerUp.score >= 20 &&
    top.score - runnerUp.score < 12 ||
    (top.name === "Shopify" && top.strongCount === 0)
  ) {
    return {
      name: "Unknown",
      confidence: Math.min(95, Math.round(top.score)),
      confidenceLabel: "Needs Review",
      details: top.details,
      explanation:
        "Multiple storefront indicators were found, so platform should be manually reviewed.",
    };
  }

  const confidence = Math.min(95, Math.round(top.score));
  return {
    name: top.name,
    confidence,
    confidenceLabel: getConfidenceLabel(confidence),
    details:
      top.details.length > 0
        ? top.details
        : [
            `Detected ${top.name} storefront signals based on visible platform indicators.`,
          ],
    explanation:
      getConfidenceLabel(confidence) === "Low confidence"
        ?
          `Detected ${top.name}, but the signal strength is low and should be confirmed manually.`
        : `Detected ${top.name} storefront signals with ${getConfidenceLabel(confidence).toLowerCase()}.`,
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

async function extractStorefrontReviewSignals(
  page: Page,
): Promise<StorefrontReviewSignals> {
  try {
    return await page.evaluate(() => {
      const visibleElements = Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();
          const text = (
            htmlElement.textContent ||
            htmlElement.getAttribute("aria-label") ||
            htmlElement.getAttribute("title") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();

          return {
            element,
            text,
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            isVisible:
              Boolean(text) &&
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              rect.width > 0 &&
              rect.height > 0,
          };
        })
        .filter((item) => item.isVisible);

      const visibleText = visibleElements.map((item) => item.text).join(" ");
      const visibleTextLower = visibleText.toLowerCase();
      const aboveFoldElements = visibleElements.filter(
        (item) => item.top >= 0 && item.top < window.innerHeight,
      );
      const ctaPattern =
        /add to cart|add to bag|buy now|checkout|shop now|view products|view collection|get started|subscribe|sign up|contact|request|quote|book|learn more/i;
      const genericNavigationPattern =
        /about|blog|news|press|careers|privacy|terms|account|login|sign in/i;

      const mobileCtaLabels = Array.from(
        document.querySelectorAll("a, button, input[type='submit']"),
      )
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const rect = htmlElement.getBoundingClientRect();
          const label = (
            htmlElement.textContent ||
            htmlElement.getAttribute("aria-label") ||
            htmlElement.getAttribute("value") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();

          return {
            label,
            top: rect.top,
            visible: rect.width > 0 && rect.height > 0,
          };
        })
        .filter(
          (item) =>
            item.visible &&
            item.top >= 0 &&
            item.top < window.innerHeight * 0.9 &&
            ctaPattern.test(item.label),
        )
        .map((item) => item.label)
        .slice(0, 5);

      const linkData = Array.from(document.querySelectorAll("a[href]")).map(
        (element) => {
          const htmlElement = element as HTMLAnchorElement;
          const label = (htmlElement.textContent || htmlElement.getAttribute("aria-label") || "")
            .replace(/\s+/g, " ")
            .trim();
          const href = htmlElement.href || htmlElement.getAttribute("href") || "";

          return { label, href };
        },
      );

      const navLinks = Array.from(document.querySelectorAll("nav a, header a"))
        .map((element) =>
          (element.textContent || element.getAttribute("aria-label") || "")
            .replace(/\s+/g, " ")
            .trim(),
        )
        .filter(Boolean);

      const productPattern =
        /shop|product|products|collection|collections|category|categories|catalog|new arrivals|sale|bestseller/i;
      const collectionLinksVisible = linkData.some((link) =>
        /\/products|\/collections|\/category|\/catalog|\/shop/i.test(
          `${link.href} ${link.label}`,
        ),
      );

      return {
        mobileCtaVisibleAboveFold: mobileCtaLabels.length > 0,
        mobileCtaLabels,
        mobileAboveFoldLinkCount: aboveFoldElements.filter(
          (item) => item.element instanceof HTMLAnchorElement,
        ).length,
        mobileVisibleTextLength: aboveFoldElements
          .map((item) => item.text)
          .join(" ").length,
        mobileCrowdingRisk:
          aboveFoldElements.length > 65 ||
          aboveFoldElements.map((item) => item.text).join(" ").length > 1800,
        searchVisible:
          document.querySelector('input[type="search"], input[placeholder*="Search" i], [aria-label*="search" i]') !==
            null || /\bsearch\b/i.test(navLinks.join(" ")),
        reviewSignalsVisible:
          /reviews?|testimonials?|star rating|rated|customer stories|verified buyer/i.test(
            visibleTextLower,
          ),
        shippingReturnsVisible:
          /shipping|delivery|returns?|exchange|refund/i.test(visibleTextLower),
        warrantyGuaranteeVisible:
          /warranty|guarantee|guaranteed|satisfaction|money back/i.test(
            visibleTextLower,
          ),
        paymentTrustVisible:
          /secure checkout|secure payment|shop pay|paypal|klarna|afterpay|apple pay|google pay|visa|mastercard|amex/i.test(
            visibleTextLower,
          ),
        contactSupportVisible:
          /contact|support|help center|customer service|live chat|email us|call us/i.test(
            visibleTextLower,
          ),
        policyVisible:
          /privacy policy|terms|return policy|shipping policy|refund policy/i.test(
            visibleTextLower,
          ),
        productNavigationVisible:
          navLinks.some((label) => productPattern.test(label)) ||
          productPattern.test(visibleTextLower),
        collectionLinksVisible,
        genericNavigationCount: navLinks.filter((label) =>
          genericNavigationPattern.test(label),
        ).length,
        leadCaptureVisible:
          document.querySelector("form") !== null ||
          /newsletter|subscribe|email signup|sign up for emails|join our list/i.test(
            visibleTextLower,
          ),
        orderReturnsLanguageVisible:
          /order status|track order|shipping|delivery|returns?|exchange|refund/i.test(
            visibleTextLower,
          ),
      };
    });
  } catch {
    return defaultStorefrontReviewSignals();
  }
}

function combineStorefrontSignals(
  desktop: StorefrontReviewSignals,
  mobile: StorefrontReviewSignals,
): StorefrontReviewSignals {
  return {
    mobileCtaVisibleAboveFold: mobile.mobileCtaVisibleAboveFold,
    mobileCtaLabels: mobile.mobileCtaLabels,
    mobileAboveFoldLinkCount: mobile.mobileAboveFoldLinkCount,
    mobileVisibleTextLength: mobile.mobileVisibleTextLength,
    mobileCrowdingRisk: mobile.mobileCrowdingRisk,
    searchVisible: desktop.searchVisible || mobile.searchVisible,
    reviewSignalsVisible:
      desktop.reviewSignalsVisible || mobile.reviewSignalsVisible,
    shippingReturnsVisible:
      desktop.shippingReturnsVisible || mobile.shippingReturnsVisible,
    warrantyGuaranteeVisible:
      desktop.warrantyGuaranteeVisible || mobile.warrantyGuaranteeVisible,
    paymentTrustVisible:
      desktop.paymentTrustVisible || mobile.paymentTrustVisible,
    contactSupportVisible:
      desktop.contactSupportVisible || mobile.contactSupportVisible,
    policyVisible: desktop.policyVisible || mobile.policyVisible,
    productNavigationVisible:
      desktop.productNavigationVisible || mobile.productNavigationVisible,
    collectionLinksVisible:
      desktop.collectionLinksVisible || mobile.collectionLinksVisible,
    genericNavigationCount: Math.max(
      desktop.genericNavigationCount,
      mobile.genericNavigationCount,
    ),
    leadCaptureVisible: desktop.leadCaptureVisible || mobile.leadCaptureVisible,
    orderReturnsLanguageVisible:
      desktop.orderReturnsLanguageVisible || mobile.orderReturnsLanguageVisible,
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
      storefrontSignals: await extractStorefrontReviewSignals(page),
    };
  } catch {
    return {
      technologyDetections: defaultTechnologyDetections(),
      platformDetection: defaultPlatformDetection(),
      commerceFlowSignals: defaultCommerceFlowSignals(),
      conversionSignals: defaultConversionSignals(),
      storefrontSignals: defaultStorefrontReviewSignals(),
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
    confidenceLabel: "Unknown",
    details: [
      "No clear storefront platform indicators were detected from the lightweight scan.",
    ],
    explanation:
      "No platform indicators were available from the lightweight scan, so the storefront platform could not be identified.",
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

function defaultStorefrontReviewSignals(): StorefrontReviewSignals {
  return {
    mobileCtaVisibleAboveFold: false,
    mobileCtaLabels: [],
    mobileAboveFoldLinkCount: 0,
    mobileVisibleTextLength: 0,
    mobileCrowdingRisk: false,
    searchVisible: false,
    reviewSignalsVisible: false,
    shippingReturnsVisible: false,
    warrantyGuaranteeVisible: false,
    paymentTrustVisible: false,
    contactSupportVisible: false,
    policyVisible: false,
    productNavigationVisible: false,
    collectionLinksVisible: false,
    genericNavigationCount: 0,
    leadCaptureVisible: false,
    orderReturnsLanguageVisible: false,
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
