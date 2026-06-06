import { LiveDiagnosticsResult, EcommerceProbability } from "./ecommerce-audit-scanner";

export type SiteClassification = {
  siteType: string;
  confidenceScore: number;
  confidenceLabel: "High" | "Moderate" | "Low" | "Needs Review";
  evidence: string[];
  explanation: string;
};

const knownEnterprise = [
  "amazon.com",
  "walmart.com",
  "target.com",
  "bestbuy.com",
  "apple.com",
  "nike.com",
  "costco.com",
  "homedepot.com",
  "lowes.com",
];

const knownGroceryRetail = [
  "sprouts.com",
  "publix.com",
  "harristeeter.com",
  "kroger.com",
  "wholefoodsmarket.com",
  "safeway.com",
  "albertsons.com",
  "wegmans.com",
  "heb.com",
  "meijer.com",
  "stopandshop.com",
];

const groceryFlowEnterpriseDomains = ["walmart.com"];

const groceryTerms = [
  "grocery",
  "groceries",
  "fresh produce",
  "organic food",
  "natural food",
  "pickup",
  "delivery",
  "curbside",
  "weekly ad",
  "store locator",
  "pharmacy",
  "deli",
  "bakery",
  "meat",
  "seafood",
  "prepared foods",
  "vitamins",
  "supplements",
  "coupons",
  "loyalty",
  "rewards",
  "shop by aisle",
  "departments",
  "recipes",
  "catering",
];

function hostname(value?: string) {
  if (!value) return "";
  try {
    return new URL(value).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return String(value).replace(/^https?:\/\//i, "").split("/")[0]?.replace(/^www\./, "").toLowerCase() || "";
  }
}

function domainIsKnownEnterprise(value?: string) {
  const host = hostname(value);
  return knownEnterprise.some((d) => host === d || host.endsWith(`.${d}`));
}

function domainMatches(value: string | undefined, domains: string[]) {
  const host = hostname(value);
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

function textIncludes(text: string, terms: string[]) {
  const lower = (text || "").toLowerCase();
  return terms.some((t) => lower.includes(t));
}

function matchingTerms(text: string, terms: string[]) {
  const lower = (text || "").toLowerCase();
  return terms.filter((term) => lower.includes(term)).slice(0, 8);
}

export function classifySiteType(scanContext: {
  diagnostics: LiveDiagnosticsResult;
  website?: string;
}): SiteClassification {
  const diagnostics = scanContext.diagnostics;
  const text = [
    diagnostics.title,
    diagnostics.metaDescription,
    diagnostics.finalUrl,
    diagnostics.commerceFlowSignals.ctaLabels.join(" "),
    diagnostics.conversionSignals.ctaLabels.join(" "),
    diagnostics.storefrontSignals.mobileCtaLabels.join(" "),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const ecommerceProbability: EcommerceProbability =
    diagnostics.platformDetection?.ecommerceProbability ?? { probability: 0, label: "Unclear", evidence: [], negativeSignals: [] };

  const evidence: string[] = [];

  const hasCart = diagnostics.commerceFlowSignals.cartVisible;
  const hasCheckout = diagnostics.commerceFlowSignals.checkoutVisible;
  const hasCatalog = diagnostics.commerceFlowSignals.productCatalogVisible || diagnostics.storefrontSignals.productNavigationVisible || diagnostics.storefrontSignals.collectionLinksVisible;
  const hasForms = diagnostics.commerceFlowSignals.formVisible || diagnostics.storefrontSignals.leadCaptureVisible;
  const scannedUrl = diagnostics.finalUrl || scanContext.website;
  const groceryMatches = matchingTerms(text, groceryTerms);
  const isKnownGroceryDomain = domainMatches(scannedUrl, knownGroceryRetail);
  const isGroceryEnterpriseFlow =
    domainMatches(scannedUrl, groceryFlowEnterpriseDomains) &&
    (groceryMatches.length >= 3 || /\/(grocery|groceries|food|pickup-delivery|cp\/food|browse\/food)\b/i.test(scannedUrl || ""));
  const hasStrongGrocerySignals =
    isKnownGroceryDomain ||
    isGroceryEnterpriseFlow ||
    groceryMatches.length >= 4 ||
    (groceryMatches.length >= 2 && textIncludes(text, ["weekly ad", "store locator", "pickup", "delivery", "departments", "shop by aisle"]));

  // marketplace signals
  const marketplaceTerms = ["marketplace", "seller", "vendors", "sell on", "shops", "multi-vendor", "third-party sellers"];
  if (textIncludes(text, marketplaceTerms)) {
    evidence.push("Marketplace language or seller/vendor references detected.");
  }

  // B2B signals
  const b2bTerms = ["wholesale", "bulk", "distributor", "request a quote", "rfq", "procure", "part number", "sku", "commercial sales"];
  if (textIncludes(text, b2bTerms)) {
    evidence.push("B2B / wholesale or quote-request language detected.");
  }

  // education
  const educationTerms = ["course", "textbook", "learning", "student", "university", "class", "curriculum", "training"];
  if (textIncludes(text, educationTerms)) {
    evidence.push("Education or course language detected.");
  }

  // subscription
  const subscriptionTerms = ["subscribe", "membership", "plan", "recurring", "monthly", "subscription", "auto-renew", "refill", "box subscription"];
  if (textIncludes(text, subscriptionTerms)) {
    evidence.push("Subscription or membership language detected.");
  }

  // healthcare
  const healthcareTerms = ["medical", "pharmacy", "patient", "provider", "prescription", "clinic", "healthcare", "medical supplies"];
  if (textIncludes(text, healthcareTerms)) {
    evidence.push("Healthcare or medical product language detected.");
  }

  if (isKnownGroceryDomain || isGroceryEnterpriseFlow) {
    evidence.push("Known grocery or supermarket retail domain detected.");
  }

  if (groceryMatches.length > 0) {
    evidence.push(`Grocery retail signals detected: ${groceryMatches.join(", ")}.`);
  }

  // lead generation / services
  const serviceTerms = ["contact", "book", "schedule", "consultation", "appointment", "agency", "real estate", "services", "get a quote", "request a demo"];
  if (textIncludes(text, serviceTerms)) {
    evidence.push("Lead-generation or service-oriented language detected.");
  }

  // DTC brand heuristics: product/catalog + cart + platform hints (Shopify)
  const platformName = diagnostics.platformDetection?.platformName?.toLowerCase() || "";
  if (hasCatalog && (hasCart || hasCheckout) && (platformName.includes("shopify") || textIncludes(text, ["brand", "shop now", "add to cart", "buy now"]))) {
    evidence.push("Brand storefront signals: product/catalog + cart/checkout and brand/Shopify hints detected.");
  }

  // Known enterprise domain hints
  if (domainIsKnownEnterprise(scannedUrl)) {
    evidence.push("Known large retail domain detected.");
  }

  // Decide classification using rules and ecommerceProbability
  let siteType = "Unknown";
  let score = 50; // baseline

  // Use ecommerce probability as an important signal
  if (hasStrongGrocerySignals) {
    siteType = "Grocery / Supermarket Retail";
    score = isKnownGroceryDomain || isGroceryEnterpriseFlow ? 84 : 72;
  } else if (ecommerceProbability.label === "Low") {
    // prefer lead-generation or non-ecommerce
    if (hasForms || textIncludes(text, serviceTerms)) {
      siteType = "Lead Generation / Service Business";
      score = Math.max(30, 30 + ecommerceProbability.probability / 2);
    } else {
      siteType = "Non-Ecommerce / Unclear";
      score = Math.max(20, 20 + ecommerceProbability.probability / 2);
    }
  } else {
    // High or Moderate ecommerce probability
    if (evidence.some((e) => e.includes("Marketplace")) || textIncludes(text, marketplaceTerms)) {
      siteType = "Marketplace";
      score = 80;
    } else if (evidence.some((e) => e.includes("B2B")) || textIncludes(text, b2bTerms)) {
      siteType = "B2B Commerce";
      score = 74;
    } else if (evidence.some((e) => e.includes("Education")) || textIncludes(text, educationTerms)) {
      siteType = "Education Commerce";
      score = 72;
    } else if (evidence.some((e) => e.includes("Subscription")) || textIncludes(text, subscriptionTerms)) {
      siteType = "Subscription Commerce";
      score = 78;
    } else if (evidence.some((e) => e.includes("Healthcare")) || textIncludes(text, healthcareTerms)) {
      siteType = "Healthcare Commerce";
      score = 76;
    } else if ((hasCatalog || hasCart || hasCheckout) && (platformName.includes("shopify") || textIncludes(text, ["brand", "lifestyle", "shop now"]))) {
      siteType = "DTC Brand";
      score = 78;
    } else if (domainIsKnownEnterprise(scannedUrl)) {
      // enterprise domains default to Enterprise Retail unless marketplace language
      siteType = textIncludes(text, marketplaceTerms) ? "Marketplace" : "Enterprise Retail";
      score = 82;
    } else if (hasCatalog && !hasCart) {
      siteType = "B2B Commerce"; // conservative fallback for catalog-driven commerce
      score = 60;
    } else if (hasCatalog && hasCart) {
      siteType = "DTC Brand";
      score = 68;
    } else {
      // fallback
      siteType = ecommerceProbability.label === "High" ? "DTC Brand" : "Non-Ecommerce / Unclear";
      score = ecommerceProbability.probability;
    }
  }

  // Adjust score slightly based on evidence count
  const evidenceBonus = Math.min(20, evidence.length * 6);
  score = Math.max(0, Math.min(100, Math.round(score + evidenceBonus)));

  let confidenceLabel: SiteClassification["confidenceLabel"] = "Needs Review";
  if (score >= 75) confidenceLabel = "High";
  else if (score >= 55) confidenceLabel = "Moderate";
  else if (score >= 35) confidenceLabel = "Low";

  const explanation = `${siteType} determined from public-page signals. Confidence: ${confidenceLabel} (${score}%). Evidence: ${evidence.slice(0,4).join("; ") || diagnostics.platformDetection?.ecommerceProbability?.evidence?.slice(0,3).join("; ") || "No clear public signals."}`;

  return {
    siteType,
    confidenceScore: score,
    confidenceLabel,
    evidence: evidence.slice(0, 8),
    explanation,
  };
}

export default classifySiteType;
