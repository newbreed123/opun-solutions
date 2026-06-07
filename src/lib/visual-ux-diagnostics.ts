import type {
  CommerceFlowSignals,
  StorefrontReviewSignals,
  VisualDomMetrics,
} from "./ecommerce-audit-scanner";

export type VisualUxFinding = {
  title: string;
  severity: "High" | "Medium" | "Low";
  confidence: "High" | "Moderate" | "Low";
  evidenceSummary: string;
  businessImpact: string;
  recommendedFirstAction: string;
  viewport: "desktop" | "mobile" | "both";
};

export type VisualUxArchetype =
  | "Enterprise Retail / Marketplace"
  | "Industrial Distributor / B2B Catalog"
  | "DTC Brand"
  | "Grocery / Supermarket Retail"
  | "Education Commerce"
  | "Healthcare Commerce"
  | "Lead Generation / Service Business"
  | "Unknown";

export type VisualUxMetricsSummary = {
  desktopGapPx: number | null;
  desktopGapPercent: number | null;
  contentToProductRatio: number | null;
  desktopProductCardsAboveFold: number;
  mobileProductCardsAboveFold: number;
  firstDesktopProductY: number | null;
  firstMobileProductY: number | null;
};

export type VisualMetricsDebug = {
  contentSelector: string | null;
  contentBoundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    textSample?: string;
  } | null;
  productGridSelector: string | null;
  productGridBoundingBox: {
    left: number;
    top: number;
    width: number;
    height: number;
    right: number;
    textSample?: string;
  } | null;
  viewportWidth: number | null;
  contentX: number | null;
  contentWidth: number | null;
  productGridX: number | null;
  productGridWidth: number | null;
  gapPx: number | null;
  gapPercent: number | null;
  ratio: number | null;
};

export type VisualUxDiagnosticsResult = {
  score: number;
  findings: VisualUxFinding[];
  summary: string;
  evidence: string[];
  desktopConcerns: string[];
  mobileConcerns: string[];
  uxArchetype?: VisualUxArchetype | string | null;
  metrics?: VisualUxMetricsSummary;
  visualMetricsDebug?: VisualMetricsDebug;
};

export type AnalyzeVisualUxInput = {
  desktopScreenshot?: string | null;
  mobileScreenshot?: string | null;
  desktopDomMetrics?: VisualDomMetrics | null;
  mobileDomMetrics?: VisualDomMetrics | null;
  visibleText?: string;
  visibleLinks?: string[];
  productSignals?: Partial<StorefrontReviewSignals>;
  commerceSignals?: Partial<CommerceFlowSignals>;
  siteType?: string | null;
  platformName?: string | null;
  scannedUrl?: string | null;
};

type ThresholdBucket = "healthy" | "needs-review" | "high-priority" | "unknown";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function round(value: number | null | undefined, digits = 0) {
  if (!isNumber(value)) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function yRatio(metrics: VisualDomMetrics | null | undefined, value: number | null) {
  if (!metrics || !isNumber(value) || !metrics.viewportHeight) return null;
  return value / metrics.viewportHeight;
}

function pushFinding(findings: VisualUxFinding[], finding: VisualUxFinding) {
  if (!findings.some((item) => item.title === finding.title && item.viewport === finding.viewport)) {
    findings.push(finding);
  }
}

function concernText(findings: VisualUxFinding[], viewport: "desktop" | "mobile") {
  return findings
    .filter((finding) => finding.viewport === viewport || finding.viewport === "both")
    .map((finding) => finding.title);
}

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function resolveVisualUxArchetype(scanContext: {
  siteType?: string | null;
  visibleText?: string;
  visibleLinks?: string[];
  productSignals?: Partial<StorefrontReviewSignals>;
  commerceSignals?: Partial<CommerceFlowSignals>;
  desktopDomMetrics?: VisualDomMetrics | null;
  platformName?: string | null;
  scannedUrl?: string | null;
}): VisualUxArchetype {
  const siteType = (scanContext.siteType || "").toLowerCase();
  const haystack = [
    scanContext.scannedUrl,
    scanContext.platformName,
    scanContext.visibleText,
    ...(scanContext.visibleLinks ?? []),
    scanContext.desktopDomMetrics?.visibleTextSample,
    ...(scanContext.desktopDomMetrics?.visibleLinks ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/grocery|supermarket|sprouts|publix|kroger|wholefoods|safeway|albertsons|wegmans|heb|meijer|harristeeter/.test(siteType + haystack)) {
    return "Grocery / Supermarket Retail";
  }

  const industrialTerms = [
    "industrial",
    "industrial supply",
    "distributor",
    "wholesale",
    "contractor",
    "trade",
    "plumbing",
    "pvc",
    "pipe",
    "fittings",
    "valves",
    "replacement parts",
    "part number",
    "sku",
    "specification",
    "datasheet",
    "technical",
  ];
  if (siteType.includes("b2b") || siteType.includes("industrial") || includesAny(haystack, industrialTerms)) {
    return "Industrial Distributor / B2B Catalog";
  }

  if (/marketplace|enterprise retail|amazon|walmart|target|bestbuy|costco|seller|third-party/.test(siteType + haystack)) {
    return "Enterprise Retail / Marketplace";
  }

  if (/education|course|student|learner|textbook|curriculum/.test(siteType + haystack)) {
    return "Education Commerce";
  }

  if (/healthcare|medical|patient|provider|pharmacy|prescription/.test(siteType + haystack)) {
    return "Healthcare Commerce";
  }

  if (/lead generation|service business|consultation|appointment|real estate|quote request/.test(siteType + haystack)) {
    return "Lead Generation / Service Business";
  }

  const productCount = scanContext.desktopDomMetrics?.productCardsAboveFold ?? 0;
  const linkCount = scanContext.desktopDomMetrics?.visibleLinkCountAboveFold ?? 0;
  const looksRetailDense = linkCount > 35 || productCount > 12;
  if (looksRetailDense) return "Enterprise Retail / Marketplace";

  const looksDtc =
    siteType.includes("dtc") ||
    (productCount > 0 &&
      linkCount < 18 &&
      (scanContext.commerceSignals?.cartVisible || scanContext.commerceSignals?.checkoutVisible));
  if (looksDtc) return "DTC Brand";

  return "Unknown";
}

function metricBounds(metrics: VisualDomMetrics | null | undefined) {
  const productBounds = metrics?.productCardBounds ?? [];
  const textBounds = [...(metrics?.textBlockBounds ?? []), ...(metrics?.headingBounds ?? [])];
  const productLefts = productBounds.map((box) => box.left).filter(isNumber);
  const productRights = productBounds.map((box) => box.right).filter(isNumber);
  const textLefts = textBounds.map((box) => box.left).filter(isNumber);
  const textWidths = textBounds.map((box) => box.width).filter(isNumber);

  const productGridX =
    isNumber(metrics?.productGridX)
      ? metrics.productGridX
      : productLefts.length > 0
        ? Math.min(...productLefts)
        : null;
  const productGridRight = productRights.length > 0 ? Math.max(...productRights) : null;
  const productGridWidth =
    isNumber(productGridX) && isNumber(productGridRight)
      ? Math.max(0, productGridRight - productGridX)
      : null;
  const contentColumnX =
    isNumber(metrics?.contentColumnX)
      ? metrics.contentColumnX
      : textLefts.length > 0
        ? Math.min(...textLefts)
        : null;
  const contentColumnWidth =
    isNumber(metrics?.contentColumnWidth)
      ? metrics.contentColumnWidth
      : textWidths.length > 0
        ? Math.max(...textWidths)
        : null;

  return {
    productGridX,
    productGridWidth,
    contentColumnX,
    contentColumnWidth,
    contentCandidateBounds: metrics?.contentCandidateBounds ?? null,
    productGridCandidateBounds: metrics?.productGridCandidateBounds ?? null,
  };
}

function compactDebugBox(box: VisualDomMetrics["contentCandidateBounds"]) {
  if (!box) return null;

  return {
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
    right: box.right,
    textSample: box.textSample,
  };
}

function aggregateProductGridBox(metrics: VisualDomMetrics | null | undefined) {
  const boxes = metrics?.productCardBounds ?? [];
  if (boxes.length === 0) return null;

  const left = Math.min(...boxes.map((box) => box.left));
  const top = Math.min(...boxes.map((box) => box.top));
  const right = Math.max(...boxes.map((box) => box.right));
  const bottom = Math.max(...boxes.map((box) => box.top + box.height));

  return {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(right - left),
    height: Math.round(bottom - top),
    right: Math.round(right),
    textSample: boxes[0]?.textSample,
  };
}

function desktopGapBucket(gapPx: number | null, gapPercent: number | null): ThresholdBucket {
  if (!isNumber(gapPx) || !isNumber(gapPercent) || gapPx < 0) return "unknown";
  if (gapPx < 80 || gapPercent < 6) return "healthy";
  if (gapPx >= 300 || gapPercent >= 20) return "high-priority";
  if (gapPx >= 160 || gapPercent >= 12) return "needs-review";
  return "healthy";
}

function contentProductRatioBucket(ratio: number | null): ThresholdBucket {
  if (!isNumber(ratio)) return "unknown";
  if (ratio <= 1.1) return "healthy";
  if (ratio >= 1.3) return "high-priority";
  if (ratio >= 1.2) return "needs-review";
  return "healthy";
}

function severityFromBucket(bucket: ThresholdBucket): VisualUxFinding["severity"] {
  return bucket === "high-priority" ? "High" : "Medium";
}

function formatMetrics(metrics: VisualUxMetricsSummary) {
  const parts = [];
  if (isNumber(metrics.desktopGapPx) && isNumber(metrics.desktopGapPercent)) {
    parts.push(
      `desktop gap ${Math.round(metrics.desktopGapPx)}px (${metrics.desktopGapPercent.toFixed(1)}% of viewport)`,
    );
  }
  if (isNumber(metrics.contentToProductRatio)) {
    parts.push(`content/product ratio ${metrics.contentToProductRatio.toFixed(2)}`);
  }
  return parts.join("; ");
}

function productContext(
  desktop: VisualDomMetrics | null,
  mobile: VisualDomMetrics | null,
  productSignals?: Partial<StorefrontReviewSignals>,
  commerceSignals?: Partial<CommerceFlowSignals>,
) {
  const text = [
    desktop?.visibleTextSample,
    mobile?.visibleTextSample,
    ...(desktop?.visibleLinks ?? []),
    ...(mobile?.visibleLinks ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return Boolean(
    productSignals?.productNavigationVisible ||
      productSignals?.collectionLinksVisible ||
      commerceSignals?.productCatalogVisible ||
      (desktop?.productCardsAboveFold ?? 0) >= 3 ||
      (mobile?.productCardsAboveFold ?? 0) >= 3 ||
      (isNumber(desktop?.firstProductCardY) || isNumber(mobile?.firstProductCardY)) &&
        /shop|product|category|catalog|sku|part|cart|view item|add to/i.test(text),
  );
}

export function analyzeVisualUx({
  desktopDomMetrics,
  mobileDomMetrics,
  visibleText,
  visibleLinks,
  productSignals,
  commerceSignals,
  siteType,
  platformName,
  scannedUrl,
}: AnalyzeVisualUxInput): VisualUxDiagnosticsResult {
  const findings: VisualUxFinding[] = [];
  const evidence: string[] = [];
  const desktop = desktopDomMetrics ?? null;
  const mobile = mobileDomMetrics ?? null;

  if (!desktop && !mobile) {
    return {
      score: 100,
      findings,
      summary: "Visual UX diagnostics were skipped because screenshot DOM metrics were not available.",
      evidence,
      desktopConcerns: [],
      mobileConcerns: [],
      uxArchetype: "Unknown",
      metrics: {
        desktopGapPx: null,
        desktopGapPercent: null,
        contentToProductRatio: null,
        desktopProductCardsAboveFold: 0,
        mobileProductCardsAboveFold: 0,
        firstDesktopProductY: null,
        firstMobileProductY: null,
      },
      visualMetricsDebug: {
        contentSelector: null,
        contentBoundingBox: null,
        productGridSelector: null,
        productGridBoundingBox: null,
        viewportWidth: null,
        contentX: null,
        contentWidth: null,
        productGridX: null,
        productGridWidth: null,
        gapPx: null,
        gapPercent: null,
        ratio: null,
      },
    };
  }

  const archetype = resolveVisualUxArchetype({
    siteType,
    visibleText,
    visibleLinks,
    productSignals,
    commerceSignals,
    desktopDomMetrics: desktop,
    platformName,
    scannedUrl,
  });
  const bounds = metricBounds(desktop);
  const desktopGapPx =
    isNumber(bounds.productGridX) && isNumber(bounds.contentColumnX)
      ? Math.max(0, bounds.productGridX - bounds.contentColumnX)
      : null;
  const desktopGapPercent =
    isNumber(desktopGapPx) && isNumber(desktop?.viewportWidth) && desktop.viewportWidth > 0
      ? (desktopGapPx / desktop.viewportWidth) * 100
      : null;
  const contentToProductRatio =
    isNumber(bounds.contentColumnWidth) && isNumber(bounds.productGridWidth) && bounds.productGridWidth > 0
      ? bounds.contentColumnWidth / bounds.productGridWidth
      : null;
  const metrics: VisualUxMetricsSummary = {
    desktopGapPx: round(desktopGapPx),
    desktopGapPercent: round(desktopGapPercent, 1),
    contentToProductRatio: round(contentToProductRatio, 2),
    desktopProductCardsAboveFold: desktop?.productCardsAboveFold ?? 0,
    mobileProductCardsAboveFold: mobile?.productCardsAboveFold ?? 0,
    firstDesktopProductY: round(desktop?.firstProductCardY),
    firstMobileProductY: round(mobile?.firstProductCardY),
  };
  const visualMetricsDebug: VisualMetricsDebug = {
    contentSelector: bounds.contentCandidateBounds?.selector ?? null,
    contentBoundingBox: compactDebugBox(bounds.contentCandidateBounds),
    productGridSelector: bounds.productGridCandidateBounds?.selector ?? null,
    productGridBoundingBox: aggregateProductGridBox(desktop),
    viewportWidth: desktop?.viewportWidth ?? null,
    contentX: round(bounds.contentColumnX),
    contentWidth: round(bounds.contentColumnWidth),
    productGridX: round(bounds.productGridX),
    productGridWidth: round(bounds.productGridWidth),
    gapPx: metrics.desktopGapPx,
    gapPercent: metrics.desktopGapPercent,
    ratio: metrics.contentToProductRatio,
  };
  const metricSummary = formatMetrics(metrics);
  const gapBucket = desktopGapBucket(metrics.desktopGapPx, metrics.desktopGapPercent);
  const ratioBucket = contentProductRatioBucket(metrics.contentToProductRatio);
  const hasProductContext = productContext(desktop, mobile, productSignals, commerceSignals);
  const desktopHasProducts = Boolean(desktop && (desktop.productCardsAboveFold > 0 || isNumber(desktop.firstProductCardY)));
  const isEnterprise = archetype === "Enterprise Retail / Marketplace";
  const isIndustrial = archetype === "Industrial Distributor / B2B Catalog";
  const enterpriseHealthyLayout =
    isEnterprise &&
    gapBucket === "healthy" &&
    (metrics.contentToProductRatio === null || metrics.contentToProductRatio <= 1.1) &&
    (desktop?.productCardsAboveFold ?? 0) > 0;

  if (desktop) {
    evidence.push(
      `Desktop visual metrics: product grid x=${bounds.productGridX ?? "n/a"}, content x=${bounds.contentColumnX ?? "n/a"}, ${metricSummary || "no reliable gap/ratio metrics"}, product modules above fold=${desktop.productCardsAboveFold}. Content selector: ${visualMetricsDebug.contentSelector ?? "n/a"}. Product selector: ${visualMetricsDebug.productGridSelector ?? "n/a"}.`,
    );
  }
  if (mobile) {
    evidence.push(
      `Mobile visual metrics: first product/card y=${mobile.firstProductCardY ?? "n/a"}, text above fold=${mobile.visibleTextCharactersAboveFold}, product modules above fold=${mobile.productCardsAboveFold}, first CTA y=${mobile.firstCtaY ?? "n/a"}.`,
    );
  }
  evidence.push(`Visual UX archetype: ${archetype}.`);

  if (desktopHasProducts && gapBucket !== "healthy" && gapBucket !== "unknown" && !enterpriseHealthyLayout) {
    pushFinding(findings, {
      title: "Desktop Layout Alignment Needs Review",
      severity: severityFromBucket(gapBucket),
      confidence: "High",
      viewport: "desktop",
      evidenceSummary: isNumber(metrics.desktopGapPx) && isNumber(metrics.desktopGapPercent)
        ? `Desktop product modules start about ${Math.round(metrics.desktopGapPx)}px away from the content origin, roughly ${metrics.desktopGapPercent.toFixed(1)}% of the viewport.`
        : "Desktop content and product modules appear separated based on available DOM box metrics.",
      businessImpact: isIndustrial
        ? "For industrial catalog buyers, large separation between category copy and product modules can slow part, fitting, or supply discovery."
        : "Visitors may need more effort to connect page content with related products or shopping modules.",
      recommendedFirstAction: isIndustrial
        ? "Tighten the category copy and product grid into a shared catalog layout so buyers can move from category context to parts or supplies quickly."
        : "Align copy and product modules into a clearer grid and reduce large horizontal offsets at desktop breakpoints.",
    });
  }

  if (desktopHasProducts && ratioBucket !== "healthy" && ratioBucket !== "unknown" && !enterpriseHealthyLayout) {
    pushFinding(findings, {
      title: "Content-to-Product Balance Needs Review",
      severity: severityFromBucket(ratioBucket),
      confidence: "High",
      viewport: "desktop",
      evidenceSummary: isNumber(metrics.contentToProductRatio)
        ? `The measured content/product ratio is ${metrics.contentToProductRatio.toFixed(2)}; values above 1.20 need review and values above 1.30 are high priority.`
        : "Content appears to outweigh visible product modules in the first desktop experience.",
      businessImpact: isIndustrial
        ? "Procurement and contractor buyers usually arrive with a product, SKU, or part category in mind; oversized copy can delay useful browsing."
        : "Large copy blocks can delay product discovery and make the page feel less immediately shoppable.",
      recommendedFirstAction: isIndustrial
        ? "Shorten category copy, expose product categories or filters earlier, and make the product grid the dominant catalog surface."
        : "Rebalance content and product module widths so product discovery is visible sooner.",
    });
  }

  if (
    isIndustrial &&
    desktopHasProducts &&
    gapBucket === "high-priority" &&
    ratioBucket === "high-priority"
  ) {
    pushFinding(findings, {
      title: "Grid-to-Content Separation Needs Review",
      severity: "High",
      confidence: "High",
      viewport: "desktop",
      evidenceSummary: `${metricSummary}. Both separation and content/product balance cross high-priority thresholds for a catalog page.`,
      businessImpact:
        "The category explanation and inventory surface may feel like disconnected sections, which is risky for buyers trying to locate parts quickly.",
      recommendedFirstAction:
        "Bring category copy, filters, product cards, and search into one tighter catalog zone before refining lower-priority visual polish.",
    });
  }

  if (
    desktopHasProducts &&
    !enterpriseHealthyLayout &&
    ((gapBucket === "high-priority" && isNumber(metrics.desktopGapPercent) && metrics.desktopGapPercent >= 20) ||
      ((desktop?.emptyViewportRatio ?? 0) > 0.58 && (desktop?.productCardsAboveFold ?? 0) < 4))
  ) {
    pushFinding(findings, {
      title: "Desktop Whitespace Inefficiency Needs Review",
      severity: gapBucket === "high-priority" ? "High" : "Medium",
      confidence: "Moderate",
      viewport: "desktop",
      evidenceSummary: isNumber(metrics.desktopGapPercent)
        ? `The desktop layout leaves about ${metrics.desktopGapPercent.toFixed(1)}% of the viewport between the content origin and product grid.`
        : "The desktop layout appears sparse or imbalanced around product modules.",
      businessImpact:
        "Unused desktop space can make related content and products feel less organized and harder to scan.",
      recommendedFirstAction:
        "Reduce oversized gutters and use the available desktop width to group content, search, filters, and product cards more tightly.",
    });
  }

  const desktopProductLate =
    yRatio(desktop, desktop?.firstProductCardY ?? null) !== null &&
    (yRatio(desktop, desktop?.firstProductCardY ?? null) ?? 0) > 0.68;
  const mobileProductLate =
    yRatio(mobile, mobile?.firstProductCardY ?? null) !== null &&
    (yRatio(mobile, mobile?.firstProductCardY ?? null) ?? 0) > 0.58;
  const textHeavyBeforeProducts =
    (mobile?.bodyTextBeforeFirstProductChars ?? 0) > 900 ||
    (desktop?.bodyTextBeforeFirstProductChars ?? 0) > 1500 ||
    ((mobile?.visibleTextCharactersAboveFold ?? 0) > 1500 && (mobile?.productCardsAboveFold ?? 0) === 0);

  if (hasProductContext && (desktopProductLate || mobileProductLate || textHeavyBeforeProducts)) {
    pushFinding(findings, {
      title: isIndustrial ? "Catalog Discovery Friction Needs Review" : "Product Discovery Pushed Below Content",
      severity: "High",
      confidence: "Moderate",
      viewport: mobileProductLate ? "mobile" : desktopProductLate ? "desktop" : "both",
      evidenceSummary: isIndustrial
        ? `Catalog/product modules appear delayed relative to text or page framing. Desktop text before products=${desktop?.bodyTextBeforeFirstProductChars ?? 0}; mobile text before products=${mobile?.bodyTextBeforeFirstProductChars ?? 0}.`
        : "Product browsing appears below long mobile or desktop content sections, which may delay discovery.",
      businessImpact: isIndustrial
        ? "B2B buyers may need extra effort before they can search, compare, or identify the right SKU or category."
        : "Shoppers may have to work through too much explanation before they see useful products, categories, or shopping paths.",
      recommendedFirstAction: isIndustrial
        ? "Move search, category filters, and top product groups higher than long explanatory copy."
        : "Shorten introductory copy, surface product/category choices sooner, and make search or browsing actions visible before long descriptive sections.",
    });
  }

  const mobileHierarchyRisk = Boolean(
    mobile &&
      hasProductContext &&
      ((mobile.visibleTextCharactersAboveFold > 2200 && mobile.productCardsAboveFold === 0) ||
        (isNumber(mobile.firstProductCardY) &&
          mobile.firstProductCardY > mobile.viewportHeight * 0.88 &&
          (!isNumber(mobile.firstCtaY) || mobile.firstCtaY > mobile.viewportHeight * 0.55)) ||
        mobile.chatWidgetOverlapRisk),
  );
  if (mobileHierarchyRisk) {
    pushFinding(findings, {
      title: "Mobile Content Hierarchy Needs Review",
      severity: "High",
      confidence: "Moderate",
      viewport: "mobile",
      evidenceSummary:
        "Mobile first screen prioritizes long content or overlays before product browsing, search, or category choices.",
      businessImpact: isIndustrial
        ? "Mobile buyers may need to scroll before they can search for parts, categories, or specifications."
        : "Mobile shoppers may read a lot before seeing useful product options, search, categories, or a clear next action.",
      recommendedFirstAction: isIndustrial
        ? "Put catalog search, category links, and product groups before long copy on mobile, and verify widgets do not cover product cards."
        : "Shorten first-screen copy, surface search/category/product options sooner, and ensure floating chat widgets do not cover product cards.",
    });
  }

  const floatingOverlap =
    (hasProductContext || commerceSignals?.ctaVisible) &&
    ((desktop?.chatWidgetOverlapRisk && (desktop?.productCardsAboveFold ?? 0) > 0) ||
      (mobile?.chatWidgetOverlapRisk && (mobile?.productCardsAboveFold ?? 0) > 0));
  if (floatingOverlap) {
    pushFinding(findings, {
      title: "Floating Widget Overlap Risk",
      severity: mobile?.chatWidgetOverlapRisk ? "High" : "Medium",
      confidence: "Moderate",
      viewport: mobile?.chatWidgetOverlapRisk ? "mobile" : "both",
      evidenceSummary:
        "A floating chat/help widget may cover product cards, CTAs, or key mobile content.",
      businessImpact:
        "Overlaying product cards, CTAs, or browsing controls can create avoidable friction right when visitors are trying to act.",
      recommendedFirstAction:
        "Move, shrink, or delay floating chat/help widgets on product and category sections, especially on mobile.",
    });
  }

  if (isIndustrial && !productSignals?.searchVisible && !isNumber(desktop?.firstSearchInputY)) {
    pushFinding(findings, {
      title: "Search and Part Lookup Visibility Needs Review",
      severity: "Medium",
      confidence: "Moderate",
      viewport: "both",
      evidenceSummary:
        "No prominent search input or search position was detected in the above-fold visual metrics for a catalog-oriented page.",
      businessImpact:
        "Industrial and B2B buyers often search by SKU, part number, size, or product family; weak search visibility can slow procurement behavior.",
      recommendedFirstAction:
        "Make catalog search and part-number lookup visible in the desktop header and early mobile experience.",
    });
  }

  const combinedText = [
    visibleText,
    desktop?.visibleTextSample,
    mobile?.visibleTextSample,
    ...(visibleLinks ?? []),
    ...(desktop?.visibleLinks ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (
    isIndustrial &&
    /pipe|pvc|valve|fitting|part|sku|industrial|plumbing|replacement/.test(combinedText) &&
    !/spec|specification|datasheet|dimension|material|technical/.test(combinedText)
  ) {
    pushFinding(findings, {
      title: "Product Specification Access Needs Review",
      severity: "Low",
      confidence: "Low",
      viewport: "both",
      evidenceSummary:
        "Technical-product language was visible, but specification, dimension, or datasheet cues were not prominent in the sampled page text.",
      businessImpact:
        "Technical buyers may need specifications before they can confidently choose a fitting, part, or supply item.",
      recommendedFirstAction:
        "Bring key specs, dimensions, filters, and datasheet access closer to category and product cards.",
    });
  }

  if (isEnterprise) {
    if ((desktop?.visibleLinkCountAboveFold ?? 0) > 45) {
      pushFinding(findings, {
        title: "Navigation Density Needs Review",
        severity: "Medium",
        confidence: "Moderate",
        viewport: "desktop",
        evidenceSummary: `The desktop scan detected ${desktop?.visibleLinkCountAboveFold ?? 0} links above the fold.`,
        businessImpact:
          "Large retail and marketplace pages can overwhelm shoppers when navigation, promotions, and account paths compete visually.",
        recommendedFirstAction:
          "Review header, promotional, and category navigation hierarchy so the highest-intent paths remain obvious.",
      });
    }

    if ((commerceSignals?.ctaCount ?? 0) > 5 || (desktop?.imagesOrCardsAboveFold ?? 0) > 14) {
      pushFinding(findings, {
        title: "Promotional Competition Needs Review",
        severity: "Medium",
        confidence: "Moderate",
        viewport: "desktop",
        evidenceSummary: `The scan found ${commerceSignals?.ctaCount ?? 0} CTA-like elements and ${desktop?.imagesOrCardsAboveFold ?? 0} visual modules above the fold.`,
        businessImpact:
          "Competing promotional modules can dilute the next best action even when product discovery is technically available.",
        recommendedFirstAction:
          "Prioritize promotional hierarchy and confirm search, department, and cart paths stay visually dominant.",
      });
    }

    if (/marketplace|seller|third-party/.test(combinedText) && (desktop?.visibleLinkCountAboveFold ?? 0) > 25) {
      pushFinding(findings, {
        title: "Marketplace Complexity Needs Review",
        severity: "Low",
        confidence: "Moderate",
        viewport: "desktop",
        evidenceSummary:
          "Marketplace/account language appears alongside dense navigation and product modules.",
        businessImpact:
          "Buyer, seller, account, fulfillment, and promotional paths can compete for attention in marketplace experiences.",
        recommendedFirstAction:
          "Separate buyer-shopping paths from seller/account paths and confirm product discovery remains the dominant path.",
      });
    }
  }

  if (
    !isEnterprise &&
    hasProductContext &&
    (((desktop?.productCardsAboveFold ?? 0) >= 4 &&
      ((desktop?.productCardHeightVariance ?? 0) > 0.7 ||
        (desktop?.productCardSpacingVariance ?? 0) > 0.75)) ||
      ((mobile?.productCardsAboveFold ?? 0) >= 4 &&
        (mobile?.productCardHeightVariance ?? 0) > 0.75))
  ) {
    pushFinding(findings, {
      title: "Product Grid Consistency Needs Review",
      severity: "Low",
      confidence: "Low",
      viewport: (mobile?.productCardHeightVariance ?? 0) > 0.38 ? "mobile" : "desktop",
      evidenceSummary:
        "Product cards appear inconsistent in spacing or alignment, which can reduce browsing clarity.",
      businessImpact:
        "Uneven product cards make comparison harder and can make a catalog page feel less polished.",
      recommendedFirstAction:
        "Normalize product card image ratios, title lengths, pricing placement, and grid gaps across the first visible product rows.",
    });
  }

  if (
    hasProductContext &&
    ((mobile?.horizontalOverflow && (mobile?.elementsWiderThanViewport ?? 0) >= 8) ||
      (desktop?.horizontalOverflow && (desktop?.elementsWiderThanViewport ?? 0) >= 12) ||
      (mobile?.elementsWiderThanViewport ?? 0) >= 10 ||
      (desktop?.elementsWiderThanViewport ?? 0) >= 14)
  ) {
    pushFinding(findings, {
      title: "Horizontal Layout Overflow Needs Review",
      severity: "Medium",
      confidence: "Moderate",
      viewport: mobile?.horizontalOverflow ? "mobile" : "desktop",
      evidenceSummary:
        "One or more visible elements appear wider than the viewport, which can create sideways scroll or clipped content.",
      businessImpact:
        "Horizontal overflow makes pages feel broken, especially on mobile where shoppers expect a clean vertical browsing path.",
      recommendedFirstAction:
        "Inspect wide sections, tables, carousels, and fixed-width containers, then constrain them to the viewport at mobile and desktop breakpoints.",
    });
  }

  const penalty = findings.reduce((total, finding) => {
    if (finding.severity === "High") return total + 18;
    if (finding.severity === "Medium") return total + 10;
    return total + 4;
  }, 0);
  const industrialLayoutPenalty =
    isIndustrial && gapBucket === "high-priority" && ratioBucket === "high-priority" ? 8 : 0;
  let score = Math.max(35, Math.min(100, 92 - penalty - industrialLayoutPenalty));
  if (isIndustrial && findings.length > 0) {
    score = Math.max(score, 42);
  }
  if (isEnterprise && !findings.some((finding) => finding.severity === "High")) {
    score = Math.max(score, 78);
  }
  if (isEnterprise && findings.length === 0) {
    score = 88;
  }

  const desktopConcernList = concernText(findings, "desktop");
  const mobileConcernList = concernText(findings, "mobile");
  const summary =
    findings.length > 0
      ? `Visual UX diagnostics classified this as ${archetype}. ${metricSummary ? `${metricSummary}. ` : ""}Found ${findings.length} layout, hierarchy, density, or product-discovery concern${findings.length === 1 ? "" : "s"}.${
          desktopConcernList.length > 0 ? ` Desktop: ${desktopConcernList.join(", ")}.` : ""
        }${mobileConcernList.length > 0 ? ` Mobile: ${mobileConcernList.join(", ")}.` : ""}`
      : `Visual UX diagnostics classified this as ${archetype}. ${metricSummary ? `${metricSummary}. ` : ""}The measured layout did not cross the current desktop separation or content/product balance thresholds.`;

  return {
    score,
    findings,
    summary,
    evidence: evidence.slice(0, 8),
    desktopConcerns: desktopConcernList,
    mobileConcerns: mobileConcernList,
    uxArchetype: archetype,
    metrics,
    visualMetricsDebug,
  };
}
