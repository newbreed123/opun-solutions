"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Button from "@/components/Button";
import Section from "@/components/Section";
import { trackEvent } from "@/lib/analytics";
import { trackConversion } from "@/lib/analytics/trackConversion";
import { STRATEGY_CALL_URL } from "@/lib/booking";
import {
  sanitizeEvidenceText,
  summarizeCtaLabels,
} from "@/lib/evidence-cleanup";
import {
  BarChart3,
  ChevronDown,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MessageCircle,
  Monitor,
  MousePointerClick,
  Search,
  ServerCog,
  ShoppingCart,
  Sparkles,
  Smartphone,
  Target,
  Wand2,
  WifiOff,
  X,
} from "lucide-react";

function formatVisualUxScore(score: number | null | undefined) {
  return typeof score === "number" ? `${score}/100` : "Unavailable";
}

function isNonStorefrontAudit(audit: AuditResult) {
  const siteType = `${audit.siteType ?? ""} ${audit.storefrontReviewContext?.siteType ?? ""}`.toLowerCase();

  return (
    siteType.includes("non-ecommerce") ||
    siteType.includes("lead-generation") ||
    siteType.includes("lead generation")
  );
}

function reportTitle(audit: AuditResult) {
  return isNonStorefrontAudit(audit)
    ? `Website Audit Preview for ${audit.website}`
    : `Ecommerce Audit Preview for ${audit.website}`;
}

type AuditCategory = {
  key: string;
  label: string;
  score: number;
  scoreUnavailable?: boolean;
  status: string;
  statusDetail?: string;
  evidenceState?: "Positive" | "Negative" | "Unknown";
  scoringConfidence?: "High" | "Moderate" | "Low";
  purpose?: string;
  explanation: string;
  scoreExplanation?: {
    whyAssigned: string;
    evidenceInfluenced: string;
    whatWouldImprove: string;
  };
  priority: "Low" | "Medium" | "High";
  issues: string[];
  findings?: HeuristicFinding[];
  influencingFindings?: string[];
};

type PositiveUxSignal = {
  score: number;
  label: "strong" | "moderate" | "weak" | "unknown";
  evidence: string[];
  scoreImpact: number;
};

type PositiveUxSignals = Record<
  | "searchProminence"
  | "categoryVisibility"
  | "productDensity"
  | "trustSignals"
  | "hierarchyStrength"
  | "navigationClarity"
  | "commerceConfidence"
  | "visualConsistency"
  | "cartVisibility"
  | "checkoutVisibility"
  | "accountVisibility"
  | "productDiscoveryStrength",
  PositiveUxSignal
>;

type OverallScoreExplanation = {
  positiveSignals: string[];
  majorPenalties: string[];
  scoreReducers?: string[];
  whyThisScore: string;
  scoringConfidence?: "High" | "Moderate" | "Low";
  confidenceNote?: string;
  benchmarkContext?: BenchmarkContext;
  scanCoverage?: ScanCoverage;
  pageType?: PageTypeDetection;
};

type EcommerceMaturityScore = {
  maturityScore: number;
  maturityTier: "enterprise" | "mature" | "developing" | "early" | "unclear";
  positiveSignals: string[];
  maturityReducers: string[];
  explanation: string;
};

type ScanCoverage = {
  submittedUrlOnly?: boolean;
  screenshotMode: "viewport" | "full-page";
  domCoverage: "visible" | "full-page";
  scoringCoverage: "above-fold" | "near-fold" | "full-page";
  aboveFoldCoverage?: string;
  nearFoldCoverage?: string;
  fullPageDomCoverage?: string;
  screenshotCoverage?: string;
  scoringCoverageSummary?: string;
  coverageWarnings?: string[];
  aboveFoldSignals: Record<string, boolean | number | undefined>;
  nearFoldSignals: Record<string, boolean | number | undefined>;
  fullPageSignals: Record<string, boolean | number | undefined>;
  visualSignals: Record<string, boolean | number | undefined>;
  manualConfirmationSignals?: Record<string, boolean | undefined>;
  coverageSummary: string;
  explanation: string;
};

type PageTypeDetection = {
  submittedPageType: string;
  confidence: number;
  evidence: string[];
  scoringNote: string;
};

type CompetitiveComparison = {
  comparisonSet: string[];
  expectedPatterns: string[];
  strengths: string[];
  weaknesses: string[];
  explanation: string;
};

type RevenueImpactEstimate = {
  findingTitle: string;
  riskArea: string;
  likelyImpact: string;
  severity: string;
  confidence: string;
  explanation: string;
};

type RevenueImpactSummary = {
  summary: string;
  estimates: RevenueImpactEstimate[];
  revenueRiskAreas: string[];
};

type RecommendationRoadmapStep = {
  stepNumber: number;
  title: string;
  cost: string;
  timeline: string;
  rationale: string;
  validationTarget: string;
  expectedImpact: string;
  roiRationale: string;
  sourceFinding?: string;
  riskArea?: string;
  confidence?: string;
};

type RecommendationRoadmap = {
  summary: string;
  primaryRecommendation: string;
  source?: {
    scanId?: string;
    domain?: string;
    siteType?: string;
    benchmarkGroup?: string;
    score?: number;
  };
  steps: RecommendationRoadmapStep[];
  step1?: RecommendationRoadmapStep;
  step2?: RecommendationRoadmapStep;
  step3?: RecommendationRoadmapStep;
  step4?: RecommendationRoadmapStep;
  step5?: RecommendationRoadmapStep;
  step6?: RecommendationRoadmapStep;
  step7?: RecommendationRoadmapStep;
};

type AuditResult = {
  scanId?: string;
  website: string;
  mode: "mock";
  generatedAt: string;
  overallScore: number;
  overallStatus: string;
  overallExplanation: string;
  scoringConfidence?: "High" | "Moderate" | "Low";
  scoringConfidenceNote?: string;
  scoreMismatchWarnings?: string[];
  scoreExplanation?: OverallScoreExplanation;
  positiveUxSignals?: PositiveUxSignals;
  ecommerceMaturity?: EcommerceMaturityScore;
  scanCoverage?: ScanCoverage;
  submittedPageType?: PageTypeDetection;
  competitiveComparison?: CompetitiveComparison;
  revenueImpactSummary?: RevenueImpactSummary;
  recommendationRoadmap?: RecommendationRoadmap;
  summary: string;
  executiveSummary: ExecutiveSummary;
  auditNarrative?: string;
  currentNarrativeArchetype?: string;
  siteType?: StorefrontReviewSiteType;
  siteTypeReason?: string;
  storefrontReviewContext?: StorefrontReviewContext;
  connectedInsight?: ConnectedInsight | null;
  primaryOperationalConcern?: PrimaryOperationalConcern | null;
  topPriorityRisks: TopPriorityRisk[];
  heuristicFindings?: HeuristicFinding[];
  visualUxDiagnostics: {
    score: number | null;
    visualMetricsAvailable?: boolean;
    visualUxConfidence?: "High" | "Moderate" | "Low" | "Unavailable";
    unavailableReason?: string;
    findings: VisualUxFinding[];
    summary: string;
    desktopConcerns: string[];
    mobileConcerns: string[];
  };
  diagnostics: LiveDiagnostics;
  categories: AuditCategory[];
  recommendedNextSteps: RecommendedNextStep[];
  benchmarkTags?: string[];
  benchmarkContext?: BenchmarkContext;
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
  confidence: "Low" | "Moderate" | "High" | "Needs Review";
  reason: string;
  supportingSignals: string[];
};

type HeuristicFinding = {
  title: string;
  category: string;
  primaryCategory?: string;
  secondaryCategories?: string[];
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: "Low" | "Moderate" | "High" | "Needs Review";
  businessImpact: string;
  revenueImpact?: RevenueImpactEstimate;
  recommendedFirstAction: string;
  evidenceSummary: string;
};

type VisualUxFinding = {
  title: string;
  severity: "High" | "Medium" | "Low";
  confidence: "High" | "Moderate" | "Low";
  evidenceSummary: string;
  businessImpact: string;
  recommendedFirstAction: string;
  viewport: "desktop" | "mobile" | "both";
};

type ExecutiveSummary = {
  summary: string;
  highestImpactOpportunities: string[];
  businessInterpretation: string;
};

type TopPriorityRisk = {
  title: string;
  riskLabel: string;
  severity: string;
  confidence?: string;
  explanation: string;
  evidenceSummary?: string;
  recommendedFirstAction: string;
};

type ConnectedInsight = {
  title: string;
  insight: string;
  findingTitles: string[];
};

type PrimaryOperationalConcern = {
  title: string;
  riskLabel: string;
  severity: string;
  confidence?: string;
  explanation: string;
  evidenceSummary?: string;
  recommendedFirstAction: string;
  supportingFindings: string[];
};

type OperationalConcernView =
  | PrimaryOperationalConcern
  | TopPriorityRisk
  | null;

type BenchmarkNote = {
  message: string;
  evidence: string;
  tags: string[];
  tone: "positive" | "negative" | "mixed";
};

type BenchmarkContext = {
  benchmarkGroup?: string;
  percentileEstimate?: number | null;
  benchmarkLabel?: string;
  comparisonBasis?: string[];
  strengthsVsBenchmark?: string[];
  weaknessesVsBenchmark?: string[];
  explanation?: string;
  summary: string;
  notes: BenchmarkNote[];
  benchmarkTags: string[];
  recurringPositivePatterns: string[];
  recurringNegativePatterns: string[];
  signalScore: number;
};

type RecommendedNextStep = {
  title?: string;
  evidenceClue?: string;
  action: string;
  why: string;
};

type LiveDiagnostics = {
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  desktopScreenshotUrl: string | null;
  mobileScreenshotUrl: string | null;
  technologyDetections: {
    key: string;
    label: string;
    detected: boolean;
    description: string;
    signals: string[];
  }[];
  platformDetection: {
    name: string;
    platformName?: string;
    confidence: number;
    confidenceScore?: number;
    confidenceLabel: string;
    ecommerceProbability?: {
      probability: number;
      label: "High" | "Moderate" | "Low" | "Unclear" | string;
      evidence: string[];
      negativeSignals: string[];
    };
    details: string[];
    evidence?: string[];
    explanation?: string;
    recommendation?: string;
  };
  commerceFlowSignals: {
    cartVisible: boolean;
    checkoutVisible: boolean;
    productCatalogVisible: boolean;
    formVisible: boolean;
    ctaVisible: boolean;
    ctaCount: number;
    ctaLabels: string[];
  };
  conversionSignals: {
    formCount: number;
    inputCount: number;
    ctaCount: number;
    ctaLabels: string[];
  };
  consoleErrors: string[];
  failedRequests: string[];
  warnings: string[];
};

type ScannerResponse =
  | {
      success: true;
      audit: AuditResult;
    }
  | {
      success: false;
      error: string;
    };

type ZoraAuditContextEventDetail = {
  source: "audit_report";
  action: "explain_audit" | "explain_recommendation";
  scanId?: string;
  websiteUrl: string;
  recommendationId?: string;
  recommendationTitle?: string;
  category?: string;
  severity?: string;
  businessExplanation?: string;
  technicalExplanation?: string;
  recommendedFix?: string;
  suggestedQuestion: string;
  overallScore?: number;
  overallStatus?: string;
  primaryConcern?: string;
};

const scoreCards = [
  {
    label: "Mobile Journey",
    description: "CTA visibility, readability, and mobile hierarchy clarity",
    icon: Wand2,
  },
  {
    label: "Visual UX",
    description: "Layout, spacing, hierarchy, and product discovery",
    icon: Monitor,
  },
  {
    label: "Purchase Confidence",
    description: "Trust, support, reassurance, checkout cues",
    icon: Target,
  },
  {
    label: "Technical",
    description: "Performance, metadata, template stability",
    icon: ServerCog,
  },
  {
    label: "Marketing Visibility",
    description: "Analytics, attribution, follow-up visibility",
    icon: BarChart3,
  },
  {
    label: "Checkout Path",
    description: "Cart, checkout, support, returns visibility",
    icon: ShoppingCart,
  },
];

function normalizeWebsiteInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function statusBadgeClasses(status: string) {
  if (status === "Critical") {
    return "border-red-300/45 bg-red-500/15 text-red-100 shadow-[0_0_0_1px_rgba(248,113,113,0.08)]";
  }

  if (status === "High Priority" || status === "High") {
    return "border-orange-300/35 bg-orange-400/10 text-orange-100";
  }

  if (status === "Needs Review" || status === "Medium" || status === "Evidence Unknown") {
    return "border-amber-300/35 bg-amber-400/10 text-amber-100";
  }

  if (status === "Low") {
    return "border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan";
  }

  return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
}

const marketingToolKeys = [
  "googleAnalytics",
  "googleTagManager",
  "metaPixel",
  "klaviyo",
  "mailchimp",
] as const;

function isMarketingTool(
  tool: LiveDiagnostics["technologyDetections"][number],
) {
  return marketingToolKeys.includes(
    tool.key as (typeof marketingToolKeys)[number],
  );
}

function getVisibleMarketingTools(diagnostics: LiveDiagnostics) {
  return diagnostics.technologyDetections.filter(
    (tool) => tool.detected && isMarketingTool(tool),
  );
}

function marketingStatusLabel(count: number) {
  if (count >= 3) {
    return "Active";
  }

  if (count > 0) {
    return "Limited";
  }

  return "Not Detected";
}

function marketingStatusClasses(status: string) {
  if (status === "Active") {
    return "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan";
  }

  if (status === "Limited") {
    return "border-brand-blue/30 bg-brand-blue/10 text-brand-blue";
  }

  return "border-red-300/30 bg-red-400/10 text-red-100";
}

function confidenceLevel(confidence: number) {
  if (confidence >= 80) {
    return "High confidence";
  }

  if (confidence >= 50) {
    return "Moderate confidence";
  }

  if (confidence > 0) {
    return "Low confidence";
  }

  return "Not visible";
}

function platformDisplayName(audit: AuditResult) {
  const platform = audit.diagnostics.platformDetection;

  if (platform.name === "Not an ecommerce storefront") {
    return "Platform detection skipped";
  }

  if (platform.name === "Ecommerce probability unclear") {
    return "Manual review recommended";
  }

  if (platform.name === "Platform not confidently identified") {
    return "Platform not confidently identified";
  }

  if (platform.name === "Enterprise / Custom Commerce Stack") {
    return "Enterprise / Custom Commerce Stack";
  }

  if (platform.name === "Unknown") {
    return "Platform not confidently identified";
  }

  return platform.name;
}

function showManualReviewChecklist(audit: AuditResult) {
  const platform = audit.diagnostics.platformDetection;
  return (
    platform.name === "Unknown" ||
    platform.name === "Enterprise / Custom Commerce Stack" ||
    platform.name === "Not an ecommerce storefront" ||
    platform.name === "Ecommerce probability unclear" ||
    platform.name === "Platform not confidently identified" ||
    platform.confidenceLabel === "Low confidence" ||
    platform.confidenceLabel === "Needs Review"
  );
}

function signalLabel(isVisible: boolean) {
  return isVisible ? "Visible" : "Not visible";
}

function platformMarketingInterpretation(audit: AuditResult) {
  const platform = audit.diagnostics.platformDetection;
  const marketingTools = getVisibleMarketingTools(audit.diagnostics);
  const commerce = audit.diagnostics.commerceFlowSignals;
  const probability = platform.ecommerceProbability;
  const nonStorefront = isNonStorefrontAudit(audit);

  if (nonStorefront) {
    return "This public page appears to support a service or lead-generation journey. Product, catalog, cart, and checkout evidence should be confirmed before treating it as ecommerce.";
  }

  if (probability?.label === "Low") {
    return "Ecommerce probability low. Platform detection skipped. This page does not expose enough product, cart, checkout, or purchase-flow evidence to classify it as a standard ecommerce storefront.";
  }

  if (probability?.label === "Unclear") {
    return "Ecommerce probability unclear. Manual review is recommended because this URL may support commerce elsewhere, but the public page does not expose enough commerce signals.";
  }

  if (platform.name === "Enterprise / Custom Commerce Stack") {
    return "Enterprise / Custom Commerce Stack. Standard platform evidence is intentionally limited or not exposed, so platform-specific recommendations should wait until manual confirmation.";
  }

  if (platform.name === "Unknown" && marketingTools.length === 0) {
    return "The public storefront page did not expose clear platform or common marketing tags in this scan. This may indicate a custom, headless, or heavily customized storefront. Platform visibility is limited and should be manually confirmed before making platform-specific recommendations.";
  }

  const platformText =
    platform.name === "Unknown" ||
    platform.name === "Platform not confidently identified"
      ? "Platform not confidently identified"
      : `The storefront appears to expose ${platform.name} signals`;
  const marketingText =
    marketingTools.length > 0
      ? `${marketingTools.length} common marketing tool${marketingTools.length === 1 ? "" : "s"} were visible`
      : "no common marketing tools were visible";
  const journeyText =
    commerce.cartVisible ||
    commerce.checkoutVisible ||
    commerce.productCatalogVisible
      ? "customer journey signals are present enough to support a commerce-flow review"
      : "cart, checkout, and catalog signals were not prominent on the loaded page";

  return `${platformText}, and ${marketingText}. At a business level, ${journeyText}.`;
}

function scoreTone(score: number) {
  if (score < 65) {
    return "text-red-100";
  }

  if (score < 80) {
    return "text-amber-100";
  }

  return "text-emerald-100";
}

function actionPlanLabel(index: number) {
  return [
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
  ][index] ?? "Then";
}

function scoreContext(category: AuditCategory) {
  if (category.statusDetail) {
    return category.statusDetail;
  }

  return category.scoreExplanation?.whyAssigned ?? category.status;
}

function scoreMainEvidence(category: AuditCategory) {
  const evidence = category.scoreExplanation?.evidenceInfluenced;

  if (!evidence) {
    return sanitizeEvidenceText(
      category.issues[0] ?? "No high-impact public-page issue detected.",
    );
  }

  return sanitizeEvidenceText(evidence.split(";")[0] ?? evidence);
}

function parseExecutiveOpportunity(opportunity: string) {
  const [rawTitle, ...rawRest] = opportunity.split(":");
  const rest = rawRest.join(":").trim();
  const [rawEvidence, rawAction] = rest.split(/First action:/i);

  return {
    title: rawTitle.trim() || "Review opportunity",
    evidence: sanitizeEvidenceText(rawEvidence || rest, { maxLength: 130 }),
    action: sanitizeEvidenceText(rawAction, { maxLength: 140 }),
  };
}

function primaryOperationalConcern(audit: AuditResult): OperationalConcernView {
  return audit.primaryOperationalConcern ?? audit.topPriorityRisks[0] ?? null;
}

function primaryOperationalConcernTitle(audit: AuditResult) {
  const concern = primaryOperationalConcern(audit);
  return concern?.title || concern?.riskLabel || "Primary audit concern";
}

function roadmapStepsForAudit(audit: AuditResult): RecommendationRoadmapStep[] {
  const roadmapSteps = audit.recommendationRoadmap?.steps ?? [];

  if (roadmapSteps.length > 0) {
    return roadmapSteps;
  }

  return audit.recommendedNextSteps.slice(0, 4).map((step, index) => ({
    stepNumber: index + 1,
    title: step.title || step.action || `Roadmap step ${index + 1}`,
    cost: index === 0 ? "$1,000-$3,000" : "$500-$2,000",
    timeline: index === 0 ? "1-3 weeks" : "1-2 weeks",
    rationale: step.why,
    validationTarget: step.evidenceClue || step.action,
    expectedImpact: step.why,
    roiRationale:
      "This is a directional roadmap estimate generated from the prioritized scan findings.",
    sourceFinding: step.evidenceClue || step.title,
  }));
}

const ROADMAP_ESTIMATE_DISCLAIMER =
  "These are directional planning estimates based on public-page signals and common implementation ranges. Final scope may vary after a manual review.";

function roadmapRangeLabel(title: string) {
  if (/\b(confirm|confirmation|validate|validation|discovery call|audit|consult)\b/i.test(title)) {
    return "Consulting Range";
  }

  if (/\b(review|discovery|friction|improve|improvement|clarity|strengthen|fix)\b/i.test(title)) {
    return "Improvement Range";
  }

  return "Investment Range";
}

function parseRoadmapRange(range: string) {
  const matches = range.match(/\$?\s*([0-9][0-9,]*)/g);

  if (!matches || matches.length < 2) {
    return null;
  }

  const [low, high] = matches.slice(0, 2).map((value) =>
    Number(value.replace(/[^0-9]/g, "")),
  );

  return Number.isFinite(low) && Number.isFinite(high) ? { low, high } : null;
}

function parseTimelineWeeks(timeline: string) {
  const normalized = timeline.toLowerCase();
  const matches = normalized.match(/([0-9]+(?:\.[0-9]+)?)/g);

  if (!matches || matches.length === 0) {
    return null;
  }

  const multiplier = normalized.includes("month") ? 4 : 1;
  const low = Number(matches[0]) * multiplier;
  const high = Number(matches[1] ?? matches[0]) * multiplier;

  return Number.isFinite(low) && Number.isFinite(high) ? { low, high } : null;
}

function formatCurrencyRangeValue(value: number) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function initialImprovementEstimate(steps: RecommendationRoadmapStep[]) {
  const parsedSteps = steps
    .map((step) => ({
      investment: parseRoadmapRange(step.cost),
      timeline: parseTimelineWeeks(step.timeline),
    }))
    .filter(
      (step): step is {
        investment: { low: number; high: number };
        timeline: { low: number; high: number } | null;
      } => Boolean(step.investment),
    );

  if (parsedSteps.length < 2) {
    return null;
  }

  const low = parsedSteps.reduce((total, step) => total + step.investment.low, 0);
  const high = parsedSteps.reduce((total, step) => total + step.investment.high, 0);
  const timelineSteps = parsedSteps.filter(
    (step): step is {
      investment: { low: number; high: number };
      timeline: { low: number; high: number };
    } => Boolean(step.timeline),
  );

  return {
    range: `${formatCurrencyRangeValue(low)}-${formatCurrencyRangeValue(high)}`,
    timeline:
      timelineSteps.length >= 2
        ? `${timelineSteps.reduce((total, step) => total + step.timeline.low, 0)}-${timelineSteps.reduce((total, step) => total + step.timeline.high, 0)} weeks`
        : null,
  };
}

function primaryRoadmapStep(audit: AuditResult) {
  return roadmapStepsForAudit(audit)[0] ?? null;
}

function auditAttribution(audit: AuditResult) {
  return {
    scanId: audit.scanId,
    scannedUrl: audit.website,
    score: audit.overallScore,
    status: audit.overallStatus,
    primaryConcern: primaryOperationalConcernTitle(audit),
  };
}

function auditSummaryZoraContext(audit: AuditResult): ZoraAuditContextEventDetail {
  const concern = primaryOperationalConcern(audit);

  return {
    source: "audit_report",
    action: "explain_audit",
    scanId: audit.scanId,
    websiteUrl: audit.website,
    category:
      audit.storefrontReviewContext?.siteType ||
      audit.siteType ||
      audit.diagnostics.platformDetection.name,
    severity: concern?.severity || audit.overallStatus,
    businessExplanation:
      audit.executiveSummary.businessInterpretation ||
      audit.summary ||
      audit.overallExplanation,
    technicalExplanation: audit.overallExplanation,
    recommendedFix:
      concern?.recommendedFirstAction ||
      audit.recommendationRoadmap?.primaryRecommendation ||
      audit.recommendedNextSteps[0]?.action,
    suggestedQuestion: "Explain this audit.",
    overallScore: audit.overallScore,
    overallStatus: audit.overallStatus,
    primaryConcern: primaryOperationalConcernTitle(audit),
  };
}

function recommendationZoraContext(
  audit: AuditResult,
  step: RecommendationRoadmapStep,
  index: number,
): ZoraAuditContextEventDetail {
  return {
    source: "audit_report",
    action: "explain_recommendation",
    scanId: audit.scanId,
    websiteUrl: audit.website,
    recommendationId: `roadmap-step-${step.stepNumber}`,
    recommendationTitle: step.title,
    category: step.riskArea || actionPlanLabel(index),
    severity: step.confidence || audit.overallStatus,
    businessExplanation: step.rationale || step.expectedImpact,
    technicalExplanation: step.sourceFinding || step.roiRationale,
    recommendedFix: step.validationTarget,
    suggestedQuestion: `Explain ${step.title}.`,
    overallScore: audit.overallScore,
    overallStatus: audit.overallStatus,
    primaryConcern: primaryOperationalConcernTitle(audit),
  };
}

function primaryOperationalSupportingFindings(concern: OperationalConcernView) {
  if (concern && "supportingFindings" in concern) {
    return concern.supportingFindings;
  }

  return [];
}

function benchmarkNoteClasses(tone: BenchmarkNote["tone"]) {
  if (tone === "positive") {
    return "border-emerald-300/25 bg-emerald-400/5";
  }

  if (tone === "negative") {
    return "border-amber-300/25 bg-amber-400/5";
  }

  return "border-dark-border bg-white/[0.035]";
}

export default function EcommerceAuditScannerPage() {
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [resultsInView, setResultsInView] = useState(false);
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [showVisibilityDetails, setShowVisibilityDetails] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState<{
    src: string;
    label: string;
  } | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedWebsite = params.get("url") || params.get("website");

    if (!requestedWebsite) {
      return;
    }

    const normalizedWebsite = normalizeWebsiteInput(requestedWebsite);

    if (isValidHttpUrl(normalizedWebsite)) {
      setWebsite(normalizedWebsite);
    }
  }, []);

  function scrollToResults(behavior: ScrollBehavior = "smooth") {
    resultsRef.current?.scrollIntoView({ behavior, block: "start" });
  }

  function openZoraWithAuditContext(detail: ZoraAuditContextEventDetail) {
    if (!audit) return;

    trackEvent("audit_assistant_prompt_clicked", {
      ...auditAttribution(audit),
      sourceArea: "report",
      action: detail.action,
      recommendationId: detail.recommendationId,
      recommendationTitle: detail.recommendationTitle,
    });

    window.dispatchEvent(
      new CustomEvent<ZoraAuditContextEventDetail>("opzix:zora-context", {
        detail,
      }),
    );
  }

  useEffect(() => {
    if (!audit) {
      setResultsInView(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      scrollToResults("smooth");
    }, 150);

    return () => window.clearTimeout(timeout);
  }, [audit]);

  useEffect(() => {
    if (!audit || !resultsRef.current) {
      return;
    }

    const updateResultsVisibility = () => {
      const rect = resultsRef.current?.getBoundingClientRect();

      if (!rect) {
        setResultsInView(false);
        return;
      }

      setResultsInView(rect.top <= 160 && rect.bottom > 160);
    };

    updateResultsVisibility();
    window.addEventListener("scroll", updateResultsVisibility, { passive: true });
    window.addEventListener("resize", updateResultsVisibility);

    return () => {
      window.removeEventListener("scroll", updateResultsVisibility);
      window.removeEventListener("resize", updateResultsVisibility);
    };
  }, [audit]);

  function handleExportReport() {
    if (!audit) {
      return;
    }

    trackEvent("audit_export_clicked", auditAttribution(audit));
    trackConversion("roadmap_downloaded", {
      source: "audit_scanner",
      websiteUrl: audit.website,
      pagePath: window.location.pathname,
    });
    setShowVisibilityDetails(true);
    setShowRawLogs(false);
    setExpandedScreenshot(null);

    window.setTimeout(() => {
      window.print();
    }, 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedWebsite = normalizeWebsiteInput(website);

    if (!isValidHttpUrl(normalizedWebsite)) {
      trackEvent("audit_scan_failed", {
        scannedUrl: normalizedWebsite,
        sourceArea: "hero",
      });
      setError("Enter a valid website URL, such as https://example.com.");
      setAudit(null);
      return;
    }

    setIsLoading(true);
    setError("");
    trackEvent("audit_scan_started", {
      scannedUrl: normalizedWebsite,
      sourceArea: "hero",
    });
    trackConversion("audit_started", {
      source: "audit_scanner",
      websiteUrl: normalizedWebsite,
      pagePath: window.location.pathname,
    });

    try {
      const response = await fetch("/api/ecommerce-audit-scanner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website: normalizedWebsite }),
      });

      const data = (await response.json()) as ScannerResponse;

      if (!response.ok || !data.success) {
        trackEvent("audit_scan_failed", {
          scannedUrl: normalizedWebsite,
          sourceArea: "hero",
        });
        setError(
          data.success
            ? "We could not generate the audit preview. Please try again."
            : data.error,
        );
        setAudit(null);
        return;
      }

      setAudit(data.audit);
      setWebsite(normalizedWebsite);
      setShowRawLogs(false);
      trackEvent("audit_scan_completed", {
        ...auditAttribution(data.audit),
        sourceArea: "hero",
      });
      trackConversion("audit_completed", {
        source: "audit_scanner",
        websiteUrl: normalizedWebsite,
      });
    } catch {
      trackEvent("audit_scan_failed", {
        scannedUrl: normalizedWebsite,
        sourceArea: "hero",
      });
      setError("Something went wrong while generating the preview report.");
      setAudit(null);
    } finally {
      setIsLoading(false);
    }
  }

  const strategyCallDisplay = STRATEGY_CALL_URL.replace(/^https?:\/\//i, "");

  return (
    <>
      <Section bgColor="secondary" className="hero-atmosphere" padded>
        <div
          className={`grid min-w-0 items-center gap-10 ${
            audit ? "" : "lg:grid-cols-[1.05fr_0.95fr]"
          }`}
        >
          <div className="min-w-0">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.28em] text-brand-cyan">
              Ecommerce Systems Audit Tool
            </p>
            <h1 className="heading-1 max-w-5xl">
              <span className="block">Scan Your Store for</span>
              <span className="block">Conversion, Tracking,</span>
              <span className="block">and Operations Gaps</span>
            </h1>
            <p className="mt-6 max-w-[34ch] text-lg leading-relaxed text-secondary md:max-w-3xl md:text-xl">
              Enter a store URL and generate a premium sample audit report
              covering UX, conversion friction, technical foundations, tracking,
              and ecommerce operations.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 max-w-full overflow-hidden rounded-[2rem] border border-dark-border bg-dark-card p-4 shadow-card-glow sm:p-5"
            >
              <div className="w-full min-w-0 space-y-4">
                <label
                  htmlFor="website"
                  className="block text-sm font-semibold text-primary"
                >
                  Website URL
                </label>
                <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row">
                  <input
                    id="website"
                    type="text"
                    inputMode="url"
                    value={website}
                    onChange={(event) => setWebsite(event.target.value)}
                    placeholder="https://yourstore.com"
                    className="min-h-12 w-full min-w-0 rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none transition-colors placeholder:text-muted focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20 sm:flex-1"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary min-h-12 !w-full !max-w-full min-w-0 sm:!w-auto sm:min-w-[11rem]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Scanning
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Run Scan
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <div
                    className="block w-full min-w-0 max-w-full whitespace-normal break-words rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100"
                    style={{ width: "100%" }}
                  >
                    {error}
                  </div>
                )}

                {isLoading && (
                  <div className="w-full rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 p-4">
                    <div className="flex items-start gap-3">
                      <Loader2 className="mt-1 h-5 w-5 flex-none animate-spin text-brand-cyan" />
                      <div className="min-w-0">
                        <p className="font-semibold text-primary">
                          Scanning your storefront...
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-secondary">
                          Checking UX, tracking, conversion, and operations...
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-2/3 animate-pulse rounded-full bg-brand-cyan/80" />
                    </div>
                  </div>
                )}

                {audit && !isLoading && (
                  <div className="w-full rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4">
                    <div className="flex items-start gap-3">
                      <Check className="mt-1 h-5 w-5 flex-none text-emerald-200" />
                      <div className="min-w-0">
                        <p className="font-semibold text-primary">
                          Scan complete — your audit report is ready.
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-secondary">
                          View your score, roadmap, and Opzix assistant below.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => scrollToResults()}
                        className="btn btn-primary min-h-11 !w-full !max-w-full"
                      >
                        View Results
                      </button>
                      <button
                        type="button"
                        onClick={handleExportReport}
                        className="btn btn-secondary min-h-11 !w-full !max-w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!audit && (
                <>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                    <span className="rounded-full border border-dark-border bg-white/[0.035] px-3 py-1">
                      MVP mock report
                    </span>
                    <span className="rounded-full border border-dark-border bg-white/[0.035] px-3 py-1">
                      No external scanning yet
                    </span>
                    <span className="rounded-full border border-dark-border bg-white/[0.035] px-3 py-1">
                      API-ready foundation
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-muted">
                    This MVP currently uses mock strategic analysis plus lightweight
                    live diagnostics. Lighthouse performance signals, deeper
                    metadata checks, and richer browser diagnostics will be added in
                    the next phase.
                  </p>
                </>
              )}
            </form>
          </div>

          {!audit && (
            <div className="card-elevated relative min-w-0 max-w-full overflow-hidden p-5 md:p-6">
              <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-brand-blue/25 blur-3xl" />
              <div className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full bg-brand-cyan/15 blur-3xl" />
              <div className="relative rounded-2xl border border-dark-border bg-dark-deep/80 p-5">
                <div className="mb-6 flex items-start justify-between gap-4 border-b border-dark-border pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Audit Preview
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-primary">
                      Store systems report
                    </h2>
                  </div>
                  <Sparkles className="h-6 w-6 flex-none text-brand-cyan" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {scoreCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div
                        key={card.label}
                        className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"
                      >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-blue/10 text-brand-cyan">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="font-bold text-primary">{card.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">
                          {card.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      <Section bgColor="primary">
        <div className="scanner-report-scope mx-auto w-full max-w-6xl overflow-x-hidden">
          {!audit ? (
            <div className="grid gap-5 lg:grid-cols-3">
              {[
                "Validate URL input and create a clean API contract.",
                "Return structured issue categories for the future scanner.",
                "Prepare the report UI for real crawling and diagnostics later.",
              ].map((item, index) => (
                <div key={item} className="card p-6">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-dark-border bg-brand-blue/10 text-brand-cyan">
                    {index + 1}
                  </div>
                  <p className="text-lg font-semibold leading-relaxed text-primary">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div
              ref={resultsRef}
              id="audit-results"
              className="scroll-mt-24 space-y-8"
            >
              <div className="audit-print-only audit-print-header">
                <div className="audit-print-brand-row">
                  <div className="audit-print-logo-mark">O</div>
                  <div>
                    <p className="audit-print-kicker">Opzix Audit Beta</p>
                    <h1>Opzix Audit Report</h1>
                  </div>
                </div>
                <p className="audit-print-prepared">
                  Prepared by Opzix Audit Beta
                </p>
                <dl>
                  <div>
                    <dt>Website</dt>
                    <dd>{audit.website}</dd>
                  </div>
                  <div>
                    <dt>Generated</dt>
                    <dd>{new Date(audit.generatedAt).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt>Score</dt>
                    <dd>
                      {audit.overallScore}/100 - {audit.overallStatus}
                    </dd>
                  </div>
                  <div>
                    <dt>Primary Concern</dt>
                    <dd>{primaryOperationalConcernTitle(audit)}</dd>
                  </div>
                </dl>
              </div>

              <div className="audit-print-only audit-print-cta">
                <div>
                  <p className="audit-print-cta-label">Recommended next step</p>
                  <p className="audit-print-cta-title">
                    {primaryRoadmapStep(audit)?.title ?? "Review this audit with Opzix"}
                  </p>
                  <p className="audit-print-cta-copy">
                    {primaryRoadmapStep(audit)
                      ? `${roadmapRangeLabel(primaryRoadmapStep(audit)?.title ?? "")}: ${primaryRoadmapStep(audit)?.cost} / Timeline: ${primaryRoadmapStep(audit)?.timeline}. ${primaryRoadmapStep(audit)?.rationale} ${ROADMAP_ESTIMATE_DISCLAIMER}`
                      : "Walk through the score, validate the public-page evidence, and turn the top findings into a practical fix list."}
                  </p>
                </div>
                <div className="audit-print-schedule-box">
                  <p>Schedule</p>
                  <strong>{strategyCallDisplay}</strong>
                </div>
              </div>

              <div className="card-elevated p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-center">
                  <div className="rounded-[2rem] border border-brand-cyan/30 bg-brand-blue/10 p-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Overall Score
                    </p>
                    <p
                      className={`mt-4 text-6xl font-black ${scoreTone(
                        audit.overallScore,
                      )}`}
                    >
                      {audit.overallScore}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-secondary">
                      {audit.overallStatus}
                    </p>
                    <span
                      className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${statusBadgeClasses(
                        audit.overallStatus,
                      )}`}
                    >
                      {audit.overallStatus}
                    </span>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {audit.overallExplanation}
                    </p>
                    {audit.scoringConfidence ? (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                          Scoring Confidence: {audit.scoringConfidence}
                        </p>
                        {audit.scoringConfidenceNote ? (
                          <p className="mt-2 text-sm leading-6 text-muted">
                            {audit.scoringConfidenceNote}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {audit.scoreExplanation ? (
                      <div className="mt-5 space-y-4 text-left text-sm leading-6">
                        <div>
                          <p className="font-semibold text-primary">
                            Why this score
                          </p>
                          <p className="mt-1 text-muted">
                            {audit.scoreExplanation.whyThisScore}
                          </p>
                        </div>
                        {audit.ecommerceMaturity ? (
                          <div>
                            <p className="font-semibold text-primary">
                              Ecommerce maturity
                            </p>
                            <p className="mt-1 text-muted">
                              {audit.ecommerceMaturity.maturityTier} maturity,
                              scored {audit.ecommerceMaturity.maturityScore}/100.
                              {" "}
                              {audit.ecommerceMaturity.explanation}
                            </p>
                          </div>
                        ) : null}
                        {audit.scoreExplanation.positiveSignals.length > 0 ? (
                          <div>
                            <p className="font-semibold text-primary">
                              Positive signals
                            </p>
                            <ul className="mt-2 space-y-1 text-muted">
                              {audit.scoreExplanation.positiveSignals
                                .slice(0, 3)
                                .map((signal) => (
                                  <li key={signal}>+ {signal}</li>
                                ))}
                            </ul>
                          </div>
                        ) : null}
                        {audit.scoreExplanation.majorPenalties.length > 0 ? (
                          <div>
                            <p className="font-semibold text-primary">
                              Score reducers
                            </p>
                            <ul className="mt-2 space-y-1 text-muted">
                              {audit.scoreExplanation.majorPenalties
                                .slice(0, 3)
                                .map((penalty) => (
                                  <li key={penalty}>- {penalty}</li>
                                ))}
                            </ul>
                          </div>
                        ) : null}
                        {audit.submittedPageType ? (
                          <div>
                            <p className="font-semibold text-primary">
                              Submitted page type
                            </p>
                            <p className="mt-1 text-muted">
                              {audit.submittedPageType.submittedPageType} ·{" "}
                              {audit.submittedPageType.confidence}% confidence.
                              {" "}
                              {audit.submittedPageType.scoringNote}
                            </p>
                          </div>
                        ) : null}
                        {audit.scanCoverage ? (
                          <div>
                            <p className="font-semibold text-primary">
                              Scoring coverage
                            </p>
                            <p className="mt-1 text-muted">
                              {audit.scanCoverage.scoringCoverageSummary ||
                                audit.scanCoverage.coverageSummary ||
                                audit.scanCoverage.explanation}
                            </p>
                            {[
                              audit.scanCoverage.aboveFoldCoverage,
                              audit.scanCoverage.nearFoldCoverage,
                              audit.scanCoverage.fullPageDomCoverage,
                              audit.scanCoverage.screenshotCoverage,
                            ]
                              .filter(
                                (coverageDetail): coverageDetail is string =>
                                  Boolean(coverageDetail),
                              )
                              .map((coverageDetail) => (
                                <p
                                  key={coverageDetail}
                                  className="mt-1 text-muted"
                                >
                                  {coverageDetail}
                                </p>
                              ))}
                            {audit.scanCoverage.coverageSummary ? (
                              <p className="mt-1 text-muted">
                                {audit.scanCoverage.explanation}
                              </p>
                            ) : null}
                            {audit.scanCoverage.coverageWarnings?.length ? (
                              <ul className="mt-2 space-y-1 text-amber-100">
                                {audit.scanCoverage.coverageWarnings.map((warning) => (
                                  <li key={warning}>- {warning}</li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Report Generated
                    </p>
                    <h2 className="mt-3 break-words text-3xl font-bold text-primary md:text-4xl">
                      {reportTitle(audit)}
                    </h2>
                    <p className="mt-4 leading-relaxed text-secondary">
                      {audit.summary}
                    </p>
                    {audit.visualUxDiagnostics ? (
                      <div className="mt-5 rounded-3xl border border-brand-cyan/25 bg-brand-cyan/10 p-5 text-sm leading-7 text-secondary">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                              Visual UX Review
                            </p>
                            <p>{audit.visualUxDiagnostics.summary}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted">
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                              Score {formatVisualUxScore(audit.visualUxDiagnostics.score)}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                              Confidence {audit.visualUxDiagnostics.visualUxConfidence ?? "High"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                              {audit.visualUxDiagnostics.visualMetricsAvailable === false
                                ? "Desktop metrics unavailable"
                                : audit.visualUxDiagnostics.desktopConcerns.length > 0
                                ? `${audit.visualUxDiagnostics.desktopConcerns.length} desktop concern${audit.visualUxDiagnostics.desktopConcerns.length === 1 ? "" : "s"}`
                                : "No desktop concerns"}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                              {audit.visualUxDiagnostics.visualMetricsAvailable === false
                                ? "Mobile metrics unavailable"
                                : audit.visualUxDiagnostics.mobileConcerns.length >
                                  0
                                ? `${audit.visualUxDiagnostics.mobileConcerns.length} mobile concern${audit.visualUxDiagnostics.mobileConcerns.length === 1 ? "" : "s"}`
                                : "No mobile concerns"}
                            </span>
                          </div>
                        </div>
                        {audit.visualUxDiagnostics.visualMetricsAvailable === false ? (
                          <p className="mt-3 text-sm text-secondary">
                            Reason: {audit.visualUxDiagnostics.unavailableReason ?? "Visual metrics could not be calculated from the page."}
                          </p>
                        ) : null}
                        {audit.visualUxDiagnostics.findings.length > 0 ? (
                          <div className="mt-5 space-y-3">
                            {audit.visualUxDiagnostics.findings
                              .slice(0, 3)
                              .map((finding) => (
                                <div
                                  key={finding.title}
                                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="font-semibold text-primary">
                                      {finding.title}
                                    </p>
                                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                                      {finding.viewport} • {finding.severity}
                                    </span>
                                  </div>
                                  <p className="mt-2 text-sm leading-6 text-secondary">
                                    {finding.evidenceSummary}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    <div className="mt-5 inline-flex max-w-full rounded-full border border-dark-border bg-white/[0.035] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Generated {new Date(audit.generatedAt).toLocaleString()}
                    </div>
                    <div className="print-hidden mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={handleExportReport}
                        className="btn border border-dark-border bg-white/[0.035] text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="print-hidden rounded-[1.5rem] border border-brand-cyan/35 bg-gradient-to-br from-brand-cyan/14 via-dark-card to-brand-blue/10 p-5 shadow-[0_24px_70px_rgba(6,182,212,0.14)] md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl border border-brand-cyan/40 bg-brand-cyan/14 text-brand-cyan">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-cyan">
                        Ask Zora
                      </p>
                      <h3 className="mt-2 text-2xl font-bold leading-tight text-primary">
                        Need help understanding this audit?
                      </h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-secondary">
                        Zora can explain every recommendation, why it matters, what
                        Opzix would validate, and what should happen next.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      openZoraWithAuditContext(auditSummaryZoraContext(audit))
                    }
                    className="inline-flex min-h-[3.25rem] w-full items-center justify-center rounded-xl border border-brand-cyan/55 bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-3 text-sm font-bold text-white shadow-[0_16px_42px_rgba(6,182,212,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(6,182,212,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-dark-deep md:w-auto"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Ask Zora About This Audit
                  </button>
                </div>
              </div>

              <div className="card-elevated p-6 md:p-8">
                <div className="grid gap-7 lg:grid-cols-[1.15fr_0.85fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Executive View
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                      Executive Summary
                    </h3>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-secondary">
                      {audit.executiveSummary.summary}
                    </p>
                    <p className="mt-5 max-w-3xl border-l border-brand-cyan/30 pl-4 leading-7 text-muted">
                      {audit.executiveSummary.businessInterpretation}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                    <p className="text-sm font-bold text-primary">
                      Highest-impact opportunities
                    </p>
                    <div className="mt-4 space-y-3">
                      {audit.executiveSummary.highestImpactOpportunities
                        .slice(0, 3)
                        .map((opportunity) => {
                          const parsedOpportunity =
                            parseExecutiveOpportunity(opportunity);

                          return (
                            <div
                              key={opportunity}
                              className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-secondary"
                            >
                              <Target className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                              <div className="min-w-0 space-y-2">
                                <p className="font-bold leading-snug text-primary">
                                  {parsedOpportunity.title}
                                </p>
                                {parsedOpportunity.evidence ? (
                                  <p>{parsedOpportunity.evidence}</p>
                                ) : null}
                                {parsedOpportunity.action ? (
                                  <p className="font-semibold text-brand-cyan">
                                    First action: {parsedOpportunity.action}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-brand-cyan/30 bg-gradient-to-br from-brand-blue/12 via-dark-card to-brand-cyan/8 p-6 shadow-[0_24px_70px_rgba(6,182,212,0.1)] md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                  Action Plan
                </p>
                <h3 className="mt-3 text-3xl font-bold text-primary">
                  Recommendation Roadmap
                </h3>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-secondary">
                  This roadmap is the shared source of truth for the report,
                  assistant, admin view, and follow-up conversations.
                </p>
                {(() => {
                  const roadmapSteps = roadmapStepsForAudit(audit);
                  const improvementEstimate = initialImprovementEstimate(roadmapSteps);

                  return (
                    <>
                      <p className="mt-4 max-w-3xl rounded-2xl border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3 text-sm leading-6 text-secondary">
                        {ROADMAP_ESTIMATE_DISCLAIMER}
                      </p>

                      {improvementEstimate ? (
                        <div className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                              Initial Improvement Range
                            </p>
                            <p className="mt-2 text-2xl font-bold text-primary">
                              {improvementEstimate.range}
                            </p>
                          </div>
                          {improvementEstimate.timeline ? (
                            <p className="text-sm font-semibold text-secondary">
                              Estimated Timeline: {improvementEstimate.timeline}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-7 grid gap-4 lg:grid-cols-4">
                        {roadmapSteps.map((step, index) => (
                          <div
                            key={`${step.stepNumber}-${step.title}`}
                            className="rounded-2xl border border-dark-border bg-dark-deep/75 p-5"
                          >
                            <div className="mb-5 flex items-center gap-3">
                              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-brand-cyan/15 text-sm font-bold text-brand-cyan">
                                {index + 1}
                              </div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                                {actionPlanLabel(index)}
                              </p>
                            </div>
                            <p className="text-lg font-semibold leading-snug text-primary">
                              {step.title}
                            </p>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">
                                  {roadmapRangeLabel(step.title)}
                                </p>
                                <p className="mt-1 text-sm font-bold text-primary">
                                  {step.cost}
                                </p>
                              </div>
                              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted">
                                  Timeline
                                </p>
                                <p className="mt-1 text-sm font-bold text-primary">
                                  {step.timeline}
                                </p>
                              </div>
                            </div>
                            <div className="mt-5 space-y-4">
                              {step.sourceFinding && (
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                                    Source
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-secondary">
                                    {sanitizeEvidenceText(step.sourceFinding)}
                                  </p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                                  Why
                                </p>
                                <p className="mt-1 text-sm leading-6 text-muted">
                                  {sanitizeEvidenceText(step.rationale, {
                                    maxLength: 180,
                                  })}
                                </p>
                              </div>
                              <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-3.5">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                                  Validate
                                </p>
                                <p className="mt-1 text-sm font-semibold leading-6 text-primary">
                                  {sanitizeEvidenceText(step.validationTarget, {
                                    maxLength: 180,
                                  })}
                                </p>
                              </div>
                              <div className="print-hidden rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                                  Need help understanding this?
                                </p>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openZoraWithAuditContext(
                                      recommendationZoraContext(audit, step, index),
                                    )
                                  }
                                  className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-brand-cyan/40 bg-brand-cyan/12 px-3 py-2 text-sm font-bold text-primary transition-all hover:-translate-y-0.5 hover:border-brand-cyan hover:bg-brand-cyan/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-cyan/50"
                                >
                                  <MessageCircle className="mr-2 h-4 w-4" />
                                  Ask Zora
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="card-elevated p-6 md:p-8">
                <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Audit Narrative
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                      The story behind this scan
                    </h3>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-secondary">
                      {audit.auditNarrative ?? audit.executiveSummary.summary}
                    </p>
                    {audit.connectedInsight && (
                      <div className="mt-5 rounded-2xl border border-brand-cyan/25 bg-brand-cyan/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                          Connected Insight
                        </p>
                        <h4 className="mt-2 text-lg font-bold leading-snug text-primary">
                          {audit.connectedInsight.title}
                        </h4>
                        <p className="mt-2 text-sm leading-6 text-secondary">
                          {audit.connectedInsight.insight}
                        </p>
                      </div>
                    )}
                    {primaryOperationalConcern(audit) && (
                      <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/5 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
                              Primary Operational Concern
                            </p>
                            <h4 className="mt-2 text-xl font-bold leading-snug text-primary">
                              {primaryOperationalConcern(audit)?.riskLabel}
                            </h4>
                          </div>
                          <span
                            className={`inline-flex w-fit flex-none rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] ${statusBadgeClasses(
                              primaryOperationalConcern(audit)?.severity ??
                                "Needs Review",
                            )}`}
                          >
                            {primaryOperationalConcern(audit)?.severity}
                          </span>
                        </div>
                        <p className="mt-4 max-w-2xl text-sm leading-6 text-secondary">
                          {primaryOperationalConcern(audit)?.explanation}
                        </p>
                        {primaryOperationalSupportingFindings(
                          primaryOperationalConcern(audit),
                        ).length > 0 ? (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {primaryOperationalSupportingFindings(
                              primaryOperationalConcern(audit),
                            ).map((finding) => (
                              <span
                                key={finding}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-secondary"
                              >
                                {finding}
                              </span>
                            ))}
                          </div>
                        ) : null}
                        <p className="mt-4 rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-3 text-sm font-semibold leading-6 text-primary">
                          {
                            primaryOperationalConcern(audit)
                              ?.recommendedFirstAction
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                    <p className="text-sm font-bold text-primary">
                      Priority evidence snapshot
                    </p>
                    {audit.topPriorityRisks.slice(0, 3).map((risk) => (
                      <div
                        key={risk.title}
                        className="rounded-xl border border-white/10 bg-white/[0.035] p-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <p className="font-semibold leading-snug text-primary">
                            {risk.riskLabel}
                          </p>
                          <span
                            className={`inline-flex w-fit flex-none rounded-full border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${statusBadgeClasses(
                              risk.severity,
                            )}`}
                          >
                            {risk.severity}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-secondary">
                          {sanitizeEvidenceText(
                            risk.evidenceSummary ?? risk.explanation,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="audit-print-only audit-print-cta audit-print-cta-slim">
                <p>
                  <strong>Book the follow-up:</strong> review this audit with
                  Opzix at {strategyCallDisplay}
                </p>
              </div>

              <div className="card-elevated p-6 md:p-8">
                <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Score Cards
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-primary">
                      Category score drivers
                    </h3>
                  </div>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted">
                    Scores summarize public-page evidence only. Each card shows
                    the main reason behind the number without turning the
                    summary into a raw diagnostics log.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {audit.categories.map((category) => (
                    <div
                      key={category.key}
                      className="rounded-2xl border border-dark-border bg-dark-deep/70 p-4"
                    >
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-bold text-primary">
                          {category.label}
                        </p>
                        {category.purpose && (
                          <p className="text-xs leading-5 text-muted">
                            {category.purpose}
                          </p>
                        )}
                        <span
                          className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${statusBadgeClasses(
                            category.status,
                          )}`}
                        >
                          {category.status}
                        </span>
                        {category.scoringConfidence ? (
                          <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
                            {category.scoringConfidence} confidence
                          </span>
                        ) : null}
                        {category.evidenceState === "Unknown" ? (
                          <span className="inline-flex w-fit rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-amber-100">
                            Evidence unknown
                          </span>
                        ) : null}
                      </div>
                      <p
                        className={`mt-5 text-4xl font-black ${
                          category.scoreUnavailable
                            ? "text-muted"
                            : scoreTone(category.score)
                        }`}
                      >
                        {category.scoreUnavailable ? "—" : category.score}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-snug text-primary">
                        {scoreContext(category)}
                      </p>
                      <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                          Main driver
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-secondary">
                          {scoreMainEvidence(category)}
                        </p>
                      </div>
                      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan"
                          style={{
                            width: category.scoreUnavailable
                              ? "0%"
                              : `${category.score}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {(() => {
                const visibleMarketingTools = getVisibleMarketingTools(
                  audit.diagnostics,
                );
                const marketingStatus = marketingStatusLabel(
                  visibleMarketingTools.length,
                );
                const commerce = audit.diagnostics.commerceFlowSignals;
                const nonStorefront = isNonStorefrontAudit(audit);

                return (
                  <div className="card-elevated p-6 md:p-8">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Platform & Marketing Visibility
                        </p>
                        <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                          {nonStorefront
                            ? "What the public page makes visible"
                            : "What the storefront makes visible"}
                        </h3>
                        <p className="mt-4 text-lg leading-relaxed text-secondary">
                          {platformMarketingInterpretation(audit)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                          Executive use
                        </p>
                        <p className="mt-3 leading-relaxed text-secondary">
                          {nonStorefront
                            ? "This section separates visible service, contact, and tracking signals from unconfirmed ecommerce assumptions."
                            : "This section separates what the public storefront exposes from what still needs manual confirmation, so platform assumptions do not overtake the audit story."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-cyan">
                          <ServerCog className="h-4 w-4" />
                          {nonStorefront ? "Public page platform" : "Storefront platform"}
                        </div>
                        <p className="text-2xl font-semibold text-secondary">
                          {platformDisplayName(audit)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-muted">
                          {audit.diagnostics.platformDetection
                            .confidenceLabel ??
                            confidenceLevel(
                              audit.diagnostics.platformDetection.confidence,
                            )}
                          {" - "}
                          {audit.diagnostics.platformDetection.confidence}%
                        </p>
                        {audit.diagnostics.platformDetection
                          .ecommerceProbability && (
                          <p className="mt-2 text-sm font-semibold text-brand-cyan">
                            Ecommerce probability{" "}
                            {nonStorefront
                              ? "Low"
                              : audit.diagnostics.platformDetection
                                  .ecommerceProbability.label}{" "}
                            -{" "}
                            {nonStorefront
                              ? 0
                              : audit.diagnostics.platformDetection
                                  .ecommerceProbability.probability}
                            %
                          </p>
                        )}
                        {audit.diagnostics.platformDetection.name ===
                          "Enterprise / Custom Commerce Stack" && (
                          <p className="mt-2 text-sm font-semibold text-amber-100">
                            Platform should be manually confirmed
                          </p>
                        )}
                        {audit.diagnostics.platformDetection.name ===
                          "Not an ecommerce storefront" && (
                          <p className="mt-2 text-sm font-semibold text-amber-100">
                            Ecommerce probability low
                          </p>
                        )}
                        {audit.diagnostics.platformDetection.name ===
                          "Ecommerce probability unclear" && (
                          <p className="mt-2 text-sm font-semibold text-amber-100">
                            Manual review recommended
                          </p>
                        )}
                        {audit.diagnostics.platformDetection.explanation && (
                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            {audit.diagnostics.platformDetection.explanation}
                          </p>
                        )}
                        {/* Site classification block */}
                        <div className="mt-4 rounded-xl border border-white/6 bg-white/[0.02] p-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-cyan">
                            Site Type
                          </p>
                          <p className="mt-1 text-sm font-semibold text-secondary">
                            {audit.siteType}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {audit.siteTypeReason}
                          </p>
                          {audit.diagnostics && audit.siteType && (
                            <div className="mt-2 text-xs text-muted">
                              <p className="font-semibold">Evidence</p>
                              <ul className="list-disc ml-4">
                                {(
                                  audit.diagnostics.platformDetection
                                    ?.evidence || []
                                )
                                  .slice(0, 3)
                                  .map((e, i) => (
                                    <li key={i}>{String(e)}</li>
                                  ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-cyan">
                            <BarChart3 className="h-4 w-4" />
                            Marketing visibility
                          </div>
                          <span
                            className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${marketingStatusClasses(
                              marketingStatus,
                            )}`}
                          >
                            {marketingStatus}
                          </span>
                        </div>
                        <p className="text-2xl font-semibold text-secondary">
                          {visibleMarketingTools.length} visible
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {visibleMarketingTools.length > 0
                            ? visibleMarketingTools
                                .map((tool) => tool.label)
                                .join(", ")
                            : "No supported marketing tools were visible in the loaded page context."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-cyan">
                          <Target className="h-4 w-4" />
                          {nonStorefront ? "Visible path" : "Commerce path"}
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            Cart:{" "}
                            {signalLabel(
                              nonStorefront ? false : commerce.cartVisible,
                            )}
                          </p>
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            Checkout:{" "}
                            {signalLabel(
                              nonStorefront ? false : commerce.checkoutVisible,
                            )}
                          </p>
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            Catalog:{" "}
                            {signalLabel(
                              nonStorefront
                                ? false
                                : commerce.productCatalogVisible,
                            )}
                          </p>
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            CTA/form:{" "}
                            {signalLabel(
                              commerce.ctaVisible || commerce.formVisible,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {showManualReviewChecklist(audit) && (
                      <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/5 p-5">
                        <p className="font-semibold text-amber-100">
                          Platform Manual Review Checklist
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          Confirm source assets, cart and checkout URL
                          structure, product URL patterns, frontend asset
                          domains, and team knowledge before making
                          platform-specific recommendations.
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setShowVisibilityDetails((current) => !current)
                      }
                      className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary sm:w-auto"
                    >
                      <ChevronDown
                        className={`mr-2 h-4 w-4 transition-transform ${
                          showVisibilityDetails ? "rotate-180" : ""
                        }`}
                      />
                      {showVisibilityDetails
                        ? "Hide evidence"
                        : "View evidence"}
                    </button>

                    {showVisibilityDetails && (
                      <div className="mt-5 grid gap-4 rounded-2xl border border-dark-border bg-dark-deep/70 p-5 text-sm leading-relaxed text-secondary lg:grid-cols-3">
                        <div>
                          <p className="font-semibold text-primary">
                            Platform evidence
                          </p>
                          <ul className="mt-3 list-disc space-y-2 pl-4">
                            {audit.diagnostics.platformDetection.details.map(
                              (detail) => (
                                <li key={detail}>{detail}</li>
                              ),
                            )}
                          </ul>
                          {audit.diagnostics.platformDetection
                            .recommendation && (
                            <p className="mt-4 rounded-xl border border-dark-border bg-white/[0.035] p-3 text-muted">
                              {
                                audit.diagnostics.platformDetection
                                  .recommendation
                              }
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-primary">
                            Marketing tool evidence
                          </p>
                          <div className="mt-3 space-y-3">
                            {visibleMarketingTools.length > 0 ? (
                              visibleMarketingTools.map((tool) => (
                                <div key={tool.key}>
                                  <p className="font-semibold text-secondary">
                                    {tool.label}
                                  </p>
                                  <p className="mt-1 text-muted">
                                    {tool.signals.length > 0
                                      ? tool.signals.join(", ")
                                      : tool.description}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted">
                                No supported marketing tools were detected from
                                public page markup, visible DOM content, or
                                loaded frontend asset references.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-primary">
                            Customer journey evidence
                          </p>
                          <div className="mt-3 space-y-2 text-muted">
                            <p>Cart: {signalLabel(commerce.cartVisible)}</p>
                            <p>
                              Checkout: {signalLabel(commerce.checkoutVisible)}
                            </p>
                            <p>
                              Product/catalog:{" "}
                              {signalLabel(commerce.productCatalogVisible)}
                            </p>
                            <p>Forms: {signalLabel(commerce.formVisible)}</p>
                            <p>
                              CTA labels:{" "}
                              {commerce.ctaLabels.length > 0
                                ? summarizeCtaLabels(commerce.ctaLabels)
                                : "No strong CTA labels were found in the visible page sample."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="print-hidden card-elevated p-5 sm:p-6 md:p-8">
                <div className="mb-8 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Browser Capture
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                      Live Diagnostics
                    </h3>
                    <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
                      Lightweight Playwright diagnostics from the submitted URL:
                      screenshots, metadata, console errors, and failed network
                      requests. Ecommerce guidance is generated from public-page
                      heuristic signals only.
                    </p>
                  </div>
                  <a
                    href={audit.diagnostics.finalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full max-w-full items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary sm:w-auto"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open scanned URL
                  </a>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-dark-border bg-dark-deep/70 p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Monitor className="h-5 w-5 flex-none text-brand-cyan" />
                        <h4 className="min-w-0 text-xl font-bold text-primary">
                          Desktop Screenshot Preview
                        </h4>
                      </div>
                      {audit.diagnostics.desktopScreenshotUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedScreenshot({
                              src: audit.diagnostics.desktopScreenshotUrl!,
                              label: "Desktop screenshot",
                            })
                          }
                          className="inline-flex w-full items-center justify-center rounded-xl border border-dark-border bg-white/[0.035] px-3 py-2 text-sm font-semibold text-secondary hover:border-brand-cyan hover:text-primary sm:w-auto"
                        >
                          <MousePointerClick className="mr-2 h-4 w-4 flex-none" />
                          Open full screenshot
                        </button>
                      )}
                    </div>
                    {audit.diagnostics.desktopScreenshotUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedScreenshot({
                            src: audit.diagnostics.desktopScreenshotUrl!,
                            label: "Desktop screenshot",
                          })
                        }
                        className="group block w-full max-w-full overflow-hidden rounded-2xl border border-dark-border text-left"
                      >
                        <img
                          src={audit.diagnostics.desktopScreenshotUrl}
                          alt={`Desktop screenshot of ${audit.website}`}
                          className="h-auto max-w-full aspect-[16/9] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </button>
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] p-6 text-center text-secondary">
                        Desktop screenshot could not be captured.
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-dark-border bg-dark-deep/70 p-4">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <Smartphone className="h-5 w-5 flex-none text-brand-cyan" />
                        <h4 className="min-w-0 text-xl font-bold text-primary">
                          Mobile Screenshot Preview
                        </h4>
                      </div>
                      {audit.diagnostics.mobileScreenshotUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedScreenshot({
                              src: audit.diagnostics.mobileScreenshotUrl!,
                              label: "Mobile screenshot",
                            })
                          }
                          className="inline-flex w-full items-center justify-center rounded-xl border border-dark-border bg-white/[0.035] px-3 py-2 text-sm font-semibold text-secondary hover:border-brand-cyan hover:text-primary sm:w-auto"
                        >
                          <MousePointerClick className="mr-2 h-4 w-4 flex-none" />
                          Open full screenshot
                        </button>
                      )}
                    </div>
                    {audit.diagnostics.mobileScreenshotUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedScreenshot({
                            src: audit.diagnostics.mobileScreenshotUrl!,
                            label: "Mobile screenshot",
                          })
                        }
                        className="group mx-auto block w-full max-w-[23rem] overflow-hidden rounded-2xl border border-dark-border text-left"
                      >
                        <img
                          src={audit.diagnostics.mobileScreenshotUrl}
                          alt={`Mobile screenshot of ${audit.website}`}
                          className="h-auto max-w-full aspect-[9/14] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </button>
                    ) : (
                      <div className="mx-auto flex aspect-[9/14] w-full max-w-[23rem] items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] p-6 text-center text-secondary">
                        Mobile screenshot could not be captured.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-dark-border bg-white/[0.035] p-4 sm:p-5">
                    <div className="mb-5 flex min-w-0 items-center gap-3">
                      <FileText className="h-5 w-5 flex-none text-brand-cyan" />
                      <h4 className="min-w-0 text-xl font-bold text-primary">
                        Metadata Summary
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="min-w-0 rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-bold text-primary">
                            Page title
                          </p>
                          {!audit.diagnostics.title && (
                            <span className="flex-none rounded-full border border-red-300/30 bg-red-400/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-100">
                              Missing
                            </span>
                          )}
                        </div>
                        <p className="break-words text-secondary">
                          {audit.diagnostics.title ??
                            "Missing title. Titles help users and search engines understand page context."}
                        </p>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-bold text-primary">
                            Meta description
                          </p>
                          {!audit.diagnostics.metaDescription && (
                            <span className="flex-none rounded-full border border-red-300/30 bg-red-400/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-100">
                              Missing
                            </span>
                          )}
                        </div>
                        <p className="break-words text-secondary">
                          {audit.diagnostics.metaDescription ??
                            "Missing description. Descriptions can improve search snippets and explain page relevance."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0 overflow-hidden rounded-[2rem] border border-dark-border bg-white/[0.035] p-4 sm:p-5">
                    <div className="mb-5 flex min-w-0 items-center gap-3">
                      <WifiOff className="h-5 w-5 flex-none text-brand-cyan" />
                      <h4 className="min-w-0 text-xl font-bold text-primary">
                        Console Diagnostics
                      </h4>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="min-w-0 rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <p className="text-sm font-bold text-primary">
                          Console errors
                        </p>
                        <p className="mt-2 text-3xl font-black text-brand-cyan">
                          {audit.diagnostics.consoleErrors.length}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <p className="text-sm font-bold text-primary">
                          Failed requests
                        </p>
                        <p className="mt-2 text-3xl font-black text-brand-cyan">
                          {audit.diagnostics.failedRequests.length}
                        </p>
                      </div>
                      <div className="min-w-0 rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <p className="text-sm font-bold text-primary">
                          Third-party warnings
                        </p>
                        <p className="mt-2 text-3xl font-black text-brand-cyan">
                          {
                            [
                              ...audit.diagnostics.consoleErrors,
                              ...audit.diagnostics.failedRequests,
                            ].filter((message) =>
                              /cdn|analytics|tag|pixel|gtm|google|facebook|meta|shopify|stripe|paypal/i.test(
                                message,
                              ),
                            ).length
                          }
                        </p>
                      </div>
                    </div>

                    {audit.diagnostics.consoleErrors.length === 0 &&
                    audit.diagnostics.failedRequests.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
                        No critical console issues detected.
                      </div>
                    ) : (
                      <div className="mt-4">
                        <p className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
                          Technical issues were detected. Review the raw logs
                          only when diagnosing scripts, blocked assets, or
                          tracking behavior.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowRawLogs((current) => !current)}
                          className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary sm:w-auto"
                        >
                          <ChevronDown
                            className={`mr-2 h-4 w-4 transition-transform ${
                              showRawLogs ? "rotate-180" : ""
                            }`}
                          />
                          {showRawLogs ? "Hide raw logs" : "View details"}
                        </button>

                        {showRawLogs && (
                          <div className="mt-4 space-y-3">
                            {[
                              ...audit.diagnostics.consoleErrors,
                              ...audit.diagnostics.failedRequests,
                            ]
                              .slice(0, 8)
                              .map((message) => (
                                <div
                                  key={message}
                                  className="break-words rounded-2xl border border-dark-border bg-dark-deep/70 p-4 text-sm leading-relaxed text-secondary"
                                >
                                  {message}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}

                    {audit.diagnostics.warnings.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {audit.diagnostics.warnings.map((warning) => (
                          <div
                            key={warning}
                            className="rounded-2xl border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-sm leading-relaxed text-secondary"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {(() => {
                const visibleMarketingTools = getVisibleMarketingTools(
                  audit.diagnostics,
                );
                const marketingStatus = marketingStatusLabel(
                  visibleMarketingTools.length,
                );
                const commerce = audit.diagnostics.commerceFlowSignals;
                const nonStorefront = isNonStorefrontAudit(audit);

                return (
                  <div className="hidden">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Platform & Marketing Visibility
                        </p>
                        <h3 className="mt-3 text-3xl font-bold text-primary">
                          {nonStorefront
                            ? "What the public page makes visible"
                            : "What the storefront makes visible"}
                        </h3>
                        <p className="mt-4 text-lg leading-relaxed text-secondary">
                          {platformMarketingInterpretation(audit)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-brand-cyan/30 bg-brand-blue/10 p-5">
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-cyan">
                          Business interpretation
                        </p>
                        <p className="mt-3 leading-relaxed text-secondary">
                          {nonStorefront
                            ? "Use this as a quick read on whether the public page exposes service, contact, tracking, or ecommerce evidence without assuming a cart path."
                            : "Use this as a quick read on whether the customer-facing storefront gives operators enough clues to discuss the platform, marketing measurement, and conversion path without touching private systems."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-3">
                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-cyan">
                          <ServerCog className="h-4 w-4" />
                          Storefront platform
                        </div>
                        <p className="text-2xl font-semibold text-secondary">
                          {platformDisplayName(audit)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-muted">
                          {audit.diagnostics.platformDetection
                            .confidenceLabel ??
                            confidenceLevel(
                              audit.diagnostics.platformDetection.confidence,
                            )}
                          {" - "}
                          {audit.diagnostics.platformDetection.confidence}%
                        </p>
                        {showManualReviewChecklist(audit) && (
                          <p className="mt-3 text-xs leading-relaxed text-muted">
                            {nonStorefront
                              ? "This result means the scanner did not find enough reliable product, catalog, cart, or checkout evidence to confirm an ecommerce storefront."
                              : "Some ecommerce platforms hide or heavily customize storefront signals. This result means the scanner did not find enough reliable public-page evidence."}
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-cyan">
                            <BarChart3 className="h-4 w-4" />
                            Marketing visibility
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${marketingStatusClasses(
                              marketingStatus,
                            )}`}
                          >
                            {marketingStatus}
                          </span>
                        </div>
                        <p className="text-2xl font-semibold text-secondary">
                          {visibleMarketingTools.length} visible
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {visibleMarketingTools.length > 0
                            ? visibleMarketingTools
                                .map((tool) => tool.label)
                                .join(", ")
                            : "No supported marketing tools were visible in the loaded page context."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-5">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-blue/10 px-3 py-2 text-sm font-semibold text-brand-cyan">
                          <Target className="h-4 w-4" />
                          CTA and forms
                        </div>
                        <p className="text-2xl font-semibold text-secondary">
                          {commerce.ctaVisible || commerce.formVisible
                            ? "Present"
                            : "Not prominent"}
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          {commerce.ctaCount} CTA label
                          {commerce.ctaCount === 1 ? "" : "s"} sampled; form
                          presence is{" "}
                          {commerce.formVisible ? "visible" : "not visible"}.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          label: "Cart presence",
                          value: signalLabel(
                            nonStorefront ? false : commerce.cartVisible,
                          ),
                          icon: ShoppingCart,
                        },
                        {
                          label: "Checkout presence",
                          value: signalLabel(
                            nonStorefront ? false : commerce.checkoutVisible,
                          ),
                          icon: ClipboardCheck,
                        },
                        {
                          label: "Product/catalog presence",
                          value: signalLabel(
                            nonStorefront
                              ? false
                              : commerce.productCatalogVisible,
                          ),
                          icon: FileText,
                        },
                        {
                          label: "CTA/form presence",
                          value: signalLabel(
                            commerce.ctaVisible || commerce.formVisible,
                          ),
                          icon: MousePointerClick,
                        },
                      ].map((item) => {
                        const Icon = item.icon;

                        return (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                          >
                            <Icon className="mb-4 h-5 w-5 text-brand-cyan" />
                            <p className="text-sm font-bold text-primary">
                              {item.label}
                            </p>
                            <p className="mt-2 text-lg font-semibold text-secondary">
                              {item.value}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {showManualReviewChecklist(audit) && (
                      <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-400/5 p-5">
                        <p className="font-semibold text-amber-100">
                          Platform Manual Review Checklist
                        </p>
                        <p className="mt-2 text-sm leading-relaxed text-muted">
                          Since platform visibility is limited, use this
                          checklist to manually identify the storefront
                          platform:
                        </p>
                        <ul className="mt-4 space-y-3">
                          <li className="flex items-start gap-3">
                            <span className="text-amber-300">✓</span>
                            <span className="text-sm text-secondary">
                              Review page source code for platform-specific
                              asset domains or script references
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-300">✓</span>
                            <span className="text-sm text-secondary">
                              Examine cart and checkout URL structure for
                              platform indicators (e.g., /cart.php, checkout/)
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-300">✓</span>
                            <span className="text-sm text-secondary">
                              Check product page URL patterns for clues about
                              platform architecture
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-300">✓</span>
                            <span className="text-sm text-secondary">
                              Review frontend asset domains for hosted scripts
                              or CDN patterns
                            </span>
                          </li>
                          <li className="flex items-start gap-3">
                            <span className="text-amber-300">✓</span>
                            <span className="text-sm text-secondary">
                              Confirm from known CMS, admin panel, or team
                              knowledge if available
                            </span>
                          </li>
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setShowVisibilityDetails((current) => !current)
                      }
                      className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary sm:w-auto"
                    >
                      <ChevronDown
                        className={`mr-2 h-4 w-4 transition-transform ${
                          showVisibilityDetails ? "rotate-180" : ""
                        }`}
                      />
                      {showVisibilityDetails ? "Hide details" : "View details"}
                    </button>

                    {showVisibilityDetails && (
                      <div className="mt-5 grid gap-4 rounded-2xl border border-dark-border bg-dark-deep/70 p-5 text-sm leading-relaxed text-secondary lg:grid-cols-3">
                        <div>
                          <p className="font-semibold text-primary">
                            Platform evidence
                          </p>
                          <ul className="mt-3 list-disc space-y-2 pl-4">
                            {audit.diagnostics.platformDetection.details.map(
                              (detail) => (
                                <li key={detail}>{detail}</li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold text-primary">
                            Marketing tool evidence
                          </p>
                          <div className="mt-3 space-y-3">
                            {visibleMarketingTools.length > 0 ? (
                              visibleMarketingTools.map((tool) => (
                                <div key={tool.key}>
                                  <p className="font-semibold text-secondary">
                                    {tool.label}
                                  </p>
                                  <p className="mt-1 text-muted">
                                    {tool.signals.length > 0
                                      ? tool.signals.join(", ")
                                      : tool.description}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted">
                                No supported marketing tools were detected from
                                public page markup, visible DOM content, or
                                loaded frontend asset references.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-primary">
                            Customer journey evidence
                          </p>
                          <div className="mt-3 space-y-2 text-muted">
                            <p>
                              Cart:{" "}
                              {signalLabel(
                                nonStorefront ? false : commerce.cartVisible,
                              )}
                            </p>
                            <p>
                              Checkout:{" "}
                              {signalLabel(
                                nonStorefront
                                  ? false
                                  : commerce.checkoutVisible,
                              )}
                            </p>
                            <p>
                              Product/catalog:{" "}
                              {signalLabel(
                                nonStorefront
                                  ? false
                                  : commerce.productCatalogVisible,
                              )}
                            </p>
                            <p>Forms: {signalLabel(commerce.formVisible)}</p>
                            <p>
                              CTA labels:{" "}
                              {commerce.ctaLabels.length > 0
                                ? summarizeCtaLabels(commerce.ctaLabels)
                                : "No strong CTA labels were found in the visible page sample."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="card-elevated p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                    Score Guidance
                  </p>
                  <h3 className="mt-3 text-3xl font-bold text-primary">
                    What This Score Means
                  </h3>
                  <div className="mt-6 space-y-3">
                    {[
                      {
                        label: "High Priority",
                        description:
                          "High priority issues should be fixed first because they are most likely to affect revenue, lead quality, tracking confidence, or operational flow.",
                      },
                      {
                        label: "Needs Review",
                        description:
                          "Needs Review items may affect conversion or operations and should be planned into the next improvement cycle.",
                      },
                      {
                        label: "Healthy",
                        description:
                          "Healthy areas appear stable in this lightweight scan, though they can still benefit from focused optimization.",
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                      >
                        <p className="font-bold text-primary">{item.label}</p>
                        <p className="mt-2 leading-relaxed text-secondary">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                    Benchmark Context
                  </p>
                  <h3 className="mt-3 text-3xl font-bold text-primary">
                    Compared with similar pages
                  </h3>
                  {audit.benchmarkContext?.benchmarkGroup ? (
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {(audit.benchmarkContext.benchmarkLabel === "Insufficient Data"
                        ? [
                            ["Group", audit.benchmarkContext.benchmarkGroup],
                            ["Benchmark", "Available"],
                            ["Confidence", "Low"],
                            ["Validation", "Additional validation required"],
                          ]
                        : [
                            ["Group", audit.benchmarkContext.benchmarkGroup],
                            [
                              "Percentile",
                              `${audit.benchmarkContext.percentileEstimate ?? 0}th`,
                            ],
                            ["Label", audit.benchmarkContext.benchmarkLabel ?? "Directional"],
                          ]
                      ).map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                        >
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                            {label}
                          </p>
                          <p className="mt-2 text-sm font-bold leading-6 text-primary">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <p className="mt-4 leading-relaxed text-secondary">
                    {audit.benchmarkContext?.explanation ??
                      audit.benchmarkContext?.summary ??
                      "This scanner will become more useful as we compare results across strong and weak ecommerce stores."}
                  </p>
                  {audit.benchmarkContext?.strengthsVsBenchmark?.length ||
                  audit.benchmarkContext?.weaknessesVsBenchmark?.length ? (
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-sm font-bold text-primary">
                          Strengths vs benchmark
                        </p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-secondary">
                          {(audit.benchmarkContext.strengthsVsBenchmark ?? [])
                            .slice(0, 3)
                            .map((strength) => (
                              <li key={strength}>+ {strength}</li>
                            ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-primary">
                          Weaknesses vs benchmark
                        </p>
                        <ul className="mt-2 space-y-2 text-sm leading-6 text-secondary">
                          {(audit.benchmarkContext.weaknessesVsBenchmark ?? [])
                            .slice(0, 3)
                            .map((weakness) => (
                              <li key={weakness}>- {weakness}</li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                  {audit.benchmarkContext?.benchmarkTags?.length ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {audit.benchmarkContext.benchmarkTags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-dark-border bg-white/[0.04] px-3 py-1 text-xs font-semibold text-secondary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {audit.benchmarkContext?.notes?.length ? (
                    <div className="mt-5 grid gap-3 md:grid-cols-2">
                      {audit.benchmarkContext.notes.map((note) => (
                        <div
                          key={`${note.message}-${note.tags.join("-")}`}
                          className={`rounded-2xl border p-4 ${benchmarkNoteClasses(note.tone)}`}
                        >
                          <p className="text-sm font-semibold leading-6 text-primary">
                            {note.message}
                          </p>
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                            Evidence
                          </p>
                          <p className="mt-1 text-sm leading-6 text-secondary">
                            {note.evidence}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {audit.benchmarkContext?.comparisonBasis?.length ? (
                    <p className="mt-5 rounded-2xl border border-dark-border bg-white/[0.035] p-4 text-sm leading-relaxed text-muted">
                      Basis:{" "}
                      {audit.benchmarkContext.comparisonBasis
                        .slice(0, 4)
                        .join("; ")}
                    </p>
                  ) : null}
                </div>
              </div>

              {audit.competitiveComparison || audit.revenueImpactSummary ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  {audit.competitiveComparison ? (
                    <div className="card-elevated p-6 md:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                        Competitive Context
                      </p>
                      <h3 className="mt-3 text-3xl font-bold text-primary">
                        What stronger peers usually show
                      </h3>
                      <p className="mt-4 leading-relaxed text-secondary">
                        {audit.competitiveComparison.explanation}
                      </p>
                      <div className="mt-5 flex flex-wrap gap-2">
                        {audit.competitiveComparison.comparisonSet.map((peer) => (
                          <span
                            key={peer}
                            className="rounded-full border border-dark-border bg-white/[0.04] px-3 py-1 text-xs font-semibold text-secondary"
                          >
                            {peer}
                          </span>
                        ))}
                      </div>
                      <ul className="mt-5 space-y-2 text-sm leading-6 text-secondary">
                        {audit.competitiveComparison.expectedPatterns.map((pattern) => (
                          <li key={pattern}>- {pattern}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {audit.revenueImpactSummary ? (
                    <div className="card-elevated p-6 md:p-8">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                        Revenue Impact
                      </p>
                      <h3 className="mt-3 text-3xl font-bold text-primary">
                        Business risk behind the findings
                      </h3>
                      <p className="mt-4 leading-relaxed text-secondary">
                        {audit.revenueImpactSummary.summary}
                      </p>
                      <div className="mt-5 space-y-3">
                        {audit.revenueImpactSummary.estimates
                          .slice(0, 3)
                          .map((estimate) => (
                            <div
                              key={`${estimate.findingTitle}-${estimate.riskArea}`}
                              className="rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                                {estimate.riskArea}
                              </p>
                              <p className="mt-2 text-sm font-bold leading-6 text-primary">
                                {estimate.findingTitle}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-secondary">
                                {estimate.likelyImpact}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="border-t border-dark-border pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                  Technical Appendix
                </p>
                <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                  Evidence by category
                </h3>
                <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
                  Use these findings when the executive action plan needs more
                  supporting detail. This keeps the top of the report readable
                  while preserving the audit trail.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {audit.categories.map((category) => (
                  <div key={category.key} className="card-elevated p-5 md:p-6">
                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Priority Review
                        </p>
                        <h3 className="mt-2 text-2xl font-bold leading-tight text-primary">
                          {category.label}
                        </h3>
                        {category.purpose && (
                          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                            {category.purpose}
                          </p>
                        )}
                      </div>
                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] ${statusBadgeClasses(
                          category.status,
                        )}`}
                      >
                        {category.status}
                      </span>
                    </div>

                    <div className="space-y-5">
                      {category.findings && category.findings.length > 0
                        ? category.findings.map((finding) => (
                            <div
                              key={finding.title}
                              className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                  <p className="text-lg font-bold leading-snug text-primary">
                                    {finding.title}
                                  </p>
                                </div>
                                <span
                                  className={`inline-flex w-fit flex-none rounded-full border px-3 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] ${statusBadgeClasses(
                                    finding.severity,
                                  )}`}
                                >
                                  {finding.severity}
                                </span>
                              </div>

                              <div className="mt-5 grid gap-3">
                                <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                                    Evidence
                                  </p>
                                  <p className="mt-2 text-sm leading-6 text-secondary">
                                    {sanitizeEvidenceText(
                                      finding.evidenceSummary,
                                    )}
                                  </p>
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="rounded-xl border border-dark-border bg-dark-deep/50 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                                      Impact
                                    </p>
                                     <p className="mt-2 text-sm leading-6 text-secondary">
                                       {finding.businessImpact}
                                     </p>
                                     {audit.revenueImpactSummary?.estimates.find(
                                       (estimate) =>
                                         estimate.findingTitle === finding.title,
                                     ) ? (
                                       <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-secondary">
                                         Revenue context:{" "}
                                         {
                                           audit.revenueImpactSummary.estimates.find(
                                             (estimate) =>
                                               estimate.findingTitle === finding.title,
                                           )?.likelyImpact
                                         }
                                       </p>
                                     ) : null}
                                   </div>
                                  <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                                      First action
                                    </p>
                                    <p className="mt-2 text-sm font-semibold leading-6 text-primary">
                                      {finding.recommendedFirstAction}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        : category.issues.map((issue) => (
                            <div
                              key={issue}
                              className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-secondary"
                            >
                              <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                              <p className="leading-6">{issue}</p>
                            </div>
                          ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                <div className="card-elevated p-6 md:p-8">
                  <ClipboardCheck className="mb-5 h-10 w-10 text-brand-cyan" />
                  <h3 className="text-2xl font-bold text-primary">
                    Want the Human Audit?
                  </h3>
                  <p className="mt-4 leading-relaxed text-secondary">
                    This tool is the MVP report structure. For a real review,
                    Opzix can manually inspect your storefront, checkout,
                    tracking, operations, backend workflows, and highest-impact
                    fixes.
                  </p>
                  <div className="mt-7">
                    <Button
                      href={STRATEGY_CALL_URL}
                      onClick={() =>
                        trackEvent("audit_cta_clicked", {
                          ...auditAttribution(audit),
                          sourceArea: "report",
                        })
                      }
                      trackingSource="audit_assistant"
                      variant="primary"
                      size="lg"
                    >
                      Talk With Opzix About This Audit
                    </Button>
                  </div>
                </div>

                <div className="card-elevated p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                    Report Positioning
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-primary">
                    Built for ecommerce operations reviews
                  </h3>
                  <p className="mt-4 leading-relaxed text-secondary">
                    This scanner keeps technical signals visible without making
                    them the whole story. The goal is to help a team discuss
                    conversion flow, tracking confidence, storefront clarity,
                    and operational handoff in one place.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-brand-cyan/30 bg-gradient-to-br from-brand-blue/15 via-dark-card to-brand-cyan/10 p-6 text-center shadow-[0_30px_80px_rgba(6,182,212,0.12)] md:p-10">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                  Human Review
                </p>
                <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                  Want a deeper review of this store?
                </h3>
                <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-secondary">
                  We can walk through your ecommerce system, identify the
                  highest-impact issues, and recommend what to fix first.
                </p>
                <div className="mt-8 flex justify-center">
                  <Button
                    href={STRATEGY_CALL_URL}
                    onClick={() =>
                      trackEvent("audit_cta_clicked", {
                        ...auditAttribution(audit),
                        sourceArea: "report",
                      })
                    }
                    trackingSource="audit_assistant"
                    variant="primary"
                    size="lg"
                  >
                    Talk With Opzix About This Audit
                  </Button>
                </div>
              </div>

              <div className="audit-print-only audit-print-footer">
                <p>Prepared by Opzix Audit Beta</p>
                <p>Review this audit with Opzix: {strategyCallDisplay}</p>
                <p>Generated {new Date(audit.generatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </Section>

      {expandedScreenshot && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={expandedScreenshot.label}
        >
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-dark-border bg-dark-deep shadow-2xl">
            <div className="flex min-w-0 items-center justify-between gap-4 border-b border-dark-border p-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
                  Screenshot Preview
                </p>
                <h3 className="mt-1 text-lg font-bold text-primary">
                  {expandedScreenshot.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpandedScreenshot(null)}
                className="flex-none rounded-full border border-dark-border bg-white/5 p-2 text-secondary hover:border-brand-cyan hover:text-primary"
                aria-label="Close screenshot preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(92vh-5rem)] overflow-auto p-4">
              <img
                src={expandedScreenshot.src}
                alt={expandedScreenshot.label}
                className="mx-auto h-auto max-w-full rounded-2xl border border-dark-border"
              />
            </div>
          </div>
        </div>
      )}

      {audit && !resultsInView && (
        <div className="fixed inset-x-3 bottom-3 z-[70] md:hidden">
          <div className="rounded-2xl border border-brand-cyan/40 bg-dark-card/95 p-3 shadow-card-glow backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-primary">
                  Audit ready
                </p>
                <p className="truncate text-xs text-secondary">
                  View your score and report.
                </p>
              </div>
              <button
                type="button"
                onClick={() => scrollToResults()}
                className="btn btn-primary min-h-10 !w-auto !max-w-none flex-none px-4 py-2 text-sm"
              >
                View Results
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .audit-print-only {
          display: none;
        }

        @media print {
          @page {
            margin: 0.68in 0.55in 0.78in;

            @bottom-left {
              color: #4b5563;
              content: "Prepared by Opzix Audit Beta";
              font-family: Arial, sans-serif;
              font-size: 9px;
              font-weight: 700;
            }

            @bottom-right {
              color: #4b5563;
              content: "Page " counter(page) " of " counter(pages);
              font-family: Arial, sans-serif;
              font-size: 9px;
              font-weight: 700;
            }
          }

          html,
          body {
            background: #ffffff !important;
            color: #111827 !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          body > header,
          body > nav,
          body > footer,
          header,
          nav,
          footer,
          form,
          input,
          textarea,
          select,
          button,
          [role="dialog"],
          .hero-atmosphere,
          .print-hidden {
            display: none !important;
          }

          .scanner-report-scope {
            max-width: none !important;
            width: 100% !important;
            overflow: visible !important;
          }

          .scanner-report-scope *,
          .scanner-report-scope *::before,
          .scanner-report-scope *::after {
            box-shadow: none !important;
            text-shadow: none !important;
          }

          .audit-print-only {
            display: block !important;
          }

          .audit-print-header {
            border-bottom: 2px solid #111827;
            margin-bottom: 24px;
            padding-bottom: 18px;
          }

          .audit-print-brand-row {
            align-items: center;
            display: flex;
            gap: 12px;
            margin-bottom: 8px;
          }

          .audit-print-logo-mark {
            align-items: center;
            background: #061827 !important;
            border: 2px solid #0891b2;
            border-radius: 12px;
            color: #ffffff !important;
            display: flex;
            font-size: 20px;
            font-weight: 900;
            height: 42px;
            justify-content: center;
            letter-spacing: 0;
            width: 42px;
          }

          .audit-print-kicker {
            color: #0f766e;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.18em;
            margin: 0 0 6px;
            text-transform: uppercase;
          }

          .audit-print-header h1 {
            color: #111827;
            font-size: 28px;
            line-height: 1.15;
            margin: 0;
          }

          .audit-print-prepared {
            color: #374151 !important;
            font-size: 12px;
            font-weight: 800;
            margin: 0 0 16px;
          }

          .audit-print-header dl {
            display: grid;
            gap: 8px 18px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin: 0;
          }

          .audit-print-header div {
            break-inside: avoid;
          }

          .audit-print-header dt {
            color: #4b5563;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .audit-print-header dd {
            color: #111827;
            font-size: 13px;
            font-weight: 700;
            margin: 2px 0 0;
            overflow-wrap: anywhere;
          }

          .audit-print-cta {
            align-items: center;
            background: #ecfeff !important;
            border: 2px solid #0891b2;
            border-radius: 16px;
            display: flex !important;
            gap: 20px;
            justify-content: space-between;
            margin: 0 0 24px;
            padding: 16px 18px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .audit-print-cta-slim {
            margin: 20px 0 24px;
            padding: 12px 16px;
          }

          .audit-print-cta-slim p {
            color: #111827 !important;
            font-size: 12px;
            font-weight: 700;
            margin: 0;
          }

          .audit-print-cta-label {
            color: #0f766e !important;
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 0.16em;
            margin: 0 0 4px;
            text-transform: uppercase;
          }

          .audit-print-cta-title {
            color: #111827 !important;
            font-size: 18px;
            font-weight: 900;
            margin: 0 0 4px;
          }

          .audit-print-cta-copy {
            color: #374151 !important;
            font-size: 12px;
            font-weight: 600;
            line-height: 1.45;
            margin: 0;
            max-width: 5.6in;
          }

          .audit-print-schedule-box {
            background: #ffffff !important;
            border: 1px solid #0891b2;
            border-radius: 12px;
            flex: 0 0 2.2in;
            padding: 10px 12px;
          }

          .audit-print-schedule-box p {
            color: #0f766e !important;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.14em;
            margin: 0 0 4px;
            text-transform: uppercase;
          }

          .audit-print-schedule-box strong {
            color: #111827 !important;
            display: block;
            font-size: 10px;
            line-height: 1.35;
            overflow-wrap: anywhere;
          }

          .scanner-report-scope .space-y-8 > * {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .scanner-report-scope .card,
          .scanner-report-scope .card-elevated,
          .scanner-report-scope [class*="rounded-"] {
            background: #ffffff !important;
            border-color: #d1d5db !important;
            color: #111827 !important;
          }

          .scanner-report-scope [class*="bg-dark"],
          .scanner-report-scope [class*="bg-brand"],
          .scanner-report-scope [class*="bg-gradient"],
          .scanner-report-scope [class*="bg-white/"],
          .scanner-report-scope [class*="bg-amber"],
          .scanner-report-scope [class*="bg-emerald"],
          .scanner-report-scope [class*="bg-red"] {
            background: #ffffff !important;
          }

          .scanner-report-scope .text-primary,
          .scanner-report-scope .text-secondary,
          .scanner-report-scope .text-muted,
          .scanner-report-scope .text-brand-cyan,
          .scanner-report-scope .text-amber-100,
          .scanner-report-scope .text-emerald-100,
          .scanner-report-scope [class*="text-"] {
            color: #111827 !important;
          }

          .scanner-report-scope p,
          .scanner-report-scope li,
          .scanner-report-scope dd {
            color: #1f2937 !important;
          }

          .scanner-report-scope h1,
          .scanner-report-scope h2,
          .scanner-report-scope h3,
          .scanner-report-scope h4 {
            color: #111827 !important;
            page-break-after: avoid;
          }

          .scanner-report-scope .grid {
            gap: 14px !important;
          }

          .scanner-report-scope [class*="overflow"] {
            overflow: visible !important;
          }

          .scanner-report-scope img {
            display: none !important;
          }

          .scanner-report-scope a {
            color: #111827 !important;
            text-decoration: none !important;
          }

          .scanner-report-scope .btn,
          .scanner-report-scope [aria-label],
          .scanner-report-scope svg {
            display: none !important;
          }

          .scanner-report-scope ul,
          .scanner-report-scope ol {
            break-inside: avoid;
          }

          .audit-print-footer {
            border-top: 2px solid #111827;
            margin-top: 28px;
            padding-top: 14px;
          }

          .audit-print-footer p {
            color: #111827 !important;
            font-size: 12px;
            font-weight: 700;
            margin: 3px 0;
          }
        }
      `}</style>
    </>
  );
}
