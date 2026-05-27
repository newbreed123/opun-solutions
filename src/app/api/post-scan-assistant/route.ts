import { NextRequest, NextResponse } from "next/server";
import { methodNotAllowedResponse } from "@/lib/form-submissions";
import {
  sanitizeEvidenceText,
  summarizeMobileCtaEvidence,
} from "@/lib/evidence-cleanup";

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
};

const assistantInstructions = `
You are Opun Assistant, a calm ecommerce systems consultant reviewing a lightweight public scan.

Use only the provided scan context and the conversation history. If the scan context does not contain enough evidence, say that clearly and suggest a human audit or storefront walkthrough.

Start with the direct answer if the user asks about a specific item. Do not answer generally before answering the specific question.

You should:
- explain findings in plain English
- sound like an experienced ecommerce operator reviewing the scan live
- use short natural paragraphs, not diagnostic field dumps
- use phrases like "What stands out to me is", "If I were reviewing this manually", and "The bigger concern is" when they fit naturally
- preserve priority and severity; high-priority and critical findings should still sound important without sounding alarmist
- connect findings to conversion, trust, tracking, operations, or the customer journey
- ask one helpful follow-up question when useful
- recommend booking a free audit only when it is a natural next step

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
    "why is",
    "why are",
    "where is",
    "when is",
  ];

  return (
    positiveTriggers.some((trigger) => normalized.includes(trigger)) &&
    !negativeTriggers.some((trigger) => normalized.includes(trigger))
  );
}

function findGlossaryTerm(normalized: string) {
  if (hasAny(normalized, ["mobile cta", "mobile call to action"])) {
    return "mobileCta";
  }

  if (hasAny(normalized, ["checkout continuity", "checkout path", "cart checkout", "cart/checkout"])) {
    return "checkoutContinuity";
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

  if (term === "conversionPath") {
    const cartVisible = asBoolean(getExactVisibilityValue(scanContext, "cartVisible"));
    const checkoutVisible = asBoolean(getExactVisibilityValue(scanContext, "checkoutVisible"));
    const mobileVisible = asBoolean(getExactVisibilityValue(scanContext, "mobileCtaVisibleAboveFold"));
    return `In this scan, the conversion path ${
      cartVisible || checkoutVisible || mobileVisible ? "shows some access points" : "was not clearly connected"
    } from action to cart/checkout.`;
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

  if (!term || !isDefinitionQuery(normalized)) {
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

  return {
    matched: true,
    topic: term,
    directAnswer: glossary.definition,
    evidence:
      observation || "The scan context did not include direct public-page evidence for this term.",
    businessMeaning: glossary.whyItMatters,
    suggestedFollowUp:
      "Do you want me to explain how this applies to the current store scan?",
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
function formatExactAnswer(answer: ExactAnswer) {
  const parts: string[] = [];

  if (answer.directAnswer) {
    parts.push(sanitizeEvidenceText(answer.directAnswer, { maxLength: 420 }));
  }

  if (answer.evidence) {
    // Present evidence as a short human-friendly observation rather than a field dump.
    parts.push(`What I see in the scan: ${sanitizeEvidenceText(answer.evidence, { maxLength: 420 })}`);
  }

  if (answer.businessMeaning) {
    parts.push(consultantMeaning(answer.businessMeaning));
  }

  if (answer.suggestedFollowUp) {
    parts.push(`If I were reviewing this manually, I would ask: ${sanitizeEvidenceText(answer.suggestedFollowUp, { maxLength: 200 })}`);
  }

  return parts.filter(Boolean).join("\n\n");
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

function buildFindingsAnswer(
  scanContext: Record<string, unknown>,
  topic: string,
  label: string,
): ExactAnswer | null {
  const findings = getCategoryFindings(scanContext, topic);

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
      `${priority.sentence} ${
        asString(topFinding.explanation) ||
        "This area can influence how clearly shoppers understand the journey and move toward purchase."
      }`,
    suggestedFollowUp:
      topic === "ux"
        ? "Do you want me to compare the UX findings with conversion?"
        : "Do you want me to show what Opun would fix first?",
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
  return asArray(scanContext.whatToReviewFirst).map(asRecord);
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
    directAnswer: `The main technical concern is ${title}. What stands out technically is that ${summary}.`,
    evidence: finding
      ? findingEvidence(finding)
      : "The scan only uses public storefront signals, so I would verify these in a browser and platform-aware walkthrough.",
    businessMeaning:
      `${priority.sentence} This is worth prioritizing because technical uncertainty can affect how confidently the team interprets checkout, tracking, and storefront-structure recommendations.`,
    suggestedFollowUp:
      "Do you want me to compare the technical signals with tracking visibility?",
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
      `${priority.sentence} Shoppers can see an action, but the bigger concern is whether the primary next step is obvious enough on a small screen.`,
    suggestedFollowUp: actionText
      ? `Do you want me to walk through the first action: ${sanitizeEvidenceText(actionText, { maxLength: 120 })}?`
      : "Do you want me to compare the CTA issue with the conversion findings?",
  };
}

function getExactAnswer(
  message: string,
  rawScanContext: unknown,
): ExactAnswer {
  const scanContext = asRecord(rawScanContext);
  const normalized = normalizeText(message);
  const exact = getNestedRecord(scanContext, "exactCommerceVisibility");

  const glossaryAnswer = buildGlossaryExactAnswer(message, scanContext);
  if (glossaryAnswer.matched) {
    return glossaryAnswer;
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

    const business =
      "Failed requests and console errors can affect script execution, tracking, and storefront consistency. If I were reviewing this manually, I'd look at the platform signals and compare them with what you see in your dev tools.";

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
        "Do you want me to show what Opun would fix first?",
    };
  }

  if (hasAny(normalized, ["platform confidence", "confidence in platform"])) {
    const platform = asRecord(scanContext.platform);

    return {
      matched: true,
      topic: "platform_confidence",
      directAnswer: `Platform confidence is ${asString(platform.confidenceLabel) || "not labeled"}${
        typeof platform.confidence === "number" ? ` at ${platform.confidence}%` : ""
      }.`,
      evidence: asString(scanContext.platformVisibility) || "The scan included platform visibility context.",
      businessMeaning:
        "Platform confidence helps frame recommendations, but platform-specific work should still be confirmed in a human review.",
      suggestedFollowUp:
        "Do you want me to connect the platform signal to the technical findings?",
    };
  }

  if (hasAny(normalized, ["what platform", "which platform", "platform is this", "platform"])) {
    const platform = asRecord(scanContext.platform);
    const name = asString(platform.name) || "not confirmed";

    return {
      matched: true,
      topic: "platform",
      directAnswer: `The scan identifies ${name} as the likely platform.`,
      evidence: asString(scanContext.platformVisibility) || "The scan included platform visibility context.",
      businessMeaning:
        "Platform detection is useful context, but it should not be treated as a private-system inspection.",
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

  if (hasAny(normalized, ["ux findings", "ux issues", "ux/ui", "usability", "design issues"])) {
    return (
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

  if (hasAny(normalized, ["what to fix first", "fix first", "opun fix first", "review first"])) {
    const primary = getPrimaryConcern(scanContext);
    const action = getActionItems(scanContext)[0];
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
      directAnswer: `I would review ${title} first, and this ${priority.phrase}.`,
      evidence:
        asString(primary.evidenceSummary) ||
        asString(action.evidenceClue) ||
        "The scan ranked this as the clearest next review area.",
      businessMeaning:
        `${priority.sentence} ${
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
        `${asString(primary.explanation) ||
          "This is the finding the scan suggests reviewing before broader optimization work."}`,
      suggestedFollowUp:
        "Do you want me to show what Opun would review first from that concern?",
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

      return NextResponse.json(
        {
          reply: formatExactAnswer(exactAnswer),
          suggestedReplies,
        },
        { status: 200 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { reply: "", suggestedReplies: [], fallback: true },
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
