import { NextRequest, NextResponse } from "next/server";
import { methodNotAllowedResponse } from "@/lib/form-submissions";
import {
  sanitizeEvidenceText,
  summarizeMobileCtaEvidence,
} from "@/lib/evidence-cleanup";
import {
  detectAssistantIntent,
  type AssistantIntentDetection,
} from "@/lib/assistant-knowledge";
import { logAssistantConversation } from "@/lib/assistant-conversation-log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AssistantRole = "user" | "assistant";

type ConversationMessage = {
  role: AssistantRole;
  content: string;
};

type PostScanAssistantRequest = {
  message?: unknown;
  conversationHistory?: unknown;
  scanContext?: unknown;
};

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type ExactAnswer = {
  matched: boolean;
  topic: string;
  directAnswer: string;
  evidence: string;
  businessMeaning: string;
  suggestedFollowUp: string;
  severity?: "Low" | "Medium" | "High";
  archetype?: string;
  followUpIntent?: string;
};

type ProjectSize = "Small" | "Medium" | "Large" | "Enterprise";

type ImplementationCostEstimate = {
  projectSize: ProjectSize;
  estimatedRange: string;
  estimatedEffort: string;
  reasoning: string[];
  confidence: string;
  assumptions: string[];
};

const assistantInstructions = `
You are Opzix Assistant, a calm ecommerce systems consultant reviewing a lightweight public scan.

Use only the provided scan context and the conversation history. If the scan context does not contain enough evidence, say that clearly and suggest a human audit or storefront walkthrough.

Start with the direct answer if the user asks about a specific item. Do not answer generally before answering the specific question.

You should:
- explain findings in plain English
- sound like an experienced ecommerce operator reviewing the scan live
- use short natural paragraphs, not diagnostic field dumps
- use scanContext.currentNarrativeArchetype as the dominant framing when it is present, especially for technical-risk, trust-deficit, discovery-breakdown, conversion-friction, and operational-clarity
- use scanContext.narrativeProfile when present; its narrativeMode, businessContext, concernPriority, and recommendedActionStyle should override generic ecommerce wording
- use scanContext.siteType and scanContext.siteTypeReason to avoid applying standard retail checkout assumptions to enterprise, catalog, lead-generation, education/content, or unclear pages
- use phrases like "What stands out to me is", "If I were reviewing this manually", and "The bigger concern is" when they fit naturally
- preserve priority and severity; high-priority and critical findings should still sound important without sounding alarmist
- connect findings to conversion, trust, tracking, operations, or the customer journey
- ask one helpful follow-up question when useful
- recommend booking a free audit only when it is a natural next step
- treat roadmap dollar ranges as directional planning estimates, not fixed prices or final proposals
- use "typical investment range", "consulting range", "improvement range", "planning range", or "directional estimate" instead of "cost" when discussing roadmap budget ranges

Avoid:
- robotic phrasing such as "The strongest technical finding is Technical"
- raw field-name dumps such as "console errors: 0; failed requests: 6"
- repeating metrics unless the number meaningfully changes the recommendation
- softening high-priority findings with phrases like "I would not panic" unless immediately followed by a clear priority statement

Guardrails:
- Do not claim you inspected private systems, admin panels, analytics accounts, checkout internals, or backend data.
- Do not guarantee revenue growth, conversion lift, or business outcomes.
- Do not invent findings not present in scanContext.
- Do not discuss cybersecurity testing.
- Do not ask for passwords, credentials, admin access, or API keys.
- Do not use manipulative sales pressure.

Return only valid JSON matching this shape:
{
  "reply": "string",
  "suggestedReplies": ["string"]
}
`;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s/-]/g, " ");
}

function hasAny(value: string, keywords: string[]) {
  const normalized = normalizeText(value);

  return keywords.some((keyword) => normalized.includes(keyword));
}

function platformName(platform: Record<string, unknown>) {
  return (
    asString(platform.platformName) ||
    asString(platform.name) ||
    "not confirmed"
  );
}

function ecommerceProbability(platform: Record<string, unknown>) {
  return asRecord(platform.ecommerceProbability);
}

function ecommerceProbabilityLabel(platform: Record<string, unknown>) {
  return asString(ecommerceProbability(platform).label);
}

function isLowEcommerceProbability(platform: Record<string, unknown>) {
  return (
    platformName(platform) === "Not an ecommerce storefront" ||
    ecommerceProbabilityLabel(platform) === "Low"
  );
}

function isUnclearEcommerceProbability(platform: Record<string, unknown>) {
  return (
    platformName(platform) === "Ecommerce probability unclear" ||
    ecommerceProbabilityLabel(platform) === "Unclear"
  );
}

function platformEvidenceSummary(
  platform: Record<string, unknown>,
  fallback: string,
) {
  const evidence = asArray(platform.evidence)
    .map((item) => asString(item))
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  return sanitizeEvidenceText(
    evidence ||
      asString(platform.explanation) ||
      asString(platform.recommendation) ||
      fallback,
    { maxLength: 340 },
  );
}

function platformDirectAnswer(
  platform: Record<string, unknown>,
  normalizedQuestion = "",
) {
  const name = platformName(platform);
  const asksMagento =
    normalizedQuestion.includes("why did it say magento") ||
    normalizedQuestion.includes("is this magento");

  if (asksMagento) {
    return "It should not call this Magento unless there are strong Magento-specific signals. If the current result did, the safer interpretation is platform not confidently identified or ecommerce probability low.";
  }

  if (isLowEcommerceProbability(platform)) {
    return "I would not classify this as an ecommerce storefront from the public scan. The page did not expose enough product, cart, checkout, or purchase-flow signals.";
  }

  if (isUnclearEcommerceProbability(platform)) {
    return "The page may support commerce elsewhere, but this URL does not expose enough public commerce signals to identify a platform confidently.";
  }

  if (name === "Platform not confidently identified") {
    return "I would not confidently identify a standard ecommerce platform from this public scan.";
  }

  if (name === "Enterprise / Custom Commerce Stack") {
    return "From the public scan, I would not confidently call this Magento, Shopify, BigCommerce, or WooCommerce. The safer interpretation is a custom or heavily abstracted enterprise commerce stack.";
  }

  return `The scan identifies ${name} as the likely platform.`;
}

function narrativeProfile(scanContext: Record<string, unknown>) {
  return asRecord(scanContext.narrativeProfile);
}

function narrativeMode(scanContext: Record<string, unknown>) {
  return asString(narrativeProfile(scanContext).narrativeMode);
}

function narrativeBusinessContext(scanContext: Record<string, unknown>) {
  return asString(narrativeProfile(scanContext).businessContext);
}

function narrativeRecommendedAction(scanContext: Record<string, unknown>) {
  return (
    asString(narrativeProfile(scanContext).recommendedActionStyle) ||
    asString(narrativeProfile(scanContext).recommendedFirstAction)
  );
}

function isGroceryNarrative(scanContext: Record<string, unknown>) {
  return (
    narrativeMode(scanContext) === "Grocery / Supermarket Retail" ||
    asString(scanContext.siteType).toLowerCase().includes("grocery")
  );
}

function groceryRetailAnswer() {
  return "This looks more like grocery / supermarket retail than a normal DTC brand. For this kind of site, I would prioritize search, departments, pickup/delivery clarity, weekly ad, and cart path before treating platform uncertainty as the main client-facing issue.";
}

const ecommerceGlossary: Record<
  string,
  {
    label: string;
    definition: string;
    whyItMatters: string;
  }
> = {
  cta: {
    label: "CTA",
    definition:
      "CTA means the primary call-to-action button or link a shopper sees when they are ready to act, such as Shop Now, Add to Cart, Contact Us, Book Now, or Learn More.",
    whyItMatters:
      "A clear CTA matters because shoppers often decide quickly on mobile, and one strong primary action helps move them toward the next step without distraction.",
  },
  mobileCta: {
    label: "Mobile CTA",
    definition:
      "Mobile CTA means the main call-to-action button or link a shopper sees on a mobile screen, such as Shop Now, Add to Cart, Book, Contact, or Learn More.",
    whyItMatters:
      "Mobile shoppers have less screen space and attention, so the primary mobile action should be obvious and outweigh competing links or buttons.",
  },
  productDiscovery: {
    label: "Product discovery",
    definition:
      "Product discovery means the signals and navigation that help shoppers find relevant products, such as search, category navigation, collection links, and visible product pathways.",
    whyItMatters:
      "Strong product discovery helps shoppers move from browsing to buying without feeling lost on the storefront.",
  },
  trustSignal: {
    label: "Trust signal",
    definition:
      "Trust signal means a visible reassurance cue such as reviews, shipping policies, payment trust badges, warranties, or customer support links.",
    whyItMatters:
      "Trust signals reduce shopper uncertainty and help more visitors feel comfortable moving forward with a purchase.",
  },
  conversionPath: {
    label: "Conversion path",
    definition:
      "Conversion path means the shopper journey from interest to action, including visible CTAs, product discovery, cart access, and checkout entry points.",
    whyItMatters:
      "A clear conversion path reduces friction and makes it more likely that visitors complete the purchase journey.",
  },
  trackingVisibility: {
    label: "Tracking visibility",
    definition:
      "Tracking visibility means whether public-page analytics and marketing tags are detectable, such as GA4, GTM, Meta Pixel, or other measurement tools.",
    whyItMatters:
      "Tracking visibility matters because it determines how confidently a business can interpret traffic, campaigns, and conversion performance.",
  },
  operationalVisibility: {
    label: "Operational visibility",
    definition:
      "Operational visibility means how obvious operational touchpoints are, such as contact/support links, order status, returns, and shipping information.",
    whyItMatters:
      "Operational visibility matters because it helps shoppers trust the store and supports post-purchase service, reducing doubt before checkout.",
  },
  checkoutContinuity: {
    label: "Checkout continuity",
    definition:
      "Checkout continuity means how clearly shoppers can move from cart to checkout and whether the purchase path stays connected from product selection through payment.",
    whyItMatters:
      "A smooth checkout continuity reduces abandonment and makes the buying journey easier to complete.",
  },
  attribution: {
    label: "Attribution",
    definition:
      "Attribution means knowing which marketing touchpoints or campaigns led a shopper to convert, usually through visible analytics or tag manager signals.",
    whyItMatters:
      "Attribution matters because it helps teams decide which channels are driving sales and where to invest marketing budget.",
  },
  attributionConfidence: {
    label: "Attribution confidence",
    definition:
      "Attribution confidence means how reliably a storefront can trace conversions to visible marketing and analytics signals.",
    whyItMatters:
      "Attribution confidence matters because low confidence can make it hard to tell which campaigns or channels are truly generating value.",
  },
  conversionFriction: {
    label: "Conversion friction",
    definition:
      "Conversion friction means anything in the shopping path that makes it harder for a visitor to understand what to do next and complete a purchase.",
    whyItMatters:
      "Conversion friction matters because even small hesitations can reduce the percentage of visitors who move from interest to action.",
  },
  operationalClarity: {
    label: "Operational clarity",
    definition:
      "Operational clarity means how clearly the storefront communicates order, support, returns, and shipping information to shoppers.",
    whyItMatters:
      "Operational clarity matters because purchase confidence and post-purchase experience depend on clear logistics and support cues.",
  },
  measurementConfidence: {
    label: "Measurement confidence",
    definition:
      "Measurement confidence means how much trust the business can place in the visible public analytics signals to understand traffic and conversions.",
    whyItMatters:
      "Measurement confidence matters because weak tracking visibility makes it harder to know whether optimizations are working or not.",
  },
};

function isDefinitionQuery(normalized: string) {
  const positiveTriggers = [
    "what is",
    "define",
    "what does",
    "meaning of",
    "means",
  ];
  const negativeTriggers = [
    "wrong",
    "issue",
    "problem",
    "fix",
    "improve",
    "where is",
    "when is",
  ];

  return (
    positiveTriggers.some((trigger) => normalized.includes(trigger)) &&
    !negativeTriggers.some((trigger) => normalized.includes(trigger))
  );
}

function isConceptExplanationQuery(normalized: string) {
  const conceptTriggers = [
    "what is",
    "what does",
    "why does",
    "why is",
    "why should i care",
    "explain",
    "meaning of",
  ];

  return conceptTriggers.some((trigger) => normalized.includes(trigger));
}

function findGlossaryTerm(normalized: string) {
  if (hasAny(normalized, ["mobile cta", "mobile call to action"])) {
    return "mobileCta";
  }

  if (hasAny(normalized, ["checkout continuity", "checkout path", "cart checkout", "cart/checkout"])) {
    return "checkoutContinuity";
  }

  if (hasAny(normalized, ["trust visibility", "trust signal visibility", "trust signals"])) {
    return "trustVisibility";
  }

  if (hasAny(normalized, ["attribution confidence", "marketing attribution confidence"]) ) {
    return "attributionConfidence";
  }

  if (hasAny(normalized, ["measurement confidence", "tracking confidence", "conversion measurement"])) {
    return "measurementConfidence";
  }

  if (hasAny(normalized, ["conversion friction", "checkout friction", "buying friction"])) {
    return "conversionFriction";
  }

  if (hasAny(normalized, ["operational clarity", "operations clarity", "operational visibility"])) {
    return "operationalClarity";
  }

  if (hasAny(normalized, ["operational visibility", "operations visibility", "operations continuity"])) {
    return "operationalVisibility";
  }

  if (hasAny(normalized, ["tracking visibility", "tracking visible", "analytics visibility"])) {
    return "trackingVisibility";
  }

  if (hasAny(normalized, ["conversion path", "purchase path"])) {
    return "conversionPath";
  }

  if (hasAny(normalized, ["trust signal", "trust signals"])) {
    return "trustSignal";
  }

  if (hasAny(normalized, ["product discovery", "product discover"])) {
    return "productDiscovery";
  }

  if (hasAny(normalized, ["attribution", "marketing attribution", "conversion attribution"])) {
    return "attribution";
  }

  if (hasAny(normalized, ["cta", "call to action"])) {
    return "cta";
  }

  return null;
}

function glossaryObservation(term: string, scanContext: Record<string, unknown>) {
  const exact = getNestedRecord(scanContext, "exactCommerceVisibility");
  const signal = getNestedRecord(scanContext, "commerceSignals");

  if (term === "mobileCta") {
    const mobileVisible = asBoolean(getExactVisibilityValue(scanContext, "mobileCtaVisibleAboveFold"));
    const mobileLabels = getExactArray(scanContext, "mobileCtaLabels");
    if (mobileVisible) {
      return `In this scan, a mobile CTA was visible above the fold${
        mobileLabels.length ? ` with labels like ${mobileLabels.join(", ")}` : ""
      }.`;
    }
    return "In this scan, a strong mobile CTA was not clearly visible above the fold.";
  }

  if (term === "cta") {
    const mobileVisible = asBoolean(getExactVisibilityValue(scanContext, "mobileCtaVisibleAboveFold"));
    const desktopVisible = asBoolean(getExactVisibilityValue(scanContext, "desktopCtaVisible"));
    const mobileLabels = getExactArray(scanContext, "mobileCtaLabels");
    const desktopLabels = getExactArray(scanContext, "ctaLabels");
    const visibleLabel = mobileVisible
      ? `mobile CTA was visible${mobileLabels.length ? ` with labels like ${mobileLabels.join(", ")}` : ""}`
      : desktopVisible
      ? `desktop CTA was visible${desktopLabels.length ? ` with labels like ${desktopLabels.join(", ")}` : ""}`
      : "a CTA was not clearly visible";

    return `In this scan, ${visibleLabel}.`;
  }

  if (term === "productDiscovery") {
    const navVisible = asBoolean(getExactVisibilityValue(scanContext, "productNavigationVisible"));
    const collectionVisible = asBoolean(getExactVisibilityValue(scanContext, "collectionLinksVisible"));
    const searchVisible = asBoolean(getExactVisibilityValue(scanContext, "searchVisible"));
    const pieces = [];

    if (navVisible) pieces.push("category navigation");
    if (collectionVisible) pieces.push("collection or product links");
    if (searchVisible) pieces.push("store search");

    if (pieces.length > 0) {
      return `In this scan, product discovery cues were visible through ${pieces.join(", ")}.`;
    }
    return "In this scan, product discovery cues were not clearly visible.";
  }

  if (term === "trustSignal") {
    const trustFindings = getCategoryFindings(scanContext, "trust");
    if (trustFindings.length > 0) {
      return `In this scan, trust-related evidence included ${findingTitle(trustFindings[0])}.`;
    }
    return "This scan did not highlight strong public trust signals.";
  }

  if (term === "trustVisibility") {
    const trustFindings = getCategoryFindings(scanContext, "trust");
    if (trustFindings.length > 0) {
      return `In this scan, the trust signals are most visible through ${findingTitle(trustFindings[0])}.`;
    }
    return "In this scan, public trust visibility was not a strong signal.";
  }

  if (term === "attributionConfidence") {
    const tools = getTrackingTools(scanContext);
    return tools.length
      ? `In this scan, attribution confidence is tied to visible tools like ${tools.join(", ")}.`
      : "In this scan, attribution confidence is limited by the lack of visible tracking tools.";
  }

  if (term === "measurementConfidence") {
    const tools = getTrackingTools(scanContext);
    return tools.length
      ? `In this scan, measurement confidence is tied to the tracking tools visible on the page.`
      : "In this scan, measurement confidence is low because public tracking visibility is limited.";
  }

  if (term === "conversionFriction") {
    const ctaVisible = asBoolean(getExactVisibilityValue(scanContext, "mobileCtaVisibleAboveFold"));
    return ctaVisible
      ? "In this scan, the friction is more likely about clarity than the absence of a CTA."
      : "In this scan, the friction could come from the mobile action being hard to find.";
  }

  if (term === "operationalClarity") {
    const contactVisible = asBoolean(getExactVisibilityValue(scanContext, "contactSupportVisible"));
    const orderReturnsVisible = asBoolean(getExactVisibilityValue(scanContext, "orderReturnsLanguageVisible"));
    return `In this scan, operational clarity is ${contactVisible || orderReturnsVisible ? "partially visible" : "not clearly visible"} through support and order information cues.`;
  }

  if (term === "trackingVisibility") {
    const tools = getTrackingTools(scanContext);
    return tools.length
      ? `In this scan, visible tracking tools included ${tools.join(", ")}.`
      : "In this scan, no supported public tracking tools were clearly visible.";
  }

  if (term === "operationalVisibility") {
    const contactVisible = asBoolean(getExactVisibilityValue(scanContext, "contactSupportVisible"));
    const orderReturnsVisible = asBoolean(getExactVisibilityValue(scanContext, "orderReturnsLanguageVisible"));
    return `In this scan, operational cues were ${
      contactVisible || orderReturnsVisible ? "partially visible" : "not clearly visible"
    } on the public page.`;
  }

  if (term === "checkoutContinuity") {
    const cartVisible = asBoolean(getExactVisibilityValue(scanContext, "cartVisible"));
    const checkoutVisible = asBoolean(getExactVisibilityValue(scanContext, "checkoutVisible"));
    return `In this scan, cart visibility was ${boolPhrase(cartVisible)} and checkout visibility was ${boolPhrase(checkoutVisible)}.`;
  }

  if (term === "attribution") {
    const tools = getTrackingTools(scanContext);
    return tools.length
      ? `In this scan, attribution signals were inferred from ${tools.join(", ")} on the public page.`
      : "In this scan, attribution signals were not clearly visible from public tracking evidence.";
  }

  return "";
}

function buildGlossaryExactAnswer(message: string, scanContext: Record<string, unknown>): ExactAnswer {
  const normalized = normalizeText(message);
  const term = findGlossaryTerm(normalized);

  if (
    !term ||
    !(isDefinitionQuery(normalized) || isConceptExplanationQuery(normalized))
  ) {
    return {
      matched: false,
      topic: "",
      directAnswer: "",
      evidence: "",
      businessMeaning: "",
      suggestedFollowUp: "",
    };
  }

  const glossary = ecommerceGlossary[term];
  const observation = glossaryObservation(term, scanContext);
  const scanContextNote = observation
    ? `In this scan, ${observation.replace(/^In this scan, /i, "")}`
    : "The scan did not include enough visible evidence for this concept.";

  return {
    matched: true,
    topic: term,
    directAnswer: `${glossary.definition} ${scanContextNote}`,
    evidence:
      observation || "The scan context did not include direct public-page evidence for this term.",
    businessMeaning:
      `${glossary.whyItMatters} ${observation ? "That means this is worth reviewing as part of the current storefront story." : "I would treat this as a follow-up point in a manual storefront walkthrough."}`,
    suggestedFollowUp:
      `Want me to connect ${glossary.label.toLowerCase()} with the current scan findings?`,
  };
}

function boolPhrase(value: boolean | null) {
  if (value === true) return "visible";
  if (value === false) return "not visible";
  return "not confirmed in the scan context";
}

function directBoolPrefix(value: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not clearly";
}

function getNestedRecord(source: Record<string, unknown>, key: string) {
  return asRecord(source[key]);
}

function getVisibilitySignal(scanContext: Record<string, unknown>, key: string) {
  return asRecord(getNestedRecord(scanContext, "commerceSignals")[key]);
}

function getExactVisibilityValue(scanContext: Record<string, unknown>, key: string) {
  const exactCommerce = getNestedRecord(scanContext, "exactCommerceVisibility");
  return asBoolean(exactCommerce[key]);
}

function getExactArray(scanContext: Record<string, unknown>, key: string) {
  const exactCommerce = getNestedRecord(scanContext, "exactCommerceVisibility");
  return asArray(exactCommerce[key]).filter(
    (item): item is string => typeof item === "string" && Boolean(item.trim()),
  );
}

function signalEvidence(signal: Record<string, unknown>, fallback: string) {
  return sanitizeEvidenceText(asString(signal.evidence) || fallback);
}

function signalMeaning(signal: Record<string, unknown>, fallback: string) {
  return asString(signal.businessMeaning) || fallback;
}

function consultantMeaning(value: string) {
  const clean = sanitizeEvidenceText(value, { maxLength: 220 });

  if (!clean) {
    return "This is a useful public-page clue, but I would validate it in a manual storefront walkthrough before treating it as final.";
  }

  if (/^(this usually matters|the bigger concern|i would|this is not|this does not|that does not)/i.test(clean)) {
    return clean;
  }

  return `This usually matters because ${clean.charAt(0).toLowerCase()}${clean.slice(1)}`;
}

function currentArchetype(scanContext: Record<string, unknown>) {
  return asString(scanContext.currentNarrativeArchetype);
}

function storefrontIdentityProfileFrame(scanContext: Record<string, unknown>) {
  const profile = asRecord(scanContext.storefrontIdentityProfile);
  if (!profile || Object.keys(profile).length === 0) {
    return "";
  }

  const pattern = asString(profile.operationalPattern);

  if (pattern === "enterprise-retail") {
    return "This appears to be an enterprise retail-style storefront, so platform reliability, trust continuity, and checkout clarity should be considered together.";
  }

  if (pattern === "catalog-commerce") {
    return "This looks like a catalog-driven commerce storefront, so product discovery, category flow, and purchase path clarity should be prioritized.";
  }

  if (pattern === "brand-commerce") {
    return "This looks like a brand-focused commerce storefront, so marketing signal quality and shopper path clarity should be balanced.";
  }

  if (pattern === "education-commerce") {
    return "This reads like an education or training commerce storefront, so lead capture and discovery should be reviewed with extra care.";
  }

  if (pattern === "lead-capture") {
    return "This feels like a lead-capture or service commerce storefront, so form flows and support handoff should be reviewed alongside purchase intent.";
  }

  return "";
}

function archetypeFrame(scanContext: Record<string, unknown>) {
  const archetype = currentArchetype(scanContext);
  const profileFrame = storefrontIdentityProfileFrame(scanContext);

  if (archetype === "technical-risk") {
    return [
      "That matches the report's technical-risk framing, so platform confidence, storefront stability, script execution, and measurement confidence should stay central.",
      profileFrame,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (archetype === "trust-deficit") {
    return [
      "That matches the report's trust-deficit framing, so reassurance, purchase confidence, and buying comfort should stay central.",
      profileFrame,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (archetype === "discovery-breakdown") {
    return [
      "That matches the report's discovery-breakdown framing, so product intent, navigation clarity, search visibility, and category flow should stay central.",
      profileFrame,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (archetype === "conversion-friction" || archetype === "mobile-clarity-risk" || archetype === "checkout-continuity-risk") {
    return [
      "That matches the report's conversion-friction framing, so action path, CTA hierarchy, checkout readiness, and purchase momentum should stay central.",
      profileFrame,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (archetype === "operational-clarity") {
    return [
      "That matches the report's operational-clarity framing, so order communication, support handoff, returns clarity, and fulfillment expectations should stay central.",
      profileFrame,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (archetype === "measurement-confidence-gap") {
    return [
      "That matches the report's measurement-confidence framing, so tracking visibility, attribution evidence, and signal trust should stay central.",
      profileFrame,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return profileFrame;
}
function formatExactAnswer(answer: ExactAnswer) {
  if (
    answer.topic === "cost_estimate" ||
    answer.topic === "new_store_cost" ||
    answer.topic === "roi" ||
    answer.topic === "score_reasoning" ||
    answer.topic === "opzix_recommendation"
  ) {
    return [
      answer.directAnswer,
      answer.evidence,
      answer.businessMeaning,
      answer.suggestedFollowUp,
    ]
      .map((part) => sanitizeEvidenceText(part, { maxLength: 900 }))
      .filter(Boolean)
      .join("\n\n");
  }

  return buildConsultantResponse(answer);
}

function flattenFindings(value: unknown) {
  const findings: Record<string, unknown>[] = [];

  asArray(value).forEach((item) => {
    const record = asRecord(item);
    if (Object.keys(record).length > 0) {
      findings.push(record);
    }
  });

  return findings;
}

function getCategoryFindings(
  scanContext: Record<string, unknown>,
  topic: string,
) {
  return flattenFindings(getNestedRecord(scanContext, "categoryFindings")[topic]);
}

function findingTitle(finding: Record<string, unknown>) {
  return asString(finding.title) || "Unnamed finding";
}

function findingEvidence(finding: Record<string, unknown>) {
  return sanitizeEvidenceText(
    asString(finding.evidenceSummary) ||
    asString(finding.explanation) ||
      "The scan context included this as a finding.",
  );
}

function priorityTone(value: unknown) {
  const normalized = String(value ?? "").toLowerCase();

  if (normalized.includes("critical")) {
    return {
      label: "Critical",
      phrase: "needs immediate review",
      sentence:
        "This does not prove everything is failing, but it does need immediate review before more traffic or operational changes are pushed through the journey.",
    };
  }

  if (normalized.includes("high")) {
    return {
      label: "High Priority",
      phrase: "should be prioritized",
      sentence:
        "This is not proof the store is broken, but I would still treat it as a high-priority review item before pushing more traffic or making platform-specific decisions.",
    };
  }

  if (normalized.includes("medium") || normalized.includes("needs review")) {
    return {
      label: "Medium",
      phrase: "is worth reviewing",
      sentence:
        "This is worth reviewing because it can still affect confidence in the customer journey, even if it is not the most urgent item.",
    };
  }

  return {
    label: "Low",
    phrase: "is lower-priority polish",
    sentence:
      "I would treat this as lower-priority polish unless it shows up again during a manual storefront walkthrough.",
  };
}

function topicCategoryKeys(topic: string) {
  const keys: Record<string, string[]> = {
    ux: ["ux", "uxui", "uxuiissues", "ux/ui"],
    conversion: ["conversion", "conversionissues"],
    trust: ["trust", "trustsignals"],
    tracking: ["tracking", "trackingissues"],
    operations: ["operations", "operationsissues"],
    technical: ["technical", "technicalissues"],
    platform: ["platform", "platformvisibility", "technicalissues"],
  };

  return keys[topic] ?? [topic];
}

function categoryPriorityForTopic(
  scanContext: Record<string, unknown>,
  topic: string,
) {
  const category = asArray(scanContext.categoryScores)
    .map(asRecord)
    .find((item) => {
      const haystack = [
        asString(item.key),
        asString(item.label),
        asString(item.status),
        asString(item.statusDetail),
      ]
        .join(" ")
        .toLowerCase()
        .replace(/[^a-z0-9/]+/g, "");

      return topicCategoryKeys(topic).some((key) =>
        haystack.includes(key.replace(/[^a-z0-9/]+/g, "")),
      );
    });

  return (
    asString(category?.priority) ||
    asString(category?.status) ||
    asString(category?.statusDetail)
  );
}

function findingPriorityTone(
  finding: Record<string, unknown> | undefined,
  scanContext: Record<string, unknown>,
  topic: string,
) {
  return priorityTone(
    asString(finding?.severity) ||
      asString(finding?.priority) ||
      categoryPriorityForTopic(scanContext, topic),
  );
}

function getFirstFindingByKeywords(
  findings: Record<string, unknown>[],
  keywords: string[],
) {
  return (
    findings.find((finding) =>
      hasAny(
        [
          findingTitle(finding),
          asString(finding.categoryLabel),
          asString(finding.evidenceSummary),
          asString(finding.explanation),
          asString(finding.recommendedFirstAction),
        ].join(" "),
        keywords,
      ),
    ) ?? findings[0]
  );
}

const visualUxFindingKeywords = [
  "visual layout",
  "layout alignment",
  "content-to-product",
  "content to product",
  "desktop whitespace",
  "grid-to-content",
  "grid to content",
  "product discovery pushed below",
  "mobile content hierarchy",
  "excessive whitespace",
  "layout imbalance",
  "floating widget",
  "product grid consistency",
  "horizontal layout overflow",
  "alignment needs review",
  "visually disconnected",
  "desktop layout alignment",
  "desktop layout",
  "catalog discovery friction",
  "part lookup",
  "product specification",
  "navigation density",
  "marketplace complexity",
  "promotional competition",
];

const navigationFindingKeywords = [
  "product discovery",
  "navigation",
  "category",
  "collection",
  "store search",
  "search visibility",
];

function findingHaystack(finding: Record<string, unknown>) {
  return [
    findingTitle(finding),
    asString(finding.category),
    asString(finding.categoryLabel),
    asString(finding.primaryCategory),
    asString(finding.evidenceSummary),
    asString(finding.explanation),
    asString(finding.businessImpact),
    asString(finding.recommendedFirstAction),
  ]
    .join(" ")
    .toLowerCase();
}

function isVisualUxFinding(finding: Record<string, unknown>) {
  const haystack = findingHaystack(finding);

  return visualUxFindingKeywords.some((keyword) => haystack.includes(keyword));
}

function getVisualUxFindings(scanContext: Record<string, unknown>) {
  const visualUxDiagnostics = asRecord(
    getNestedRecord(scanContext, "visualUxDiagnostics"),
  );
  const fromDiagnostics = asArray(visualUxDiagnostics.findings)
    .map(asRecord)
    .filter((finding) => Object.keys(finding).length > 0);

  if (fromDiagnostics.length > 0) {
    return fromDiagnostics;
  }

  return getCategoryFindings(scanContext, "ux").filter(isVisualUxFinding);
}

function getNavigationFindings(scanContext: Record<string, unknown>) {
  return getCategoryFindings(scanContext, "ux").filter((finding) =>
    navigationFindingKeywords.some((keyword) =>
      findingHaystack(finding).includes(keyword),
    ),
  );
}

function visualUxMetricPhrase(scanContext: Record<string, unknown>) {
  const visualUxDiagnostics = asRecord(getNestedRecord(scanContext, "visualUxDiagnostics"));
  const visualMetricsAvailable = visualUxDiagnostics.visualMetricsAvailable !== false;

  if (!visualMetricsAvailable || visualUxDiagnostics.score === null) {
    return "The visual engine was unavailable for this scan, so visual UX should be treated as unavailable rather than perfect.";
  }

  const metrics = asRecord(visualUxDiagnostics.metrics);
  const archetype = asString(visualUxDiagnostics.uxArchetype);
  const gapPx = Number(metrics.desktopGapPx);
  const gapPercent = Number(metrics.desktopGapPercent);
  const ratio = Number(metrics.contentToProductRatio);
  const parts = [];

  if (archetype) {
    parts.push(`This is being interpreted as ${archetype}.`);
  }

  if (Number.isFinite(gapPx) && Number.isFinite(gapPercent)) {
    const threshold =
      gapPx >= 300 || gapPercent >= 20
        ? "That crosses the high-priority desktop separation threshold."
        : gapPx >= 160 || gapPercent >= 12
          ? "That crosses the needs-review desktop separation threshold."
          : "That stays below the layout-separation threshold.";
    parts.push(
      `The measured desktop gap is about ${Math.round(gapPx)}px, or ${gapPercent.toFixed(1)}% of the viewport. ${threshold}`,
    );
  }

  if (Number.isFinite(ratio)) {
    const ratioThreshold =
      ratio >= 1.3
        ? "That crosses the high-priority content/product balance threshold."
        : ratio >= 1.2
          ? "That crosses the needs-review content/product balance threshold."
          : "That is within the healthy content/product balance range.";
    parts.push(`The content/product ratio is ${ratio.toFixed(2)}. ${ratioThreshold}`);
  }

  return parts.join(" ");
}

function visualUxDirectAnswer(
  finding: Record<string, unknown>,
  scorePhrase = "",
  metricPhrase = "",
) {
  const title = findingTitle(finding);
  const action = asString(finding.recommendedFirstAction);

  return sanitizeEvidenceText(
    [
      `The biggest visual UX issue is ${title}.`,
      metricPhrase,
      scorePhrase,
      action ? `First fix: ${action}` : "",
    ]
      .filter(Boolean)
      .join(" "),
    { maxLength: 520 },
  );
}

function visualUxBusinessMeaning(finding: Record<string, unknown>) {
  return (
    asString(finding.businessImpact) ||
    asString(finding.explanation) ||
    "Layout, spacing, hierarchy, and product placement affect what visitors see first and how quickly they understand where to browse or act."
  );
}

function getVisualFirstPriorityFinding(scanContext: Record<string, unknown>) {
  const visual = getVisualUxFindings(scanContext)[0];
  if (visual) {
    return { finding: visual, source: "visual" as const };
  }

  const conversion = getCategoryFindings(scanContext, "conversion")[0];
  if (conversion) {
    return { finding: conversion, source: "conversion" as const };
  }

  const navigation = getNavigationFindings(scanContext)[0];
  if (navigation) {
    return { finding: navigation, source: "navigation" as const };
  }

  const technical = getCategoryFindings(scanContext, "technical")[0];
  if (technical) {
    return { finding: technical, source: "technical" as const };
  }

  return null;
}

function buildFindingsAnswer(
  scanContext: Record<string, unknown>,
  topic: string,
  label: string,
): ExactAnswer | null {
  const findings =
    topic === "ux"
      ? [
          ...getVisualUxFindings(scanContext),
          ...getCategoryFindings(scanContext, "conversion"),
          ...getNavigationFindings(scanContext),
          ...getCategoryFindings(scanContext, "technical"),
        ]
      : getCategoryFindings(scanContext, topic);

  if (findings.length === 0) {
    return null;
  }

  const topFinding = findings[0];
  const titles = findings.slice(0, 3).map(findingTitle).join(", ");
  const priority = findingPriorityTone(topFinding, scanContext, topic);

  return {
    matched: true,
    topic,
    directAnswer: `What stands out to me in ${label} is ${findingTitle(
      topFinding,
    )}. The scan found ${findings.length} relevant finding${
      findings.length === 1 ? "" : "s"
    } in this area, and this ${priority.phrase}.`,
    evidence: `${findingEvidence(topFinding)} Related ${label} findings to keep nearby: ${titles}.`,
    businessMeaning:
      `${archetypeFrame(scanContext)} ${priority.sentence} ${
        asString(topFinding.explanation) ||
        "This area can influence how clearly shoppers understand the journey and move toward purchase."
      }`,
    suggestedFollowUp:
      topic === "ux"
        ? "Do you want me to compare the UX findings with conversion?"
        : "Do you want me to show what Opzix would fix first?",
  };
}

function buildVisualUxAnswer(scanContext: Record<string, unknown>): ExactAnswer | null {
  const visualUxDiagnostics = asRecord(getNestedRecord(scanContext, "visualUxDiagnostics"));
  const findings = getVisualUxFindings(scanContext);
  const topFinding = findings[0];
  const visualMetricsAvailable = visualUxDiagnostics.visualMetricsAvailable !== false;
  const visualScore = Number(visualUxDiagnostics.score);
  const scorePhrase = Number.isFinite(visualScore)
    ? `The visual UX score is ${visualScore}/100.`
    : "";

  if (!visualMetricsAvailable || visualUxDiagnostics.score === null) {
    const reason =
      asString(visualUxDiagnostics.unavailableReason) ||
      "Visual metrics could not be calculated from the page.";

    return {
      matched: true,
      topic: "visual_ux",
      directAnswer:
        "It should not be 100. The visual engine was unavailable for this scan. The score should be treated as unavailable rather than perfect.",
      evidence: `${reason} ${asString(visualUxDiagnostics.summary)}`.trim(),
      businessMeaning:
        "Visual UX should not add a positive or negative scoring signal when the underlying visual metrics are missing.",
      suggestedFollowUp:
        "Do you want me to explain which non-visual signals drove the score instead?",
    };
  }

  if (!topFinding) {
    return null;
  }

  return {
    matched: true,
    topic: "visual_ux",
    directAnswer: visualUxDirectAnswer(
      topFinding,
      scorePhrase,
      visualUxMetricPhrase(scanContext),
    ),
    evidence: [
      findingEvidence(topFinding),
      asString(visualUxDiagnostics.summary),
    ]
      .filter(Boolean)
      .join(" "),
    businessMeaning:
      visualUxBusinessMeaning(topFinding),
    suggestedFollowUp:
      "Do you want me to compare this with conversion or product discovery?",
  };
}

function getUxUiCategoryScore(scanContext: Record<string, unknown>) {
  return asArray(scanContext.categoryScores)
    .map(asRecord)
    .find((category) => {
      const haystack = [asString(category.key), asString(category.label)]
        .join(" ")
        .toLowerCase();

      return haystack.includes("ux") || haystack.includes("ui");
    });
}

function buildScoreSynchronizationAnswer(
  scanContext: Record<string, unknown>,
): ExactAnswer {
  const visualUxDiagnostics = asRecord(getNestedRecord(scanContext, "visualUxDiagnostics"));
  const visualScore = Number(visualUxDiagnostics.score);
  const visualUnavailable =
    visualUxDiagnostics.visualMetricsAvailable === false ||
    visualUxDiagnostics.score === null ||
    !Number.isFinite(visualScore);
  const uxUiCategory = getUxUiCategoryScore(scanContext);
  const uxScore = Number(uxUiCategory?.score);

  if (visualUnavailable) {
    return {
      matched: true,
      topic: "visual_ux",
      directAnswer:
        "UX/UI should be evidence unknown or low confidence when visual metrics fail, not a confident numeric score.",
      evidence:
        "Visual metrics were unavailable for this scan, so UX/UI should not create a strong positive or negative impact on the overall score.",
      businessMeaning:
        "The corrected report should show UX/UI as Evidence Unknown with the main driver: Visual metrics unavailable, so UX/UI was not fully scored.",
      suggestedFollowUp:
        "Do you want me to show which non-visual signals still influenced the overall score?",
    };
  }

  if (
    visualScore >= 80 &&
    Number.isFinite(uxScore) &&
    uxScore < 70 &&
    uxUiCategory?.scoreUnavailable !== true
  ) {
    return {
      matched: true,
      topic: "visual_ux",
      directAnswer:
        `That is a score mismatch: Visual UX is ${visualScore}/100, but UX/UI is ${uxScore}/100.`,
      evidence:
        "UX/UI should not fall that far below a strong Visual UX score unless there is a clearly severe customer-facing UX reducer.",
      businessMeaning:
        "The score should be corrected by making UX/UI derive from Visual UX plus product discovery, navigation clarity, mobile hierarchy, and confidence.",
      suggestedFollowUp:
        "Do you want me to identify whether any severe UX reducer justifies the gap?",
    };
  }

  return {
    matched: true,
    topic: "visual_ux",
    directAnswer:
      "Visual UX Review and UX/UI should be synchronized through the same evidence state.",
    evidence:
      "If visual metrics are available, UX/UI should reflect that score plus product discovery, navigation clarity, mobile hierarchy, and confidence. If visual metrics are unavailable, UX/UI should be Evidence Unknown or a clearly marked low-confidence fallback.",
    businessMeaning:
      "This keeps the report from treating missing scanner evidence as either a perfect score or a confirmed weakness.",
    suggestedFollowUp:
      "Do you want me to compare Visual UX and UX/UI on this scan?",
  };
}

function getTrackingTools(scanContext: Record<string, unknown>) {
  const fromRaw = asArray(
    getNestedRecord(scanContext, "rawDiagnostics").technologyDetections,
  )
    .map(asRecord)
    .filter((tool) => tool.detected === true)
    .map((tool) => asString(tool.label))
    .filter(Boolean);

  if (fromRaw.length > 0) {
    return fromRaw;
  }

  const trackingVisibility = asString(scanContext.trackingVisibility);
  const labels = trackingVisibility.match(/: (.+)\.?$/)?.[1];

  return labels ? labels.split(",").map((item) => item.trim()) : [];
}

function getPrimaryConcern(scanContext: Record<string, unknown>) {
  return asRecord(scanContext.primaryOperationalConcern);
}

function getActionItems(scanContext: Record<string, unknown>) {
  const direct = asArray(scanContext.whatToReviewFirst).map(asRecord);

  if (direct.length > 0) {
    return direct;
  }

  return asArray(scanContext.recommendedNextSteps).map(asRecord);
}

function technicalSignalsSummary(scanContext: Record<string, unknown>) {
  const rawDiagnostics = getNestedRecord(scanContext, "rawDiagnostics");
  const platform =
    asString(asRecord(rawDiagnostics.platformDetection).name) ||
    asString(asRecord(scanContext.platform).name);
  const confidenceLabel =
    asString(asRecord(rawDiagnostics.platformDetection).confidenceLabel) ||
    asString(asRecord(scanContext.platform).confidenceLabel);
  const confidence =
    asRecord(rawDiagnostics.platformDetection).confidence ??
    asRecord(scanContext.platform).confidence;
  const failedCount = asArray(rawDiagnostics.failedRequests).length;
  const consoleCount = asArray(rawDiagnostics.consoleErrors).length;
  const warningCount = asArray(rawDiagnostics.warnings).length;
  const signals: string[] = [];

  if (
    typeof confidence === "number" &&
    (confidence < 70 || /low|needs review/i.test(confidenceLabel))
  ) {
    signals.push(
      `the storefront platform is not being identified with full confidence`,
    );
  } else if (platform && platform !== "Unknown") {
    signals.push(`${platform} is the likely storefront platform`);
  }

  if (failedCount > 0) {
    signals.push(
      `the scan found ${failedCount === 1 ? "one failed frontend request" : "a few failed frontend requests"}`,
    );
  }

  if (consoleCount > 0) {
    signals.push(
      `${consoleCount === 1 ? "one console error was" : "some console errors were"} visible during the page load`,
    );
  } else if (warningCount > 0) {
    signals.push("there were frontend warnings worth checking in context");
  }

  if (signals.length === 0) {
    return "the public technical signals look relatively quiet in this lightweight scan";
  }

  return signals.join(", ");
}

function classifyTechnicalSeverity(scanContext: Record<string, unknown>): "Low" | "Medium" | "High" {
  const rawDiagnostics = getNestedRecord(scanContext, "rawDiagnostics");
  const failedCount = asArray(rawDiagnostics.failedRequests).length;
  const consoleCount = asArray(rawDiagnostics.consoleErrors).length;
  const warningCount = asArray(rawDiagnostics.warnings).length;

  if (failedCount > 0 || consoleCount > 2) {
    return "High";
  }

  if (consoleCount > 0 || warningCount > 0) {
    return "Medium";
  }

  return "Low";
}

function buildConsultantResponse(answer: ExactAnswer) {
  const parts: string[] = [];
  const direct = sanitizeEvidenceText(answer.directAnswer, { maxLength: 420 });
  if (direct) {
    parts.push(direct);
  }

  if (answer.severity) {
    parts.push(
      answer.severity === "High"
        ? "This is a high-priority technical concern that should be understood before moving to optimization recommendations."
        : answer.severity === "Medium"
          ? "This is a medium-priority signal worth checking before you assume the issue is only about customer experience."
          : "This is a low-priority technical detail that still helps explain the scan context."
    );
  }

  if (answer.evidence) {
    parts.push(
      `What I see in the scan: ${sanitizeEvidenceText(answer.evidence, { maxLength: 420 })}`,
    );
  }

  if (answer.businessMeaning) {
    parts.push(consultantMeaning(answer.businessMeaning));
  }

  if (answer.suggestedFollowUp) {
    const followUp = answer.suggestedFollowUp.trim();
    if (followUp.endsWith("?")) {
      parts.push(sanitizeEvidenceText(followUp, { maxLength: 200 }));
    } else {
      parts.push(
        `If I were reviewing this manually, I’d look at ${sanitizeEvidenceText(
          followUp,
          { maxLength: 200 },
        )}`,
      );
    }
  }

  return parts.filter(Boolean).join("\n\n");
}

function technicalSeverityPhrase(scanContext: Record<string, unknown>) {
  const rawDiagnostics = getNestedRecord(scanContext, "rawDiagnostics");
  const failedCount = asArray(rawDiagnostics.failedRequests).length;
  const consoleCount = asArray(rawDiagnostics.consoleErrors).length;
  const warningCount = asArray(rawDiagnostics.warnings).length;

  if (failedCount > 0 && consoleCount > 0) {
    return "meaningful operational instability";
  }

  if (failedCount > 0 || consoleCount > 0) {
    return "moderate technical friction";
  }

  if (warningCount > 0) {
    return "some frontend noise worth checking";
  }

  return "relatively quiet surface-level signals";
}

function technicalExactAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const summary = technicalSignalsSummary(scanContext);
  const technicalFindings = getCategoryFindings(scanContext, "technical");
  const finding = getFirstFindingByKeywords(technicalFindings, [
    "technical",
    "platform",
    "failed",
    "request",
    "console",
    "metadata",
  ]);
  const priority = findingPriorityTone(finding, scanContext, "technical");
  const title = finding ? findingTitle(finding) : "technical reliability";

  return {
    matched: true,
    topic: "technical",
    directAnswer: `The main technical concern is ${title}. In this scan, the evidence points to ${technicalSeverityPhrase(scanContext)} and ${summary}.`,
    evidence: finding
      ? findingEvidence(finding)
      : "The scan only uses public storefront signals, so I would verify these in a browser and platform-aware walkthrough.",
    businessMeaning:
      `${archetypeFrame(scanContext)} ${priority.sentence} This is worth prioritizing because technical uncertainty can affect how confidently the team interprets checkout, tracking, and storefront-structure recommendations.`,
    suggestedFollowUp:
      "Do you want me to compare the technical signals with tracking visibility?",
    severity: classifyTechnicalSeverity(scanContext),
    archetype: "technical-risk",
  };
}

function ctaExactAnswer(
  message: string,
  scanContext: Record<string, unknown>,
): ExactAnswer {
  const exact = getNestedRecord(scanContext, "exactCommerceVisibility");
  const mobileVisible = asBoolean(exact.mobileCtaVisibleAboveFold);
  const mobileLabels = getExactArray(scanContext, "mobileCtaLabels");
  const ctaLabels = getExactArray(scanContext, "ctaLabels");
  const conversionFindings = getCategoryFindings(scanContext, "conversion");
  const uxFindings = getCategoryFindings(scanContext, "ux");
  const ctaFinding =
    getFirstFindingByKeywords(conversionFindings, [
      "cta",
      "primary action",
      "button",
      "conversion",
    ]) ??
    getFirstFindingByKeywords(uxFindings, ["cta", "primary action", "button"]);
  const evidence = summarizeMobileCtaEvidence({
    mobileVisible,
    mobileLabels,
    desktopLabels: ctaLabels,
    findingEvidence: ctaFinding ? findingEvidence(ctaFinding) : undefined,
  });
  const actionText = ctaFinding
    ? asString(ctaFinding.recommendedFirstAction)
    : asString(getActionItems(scanContext)[0]?.action);
  const priority = findingPriorityTone(
    ctaFinding,
    scanContext,
    ctaFinding ? "conversion" : "ux",
  );

  return {
    matched: true,
    topic: "mobile_cta",
    directAnswer: `What stands out to me is that the mobile CTA is ${boolPhrase(
      mobileVisible,
    )}, but the action path may still need a clearer hierarchy.`,
    evidence,
    businessMeaning:
      `${archetypeFrame(scanContext)} ${priority.sentence} Shoppers can see an action, but the bigger concern is whether the primary next step is obvious enough on a small screen.`,
    suggestedFollowUp: actionText
      ? `Do you want me to walk through the first action: ${sanitizeEvidenceText(actionText, { maxLength: 120 })}?`
      : "Do you want me to compare the CTA issue with the conversion findings?",
  };
}

function buildAssistantResponseContext(
  scanContext: Record<string, unknown>,
  intent: AssistantIntentDetection["intent"],
) {
  const scoreNarrative = asRecord(scanContext.scoreNarrative);
  const scoreChangeContext = asRecord(scoreNarrative.scoreChangeContext);
  const benchmark = asRecord(scanContext.benchmarkContext);
  const platform = asRecord(scanContext.platform);
  const reviewContext = asRecord(scanContext.storefrontReviewContext);
  const siteType =
    asString(scanContext.siteType) ||
    asString(reviewContext.siteType) ||
    asString(scanContext.currentNarrativeArchetype);
  const benchmarkGroup =
    asString(benchmark.benchmarkGroup) ||
    asString(scoreNarrative.benchmarkGroup) ||
    asString(scanContext.benchmarkGroup);
  const benchmarkLabel =
    asString(benchmark.benchmarkLabel) ||
    asString(scoreNarrative.benchmarkLabel) ||
    asString(scanContext.benchmarkLabel);
  const platformName =
    platformNameFromContext(platform) ||
    asString(platform.platformName) ||
    asString(platform.name) ||
    asString(scanContext.platformName);
  const primary = getPrimaryConcern(scanContext);
  const strongestReducers = asArray(scoreNarrative.strongestReducers)
    .map((item) => asString(item))
    .filter(Boolean);
  const strongestPositives = asArray(scoreNarrative.strongestPositives)
    .map((item) => asString(item))
    .filter(Boolean);
  const score =
    typeof scoreNarrative.overallScore === "number"
      ? scoreNarrative.overallScore
      : typeof scanContext.score === "number"
        ? scanContext.score
        : typeof scanContext.overallScore === "number"
          ? scanContext.overallScore
          : null;

  return {
    intent,
    siteType,
    benchmarkGroup,
    benchmarkLabel,
    score,
    confidence:
      asString(scoreNarrative.confidence) ||
      asString(scanContext.scoringConfidence),
    platformName,
    platformConfidence:
      asString(platform.confidenceLabel) ||
      asString(platform.platformConfidenceLabel) ||
      asString(scanContext.platformConfidenceLabel),
    primaryConcernTitle:
      asString(primary.title) ||
      asString(primary.riskLabel) ||
      strongestReducers[0],
    strongestReducers,
    strongestPositives,
    scoreExplanation: asString(scoreNarrative.explanation),
    scoreChangeExplanation: asString(scoreChangeContext.explanation),
    historicalScoreRange:
      typeof scoreChangeContext.minScore === "number" &&
      typeof scoreChangeContext.maxScore === "number"
        ? `${scoreChangeContext.minScore}-${scoreChangeContext.maxScore}`
        : "",
    isEnterpriseRetail:
      /enterprise|marketplace|custom-enterprise/i.test(
        `${siteType} ${benchmarkGroup} ${benchmarkLabel}`,
      ),
    isB2b:
      /b2b|industrial|distributor|procurement|quote|catalog/i.test(
        `${siteType} ${benchmarkGroup} ${benchmarkLabel}`,
      ) &&
      !/enterprise retail|marketplace/i.test(`${benchmarkGroup} ${benchmarkLabel}`),
  };
}

function platformNameFromContext(platform: Record<string, unknown>) {
  return (
    asString(platform.name) ||
    asString(platform.platformName) ||
    asString(platform.detectedPlatform)
  );
}

function positiveSignalAnswer(
  scanContext: Record<string, unknown>,
  message = "",
): ExactAnswer {
  const responseContext = buildAssistantResponseContext(
    scanContext,
    "score_explanation",
  );
  const explanation = asRecord(scanContext.scoreExplanation);
  const snapshot = asRecord(scanContext.scoreExplanationSnapshot);
  const narrative = asRecord(scanContext.scoreNarrative);
  const scoreChangeContext = asRecord(narrative.scoreChangeContext);
  const scoringConfidence =
    asString(narrative.confidence) ||
    asString(snapshot.scoringConfidence) ||
    asString(scanContext.scoringConfidence) ||
    asString(explanation.scoringConfidence);
  const confidenceNote =
    asString(narrative.confidenceExplanation) ||
    asString(snapshot.scoringConfidenceNote) ||
    asString(scanContext.scoringConfidenceNote) ||
    asString(explanation.confidenceNote);
  const positives = (
    asArray(narrative.strongestPositives).length
      ? asArray(narrative.strongestPositives)
      : asArray(snapshot.positiveSignals).length
        ? asArray(snapshot.positiveSignals)
      : asArray(explanation.positiveSignals)
  )
    .map((signal) => asString(signal))
    .filter(Boolean);
  const penalties = (
    asArray(narrative.strongestReducers).length
      ? asArray(narrative.strongestReducers)
      : asArray(snapshot.scoreReducers).length
        ? asArray(snapshot.scoreReducers)
      : asArray(explanation.majorPenalties)
  )
    .map((penalty) => asString(penalty))
    .filter(Boolean);
  const why = asString(narrative.explanation) || asString(explanation.whyThisScore);
  const snapshotScore =
    typeof narrative.overallScore === "number"
      ? narrative.overallScore
      : typeof snapshot.overallScore === "number"
        ? snapshot.overallScore
        : null;
  const score =
    snapshotScore !== null
      ? `${snapshotScore}/100`
      : typeof scanContext.score === "number"
        ? `${scanContext.score}/100`
        : "the current score";
  const visualUnavailable =
    snapshot.visualMetricsAvailable === false ||
    asRecord(scanContext.visualUxDiagnostics).visualMetricsAvailable === false;
  const evidenceUnknown =
    snapshot.evidenceUnknown === true || scoringConfidence === "Low";
  const improvementSteps = (
    asArray(narrative.whatWouldIncreaseScore).length
      ? asArray(narrative.whatWouldIncreaseScore)
      : asArray(snapshot.whatWouldIncreaseScore)
  )
    .map((step) => asString(step))
    .filter(Boolean);
  const scoreChangeExplanation = asString(scoreChangeContext.explanation);
  const normalized = normalizeText(message);
  const asksWhatMattersMost = hasAny(normalized, [
    "what matters most",
    "biggest thing",
    "biggest score reducer",
    "what is hurting",
    "hurting the score",
    "most important",
  ]);
  const asksScoreChange = hasAny(normalized, [
    "why did it change",
    "why did the score change",
    "why changed",
    "score changed",
    "score change",
    "what changed",
  ]);
  const topReducer =
    responseContext.strongestReducers[0] ||
    penalties[0] ||
    "purchase-path confidence";
  const topPositiveText =
    responseContext.strongestPositives.slice(0, 3).join(", ") ||
    positives.slice(0, 3).join(", ") ||
    "visible commerce strengths";

  return {
    matched: true,
    topic: "score_reasoning",
    directAnswer: asksScoreChange
      ? `Why it changed: ${
          scoreChangeExplanation ||
          `The most recent score reflects the evidence available during this scan. Score changes usually come from differences in visible evidence, confidence, visual metric extraction, platform visibility, or dynamic content loaded during the scan.`
        }`
      : asksWhatMattersMost
        ? `What matters most: the biggest score reducer appears to be ${topReducer}. The scanner could see ${topPositiveText}, but it could not confidently verify enough of the customer purchase path to lift the overall score.`
        : `Why the score landed here: ${
        why ||
        `The score is ${score} because it is a weighted outcome: visible commerce strengths raised the score, while customer-path uncertainty and score reducers pulled it down.`
      }`,
    evidence:
      [
        positives.length > 0
          ? `Biggest positive signals: ${positives.slice(0, 3).join("; ")}.`
          : "Biggest positive signals: the scan did not list strong public-page positives.",
        penalties.length > 0
          ? `Biggest reducers: ${penalties.slice(0, 3).join("; ")}.`
          : "Biggest reducers: the scan did not list a single dominant reducer, so I would validate the purchase path manually.",
      ]
        .filter(Boolean)
        .join(" "),
    businessMeaning:
      [
        `Confidence level: ${scoringConfidence || "Moderate"}. ${
          scoringConfidence === "Low"
            ? "This score is directional because some scanner subsystems could not fully evaluate the page."
            : confidenceNote ||
              "This score is based on public-page evidence, not private analytics."
        }`,
        visualUnavailable
          ? "Visual UX scoring was unavailable and did not fully contribute to the score."
          : "",
        evidenceUnknown && scoringConfidence !== "Low"
          ? "Some evidence was unknown, so I would manually confirm the reducers before treating them as final."
          : "",
        asksScoreChange ? "" : scoreChangeExplanation,
        improvementSteps.length
          ? `What would increase the score: ${improvementSteps
              .slice(0, 3)
              .map((step) => step.replace(/[.;\s]+$/g, ""))
              .join("; ")}.`
          : "What would increase the score: make the purchase path, trust signals, and primary mobile action easier to verify, then rerun the scan.",
      ]
        .filter(Boolean)
        .join(" "),
    suggestedFollowUp:
      "Would you like Opzix to review this manually?",
  };
}

function scanCoverageAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const coverage = asRecord(scanContext.scanCoverage);
  const explanation = asString(coverage.explanation);
  const coverageSummary =
    asString(coverage.scoringCoverageSummary) ||
    asString(coverage.coverageSummary);
  const screenshotMode = asString(coverage.screenshotMode) || "viewport";
  const domCoverage = asString(coverage.domCoverage) || "visible";
  const scoringCoverage = asString(coverage.scoringCoverage) || "near-fold";
  const pageType = asRecord(scanContext.submittedPageType);
  const pageTypeLabel = asString(pageType.submittedPageType);
  const pageTypeNote = asString(pageType.scoringNote);
  const coverageWarnings = asArray(coverage.coverageWarnings)
    .map((item) => asString(item))
    .filter(Boolean);

  return {
    matched: true,
    topic: "score_coverage",
    directAnswer:
      "The scanner reviews the submitted URL, with heavier weighting on above-the-fold evidence for first impression and full-page DOM evidence for deeper commerce signals.",
    evidence:
      coverageSummary ||
      explanation ||
      `Screenshot mode: ${screenshotMode}; DOM coverage: ${domCoverage}; scoring coverage: ${scoringCoverage}.`,
    businessMeaning:
      [
        pageTypeLabel ? `Submitted page type: ${pageTypeLabel}. ${pageTypeNote}` : "",
        "If something appears lower on the submitted page, it should count for operations, trust, product discovery, support, shipping/returns, account, and fulfillment signals. It may still carry less weight for hero clarity, primary CTA, search prominence, and mobile first impression.",
        coverageWarnings.length ? `Coverage warnings: ${coverageWarnings.join(" ")}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    suggestedFollowUp:
      "Do you want me to separate what the scanner measured from what still needs manual review?",
  };
}

function competitiveContextAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const benchmark = asRecord(scanContext.benchmarkContext);
  const competitive = asRecord(scanContext.competitiveComparison);
  const comparisonSet = asArray(competitive.comparisonSet)
    .map((item) => asString(item))
    .filter(Boolean);
  const expectedPatterns = asArray(competitive.expectedPatterns)
    .map((item) => asString(item))
    .filter(Boolean);
  const weaknesses = asArray(competitive.weaknesses)
    .map((item) => asString(item))
    .filter(Boolean);
  const benchmarkGroup = asString(benchmark.benchmarkGroup);

  return {
    matched: true,
    topic: "benchmark",
    directAnswer: comparisonSet.length
      ? `I would compare this scan against ${comparisonSet.join(", ")}.`
      : `I would compare this scan against ${benchmarkGroup || "similar pages in the same conversion context"}.`,
    evidence:
      asString(benchmark.explanation) ||
      asString(competitive.explanation) ||
      "The comparison is directional and based on visible public-page evidence.",
    businessMeaning:
      expectedPatterns.join(" ") ||
      "A stronger comparable page usually makes the primary path obvious early, supports trust before commitment, and keeps discovery or contact actions easy to reach.",
    suggestedFollowUp: weaknesses.length
      ? `The main gaps versus that context are: ${weaknesses.slice(0, 3).join(" ")}`
      : "Do you want me to connect the benchmark gaps to the first fixes?",
  };
}

const costModel: Record<
  ProjectSize,
  { range: string; effort: string; examples: string[] }
> = {
  Small: {
    range: "$500-$2,000",
    effort: "1-2 weeks",
    examples: [
      "CTA fixes",
      "mobile hierarchy",
      "trust placement",
      "search visibility",
    ],
  },
  Medium: {
    range: "$2,000-$10,000",
    effort: "2-8 weeks",
    examples: [
      "UX redesign",
      "navigation restructuring",
      "conversion improvements",
      "category architecture",
    ],
  },
  Large: {
    range: "$10,000-$50,000",
    effort: "2-6 months",
    examples: [
      "major ecommerce redesign",
      "checkout overhaul",
      "platform integrations",
    ],
  },
  Enterprise: {
    range: "$50,000+",
    effort: "6+ months",
    examples: [
      "marketplace redesign",
      "enterprise commerce systems",
      "custom architecture",
    ],
  },
};

function allFindingRecords(scanContext: Record<string, unknown>) {
  const categories = asRecord(scanContext.categoryFindings);
  const findings = Object.values(categories).flatMap((value) =>
    flattenFindings(value),
  );
  const primary = getPrimaryConcern(scanContext);

  if (Object.keys(primary).length > 0) {
    findings.unshift(primary);
  }

  return findings;
}

function findingText(finding: Record<string, unknown>) {
  return [
    findingTitle(finding),
    asString(finding.category),
    asString(finding.categoryLabel),
    asString(finding.riskArea),
    asString(finding.evidenceSummary),
    asString(finding.explanation),
    asString(finding.recommendedFirstAction),
  ].join(" ");
}

function projectSizeRank(size: ProjectSize) {
  return ["Small", "Medium", "Large", "Enterprise"].indexOf(size);
}

function largerProjectSize(a: ProjectSize, b: ProjectSize): ProjectSize {
  return projectSizeRank(a) > projectSizeRank(b) ? a : b;
}

function projectSizeForText(text: string): ProjectSize | null {
  const normalized = normalizeText(text);

  if (
    hasAny(normalized, [
      "marketplace redesign",
      "enterprise commerce systems",
      "enterprise commerce",
      "custom architecture",
      "enterprise",
      "marketplace",
    ])
  ) {
    return "Enterprise";
  }

  if (
    hasAny(normalized, [
      "major ecommerce redesign",
      "major redesign",
      "checkout overhaul",
      "checkout redesign",
      "platform integration",
      "platform integrations",
      "payment integration",
      "erp",
      "oms",
      "migration",
      "custom stack",
    ])
  ) {
    return "Large";
  }

  if (
    hasAny(normalized, [
      "ux redesign",
      "navigation restructuring",
      "navigation structure",
      "conversion improvements",
      "category architecture",
      "category navigation",
      "product discovery",
      "site architecture",
      "conversion friction",
    ])
  ) {
    return "Medium";
  }

  if (
    hasAny(normalized, [
      "cta",
      "mobile hierarchy",
      "mobile content hierarchy",
      "trust placement",
      "trust signal",
      "search visibility",
      "store search visibility",
      "primary action",
      "above fold",
    ])
  ) {
    return "Small";
  }

  return null;
}

function estimateImplementationCost(
  scanContext: Record<string, unknown>,
): ImplementationCostEstimate {
  const findings = allFindingRecords(scanContext);
  const actionItems = getActionItems(scanContext);
  const platform = asRecord(scanContext.platform);
  const siteType = asString(scanContext.siteType);
  const projectSignals = [
    siteType,
    asString(scanContext.currentNarrativeArchetype),
    asString(platform.platformName),
    asString(platform.name),
    ...findings.map(findingText),
    ...actionItems.map((item) =>
      [asString(item.title), asString(item.action), asString(item.description)].join(" "),
    ),
  ];

  let projectSize: ProjectSize = "Small";

  for (const signal of projectSignals) {
    const signalSize = projectSizeForText(signal);
    if (signalSize) {
      projectSize = largerProjectSize(projectSize, signalSize);
    }
  }

  const highPriorityCount = findings.filter((finding) =>
    /critical|high/i.test(
      [
        asString(finding.severity),
        asString(finding.priority),
        asString(finding.status),
      ].join(" "),
    ),
  ).length;

  if (
    projectSize === "Small" &&
    (highPriorityCount >= 3 || findings.length >= 5)
  ) {
    projectSize = "Medium";
  }

  const model = costModel[projectSize];
  const topFinding = findings[0];
  const topAction = actionItems[0];
  const firstAction = topAction
    ? sanitizeEvidenceText(
        asString(topAction.action) ||
          asString(topAction.title) ||
          asString(topAction.description),
        { maxLength: 160 },
      ).replace(/[.]+$/, "")
    : "";
  const reasoning = [
    topFinding ? `Primary scan issue: ${findingTitle(topFinding)}.` : "",
    firstAction ? `First implementation action: ${firstAction}.` : "",
    `This maps closest to ${model.examples.slice(0, 3).join(", ")} work.`,
  ].filter(Boolean);

  const assumptions = [
    "This is a directional public-scan estimate, not a final proposal.",
    "Final scope depends on platform access, theme complexity, number of templates, content readiness, analytics needs, and stakeholder review cycles.",
    "The estimate assumes the work focuses on the scanned issues rather than a full brand, catalog, or platform rebuild unless the scan signals that scope.",
  ];

  return {
    projectSize,
    estimatedRange: model.range,
    estimatedEffort: model.effort,
    reasoning,
    confidence:
      findings.length > 0 || actionItems.length > 0
        ? "Medium - based on visible scan findings only"
        : "Low - not enough prioritized scan findings to estimate the range confidently",
    assumptions,
  };
}

function hasCostIntent(normalized: string) {
  return hasAny(normalized, [
    "cost",
    "price",
    "budget",
    "estimate",
    "how much",
    "implementation cost",
    "project cost",
    "redesign cost",
    "fix cost",
    "what would opzix charge",
    "opzix charge",
    "expensive",
    "quick wins",
    "bigger redesign",
    "redesign work",
  ]);
}

function roadmapRangeLabel(step: Record<string, unknown>) {
  const title = asString(step.title);

  if (/\b(confirm|confirmation|validate|validation|discovery call|audit|consult)\b/i.test(title)) {
    return "consulting range";
  }

  if (/\b(review|discovery|friction|improve|improvement|clarity|strengthen|fix)\b/i.test(title)) {
    return "improvement range";
  }

  return "typical investment range";
}

function capitalizedRoadmapRangeLabel(step: Record<string, unknown>) {
  const label = roadmapRangeLabel(step);
  return label.replace(/^\w/, (letter) => letter.toUpperCase());
}

function hasNewStoreIntent(normalized: string) {
  return hasAny(normalized, [
    "rebuild",
    "new site",
    "new ecommerce",
    "new ecommerce store",
    "new store",
    "build an ecommerce",
    "build ecommerce",
    "build a new",
    "build new",
    "from scratch",
    "without fixing",
    "instead of fixing",
    "replace the site",
    "replace this site",
    "start over",
  ]);
}

function hasRoiIntent(normalized: string) {
  return hasAny(normalized, [
    "worth fixing",
    "worth the fix",
    "worth the fixes",
    "worth the cost",
    "worth doing",
    "worth spending",
    "worth the investment",
    "worth it",
    "should i fix",
    "should we fix",
    "highest roi",
    "best roi",
    "return on investment",
    "roi",
    "pay off",
    "pays off",
  ]);
}

function costEstimateAnswer(
  scanContext: Record<string, unknown>,
  message = "",
): ExactAnswer {
  const estimate = estimateImplementationCost(scanContext);
  const confidenceLabel = estimate.confidence.split(" - ")[0].toLowerCase();
  const responseContext = buildAssistantResponseContext(
    scanContext,
    "cost_estimate",
  );
  const normalized = normalizeText(message);
  const asksCostAnalysis = hasAny(normalized, [
    "why expensive",
    "why is it expensive",
    "why is it so expensive",
    "cost analysis",
    "cost breakdown",
    "break down",
    "breakdown",
    "why so much",
  ]);

  if (asksCostAnalysis) {
    const enterpriseContext = responseContext.isEnterpriseRetail;

    return {
      matched: true,
      topic: "cost_estimate",
      directAnswer: enterpriseContext
        ? "The estimate is high because enterprise retail work is priced around systems risk, not because the homepage itself is expensive to adjust."
        : `The estimate reaches ${estimate.estimatedRange} because the scan suggests more than a tiny copy or styling tweak.`,
      evidence: enterpriseContext
        ? "A true enterprise implementation can involve checkout systems, fulfillment, inventory, account systems, search, delivery, store systems, analytics, and platform governance. The homepage fixes themselves may only be a small part of that."
        : estimate.reasoning.join(" "),
      businessMeaning: enterpriseContext
        ? "I would separate the work into two scopes: a smaller public-page UX validation/fix, and a much larger enterprise architecture scope only if internal systems, integrations, or platform constraints are confirmed."
        : "I would separate quick wins from structural work before a manual proposal. The lower investment range handles the visible scanned issues; the higher planning range assumes templates, navigation, tracking, or platform work.",
      suggestedFollowUp: "Would you like Opzix to review this manually?",
    };
  }

  const roadmapSummary = roadmapCostSummary(scanContext);
  const firstRoadmap = firstRoadmapStep(scanContext);

  if (roadmapSummary && firstRoadmap) {
    return {
      matched: true,
      topic: "cost_estimate",
      directAnswer:
        `Based on this scan, the ${roadmapRangeLabel(firstRoadmap)} for Step 1, ${asString(firstRoadmap.title)}, is ${asString(firstRoadmap.cost) || asString(firstRoadmap.estimatedCost)}, with an estimated timeline of ${asString(firstRoadmap.timeline) || asString(firstRoadmap.estimatedTimeline)}.`,
      evidence: `Roadmap planning view: ${roadmapSummary}.`,
      businessMeaning:
        "This is a planning estimate, not a final proposal. It keeps the range tied to a practical sequence instead of treating the scan as one vague project, and the early steps validate ROI before larger redesign or platform work.",
      suggestedFollowUp: "Would you like Opzix to review this manually?",
    };
  }

  return {
    matched: true,
    topic: "cost_estimate",
    directAnswer: `Based on this scan, I would use a ${estimate.projectSize.toLowerCase()} directional planning range: ${estimate.estimatedRange}, with an estimated effort of ${estimate.estimatedEffort}.`,
    evidence: estimate.reasoning.join(" "),
    businessMeaning:
      `I would treat this as a directional estimate with ${confidenceLabel} confidence. Final scope depends on platform, theme complexity, templates, content, analytics needs, and whether the work grows beyond the scanned issues.`,
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function newStoreCostAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const estimate = estimateImplementationCost(scanContext);
  const responseContext = buildAssistantResponseContext(
    scanContext,
    "rebuild_vs_fix",
  );

  if (responseContext.isEnterpriseRetail) {
    const reducer =
      responseContext.strongestReducers[0] ||
      responseContext.primaryConcernTitle ||
      "purchase-path confidence";

    return {
      matched: true,
      topic: "new_store_cost",
      directAnswer:
        "Based on this scan, I would not recommend a rebuild. For an enterprise retail or marketplace site, a public scan is not enough evidence to justify replacing the commerce platform.",
      evidence:
        `The current score context points to ${reducer}, not proof that the underlying enterprise commerce system is broken. Platform read: ${responseContext.platformName || "not fully visible"}${responseContext.platformConfidence ? `, ${responseContext.platformConfidence} confidence` : ""}.`,
      businessMeaning:
        "The practical recommendation is a targeted review of purchase-path visibility, trust signals, mobile action clarity, tracking, and platform evidence before any rebuild conversation. A true enterprise rebuild would be a custom architecture and integration program, not a standard new-store project.",
      suggestedFollowUp: "Would you like Opzix to review this manually?",
    };
  }

  const b2bContext = responseContext.isB2b;

  return {
    matched: true,
    topic: "new_store_cost",
    directAnswer: b2bContext
      ? "Based on this scan, I would not immediately rebuild the site. The visible issues look more like UX, product discovery, and information architecture problems than proof that the platform itself has to be replaced."
      : "Based on this scan, I would estimate a new ecommerce build separately from fixing the current site. I would still validate whether the visible issues are smaller UX and discovery fixes before recommending a full rebuild.",
    evidence:
      "New basic ecommerce store: $3,000-$8,000, usually 2-6 weeks. New professional B2B store: $8,000-$25,000, usually 1-3 months. Enterprise B2B commerce platform: $25,000-$100,000+, usually 3-12 months.",
    businessMeaning: b2bContext
      ? `For this scan, the smaller planning range is likely a ${estimate.estimatedRange} UX improvement project before a rebuild. A professional B2B rebuild would make sense if you need custom UX, stronger category architecture, advanced search, quote-request workflows, account experience, tracking, or reporting.`
      : `For this scan, the smaller planning range is likely a ${estimate.estimatedRange} targeted improvement project before a rebuild. A rebuild should only enter the conversation if platform limits, migration needs, integrations, or internal operating constraints are confirmed outside the public scan.`,
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function roiAnswer(
  message: string,
  scanContext: Record<string, unknown>,
): ExactAnswer {
  const normalized = normalizeText(message);
  const firstRoadmap = firstRoadmapStep(scanContext);

  if (firstRoadmap) {
    const title = asString(firstRoadmap.title) || "the first roadmap step";
    const cost = asString(firstRoadmap.cost) || asString(firstRoadmap.estimatedCost);
    const timeline =
      asString(firstRoadmap.timeline) || asString(firstRoadmap.estimatedTimeline);
    const impact =
      asString(firstRoadmap.expectedImpact) ||
      "a clearer customer path and a more measurable next action";
    const roiRationale =
      asString(firstRoadmap.roiRationale) ||
      "This is the highest-ROI starting point because it validates the customer path before larger work.";
    const rangeLabel = capitalizedRoadmapRangeLabel(firstRoadmap);

    return {
      matched: true,
      topic: "roi",
      directAnswer: `The highest-ROI first move appears to be ${title}.`,
      evidence: roiRationale,
      businessMeaning:
        `Timeline: ${timeline || "directional timeline not set"}${cost ? `, ${rangeLabel}: ${cost}` : ""}. Likely impact: ${impact.replace(/[.]+$/g, "")}. Risk: this is still directional until validated with analytics, platform access, or manual journey review.`,
      suggestedFollowUp: "Would you like Opzix to review this manually?",
    };
  }

  const estimate = estimateImplementationCost(scanContext);
  const responseContext = buildAssistantResponseContext(scanContext, "roi_value");
  const revenue = asRecord(scanContext.revenueImpactSummary);
  const estimates = asArray(revenue.estimates).map(asRecord);
  const findings = allFindingRecords(scanContext);
  const actionItems = getActionItems(scanContext);
  const roiSource =
    estimates.find((item) =>
      /conversion|cta|mobile|search|trust|navigation|discovery/i.test(
        [
          asString(item.findingTitle),
          asString(item.riskArea),
          asString(item.likelyImpact),
          asString(item.explanation),
        ].join(" "),
      ),
    ) ?? estimates[0];
  const topFinding =
    findings.find((finding) =>
      /cta|mobile|search|trust|navigation|discovery|conversion/i.test(
        findingText(finding),
      ),
    ) ?? findings[0];
  const topAction = actionItems[0];
  const roiFocus =
    responseContext.strongestReducers[0] ||
    asString(roiSource?.findingTitle) ||
    (topFinding ? findingTitle(topFinding) : "") ||
    asString(topAction?.title) ||
    asString(topAction?.action) ||
    "the first conversion-path cleanup";
  const positiveContext =
    responseContext.strongestPositives.slice(0, 3).join(", ") ||
    "visible commerce strengths";
  const effort =
    responseContext.isEnterpriseRetail
      ? "targeted review and validation first, not a rebuild"
      : `${estimate.estimatedEffort} in the ${estimate.projectSize.toLowerCase()} scope`;
  const likelyImpact =
    /checkout|purchase|trust|mobile|cta|tracking/i.test(roiFocus)
      ? "higher confidence in the purchase path and better measurement of shopper intent"
      : "better shopper clarity and a cleaner path to the intended next action";
  const risk =
    responseContext.isEnterpriseRetail
      ? "enterprise sites can hide checkout, account, personalization, and platform signals from public scans, so validate with analytics and platform access before spending heavily"
      : "directional scan only; validate with analytics, checkout data, and platform access";

  if (hasAny(normalized, ["highest roi", "best roi", "which fix"])) {
    return {
      matched: true,
      topic: "roi",
      directAnswer: `The highest-ROI opportunity appears to be ${roiFocus}.`,
      evidence:
        `The scanner could see ${positiveContext}, but ${roiFocus} is still reducing confidence in the customer path.`,
      businessMeaning: `Effort: ${effort}. Likely impact: ${likelyImpact}. Risk: ${risk}.`,
      suggestedFollowUp: "Would you like Opzix to review this manually?",
    };
  }

  return {
    matched: true,
    topic: "roi",
    directAnswer: `The highest-ROI opportunity appears to be ${roiFocus}. Based on this scan, it is worth fixing if the goal is to improve the shopper path without jumping straight into a full rebuild.`,
    evidence:
      `The scanner could see ${positiveContext}, but ${roiFocus} is the clearest issue to validate before bigger work.`,
    businessMeaning: `Effort: ${effort}. Likely impact: ${likelyImpact}. Risk: ${risk}.`,
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function recommendationText(record: Record<string, unknown>) {
  return [
    asString(record.title),
    asString(record.action),
    asString(record.description),
    asString(record.why),
    asString(record.findingTitle),
    asString(record.riskArea),
    asString(record.likelyImpact),
    asString(record.explanation),
    asString(record.evidenceSummary),
  ].join(" ");
}

function roadmapStepsFromContext(scanContext: Record<string, unknown>) {
  const roadmap = asRecord(scanContext.recommendationRoadmap);
  const steps = asArray(roadmap.steps).map(asRecord);

  if (steps.length > 0) {
    return steps;
  }

  return ["step1", "step2", "step3", "step4", "step5", "step6", "step7"]
    .map((key) => asRecord(roadmap[key]))
    .filter((step) => asString(step.title));
}

function roadmapStepLabel(step: Record<string, unknown>) {
  const stepNumber = typeof step.stepNumber === "number" ? step.stepNumber : null;
  const title = asString(step.title) || "Roadmap step";
  const cost = asString(step.cost) || asString(step.estimatedCost);
  const timeline = asString(step.timeline) || asString(step.estimatedTimeline);
  const suffix = [
    cost ? `${roadmapRangeLabel(step)} ${cost}` : "",
    timeline ? `timeline ${timeline}` : "",
  ].filter(Boolean).join(", ");

  return `${stepNumber ? `Step ${stepNumber}: ` : ""}${title}${suffix ? ` (${suffix})` : ""}`;
}

function firstRoadmapStep(scanContext: Record<string, unknown>) {
  return roadmapStepsFromContext(scanContext)[0] ?? null;
}

function roadmapCostSummary(scanContext: Record<string, unknown>) {
  return roadmapStepsFromContext(scanContext)
    .slice(0, 7)
    .map(roadmapStepLabel)
    .join("; ");
}

function requestedRoadmapStepNumber(normalized: string) {
  if (
    hasAny(normalized, [
      "what comes first",
      "what is first",
      "first step",
      "step 1",
      "step one",
      "what should come first",
    ])
  ) {
    return 1;
  }

  if (
    hasAny(normalized, [
      "what comes second",
      "second step",
      "step 2",
      "step two",
    ])
  ) {
    return 2;
  }

  if (
    hasAny(normalized, [
      "what comes third",
      "third step",
      "step 3",
      "step three",
    ])
  ) {
    return 3;
  }

  if (
    hasAny(normalized, [
      "what comes fourth",
      "fourth step",
      "step 4",
      "step four",
    ])
  ) {
    return 4;
  }

  if (
    hasAny(normalized, [
      "what comes fifth",
      "fifth step",
      "step 5",
      "step five",
    ])
  ) {
    return 5;
  }

  if (
    hasAny(normalized, [
      "what comes sixth",
      "sixth step",
      "step 6",
      "step six",
    ])
  ) {
    return 6;
  }

  if (
    hasAny(normalized, [
      "what comes seventh",
      "seventh step",
      "step 7",
      "step seven",
    ])
  ) {
    return 7;
  }

  return null;
}

function roadmapStepAnswer(
  scanContext: Record<string, unknown>,
  stepNumber: number,
): ExactAnswer | null {
  const step = roadmapStepsFromContext(scanContext).find(
    (item) => item.stepNumber === stepNumber,
  );

  if (!step) {
    return null;
  }

  const title = asString(step.title) || `Step ${stepNumber}`;
  const cost = asString(step.cost) || asString(step.estimatedCost);
  const timeline = asString(step.timeline) || asString(step.estimatedTimeline);

  return {
    matched: true,
    topic: "implementation_plan",
    directAnswer: `Step ${stepNumber} is ${title}.`,
    evidence:
      [
        cost ? `${capitalizedRoadmapRangeLabel(step)}: ${cost}.` : "",
        timeline ? `Timeline: ${timeline}.` : "",
        cost ? "This is a planning estimate, not a final proposal." : "",
      ]
        .filter(Boolean)
        .join(" ") ||
      "This comes from the structured recommendation roadmap.",
    businessMeaning:
      [
        asString(step.rationale),
        asString(step.validationTarget)
          ? `What I would validate: ${asString(step.validationTarget)}`
          : "",
        asString(step.expectedImpact)
          ? `Expected impact: ${asString(step.expectedImpact)}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function hasIndustrialSupplyContext(value: string) {
  const normalized = value.toLowerCase();
  const strongCatalogSignal =
    /plumbing|pvc|cpvc|pipe|pipes|fittings?|valves?|flange|coupling|elbow|adapter|schedule 40|schedule 80|replacement parts?|part number|sku|specification|datasheet|technical/i.test(
      normalized,
    );
  const b2bSupplySignal =
    /industrial|supply|distributor|wholesale|contractor|trade/i.test(normalized) &&
    /catalog|quote|rfq|procurement|sku|part number|specification|technical|product|category|search/i.test(
      normalized,
    );

  return strongCatalogSignal || b2bSupplySignal;
}

function hasGroceryRecommendationContext(value: string) {
  if (hasIndustrialSupplyContext(value)) {
    return false;
  }

  const normalized = value.toLowerCase();
  const grocerySpecific =
    /grocery|groceries|supermarket|fresh produce|organic food|natural food|weekly ad|shop by aisle|deli|bakery|seafood|prepared foods|recipes/.test(
      normalized,
    );
  const fulfillmentCluster =
    /pickup|curbside|same day|delivery/.test(normalized) &&
    /departments|department|store locator|weekly ad|loyalty|rewards|pharmacy/.test(
      normalized,
    );
  const knownGroceryBrand =
    /sprouts|publix|kroger|wholefoods|whole foods|safeway|albertsons|wegmans|heb|meijer|harristeeter|harris teeter|walmart|walgreens|cvs/.test(
      normalized,
    ) &&
    /grocery|pharmacy|pickup|delivery|store locator|weekly ad|departments/.test(
      normalized,
    );

  return grocerySpecific || fulfillmentCluster || knownGroceryBrand;
}

function buildHighestROIRecommendation(scanContext: Record<string, unknown>) {
  const roadmapSteps = roadmapStepsFromContext(scanContext);
  const firstStep = roadmapSteps[0];
  const secondStep = roadmapSteps[1];

  if (firstStep) {
    const title = asString(firstStep.title) || "validate the primary customer path";
    const rationale =
      asString(firstStep.rationale) ||
      asString(firstStep.roiRationale) ||
      "This is the first structured roadmap step from the scan.";

    return {
      title: `start with ${title}`,
      why: [
        rationale,
        asString(firstStep.roiRationale),
        asString(firstStep.cost) || asString(firstStep.estimatedCost)
          ? `${capitalizedRoadmapRangeLabel(firstStep)}: ${asString(firstStep.cost) || asString(firstStep.estimatedCost)}. This is a planning estimate, not a final proposal.`
          : "",
        asString(firstStep.timeline) || asString(firstStep.estimatedTimeline)
          ? `Estimated timeline: ${asString(firstStep.timeline) || asString(firstStep.estimatedTimeline)}.`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      validate:
        asString(firstStep.validationTarget) ||
        "The customer path from first impression to commercial action.",
      expectedImpact:
        asString(firstStep.expectedImpact) ||
        "A clearer customer path and a more measurable next action.",
      comesSecond: secondStep
        ? roadmapStepLabel(secondStep)
        : "Confirm impact and address the next score reducer.",
      action: "",
    };
  }

  const responseContext = buildAssistantResponseContext(
    scanContext,
    "opzix_recommendation",
  );
  const actionItems = getActionItems(scanContext);
  const revenue = asRecord(scanContext.revenueImpactSummary);
  const revenueEstimates = asArray(revenue.estimates).map(asRecord);
  const findings = allFindingRecords(scanContext);
  const primary = getPrimaryConcern(scanContext);
  const allSignals = [
    ...actionItems.map(recommendationText),
    ...revenueEstimates.map(recommendationText),
    ...findings.map(findingText),
    asString(primary.title),
    asString(primary.riskLabel),
    asString(primary.explanation),
    responseContext.siteType,
    responseContext.benchmarkGroup,
    responseContext.benchmarkLabel,
  ].join(" ");
  const discoveryCandidate =
    actionItems.find((item) =>
      /catalog|discovery|category|navigation|search|product|sku/i.test(
        recommendationText(item),
      ),
    ) ||
    revenueEstimates.find((item) =>
      /catalog|discovery|category|navigation|search|product|sku/i.test(
        recommendationText(item),
      ),
    ) ||
    findings.find((finding) =>
      /catalog|discovery|category|navigation|search|product|sku/i.test(
        findingText(finding),
      ),
    );
  const trustCandidate =
    responseContext.strongestReducers.find((item) =>
      /trust|checkout|purchase|cta|mobile/i.test(item),
    ) || responseContext.strongestReducers[0];
  const b2bDiscoveryContext =
    responseContext.isB2b ||
    /b2b|catalog|industrial|distributor|procurement|quote|sku/i.test(
      allSignals,
    );

  if (hasGroceryRecommendationContext(allSignals)) {
    return {
      title: "validate grocery discovery and fulfillment choice",
      why:
        "For grocery and supermarket retail, the first commercial question is whether shoppers can quickly find departments, search for items, choose pickup or delivery, and understand the next step.",
      validate:
        "Search usage, department navigation, pickup versus delivery flow, store locator usage, cart abandonment points, and mobile first-screen behavior.",
      expectedImpact:
        "Faster discovery, better department usage, more pickup/delivery engagement, and stronger conversion confidence.",
      comesSecond:
        "Improve department search and the pickup/delivery entry points.",
      action: "",
    };
  }

  if (b2bDiscoveryContext && discoveryCandidate) {
    const action =
      asString(asRecord(discoveryCandidate).action) ||
      asString(asRecord(discoveryCandidate).recommendedFirstAction) ||
      "walk the buyer journey from category discovery to product detail, cart or quote, and checkout";
    const reducerNote =
      trustCandidate && !/product|catalog|discovery|category|search|navigation/i.test(trustCandidate)
        ? `${trustCandidate} may be the biggest score reducer, but product discovery is the highest-ROI starting point because buyers need to find the right product or category before trust and checkout improvements can pay off.`
        : "Product discovery is the highest-ROI starting point because B2B buyers need to find the right category, SKU, or product path before narrower conversion fixes matter.";

    return {
      title: "validate product discovery",
      why:
        `The scanner points to catalog discovery friction and product discovery clarity. ${reducerNote}`,
      validate:
        "Category -> Product -> Cart or Quote -> Checkout. I would look for the exact step where buyers hesitate, loop back, search again, or lose confidence.",
      expectedImpact:
        "Customers should reach relevant product groups faster, understand the next step sooner, and move into cart, quote, or checkout with less friction.",
      comesSecond:
        "After that, I would improve search visibility, strengthen trust signals near the buying path, and tighten the mobile CTA.",
      action: sanitizeEvidenceText(action, { maxLength: 220 }),
    };
  }

  const reducer = trustCandidate || "purchase-path confidence";
  return {
    title: `validate ${reducer.toLowerCase()}`,
    why:
      `This appears to be the highest-ROI starting point because ${reducer} is the clearest customer-path constraint in the score narrative.`,
    validate:
      "I would walk the journey from landing page to product or service decision, primary action, trust confirmation, and final conversion step.",
    expectedImpact:
      "The expected impact is better decision confidence and a clearer path to the next commercial action.",
    comesSecond:
      "After that, I would address the next score reducer and confirm the changes with analytics or a manual journey review.",
    action: "",
  };
}

function opzixRecommendationAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const recommendation = buildHighestROIRecommendation(scanContext);

  return {
    matched: true,
    topic: "opzix_recommendation",
    directAnswer: `First, I would ${recommendation.title}.`,
    evidence: `Why: ${recommendation.why}`,
    businessMeaning:
      `What I would validate: ${recommendation.validate}`,
    suggestedFollowUp:
      `Expected impact: ${recommendation.expectedImpact}\n\nWhat comes second: ${recommendation.comesSecond}`,
  };
}

function revenueImpactAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const revenue = asRecord(scanContext.revenueImpactSummary);
  const estimates = asArray(revenue.estimates).map(asRecord);
  const topEstimate = estimates[0] ?? {};
  const findingTitle = asString(topEstimate.findingTitle);
  const riskArea = asString(topEstimate.riskArea);
  const likelyImpact = asString(topEstimate.likelyImpact);

  return {
    matched: true,
    topic: "business_impact",
    directAnswer: findingTitle
      ? `${findingTitle} is the clearest business-impact risk in this scan.`
      : "The report estimates revenue impact directionally from the highest-priority findings, but it does not claim exact dollars without analytics data.",
    evidence:
      asString(topEstimate.explanation) ||
      asString(revenue.summary) ||
      asString(asRecord(scanContext.scoreExplanation).whyThisScore) ||
      "The scan uses visible UX, conversion, trust, tracking, operations, and DOM signals to estimate business risk.",
    businessMeaning:
      riskArea || likelyImpact
        ? `${riskArea}: ${likelyImpact}`.replace(/^:\s*/, "")
        : "These findings matter because unclear paths, weak trust, incomplete tracking, or operational ambiguity can reduce conversion confidence, lead quality, attribution, or follow-up efficiency.",
    suggestedFollowUp:
      "Do you want me to rank the findings by likely business impact?",
  };
}

function priorityFrameworkAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const roadmapFirst = roadmapStepAnswer(scanContext, 1);

  if (roadmapFirst) {
    return roadmapFirst;
  }

  const primary = getPrimaryConcern(scanContext);
  const actionItems = getActionItems(scanContext);
  const topAction = actionItems[0];
  const findings = allFindingRecords(scanContext);
  const firstFinding = findings[0];
  const firstTitle =
    asString(topAction?.title) ||
    asString(primary.title) ||
    asString(primary.riskLabel) ||
    (firstFinding ? findingTitle(firstFinding) : "the highest-priority customer journey issue");
  const why =
    asString(topAction?.why) ||
    asString(primary.explanation) ||
    (firstFinding ? findingEvidence(firstFinding) : "");
  const action =
    asString(topAction?.action) ||
    asString(primary.recommendedFirstAction) ||
    asString(firstFinding?.recommendedFirstAction);

  return {
    matched: true,
    topic: "priority",
    directAnswer: `The first thing I would review is ${firstTitle}.`,
    evidence:
      why ||
      "The scan is using the top visible finding and recommended first action to choose the starting point.",
    businessMeaning:
      [
        "Why first: this is the issue most likely to affect the customer path before smaller optimizations matter.",
        action ? `What to check: ${sanitizeEvidenceText(action, { maxLength: 220 })}` : "",
        "Success looks like shoppers can find the right path faster and the team can measure whether the change improves behavior.",
      ]
        .filter(Boolean)
        .join(" "),
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function implementationPlanAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const roadmapSteps = roadmapStepsFromContext(scanContext);

  if (roadmapSteps.length > 0) {
    const firstStep = roadmapSteps[0];
    const plan = roadmapSteps.slice(0, 7).map(roadmapStepLabel).join("; ");

    return {
      matched: true,
      topic: "implementation_plan",
      directAnswer:
        `Based on this scan, I would use a structured recommendation roadmap starting with ${asString(firstStep.title)}.`,
      evidence: plan,
      businessMeaning:
        "This roadmap separates validation, implementation, and follow-up work so planning ranges, timeline, and ROI can be discussed step by step instead of as one oversized project.",
      suggestedFollowUp: "Would you like Opzix to review this manually?",
    };
  }

  const estimate = estimateImplementationCost(scanContext);
  const actionItems = getActionItems(scanContext);
  const quickWin =
    asString(actionItems[0]?.action) ||
    asString(actionItems[0]?.title) ||
    "tighten the clearest customer-path issue from the scan";
  const secondAction =
    asString(actionItems[1]?.action) ||
    asString(actionItems[1]?.title) ||
    "improve the next discovery, trust, or conversion bottleneck";

  return {
    matched: true,
    topic: "implementation_plan",
    directAnswer:
      "Based on this scan, I would split the work into quick wins, 30-day improvements, and larger project work.",
    evidence:
      `Quick wins: ${sanitizeEvidenceText(quickWin, { maxLength: 220 })}. 30-day improvements: ${sanitizeEvidenceText(secondAction, { maxLength: 220 })}. Larger project: ${estimate.projectSize} scope, roughly ${estimate.estimatedRange} and ${estimate.estimatedEffort}.`,
    businessMeaning:
      "What to measure: product/category engagement, search usage, CTA clicks, quote or checkout starts, lead quality, and whether users reach the intended next step with fewer dead ends.",
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function contactOrBookingAnswer(scanContext: Record<string, unknown>): ExactAnswer {
  const primary = getPrimaryConcern(scanContext);
  const title = asString(primary.title) || asString(primary.riskLabel);

  return {
    matched: true,
    topic: "contact_or_booking",
    directAnswer:
      "Yes. Opzix can review this manually and turn the scan into a practical ecommerce fix plan.",
    evidence: title
      ? `The manual review would start with ${title}.`
      : "The manual review would validate the scan findings against the live storefront, platform constraints, and customer journey.",
    businessMeaning:
      "The goal would be to separate quick fixes from rebuild-level work, confirm what is real versus directional scan evidence, and identify the highest-ROI next step.",
    suggestedFollowUp: "Would you like Opzix to review this manually?",
  };
}

function platformExactAnswer(
  message: string,
  scanContext: Record<string, unknown>,
): ExactAnswer {
  const normalized = normalizeText(message);
  const platform = asRecord(scanContext.platform);
  const name = platformName(platform);
  const isEnterpriseStack = name === "Enterprise / Custom Commerce Stack";

  return {
    matched: true,
    topic: "platform",
    directAnswer: platformDirectAnswer(platform, normalized),
    evidence: isEnterpriseStack
      ? platformEvidenceSummary(
          platform,
          asString(scanContext.platformVisibility) ||
            "The public page exposes mixed or limited standard-platform evidence.",
        )
      : platformEvidenceSummary(
          platform,
          asString(scanContext.platformVisibility) ||
            "The scan included platform visibility context.",
        ),
    businessMeaning: isEnterpriseStack
      ? "Platform-specific assumptions should be manually confirmed before recommending Magento, Shopify, BigCommerce, or WooCommerce-specific fixes."
      : isLowEcommerceProbability(platform)
        ? "The scan should treat this URL as a possible lead-generation or informational entry point until a human confirms where the commerce journey actually starts."
        : "Platform detection is useful context, but it should not be treated as a private-system inspection.",
    suggestedFollowUp:
      "Do you want me to connect platform visibility with the technical findings?",
  };
}

function answerFromDetectedIntent(
  message: string,
  scanContext: Record<string, unknown>,
  detection: AssistantIntentDetection,
): ExactAnswer | null {
  switch (detection.intent) {
    case "cost_estimate":
      return costEstimateAnswer(scanContext, message);
    case "rebuild_vs_fix":
      return newStoreCostAnswer(scanContext);
    case "roi_value":
      return roiAnswer(message, scanContext);
    case "fix_priority":
      return priorityFrameworkAnswer(scanContext);
    case "implementation_plan":
      return implementationPlanAnswer(scanContext);
    case "opzix_recommendation":
      return opzixRecommendationAnswer(scanContext);
    case "score_explanation":
      return positiveSignalAnswer(scanContext, message);
    case "competitive_question":
    case "benchmark_question":
      return competitiveContextAnswer(scanContext);
    case "platform_question":
      return platformExactAnswer(message, scanContext);
    case "revenue_impact":
      return revenueImpactAnswer(scanContext);
    case "contact_or_booking":
      return contactOrBookingAnswer(scanContext);
    default:
      return null;
  }
}

function getExactAnswer(
  message: string,
  rawScanContext: unknown,
): ExactAnswer {
  const scanContext = asRecord(rawScanContext);
  const normalized = normalizeText(message);
  const exact = getNestedRecord(scanContext, "exactCommerceVisibility");
  const detectedIntent = detectAssistantIntent(message);
  const frameworkAnswer = answerFromDetectedIntent(
    message,
    scanContext,
    detectedIntent,
  );

  if (frameworkAnswer?.matched) {
    return frameworkAnswer;
  }

  const glossaryAnswer = buildGlossaryExactAnswer(message, scanContext);
  if (glossaryAnswer.matched) {
    return glossaryAnswer;
  }

  if (
    hasAny(normalized, [
      "does this scan the full page",
      "scan the full page",
      "full page scan",
      "above fold",
      "near fold",
      "what does the score actually measure",
      "what does the score measure",
      "what does this score measure",
      "what is being measured",
      "is the score only based on the top",
      "only based on the top of the page",
      "why did it miss something lower",
      "miss something lower on the page",
    ])
  ) {
    return scanCoverageAnswer(scanContext);
  }

  if (
    hasAny(normalized, [
      "score mismatch",
      "visual ux 84",
      "ux/ui 59",
      "ux/ui 72",
      "visual metrics failed",
    ]) ||
    (normalized.includes("visual ux") && normalized.includes("ux/ui"))
  ) {
    return buildScoreSynchronizationAnswer(scanContext);
  }

  if (
    hasAny(normalized, [
      "who should this be compared",
      "what should this be compared",
      "compare against",
      "competitive",
      "better site",
      "amazon",
      "walmart",
      "uline",
    ])
  ) {
    return competitiveContextAnswer(scanContext);
  }

  if (hasNewStoreIntent(normalized)) {
    return newStoreCostAnswer(scanContext);
  }

  if (hasRoiIntent(normalized)) {
    return roiAnswer(message, scanContext);
  }

  if (hasCostIntent(normalized)) {
    return costEstimateAnswer(scanContext, message);
  }

  if (
    hasAny(normalized, [
      "revenue",
      "business impact",
      "why should i care",
      "affect sales",
      "affect leads",
      "cost money",
    ])
  ) {
    return revenueImpactAnswer(scanContext);
  }

  if (
    hasAny(normalized, [
      "why is the score this high",
      "why is score this high",
      "why is the score high",
      "why is the score this low",
      "why is score this low",
      "why is the score low",
      "why is walmart scoring low",
      "why walmart scoring low",
      "why is walmart score low",
      "why does amazon score",
      "why amazon score",
      "why does maxx score",
      "positive signals",
      "what positive signals",
      "what strengths",
      "why this score",
      "score reasoning",
    ])
  ) {
    return positiveSignalAnswer(scanContext);
  }

  if (
    hasAny(normalized, [
      "is this ecommerce",
      "is this an ecommerce",
      "ecommerce webpage",
      "what kind of site",
      "site type",
      "what kind of business",
      "is this dtc",
      "is sprouts dtc",
      "why is this dtc",
      "why did it say dtc",
      "why platform is first",
      "why is platform first",
      "why does this not sound like a normal ecommerce audit",
      "why does it not sound like a normal ecommerce audit",
      "why does the scan sound ecommerce",
      "why is cart not visible",
      "why cart is not visible",
    ])
  ) {
    const reviewContext = asRecord(scanContext.storefrontReviewContext);
    const platform = asRecord(scanContext.platform);
    const mode = narrativeMode(scanContext);
    const context = narrativeBusinessContext(scanContext);
    const profileSummary = asString(narrativeProfile(scanContext).narrativeProfileSummary);
    const reviewSiteType = asString(reviewContext.siteType);
    const rawSiteType =
      reviewSiteType === "lead-generation" ||
      reviewSiteType === "non-ecommerce-or-unclear"
        ? reviewSiteType
        : asString(scanContext.siteType || reviewContext.siteType);
    const siteType = rawSiteType || "non-ecommerce-or-unclear";
    const reason =
      asString(scanContext.siteTypeReason || reviewContext.reason) ||
      "The scan classified the page from public catalog, cart, checkout, CTA, form, platform, and metadata signals.";
    const supportingSignals = asArray(reviewContext.supportingSignals)
      .map((signal) => asString(signal))
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    const isStandardStorefront = siteType === "ecommerce-storefront";
    const isNonEcommerce = siteType === "non-ecommerce-or-unclear";
    const isLeadGeneration = siteType === "lead-generation";
    const isEnterprise = siteType === "enterprise-retail" || siteType === "custom-enterprise";
    const probability = ecommerceProbability(platform);
    const probabilityScore = probability.probability;
    const probabilityEvidence = asArray(probability.evidence)
      .map((signal) => asString(signal))
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    const negativeSignals = asArray(probability.negativeSignals)
      .map((signal) => asString(signal))
      .filter(Boolean)
      .slice(0, 2)
      .join(" ");
    const probabilityEvidenceText = probability.label
      ? `Ecommerce probability is ${asString(probability.label)}${
          typeof probabilityScore === "number" ? ` at ${probabilityScore}%` : ""
        }. ${probabilityEvidence} ${negativeSignals}`
      : `${reason} ${supportingSignals}`;

    return {
      matched: true,
      topic: "site_type",
      directAnswer: isGroceryNarrative(scanContext)
        ? groceryRetailAnswer()
        : isLeadGeneration
        ? "I would classify this as a service or lead-generation business page, not a retail ecommerce storefront. The scan needs product/catalog and cart/checkout evidence before calling it ecommerce."
        : isLowEcommerceProbability(platform) || isNonEcommerce
        ? "I would not classify this as an ecommerce storefront from the public scan. The page did not expose enough product, cart, checkout, or purchase-flow signals."
        : mode
        ? `I would frame this as ${mode.toLowerCase()}. ${profileSummary || context}`.trim()
        : isUnclearEcommerceProbability(platform)
          ? "The ecommerce probability is unclear from this URL. The page may support commerce elsewhere, but this scan should not assume a full ecommerce storefront without manual confirmation."
          : isStandardStorefront
        ? "Yes. From the public scan, this page exposes enough ecommerce signals to review it as a storefront."
        : isNonEcommerce
          ? "I would not treat this URL as a confirmed ecommerce storefront from the public scan alone."
          : isEnterprise
            ? "This looks more like an enterprise or custom commerce environment than a standard storefront template."
            : `I would classify this as ${siteType.replace(/-/g, " ")} from the public scan.`,
      evidence: sanitizeEvidenceText(
        isLeadGeneration || isNonEcommerce
          ? `${reason} ${supportingSignals} Product/catalog and cart/checkout evidence were not strong enough to confirm ecommerce.`
          : probabilityEvidenceText,
      ),
      businessMeaning: isGroceryNarrative(scanContext)
        ? "Grocery retail has a different customer journey than a typical brand-owned DTC storefront: shoppers often start with search, departments, weekly offers, fulfillment choice, store location, loyalty, or cart recovery rather than lifestyle product storytelling."
        : isLowEcommerceProbability(platform) || isNonEcommerce || isLeadGeneration
        ? "The first review question is whether this is the right commerce entry point, or whether buying happens elsewhere, behind login, through a lead path, or outside this public page."
        : context
        ? `The audit sounds different because the scan is using ${context}. The first review priority is ${asString(narrativeProfile(scanContext).concernPriority) || "the visible journey context"}.`
        : isEnterprise
          ? "Cart, checkout, and platform details may be intentionally abstracted, so the scan should stay conservative until a manual review confirms the actual journey."
          : "The site type changes how the findings should be interpreted; a catalog, lead-gen, or education journey should not be judged exactly like a retail checkout flow.",
      suggestedFollowUp:
        "Do you want me to explain what this means for the scan priorities?",
    };
  }

  if (
    hasAny(normalized, [
      "why does this matter",
      "why does this",
      "why this matter",
      "why is this important",
      "why is this relevant",
      "why should i care",
      "explain the impact",
      "business impact",
      "what is the impact",
    ])
  ) {
    const primaryConcern = getPrimaryConcern(scanContext);
    const actionItems = getActionItems(scanContext);
    const primaryAction = asString(actionItems[0]?.action);
    const concernLabel = asString(primaryConcern.label);

    let directAnswer = "";
    let evidence = "";
    let businessMeaning = "";

    if (concernLabel) {
      directAnswer =
        `${concernLabel} affects how much confidence you can have in your next action. When this area is unclear, it's harder to know if you're optimizing for the right thing.`;
      evidence =
        `The scan shows: ${asString(primaryConcern.statusDetail || "unclear signal")}. If I were reviewing this manually, I'd look at the scan findings in context and compare them with what you see in your analytics.`;
      businessMeaning =
        `The next thing I'd check is whether your tracking setup aligns with what the scan found. Mismatches there often hide real conversion issues.`;
    } else {
      directAnswer =
        "This matters because public-page signals shape how confidently you can act on recommendations. When visibility, tracking, or checkout readiness are unclear, teams often misattribute issues and fix the wrong things first.";
      evidence =
        `The scan focuses on visible commerce signals, tracking visibility, and checkout readiness. If I were reviewing this manually, I'd validate the platform detection and cross-check the tracking findings with your analytics dashboard.`;
      businessMeaning =
        `If signals are off, you might blame conversion issues on traffic when the real problem is tracking or checkout clarity.`;
    }

    const suggestedFollowUp = primaryAction
      ? `Want me to compare this impact with the first action: ${sanitizeEvidenceText(primaryAction, { maxLength: 100 })}?`
      : "Want me to compare this with tracking visibility?";

    return {
      matched: true,
      topic: "why_it_matters",
      directAnswer,
      evidence,
      businessMeaning,
      suggestedFollowUp,
    };
  }

  // Technical-errors specific handler: translate raw diagnostics into operator language.
  if (
    hasAny(normalized, [
      "technical error",
      "technical errors",
      "what are the technical errors",
      "technical issues",
      "technical problems",
    ])
  ) {
    const raw = getNestedRecord(scanContext, "rawDiagnostics");
    const platform = asRecord(raw.platformDetection);
    const platformName = asString(platform.name) || "an unknown platform";
    const platformConfidenceLabel = asString(platform.confidenceLabel) || "unknown confidence";
    const platformConfidence = platform.confidence;
    const consoleErrors = asArray(raw.consoleErrors).length;
    const failedRequests = asArray(raw.failedRequests).length;

    const direct = `What stands out technically is ${platformName !== "Unknown" && platformName !== "an unknown platform" ? `the scan's platform detection suggesting ${platformName} (${platformConfidenceLabel.toLowerCase()}${typeof platformConfidence === "number" ? `, ${platformConfidence}%` : ""})` : "low confidence in platform detection"}${failedRequests > 0 ? `, and ${failedRequests} failed frontend request${failedRequests === 1 ? "" : "s"}` : ``}${consoleErrors > 0 ? `${failedRequests > 0 ? ", and" : ", and"} ${consoleErrors} console error${consoleErrors === 1 ? "" : "s"}` : ""}.`;

    const evidenceLines: string[] = [];
    if (platformName && platformName !== "Unknown") {
      evidenceLines.push(
        `The scan detected ${platformName} with ${platformConfidenceLabel.toLowerCase()}${typeof platformConfidence === "number" ? ` (${platformConfidence}%)` : ""}.`,
      );
    } else {
      evidenceLines.push("Platform visibility is limited in the public-page scan.");
    }

    if (failedRequests > 0) {
      evidenceLines.push(`The scan reported ${failedRequests} failed frontend request${failedRequests === 1 ? "" : "s"}.`);
    }

    if (consoleErrors > 0) {
      evidenceLines.push(`The scan reported ${consoleErrors} console error${consoleErrors === 1 ? "" : "s"}.`);
    }

    const evidence = evidenceLines.join(" ");

    const technicalPriority =
      classifyTechnicalSeverity(scanContext) === "High"
        ? "I would treat this as a high-priority review item, not proof the store is broken."
        : "I would treat this as a technical review item before making platform-specific recommendations.";
    const business = `${archetypeFrame(scanContext)} ${technicalPriority} Failed requests and console errors can affect script execution, tracking, and storefront consistency. If I were reviewing this manually, I'd look at the platform signals and compare them with what you see in your dev tools.`;

    const suggested =
      "Want me to compare this with the tracking visibility findings?";

    return {
      matched: true,
      topic: "technical_errors",
      directAnswer: direct,
      evidence,
      businessMeaning: business,
      suggestedFollowUp: suggested,
    };
  }

  if (
    hasAny(normalized, [
      "technical errors",
      "technical issues",
      "technical finding",
      "technical findings",
      "failed frontend",
      "failed requests",
      "console errors",
      "frontend requests",
      "page errors",
    ])
  ) {
    return technicalExactAnswer(scanContext);
  }

  if (
    hasAny(normalized, [
      "mobile cta",
      "mobile button",
      "primary action",
      "what button",
      "what is wrong with the mobile cta",
      "explain mobile cta",
    ])
  ) {
    return ctaExactAnswer(message, scanContext);
  }

  if (hasAny(normalized, ["desktop cta", "desktop button"])) {
    const signal = getVisibilitySignal(scanContext, "cta");
    const visible = asBoolean(exact.desktopCtaVisible) ?? asBoolean(signal.visible);

    return {
      matched: true,
      topic: "desktop_cta",
      directAnswer: `${directBoolPrefix(visible)}, desktop CTA visibility is ${boolPhrase(visible)}.`,
      evidence: signalEvidence(signal, "The scan did not include a detailed desktop CTA evidence line."),
      businessMeaning:
        "A visible desktop CTA helps shoppers understand the next step, but the CTA still needs clear hierarchy and intent.",
      suggestedFollowUp:
        "Do you want me to compare the CTA evidence with the conversion findings?",
    };
  }

  if (hasAny(normalized, ["product/category", "product category", "category navigation", "product navigation"])) {
    const signal = getVisibilitySignal(scanContext, "productNavigation");
    const visible =
      asBoolean(exact.productNavigationVisible) ?? asBoolean(signal.visible);
    const collectionVisible = asBoolean(exact.collectionLinksVisible);

    return {
      matched: true,
      topic: "product_navigation",
      directAnswer: `${directBoolPrefix(visible)}, product/category navigation is ${boolPhrase(visible)}.`,
      evidence: `${signalEvidence(signal, "The scan included product/category navigation visibility in commerce signals.")} Collection/product links are ${boolPhrase(collectionVisible)}.`,
      businessMeaning:
        "Broad navigation can help shoppers orient themselves, but collection and product links still matter for product discovery.",
      suggestedFollowUp:
        "Do you want me to compare product discovery with the conversion findings?",
    };
  }

  if (hasAny(normalized, ["collection/product", "collection links", "product links"])) {
    const signal = getVisibilitySignal(scanContext, "collectionLinks");
    const visible = asBoolean(exact.collectionLinksVisible) ?? asBoolean(signal.visible);

    return {
      matched: true,
      topic: "collection_links",
      directAnswer: `${directBoolPrefix(visible)}, collection/product links are ${boolPhrase(visible)}.`,
      evidence: signalEvidence(signal, "The scan checked collection/product link visibility."),
      businessMeaning:
        "Collection and product links help shoppers move from broad browsing to specific purchase paths.",
      suggestedFollowUp:
        "Do you want me to explain how this affects product discovery?",
    };
  }

  if (hasAny(normalized, ["search visible", "is search", "store search", "search"])) {
    const signal = getVisibilitySignal(scanContext, "search");
    const visible = asBoolean(exact.searchVisible) ?? asBoolean(signal.visible);

    return {
      matched: true,
      topic: "search",
      directAnswer: `${directBoolPrefix(visible)}, search is ${boolPhrase(visible)}.`,
      evidence: signalEvidence(signal, "The scan checked search visibility."),
      businessMeaning:
        "Search visibility matters most for stores with broader catalogs because it reduces product discovery effort.",
      suggestedFollowUp:
        "Do you want me to compare search visibility with the UX findings?",
    };
  }

  if (hasAny(normalized, ["cart visible", "is cart", "cart visibility"])) {
    const signal = getVisibilitySignal(scanContext, "cart");
    const visible = asBoolean(exact.cartVisible) ?? asBoolean(signal.visible);

    return {
      matched: true,
      topic: "cart",
      directAnswer: `${directBoolPrefix(visible)}, cart visibility is ${boolPhrase(visible)}.`,
      evidence: signalEvidence(signal, "The scan checked cart visibility."),
      businessMeaning:
        "A visible cart helps shoppers return to purchase intent after browsing.",
      suggestedFollowUp:
        "Do you want me to connect cart visibility to the checkout findings?",
    };
  }

  if (hasAny(normalized, ["checkout visible", "is checkout", "checkout visibility"])) {
    const signal = getVisibilitySignal(scanContext, "checkout");
    const visible = asBoolean(exact.checkoutVisible) ?? asBoolean(signal.visible);

    return {
      matched: true,
      topic: "checkout",
      directAnswer: `${directBoolPrefix(visible)}, checkout visibility is ${boolPhrase(visible)}.`,
      evidence: signalEvidence(signal, "The scan checked checkout visibility."),
      businessMeaning:
        "A clear checkout path reduces uncertainty once shoppers are ready to buy.",
      suggestedFollowUp:
        "Do you want me to show what Opzix would fix first?",
    };
  }

  if (hasAny(normalized, ["platform confidence", "confidence in platform"])) {
    const platform = asRecord(scanContext.platform);
    const name = platformName(platform);
    const isEnterpriseStack = name === "Enterprise / Custom Commerce Stack";

    return {
      matched: true,
      topic: "platform_confidence",
      directAnswer: isLowEcommerceProbability(platform)
        ? "Platform detection was skipped because ecommerce probability is low for this public URL."
        : isUnclearEcommerceProbability(platform)
          ? "Platform confidence needs manual review because ecommerce probability is unclear from this URL."
          : isEnterpriseStack
        ? "Platform confidence should be treated as needing manual review because the public scan points to an enterprise/custom stack rather than a standard platform label."
        : `Platform confidence is ${asString(platform.confidenceLabel) || "not labeled"}${
          typeof platform.confidence === "number" ? ` at ${platform.confidence}%` : ""
        }.`,
      evidence: asString(scanContext.platformVisibility) || "The scan included platform visibility context.",
      businessMeaning: isEnterpriseStack
        ? "The public evidence is not strong enough to safely make Magento, Shopify, BigCommerce, or WooCommerce-specific assumptions."
        : "Platform confidence helps frame recommendations, but platform-specific work should still be confirmed in a human review.",
      suggestedFollowUp:
        "Do you want me to connect the platform signal to the technical findings?",
    };
  }

  if (
    hasAny(normalized, [
      "what platform",
      "which platform",
      "platform is this",
      "platform",
      "is this magento",
      "why did it say magento",
      "what is walmart built on",
      "custom enterprise stack",
      "enterprise commerce stack",
    ])
  ) {
    const platform = asRecord(scanContext.platform);
    const name = platformName(platform);
    const isEnterpriseStack = name === "Enterprise / Custom Commerce Stack";

    return {
      matched: true,
      topic: "platform",
      directAnswer: platformDirectAnswer(platform, normalized),
      evidence: isEnterpriseStack
        ? platformEvidenceSummary(
            platform,
            asString(scanContext.platformVisibility) ||
              "The public page exposes mixed or limited standard-platform evidence.",
          )
        : platformEvidenceSummary(
            platform,
            asString(scanContext.platformVisibility) ||
              "The scan included platform visibility context.",
          ),
      businessMeaning: isEnterpriseStack
        ? "Platform-specific assumptions should be manually confirmed before recommending Magento, Shopify, BigCommerce, or WooCommerce-specific fixes."
        : isLowEcommerceProbability(platform)
          ? "The scan should treat this URL as a possible lead-generation or informational entry point until a human confirms where the commerce journey actually starts."
          : "Platform detection is useful context, but it should not be treated as a private-system inspection.",
      suggestedFollowUp:
        "Do you want me to connect platform visibility with the technical findings?",
    };
  }

  if (
    hasAny(normalized, [
      "conversion measurement confidence gap",
      "measurement confidence gap",
      "why did you say conversion measurement",
    ])
  ) {
    const conversionFindings = getCategoryFindings(scanContext, "conversion");
    const trackingFindings = getCategoryFindings(scanContext, "tracking");
    const conversionFinding = getFirstFindingByKeywords(conversionFindings, [
      "measurement",
      "tracking",
      "confidence",
      "conversion",
    ]);
    const trackingFinding = getFirstFindingByKeywords(trackingFindings, [
      "tracking",
      "measurement",
      "analytics",
    ]);
    const tools = getTrackingTools(scanContext);

    return {
      matched: true,
      topic: "conversion_measurement",
      directAnswer:
        "The conversion measurement confidence gap means the scan can see some public tracking signals, but it cannot confirm full conversion-event coverage from the public page alone.",
      evidence: [
        tools.length ? `Visible tracking tools: ${tools.join(", ")}.` : "",
        conversionFinding
          ? `Conversion finding: ${findingTitle(conversionFinding)}: ${findingEvidence(conversionFinding)}`
          : "",
        trackingFinding
          ? `Tracking finding: ${findingTitle(trackingFinding)}: ${findingEvidence(trackingFinding)}`
          : "",
      ]
        .filter(Boolean)
        .join(" "),
      businessMeaning:
        "You may have tracking present, but campaign and funnel decisions are harder to trust until purchase, lead, cart, and checkout events are validated.",
      suggestedFollowUp:
        "Do you want me to compare the tracking issue with the conversion findings?",
    };
  }

  if (
    hasAny(normalized, [
      "tracking tools",
      "tracking visible",
      "analytics visible",
      "ga4",
      "gtm",
      "meta pixel",
      "measurement confidence",
    ])
  ) {
    const tools = getTrackingTools(scanContext);
    const trackingFindings = getCategoryFindings(scanContext, "tracking");
    const finding = getFirstFindingByKeywords(trackingFindings, [
      "tracking",
      "measurement",
      "analytics",
      "visibility",
    ]);

    return {
      matched: true,
      topic: "tracking",
      directAnswer: tools.length
        ? `The visible tracking tools are ${tools.join(", ")}.`
        : "No supported tracking tools were visible in the scan context.",
      evidence:
        finding
          ? `${asString(scanContext.trackingVisibility)} Related finding: ${findingTitle(finding)}: ${findingEvidence(finding)}`
          : asString(scanContext.trackingVisibility) || "The scan included tracking visibility context.",
      businessMeaning:
        "Tracking visibility affects how confidently you can interpret conversion events, campaigns, and funnel performance.",
      suggestedFollowUp:
        "Do you want me to compare tracking visibility with the conversion findings?",
    };
  }

  if (
    hasAny(normalized, [
      "what ux issues",
      "ux findings",
      "ux issues",
      "ux/ui",
      "usability",
      "design issues",
      "wrong with the layout",
      "layout feel",
      "page feel off",
      "mobile layout",
      "desktop ux",
      "desktop layout",
      "ux score low",
      "why is the ux score low",
      "why ux score",
      "fix visually",
      "visual issue",
      "visual issues",
      "visual ux",
      "alignment",
      "spacing",
      "hierarchy",
      "whitespace",
      "product grid",
    ])
  ) {
    return (
      buildVisualUxAnswer(scanContext) ??
      buildFindingsAnswer(scanContext, "ux", "UX/UI") ?? {
        matched: false,
        topic: "",
        directAnswer: "",
        evidence: "",
        businessMeaning: "",
        suggestedFollowUp: "",
      }
    );
  }

  if (hasAny(normalized, ["conversion findings", "conversion issues", "sales issues", "purchase path"])) {
    return (
      buildFindingsAnswer(scanContext, "conversion", "conversion") ?? {
        matched: false,
        topic: "",
        directAnswer: "",
        evidence: "",
        businessMeaning: "",
        suggestedFollowUp: "",
      }
    );
  }

  if (hasAny(normalized, ["trust findings", "trust issues", "trust signals", "reviews", "returns", "shipping"])) {
    return (
      buildFindingsAnswer(scanContext, "trust", "trust") ?? {
        matched: false,
        topic: "",
        directAnswer: "",
        evidence: "",
        businessMeaning: "",
        suggestedFollowUp: "",
      }
    );
  }

  if (hasAny(normalized, ["operations findings", "operations issues", "fulfillment", "support", "order"])) {
    return (
      buildFindingsAnswer(scanContext, "operations", "operations") ?? {
        matched: false,
        topic: "",
        directAnswer: "",
        evidence: "",
        businessMeaning: "",
        suggestedFollowUp: "",
      }
    );
  }

  const requestedRoadmapStep = requestedRoadmapStepNumber(normalized);
  if (requestedRoadmapStep && roadmapStepsFromContext(scanContext).length > 0) {
    return (
      roadmapStepAnswer(scanContext, requestedRoadmapStep) ?? {
        matched: false,
        topic: "",
        directAnswer: "",
        evidence: "",
        businessMeaning: "",
        suggestedFollowUp: "",
      }
    );
  }

  if (hasAny(normalized, ["what to fix first", "what should i fix first", "what should we fix first", "fix first", "opzix fix first", "review first", "what should be reviewed first", "why platform is first", "why is platform first"])) {
    const roadmapFirst = roadmapStepAnswer(scanContext, 1);
    if (roadmapFirst) {
      return roadmapFirst;
    }

    const visualPriority = getVisualFirstPriorityFinding(scanContext);

    if (visualPriority?.source === "visual") {
      return {
        matched: true,
        topic: "fix_first",
        directAnswer: visualUxDirectAnswer(
          visualPriority.finding,
          "",
          visualUxMetricPhrase(scanContext),
        ),
        evidence: findingEvidence(visualPriority.finding),
        businessMeaning: visualUxBusinessMeaning(visualPriority.finding),
        suggestedFollowUp:
          "Do you want me to compare this visual issue with conversion or navigation?",
      };
    }

    const primary = getPrimaryConcern(scanContext);
    const action = getActionItems(scanContext)[0];
    const mode = narrativeMode(scanContext);
    const profileAction = narrativeRecommendedAction(scanContext);
    const context = narrativeBusinessContext(scanContext);
    const priority = priorityTone(
      asString(primary.severity) ||
        asString(primary.priority) ||
        categoryPriorityForTopic(scanContext, "priority"),
    );
    const title =
      asString(primary.title) ||
      asString(primary.riskLabel) ||
      asString(action.title) ||
      asString(action.action) ||
      "the highest-priority scan issue";

    return {
      matched: true,
      topic: "fix_first",
      directAnswer: isGroceryNarrative(scanContext)
        ? groceryRetailAnswer()
        : mode && profileAction
        ? `I would start with the ${mode.toLowerCase()} journey: ${profileAction}`
        : `I would review ${title} first, and this ${priority.phrase}.`,
      evidence:
        asString(primary.evidenceSummary) ||
        asString(action.evidenceClue) ||
        "The scan ranked this as the clearest next review area.",
      businessMeaning:
        context
          ? `This comes first because the scan is framed around ${context}. ${asString(primary.explanation) || asString(action.why) || ""}`
          : `${archetypeFrame(scanContext)} ${priority.sentence} ${
          asString(primary.explanation) ||
          asString(action.why) ||
          "Starting here keeps the review focused on the highest-friction part of the customer journey."
        }`,
      suggestedFollowUp:
        "Do you want me to explain why this should come before the other findings?",
    };
  }

  if (hasAny(normalized, ["primary operational concern", "primary concern", "biggest concern", "main concern"])) {
    const primary = getPrimaryConcern(scanContext);
    const title = asString(primary.title) || asString(primary.riskLabel);
    const priority = priorityTone(asString(primary.severity) || asString(primary.priority));

    if (!title) {
      return {
        matched: false,
        topic: "",
        directAnswer: "",
        evidence: "",
        businessMeaning: "",
        suggestedFollowUp: "",
      };
    }

    return {
      matched: true,
      topic: "primary_operational_concern",
      directAnswer: `What stands out is ${title}. ${priority.sentence}`,
      evidence:
        asString(primary.evidenceSummary) ||
        "The scan included this as the primary operational concern.",
      businessMeaning:
        `${archetypeFrame(scanContext)} ${asString(primary.explanation) ||
          "This is the finding the scan suggests reviewing before broader optimization work."}`,
      suggestedFollowUp:
        "Do you want me to show what Opzix would review first from that concern?",
    };
  }

  return {
    matched: false,
    topic: "",
    directAnswer: "",
    evidence: "",
    businessMeaning: "",
    suggestedFollowUp: "",
  };
}

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ConversationMessage>;

  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string"
  );
}

function safeConversationHistory(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isConversationMessage).slice(-8).map((item) => ({
    role: item.role,
    content: item.content.slice(0, 1200),
  }));
}

function compactJson(value: unknown) {
  return JSON.stringify(value, null, 2).slice(0, 18000);
}

function extractOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  return (
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((content) => content.text)
      .filter(Boolean)
      .join("\n") ?? ""
  );
}

function parseAssistantJson(text: string) {
  try {
    const parsed = JSON.parse(text) as {
      reply?: unknown;
      suggestedReplies?: unknown;
    };

    if (typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      return null;
    }

    return {
      reply: parsed.reply.trim(),
      suggestedReplies: Array.isArray(parsed.suggestedReplies)
        ? parsed.suggestedReplies
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 4)
        : [],
    };
  } catch {
    return null;
  }
}

function scanDomain(scanContext: Record<string, unknown>) {
  const directDomain =
    asString(scanContext.normalizedDomain) ||
    asString(scanContext.normalized_domain) ||
    asString(scanContext.domain);
  if (directDomain) {
    return directDomain;
  }

  const url =
    asString(scanContext.scannedUrl) ||
    asString(scanContext.website) ||
    asString(scanContext.url) ||
    asString(scanContext.finalUrl);

  if (!url) {
    return null;
  }

  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return url
      .replace(/^https?:\/\//i, "")
      .split("/")[0]
      ?.replace(/^www\./, "")
      .toLowerCase() ?? null;
  }
}

function numericScore(scanContext: Record<string, unknown>) {
  const score = scanContext.score ?? scanContext.overallScore;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

function leadSubmitted(scanContext: Record<string, unknown>) {
  return (
    scanContext.leadSubmitted === true ||
    scanContext.lead_submitted === true ||
    scanContext.contactSubmitted === true ||
    scanContext.contact_submitted === true
  );
}

function scanId(scanContext: Record<string, unknown>) {
  return (
    asString(scanContext.scanId) ||
    asString(scanContext.scan_id) ||
    asString(scanContext.id) ||
    null
  );
}

async function logAssistantQuestion(
  question: string,
  rawScanContext: unknown,
  detection: AssistantIntentDetection,
  answer: string,
) {
  const scanContext = asRecord(rawScanContext);

  await logAssistantConversation({
    scanId: scanId(scanContext),
    domain: scanDomain(scanContext),
    question,
    detectedIntent: detection.intent,
    intentConfidence: detection.confidence,
    answerPreview: answer,
    siteType:
      asString(scanContext.siteType) ||
      asString(asRecord(scanContext.storefrontReviewContext).siteType),
    score: numericScore(scanContext),
    scoringConfidence:
      asString(scanContext.scoringConfidence) ||
      asString(asRecord(scanContext.scoreExplanation).scoringConfidence),
    leadSubmitted: leadSubmitted(scanContext),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostScanAssistantRequest;
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        { reply: "", suggestedReplies: [], fallback: true },
        { status: 400 },
      );
    }

    const conversationHistory = safeConversationHistory(body.conversationHistory);
    const scanContext = body.scanContext ?? {};
    const detectedIntent = detectAssistantIntent(message);
    const exactAnswer = getExactAnswer(message, scanContext);

    if (exactAnswer.matched) {
      // Provide an extra phrasing variant for certain glossary topics so the UI
      // can surface alternate question examples to the user.
      const baseReplies = [exactAnswer.suggestedFollowUp].filter(Boolean);
      let extraReplies: string[] = [];

      if (exactAnswer.topic === "attribution") {
        extraReplies = [
          "How does attribution affect marketing decisions?",
          "Can you show attribution evidence from this scan?",
        ];
      }

      if (exactAnswer.topic === "operationalVisibility") {
        extraReplies = [
          "How does operational visibility affect customer trust?",
          "Can you show operational evidence from this scan?",
        ];
      }

      const suggestedReplies = [...baseReplies, ...extraReplies].filter(Boolean);
      const reply = formatExactAnswer(exactAnswer);

      await logAssistantQuestion(message, scanContext, detectedIntent, reply);

      return NextResponse.json(
        {
          reply,
          suggestedReplies,
        },
        { status: 200 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          reply:
            "I can handle direct scan questions locally, but I can’t generate a broader consultant response without the OpenAI key.",
          suggestedReplies: [
            "What is the primary concern?",
            "Can you explain the business impact?",
          ],
          fallback: true,
        },
        { status: 503 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-5.2",
        store: false,
        instructions: assistantInstructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Scan context, including exact commerce visibility fields, top action items, category findings, platform/tracking fields, primary concern, and benchmark context:\n${compactJson(scanContext)}\n\nConversation history:\n${compactJson(
                  conversationHistory,
                )}\n\nLatest user message:\n${message}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "post_scan_assistant_response",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                reply: {
                  type: "string",
                },
                suggestedReplies: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  maxItems: 4,
                },
              },
              required: ["reply", "suggestedReplies"],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("Post-scan assistant OpenAI error:", await response.text());
      return NextResponse.json(
        { reply: "", suggestedReplies: [], fallback: true },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const parsed = parseAssistantJson(extractOutputText(payload));

    if (!parsed) {
      return NextResponse.json(
        { reply: "", suggestedReplies: [], fallback: true },
        { status: 502 },
      );
    }

    await logAssistantQuestion(message, scanContext, detectedIntent, parsed.reply);

    return NextResponse.json(parsed, { status: 200 });
  } catch (error) {
    console.error("Post-scan assistant route error:", error);
    return NextResponse.json(
      { reply: "", suggestedReplies: [], fallback: true },
      { status: 500 },
    );
  }
}

function unsupportedMethod() {
  return NextResponse.json(methodNotAllowedResponse(), {
    status: 405,
    headers: { Allow: "POST" },
  });
}

export const GET = unsupportedMethod;
export const PUT = unsupportedMethod;
export const PATCH = unsupportedMethod;
export const DELETE = unsupportedMethod;
export const OPTIONS = unsupportedMethod;
