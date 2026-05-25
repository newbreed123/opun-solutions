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
- connect findings to conversion, trust, tracking, operations, or the customer journey
- ask one helpful follow-up question when useful
- recommend booking a free audit only when it is a natural next step

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

function formatExactAnswer(answer: ExactAnswer) {
  return [
    `Direct answer: ${sanitizeEvidenceText(answer.directAnswer, { maxLength: 180 })}`,
    `Evidence from scan: ${sanitizeEvidenceText(answer.evidence, { maxLength: 260 })}`,
    `What it means: ${sanitizeEvidenceText(answer.businessMeaning, { maxLength: 220 })}`,
    `Next question: ${sanitizeEvidenceText(answer.suggestedFollowUp, { maxLength: 180 })}`,
  ].join("\n\n");
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

  return {
    matched: true,
    topic,
    directAnswer: `The scan found ${findings.length} ${label} finding${
      findings.length === 1 ? "" : "s"
    }. The strongest is ${findingTitle(topFinding)}.`,
    evidence: `${findingEvidence(topFinding)} Related ${label} findings: ${titles}.`,
    businessMeaning:
      asString(topFinding.explanation) ||
      "This area can influence how clearly shoppers understand the journey and move toward purchase.",
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

  return {
    matched: true,
    topic: "mobile_cta",
    directAnswer: `The scan says the mobile CTA is ${boolPhrase(
      mobileVisible,
    )}, but it may not be the strongest action path.`,
    evidence,
    businessMeaning:
      "Shoppers can see an action, but the report is asking whether the CTA hierarchy clearly guides the next purchase step.",
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
    const title =
      asString(primary.title) ||
      asString(primary.riskLabel) ||
      asString(action.title) ||
      asString(action.action) ||
      "the highest-priority scan issue";

    return {
      matched: true,
      topic: "fix_first",
      directAnswer: `I would review ${title} first.`,
      evidence:
        asString(primary.evidenceSummary) ||
        asString(action.evidenceClue) ||
        "The scan ranked this as the clearest next review area.",
      businessMeaning:
        asString(primary.explanation) ||
        asString(action.why) ||
        "Starting here keeps the review focused on the highest-friction part of the customer journey.",
      suggestedFollowUp:
        "Do you want me to explain why this should come before the other findings?",
    };
  }

  if (hasAny(normalized, ["primary operational concern", "primary concern", "biggest concern", "main concern"])) {
    const primary = getPrimaryConcern(scanContext);
    const title = asString(primary.title) || asString(primary.riskLabel);

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
      directAnswer: `The primary operational concern is ${title}.`,
      evidence:
        asString(primary.evidenceSummary) ||
        "The scan included this as the primary operational concern.",
      businessMeaning:
        asString(primary.explanation) ||
        "This is the finding the scan suggests reviewing before broader optimization work.",
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
      return NextResponse.json(
        {
          reply: formatExactAnswer(exactAnswer),
          suggestedReplies: [exactAnswer.suggestedFollowUp].filter(Boolean),
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
