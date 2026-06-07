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
  visualDomMetrics: VisualDomMetrics | null;
};

export type PlatformName =
  | "Shopify"
  | "BigCommerce"
  | "WooCommerce"
  | "Magento / Adobe Commerce"
  | "Enterprise / Custom Commerce Stack"
  | "Not an ecommerce storefront"
  | "Ecommerce probability unclear"
  | "Platform not confidently identified"
  | "Needs Manual Review"
  | "Unknown";

export type PlatformConfidenceLabel =
  | "High confidence"
  | "Moderate confidence"
  | "Low confidence"
  | "Needs Review"
  | "Unknown";

export type PlatformDetection = {
  name: PlatformName;
  platformName: PlatformName;
  confidence: number;
  confidenceScore: number;
  confidenceLabel: PlatformConfidenceLabel;
  ecommerceProbability: EcommerceProbability;
  details: string[];
  evidence: string[];
  explanation?: string;
  recommendation: string;
};

export type EcommerceProbability = {
  probability: number;
  label: "High" | "Moderate" | "Low" | "Unclear";
  evidence: string[];
  negativeSignals: string[];
};

type EnterpriseLikelihood = "low" | "medium" | "high";

type EnterpriseCommerceSignals = {
  enterpriseLikelihood: EnterpriseLikelihood;
  explanation: string;
  supportingSignals: string[];
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
  desktopVisualMetrics: VisualDomMetrics | null;
  mobileVisualMetrics: VisualDomMetrics | null;
  consoleErrors: string[];
  failedRequests: string[];
  warnings: string[];
  scanError?: string;
};

export type BoundingBox = {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  centerX: number;
  centerY: number;
  textLength?: number;
  isHeading?: boolean;
  isProductCard?: boolean;
  selector?: string;
  tag?: string;
  textSample?: string;
};

export type VisualDomMetrics = {
  viewportName: "desktop" | "mobile";
  viewportWidth: number;
  viewportHeight: number;
  visibleTextCharactersAboveFold: number;
  visibleHeadingCountAboveFold: number;
  visibleLinkCountAboveFold: number;
  productCardsAboveFold: number;
  imagesOrCardsAboveFold: number;
  firstProductCardY: number | null;
  firstCtaY: number | null;
  firstSearchInputY: number | null;
  largestTextBlockHeight: number;
  contentColumnWidth: number | null;
  contentColumnX: number | null;
  productGridX: number | null;
  contentCandidateBounds: BoundingBox | null;
  productGridCandidateBounds: BoundingBox | null;
  horizontalOverflow: boolean;
  floatingWidgetOverlapRisk: boolean;
  chatWidgetOverlapRisk: boolean;
  elementsWiderThanViewport: number;
  emptyViewportRatio: number;
  productCardHeightVariance: number;
  productCardSpacingVariance: number;
  bodyTextBeforeFirstProductChars: number;
  visibleTextSample: string;
  visibleLinks: string[];
  headingBounds: BoundingBox[];
  textBlockBounds: BoundingBox[];
  productCardBounds: BoundingBox[];
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
      desktopVisualMetrics: desktop.visualDomMetrics,
      mobileVisualMetrics: mobile.visualDomMetrics,
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
      desktopVisualMetrics: null,
      mobileVisualMetrics: null,
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
        ? {
            ...(await extractMetadata(page)),
            visualDomMetrics: await extractVisualDomMetrics(page, viewport),
          }
        : {
            title: null,
            metaDescription: null,
            technologyDetections: defaultTechnologyDetections(),
            platformDetection: defaultPlatformDetection(),
            commerceFlowSignals: defaultCommerceFlowSignals(),
            conversionSignals: defaultConversionSignals(),
            storefrontSignals: await extractStorefrontReviewSignals(page),
            visualDomMetrics: await extractVisualDomMetrics(page, viewport),
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

async function extractVisualDomMetrics(
  page: Page,
  viewport: ViewportDefinition,
): Promise<VisualDomMetrics | null> {
  try {
    return await page.evaluate((viewportName) => {
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const selectorFor = (element: Element) => {
        const htmlElement = element as HTMLElement;
        const tag = htmlElement.tagName.toLowerCase();
        if (htmlElement.id) {
          return `${tag}#${CSS.escape(htmlElement.id)}`;
        }

        const className =
          typeof htmlElement.className === "string" ? htmlElement.className : "";
        const classes = className
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((name) => `.${CSS.escape(name)}`)
          .join("");
        const parent = htmlElement.parentElement;
        const siblingIndex = parent
          ? Array.from(parent.children).filter(
              (sibling) => sibling.tagName === htmlElement.tagName,
            ).indexOf(htmlElement) + 1
          : 1;

        return `${tag}${classes}${siblingIndex > 0 ? `:nth-of-type(${siblingIndex})` : ""}`;
      };
      const toBoundingBox = (item: {
        left: number;
        top: number;
        width: number;
        height: number;
        right: number;
        text: string;
        selector: string;
        tag: string;
      }) => ({
        left: Math.round(item.left),
        top: Math.round(item.top),
        width: Math.round(item.width),
        height: Math.round(item.height),
        right: Math.round(item.right),
        centerX: Math.round(item.left + item.width / 2),
        centerY: Math.round(item.top + item.height / 2),
        textLength: item.text.length,
        selector: item.selector,
        tag: item.tag,
        textSample: item.text.slice(0, 120),
      });
      const ctaPattern =
        /add to cart|add to bag|buy now|checkout|shop now|view products|view collection|get started|subscribe|sign up|contact|request|quote|book|learn more|shop all|browse/i;
      const productPattern =
        /product|collection|category|catalog|sku|price|add to cart|shop now|view item|quick view|\$\s?\d|\b\d+\.\d{2}\b/i;
      const searchPattern = /search/i;
      const chatPattern = /chat|help|intercom|drift|zendesk|gorgias|ada|olark|crisp|support/i;

      const visible = Array.from(document.querySelectorAll("body *"))
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const style = window.getComputedStyle(htmlElement);
          const rect = htmlElement.getBoundingClientRect();
          const directText = Array.from(htmlElement.childNodes)
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent || "")
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          const text = (
            htmlElement.textContent ||
            htmlElement.getAttribute("aria-label") ||
            htmlElement.getAttribute("title") ||
            ""
          )
            .replace(/\s+/g, " ")
            .trim();
          const className =
            typeof htmlElement.className === "string" ? htmlElement.className : "";
          const id = htmlElement.id || "";
          const role = htmlElement.getAttribute("role") || "";
          const href =
            htmlElement instanceof HTMLAnchorElement
              ? htmlElement.href || htmlElement.getAttribute("href") || ""
              : "";

          return {
            element: htmlElement,
            tag: htmlElement.tagName.toLowerCase(),
            text,
            directText,
            href,
            className,
            id,
            role,
            childElementCount: htmlElement.children.length,
            imageDescendantCount: htmlElement.querySelectorAll("img,picture,svg").length,
            productDescendantCount: htmlElement.querySelectorAll(
              '[class*="product" i], [class*="card" i], [class*="grid" i], [class*="item" i], [href*="/products/" i], [href*="/collections/" i]',
            ).length,
            left: rect.left,
            right: rect.right,
            top: rect.top,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            position: style.position,
            zIndex: Number.parseInt(style.zIndex || "0", 10) || 0,
            display: style.display,
            visibility: style.visibility,
            opacity: Number.parseFloat(style.opacity || "1"),
            backgroundImage: style.backgroundImage,
            selector: selectorFor(htmlElement),
          };
        })
        .filter(
          (item) =>
            item.display !== "none" &&
            item.visibility !== "hidden" &&
            item.opacity > 0.05 &&
            item.width > 0 &&
            item.height > 0 &&
            item.bottom >= 0 &&
            item.top <= viewportHeight * 1.3,
        );

      const aboveFold = visible.filter(
        (item) => item.top >= 0 && item.top < viewportHeight,
      );
      const aboveFoldText = aboveFold
        .map((item) => item.text)
        .filter(Boolean)
        .join(" ");
      const headingsAboveFold = aboveFold.filter((item) =>
        /^h[1-6]$/.test(item.tag) || item.role === "heading",
      );
      const linksAboveFold = aboveFold.filter((item) => item.tag === "a");
      const visibleLinks = linksAboveFold
        .map((item) => item.text || item.href)
        .filter(Boolean)
        .slice(0, 30);
      const ctas = aboveFold
        .filter((item) => ctaPattern.test(`${item.text} ${item.href}`))
        .sort((a, b) => a.top - b.top);
      const searchInputs = visible
        .filter(
          (item) =>
            (item.tag === "input" || item.role === "searchbox") &&
            searchPattern.test(`${item.text} ${item.className} ${item.id} ${item.role}`),
        )
        .sort((a, b) => a.top - b.top);
      const allProductCandidates = visible
        .filter((item) => {
          const haystack = `${item.text} ${item.href} ${item.className} ${item.id} ${item.role}`;
          const productSized =
            item.width >= Math.min(160, viewportWidth * 0.35) &&
            item.height >= 120 &&
            item.height <= viewportHeight * 0.95;
          const imageCard =
            (item.tag === "img" || item.backgroundImage !== "none") &&
            item.width >= 120 &&
            item.height >= 100;

          return (
            productPattern.test(haystack) &&
            (productSized || imageCard || /product|card|tile|item|grid/i.test(haystack))
          );
        })
        .sort((a, b) => a.top - b.top || a.left - b.left);
      const productCandidates = allProductCandidates.filter((item) => {
        const fullWidthSharedContainer =
          item.width >= viewportWidth * 0.88 &&
          item.height >= 180 &&
          (item.productDescendantCount >= 2 || item.imageDescendantCount >= 2);
        const structuralContainer =
          /^(main|section|article|ul|ol|nav|header|footer)$/.test(item.tag) &&
          item.productDescendantCount >= 2;
        const nestedProductCandidateCount = allProductCandidates.filter(
          (candidate) =>
            candidate !== item &&
            item.element.contains(candidate.element) &&
            candidate.width < item.width * 0.92 &&
            candidate.height < item.height * 0.92,
        ).length;

        return (
          !fullWidthSharedContainer &&
          !structuralContainer &&
          nestedProductCandidateCount < 3
        );
      });
      const productCards = productCandidates.filter(
        (item, index, items) =>
          index === 0 ||
          Math.abs(item.top - items[index - 1].top) > 12 ||
          Math.abs(item.left - items[index - 1].left) > 12,
      );
      const textBlocks = visible
        .filter(
          (item) =>
            item.text.length >= 80 &&
            (item.directText.length >= 40 || /^h[1-6]$|^p$|^li$|^blockquote$/.test(item.tag)) &&
            item.productDescendantCount < 2 &&
            item.width >= Math.min(260, viewportWidth * 0.55) &&
            item.width <= viewportWidth * 0.82 &&
            item.height >= 40,
        )
        .sort((a, b) => b.height - a.height);
      const firstProductTop = productCards[0]?.top ?? null;
      const contentBlocks = visible
        .filter((item) => {
          const actualTextBlock =
            item.directText.length >= 40 ||
            /^h[1-6]$|^p$|^li$|^blockquote$/.test(item.tag);
          const likelySharedProductContainer =
            item.width >= viewportWidth * 0.88 &&
            (item.productDescendantCount >= 2 || item.imageDescendantCount >= 2);
          const navigationOrChrome = /^(nav|header|footer)$/.test(item.tag);
          const closeEnoughToProductSection =
            firstProductTop === null ||
            item.top <= firstProductTop + Math.max(180, viewportHeight * 0.2);

          return (
            item.text.length >= 60 &&
            actualTextBlock &&
            !likelySharedProductContainer &&
            !navigationOrChrome &&
            item.width >= 160 &&
            item.width <= viewportWidth * 0.82 &&
            item.top >= 0 &&
            item.top < viewportHeight &&
            closeEnoughToProductSection
          );
        })
        .sort((a, b) => {
          if (firstProductTop !== null) {
            const distanceA = Math.abs(a.top - firstProductTop);
            const distanceB = Math.abs(b.top - firstProductTop);
            if (Math.abs(distanceA - distanceB) > 80) {
              return distanceA - distanceB;
            }
          }

          return a.top - b.top || a.left - b.left;
        });
      const textBeforeProduct = visible
        .filter(
          (item) =>
            item.text &&
            item.text.length <= 700 &&
            (firstProductTop === null || item.top < firstProductTop),
        )
        .map((item) => item.text)
        .join(" ");
      const fixedOverlays = visible.filter((item) => {
        const haystack = `${item.text} ${item.className} ${item.id} ${item.role}`;
        const bottomCorner =
          item.bottom > viewportHeight * 0.68 &&
          (item.left < viewportWidth * 0.22 || item.right > viewportWidth * 0.78);

        return (
          (item.position === "fixed" || item.position === "sticky") &&
          bottomCorner &&
          item.width >= 42 &&
          item.height >= 42 &&
          (item.zIndex >= 5 || chatPattern.test(haystack))
        );
      });
      const overlapsProduct = fixedOverlays.some((overlay) =>
        productCards.some(
          (card) =>
            overlay.left < card.right &&
            overlay.right > card.left &&
            overlay.top < card.bottom &&
            overlay.bottom > card.top,
        ),
      );
      const productHeights = productCards.slice(0, 8).map((item) => item.height);
      const productLefts = productCards.slice(0, 8).map((item) => item.left).sort((a, b) => a - b);
      const averageHeight =
        productHeights.reduce((total, value) => total + value, 0) /
        Math.max(1, productHeights.length);
      const heightVariance =
        productHeights.length >= 3 && averageHeight > 0
          ? Math.max(...productHeights.map((value) => Math.abs(value - averageHeight))) /
            averageHeight
          : 0;
      const gaps = productLefts
        .slice(1)
        .map((value, index) => value - productLefts[index])
        .filter((value) => value > 8);
      const averageGap =
        gaps.reduce((total, value) => total + value, 0) / Math.max(1, gaps.length);
      const gapVariance =
        gaps.length >= 3 && averageGap > 0
          ? Math.max(...gaps.map((value) => Math.abs(value - averageGap))) / averageGap
          : 0;
      const occupiedArea = aboveFold.reduce((total, item) => {
        const width = Math.max(0, Math.min(item.right, viewportWidth) - Math.max(item.left, 0));
        const height = Math.max(0, Math.min(item.bottom, viewportHeight) - Math.max(item.top, 0));
        return total + Math.min(width * height, viewportWidth * viewportHeight * 0.18);
      }, 0);
      const viewportArea = Math.max(1, viewportWidth * viewportHeight);
      const emptyViewportRatio = Math.max(
        0,
        Math.min(0.95, 1 - Math.min(occupiedArea / viewportArea, 0.9)),
      );
      const widerElements = visible.filter(
        (item) => item.width > viewportWidth + 12 || item.left < -12 || item.right > viewportWidth + 12,
      );
      const contentCandidateBounds = contentBlocks[0]
        ? toBoundingBox(contentBlocks[0])
        : null;
      const productGridCandidate = productCards.find((item) => {
        const widthRatio = item.width / viewportWidth;
        const heightRatio = item.height / viewportHeight;

        return widthRatio <= 0.95 && heightRatio <= 0.85;
      }) ?? productCards[0];
      const productGridCandidateBounds = productGridCandidate
        ? {
            ...toBoundingBox(productGridCandidate),
            isProductCard: true,
          }
        : null;

      return {
        viewportName,
        viewportWidth,
        viewportHeight,
        visibleTextCharactersAboveFold: Math.min(aboveFoldText.length, 12000),
        visibleHeadingCountAboveFold: headingsAboveFold.length,
        visibleLinkCountAboveFold: linksAboveFold.length,
        productCardsAboveFold: productCards.filter(
          (item) => item.top >= 0 && item.top < viewportHeight,
        ).length,
        imagesOrCardsAboveFold: aboveFold.filter(
          (item) =>
            item.tag === "img" ||
            item.backgroundImage !== "none" ||
            /card|tile|product|collection|grid/i.test(`${item.className} ${item.id}`),
        ).length,
        firstProductCardY: firstProductTop,
        firstCtaY: ctas[0]?.top ?? null,
        firstSearchInputY: searchInputs[0]?.top ?? null,
        largestTextBlockHeight: Math.round(textBlocks[0]?.height ?? 0),
        contentColumnWidth: typeof contentBlocks[0]?.width === "number" ? Math.round(contentBlocks[0].width) : null,
        contentColumnX: typeof contentBlocks[0]?.left === "number" ? Math.round(contentBlocks[0].left) : null,
        productGridX: typeof productGridCandidate?.left === "number" ? Math.round(productGridCandidate.left) : null,
        contentCandidateBounds,
        productGridCandidateBounds,
        horizontalOverflow:
          document.documentElement.scrollWidth > viewportWidth + 12 ||
          document.body.scrollWidth > viewportWidth + 12,
        floatingWidgetOverlapRisk: fixedOverlays.length > 0,
        chatWidgetOverlapRisk: overlapsProduct,
        elementsWiderThanViewport: widerElements.length,
        emptyViewportRatio: Number(emptyViewportRatio.toFixed(2)),
        productCardHeightVariance: Number(heightVariance.toFixed(2)),
        productCardSpacingVariance: Number(gapVariance.toFixed(2)),
        bodyTextBeforeFirstProductChars: Math.min(textBeforeProduct.length, 12000),
        visibleTextSample: aboveFoldText.slice(0, 1000),
        visibleLinks,
        headingBounds: headingsAboveFold.slice(0, 12).map((item) => ({
          ...toBoundingBox(item),
          isHeading: true,
        })),
        textBlockBounds: textBlocks.slice(0, 12).map((item) => ({
          ...toBoundingBox(item),
          isHeading: false,
        })),
        productCardBounds: productCards.slice(0, 20).map((item) => ({
          ...toBoundingBox(item),
          isProductCard: true,
        })),
      };
    }, viewport.name);
  } catch {
    return null;
  }
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
    ],
    weak: [
      /checkout\/cart/i,
      /\bcheckout\b/i,
      /\bcart\b/i,
      /\bminicart\b/i,
    ],
  },
] as const;

export function detectTechnologyDetections(signalText: string): TechnologyDetection[] {
  const checks = [...trackingToolRules, ...platformIndicatorRules] as const;

  return checks.map((check) => {
    const strongSignals =
      "strong" in check
        ? check.strong
            .filter((pattern) => pattern.test(signalText))
            .map((pattern) => pattern.source)
        : [];
    const weakSignals =
      "weak" in check
        ? check.weak
            .filter((pattern) => pattern.test(signalText))
            .map((pattern) => pattern.source)
        : [];
    const signals =
      "patterns" in check
        ? check.patterns
            .filter((pattern) => pattern.test(signalText))
            .map((pattern) => pattern.source)
            .slice(0, 3)
        : [...strongSignals, ...weakSignals].slice(0, 3);

    return {
      key: check.key,
      label: check.label,
      detected: "patterns" in check ? signals.length > 0 : strongSignals.length > 0,
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

function describePlatformPattern(pattern: RegExp) {
  const source = pattern.source;

  if (/cdn\\\.shopify\\\.com/i.test(source)) return "Shopify CDN assets";
  if (/ShopifyAnalytics|Shopify\\\.theme|Shopify\\\.routes|\\bShopify\\b/i.test(source)) {
    return "Shopify frontend objects or analytics";
  }
  if (/myshopify/i.test(source)) return "myshopify.com domain reference";
  if (/bigcommerce|cdn\\d\*\\\.bigcommerce|cdn11\\\.bigcommerce/i.test(source)) {
    return "BigCommerce asset or domain reference";
  }
  if (/bcData|Stencil|stencil|bcapp/i.test(source)) return "BigCommerce storefront data or stencil signal";
  if (/cart\\\.php|checkout\\\.php|cartAction\\\.php/i.test(source)) {
    return "BigCommerce cart or checkout endpoint";
  }
  if (/woocommerce|wc_cart_fragments|wc-ajax|wp-json\\\/wc/i.test(source)) {
    return "WooCommerce plugin or cart fragment signal";
  }
  if (/Magento_|Magento_Ui|mage|requirejs-config|customer-data|static\\\/version/i.test(source)) {
    return "Magento / Adobe Commerce frontend module or static asset signal";
  }
  if (/minicart/i.test(source)) return "generic minicart wording";
  if (/products|collections|category|catalog|shop/i.test(source)) {
    return "generic product or collection URL pattern";
  }
  if (/checkout|cart/i.test(source)) return "generic cart or checkout wording";

  return `platform pattern ${source}`;
}

function platformEvidenceDetails({
  name,
  strongMatches,
  weakMatches,
}: {
  name: PlatformName;
  strongMatches: RegExp[];
  weakMatches: RegExp[];
}) {
  return [
    `Signal count: ${strongMatches.length} strong and ${weakMatches.length} weak ${name} indicators.`,
    ...strongMatches.map(
      (pattern) => `Strong signal: ${describePlatformPattern(pattern)} (${pattern.source})`,
    ),
    ...weakMatches.map(
      (pattern) => `Weak signal: ${describePlatformPattern(pattern)} (${pattern.source})`,
    ),
  ];
}

const knownEnterpriseCommerceDomains = [
  "walmart.com",
  "amazon.com",
  "target.com",
  "apple.com",
  "bestbuy.com",
  "nike.com",
  "costco.com",
  "homedepot.com",
  "lowes.com",
];

function hostnameFromUrl(value?: string) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

function isKnownEnterpriseDomain(value?: string) {
  const hostname = hostnameFromUrl(value);

  return knownEnterpriseCommerceDomains.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );
}

type PlatformScore = {
  name: PlatformName;
  key: PlatformIndicatorRule["key"];
  score: number;
  strongCount: number;
  weakCount: number;
  strongMatches: RegExp[];
  weakMatches: RegExp[];
  details: string[];
};

const defaultEcommerceProbability: EcommerceProbability = {
  probability: 0,
  label: "Unclear",
  evidence: [],
  negativeSignals: [
    "No ecommerce probability scan evidence was available.",
  ],
};

function platformDetectionResult({
  name,
  confidence,
  confidenceLabel,
  details,
  explanation,
  recommendation,
  ecommerceProbability = defaultEcommerceProbability,
  evidence,
}: {
  name: PlatformName;
  confidence: number;
  confidenceLabel: PlatformConfidenceLabel;
  details: string[];
  explanation?: string;
  recommendation: string;
  ecommerceProbability?: EcommerceProbability;
  evidence?: string[];
}): PlatformDetection {
  return {
    name,
    platformName: name,
    confidence,
    confidenceScore: confidence,
    confidenceLabel,
    ecommerceProbability,
    details,
    evidence: evidence ?? details,
    explanation,
    recommendation,
  };
}

export function calculateEcommerceProbability(scanEvidence: {
  signalText: string;
  finalUrl?: string;
  commerceFlowSignals?: CommerceFlowSignals;
  platformScores?: PlatformScore[];
}): EcommerceProbability {
  const text = scanEvidence.signalText.toLowerCase();
  const commerce = scanEvidence.commerceFlowSignals;
  const platformScores = scanEvidence.platformScores ?? [];
  const evidence: string[] = [];
  const negativeSignals: string[] = [];
  let score = 0;

  const addEvidence = (condition: boolean, points: number, message: string) => {
    if (condition) {
      score += points;
      evidence.push(message);
    }
  };

  const addNegative = (condition: boolean, points: number, message: string) => {
    if (condition) {
      score -= points;
      negativeSignals.push(message);
    }
  };

  const hasStrongPlatformEvidence = platformScores.some(
    (platform) => platform.strongCount >= 2 && platform.score >= 60,
  );
  const hasAnyPlatformEvidence = platformScores.some(
    (platform) => platform.strongCount > 0,
  );
  const hasProductPath =
    /\/products?\b|\/collections?\b|\/category\b|\/catalog\b|\/shop\b/i.test(
      scanEvidence.signalText,
    );
  const hasPricePattern =
    /(?:[$£€]\s?\d+(?:[.,]\d{2})?)|(?:\d+(?:[.,]\d{2})?\s?(?:usd|gbp|eur))/i.test(
      scanEvidence.signalText,
    );
  const hasProductSchema =
    /"@type"\s*:\s*"(?:Product|Offer)"|schema\.org\/(?:Product|Offer)/i.test(
      scanEvidence.signalText,
    );
  const hasCommerceLanguage =
    /\b(shop|buy|checkout|cart|basket|shopping bag|add to cart|add to bag|buy now|order now)\b/i.test(
      scanEvidence.signalText,
    );
  const hasPaymentSignals =
    /shop pay|paypal|klarna|afterpay|apple pay|google pay|visa|mastercard|secure checkout|payment/i.test(
      scanEvidence.signalText,
    );
  const knownEnterpriseDomain = isKnownEnterpriseDomain(scanEvidence.finalUrl);
  const hasLeadOnlyLanguage =
    /\b(contact us|request a quote|schedule a consultation|book a call|learn more|leadership|services|solutions)\b/i.test(
      scanEvidence.signalText,
    );
  const hasRealEstateLanguage =
    /\b(real estate|property listings?|homes for sale|commercial property|brokerage|tenant|lease)\b/i.test(
      scanEvidence.signalText,
    );
  const hasEducationLanguage =
    /\b(education|course|learning|student|school|university|training|certification|curriculum)\b/i.test(
      scanEvidence.signalText,
    );
  const hasAccountOnlyLanguage =
    /\b(sign in|log in|account portal|my account)\b/i.test(scanEvidence.signalText) &&
    !hasCommerceLanguage;

  addEvidence(commerce?.cartVisible === true, 22, "Cart or shopping bag signals are visible.");
  addEvidence(commerce?.checkoutVisible === true, 22, "Checkout or buy-now signals are visible.");
  addEvidence(commerce?.productCatalogVisible === true, 18, "Product or catalog paths are visible.");
  addEvidence(hasProductPath, 14, "Product, collection, catalog, or shop URLs are visible.");
  addEvidence(hasPricePattern, 12, "Price-like patterns are visible.");
  addEvidence(hasProductSchema, 16, "Product or offer schema is visible.");
  addEvidence(hasCommerceLanguage, 12, "Commerce language such as shop, buy, cart, or checkout is visible.");
  addEvidence(hasPaymentSignals, 10, "Payment or secure checkout signals are visible.");
  addEvidence(hasStrongPlatformEvidence, 18, "Multiple strong ecommerce platform signals are visible.");
  addEvidence(hasAnyPlatformEvidence && !hasStrongPlatformEvidence, 8, "Some ecommerce platform evidence is visible.");
  addEvidence(knownEnterpriseDomain, 20, "Known large commerce domain.");

  addNegative(commerce?.cartVisible !== true, 12, "No cart or shopping bag signal was visible.");
  addNegative(commerce?.checkoutVisible !== true, 12, "No checkout signal was visible.");
  addNegative(!hasProductPath && commerce?.productCatalogVisible !== true, 12, "No product or catalog links were detected.");
  addNegative(!hasPricePattern && !hasProductSchema, 8, "No price, product schema, or offer schema was detected.");
  addNegative(commerce?.formVisible === true && !hasCommerceLanguage, 8, "Lead form signals are stronger than purchase-flow signals.");
  addNegative(hasLeadOnlyLanguage && !hasCommerceLanguage, 12, "Service or lead-generation language dominates the visible page.");
  addNegative(hasRealEstateLanguage && commerce?.checkoutVisible !== true, 18, "Real estate listing language appears without cart or checkout evidence.");
  addNegative(hasEducationLanguage && commerce?.checkoutVisible !== true, 10, "Education or content language appears without checkout evidence.");
  addNegative(hasAccountOnlyLanguage, 8, "Account or login language appears without a public purchase path.");

  if (knownEnterpriseDomain) {
    score = Math.max(score, 55);
  }

  if (
    hasRealEstateLanguage &&
    commerce?.checkoutVisible !== true &&
    !hasStrongPlatformEvidence
  ) {
    score = Math.min(score, 24);
  }

  if (
    commerce?.cartVisible !== true &&
    commerce?.checkoutVisible !== true &&
    !hasStrongPlatformEvidence &&
    !hasProductSchema &&
    !knownEnterpriseDomain
  ) {
    score = Math.min(score, 42);
  }

  const probability = Math.max(0, Math.min(100, Math.round(score)));
  const label: EcommerceProbability["label"] =
    probability >= 70
      ? "High"
      : probability >= 45
        ? "Moderate"
        : probability >= 25
          ? "Unclear"
          : "Low";

  return {
    probability,
    label,
    evidence: evidence.slice(0, 8),
    negativeSignals: negativeSignals.slice(0, 8),
  };
}

export function detectEnterpriseCommerceSignals({
  finalUrl,
  signalText,
  commerceFlowSignals,
  platformScores,
}: {
  finalUrl?: string;
  signalText: string;
  commerceFlowSignals?: CommerceFlowSignals;
  platformScores: PlatformScore[];
}): EnterpriseCommerceSignals {
  const supportingSignals: string[] = [];
  const sortedScores = [...platformScores].sort((a, b) => b.score - a.score);
  const top = sortedScores[0];
  const runnerUp = sortedScores[1];

  if (isKnownEnterpriseDomain(finalUrl)) {
    supportingSignals.push(
      "Known large enterprise retailer domain where standard-platform labels should be manually confirmed.",
    );
  }

  if (!top || top.score < 65 || top.strongCount < 2) {
    supportingSignals.push(
      "No standard storefront platform has multiple strong public-page indicators.",
    );
  }

  if (top && runnerUp && runnerUp.score >= 20 && top.score - runnerUp.score < 30) {
    supportingSignals.push(
      "Public platform evidence is mixed across more than one standard platform pattern.",
    );
  }

  if (top && top.strongCount > 0 && top.weakCount >= top.strongCount * 2) {
    supportingSignals.push(
      "Generic cart, checkout, or storefront wording contributes heavily to the platform signal.",
    );
  }

  if (
    commerceFlowSignals &&
    (!commerceFlowSignals.cartVisible ||
      !commerceFlowSignals.checkoutVisible ||
      !commerceFlowSignals.productCatalogVisible)
  ) {
    supportingSignals.push(
      "Public cart, checkout, or catalog behavior is not fully exposed on the loaded page.",
    );
  }

  if (
    /akamai|edgekey|edgesuite|fastly|cloudfront|walmartimages|targetimg|scene7|nikecloud|apple\.com\/wss|bestbuy|homedepotstatic|lowes\.com/i.test(
      signalText,
    )
  ) {
    supportingSignals.push(
      "Frontend assets suggest custom CDN, runtime, or enterprise infrastructure abstraction.",
    );
  }

  const score =
    (isKnownEnterpriseDomain(finalUrl) ? 3 : 0) +
    (supportingSignals.length >= 4 ? 3 : supportingSignals.length >= 2 ? 2 : 0);
  const enterpriseLikelihood: EnterpriseLikelihood =
    score >= 5 ? "high" : score >= 3 ? "medium" : "low";

  return {
    enterpriseLikelihood,
    supportingSignals,
    explanation:
      enterpriseLikelihood === "high"
        ? "The public page exposes mixed or limited standard-platform evidence and several enterprise storefront signals."
        : enterpriseLikelihood === "medium"
          ? "Some public signals suggest a custom, hybrid, or abstracted storefront, but a manual review should confirm the architecture."
          : "The public evidence does not strongly suggest enterprise-custom architecture.",
  };
}

export function detectEcommercePlatform(
  signalText: string,
  context: {
    finalUrl?: string;
    commerceFlowSignals?: CommerceFlowSignals;
  } = {},
): PlatformDetection {
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

    if (rule.key === "magento" && strongMatches.length < 2) {
      score = Math.min(strongMatches.length > 0 ? score : 0, strongMatches.length > 0 ? 28 : 0);
    }

    return {
      name: platformNameFromKey(rule.key),
      key: rule.key,
      score,
      strongCount: strongMatches.length,
      weakCount: weakMatches.length,
      strongMatches,
      weakMatches,
      details: platformEvidenceDetails({
        name: platformNameFromKey(rule.key),
        strongMatches,
        weakMatches,
      }),
    };
  });

  const sorted = [...platformScores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const runnerUp = sorted[1] ?? { score: 0 };
  const ecommerceProbability = calculateEcommerceProbability({
    signalText,
    finalUrl: context.finalUrl,
    commerceFlowSignals: context.commerceFlowSignals,
    platformScores,
  });
  const enterpriseSignals = detectEnterpriseCommerceSignals({
    finalUrl: context.finalUrl,
    signalText,
    commerceFlowSignals: context.commerceFlowSignals,
    platformScores,
  });
  const isEnterpriseGuardedDomain = isKnownEnterpriseDomain(context.finalUrl);

  if (ecommerceProbability.label === "Low") {
    return platformDetectionResult({
      name: "Not an ecommerce storefront",
      confidence: Math.max(5, Math.min(35, ecommerceProbability.probability)),
      confidenceLabel: "Low confidence",
      ecommerceProbability,
      details: [
        "Platform detection skipped because ecommerce probability is low.",
        ...ecommerceProbability.evidence,
        ...ecommerceProbability.negativeSignals,
      ],
      evidence: ecommerceProbability.evidence,
      explanation:
        "The public page does not expose enough cart, checkout, product, or commerce-flow evidence to classify this as an ecommerce storefront.",
      recommendation:
        "Confirm whether this URL is the correct commerce entry point or primarily a lead-generation, service, education, real estate, or informational page.",
    });
  }

  if (ecommerceProbability.label === "Unclear") {
    return platformDetectionResult({
      name: "Ecommerce probability unclear",
      confidence: Math.max(20, Math.min(44, ecommerceProbability.probability)),
      confidenceLabel: "Needs Review",
      ecommerceProbability,
      details: [
        "Manual review recommended because ecommerce probability is unclear.",
        ...ecommerceProbability.evidence,
        ...ecommerceProbability.negativeSignals,
      ],
      evidence: ecommerceProbability.evidence,
      explanation:
        "The page may support commerce elsewhere, but this URL does not expose enough public commerce signals.",
      recommendation:
        "Manually verify whether product, cart, checkout, or transaction flow exists on another URL before making platform-specific recommendations.",
    });
  }

  if (!top || top.score < 20) {
    if (enterpriseSignals.enterpriseLikelihood !== "low") {
      return platformDetectionResult({
        name: "Enterprise / Custom Commerce Stack",
        confidence: 35,
        confidenceLabel: "Needs Review",
        ecommerceProbability,
        details: enterpriseSignals.supportingSignals,
        evidence: enterpriseSignals.supportingSignals,
        explanation:
          "The public page does not expose enough reliable standard-platform evidence. This may indicate a custom, hybrid, or heavily abstracted enterprise storefront, so platform-specific recommendations should be manually confirmed.",
        recommendation:
          "Confirm architecture manually before making Shopify, BigCommerce, WooCommerce, or Magento-specific recommendations.",
      });
    }

    return platformDetectionResult({
      name: "Platform not confidently identified",
      confidence: 0,
      confidenceLabel: "Unknown",
      ecommerceProbability,
      details: [
        "No clear storefront platform indicators were detected from page assets or scripts.",
      ],
      evidence: [],
      explanation:
        "Platform detection did not find enough specific signals to identify the storefront platform confidently.",
      recommendation:
        "Confirm platform details manually from source assets, admin access, or checkout/cart URLs before making platform-specific recommendations.",
    });
  }

  const hasCompetingStrongSignals =
    "strongCount" in runnerUp &&
    runnerUp.strongCount > 0 &&
    top.strongCount > 0 &&
    top.score - runnerUp.score < 30;
  const weakSignalsOutweighStrongSignals =
    top.strongCount > 0 && top.weakCount >= top.strongCount * 3;
  const hasOverwhelmingStandardEvidence =
    top.strongCount >= 2 &&
    top.score >= 75 &&
    (!("score" in runnerUp) || top.score - runnerUp.score >= 35);
  const hasStrongStandardEvidence =
    top.strongCount >= 2 &&
    top.score >= 55 &&
    top.weakCount <= Math.max(3, top.strongCount * 2);
  const magentoEvidenceIsStrong =
    top.name !== "Magento / Adobe Commerce" ||
    (top.strongCount >= 2 && top.score >= 54);

  if (
    ecommerceProbability.label === "Moderate" &&
    (!hasStrongStandardEvidence || !magentoEvidenceIsStrong)
  ) {
    if (
      enterpriseSignals.enterpriseLikelihood !== "low" ||
      isEnterpriseGuardedDomain
    ) {
      return platformDetectionResult({
        name: "Enterprise / Custom Commerce Stack",
        confidence: Math.min(78, Math.max(45, Math.round(top.score))),
        confidenceLabel:
          enterpriseSignals.enterpriseLikelihood === "high"
            ? "Moderate confidence"
            : "Needs Review",
        ecommerceProbability,
        details: [
          ...enterpriseSignals.supportingSignals,
          `Standard-platform evidence was not strong enough to call ${top.name}.`,
          ...top.details,
        ],
        evidence: enterpriseSignals.supportingSignals,
        explanation:
          "The page has moderate commerce probability, but standard platform signatures are weak, mixed, or intentionally abstracted.",
        recommendation:
          "Treat this as custom or enterprise commerce until source assets, cart behavior, and checkout architecture are manually confirmed.",
      });
    }

    return platformDetectionResult({
      name: "Platform not confidently identified",
      confidence: Math.min(55, Math.max(30, Math.round(top.score))),
      confidenceLabel: "Needs Review",
      ecommerceProbability,
      details: [
        `Moderate ecommerce probability, but ${top.name} evidence was not strong enough for platform identification.`,
        ...top.details,
      ],
      evidence: top.details.filter((detail) => detail.startsWith("Strong signal")),
      explanation:
        "The page shows some commerce-adjacent signals, but platform-specific evidence is not strong enough to identify Shopify, BigCommerce, WooCommerce, or Magento safely.",
      recommendation:
        "Manually verify platform-specific assets before making implementation recommendations.",
    });
  }

  if (
    enterpriseSignals.enterpriseLikelihood === "high" &&
    !hasOverwhelmingStandardEvidence
  ) {
    return platformDetectionResult({
      name: "Enterprise / Custom Commerce Stack",
      confidence: Math.min(65, Math.max(35, Math.round(top.score))),
      confidenceLabel: "Needs Review",
      ecommerceProbability,
      details: [
        ...enterpriseSignals.supportingSignals,
        `Strongest standard-platform candidate was ${top.name}, but the evidence was not strong enough to override the enterprise/custom guardrail.`,
        ...top.details,
      ],
      evidence: enterpriseSignals.supportingSignals,
      explanation:
        "The storefront exposes mixed or limited public platform signals. Large enterprise retailers often use custom or hybrid commerce systems, so platform-specific recommendations should be manually confirmed.",
      recommendation:
        "Confirm the custom or hybrid architecture manually before using platform-specific recommendations.",
    });
  }

  if (
    isEnterpriseGuardedDomain &&
    !hasOverwhelmingStandardEvidence &&
    top.score < 90
  ) {
    return platformDetectionResult({
      name: "Enterprise / Custom Commerce Stack",
      confidence: Math.min(60, Math.max(35, Math.round(top.score))),
      confidenceLabel: "Needs Review",
      ecommerceProbability,
      details: [
        ...enterpriseSignals.supportingSignals,
        `Known-enterprise guardrail applied because ${top.name} evidence was not overwhelming.`,
        ...top.details,
      ],
      evidence: enterpriseSignals.supportingSignals,
      explanation:
        "The public page does not expose enough reliable standard-platform evidence. This may indicate a custom, hybrid, or heavily abstracted enterprise storefront.",
      recommendation:
        "Confirm source assets, cart/checkout behavior, and internal architecture before applying standard platform assumptions.",
    });
  }

  if (
    (runnerUp.score >= 20 && top.score - runnerUp.score < 12) ||
    hasCompetingStrongSignals ||
    weakSignalsOutweighStrongSignals ||
    (top.name === "Shopify" && top.strongCount === 0) ||
    !magentoEvidenceIsStrong
  ) {
    const runnerUpName = "name" in runnerUp ? runnerUp.name : "another platform";
    return platformDetectionResult({
      name: "Platform not confidently identified",
      confidence: Math.min(95, Math.round(top.score)),
      confidenceLabel: "Needs Review",
      ecommerceProbability,
      details: [
        `Needs manual review: ${top.name} signals were strongest, but ${runnerUpName} signals or generic commerce patterns also appeared.`,
        `Top candidate signal count: ${top.strongCount} strong and ${top.weakCount} weak ${top.name} indicators.`,
        ...top.details,
      ],
      evidence: top.details.filter((detail) => detail.startsWith("Strong signal")),
      explanation:
        `Platform signals conflict or rely too heavily on generic commerce patterns. The strongest candidate was ${top.name}, but the evidence is not clean enough for a confident platform label.`,
      recommendation:
        "Do not make platform-specific recommendations until public evidence or internal access confirms the storefront platform.",
    });
  }

  const confidence = Math.min(95, Math.round(top.score));
  const confidenceLabel = getConfidenceLabel(confidence);
  const strongestEvidence = top.details
    .filter((detail) => detail.startsWith("Strong signal"))
    .slice(0, 3)
    .map((detail) => detail.replace(/^Strong signal: /, "").replace(/\s+\(.+\)$/, ""))
    .join("; ");

  return platformDetectionResult({
    name: top.name,
    confidence,
    confidenceLabel,
    ecommerceProbability,
    details: top.details,
    evidence: top.details.filter((detail) => detail.startsWith("Strong signal")),
    explanation:
      confidenceLabel === "High confidence"
        ? `Detected ${top.name} with high confidence because platform-specific evidence was visible: ${strongestEvidence || "multiple strong storefront signals"}.`
        : confidenceLabel === "Low confidence"
        ? `Detected ${top.name}, but the signal strength is low and should be confirmed manually because the scan found only limited platform-specific evidence.`
        : `Detected ${top.name} with ${confidenceLabel.toLowerCase()} from visible public-page indicators; confirm manually before making platform-specific recommendations.`,
    recommendation:
      "Use platform-specific recommendations only after confirming the detected public signals match the actual storefront architecture.",
  });
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
      const aboveFoldTextSnippets = Array.from(
        new Set(
          aboveFoldElements
            .map((item) => item.text)
            .filter((text) => Boolean(text) && text.length <= 500),
        ),
      );
      const aboveFoldTextLength = aboveFoldTextSnippets.reduce(
        (total, text) => total + Math.min(text.length, 220),
        0,
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
        mobileVisibleTextLength: aboveFoldTextLength,
        mobileCrowdingRisk:
          aboveFoldElements.length > 65 ||
          aboveFoldTextLength > 1800,
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

    const commerceFlowSignals = detectCommerceFlowSignals(
      signalText,
      pageData.ctaLabels,
      pageData.formCount,
      pageData.inputCount,
    );

    return {
      technologyDetections: detectTechnologyDetections(signalText),
      platformDetection: detectEcommercePlatform(signalText, {
        finalUrl: page.url(),
        commerceFlowSignals,
      }),
      commerceFlowSignals,
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
  return platformDetectionResult({
    name: "Unknown",
    confidence: 0,
    confidenceLabel: "Unknown",
    ecommerceProbability: defaultEcommerceProbability,
    details: [
      "No clear storefront platform indicators were detected from the lightweight scan.",
    ],
    evidence: [],
    explanation:
      "No platform indicators were available from the lightweight scan, so the storefront platform could not be identified.",
    recommendation:
      "Run the scan against a public page that exposes product, cart, checkout, or platform-specific evidence.",
  });
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
