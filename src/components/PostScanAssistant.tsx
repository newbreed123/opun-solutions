"use client";

import Link from "next/link";
import {
  FormEvent,
  MouseEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  ArrowRight,
  CalendarCheck,
  CircleHelp,
  Handshake,
  MessageCircle,
  SendHorizontal,
  ShieldAlert,
  Sparkles,
  Wrench,
} from "lucide-react";
import { buildAuditContactHref } from "@/lib/audit-attribution";
import { trackEvent } from "@/lib/analytics";
import {
  sanitizeEvidenceText,
  summarizeCtaLabels,
} from "@/lib/evidence-cleanup";

type Severity = "Low" | "Medium" | "High" | "Critical" | string;

type AssistantRecommendedStep = {
  title?: string;
  evidenceClue?: string;
  action: string;
  why: string;
};

type AssistantFinding = {
  title: string;
  category: string;
  primaryCategory?: string;
  secondaryCategories?: string[];
  severity: Severity;
  confidence?: string;
  businessImpact: string;
  recommendedFirstAction: string;
  evidenceSummary: string;
};

type AssistantConcern = {
  title?: string;
  riskLabel: string;
  severity: Severity;
  confidence?: string;
  explanation: string;
  evidenceSummary?: string;
  recommendedFirstAction: string;
  supportingFindings?: string[];
};

type StorefrontReviewSiteType =
  | "ecommerce-storefront"
  | "enterprise-retail"
  | "catalog-commerce"
  | "lead-generation"
  | "education/content-commerce"
  | "non-ecommerce-or-unclear"
  | "custom-enterprise";

type StorefrontReviewContext = {
  siteType: StorefrontReviewSiteType;
  confidence: string;
  reason: string;
  supportingSignals: string[];
};

type AssistantNarrativeProfile = {
  siteType?: string;
  archetype?: string;
  ecommerceProbability?: {
    label?: string;
    probability?: number;
  };
  platformConfidence?: {
    label?: string;
    score?: number;
    platformName?: string;
  };
  narrativeMode?: string;
  concernPriority?: string;
  languageRules?: string[];
  businessContext?: string;
  recommendedActionStyle?: string;
  narrativeProfileSummary?: string;
  recommendedFirstAction?: string;
};

type EcommerceProbability = {
  probability: number;
  label: "High" | "Moderate" | "Low" | "Unclear" | string;
  evidence: string[];
  negativeSignals: string[];
};

type AssistantCategory = {
  key: string;
  label: string;
  score: number;
  status: string;
  statusDetail?: string;
  purpose?: string;
  explanation: string;
  scoreExplanation?: {
    whyAssigned: string;
    evidenceInfluenced: string;
    whatWouldImprove: string;
  };
  priority: "Low" | "Medium" | "High";
  issues: string[];
  findings?: AssistantFinding[];
  influencingFindings?: string[];
};

type AssistantAudit = {
  scanId?: string;
  website: string;
  generatedAt: string;
  overallScore: number;
  overallStatus: string;
  auditNarrative?: string;
  currentNarrativeArchetype?: string;
  narrativeProfile?: AssistantNarrativeProfile;
  siteType?: StorefrontReviewSiteType;
  siteTypeReason?: string;
  storefrontReviewContext?: StorefrontReviewContext;
  executiveSummary: {
    summary: string;
    businessInterpretation: string;
  };
  primaryOperationalConcern?: AssistantConcern | null;
  topPriorityRisks: AssistantConcern[];
  heuristicFindings?: AssistantFinding[];
  categories?: AssistantCategory[];
  recommendedNextSteps: AssistantRecommendedStep[];
  benchmarkTags?: string[];
  benchmarkContext?: {
    summary: string;
    benchmarkTags: string[];
    notes?: {
      message: string;
      evidence: string;
      tags: string[];
      tone: "positive" | "negative" | "mixed";
    }[];
  };
  visualUxDiagnostics?: {
    score: number;
    findings: {
      title: string;
      evidenceSummary: string;
      businessImpact: string;
      recommendedFirstAction: string;
      severity: string;
      viewport: string;
    }[];
    summary: string;
    desktopConcerns: string[];
    mobileConcerns: string[];
    uxArchetype?: string | null;
    metrics?: {
      desktopGapPx?: number | null;
      desktopGapPercent?: number | null;
      contentToProductRatio?: number | null;
      desktopProductCardsAboveFold?: number;
      mobileProductCardsAboveFold?: number;
      firstDesktopProductY?: number | null;
      firstMobileProductY?: number | null;
    };
    visualMetricsDebug?: {
      contentSelector?: string | null;
      contentBoundingBox?: {
        left: number;
        top: number;
        width: number;
        height: number;
        right: number;
        textSample?: string;
      } | null;
      productGridSelector?: string | null;
      productGridBoundingBox?: {
        left: number;
        top: number;
        width: number;
        height: number;
        right: number;
        textSample?: string;
      } | null;
      viewportWidth?: number | null;
      contentX?: number | null;
      contentWidth?: number | null;
      productGridX?: number | null;
      productGridWidth?: number | null;
      gapPx?: number | null;
      gapPercent?: number | null;
      ratio?: number | null;
      measurementWarning?: string | null;
    };
  };
  storefrontIdentityProfile?: {
    domain: string;
    businessScale: string;
    architectureStyle: string;
    commerceMaturity: string;
    operationalPattern: string;
    platformConfidence: string;
    identitySignals: string[];
    identitySummary: string;
    identityOpening: string;
    identityFraming: string;
  };
  diagnostics: {
    finalUrl?: string;
    title?: string | null;
    metaDescription?: string | null;
    platformDetection: {
      name: string;
      platformName?: string;
      confidence: number;
      confidenceScore?: number;
      confidenceLabel: string;
      ecommerceProbability?: EcommerceProbability;
      evidence?: string[];
      explanation?: string;
      recommendation?: string;
    };
    technologyDetections: {
      label: string;
      detected: boolean;
    }[];
    commerceFlowSignals?: {
      cartVisible: boolean;
      checkoutVisible: boolean;
      productCatalogVisible: boolean;
      formVisible: boolean;
      ctaVisible: boolean;
      ctaCount: number;
      ctaLabels: string[];
    };
    conversionSignals?: {
      formCount: number;
      inputCount: number;
      ctaCount: number;
      ctaLabels: string[];
    };
    storefrontSignals?: {
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
    consoleErrors?: string[];
    failedRequests?: string[];
    warnings?: string[];
  };
};

type AssistantIntent =
  | "ask_priority"
  | "ask_ux"
  | "ask_conversion"
  | "ask_tracking"
  | "ask_trust"
  | "ask_operations"
  | "ask_technical"
  | "ask_metadata"
  | "ask_benchmark"
  | "ask_platform"
  | "ask_seriousness"
  | "ask_opzix_help"
  | "ask_booking"
  | "ask_clarification"
  | "unknown";

type ConversationTopic =
  | "ux"
  | "conversion"
  | "trust"
  | "tracking"
  | "operations"
  | "technical"
  | "metadata"
  | "benchmark"
  | "platform"
  | "priority"
  | "booking";

type PendingFollowUp =
  | "compare_with_conversion"
  | "explain_why_it_matters"
  | "show_opzix_fix_order"
  | "explain_tracking"
  | "explain_trust"
  | "explain_platform"
  | "book_audit";

type RetrievedFinding = {
  title: string;
  topic: ConversationTopic;
  categoryLabel?: string;
  severity?: Severity;
  confidence?: string;
  evidenceSummary?: string;
  explanation: string;
  recommendedFirstAction?: string;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  paragraphs: string[];
  points?: string[];
  cta?: boolean;
  topic?: ConversationTopic;
};

type PostScanAssistantProps = {
  audit: AssistantAudit;
};

type PostScanAssistantApiResponse = {
  reply?: string;
  suggestedReplies?: string[];
  fallback?: boolean;
};

type ConversationState = {
  currentTopic: ConversationTopic | null;
  lastIntent: AssistantIntent | null;
  lastQuestion: string | null;
  lastAnswerSummary: string | null;
  lastExplainedTopic: ConversationTopic | null;
  lastExpansionDepth: number;
  lastBusinessAngle: BusinessAngle | null;
  lastFindingDiscussed: RetrievedFinding | null;
  lastCategoryDiscussed: string | null;
  conversationStep: number;
  pendingFollowUp: PendingFollowUp | null;
  conversationDepthByTopic: Partial<Record<ConversationTopic, number>>;
};

type BusinessAngle =
  | "operational_risk"
  | "customer_behavior"
  | "analytics_reliability"
  | "conversion_impact"
  | "scaling_risk"
  | "support_burden"
  | "optimization_confidence";

type AssistantTurn = {
  message: ChatMessage;
  nextState: ConversationState;
};

type VisibilitySignal = {
  label: string;
  visible: boolean | null;
  evidence: string;
  businessMeaning: string;
};

type AnswerSectionTone = "direct" | "evidence" | "meaning" | "question";

type AnswerSection = {
  label: string;
  body: string;
  tone: AnswerSectionTone;
};

type ScanContext = {
  score: number;
  status: string;
  currentNarrativeArchetype?: string;
  narrativeProfile?: AssistantNarrativeProfile;
  siteType?: StorefrontReviewSiteType;
  siteTypeReason?: string;
  storefrontReviewContext?: StorefrontReviewContext;
  platform: AssistantAudit["diagnostics"]["platformDetection"];
  trackingTools: AssistantAudit["diagnostics"]["technologyDetections"];
  benchmarkTags: string[];
  auditNarrative?: string;
  primaryOperationalConcern: AssistantConcern | null;
  actionItems: AssistantRecommendedStep[];
  categoryFindings: Record<ConversationTopic, RetrievedFinding[]>;
  platformVisibility: string;
  commerceSignals: {
    productNavigation: VisibilitySignal;
    collectionLinks: VisibilitySignal;
    search: VisibilitySignal;
    cart: VisibilitySignal;
    checkout: VisibilitySignal;
    cta: VisibilitySignal;
    form: VisibilitySignal;
    catalog: VisibilitySignal;
  };
  metadata: {
    title: string | null;
    metaDescription: string | null;
    structuredData?: string[] | null;
    openGraph?: Record<string, string> | null;
  };
  consoleDiagnostics: {
    consoleErrors: string[];
    failedRequests: string[];
    warnings: string[];
  };
  benchmarkContext?: AssistantAudit["benchmarkContext"];
  visualUxDiagnostics?: AssistantAudit["visualUxDiagnostics"];
};

type QuickReplyIntent =
  | "ask_priority"
  | "ask_clarification"
  | "ask_opzix_help"
  | "ask_seriousness";

const quickReplies: { label: string; intent: QuickReplyIntent }[] = [
  { label: "What should I fix first?", intent: "ask_priority" },
  { label: "Why does this matter?", intent: "ask_clarification" },
  { label: "Can Opzix help with this?", intent: "ask_opzix_help" },
  { label: "How serious is this?", intent: "ask_seriousness" },
];

const compactFollowUpReplies = [
  "Compare with conversion",
  "Explain business impact",
  "What would Opzix fix first?",
  "Review This Audit With Opzix",
];

const answerSectionPattern =
  /^(Direct answer|Evidence from scan|Evidence|What it means|Business meaning|Next question):\s*(.+)$/i;

const quickReplyIcons: Record<QuickReplyIntent, typeof Wrench> = {
  ask_priority: Wrench,
  ask_clarification: CircleHelp,
  ask_opzix_help: Handshake,
  ask_seriousness: ShieldAlert,
};

const intentKeywords: Record<AssistantIntent, string[]> = {
  ask_priority: [
    "fix",
    "first",
    "priority",
    "priorities",
    "start",
    "next step",
    "next steps",
    "review first",
    "what should",
    "recommended fix order",
  ],
  ask_ux: [
    "ux",
    "ui",
    "ux/ui",
    "ux ui",
    "uxuiissues",
    "user experience",
    "usability",
    "readability",
    "mobile",
    "layout",
    "spacing",
    "alignment",
    "hierarchy",
    "whitespace",
    "visual",
    "product grid",
    "feels off",
    "navigation",
    "product/category",
    "product category",
    "collection",
    "product discovery",
    "design",
    "first screen",
  ],
  ask_conversion: [
    "conversion",
    "conversionissues",
    "convert",
    "cta",
    "purchase",
    "buy",
    "cart",
    "checkout",
    "sales",
    "funnel",
    "path to purchase",
  ],
  ask_tracking: [
    "tracking",
    "trackingissues",
    "analytics",
    "ga4",
    "gtm",
    "google tag manager",
    "meta pixel",
    "pixel",
    "tag",
    "attribution",
    "measurement",
    "marketing visibility",
  ],
  ask_trust: [
    "trust",
    "trustsignals",
    "confidence",
    "reassurance",
    "reviews",
    "returns",
    "shipping",
    "support",
    "security",
    "credibility",
  ],
  ask_operations: [
    "operations",
    "operationsissues",
    "operationscontinuity",
    "operational",
    "handoff",
    "automation",
    "fulfillment",
    "follow-up",
    "process",
    "workflow",
    "order",
  ],
  ask_technical: [
    "technical",
    "technicalissues",
    "platformvisibility",
    "performance",
    "console",
    "errors",
    "failed requests",
    "template",
    "speed",
  ],
  ask_metadata: [
    "metadata",
    "meta data",
    "meta title",
    "page title",
    "title tag",
    "meta description",
    "seo title",
    "seo description",
    "metadata summary",
    "metadataclarity",
  ],
  ask_benchmark: [
    "benchmark",
    "compare",
    "context",
    "pattern",
    "similar",
    "against",
  ],
  ask_platform: ["platform", "shopify", "woocommerce", "magento", "detected"],
  ask_seriousness: [
    "serious",
    "bad",
    "urgent",
    "risk",
    "severity",
    "problem",
    "concern",
    "priority level",
  ],
  ask_opzix_help: [
    "help",
    "opzix",
    "service",
    "support",
    "work with",
    "do you",
    "can you",
  ],
  ask_booking: [
    "book",
    "call",
    "schedule",
    "contact",
    "consultation",
    "strategy",
    "meeting",
    "audit",
  ],
  ask_clarification: [
    "explain",
    "more",
    "what does this mean",
    "what does that mean",
    "why",
    "matter",
    "important",
    "impact",
    "affect",
    "conversion",
    "trust",
    "tracking",
    "operations",
    "tell me about",
    "issues",
  ],
  unknown: [],
};

function getPrimaryConcern(audit: AssistantAudit) {
  return audit.primaryOperationalConcern ?? audit.topPriorityRisks[0] ?? null;
}

function assistantAuditAttribution(audit: AssistantAudit) {
  const concern = getPrimaryConcern(audit);

  return {
    scanId: audit.scanId,
    scannedUrl: audit.website,
    score: audit.overallScore,
    status: audit.overallStatus,
    primaryConcern:
      concern?.title || concern?.riskLabel || "Primary audit concern",
  };
}

function getPrimaryConcernLabel(audit: AssistantAudit) {
  return (
    getPrimaryConcern(audit)?.riskLabel ??
    "the first customer journey issue in the report"
  );
}

function getTrackingSummary(audit: AssistantAudit) {
  const visibleTools = audit.diagnostics.technologyDetections.filter(
    (tool) => tool.detected && isTrackingTool(tool),
  );

  if (visibleTools.length === 0) {
    return "No supported tracking or marketing tools were visible in the public page sample.";
  }

  return `${visibleTools.length} visible tracking or marketing signal${
    visibleTools.length === 1 ? "" : "s"
  }: ${visibleTools.map((tool) => tool.label).join(", ")}.`;
}

function isTrackingTool(tool: { label: string; detected: boolean }) {
  return !/shopify|bigcommerce|woocommerce|magento|platform|indicator/i.test(
    tool.label,
  );
}

function getPlatformName(
  platform: AssistantAudit["diagnostics"]["platformDetection"],
) {
  return platform.platformName || platform.name || "not confirmed";
}

function getEcommerceProbability(
  platform: AssistantAudit["diagnostics"]["platformDetection"],
) {
  return platform.ecommerceProbability;
}

function isGroceryNarrativeProfile(profile?: AssistantNarrativeProfile) {
  return profile?.narrativeMode === "Grocery / Supermarket Retail";
}

function groceryRetailAnswer() {
  return "This looks more like grocery / supermarket retail than a normal DTC brand. For this kind of site, I would prioritize search, departments, pickup/delivery clarity, weekly ad, and cart path before treating platform uncertainty as the main client-facing issue.";
}

function isLowEcommerceProbability(
  platform: AssistantAudit["diagnostics"]["platformDetection"],
) {
  return (
    getPlatformName(platform) === "Not an ecommerce storefront" ||
    getEcommerceProbability(platform)?.label === "Low"
  );
}

function isUnclearEcommerceProbability(
  platform: AssistantAudit["diagnostics"]["platformDetection"],
) {
  return (
    getPlatformName(platform) === "Ecommerce probability unclear" ||
    getEcommerceProbability(platform)?.label === "Unclear"
  );
}

function platformEvidenceSummary(
  platform: AssistantAudit["diagnostics"]["platformDetection"],
  fallback = "The scan included public-page platform visibility context.",
) {
  const evidence = platform.evidence?.filter(Boolean).slice(0, 3).join(" ");

  return sanitizeEvidenceText(
    evidence || platform.explanation || platform.recommendation || fallback,
    { maxLength: 340 },
  );
}

function buildPlatformDirectAnswer(
  platform: AssistantAudit["diagnostics"]["platformDetection"],
  normalizedQuestion = "",
) {
  const name = getPlatformName(platform);
  const ecommerceProbability = getEcommerceProbability(platform);
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

function getPlatformSummary(audit: AssistantAudit) {
  const platform = audit.diagnostics.platformDetection;
  const name = getPlatformName(platform);
  const ecommerceProbability = getEcommerceProbability(platform);

  if (isLowEcommerceProbability(platform)) {
    return "Ecommerce probability is low. The public scan does not expose enough product, cart, checkout, or purchase-flow evidence to classify this as a standard ecommerce storefront.";
  }

  if (isUnclearEcommerceProbability(platform)) {
    return "Ecommerce probability is unclear. The page may support commerce elsewhere, but this URL does not expose enough public commerce signals for a confident platform call.";
  }

  if (name === "Enterprise / Custom Commerce Stack") {
    return "Enterprise / Custom Commerce Stack is the safer interpretation. Standard platform evidence is intentionally limited or not exposed, so I would manually confirm the commerce stack.";
  }

  if (name === "Platform not confidently identified") {
    return "Platform not confidently identified. The scan found commerce-adjacent signals, but not enough strong Shopify, BigCommerce, WooCommerce, or Magento evidence.";
  }

  const probabilityText = ecommerceProbability
    ? ` Ecommerce probability is ${ecommerceProbability.label.toLowerCase()} at ${ecommerceProbability.probability}%.`
    : "";

  return `${name} visibility is ${platform.confidenceLabel.toLowerCase()} at ${platform.confidence}%.${probabilityText}`;
}

function getBenchmarkTags(audit: AssistantAudit) {
  return audit.benchmarkContext?.benchmarkTags?.length
    ? audit.benchmarkContext.benchmarkTags
    : (audit.benchmarkTags ?? []);
}

function getBenchmarkSummary(audit: AssistantAudit) {
  const tags = getBenchmarkTags(audit);
  const note = audit.benchmarkContext?.notes?.[0];

  if (audit.benchmarkContext?.summary) {
    return `${audit.benchmarkContext.summary}${
      note ? ` The clearest benchmark note is: ${note.message}` : ""
    }`;
  }

  if (tags.length > 0) {
    return `The benchmark tags point to ${tags.slice(0, 4).join(", ")}. Treat this as directional until a human review confirms the full storefront and checkout path.`;
  }

  return "The scan did not return detailed benchmark context, so I would treat the benchmark view as directional and focus on the concrete findings first.";
}

function humanTopicName(topic: ConversationTopic) {
  if (topic === "ux") return "UX";
  if (topic === "conversion") return "conversion";
  if (topic === "tracking") return "tracking";
  if (topic === "trust") return "trust";
  if (topic === "operations") return "operations";
  if (topic === "technical") return "technical";
  return topicLabel(topic)?.toLowerCase() ?? "this area";
}

function humanFindingTitle(
  finding: RetrievedFinding,
  topic: ConversationTopic,
) {
  const title = finding.title.trim();
  const genericTitles = [
    "technical",
    "conversion",
    "tracking",
    "operations",
    "ux/ui",
    "trust",
  ];

  if (!title || genericTitles.includes(title.toLowerCase())) {
    return `${humanTopicName(topic)} signals`;
  }

  return title;
}

function technicalSignalsSummary(audit: AssistantAudit) {
  const platform = audit.diagnostics.platformDetection;
  const failedCount = audit.diagnostics.failedRequests?.length ?? 0;
  const consoleCount = audit.diagnostics.consoleErrors?.length ?? 0;
  const warningCount = audit.diagnostics.warnings?.length ?? 0;
  const signals: string[] = [];

  if (
    isLowEcommerceProbability(platform) ||
    isUnclearEcommerceProbability(platform) ||
    platform.confidence < 70 ||
    /low|needs review/i.test(platform.confidenceLabel)
  ) {
    signals.push(
      isLowEcommerceProbability(platform)
        ? "the submitted URL did not expose enough public ecommerce evidence for standard storefront classification"
        : `the platform was only identified with ${platform.confidenceLabel.toLowerCase()} confidence`,
    );
  } else if (platform.name && platform.name !== "Unknown") {
    signals.push(
      `${platform.name} was the likely platform with ${platform.confidenceLabel.toLowerCase()} confidence`,
    );
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

  return signals.length > 0
    ? signals.join(", ")
    : "the public technical signals look relatively quiet in this lightweight scan";
}

function priorityTone(severity?: Severity) {
  const normalized = String(severity ?? "").toLowerCase();

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

function archetypeFrame(archetype?: string) {
  if (archetype === "technical-risk") {
    return "This matches the report's technical-risk framing, so platform confidence, storefront stability, script execution, and measurement confidence should stay central.";
  }

  if (archetype === "trust-deficit") {
    return "This matches the report's trust-deficit framing, so reassurance, purchase confidence, and buying comfort should stay central.";
  }

  if (archetype === "discovery-breakdown") {
    return "This matches the report's discovery-breakdown framing, so product intent, navigation clarity, search visibility, and category flow should stay central.";
  }

  if (
    archetype === "conversion-friction" ||
    archetype === "mobile-clarity-risk" ||
    archetype === "checkout-continuity-risk"
  ) {
    return "This matches the report's conversion-friction framing, so action path, CTA hierarchy, checkout readiness, and purchase momentum should stay central.";
  }

  if (archetype === "operational-clarity") {
    return "This matches the report's operational-clarity framing, so order communication, support handoff, returns clarity, and fulfillment expectations should stay central.";
  }

  if (archetype === "measurement-confidence-gap") {
    return "This matches the report's measurement-confidence framing, so tracking visibility, attribution evidence, and signal trust should stay central.";
  }

  return "";
}

function allScanEvidence(audit: AssistantAudit) {
  return [
    audit.auditNarrative,
    audit.executiveSummary.summary,
    audit.executiveSummary.businessInterpretation,
    audit.primaryOperationalConcern?.evidenceSummary,
    audit.primaryOperationalConcern?.explanation,
    audit.primaryOperationalConcern?.recommendedFirstAction,
    audit.primaryOperationalConcern?.supportingFindings?.join(" "),
    ...audit.topPriorityRisks.flatMap((risk) => [
      risk.title,
      risk.riskLabel,
      risk.explanation,
      risk.evidenceSummary,
      risk.recommendedFirstAction,
    ]),
    ...(audit.heuristicFindings ?? []).flatMap((finding) => [
      finding.title,
      finding.category,
      finding.primaryCategory,
      finding.secondaryCategories?.join(" "),
      finding.evidenceSummary,
      finding.businessImpact,
      finding.recommendedFirstAction,
    ]),
    ...(audit.categories ?? []).flatMap((category) => [
      category.key,
      category.label,
      category.status,
      category.statusDetail,
      category.purpose,
      category.explanation,
      category.scoreExplanation?.whyAssigned,
      category.scoreExplanation?.evidenceInfluenced,
      category.scoreExplanation?.whatWouldImprove,
      category.issues.join(" "),
      category.influencingFindings?.join(" "),
      category.findings?.map((finding) => finding.evidenceSummary).join(" "),
    ]),
    ...audit.recommendedNextSteps.flatMap((step) => [
      step.title,
      step.evidenceClue,
      step.action,
      step.why,
    ]),
    audit.benchmarkContext?.summary,
    audit.benchmarkContext?.benchmarkTags?.join(" "),
    audit.benchmarkContext?.notes
      ?.map((note) => `${note.message} ${note.evidence} ${note.tags.join(" ")}`)
      .join(" "),
    audit.diagnostics.warnings?.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
}

function firstEvidenceMatch(audit: AssistantAudit, patterns: RegExp[]) {
  const lines = allScanEvidence(audit)
    .split(/\n|(?<=\.)\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.find((line) => patterns.some((pattern) => pattern.test(line)));
}

function visibilityFromEvidence(evidence: string | undefined, label: RegExp) {
  if (!evidence || !label.test(evidence)) {
    return null;
  }

  const normalized = evidence.toLowerCase();
  const labelMatch = evidence.match(label);

  if (!labelMatch?.index && labelMatch?.index !== 0) {
    return null;
  }

  const afterLabel = normalized.slice(labelMatch.index, labelMatch.index + 120);

  if (
    /not visible|no visible|was not visible|were not visible/.test(afterLabel)
  ) {
    return false;
  }

  if (/visible|detected|prominent|present/.test(afterLabel)) {
    return true;
  }

  return null;
}

function boolLabel(value: boolean | null) {
  if (value === true) return "visible";
  if (value === false) return "not visible";
  return "not confirmed";
}

function directAnswerLabel(value: boolean | null) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not clearly";
}

function buildVisibilitySignal({
  label,
  visible,
  evidence,
  fallbackEvidence,
  businessMeaning,
}: {
  label: string;
  visible?: boolean;
  evidence?: string;
  fallbackEvidence?: string;
  businessMeaning: string;
}): VisibilitySignal {
  const resolvedVisible = visible ?? null;

  return {
    label,
    visible: resolvedVisible,
    evidence:
      evidence ??
      fallbackEvidence ??
      `The scan marked ${label.toLowerCase()} as ${boolLabel(resolvedVisible)}.`,
    businessMeaning,
  };
}

function metadataFinding(metadata: ScanContext["metadata"]): RetrievedFinding {
  const title = metadata.title ? "Metadata Visible" : "Metadata Needs Review";
  const evidenceSummary = [
    metadata.title
      ? `Page title: ${metadata.title}`
      : "Page title was not found.",
    metadata.metaDescription
      ? `Meta description: ${metadata.metaDescription}`
      : "Meta description was not found.",
  ].join(" ");

  return {
    title,
    topic: "metadata",
    categoryLabel: "Metadata",
    severity: metadata.title && metadata.metaDescription ? "Low" : "Medium",
    confidence: "High",
    evidenceSummary: sanitizeEvidenceText(evidenceSummary, { maxLength: 260 }),
    explanation:
      "Metadata affects how clearly the page presents itself in search results, browser tabs, and shared links.",
    recommendedFirstAction:
      "Confirm the page title and meta description are specific, readable, and aligned with the page's intended customer action.",
  };
}

function normalizeScanContext(audit: AssistantAudit): ScanContext {
  const commerce = audit.diagnostics.commerceFlowSignals;
  const storefront = audit.diagnostics.storefrontSignals;
  const productDiscoveryEvidence = firstEvidenceMatch(audit, [
    /product\/category navigation/i,
    /product category navigation/i,
    /product discovery/i,
    /collection\/product links/i,
  ]);
  const searchEvidence = firstEvidenceMatch(audit, [
    /search visible/i,
    /store search/i,
    /visible search/i,
  ]);
  const cartCheckoutEvidence = firstEvidenceMatch(audit, [
    /cart visibility/i,
    /checkout visibility/i,
    /cart and checkout/i,
  ]);

  const productNavigationVisible =
    storefront?.productNavigationVisible ??
    visibilityFromEvidence(
      productDiscoveryEvidence,
      /product\/category navigation|product category navigation/i,
    );
  const collectionLinksVisible =
    storefront?.collectionLinksVisible ??
    visibilityFromEvidence(
      productDiscoveryEvidence,
      /collection\/product links|collection links|product links/i,
    );
  const searchVisible =
    storefront?.searchVisible ??
    visibilityFromEvidence(searchEvidence, /search|store search/i);

  return {
    score: audit.overallScore,
    status: audit.overallStatus,
    currentNarrativeArchetype: audit.currentNarrativeArchetype,
    narrativeProfile: audit.narrativeProfile,
    siteType: audit.siteType ?? audit.storefrontReviewContext?.siteType,
    siteTypeReason:
      audit.siteTypeReason ?? audit.storefrontReviewContext?.reason,
    storefrontReviewContext: audit.storefrontReviewContext,
    platform: audit.diagnostics.platformDetection,
    trackingTools: audit.diagnostics.technologyDetections.filter(
      (tool) => tool.detected && isTrackingTool(tool),
    ),
    benchmarkTags: getBenchmarkTags(audit),
    auditNarrative: audit.auditNarrative,
    primaryOperationalConcern: getPrimaryConcern(audit),
    actionItems: getTopActionItems(audit),
    categoryFindings: {
      ux: getFindingsByCategory(audit, "ux"),
      conversion: getFindingsByCategory(audit, "conversion"),
      trust: getFindingsByCategory(audit, "trust"),
      tracking: getFindingsByCategory(audit, "tracking"),
      operations: getFindingsByCategory(audit, "operations"),
      technical: getFindingsByCategory(audit, "technical"),
      metadata: [
        metadataFinding({
          title: audit.diagnostics.title ?? null,
          metaDescription: audit.diagnostics.metaDescription ?? null,
        }),
      ],
      benchmark: getFindingsByCategory(audit, "benchmark"),
      platform: getFindingsByCategory(audit, "platform"),
      priority: [getHighestImpactFinding(audit)],
      booking: [getHighestImpactFinding(audit)],
    },
    platformVisibility: getPlatformSummary(audit),
    commerceSignals: {
      productNavigation: buildVisibilitySignal({
        label: "Product/category navigation",
        visible: productNavigationVisible ?? undefined,
        evidence: productDiscoveryEvidence,
        businessMeaning:
          "Shoppers may have a broad navigation path, but product discovery still depends on whether collections, products, and search are easy to reach.",
      }),
      collectionLinks: buildVisibilitySignal({
        label: "Collection/product links",
        visible: collectionLinksVisible ?? undefined,
        evidence: productDiscoveryEvidence,
        businessMeaning:
          "Collection or product links help shoppers move from general browsing into specific buying paths.",
      }),
      search: buildVisibilitySignal({
        label: "Search",
        visible: searchVisible ?? undefined,
        evidence: searchEvidence,
        businessMeaning:
          "Visible search is especially useful for catalog-heavy stores because it reduces the effort needed to find a product or category.",
      }),
      cart: buildVisibilitySignal({
        label: "Cart",
        visible: commerce?.cartVisible,
        evidence: cartCheckoutEvidence,
        businessMeaning:
          "A visible cart helps shoppers recover purchase intent and understand where their buying path continues.",
      }),
      checkout: buildVisibilitySignal({
        label: "Checkout",
        visible: commerce?.checkoutVisible,
        evidence: cartCheckoutEvidence,
        businessMeaning:
          "A visible checkout path reduces uncertainty once shoppers are ready to buy.",
      }),
      cta: buildVisibilitySignal({
        label: "CTA",
        visible: commerce?.ctaVisible,
        fallbackEvidence: commerce?.ctaLabels?.length
          ? summarizeCtaLabels(commerce.ctaLabels)
          : undefined,
        businessMeaning:
          "Visible CTAs give shoppers a clear next step, but the hierarchy still needs to make the primary action obvious.",
      }),
      form: buildVisibilitySignal({
        label: "Form",
        visible: commerce?.formVisible,
        businessMeaning:
          "Visible forms support lead capture or contact paths, but ecommerce stores still need a clear product and checkout path.",
      }),
      catalog: buildVisibilitySignal({
        label: "Product catalog",
        visible: commerce?.productCatalogVisible,
        businessMeaning:
          "A visible catalog is useful, but shoppers also need clear category, collection, search, cart, and checkout paths.",
      }),
    },
    metadata: {
      title: audit.diagnostics.title ?? null,
      metaDescription: audit.diagnostics.metaDescription ?? null,
      structuredData: null,
      openGraph: null,
    },
    visualUxDiagnostics: audit.visualUxDiagnostics,
    consoleDiagnostics: {
      consoleErrors: audit.diagnostics.consoleErrors ?? [],
      failedRequests: audit.diagnostics.failedRequests ?? [],
      warnings: audit.diagnostics.warnings ?? [],
    },
    benchmarkContext: audit.benchmarkContext,
  };
}

function buildAiScanContext(audit: AssistantAudit, context: ScanContext) {
  return {
    url: audit.website,
    score: context.score,
    status: context.status,
    currentNarrativeArchetype: context.currentNarrativeArchetype,
    narrativeProfile: context.narrativeProfile,
    siteType: context.siteType,
    siteTypeReason: context.siteTypeReason,
    storefrontReviewContext: context.storefrontReviewContext,
    auditNarrative:
      context.auditNarrative ?? audit.executiveSummary.businessInterpretation,
    primaryOperationalConcern: context.primaryOperationalConcern,
    whatToReviewFirst: context.actionItems.slice(0, 3),
    categoryScores: (audit.categories ?? []).map((category) => ({
      key: category.key,
      label: category.label,
      score: category.score,
      status: category.status,
      statusDetail: category.statusDetail,
      purpose: category.purpose,
      priority: category.priority,
      scoreExplanation: category.scoreExplanation,
    })),
    categoryFindings: context.categoryFindings,
    metadata: context.metadata,
    platformVisibility: context.platformVisibility,
    trackingVisibility: getTrackingSummary(audit),
    benchmarkContext: context.benchmarkContext,
    visualUxDiagnostics: context.visualUxDiagnostics,
    storefrontIdentityProfile: audit.storefrontIdentityProfile,
    commerceSignals: context.commerceSignals,
    exactCommerceVisibility: {
      mobileCtaVisibleAboveFold:
        audit.diagnostics.storefrontSignals?.mobileCtaVisibleAboveFold ?? null,
      mobileCtaLabels:
        audit.diagnostics.storefrontSignals?.mobileCtaLabels ?? [],
      desktopCtaVisible:
        audit.diagnostics.commerceFlowSignals?.ctaVisible ?? null,
      ctaLabels: audit.diagnostics.commerceFlowSignals?.ctaLabels ?? [],
      productNavigationVisible:
        audit.diagnostics.storefrontSignals?.productNavigationVisible ?? null,
      collectionLinksVisible:
        audit.diagnostics.storefrontSignals?.collectionLinksVisible ?? null,
      searchVisible: audit.diagnostics.storefrontSignals?.searchVisible ?? null,
      cartVisible: audit.diagnostics.commerceFlowSignals?.cartVisible ?? null,
      checkoutVisible:
        audit.diagnostics.commerceFlowSignals?.checkoutVisible ?? null,
    },
    rawDiagnostics: {
      platformDetection: audit.diagnostics.platformDetection,
      technologyDetections: audit.diagnostics.technologyDetections,
      commerceFlowSignals: audit.diagnostics.commerceFlowSignals,
      conversionSignals: audit.diagnostics.conversionSignals,
      storefrontSignals: audit.diagnostics.storefrontSignals,
      consoleErrors: audit.diagnostics.consoleErrors ?? [],
      failedRequests: audit.diagnostics.failedRequests ?? [],
      warnings: audit.diagnostics.warnings ?? [],
    },
  };
}

function messageToContent(message: ChatMessage) {
  return message.paragraphs.join("\n\n");
}

function summarizeAssistantMessage(message: ChatMessage) {
  return sanitizeEvidenceText(messageToContent(message), { maxLength: 320 })
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function splitAssistantReply(reply: string) {
  return reply
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function replySimilarity(left: string, right: string | null) {
  if (!left || !right) {
    return 0;
  }

  const leftTerms = new Set(
    normalizeText(left)
      .split(/\s+/)
      .filter((term) => term.length > 4),
  );
  const rightTerms = normalizeText(right)
    .split(/\s+/)
    .filter((term) => term.length > 4);

  if (leftTerms.size === 0 || rightTerms.length === 0) {
    return 0;
  }

  const overlap = rightTerms.filter((term) => leftTerms.has(term)).length;

  return overlap / Math.max(leftTerms.size, rightTerms.length);
}

function attachConversationProgression(
  turn: AssistantTurn,
  previousState: ConversationState,
  question: string,
  depthOverride?: number,
): AssistantTurn {
  const topic = turn.nextState.currentTopic;
  const conversationDepthByTopic = {
    ...previousState.conversationDepthByTopic,
    ...turn.nextState.conversationDepthByTopic,
  };
  const previousDepth = topic ? (conversationDepthByTopic[topic] ?? 0) : 0;
  const nextDepth =
    topic && depthOverride
      ? depthOverride
      : topic
        ? Math.max(previousDepth, 1)
        : previousDepth;

  if (topic) {
    conversationDepthByTopic[topic] = Math.min(5, nextDepth);
  }

  return {
    ...turn,
    nextState: {
      ...turn.nextState,
      lastQuestion: question,
      lastAnswerSummary: summarizeAssistantMessage(turn.message),
      lastExplainedTopic: topic ?? previousState.lastExplainedTopic,
      lastExpansionDepth:
        turn.nextState.lastExpansionDepth || previousState.lastExpansionDepth,
      lastBusinessAngle:
        turn.nextState.lastBusinessAngle ?? previousState.lastBusinessAngle,
      conversationDepthByTopic,
    },
  };
}

function buildLocalAssistantTurn(
  question: string,
  audit: AssistantAudit,
  scanContext: ScanContext,
  conversationState: ConversationState,
) {
  const intent = detectIntent(question);
  const detectedTopic = topicFromIntent(intent);
  const acknowledgementTurn = detectAcknowledgementIntent(question)
    ? buildAcknowledgementResponse(question, conversationState)
    : null;
  if (acknowledgementTurn) {
    return attachConversationProgression(
      acknowledgementTurn,
      conversationState,
      question,
    );
  }

  const directTurn = answerDirectQuestion(
    question,
    scanContext,
    conversationState,
  );
  const switchedTopicTurn =
    !directTurn &&
    intent !== "unknown" &&
    detectedTopic &&
    detectedTopic !== conversationState.currentTopic
      ? buildAssistantResponse(intent, audit, conversationState)
      : null;
  const expansionTurn =
    !directTurn &&
    !switchedTopicTurn &&
    shouldExpandCurrentTopic(question, conversationState)
      ? expandCurrentTopicResponse(
          question,
          audit,
          scanContext,
          conversationState,
        )
      : null;
  const continuationTurn =
    !directTurn &&
    !switchedTopicTurn &&
    !expansionTurn &&
    isAffirmativeFollowUp(question)
      ? buildFollowUpContinuation(audit, scanContext, conversationState)
      : null;
  const turn =
    directTurn ??
    switchedTopicTurn ??
    expansionTurn ??
    continuationTurn ??
    (intent !== "unknown"
      ? buildAssistantResponse(intent, audit, conversationState)
      : buildFallbackResponse(conversationState));

  return attachConversationProgression(turn, conversationState, question);
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s/-]/g, " ");
}

function sentenceFragment(value: string) {
  return value.trim().replace(/[.!?]+$/, "");
}

function textIncludesAny(value: string, keywords: string[]) {
  const normalized = normalizeText(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function getTopicKeywords(topic: ConversationTopic) {
  const keywords: Record<ConversationTopic, string[]> = {
    ux: intentKeywords.ask_ux,
    conversion: intentKeywords.ask_conversion,
    trust: intentKeywords.ask_trust,
    tracking: intentKeywords.ask_tracking,
    operations: intentKeywords.ask_operations,
    technical: intentKeywords.ask_technical,
    metadata: intentKeywords.ask_metadata,
    benchmark: intentKeywords.ask_benchmark,
    platform: intentKeywords.ask_platform,
    priority: intentKeywords.ask_priority,
    booking: intentKeywords.ask_booking,
  };

  return keywords[topic];
}

function topicLabel(topic: ConversationTopic | null) {
  const labels: Record<ConversationTopic, string> = {
    ux: "UX/UI",
    conversion: "Conversion",
    trust: "Trust signals",
    tracking: "Tracking visibility",
    operations: "Operations",
    technical: "Technical",
    metadata: "Metadata",
    benchmark: "Benchmark context",
    platform: "Platform",
    priority: "Fix order",
    booking: "Booking",
  };

  return topic ? labels[topic] : null;
}

function topicFromIntent(intent: AssistantIntent): ConversationTopic | null {
  const topics: Partial<Record<AssistantIntent, ConversationTopic>> = {
    ask_priority: "priority",
    ask_ux: "ux",
    ask_conversion: "conversion",
    ask_tracking: "tracking",
    ask_trust: "trust",
    ask_operations: "operations",
    ask_technical: "technical",
    ask_metadata: "metadata",
    ask_benchmark: "benchmark",
    ask_platform: "platform",
    ask_seriousness: "priority",
    ask_opzix_help: "booking",
    ask_booking: "booking",
  };

  return topics[intent] ?? null;
}

function categoryMatchesTopic(
  category: AssistantCategory,
  topic: ConversationTopic,
) {
  const haystack = [
    category.key,
    category.label,
    category.status,
    category.statusDetail,
    category.purpose,
    category.explanation,
    category.scoreExplanation?.whyAssigned,
    category.scoreExplanation?.evidenceInfluenced,
    category.scoreExplanation?.whatWouldImprove,
    category.issues.join(" "),
    category.influencingFindings?.join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  return textIncludesAny(haystack, getTopicKeywords(topic));
}

function findingMatchesTopic(
  finding: AssistantFinding,
  topic: ConversationTopic,
) {
  const haystack = [
    finding.title,
    finding.category,
    finding.primaryCategory,
    finding.secondaryCategories?.join(" "),
    finding.businessImpact,
    finding.evidenceSummary,
    finding.recommendedFirstAction,
  ]
    .filter(Boolean)
    .join(" ");

  return textIncludesAny(haystack, getTopicKeywords(topic));
}

function findingPrimaryMatchesTopic(
  finding: AssistantFinding,
  topic: ConversationTopic,
) {
  const primaryText = [finding.category, finding.primaryCategory, finding.title]
    .filter(Boolean)
    .join(" ");

  return textIncludesAny(primaryText, getTopicKeywords(topic));
}

function categoryPrimaryMatchesTopic(
  category: AssistantCategory,
  topic: ConversationTopic,
) {
  const primaryText = [category.key, category.label, category.purpose]
    .filter(Boolean)
    .join(" ");

  return textIncludesAny(primaryText, getTopicKeywords(topic));
}

function concernToFinding(
  concern: AssistantConcern,
  topic: ConversationTopic,
): RetrievedFinding {
  return {
    title: concern.title ?? concern.riskLabel,
    topic,
    categoryLabel: concern.riskLabel,
    severity: concern.severity,
    confidence: concern.confidence,
    evidenceSummary: sanitizeEvidenceText(concern.evidenceSummary),
    explanation: sanitizeEvidenceText(concern.explanation, { maxLength: 260 }),
    recommendedFirstAction: sanitizeEvidenceText(
      concern.recommendedFirstAction,
      {
        maxLength: 220,
      },
    ),
  };
}

function categoryToFinding(
  category: AssistantCategory,
  topic: ConversationTopic,
): RetrievedFinding {
  return {
    title: category.label,
    topic,
    categoryLabel: category.label,
    severity: category.priority,
    evidenceSummary: sanitizeEvidenceText(
      category.scoreExplanation?.evidenceInfluenced ??
        category.issues[0] ??
        category.statusDetail,
    ),
    explanation: sanitizeEvidenceText(
      category.scoreExplanation?.whyAssigned ??
        category.explanation ??
        category.status,
      { maxLength: 260 },
    ),
    recommendedFirstAction: sanitizeEvidenceText(
      category.scoreExplanation?.whatWouldImprove ?? category.issues[0],
      { maxLength: 220 },
    ),
  };
}

function heuristicToFinding(
  finding: AssistantFinding,
  topic: ConversationTopic,
): RetrievedFinding {
  return {
    title: finding.title,
    topic,
    categoryLabel:
      finding.primaryCategory ??
      finding.category ??
      finding.secondaryCategories?.[0],
    severity: finding.severity,
    confidence: finding.confidence,
    evidenceSummary: sanitizeEvidenceText(finding.evidenceSummary),
    explanation: sanitizeEvidenceText(finding.businessImpact, {
      maxLength: 260,
    }),
    recommendedFirstAction: sanitizeEvidenceText(
      finding.recommendedFirstAction,
      {
        maxLength: 220,
      },
    ),
  };
}

function stepToFinding(
  step: AssistantRecommendedStep,
  topic: ConversationTopic,
): RetrievedFinding {
  return {
    title: step.title ?? step.action,
    topic,
    evidenceSummary: sanitizeEvidenceText(step.evidenceClue),
    explanation: sanitizeEvidenceText(step.why, { maxLength: 260 }),
    recommendedFirstAction: sanitizeEvidenceText(step.action, {
      maxLength: 220,
    }),
  };
}

function severityRank(severity?: Severity) {
  const normalized = String(severity ?? "").toLowerCase();

  if (normalized.includes("critical")) return 5;
  if (normalized.includes("high")) return 4;
  if (normalized.includes("medium") || normalized.includes("moderate"))
    return 3;
  if (normalized.includes("low")) return 2;
  return 1;
}

function dedupeFindings(findings: RetrievedFinding[]) {
  const seen = new Set<string>();

  return findings.filter((finding) => {
    const key = `${finding.title}-${finding.evidenceSummary ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getFindingsByCategory(
  audit: AssistantAudit,
  category: ConversationTopic,
) {
  const findings: RetrievedFinding[] = [];
  const addHeuristic = (finding: AssistantFinding) =>
    findings.push(heuristicToFinding(finding, category));
  const addCategory = (item: AssistantCategory) =>
    findings.push(categoryToFinding(item, category));

  audit.heuristicFindings?.forEach((finding) => {
    if (findingPrimaryMatchesTopic(finding, category)) {
      addHeuristic(finding);
    }
  });

  audit.categories?.forEach((item) => {
    if (categoryPrimaryMatchesTopic(item, category)) {
      addCategory(item);
    }

    item.findings?.forEach((finding) => {
      if (findingPrimaryMatchesTopic(finding, category)) {
        addHeuristic(finding);
      }
    });
  });

  audit.heuristicFindings?.forEach((finding) => {
    if (
      !findingPrimaryMatchesTopic(finding, category) &&
      findingMatchesTopic(finding, category)
    ) {
      addHeuristic(finding);
    }
  });

  audit.categories?.forEach((item) => {
    if (
      !categoryPrimaryMatchesTopic(item, category) &&
      categoryMatchesTopic(item, category)
    ) {
      addCategory(item);
    }

    item.findings?.forEach((finding) => {
      if (
        !findingPrimaryMatchesTopic(finding, category) &&
        findingMatchesTopic(finding, category)
      ) {
        addHeuristic(finding);
      }
    });
  });

  const concern = getPrimaryConcern(audit);
  if (
    concern &&
    textIncludesAny(
      [
        concern.title,
        concern.riskLabel,
        concern.explanation,
        concern.evidenceSummary,
        concern.recommendedFirstAction,
        concern.supportingFindings?.join(" "),
      ]
        .filter(Boolean)
        .join(" "),
      getTopicKeywords(category),
    )
  ) {
    findings.push(concernToFinding(concern, category));
  }

  audit.topPriorityRisks.forEach((risk) => {
    if (
      textIncludesAny(
        [
          risk.title,
          risk.riskLabel,
          risk.explanation,
          risk.evidenceSummary,
          risk.recommendedFirstAction,
        ]
          .filter(Boolean)
          .join(" "),
        getTopicKeywords(category),
      )
    ) {
      findings.push(concernToFinding(risk, category));
    }
  });

  audit.recommendedNextSteps.forEach((step) => {
    if (
      textIncludesAny(
        [step.title, step.evidenceClue, step.action, step.why]
          .filter(Boolean)
          .join(" "),
        getTopicKeywords(category),
      )
    ) {
      findings.push(stepToFinding(step, category));
    }
  });

  return dedupeFindings(findings).sort(
    (left, right) => severityRank(right.severity) - severityRank(left.severity),
  );
}

function getFindingByTopic(audit: AssistantAudit, topic: ConversationTopic) {
  if (topic === "metadata") {
    return metadataFinding({
      title: audit.diagnostics.title ?? null,
      metaDescription: audit.diagnostics.metaDescription ?? null,
    });
  }

  return (
    getFindingsByCategory(audit, topic)[0] ?? getHighestImpactFinding(audit)
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

function findingText(finding: RetrievedFinding) {
  return [
    finding.title,
    finding.categoryLabel,
    finding.evidenceSummary,
    finding.explanation,
    finding.recommendedFirstAction,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isVisualUxFinding(finding: RetrievedFinding) {
  const haystack = findingText(finding);

  return visualUxFindingKeywords.some((keyword) => haystack.includes(keyword));
}

function visualUxToFinding(
  finding: NonNullable<AssistantAudit["visualUxDiagnostics"]>["findings"][number],
): RetrievedFinding {
  return {
    title: finding.title,
    topic: "ux",
    categoryLabel: "Visual UX",
    severity: finding.severity,
    evidenceSummary: sanitizeEvidenceText(finding.evidenceSummary),
    explanation: sanitizeEvidenceText(finding.businessImpact, { maxLength: 260 }),
    recommendedFirstAction: sanitizeEvidenceText(finding.recommendedFirstAction, {
      maxLength: 220,
    }),
  };
}

function getVisualUxFindings(context: ScanContext) {
  const fromDiagnostics =
    context.visualUxDiagnostics?.findings?.map(visualUxToFinding) ?? [];

  if (fromDiagnostics.length > 0) {
    return fromDiagnostics;
  }

  return context.categoryFindings.ux.filter(isVisualUxFinding);
}

function getNavigationFindings(context: ScanContext) {
  return context.categoryFindings.ux.filter((finding) =>
    navigationFindingKeywords.some((keyword) => findingText(finding).includes(keyword)),
  );
}

function getVisualFirstPriorityFinding(context: ScanContext) {
  const visual = getVisualUxFindings(context)[0];
  if (visual) return { finding: visual, source: "visual" as const };

  const conversion = context.categoryFindings.conversion[0];
  if (conversion) return { finding: conversion, source: "conversion" as const };

  const navigation = getNavigationFindings(context)[0];
  if (navigation) return { finding: navigation, source: "navigation" as const };

  const technical = context.categoryFindings.technical[0];
  if (technical) return { finding: technical, source: "technical" as const };

  return null;
}

function visualUxMetricPhrase(context: ScanContext) {
  const metrics = context.visualUxDiagnostics?.metrics;
  const archetype = context.visualUxDiagnostics?.uxArchetype;
  const gapPx = metrics?.desktopGapPx;
  const gapPercent = metrics?.desktopGapPercent;
  const ratio = metrics?.contentToProductRatio;
  const parts: string[] = [];

  if (archetype) {
    parts.push(`This is being interpreted as ${archetype}.`);
  }

  if (typeof gapPx === "number" && Number.isFinite(gapPx) && typeof gapPercent === "number" && Number.isFinite(gapPercent)) {
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

  if (typeof ratio === "number" && Number.isFinite(ratio)) {
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
  finding: RetrievedFinding,
  score?: number,
  metricPhrase = "",
) {
  const scorePhrase =
    typeof score === "number" && Number.isFinite(score)
      ? ` The visual UX score is ${score}/100.`
      : "";
  const action = finding.recommendedFirstAction
    ? ` First fix: ${finding.recommendedFirstAction}`
    : "";
  const metricText = metricPhrase ? ` ${metricPhrase}` : "";

  return sanitizeEvidenceText(
    `The biggest visual UX issue is ${finding.title}.${metricText}${scorePhrase}${action}`,
    { maxLength: 520 },
  );
}

function getHighestImpactFinding(audit: AssistantAudit): RetrievedFinding {
  const concern = getPrimaryConcern(audit);
  if (concern) {
    return concernToFinding(concern, "priority");
  }

  const heuristic = [...(audit.heuristicFindings ?? [])].sort(
    (left, right) => severityRank(right.severity) - severityRank(left.severity),
  )[0];

  if (heuristic) {
    return heuristicToFinding(heuristic, "priority");
  }

  const lowestCategory = [...(audit.categories ?? [])].sort(
    (left, right) => left.score - right.score,
  )[0];

  if (lowestCategory) {
    return categoryToFinding(lowestCategory, "priority");
  }

  return {
    title: getPrimaryConcernLabel(audit),
    topic: "priority",
    explanation:
      audit.auditNarrative ?? audit.executiveSummary.businessInterpretation,
    recommendedFirstAction:
      audit.recommendedNextSteps[0]?.action ??
      "Review the highest-friction customer journey area first.",
  };
}

function getRelatedFindings(
  audit: AssistantAudit,
  finding: RetrievedFinding | null,
) {
  if (!finding) {
    return [];
  }

  const relatedTopics: Partial<Record<ConversationTopic, ConversationTopic[]>> =
    {
      ux: ["conversion", "trust"],
      conversion: ["ux", "trust", "tracking"],
      trust: ["conversion", "ux"],
      tracking: ["conversion", "technical"],
      operations: ["conversion", "technical"],
      technical: ["tracking", "operations"],
      metadata: ["technical", "platform"],
      benchmark: ["priority", "conversion"],
      platform: ["technical", "operations"],
      priority: ["conversion", "ux", "tracking"],
      booking: ["priority", "operations"],
    };

  return (relatedTopics[finding.topic] ?? [])
    .flatMap((topic) => getFindingsByCategory(audit, topic).slice(0, 1))
    .filter((item) => item.title !== finding.title)
    .slice(0, 2);
}

function getTopActionItems(audit: AssistantAudit) {
  const steps = audit.recommendedNextSteps.slice(0, 3);

  if (steps.length > 0) {
    return steps;
  }

  const finding = getHighestImpactFinding(audit);
  return [
    {
      title: finding.title,
      evidenceClue: finding.evidenceSummary,
      action:
        finding.recommendedFirstAction ??
        "Review this finding before changing campaigns or adding new tools.",
      why: finding.explanation,
    },
  ];
}

function buildInitialMessage(audit: AssistantAudit): ChatMessage {
  const finding = getHighestImpactFinding(audit);

  return {
    id: `assistant-initial-${audit.generatedAt}`,
    role: "assistant",
    paragraphs: [
      `I reviewed your scan. The strongest signal is ${finding.title}, based on ${sentenceFragment(
        finding.evidenceSummary ?? getPrimaryConcernLabel(audit),
      )}.`,
      "I can walk through the scan like an ecommerce review: UX, conversion, tracking, trust, operations, benchmark context, or the fix order.",
      "Where would you like to start?",
    ],
    topic: "priority",
  };
}

function buildMessage(
  id: string,
  paragraphs: string[],
  options?: {
    topic?: ConversationTopic;
    finding?: RetrievedFinding | null;
    points?: string[];
    cta?: boolean;
  },
): ChatMessage {
  return {
    id,
    role: "assistant",
    paragraphs,
    points: options?.points,
    cta: options?.cta,
    topic: options?.topic,
  };
}

function normalizeAnswerSectionLabel(
  label: string,
): Omit<AnswerSection, "body"> {
  const normalized = label.toLowerCase();

  if (normalized === "direct answer") {
    return { label: "Direct Answer", tone: "direct" };
  }

  if (normalized === "evidence" || normalized === "evidence from scan") {
    return { label: "Evidence", tone: "evidence" };
  }

  if (normalized === "what it means" || normalized === "business meaning") {
    return { label: "What It Means", tone: "meaning" };
  }

  return { label: "Next Question", tone: "question" };
}

function parseAnswerSections(paragraphs: string[]) {
  const sections: AnswerSection[] = [];

  paragraphs.forEach((paragraph, index) => {
    const trimmed = paragraph.trim();
    const match = trimmed.match(answerSectionPattern);

    if (match) {
      const section = normalizeAnswerSectionLabel(match[1]);
      sections.push({
        ...section,
        body: match[2].trim(),
      });
      return;
    }

    const hasStructuredLead =
      index > 0 &&
      sections.length >= 3 &&
      /^(do|would|should|can)\b/i.test(trimmed);

    if (hasStructuredLead) {
      sections.push({
        label: "Next Question",
        tone: "question",
        body: trimmed,
      });
    }
  });

  return sections.length >= 2 ? sections : null;
}

function compactSectionText(text: string, maxLength = 300) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength).trimEnd()}...`;
}

function getDirectAnswerSignature(paragraphs: string[]) {
  const directAnswer = parseAnswerSections(paragraphs)?.find(
    (section) => section.tone === "direct",
  );

  return directAnswer?.body.toLowerCase().replace(/\s+/g, " ").trim() ?? null;
}

function sectionToneClassName(tone: AnswerSectionTone) {
  if (tone === "direct") {
    return "border-brand-cyan/35 bg-brand-cyan/12 text-primary";
  }

  if (tone === "question") {
    return "border-emerald-300/25 bg-emerald-300/10 text-primary";
  }

  return "border-white/10 bg-dark-deep/60 text-secondary";
}

function renderAssistantMessageContent({
  message,
  isInitialAssistantMessage,
  isRepeatedExactAnswer,
}: {
  message: ChatMessage;
  isInitialAssistantMessage: boolean;
  isRepeatedExactAnswer: boolean;
}) {
  const sections =
    !isInitialAssistantMessage && message.role === "assistant"
      ? parseAnswerSections(message.paragraphs)
      : null;

  if (sections) {
    return (
      <div className="space-y-2.5">
        {sections.map((section) => {
          const body =
            isRepeatedExactAnswer && section.tone === "evidence"
              ? "Same scan evidence as above; keeping this follow-up compact."
              : compactSectionText(
                  section.tone === "evidence"
                    ? sanitizeEvidenceText(section.body, { maxLength: 260 })
                    : section.body,
                  section.tone === "evidence" ? 260 : 360,
                );

          return (
            <div
              key={`${section.label}-${section.body}`}
              className={`max-w-[46rem] rounded-xl border px-3 py-3 sm:px-4 ${sectionToneClassName(
                section.tone,
              )}`}
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-cyan">
                {section.label}
              </p>
              <p className="mt-1.5 break-words text-sm leading-6">{body}</p>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 ${
        isInitialAssistantMessage ? "border-l-2 border-brand-cyan/70 pl-4" : ""
      }`}
    >
      {message.paragraphs.map((paragraph) => (
        <p key={paragraph} className="max-w-[46rem] break-words">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function pendingFollowUpForTopic(
  topic: ConversationTopic | null,
): PendingFollowUp | null {
  if (topic === "ux") return "compare_with_conversion";
  if (topic === "conversion") return "show_opzix_fix_order";
  if (topic === "tracking") return "explain_tracking";
  if (topic === "trust") return "explain_trust";
  if (topic === "platform" || topic === "technical" || topic === "metadata")
    return "explain_platform";
  if (topic === "priority" || topic === "operations" || topic === "benchmark") {
    return "explain_why_it_matters";
  }
  if (topic === "booking") return "book_audit";

  return null;
}

function isAffirmativeFollowUp(input: string) {
  const normalized = normalizeText(input).trim();

  return /^(yes|yeah|yep|sure|ok|okay|please|continue|go on|tell me more|explain|explain more|do that|show me|sounds good)$/.test(
    normalized,
  );
}

function isExpansionIntent(input: string) {
  const normalized = normalizeText(input).trim();

  return (
    /^(yes|yes please|yeah|yep|sure|please|continue|go on|tell me more|explain|explain more|go deeper|show me|do that|sounds good)$/.test(
      normalized,
    ) ||
    textIncludesAny(normalized, [
      "explain more",
      "yes please explain",
      "tell me more",
      "go deeper",
      "how so",
      "why",
      "explain",
      "what happens if",
      "if not fixed",
      "give me an example",
      "example",
      "continue",
    ])
  );
}

function topicFromText(value: string): ConversationTopic | null {
  const normalized = normalizeText(value);
  const topicOrder: ConversationTopic[] = [
    "tracking",
    "conversion",
    "trust",
    "operations",
    "technical",
    "platform",
    "ux",
    "benchmark",
    "booking",
    "priority",
  ];

  return (
    topicOrder.find((topic) =>
      textIncludesAny(normalized, getTopicKeywords(topic)),
    ) ?? null
  );
}

function topicFromFinding(finding: RetrievedFinding | null) {
  if (!finding) {
    return null;
  }

  if (finding.topic !== "priority" && finding.topic !== "booking") {
    return finding.topic;
  }

  return topicFromText(
    [
      finding.title,
      finding.categoryLabel,
      finding.evidenceSummary,
      finding.explanation,
      finding.recommendedFirstAction,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function resolveExpansionTopic(
  input: string,
  state: ConversationState,
): ConversationTopic | null {
  return (
    topicFromText(input) ??
    topicFromFinding(state.lastFindingDiscussed) ??
    state.currentTopic
  );
}

function shouldExpandCurrentTopic(input: string, state: ConversationState) {
  if (!isExpansionIntent(input)) {
    return false;
  }

  return Boolean(
    state.currentTopic ||
    state.lastFindingDiscussed ||
    state.pendingFollowUp ||
    state.lastAnswerSummary,
  );
}

function expansionDepthForQuestion(
  input: string,
  state: ConversationState,
  topic: ConversationTopic,
) {
  const normalized = normalizeText(input);
  const currentDepth = state.conversationDepthByTopic[topic] ?? 1;
  let depth = Math.min(5, currentDepth + 1);

  if (
    textIncludesAny(normalized, [
      "what happens if",
      "if not fixed",
      "if we do not",
    ])
  ) {
    return 3;
  }

  if (textIncludesAny(normalized, ["example", "give me an example"])) {
    return currentDepth >= 4 ? 5 : 4;
  }

  if (
    textIncludesAny(normalized, [
      "what should",
      "fix first",
      "next step",
      "action sequence",
    ])
  ) {
    return 5;
  }

  return depth;
}

function ecommerceExampleForTopic(topic: ConversationTopic) {
  const examples: Record<ConversationTopic, string> = {
    ux: "A practical example would be a mobile shopper landing from an ad, seeing several links and messages at once, and not immediately understanding where the product path begins.",
    conversion:
      "A practical example would be a shopper who likes the product but pauses because the primary action, cart path, or checkout next step is not obvious enough.",
    trust:
      "A practical example would be a new visitor reaching the purchase point but hesitating because reviews, returns, shipping, or payment reassurance are not close enough to the decision.",
    tracking:
      "A practical example would be scaling paid traffic and seeing more sessions, but not being able to trust whether product views, cart activity, checkout starts, or lead forms are being measured cleanly.",
    operations:
      "A practical example would be customers buying successfully, then creating extra support workload because order, returns, shipping, or contact expectations were not clear upfront.",
    technical:
      "A practical example would be a failed frontend request affecting a script that supports tracking, storefront consistency, or part of the buying path without making the whole store visibly break.",
    metadata:
      "A practical example would be a search result or shared link showing a vague title or missing description, so shoppers do not immediately understand the page before they click.",
    benchmark:
      "A practical example would be comparing the store against stronger ecommerce patterns and using that gap to decide whether discovery, trust, or measurement needs attention first.",
    platform:
      "A practical example would be making Shopify, Magento, or WooCommerce-specific recommendations before the platform signal is confirmed, which can send the team toward the wrong implementation path.",
    priority:
      "A practical example would be fixing visual polish first while the bigger issue is measurement, discovery, or checkout clarity, making it hard to know whether the work actually improved the buying path.",
    booking:
      "A practical example would be using the scan to focus a human audit on the few areas most likely to change decisions, instead of reviewing the whole storefront as a generic checklist.",
  };

  return examples[topic];
}

function businessAngleForDepth(
  topic: ConversationTopic,
  depth: number,
  lastAngle: BusinessAngle | null,
): BusinessAngle {
  const angleByTopic: Record<ConversationTopic, BusinessAngle[]> = {
    ux: ["customer_behavior", "conversion_impact", "optimization_confidence"],
    conversion: ["conversion_impact", "customer_behavior", "scaling_risk"],
    trust: ["customer_behavior", "conversion_impact", "scaling_risk"],
    tracking: [
      "analytics_reliability",
      "optimization_confidence",
      "scaling_risk",
    ],
    operations: ["support_burden", "operational_risk", "customer_behavior"],
    technical: [
      "operational_risk",
      "analytics_reliability",
      "optimization_confidence",
    ],
    metadata: [
      "customer_behavior",
      "optimization_confidence",
      "conversion_impact",
    ],
    benchmark: [
      "optimization_confidence",
      "conversion_impact",
      "operational_risk",
    ],
    platform: [
      "operational_risk",
      "optimization_confidence",
      "analytics_reliability",
    ],
    priority: [
      "optimization_confidence",
      "operational_risk",
      "conversion_impact",
    ],
    booking: ["operational_risk", "optimization_confidence", "support_burden"],
  };
  const angles = angleByTopic[topic];
  const preferred = angles[(Math.max(depth, 1) - 1) % angles.length];

  if (preferred !== lastAngle) {
    return preferred;
  }

  return angles.find((angle) => angle !== lastAngle) ?? preferred;
}

function businessAnglePhrase(angle: BusinessAngle, topic: ConversationTopic) {
  const phrases: Record<BusinessAngle, string> = {
    operational_risk:
      "The reason this matters operationally is that it can change what the team should validate before making fixes.",
    customer_behavior:
      "The real concern behind this finding is shopper behavior: people can lose momentum even when the page technically loads.",
    analytics_reliability:
      "The underlying business risk is analytics reliability: the team needs to trust what customer actions are being measured.",
    conversion_impact:
      "This matters for conversion because the issue sits close to whether interest turns into a clear next step.",
    scaling_risk:
      "This becomes important when traffic scaling begins because unclear signals make paid traffic harder to judge.",
    support_burden:
      "This matters for support because unclear expectations can turn normal customer questions into avoidable workload.",
    optimization_confidence:
      "The practical risk is optimization confidence: fixes are easier to prioritize when the team knows what the scan is really pointing to.",
  };

  if (topic === "tracking" && angle === "analytics_reliability") {
    return "You’re reviewing this early because measurement reliability affects how confidently the business can interpret conversion behavior.";
  }

  return phrases[angle];
}

function findingAnchor(
  topic: ConversationTopic,
  finding: RetrievedFinding,
  angle: BusinessAngle,
) {
  const topicName = topicLabel(topic)?.toLowerCase() ?? "this area";
  const title = finding.title;

  if (topic === "tracking") {
    return `You’re still looking at ${title}: the tracking question is whether the business can trust what it is seeing before it optimizes. ${businessAnglePhrase(
      angle,
      topic,
    )}`;
  }

  if (topic === "priority") {
    return `The active priority is ${title}. ${businessAnglePhrase(angle, topic)}`;
  }

  return `We’re talking about ${title} in ${topicName}. ${businessAnglePhrase(
    angle,
    topic,
  )}`;
}

function businessContextForTopic(
  topic: ConversationTopic,
  finding: RetrievedFinding,
) {
  const contexts: Record<ConversationTopic, string> = {
    ux: "The real risk is product discovery confusion. If shoppers cannot quickly understand the page hierarchy, they may not reach the product or action path you want them to take.",
    conversion:
      "The real risk is purchase momentum. A visitor can be interested and still drop off if the next action, cart path, or checkout step takes too much interpretation.",
    trust:
      "The real risk is hesitation. Trust cues do not need to be loud, but shoppers should see enough reassurance before they are asked to commit.",
    tracking:
      "The real risk is decision confidence. If the measurement layer is unclear, the team may not know which traffic, campaigns, or customer actions are actually producing results.",
    operations:
      "The real risk is post-purchase drag. Unclear support, order, shipping, or returns signals can turn normal customer questions into avoidable service workload.",
    technical:
      "The real risk is implementation certainty. I would not treat this as proof something is broken, but technical uncertainty can make platform, checkout, and tracking recommendations less reliable.",
    metadata:
      "The real risk is first-impression clarity. Page titles and descriptions help visitors, search engines, and shared links understand what the page is meant to do.",
    benchmark:
      "The real risk is prioritizing against the wrong comparison set. Benchmark context is useful when it helps decide what to inspect first, not when it becomes a generic scorecard.",
    platform:
      "The real risk is recommendation accuracy. If the platform signal is uncertain, platform-specific fixes should wait until the storefront technology is confirmed.",
    priority:
      "The real risk is fixing the visible symptom before the underlying operating constraint. The first review item should help the team make better decisions about the rest of the report.",
    booking:
      "The real risk is spreading attention too thin. A focused audit should validate the scan's strongest signal first, then decide which secondary issues deserve time.",
  };

  return `${contexts[topic]} In this scan, that connects to ${finding.title}.`;
}

function operationalConsequenceForTopic(topic: ConversationTopic) {
  const consequences: Record<ConversationTopic, string> = {
    ux: "If it is not addressed, more visitors can drift around the page without building enough product intent to continue.",
    conversion:
      "If it is not addressed, the store may keep attracting qualified visitors but lose them at the moment they need a clear next step.",
    trust:
      "If it is not addressed, paid traffic and first-time visitors may need more reassurance than the page is currently giving them.",
    tracking:
      "If it is not addressed, conversion fixes become harder to judge because the team may not know whether changes improved behavior or only changed what is visible in reports.",
    operations:
      "If it is not addressed, support questions, returns confusion, or order-status uncertainty can absorb time after the purchase.",
    technical:
      "If it is not addressed, the team may make recommendations on top of uncertain platform or frontend signals, which can create rework.",
    metadata:
      "If it is not addressed, the page can look less clear in search results or shared previews, even if the storefront itself is functioning.",
    benchmark:
      "If it is not addressed, the benchmark read can stay abstract instead of becoming a practical fix order.",
    platform:
      "If it is not addressed, platform-specific recommendations may be less accurate than they look.",
    priority:
      "If it is not addressed first, later fixes can become harder to evaluate because the main constraint is still unresolved.",
    booking:
      "If it is not addressed in a focused review, the scan may stay as a list of observations instead of becoming a practical plan.",
  };

  return consequences[topic];
}

function actionSequenceForTopic(
  topic: ConversationTopic,
  finding: RetrievedFinding,
  audit: AssistantAudit,
) {
  const firstAction =
    finding.recommendedFirstAction ??
    audit.recommendedNextSteps[0]?.action ??
    "validate the finding in a manual storefront walkthrough";
  const sequences: Record<ConversationTopic, string> = {
    ux: "The next thing I would check is whether the first mobile screen makes the product path, message hierarchy, and primary CTA obvious.",
    conversion:
      "The next thing I would check is the route from landing page to product, cart, checkout, and any lead form or purchase action.",
    trust:
      "The next thing I would check is whether reviews, returns, shipping, warranty, payment, and support cues appear close to purchase decisions.",
    tracking:
      "The next thing I would check is whether GA4 or GTM events connect to product views, cart activity, checkout actions, lead forms, and purchases.",
    operations:
      "The next thing I would check is whether support, shipping, returns, and order communication are clear before and after checkout.",
    technical:
      "The next thing I would check is the failed requests, platform signal, frontend scripts, and whether those signals affect tracking or checkout confidence.",
    metadata:
      "The next thing I would check is whether the title and meta description clearly describe the page, brand, and expected customer action.",
    benchmark:
      "The next thing I would check is which benchmark gap maps to an actual storefront action rather than a cosmetic improvement.",
    platform:
      "The next thing I would check is whether the detected platform matches the storefront source, checkout behavior, theme structure, and public technology signals.",
    priority:
      "The next thing I would check is whether the top finding blocks decision confidence, purchase momentum, or customer trust more than the secondary findings.",
    booking:
      "The next thing I would do is use the scan to structure a human review around the main constraint, then validate secondary issues in order.",
  };

  return `${sequences[topic]} First action: ${firstAction}`;
}

function buildAnchoredExpansionParagraphs({
  _baseParagraphs,
  depth,
  topic,
  finding,
  audit,
  priority,
  anchor,
}: {
  _baseParagraphs: string[];
  depth: number;
  topic: ConversationTopic;
  finding: RetrievedFinding;
  audit: AssistantAudit;
  priority: ReturnType<typeof priorityTone>;
  anchor: string;
}) {
  if (depth <= 2) {
    return [
      anchor,
      businessContextForTopic(topic, finding),
      `${priority.sentence} The first useful move is to understand the business meaning before jumping into fixes.`,
      continueQuestion(topic),
    ];
  }

  if (depth === 3) {
    return [
      anchor,
      `The operational consequence is this: ${operationalConsequenceForTopic(topic)}`,
      `That is why I would keep ${finding.title} near the top of the review instead of treating it as a minor note.`,
      "Do you want a practical example?",
    ];
  }

  if (depth === 4) {
    return [
      anchor,
      ecommerceExampleForTopic(topic),
      `For this scan, the example connects back to ${finding.title}: ${finding.explanation}`,
      "The useful question is whether this issue shows up in the full storefront journey, not only in the public-page sample.",
      "Do you want the recommended audit approach?",
    ];
  }

  return [
    anchor,
    "The recommended audit approach is to validate the active issue first, then check the related journey signals around it.",
    actionSequenceForTopic(topic, finding, audit),
    "After that, I would compare the result with the related findings so the team does not fix one symptom while leaving the bigger journey issue untouched.",
    topic === "booking"
      ? "Do you want to book a deeper audit?"
      : "Do you want to see where Opzix would help with that approach?",
  ];
}

function expandCurrentTopicResponse(
  input: string,
  audit: AssistantAudit,
  _context: ScanContext,
  state: ConversationState,
): AssistantTurn | null {
  const topic = resolveExpansionTopic(input, state);

  if (!topic) {
    return null;
  }

  const finding = state.lastFindingDiscussed ?? getFindingByTopic(audit, topic);
  const depth = expansionDepthForQuestion(input, state, topic);
  const priority = priorityTone(finding.severity);
  const businessAngle = businessAngleForDepth(
    topic,
    depth,
    state.lastBusinessAngle,
  );
  const anchor = findingAnchor(topic, finding, businessAngle);
  const paragraphs =
    depth <= 2
      ? [
          "Here’s how I’d think about it.",
          businessContextForTopic(topic, finding),
          `${priority.sentence} The first useful move is to understand the business meaning before jumping into fixes.`,
          continueQuestion(topic),
        ]
      : depth === 3
        ? [
            "The next layer is the operational consequence.",
            operationalConsequenceForTopic(topic),
            `That is why I would keep ${finding.title} near the top of the review instead of treating it as a minor note.`,
            "Do you want a practical example?",
          ]
        : depth === 4
          ? [
              ecommerceExampleForTopic(topic),
              `For this scan, the example connects back to ${finding.title}: ${finding.explanation}`,
              "The useful question is whether this issue shows up in the full storefront journey, not only in the public-page sample.",
              "Do you want the recommended action sequence?",
            ]
          : [
              "The action sequence I’d use is simple.",
              actionSequenceForTopic(topic, finding, audit),
              "After that, I would compare the result with the related findings so the team does not fix one symptom while leaving the bigger journey issue untouched.",
              topic === "booking"
                ? "Do you want to book a deeper audit?"
                : "Do you want to see where Opzix would help with that sequence?",
            ];
  const candidate = buildMessage(
    `assistant-expand-${topic}-${Date.now()}`,
    buildAnchoredExpansionParagraphs({
      _baseParagraphs: paragraphs,
      depth,
      topic,
      finding,
      audit,
      priority,
      anchor,
    }),
    { topic, finding, cta: topic === "booking" || depth >= 5 },
  );
  const lastSummary = state.lastAnswerSummary;
  const candidateSummary = summarizeAssistantMessage(candidate);
  const finalMessage =
    depth !== 3 && replySimilarity(candidateSummary, lastSummary) > 0.55
      ? buildMessage(
          `assistant-expand-alt-${topic}-${Date.now()}`,
          [
            anchor,
            ecommerceExampleForTopic(topic),
            actionSequenceForTopic(topic, finding, audit),
            "That gives the follow-up a different angle: not just what the scan found, but how I would validate it in the actual ecommerce workflow.",
            continueQuestion(topic),
          ],
          { topic, finding, cta: depth >= 5 },
        )
      : candidate;

  return {
    message: finalMessage,
    nextState: {
      ...createNextState(
        topic,
        "ask_clarification",
        finding,
        finding.categoryLabel ??
          state.lastCategoryDiscussed ??
          topicLabel(topic),
        state.conversationStep,
        pendingFollowUpForTopic(topic),
      ),
      conversationDepthByTopic: {
        ...state.conversationDepthByTopic,
        [topic]: depth,
      },
      lastExplainedTopic: topic,
      lastExpansionDepth: depth,
      lastBusinessAngle: businessAngle,
    },
  };
}

function buildScanAnswer({
  id,
  topic,
  directAnswer,
  evidence,
  businessMeaning,
  nextQuestion,
  finding,
  cta,
}: {
  id: string;
  topic: ConversationTopic;
  directAnswer: string;
  evidence: string;
  businessMeaning: string;
  nextQuestion: string;
  finding?: RetrievedFinding | null;
  cta?: boolean;
}): ChatMessage {
  return buildMessage(
    id,
    [
      `Direct answer: ${directAnswer}`,
      `Evidence: ${evidence}`,
      `Business meaning: ${businessMeaning}`,
      nextQuestion,
    ],
    { topic, finding, cta },
  );
}

function answerVisibilityQuestion(
  signal: VisibilitySignal,
  topic: ConversationTopic,
  nextQuestion: string,
  extraEvidence?: string,
): ChatMessage {
  return buildScanAnswer({
    id: `assistant-direct-${topic}-${Date.now()}`,
    topic,
    directAnswer: `${directAnswerLabel(signal.visible)}, ${signal.label.toLowerCase()} is ${boolLabel(signal.visible)} in this scan.`,
    evidence: extraEvidence
      ? `${signal.evidence} ${extraEvidence}`
      : signal.evidence,
    businessMeaning: signal.businessMeaning,
    nextQuestion,
  });
}

function buildFindingListAnswer(
  topic: ConversationTopic,
  context: ScanContext,
): ChatMessage {
  const findings = context.categoryFindings[topic] ?? [];
  const label = topicLabel(topic) ?? "this area";
  const topFinding = findings[0];

  if (!topFinding) {
    return buildScanAnswer({
      id: `assistant-direct-${topic}-${Date.now()}`,
      topic,
      directAnswer: `I do not see a specific ${label.toLowerCase()} finding in this scan.`,
      evidence:
        context.auditNarrative ??
        context.primaryOperationalConcern?.explanation ??
        "The scan did not return a named finding for that area.",
      businessMeaning:
        "That usually means this area was not the strongest public-page signal, but it may still be worth checking in a manual storefront review.",
      nextQuestion:
        "Do you want me to look at conversion, tracking, trust, operations, platform visibility, or what to fix first?",
    });
  }

  const priority = priorityTone(topFinding.severity);

  return buildMessage(
    `assistant-direct-${topic}-${Date.now()}`,
    [
      `Direct answer: What stands out to me in ${label.toLowerCase()} is ${humanFindingTitle(
        topFinding,
        topic,
      )}. The scan found ${findings.length} relevant finding${
        findings.length === 1 ? "" : "s"
      } in this area, and this ${priority.phrase}.`,
      `Evidence: ${
        topFinding.evidenceSummary ??
        topFinding.explanation ??
        "The scan surfaced this through the current report findings."
      }`,
      `Business meaning: ${priority.sentence} This usually matters because ${topFinding.explanation}`,
      continueQuestion(topic),
    ],
    {
      topic,
      finding: topFinding,
      points: findings
        .slice(0, 3)
        .map(
          (finding, index) =>
            `${index + 1}. ${finding.title}: ${
              finding.evidenceSummary ?? finding.explanation
            }`,
        ),
    },
  );
}

function buildMetadataAnswer(input: string, context: ScanContext): ChatMessage {
  const normalized = normalizeText(input);
  const title = context.metadata.title;
  const metaDescription = context.metadata.metaDescription;
  const finding =
    context.categoryFindings.metadata[0] ?? metadataFinding(context.metadata);
  const asksTitle = textIncludesAny(normalized, [
    "page title",
    "meta title",
    "title tag",
    "seo title",
  ]);
  const asksDescription = textIncludesAny(normalized, [
    "meta description",
    "seo description",
    "description",
  ]);

  if (asksTitle && !asksDescription) {
    return buildScanAnswer({
      id: `assistant-direct-metadata-title-${Date.now()}`,
      topic: "metadata",
      directAnswer: title
        ? `The page title is "${title}".`
        : "The scan did not find a page title in the loaded page metadata.",
      evidence:
        finding.evidenceSummary ?? "The scan checked the loaded page metadata.",
      businessMeaning:
        "The title tag shapes browser-tab clarity, search-result relevance, and the first cue people see before opening the page.",
      nextQuestion: "Do you want me to check the meta description too?",
    });
  }

  if (asksDescription) {
    return buildScanAnswer({
      id: `assistant-direct-metadata-description-${Date.now()}`,
      topic: "metadata",
      directAnswer: metaDescription
        ? `The meta description is "${metaDescription}".`
        : "The scan did not find a meta description in the loaded page metadata.",
      evidence:
        finding.evidenceSummary ?? "The scan checked the loaded page metadata.",
      businessMeaning:
        "The meta description helps set expectations in search results and shared previews; if it is missing or vague, the page can feel less clear before someone even lands on it.",
      nextQuestion: "Do you want me to connect this to the technical findings?",
    });
  }

  return buildScanAnswer({
    id: `assistant-direct-metadata-${Date.now()}`,
    topic: "metadata",
    directAnswer:
      title || metaDescription
        ? "The scan found public metadata for the loaded page."
        : "The scan did not find clear title or meta description metadata for the loaded page.",
    evidence: sanitizeEvidenceText(
      `${finding.evidenceSummary ?? "The scan checked the loaded page metadata."} Structured data and Open Graph fields are not exposed in the current scan context.`,
      { maxLength: 300 },
    ),
    businessMeaning:
      "Metadata matters because it controls the page's first impression in search results, browser tabs, and shared links. I would make sure it clearly describes the page and the expected customer action.",
    nextQuestion:
      "Do you want me to compare metadata with the technical findings?",
  });
}

function answerDirectQuestion(
  input: string,
  context: ScanContext,
  state: ConversationState,
): AssistantTurn | null {
  const normalized = normalizeText(input);
  const asksVisible = /\b(is|are|was|were|do|does|did|what)\b/.test(normalized);
  let message: ChatMessage | null = null;
  let topic: ConversationTopic | null = null;
  let finding: RetrievedFinding | null = null;

  if (detectIntent(input) === "ask_metadata") {
    topic = "metadata";
    message = buildMetadataAnswer(input, context);
    finding =
      context.categoryFindings.metadata[0] ?? metadataFinding(context.metadata);
  } else if (
    normalized.includes("is this ecommerce") ||
    normalized.includes("what kind of site") ||
    normalized.includes("site type") ||
    normalized.includes("what kind of business") ||
    normalized.includes("is this dtc") ||
    normalized.includes("is sprouts dtc") ||
    normalized.includes("why is this dtc") ||
    normalized.includes("why did it say dtc") ||
    normalized.includes("why platform is first") ||
    normalized.includes("why is platform first") ||
    normalized.includes(
      "why does this not sound like a normal ecommerce audit",
    ) ||
    normalized.includes(
      "why does it not sound like a normal ecommerce audit",
    ) ||
    normalized.includes("why does the scan sound ecommerce") ||
    (normalized.includes("why") &&
      normalized.includes("cart") &&
      normalized.includes("not visible"))
  ) {
    topic = "platform";
    const profile = context.narrativeProfile;
    const siteType = context.siteType ?? "non-ecommerce-or-unclear";
    const reason =
      context.siteTypeReason ??
      context.storefrontReviewContext?.reason ??
      "The scan classified the page from the public cart, checkout, catalog, CTA, form, platform, and metadata signals.";
    const supportingSignals =
      context.storefrontReviewContext?.supportingSignals
        ?.slice(0, 2)
        .join(" ") ?? "";
    const isStandardStorefront = siteType === "ecommerce-storefront";
    const isNonEcommerce = siteType === "non-ecommerce-or-unclear";
    const isEnterprise =
      siteType === "enterprise-retail" || siteType === "custom-enterprise";
    const ecommerceProbability = context.platform.ecommerceProbability;
    const lowProbability = isLowEcommerceProbability(context.platform);
    const unclearProbability = isUnclearEcommerceProbability(context.platform);

    message = buildScanAnswer({
      id: `assistant-direct-site-type-${Date.now()}`,
      topic,
      directAnswer: isGroceryNarrativeProfile(profile)
        ? groceryRetailAnswer()
        : profile?.narrativeMode
          ? `I would frame this as ${profile.narrativeMode.toLowerCase()}. ${profile.narrativeProfileSummary ?? profile.businessContext ?? ""}`.trim()
          : lowProbability
            ? "I would not classify this as an ecommerce storefront from the public scan. The page did not expose enough product, cart, checkout, or purchase-flow signals."
            : unclearProbability
              ? "The ecommerce probability is unclear from this URL. The page may support commerce elsewhere, but this scan should not assume a full ecommerce storefront without manual confirmation."
              : isStandardStorefront
                ? "Yes. From the public scan, this page exposes enough ecommerce signals to review it as a storefront."
                : isNonEcommerce
                  ? "I would not treat this URL as a confirmed ecommerce storefront from the public scan alone."
                  : isEnterprise
                    ? "This looks more like an enterprise or custom commerce environment than a standard storefront template."
                    : `I would classify this as ${siteType.replace(/-/g, " ")} from the public scan.`,
      evidence: ecommerceProbability
        ? sanitizeEvidenceText(
            `Ecommerce probability is ${ecommerceProbability.label} at ${ecommerceProbability.probability}%. ${ecommerceProbability.evidence.slice(0, 2).join(" ")} ${ecommerceProbability.negativeSignals.slice(0, 2).join(" ")}`,
          )
        : sanitizeEvidenceText(`${reason} ${supportingSignals}`),
      businessMeaning: isGroceryNarrativeProfile(profile)
        ? "Grocery retail has a different customer journey than a typical brand-owned DTC storefront: shoppers often start with search, departments, weekly offers, fulfillment choice, store location, loyalty, or cart recovery rather than lifestyle product storytelling."
        : profile?.businessContext
          ? `The audit sounds different because the scan is using ${profile.businessContext}. The first review priority is ${profile.concernPriority ?? "the visible journey context"}.`
          : lowProbability || isNonEcommerce
            ? "The first review question is whether this is the right commerce entry point, or whether buying happens elsewhere, behind login, through a lead path, or outside this public page."
            : isEnterprise
              ? "Cart, checkout, and platform details may be intentionally abstracted, so the scan should stay conservative until a manual review confirms the actual journey."
              : "The site type changes how I would read the findings: a catalog, lead-gen, or education journey should not be judged exactly like a retail checkout flow.",
      nextQuestion:
        "Do you want me to explain what this means for the scan priorities?",
    });
  } else if (
    asksVisible &&
    (normalized.includes("product/category") ||
      normalized.includes("product category") ||
      normalized.includes("product navigation") ||
      normalized.includes("category navigation"))
  ) {
    const collection = context.commerceSignals.collectionLinks;
    message = answerVisibilityQuestion(
      context.commerceSignals.productNavigation,
      "ux",
      "Would you like me to compare that with the conversion findings?",
      `Collection/product links were ${boolLabel(collection.visible)}.`,
    );
    topic = "ux";
  } else if (
    asksVisible &&
    (normalized.includes("collection") || normalized.includes("product links"))
  ) {
    message = answerVisibilityQuestion(
      context.commerceSignals.collectionLinks,
      "ux",
      "Would you like me to explain how that affects product discovery?",
    );
    topic = "ux";
  } else if (asksVisible && normalized.includes("search")) {
    message = answerVisibilityQuestion(
      context.commerceSignals.search,
      "ux",
      "Would you like me to compare that with the conversion findings?",
    );
    topic = "ux";
  } else if (asksVisible && normalized.includes("cart")) {
    message = answerVisibilityQuestion(
      context.commerceSignals.cart,
      "conversion",
      "Would you like me to connect that to the checkout findings?",
    );
    topic = "conversion";
  } else if (asksVisible && normalized.includes("checkout")) {
    message = answerVisibilityQuestion(
      context.commerceSignals.checkout,
      "conversion",
      "Would you like me to show what Opzix would fix first?",
    );
    topic = "conversion";
  } else if (
    normalized.includes("what platform") ||
    normalized.includes("which platform") ||
    normalized.includes("platform is this") ||
    normalized.includes("is this magento") ||
    normalized.includes("why did it say magento") ||
    normalized.includes("what is walmart built on") ||
    normalized.includes("custom enterprise stack")
  ) {
    topic = "platform";
    const isEnterpriseStack =
      getPlatformName(context.platform) ===
      "Enterprise / Custom Commerce Stack";
    message = buildScanAnswer({
      id: `assistant-direct-platform-${Date.now()}`,
      topic,
      directAnswer: buildPlatformDirectAnswer(context.platform, normalized),
      evidence: isEnterpriseStack
        ? platformEvidenceSummary(
            context.platform,
            "The public page exposes mixed or limited standard-platform evidence, which is common on custom or hybrid enterprise storefronts.",
          )
        : platformEvidenceSummary(
            context.platform,
            `${getPlatformName(context.platform)} was detected with ${context.platform.confidenceLabel.toLowerCase()} at ${context.platform.confidence}%.`,
          ),
      businessMeaning: isEnterpriseStack
        ? "Platform-specific assumptions should be manually confirmed before recommending Magento, Shopify, BigCommerce, or WooCommerce-specific fixes."
        : isLowEcommerceProbability(context.platform)
          ? "The scan should treat this URL as a possible lead-generation or informational entry point until a human confirms where the commerce journey actually starts."
          : "Platform detection is useful context for the review, but it should still be confirmed before making platform-specific recommendations.",
      nextQuestion:
        "Do you want me to connect the platform signal to the technical findings?",
    });
  } else if (
    asksVisible &&
    (normalized.includes("cta") || /\bbutton\b/.test(normalized))
  ) {
    message = answerVisibilityQuestion(
      context.commerceSignals.cta,
      "conversion",
      "Would you like me to compare that with the trust findings?",
    );
    topic = "conversion";
  } else if (asksVisible && /\bform\b/.test(normalized)) {
    message = answerVisibilityQuestion(
      context.commerceSignals.form,
      "operations",
      "Would you like me to separate quick wins from deeper operational fixes?",
    );
    topic = "operations";
  } else if (
    normalized.includes("tracking tools") ||
    normalized.includes("what tracking") ||
    normalized.includes("analytics") ||
    normalized.includes("ga4") ||
    normalized.includes("gtm") ||
    normalized.includes("pixel")
  ) {
    topic = "tracking";
    const tools = context.trackingTools.map((tool) => tool.label);
    message = buildScanAnswer({
      id: `assistant-direct-tracking-${Date.now()}`,
      topic,
      directAnswer: tools.length
        ? `The visible tracking tools are ${tools.join(", ")}.`
        : "No supported tracking or marketing tools were visible in the public page sample.",
      evidence: tools.length
        ? `${tools.length} visible tracking or marketing signal${tools.length === 1 ? "" : "s"}: ${tools.join(", ")}.`
        : "The public scan did not detect supported analytics, tag manager, pixel, or email marketing signals.",
      businessMeaning:
        "Tracking visibility affects how confidently you can interpret campaigns, conversion events, and funnel performance.",
      nextQuestion:
        "Do you want me to explain how this affects conversion measurement?",
    });
  } else if (
    normalized.includes("what ux issues") ||
    normalized.includes("ux issues") ||
    normalized.includes("ux/ui") ||
    normalized.includes("ui issues") ||
    normalized.includes("usability") ||
    normalized.includes("readability") ||
    normalized.includes("wrong with the layout") ||
    normalized.includes("layout feel") ||
    normalized.includes("page feel off") ||
    normalized.includes("mobile layout") ||
    normalized.includes("desktop ux") ||
    normalized.includes("desktop layout") ||
    normalized.includes("ux score low") ||
    normalized.includes("why is the ux score low") ||
    normalized.includes("why ux score") ||
    normalized.includes("fix visually") ||
    normalized.includes("visual issue") ||
    normalized.includes("visual ux") ||
    normalized.includes("alignment") ||
    normalized.includes("spacing") ||
    normalized.includes("hierarchy") ||
    normalized.includes("whitespace") ||
    normalized.includes("product grid")
  ) {
    topic = "ux";
    finding =
      getVisualUxFindings(context)[0] ??
      getVisualFirstPriorityFinding(context)?.finding ??
      null;
    message = finding
      ? buildScanAnswer({
          id: `assistant-direct-visual-ux-${Date.now()}`,
          topic,
          directAnswer: isVisualUxFinding(finding)
            ? visualUxDirectAnswer(
                finding,
                context.visualUxDiagnostics?.score,
                visualUxMetricPhrase(context),
              )
            : `The first UX-related issue I would review is ${finding.title}.`,
          evidence:
            finding.evidenceSummary ??
            "The scan found a visual hierarchy, layout, or product-discovery issue in the UX findings.",
          businessMeaning:
            finding.explanation ??
            "Layout, spacing, hierarchy, and product placement affect how quickly visitors understand where to browse or act.",
          nextQuestion:
            "Do you want me to compare this with conversion or product discovery?",
          finding,
        })
      : buildFindingListAnswer(topic, context);
  } else if (
    normalized.includes("ux issues") ||
    normalized.includes("ux/ui") ||
    normalized.includes("ui issues") ||
    normalized.includes("usability") ||
    normalized.includes("readability")
  ) {
    topic = "ux";
    message = buildFindingListAnswer(topic, context);
    finding = context.categoryFindings[topic][0] ?? null;
  } else if (
    normalized.includes("conversion issues") ||
    normalized.includes("sales issues") ||
    normalized.includes("purchase issues") ||
    normalized.includes("checkout issues") ||
    normalized.includes("what conversion")
  ) {
    topic = "conversion";
    message = buildFindingListAnswer(topic, context);
    finding = context.categoryFindings[topic][0] ?? null;
  } else if (
    normalized.includes("trust issues") ||
    normalized.includes("trust signals") ||
    normalized.includes("reviews") ||
    normalized.includes("shipping") ||
    normalized.includes("returns") ||
    normalized.includes("credibility")
  ) {
    topic = "trust";
    message = buildFindingListAnswer(topic, context);
    finding = context.categoryFindings[topic][0] ?? null;
  } else if (
    normalized.includes("operations") ||
    normalized.includes("fulfillment") ||
    normalized.includes("support") ||
    normalized.includes("order")
  ) {
    topic = "operations";
    message = buildFindingListAnswer(topic, context);
    finding = context.categoryFindings[topic][0] ?? null;
  }

  if (!message || !topic) {
    return null;
  }

  finding =
    finding ??
    context.categoryFindings[topic]?.[0] ??
    state.lastFindingDiscussed;

  return {
    message,
    nextState: createNextState(
      topic,
      "ask_clarification",
      finding,
      finding?.categoryLabel ??
        state.lastCategoryDiscussed ??
        topicLabel(topic),
      state.conversationStep,
      pendingFollowUpForTopic(topic),
    ),
  };
}

function buildFollowUpContinuation(
  audit: AssistantAudit,
  context: ScanContext,
  state: ConversationState,
): AssistantTurn | null {
  if (!state.pendingFollowUp) {
    return null;
  }

  if (state.pendingFollowUp === "compare_with_conversion") {
    const previous =
      state.lastFindingDiscussed ?? getFindingByTopic(audit, "ux");
    const conversion =
      context.categoryFindings.conversion[0] ??
      getFindingByTopic(audit, "conversion");

    return {
      message: buildScanAnswer({
        id: `assistant-followup-conversion-${Date.now()}`,
        topic: "conversion",
        directAnswer: `Compared with conversion, the related finding is ${conversion.title}.`,
        evidence:
          conversion.evidenceSummary ??
          "The scan ties conversion quality to CTA clarity, cart or checkout visibility, and trust near purchase decisions.",
        businessMeaning: `${previous.title} affects how easily shoppers understand the page; ${conversion.title} affects whether that understanding turns into a clear buying step.`,
        nextQuestion: "Do you want me to show what Opzix would fix first?",
        finding: conversion,
      }),
      nextState: createNextState(
        "conversion",
        "ask_conversion",
        conversion,
        conversion.categoryLabel,
        state.conversationStep,
        "show_opzix_fix_order",
      ),
    };
  }

  if (state.pendingFollowUp === "show_opzix_fix_order") {
    const turn = buildPriorityResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (state.pendingFollowUp === "explain_tracking") {
    const turn = buildTrackingResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (state.pendingFollowUp === "explain_trust") {
    const turn = buildTopicResponse(audit, "trust");
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (state.pendingFollowUp === "explain_platform") {
    const turn = buildPlatformResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (state.pendingFollowUp === "book_audit") {
    const turn = buildBookingResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (state.pendingFollowUp === "explain_why_it_matters") {
    const turn = buildClarificationResponse(audit, state);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  return null;
}

function continueQuestion(topic: ConversationTopic) {
  const questions: Record<ConversationTopic, string> = {
    ux: "Do you want me to compare this with the conversion findings?",
    conversion: "Do you want me to show what Opzix would fix first?",
    trust: "Do you want me to connect this to the purchase path?",
    tracking:
      "Do you want me to explain how this affects conversion measurement?",
    operations:
      "Do you want me to separate quick wins from deeper operational fixes?",
    technical:
      "Do you want me to compare this with the tracking visibility findings?",
    metadata: "Do you want me to compare this with the technical findings?",
    benchmark:
      "Do you want me to turn that benchmark context into a fix order?",
    platform:
      "Do you want me to connect the platform signal to the technical findings?",
    priority: "Do you want me to explain why that should come first?",
    booking: "Do you want to book a deeper audit?",
  };

  return questions[topic];
}

function buildTopicResponse(
  audit: AssistantAudit,
  topic: ConversationTopic,
): AssistantTurn {
  if (topic === "technical") {
    return buildTechnicalResponse(audit);
  }

  const finding = getFindingByTopic(audit, topic);
  const related = getRelatedFindings(audit, finding);
  const label = topicLabel(topic);
  const title = humanFindingTitle(finding, topic);
  const topicName = humanTopicName(topic);
  const priority = priorityTone(finding.severity);
  const frame = archetypeFrame(audit.currentNarrativeArchetype);

  const paragraphs = [
    `What stands out to me in ${topicName} is ${title}. Based on the report priority, this ${priority.phrase}.`,
    finding.evidenceSummary
      ? `If I were reviewing this manually, I would use this as the first clue: ${finding.evidenceSummary}`
      : `The scan is pointing to this pattern: ${finding.explanation}`,
    `${frame ? `${frame} ` : ""}${priority.sentence} The bigger concern is that ${finding.explanation} I would start here: ${
      finding.recommendedFirstAction ?? "Review the related storefront flow."
    }`,
    related.length > 0
      ? `I would keep ${related.map((item) => item.title).join(" and ")} nearby, because these issues often show up together in the customer journey.`
      : "I would keep this connected to the broader customer journey rather than treating it as an isolated issue.",
    continueQuestion(topic),
  ];

  return {
    message: buildMessage(`assistant-${topic}-${Date.now()}`, paragraphs, {
      topic,
      finding,
    }),
    nextState: createNextState(
      topic,
      `ask_${topic}` as AssistantIntent,
      finding,
      label,
    ),
  };
}

function buildTechnicalResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getFindingByTopic(audit, "technical");
  const summary = technicalSignalsSummary(audit);
  const priority = priorityTone(finding.severity);
  const title = humanFindingTitle(finding, "technical");
  const frame = archetypeFrame(audit.currentNarrativeArchetype);

  return {
    message: buildMessage(
      `assistant-technical-${Date.now()}`,
      [
        `The main technical concern is ${title}. What stands out technically is that ${summary}.`,
        `${frame ? `${frame} ` : ""}I would not treat this as proof the store is broken, but I would still treat it as ${priority.label === "High Priority" ? "a high-priority review item" : `something that ${priority.phrase}`} because technical uncertainty can affect checkout, tracking, and storefront-structure recommendations.`,
        finding.evidenceSummary
          ? `The useful clue from the report is: ${finding.evidenceSummary}`
          : "If I were reviewing this manually, I would check the failed requests, platform signal, page templates, and tracking scripts in the browser first.",
        continueQuestion("technical"),
      ],
      { topic: "technical", finding },
    ),
    nextState: createNextState(
      "technical",
      "ask_technical",
      finding,
      finding.categoryLabel ?? "Technical",
    ),
  };
}

function buildPriorityResponse(audit: AssistantAudit): AssistantTurn {
  const context = normalizeScanContext(audit);
  const priorities = getTopActionItems(audit);
  const visualFirst = getVisualFirstPriorityFinding(context);
  const finding =
    visualFirst?.source === "visual"
      ? visualFirst.finding
      : getHighestImpactFinding(audit);
  const priority = priorityTone(finding.severity);
  const frame = archetypeFrame(audit.currentNarrativeArchetype);
  const profile = audit.narrativeProfile;
  const firstAction =
    visualFirst?.source === "visual"
      ? finding.recommendedFirstAction
      : profile?.recommendedActionStyle ||
    priorities[0]?.action ||
    finding.recommendedFirstAction;

  return {
    message: buildMessage(
      `assistant-priority-${Date.now()}`,
      [
        isGroceryNarrativeProfile(profile)
          ? groceryRetailAnswer()
          : visualFirst?.source === "visual"
            ? visualUxDirectAnswer(
                finding,
                context.visualUxDiagnostics?.score,
                visualUxMetricPhrase(context),
              )
          : profile?.narrativeMode
            ? `I would start with the ${profile.narrativeMode.toLowerCase()} journey: ${firstAction}`
            : `I would start with ${finding.title}, because it is the clearest operational signal in this scan and it ${priority.phrase}.`,
        profile?.businessContext
          ? `That matters because this scan is framed around ${profile.businessContext}.`
          : `${frame ? `${frame} ` : ""}${priority.sentence}`,
        finding.evidenceSummary
          ? `The practical clue is: ${finding.evidenceSummary}`
          : "The scan is pointing to this as the first area to validate before changing campaigns or tooling.",
        firstAction
          ? `If I were reviewing this manually, I would start by doing this: ${firstAction}`
          : "The first practical action is to review the customer journey around this finding and confirm whether it shows up in the full storefront flow.",
        continueQuestion("priority"),
      ],
      {
        topic: "priority",
        finding,
        points: priorities.map(
          (step, index) =>
            `${index + 1}. ${step.title ?? step.action}: ${step.why}`,
        ),
        cta: true,
      },
    ),
    nextState: createNextState(
      "priority",
      "ask_priority",
      finding,
      finding.categoryLabel,
    ),
  };
}

function buildClarificationResponse(
  audit: AssistantAudit,
  state: ConversationState,
): AssistantTurn {
  if (state.currentTopic) {
    const topic = state.currentTopic;
    const finding =
      state.lastFindingDiscussed ?? getFindingByTopic(audit, topic);
    const priority = priorityTone(finding.severity);

    return {
      message: buildMessage(
        `assistant-clarify-${Date.now()}`,
        [
          `Here’s how I’d think about ${finding.title}. It ${priority.phrase}.`,
          `${priority.sentence} The business reason is that ${finding.explanation}`,
          finding.evidenceSummary
            ? `The useful scan clue is: ${finding.evidenceSummary}`
            : "The scan did not expose every internal detail, so I would treat this as a public-page signal to verify in a deeper review.",
          finding.recommendedFirstAction
            ? `The next thing I’d check is: ${finding.recommendedFirstAction}`
            : "The next sensible action is to inspect this part of the customer journey manually.",
          continueQuestion(topic),
        ],
        { topic, finding },
      ),
      nextState: createNextState(
        topic,
        "ask_clarification",
        finding,
        finding.categoryLabel ?? state.lastCategoryDiscussed,
        state.conversationStep,
      ),
    };
  }

  return {
    message: buildMessage(`assistant-clarify-${Date.now()}`, [
      "I can walk through the scan like a human review: UX, conversion, tracking, trust, operations, or what I would fix first.",
      "Where should we start?",
    ]),
    nextState: createNextState(
      null,
      "ask_clarification",
      null,
      null,
      state.conversationStep,
    ),
  };
}

function buildSeriousnessResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getHighestImpactFinding(audit);
  const severity =
    finding.severity ??
    getPrimaryConcern(audit)?.severity ??
    audit.overallStatus;
  const priority = priorityTone(severity);

  return {
    message: buildMessage(
      `assistant-serious-${Date.now()}`,
      [
        `I would treat this as ${priority.label.toLowerCase()} based on the scan score of ${audit.overallScore}/100 and status of ${audit.overallStatus}.`,
        `The main finding behind that read is ${finding.title}.`,
        finding.evidenceSummary
          ? `The clue I would pay attention to is: ${finding.evidenceSummary}`
          : "The scan found enough public evidence to justify a closer human review.",
        priority.sentence,
        continueQuestion("priority"),
      ],
      { topic: "priority", finding, cta: true },
    ),
    nextState: createNextState(
      "priority",
      "ask_seriousness",
      finding,
      finding.categoryLabel,
    ),
  };
}

function buildOpzixHelpResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getHighestImpactFinding(audit);

  return {
    message: buildMessage(
      `assistant-help-${Date.now()}`,
      [
        "Yes. Opzix can use this scan as the starting point for a practical ecommerce review, especially across UX, conversion flow, tracking visibility, operational handoffs, and trust cues.",
        `For this scan, I would validate ${finding.title} first, then check whether the related findings show up across the full storefront and checkout path.`,
        "The goal would be to separate quick wins from deeper fixes, not turn the report into a long generic checklist.",
        continueQuestion("booking"),
      ],
      { topic: "booking", finding, cta: true },
    ),
    nextState: createNextState(
      "booking",
      "ask_opzix_help",
      finding,
      finding.categoryLabel,
    ),
  };
}

function buildBookingResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getHighestImpactFinding(audit);

  return {
    message: buildMessage(
      `assistant-book-${Date.now()}`,
      [
        `A Free Ecommerce Audit is a sensible next step if you want a human review of ${finding.title} and the other scan findings.`,
        "Opzix can use the scan as a starting point, then review the storefront flow, tracking visibility, trust signals, and operational handoffs in more detail.",
        "Do you want to book a deeper audit?",
      ],
      { topic: "booking", finding, cta: true },
    ),
    nextState: createNextState(
      "booking",
      "ask_booking",
      finding,
      finding.categoryLabel,
    ),
  };
}

function buildPlatformResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getFindingByTopic(audit, "platform");

  return {
    message: buildMessage(
      `assistant-platform-${Date.now()}`,
      [
        getPlatformSummary(audit),
        "I would treat platform detection as context, not a final diagnosis. It helps frame which storefront patterns, checkout signals, and technical checks are most relevant.",
        `${getTrackingSummary(audit)} ${continueQuestion("platform")}`,
      ],
      { topic: "platform", finding },
    ),
    nextState: createNextState("platform", "ask_platform", finding, "Platform"),
  };
}

function buildMetadataResponse(audit: AssistantAudit): AssistantTurn {
  const metadata = {
    title: audit.diagnostics.title ?? null,
    metaDescription: audit.diagnostics.metaDescription ?? null,
  };
  const finding = metadataFinding(metadata);

  return {
    message: buildScanAnswer({
      id: `assistant-metadata-${Date.now()}`,
      topic: "metadata",
      directAnswer:
        metadata.title || metadata.metaDescription
          ? "The scan found public metadata for the loaded page."
          : "The scan did not find clear title or meta description metadata for the loaded page.",
      evidence:
        finding.evidenceSummary ?? "The scan checked the loaded page metadata.",
      businessMeaning:
        "Metadata matters because it shapes search snippets, browser tabs, and shared-link previews before someone reaches the page.",
      nextQuestion:
        "Do you want me to connect metadata with the technical findings?",
    }),
    nextState: createNextState("metadata", "ask_metadata", finding, "Metadata"),
  };
}

function buildTrackingResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getFindingByTopic(audit, "tracking");
  const trackingSummary = getTrackingSummary(audit);

  return {
    message: buildMessage(
      `assistant-tracking-${Date.now()}`,
      [
        trackingSummary,
        `What stands out on tracking is ${humanFindingTitle(finding, "tracking")}.`,
        finding.evidenceSummary
          ? `The useful clue is: ${finding.evidenceSummary}`
          : "The scan only sees public signals, so hidden server-side tracking may still exist.",
        `The bigger concern is measurement confidence: ${finding.explanation} ${continueQuestion("tracking")}`,
      ],
      { topic: "tracking", finding },
    ),
    nextState: createNextState(
      "tracking",
      "ask_tracking",
      finding,
      finding.categoryLabel,
    ),
  };
}

function buildBenchmarkResponse(audit: AssistantAudit): AssistantTurn {
  const finding = getFindingByTopic(audit, "benchmark");

  return {
    message: buildMessage(
      `assistant-benchmark-${Date.now()}`,
      [
        getBenchmarkSummary(audit),
        `I would connect that benchmark context back to ${finding.title}, because benchmarks are most useful when they clarify what to inspect first.`,
        continueQuestion("benchmark"),
      ],
      { topic: "benchmark", finding },
    ),
    nextState: createNextState(
      "benchmark",
      "ask_benchmark",
      finding,
      finding.categoryLabel,
    ),
  };
}

function buildFallbackResponse(state: ConversationState): AssistantTurn {
  return {
    message: buildMessage(`assistant-fallback-${Date.now()}`, [
      "I may not have enough from this scan to answer that exact question, but I can walk through UX, conversion, tracking, trust, operations, or what I would fix first.",
    ]),
    nextState: createNextState(
      state.currentTopic,
      "unknown",
      state.lastFindingDiscussed,
      state.lastCategoryDiscussed,
      state.conversationStep,
      state.pendingFollowUp,
    ),
  };
}

function detectAcknowledgementIntent(value: string) {
  const normalized = normalizeText(value).replace(/\s+/g, " ").trim();

  if (!normalized) {
    return false;
  }

  const acknowledgementPhrases = [
    "thanks",
    "thank you",
    "appreciate it",
    "got it",
    "understood",
    "makes sense",
    "okay",
    "ok",
    "cool",
    "perfect",
    "awesome",
    "great",
    "nice",
    "helpful",
    "that helps",
    "that was helpful",
  ];

  return acknowledgementPhrases.some(
    (phrase) =>
      normalized === phrase ||
      normalized === `that is ${phrase}` ||
      normalized === `that was ${phrase}` ||
      normalized === `${phrase} thanks`,
  );
}

function buildAcknowledgementResponse(
  input: string,
  state: ConversationState,
): AssistantTurn {
  const normalized = normalizeText(input);
  const reply = textIncludesAny(normalized, [
    "thanks",
    "thank you",
    "appreciate it",
  ])
    ? "You're welcome."
    : textIncludesAny(normalized, [
          "got it",
          "understood",
          "makes sense",
          "okay",
          "ok",
        ])
      ? "Makes sense."
      : "Glad that helped.";
  const softFollowUp =
    state.currentTopic && state.currentTopic !== "priority"
      ? "If you'd like, we can compare the top findings next."
      : "If you'd like, we can look at fix priority next.";

  return {
    message: buildMessage(`assistant-acknowledgement-${Date.now()}`, [
      `${reply} ${softFollowUp}`,
    ]),
    nextState: createNextState(
      state.currentTopic,
      "unknown",
      state.lastFindingDiscussed,
      state.lastCategoryDiscussed,
      state.conversationStep,
      state.pendingFollowUp,
    ),
  };
}

function detectIntent(value: string): AssistantIntent {
  const normalized = value.toLowerCase().trim();
  const normalizedSearch = normalizeText(value).replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "unknown";
  }

  if (textIncludesAny(normalizedSearch, intentKeywords.ask_metadata)) {
    return "ask_metadata";
  }

  if (
    /^(explain more|tell me more|what does this mean|what does that mean|why does that matter|why is that important|tell me about the issues)$/i.test(
      normalized,
    )
  ) {
    return "ask_clarification";
  }

  const scoredIntents = Object.entries(intentKeywords)
    .filter(([intent]) => intent !== "unknown")
    .map(([intent, keywords]) => ({
      intent: intent as AssistantIntent,
      score: keywords.reduce(
        (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  return scoredIntents[0]?.intent ?? "unknown";
}

function createNextState(
  topic: ConversationTopic | null,
  intent: AssistantIntent,
  finding: RetrievedFinding | null,
  category: string | null | undefined,
  previousStep = 0,
  pendingFollowUp: PendingFollowUp | null = pendingFollowUpForTopic(topic),
): ConversationState {
  return {
    currentTopic: topic,
    lastIntent: intent,
    lastQuestion: null,
    lastAnswerSummary: null,
    lastExplainedTopic: topic,
    lastExpansionDepth: previousStep,
    lastBusinessAngle: null,
    lastFindingDiscussed: finding,
    lastCategoryDiscussed: category ?? null,
    conversationStep: previousStep + 1,
    pendingFollowUp,
    conversationDepthByTopic: topic ? { [topic]: 1 } : {},
  };
}

function buildAssistantResponse(
  intent: AssistantIntent,
  audit: AssistantAudit,
  state: ConversationState,
): AssistantTurn {
  if (intent === "ask_priority") {
    const turn = buildPriorityResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_ux") {
    const turn = buildTopicResponse(audit, "ux");
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_conversion") {
    const turn = buildTopicResponse(audit, "conversion");
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_tracking") {
    const turn = buildTrackingResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_trust") {
    const turn = buildTopicResponse(audit, "trust");
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_operations") {
    const turn = buildTopicResponse(audit, "operations");
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_technical") {
    const turn = buildTopicResponse(audit, "technical");
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_metadata") {
    const turn = buildMetadataResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_benchmark") {
    const turn = buildBenchmarkResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_platform") {
    const turn = buildPlatformResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_seriousness") {
    const turn = buildSeriousnessResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_opzix_help") {
    const turn = buildOpzixHelpResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_booking") {
    const turn = buildBookingResponse(audit);
    return {
      ...turn,
      nextState: {
        ...turn.nextState,
        conversationStep: state.conversationStep + 1,
      },
    };
  }

  if (intent === "ask_clarification") {
    return buildClarificationResponse(audit, state);
  }

  return buildFallbackResponse(state);
}

export default function PostScanAssistant({ audit }: PostScanAssistantProps) {
  const initialMessage = useMemo(() => buildInitialMessage(audit), [audit]);
  const scanContext = useMemo(() => normalizeScanContext(audit), [audit]);
  const attribution = useMemo(() => assistantAuditAttribution(audit), [audit]);
  const contactHref = useMemo(
    () => buildAuditContactHref(attribution),
    [attribution],
  );
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(false);
  const userIsNearBottomRef = useRef(true);
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [freeTextQuestion, setFreeTextQuestion] = useState("");
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const [aiSuggestedReplies, setAiSuggestedReplies] = useState<string[]>([]);
  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      currentTopic: "priority",
      lastIntent: null,
      lastQuestion: null,
      lastAnswerSummary: summarizeAssistantMessage(initialMessage),
      lastExplainedTopic: "priority",
      lastExpansionDepth: 1,
      lastBusinessAngle: null,
      lastFindingDiscussed: getHighestImpactFinding(audit),
      lastCategoryDiscussed:
        getHighestImpactFinding(audit).categoryLabel ?? null,
      conversationStep: 0,
      pendingFollowUp: pendingFollowUpForTopic("priority"),
      conversationDepthByTopic: { priority: 1 },
    },
  );

  function updateAutoScrollPreference() {
    const messageList = messageListRef.current;

    if (!messageList) {
      userIsNearBottomRef.current = true;
      return;
    }

    const distanceFromBottom =
      messageList.scrollHeight -
      messageList.scrollTop -
      messageList.clientHeight;
    const isNearBottom = distanceFromBottom < 150;
    userIsNearBottomRef.current = isNearBottom;
  }

  function queueMessageAutoScroll({ force = false } = {}) {
    shouldAutoScrollRef.current = force || userIsNearBottomRef.current;
  }

  function scrollLatestMessageIntoView() {
    if (!shouldAutoScrollRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      const messageList = messageListRef.current;

      if (!messageList) {
        return;
      }

      messageEndRef.current?.scrollIntoView({
        block: "end",
        behavior: "auto",
      });
      messageList.scrollTop = messageList.scrollHeight;

      window.requestAnimationFrame(() => {
        messageList.scrollTop = messageList.scrollHeight;
        shouldAutoScrollRef.current = false;
      });
    });
  }

  useEffect(() => {
    scrollLatestMessageIntoView();
  }, [messages.length]);

  useEffect(() => {
    trackEvent("audit_assistant_opened", {
      ...attribution,
      sourceArea: "assistant",
    });
  }, [attribution]);

  useEffect(() => {
    const highestImpactFinding = getHighestImpactFinding(audit);

    shouldAutoScrollRef.current = false;
    userIsNearBottomRef.current = true;
    setMessages([buildInitialMessage(audit)]);
    setFreeTextQuestion("");
    setIsAssistantLoading(false);
    setAiSuggestedReplies([]);
    setConversationState({
      currentTopic: "priority",
      lastIntent: null,
      lastQuestion: null,
      lastAnswerSummary: summarizeAssistantMessage(buildInitialMessage(audit)),
      lastExplainedTopic: "priority",
      lastExpansionDepth: 1,
      lastBusinessAngle: null,
      lastFindingDiscussed: highestImpactFinding,
      lastCategoryDiscussed: highestImpactFinding.categoryLabel ?? null,
      conversationStep: 0,
      pendingFollowUp: pendingFollowUpForTopic("priority"),
      conversationDepthByTopic: { priority: 1 },
    });
  }, [audit.generatedAt, audit.website]);

  function handleQuickReply(label: string, intent: AssistantIntent) {
    if (isAssistantLoading) {
      return;
    }

    trackEvent("audit_assistant_message_sent", {
      ...attribution,
      sourceArea: "assistant",
    });

    const turn = attachConversationProgression(
      buildAssistantResponse(intent, audit, conversationState),
      conversationState,
      label,
    );

    queueMessageAutoScroll({ force: true });
    setMessages((current) => [
      ...current,
      {
        id: `user-${intent}-${Date.now()}`,
        role: "user",
        paragraphs: [label],
      },
      turn.message,
    ]);
    setConversationState(turn.nextState);
  }

  async function submitFreeTextQuestion(question: string) {
    trackEvent("audit_assistant_message_sent", {
      ...attribution,
      sourceArea: "assistant",
    });

    const userMessage: ChatMessage = {
      id: `user-free-text-${Date.now()}`,
      role: "user",
      paragraphs: [question],
    };
    const acknowledgementTurn = detectAcknowledgementIntent(question)
      ? buildAcknowledgementResponse(question, conversationState)
      : null;

    if (acknowledgementTurn) {
      const progressedTurn = attachConversationProgression(
        acknowledgementTurn,
        conversationState,
        question,
      );

      setFreeTextQuestion("");
      queueMessageAutoScroll({ force: true });
      setMessages((current) => [
        ...current,
        userMessage,
        progressedTurn.message,
      ]);
      setConversationState(progressedTurn.nextState);
      setAiSuggestedReplies([]);
      return;
    }

    const directTurn = answerDirectQuestion(
      question,
      scanContext,
      conversationState,
    );

    if (directTurn) {
      const progressedTurn = attachConversationProgression(
        directTurn,
        conversationState,
        question,
      );

      setFreeTextQuestion("");
      queueMessageAutoScroll({ force: true });
      setMessages((current) => [
        ...current,
        userMessage,
        progressedTurn.message,
      ]);
      setConversationState(progressedTurn.nextState);
      setAiSuggestedReplies([]);
      return;
    }

    const intent = detectIntent(question);
    const detectedTopic = topicFromIntent(intent);
    const shouldSwitchTopic =
      intent !== "unknown" &&
      detectedTopic &&
      detectedTopic !== conversationState.currentTopic;

    if (shouldSwitchTopic || intent === "ask_priority") {
      const progressedTurn = attachConversationProgression(
        buildAssistantResponse(intent, audit, conversationState),
        conversationState,
        question,
      );

      setFreeTextQuestion("");
      queueMessageAutoScroll({ force: true });
      setMessages((current) => [
        ...current,
        userMessage,
        progressedTurn.message,
      ]);
      setConversationState(progressedTurn.nextState);
      setAiSuggestedReplies([]);
      return;
    }

    const conversationHistory = [...messages, userMessage]
      .slice(-10)
      .map((message) => ({
        role: message.role,
        content: messageToContent(message),
      }));
    const localExpansionTurn = shouldExpandCurrentTopic(
      question,
      conversationState,
    )
      ? expandCurrentTopicResponse(
          question,
          audit,
          scanContext,
          conversationState,
        )
      : null;

    setFreeTextQuestion("");

    if (localExpansionTurn) {
      const progressedTurn = attachConversationProgression(
        localExpansionTurn,
        conversationState,
        question,
      );

      queueMessageAutoScroll({ force: true });
      setMessages((current) => [
        ...current,
        userMessage,
        progressedTurn.message,
      ]);
      setConversationState(progressedTurn.nextState);
      setAiSuggestedReplies([]);
      return;
    }

    queueMessageAutoScroll({ force: true });
    setMessages((current) => [...current, userMessage]);
    setIsAssistantLoading(true);

    try {
      const response = await fetch("/api/post-scan-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: question,
          conversationHistory,
          scanContext: buildAiScanContext(audit, scanContext),
        }),
      });
      const data = (await response.json()) as PostScanAssistantApiResponse;

      const aiReply = data.reply;

      if (!response.ok || data.fallback || !aiReply) {
        throw new Error("AI assistant unavailable");
      }

      const intent = detectIntent(question);
      const nextTopic =
        topicFromIntent(intent) ?? conversationState.currentTopic;
      const nextFinding = nextTopic
        ? getFindingByTopic(audit, nextTopic)
        : conversationState.lastFindingDiscussed;

      const assistantMessage: ChatMessage = {
        id: `assistant-ai-${Date.now()}`,
        role: "assistant",
        paragraphs: splitAssistantReply(aiReply),
        topic: nextTopic ?? undefined,
      };
      const progressedTurn = attachConversationProgression(
        {
          message: assistantMessage,
          nextState: createNextState(
            nextTopic,
            intent,
            nextFinding,
            nextFinding?.categoryLabel ??
              conversationState.lastCategoryDiscussed,
            conversationState.conversationStep,
          ),
        },
        conversationState,
        question,
      );

      queueMessageAutoScroll({ force: true });
      setMessages((current) => [...current, progressedTurn.message]);
      setConversationState(progressedTurn.nextState);
      setAiSuggestedReplies(data.suggestedReplies?.slice(0, 4) ?? []);
    } catch {
      const turn = buildLocalAssistantTurn(
        question,
        audit,
        scanContext,
        conversationState,
      );

      queueMessageAutoScroll({ force: true });
      setMessages((current) => [...current, turn.message]);
      setConversationState(turn.nextState);
      setAiSuggestedReplies([]);
    } finally {
      setIsAssistantLoading(false);
    }
  }

  function handleSuggestedReply(reply: string) {
    if (isAssistantLoading) {
      return;
    }

    void submitFreeTextQuestion(reply);
  }

  function handleFreeTextSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const question = freeTextQuestion.trim();

    if (!question || isAssistantLoading) {
      return;
    }

    void submitFreeTextQuestion(question);
  }

  function handleQuestionInputPointerDown(
    event: MouseEvent<HTMLInputElement> | PointerEvent<HTMLInputElement>,
  ) {
    if (document.activeElement === event.currentTarget) {
      return;
    }

    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
  }

  const currentTopicLabel = topicLabel(conversationState.currentTopic);
  const compactSuggestedReplies = useMemo(() => {
    const seen = new Set<string>();

    return [...aiSuggestedReplies, ...compactFollowUpReplies]
      .map((reply) => reply.trim())
      .filter((reply) => {
        const key = reply.toLowerCase();

        if (!reply || seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, 4);
  }, [aiSuggestedReplies]);

  return (
    <section
      aria-labelledby="post-scan-assistant-title"
      className="relative isolate max-w-full overflow-hidden rounded-[2rem] border border-brand-cyan/55 bg-gradient-to-br from-brand-blue/24 via-dark-card to-brand-cyan/12 p-4 shadow-[0_40px_110px_rgba(6,182,212,0.22),0_0_0_1px_rgba(255,255,255,0.055)_inset] sm:p-5 md:p-7"
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/90 to-transparent" />
      <div className="pointer-events-none absolute -right-24 -top-24 hidden h-64 w-64 rounded-full bg-brand-cyan/15 blur-3xl sm:block" />
      <div className="pointer-events-none absolute -bottom-28 left-10 hidden h-56 w-56 rounded-full bg-brand-blue/18 blur-3xl sm:block" />

      <div className="relative mb-6 flex flex-col gap-5 border-b border-brand-cyan/25 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row">
          <div className="relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl border border-brand-cyan/50 bg-gradient-to-br from-brand-cyan/25 to-brand-blue/10 text-brand-cyan shadow-[0_0_34px_rgba(6,182,212,0.32)]">
            <span className="absolute inset-1 rounded-[1.05rem] border border-white/10" />
            <MessageCircle className="relative h-8 w-8" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative inline-flex h-4 w-4 rounded-full border border-dark-deep bg-emerald-300" />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              Opzix Assistant
            </p>
            <h3
              id="post-scan-assistant-title"
              className="mt-2 text-2xl font-bold leading-tight text-primary sm:text-3xl md:text-4xl"
            >
              Scan Guidance
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary md:text-base">
              Strategic guidance on what the scan means, where to focus first,
              and when a deeper operational ecommerce review is worth booking.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-muted sm:text-xs sm:tracking-[0.16em]">
              <span className="rounded-full border border-brand-cyan/35 bg-brand-cyan/12 px-3 py-1.5 text-brand-cyan">
                Operational Ecommerce Review
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/12 px-3 py-1.5 text-emerald-100">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </span>
                Opzix is reviewing your scan
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-cyan/30 bg-dark-deep/85 p-4 text-sm leading-6 text-muted shadow-[0_20px_58px_rgba(2,8,23,0.32)] lg:max-w-sm">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            <Activity className="h-3.5 w-3.5" />
            Active Review
          </p>
          <p className="mt-2">
            Score {audit.overallScore}/100. {getPlatformSummary(audit)}{" "}
            {getTrackingSummary(audit)}
          </p>
        </div>
      </div>

      <div className="relative grid max-w-full gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.72fr)]">
        <div className="min-w-0 rounded-2xl border border-brand-cyan/30 bg-dark-deep/85 p-3 shadow-[0_26px_70px_rgba(2,8,23,0.34)] sm:p-4 md:p-5">
          {currentTopicLabel && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-cyan">
              <span className="h-2 w-2 rounded-full bg-brand-cyan" />
              Current topic: {currentTopicLabel}
            </div>
          )}

          <div
            ref={messageListRef}
            data-testid="assistant-message-list"
            onScroll={updateAutoScrollPreference}
            className="max-h-[min(52vh,34rem)] scroll-pb-6 overflow-y-auto overscroll-contain pr-1 pb-2 sm:pr-2 md:max-h-[min(58vh,38rem)]"
          >
            <div className="space-y-4" aria-live="polite">
              {messages.map((message, index) => {
                const isInitialAssistantMessage =
                  message.role === "assistant" &&
                  message.id.startsWith("assistant-initial");
                const directAnswerSignature =
                  message.role === "assistant"
                    ? getDirectAnswerSignature(message.paragraphs)
                    : null;
                const isRepeatedExactAnswer =
                  !!directAnswerSignature &&
                  messages
                    .slice(0, index)
                    .some(
                      (previousMessage) =>
                        previousMessage.role === "assistant" &&
                        getDirectAnswerSignature(previousMessage.paragraphs) ===
                          directAnswerSignature,
                    );

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-full rounded-2xl border leading-6 ${
                        message.role === "user"
                          ? "ml-auto w-fit border-brand-cyan/45 bg-brand-cyan/12 p-4 text-sm font-semibold text-primary shadow-[0_12px_32px_rgba(6,182,212,0.1)]"
                          : isInitialAssistantMessage
                            ? "border-brand-cyan/45 bg-gradient-to-br from-brand-cyan/16 via-white/[0.055] to-brand-blue/10 p-5 text-base text-primary shadow-[0_20px_54px_rgba(6,182,212,0.16)] md:p-6 md:text-lg md:leading-8"
                            : "border-white/10 bg-white/[0.045] p-4 text-sm text-secondary shadow-[0_12px_30px_rgba(2,8,23,0.16)]"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div
                          className={`mb-3 flex items-center gap-2 font-semibold uppercase text-brand-cyan ${
                            isInitialAssistantMessage
                              ? "text-xs tracking-[0.22em]"
                              : "text-xs tracking-[0.18em]"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isInitialAssistantMessage
                            ? "Primary Scan Observation"
                            : "Opzix Assistant"}
                        </div>
                      )}
                      {renderAssistantMessageContent({
                        message,
                        isInitialAssistantMessage,
                        isRepeatedExactAnswer,
                      })}
                      {message.points?.length ? (
                        <div className="mt-4 space-y-2">
                          {message.points.map((point) => (
                            <p
                              key={point}
                              className="rounded-xl border border-brand-cyan/20 bg-dark-deep/75 p-3 text-sm text-secondary"
                            >
                              {point}
                            </p>
                          ))}
                        </div>
                      ) : null}
                      {message.cta && (
                        <div className="mt-5">
                          <Link
                            href={contactHref}
                            onClick={() =>
                              trackEvent("audit_cta_clicked", {
                                ...attribution,
                                sourceArea: "assistant",
                              })
                            }
                            className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-xl border border-brand-cyan/50 bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-3 text-sm font-bold text-white shadow-[0_16px_40px_rgba(6,182,212,0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(6,182,212,0.36)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-dark-deep sm:w-auto"
                          >
                            Review This Audit With Opzix
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {isAssistantLoading && (
                <div className="flex justify-start">
                  <div className="max-w-full rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-secondary shadow-[0_12px_30px_rgba(2,8,23,0.16)]">
                    <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                      <Sparkles className="h-3.5 w-3.5" />
                      Opzix Assistant
                    </div>
                    <p className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand-cyan" />
                      </span>
                      Reviewing the scan context...
                    </p>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} aria-hidden="true" className="h-1" />
            </div>
          </div>

          <div className="mt-4 border-t border-brand-cyan/15 pt-4">
            <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
              Suggested follow-ups
            </p>
            <div className="flex flex-wrap gap-2">
              {compactSuggestedReplies.map((reply) => {
                const isBooking = /review this audit/i.test(reply);

                if (isBooking) {
                  return (
                    <Link
                      key={reply}
                      href={contactHref}
                      onClick={() =>
                        trackEvent("audit_cta_clicked", {
                          ...attribution,
                          sourceArea: "assistant",
                        })
                      }
                      className="inline-flex min-h-10 max-w-full items-center rounded-full border border-brand-cyan/55 bg-brand-cyan/18 px-3.5 py-2 text-xs font-bold text-primary shadow-[0_10px_28px_rgba(6,182,212,0.12)] transition-all hover:-translate-y-0.5 hover:bg-brand-cyan/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50"
                    >
                      {reply}
                    </Link>
                  );
                }

                return (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => handleSuggestedReply(reply)}
                    disabled={isAssistantLoading}
                    className="inline-flex min-h-10 max-w-full items-center rounded-full border border-white/10 bg-white/[0.055] px-3.5 py-2 text-left text-xs font-semibold text-secondary transition-all hover:-translate-y-0.5 hover:border-brand-cyan/45 hover:bg-brand-cyan/12 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/45 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="break-words">{reply}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form
            onSubmit={handleFreeTextSubmit}
            className="mt-5 flex flex-col gap-3 border-t border-brand-cyan/20 pt-4 sm:flex-row"
          >
            <label htmlFor="assistant-question" className="sr-only">
              Ask a question about this scan
            </label>
            <input
              id="assistant-question"
              type="text"
              value={freeTextQuestion}
              onChange={(event) => setFreeTextQuestion(event.target.value)}
              onPointerDown={handleQuestionInputPointerDown}
              onMouseDown={handleQuestionInputPointerDown}
              placeholder="Ask what to fix first, why it matters, or how serious it is"
              disabled={isAssistantLoading}
              className="min-h-[3.25rem] min-w-0 flex-1 rounded-xl border border-brand-cyan/30 bg-white/[0.06] px-4 py-3 text-sm text-primary outline-none transition-colors placeholder:text-muted focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/25"
            />
            <button
              type="submit"
              disabled={isAssistantLoading}
              className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-xl border border-brand-cyan/45 bg-brand-cyan/18 px-5 py-3 text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:border-brand-cyan hover:bg-brand-cyan/24 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/60 sm:w-auto"
            >
              {isAssistantLoading ? "Reviewing" : "Send"}
              <SendHorizontal className="ml-2 h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="min-w-0 rounded-2xl border border-brand-cyan/30 bg-white/[0.06] p-4 shadow-[0_20px_58px_rgba(2,8,23,0.28)] md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            Strategic prompts
          </p>
          <p className="mt-2 text-lg font-bold text-primary">
            What would you like to understand?
          </p>
          <div className="mt-5 grid gap-3">
            {aiSuggestedReplies.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => handleSuggestedReply(reply)}
                disabled={isAssistantLoading}
                className="group flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-xl border border-brand-cyan/35 bg-brand-cyan/10 px-4 py-3 text-left text-sm font-semibold text-primary transition-all hover:-translate-y-0.5 hover:border-brand-cyan hover:bg-brand-cyan/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/45"
              >
                <span className="break-words">{reply}</span>
                <ArrowRight className="h-4 w-4 flex-none text-brand-cyan transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}

            {quickReplies.map((reply) => {
              const Icon = quickReplyIcons[reply.intent];

              return (
                <button
                  key={reply.intent}
                  type="button"
                  onClick={() => handleQuickReply(reply.label, reply.intent)}
                  disabled={isAssistantLoading}
                  className="group flex min-h-[3.5rem] w-full items-center justify-between gap-3 rounded-xl border border-dark-border bg-dark-deep/85 px-4 py-3 text-left text-sm font-semibold text-secondary transition-all hover:-translate-y-0.5 hover:border-brand-cyan hover:bg-brand-cyan/12 hover:text-primary hover:shadow-[0_14px_34px_rgba(6,182,212,0.12)] focus-visible:border-brand-cyan focus-visible:bg-brand-cyan/12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/45"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan transition-colors group-hover:border-brand-cyan/45 group-hover:bg-brand-cyan/15">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="break-words">{reply.label}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 flex-none text-brand-cyan transition-transform group-hover:translate-x-0.5" />
                </button>
              );
            })}

            <Link
              href={contactHref}
              onClick={() =>
                trackEvent("audit_cta_clicked", {
                  ...attribution,
                  sourceArea: "assistant",
                })
              }
              className="group relative flex min-h-[4.25rem] w-full items-center justify-between gap-3 overflow-hidden rounded-xl border border-brand-cyan/60 bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-3 text-left text-sm font-bold text-white shadow-[0_18px_48px_rgba(6,182,212,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_58px_rgba(6,182,212,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-dark-deep"
            >
              <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/15 blur-2xl transition-transform group-hover:translate-x-full" />
              <span className="relative min-w-0">
                <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-cyan-50/85">
                  Recommended next step
                </span>
                <span className="mt-1 block text-base leading-5">
                  Review This Audit With Opzix
                </span>
              </span>
              <CalendarCheck className="h-5 w-5 flex-none text-white transition-transform group-hover:scale-105" />
            </Link>
          </div>

          <p className="mt-5 rounded-xl border border-brand-cyan/20 bg-dark-deep/70 p-3 text-xs leading-5 text-muted">
            This assistant uses the current scan data. Free-text questions use a
            server-side AI response when configured, with local scan rules as
            fallback. It does not save chat history.
          </p>
        </div>
      </div>
    </section>
  );
}
