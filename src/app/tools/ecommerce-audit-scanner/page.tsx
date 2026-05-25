"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import PostScanAssistant from "@/components/PostScanAssistant";
import Section from "@/components/Section";
import { sanitizeEvidenceText, summarizeCtaLabels } from "@/lib/evidence-cleanup";
import {
  BarChart3,
  ChevronDown,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Loader2,
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

type AuditCategory = {
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
  findings?: HeuristicFinding[];
  influencingFindings?: string[];
};

type AuditResult = {
  website: string;
  mode: "mock";
  generatedAt: string;
  overallScore: number;
  overallStatus: string;
  overallExplanation: string;
  summary: string;
  executiveSummary: ExecutiveSummary;
  auditNarrative?: string;
  connectedInsight?: ConnectedInsight | null;
  primaryOperationalConcern?: PrimaryOperationalConcern | null;
  topPriorityRisks: TopPriorityRisk[];
  heuristicFindings?: HeuristicFinding[];
  diagnostics: LiveDiagnostics;
  categories: AuditCategory[];
  recommendedNextSteps: RecommendedNextStep[];
  benchmarkTags?: string[];
  benchmarkContext?: BenchmarkContext;
};

type HeuristicFinding = {
  title: string;
  category: string;
  primaryCategory?: string;
  secondaryCategories?: string[];
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: "Low" | "Moderate" | "High" | "Needs Review";
  businessImpact: string;
  recommendedFirstAction: string;
  evidenceSummary: string;
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

type OperationalConcernView = PrimaryOperationalConcern | TopPriorityRisk | null;

type BenchmarkNote = {
  message: string;
  evidence: string;
  tags: string[];
  tone: "positive" | "negative" | "mixed";
};

type BenchmarkContext = {
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
    confidence: number;
    confidenceLabel: string;
    details: string[];
    explanation?: string;
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

const scoreCards = [
  {
    label: "Mobile Journey",
    description: "CTA visibility, readability, action clarity",
    icon: Wand2,
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

  if (status === "Needs Review" || status === "Medium") {
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

  if (platform.name === "Unknown") {
    return "Platform not confidently identified";
  }

  return platform.name;
}

function showManualReviewChecklist(audit: AuditResult) {
  const platform = audit.diagnostics.platformDetection;
  return (
    platform.name === "Unknown" ||
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

  if (platform.name === "Unknown" && marketingTools.length === 0) {
    return "The public storefront page did not expose clear platform or common marketing tags in this scan. This may indicate a custom, headless, or heavily customized storefront. Platform visibility is limited and should be manually confirmed before making platform-specific recommendations.";
  }

  const platformText =
    platform.name === "Unknown"
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
  return index === 0 ? "First" : index === 1 ? "Next" : "Then";
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
  const [showRawLogs, setShowRawLogs] = useState(false);
  const [showVisibilityDetails, setShowVisibilityDetails] = useState(false);
  const [expandedScreenshot, setExpandedScreenshot] = useState<{
    src: string;
    label: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedWebsite = normalizeWebsiteInput(website);

    if (!isValidHttpUrl(normalizedWebsite)) {
      setError("Enter a valid website URL, such as https://example.com.");
      setAudit(null);
      return;
    }

    setIsLoading(true);
    setError("");

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
    } catch {
      setError("Something went wrong while generating the preview report.");
      setAudit(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Section bgColor="secondary" className="hero-atmosphere" padded>
        <div className="grid min-w-0 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
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
              <label
                htmlFor="website"
                className="mb-3 block text-sm font-semibold text-primary"
              >
                Website URL
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id="website"
                  type="text"
                  inputMode="url"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://yourstore.com"
                  className="min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none transition-colors placeholder:text-muted focus:border-brand-cyan focus:ring-2 focus:ring-brand-cyan/20"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary min-h-12 w-full sm:w-auto sm:min-w-[11rem]"
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
                <div className="mt-4 rounded-2xl border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-100">
                  {error}
                </div>
              )}

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
            </form>
          </div>

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
            <div className="space-y-8">
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
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Report Generated
                    </p>
                    <h2 className="mt-3 break-words text-3xl font-bold text-primary md:text-4xl">
                      Ecommerce Audit Preview for {audit.website}
                    </h2>
                    <p className="mt-4 leading-relaxed text-secondary">
                      {audit.summary}
                    </p>
                    <div className="mt-5 inline-flex max-w-full rounded-full border border-dark-border bg-white/[0.035] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                      Generated {new Date(audit.generatedAt).toLocaleString()}
                    </div>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        disabled
                        className="btn border border-dark-border bg-white/[0.035] text-muted opacity-70"
                        title="Export coming soon"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export Report
                      </button>
                      <span className="inline-flex items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-muted">
                        Export coming soon
                      </span>
                    </div>
                  </div>
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
                      {audit.executiveSummary.highestImpactOpportunities.slice(0, 3).map(
                        (opportunity) => {
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
                        },
                      )}
                    </div>
                  </div>
                </div>
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
                      {audit.auditNarrative ??
                        audit.executiveSummary.summary}
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
                              primaryOperationalConcern(audit)?.severity ?? "Needs Review",
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
                          {primaryOperationalConcern(audit)?.recommendedFirstAction}
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

              <div className="rounded-[2rem] border border-brand-cyan/30 bg-gradient-to-br from-brand-blue/12 via-dark-card to-brand-cyan/8 p-6 shadow-[0_24px_70px_rgba(6,182,212,0.1)] md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                  Action Plan
                </p>
                <h3 className="mt-3 text-3xl font-bold text-primary">
                  What to Review First
                </h3>
                <div className="mt-7 grid gap-4 lg:grid-cols-3">
                  {audit.recommendedNextSteps.map((step, index) => (
                    <div
                      key={step.action}
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
                        {step.title ?? step.action}
                      </p>
                      <div className="mt-5 space-y-4">
                        {step.evidenceClue && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                              Evidence
                            </p>
                            <p className="mt-1 text-sm leading-6 text-secondary">
                              {sanitizeEvidenceText(step.evidenceClue)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                            Impact
                          </p>
                          <p className="mt-1 text-sm leading-6 text-muted">
                            {sanitizeEvidenceText(step.why, { maxLength: 180 })}
                          </p>
                        </div>
                        {step.title && (
                          <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 p-3.5">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                              First action
                            </p>
                            <p className="mt-1 text-sm font-semibold leading-6 text-primary">
                              {sanitizeEvidenceText(step.action, {
                                maxLength: 180,
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <PostScanAssistant audit={audit} />

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
                      </div>
                      <p
                        className={`mt-5 text-4xl font-black ${scoreTone(category.score)}`}
                      >
                        {category.score}
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
                          style={{ width: `${category.score}%` }}
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

                return (
                  <div className="card-elevated p-6 md:p-8">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Platform & Marketing Visibility
                        </p>
                        <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                          What the storefront makes visible
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
                          This section separates what the public storefront
                          exposes from what still needs manual confirmation, so
                          platform assumptions do not overtake the audit story.
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
                          {confidenceLevel(
                            audit.diagnostics.platformDetection.confidence,
                          )}
                          {" - "}
                          {audit.diagnostics.platformDetection.confidence}%
                        </p>
                        {audit.diagnostics.platformDetection.explanation && (
                          <p className="mt-3 text-sm leading-relaxed text-muted">
                            {audit.diagnostics.platformDetection.explanation}
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
                          Commerce path
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            Cart: {signalLabel(commerce.cartVisible)}
                          </p>
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            Checkout: {signalLabel(commerce.checkoutVisible)}
                          </p>
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            Catalog: {signalLabel(commerce.productCatalogVisible)}
                          </p>
                          <p className="rounded-xl border border-white/10 bg-white/[0.035] p-3 text-secondary">
                            CTA/form:{" "}
                            {signalLabel(commerce.ctaVisible || commerce.formVisible)}
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
                      {showVisibilityDetails ? "Hide evidence" : "View evidence"}
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

              <div className="card-elevated p-5 sm:p-6 md:p-8">
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

                return (
                  <div className="hidden">
                    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Platform & Marketing Visibility
                        </p>
                        <h3 className="mt-3 text-3xl font-bold text-primary">
                          What the storefront makes visible
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
                          Use this as a quick read on whether the
                          customer-facing storefront gives operators enough
                          clues to discuss the platform, marketing measurement,
                          and conversion path without touching private systems.
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
                          {confidenceLevel(
                            audit.diagnostics.platformDetection.confidence,
                          )}
                          {" - "}
                          {audit.diagnostics.platformDetection.confidence}%
                        </p>
                        {showManualReviewChecklist(audit) && (
                          <p className="mt-3 text-xs leading-relaxed text-muted">
                            Some ecommerce platforms hide or heavily customize
                            storefront signals. This result means the scanner
                            did not find enough reliable public-page evidence.
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
                          value: signalLabel(commerce.cartVisible),
                          icon: ShoppingCart,
                        },
                        {
                          label: "Checkout presence",
                          value: signalLabel(commerce.checkoutVisible),
                          icon: ClipboardCheck,
                        },
                        {
                          label: "Product/catalog presence",
                          value: signalLabel(commerce.productCatalogVisible),
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
                    Benchmark Notes
                  </p>
                  <h3 className="mt-3 text-3xl font-bold text-primary">
                    Internal comparison context
                  </h3>
                  <p className="mt-4 leading-relaxed text-secondary">
                    {audit.benchmarkContext?.summary ??
                      "This scanner will become more useful as we compare results across strong and weak ecommerce stores."}
                  </p>
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
                  <p className="mt-5 rounded-2xl border border-dark-border bg-white/[0.035] p-4 text-sm leading-relaxed text-muted">
                    For now, treat benchmarks as directional rather than
                    definitive. These notes reflect current internal comparison
                    criteria and observed public-page evidence, not percentile
                    rankings or market-wide claims.
                  </p>
                </div>
              </div>

              <div className="border-t border-dark-border pt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                  Detailed Findings
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
                      {category.findings && category.findings.length > 0 ? (
                        category.findings.map((finding) => (
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
                                  {sanitizeEvidenceText(finding.evidenceSummary)}
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
                      ) : (
                        category.issues.map((issue) => (
                          <div
                            key={issue}
                            className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-secondary"
                          >
                            <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                            <p className="leading-6">{issue}</p>
                          </div>
                        ))
                      )}
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
                    Opun can manually inspect your storefront, checkout,
                    tracking, operations, backend workflows, and highest-impact
                    fixes.
                  </p>
                  <div className="mt-7">
                    <Button
                      href="/contact?source=ecommerce-audit"
                      variant="primary"
                      size="lg"
                    >
                      Book Free Ecommerce Audit
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
                    href="/contact?source=ecommerce-audit"
                    variant="primary"
                    size="lg"
                  >
                    Book Free Ecommerce Audit
                  </Button>
                </div>
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
    </>
  );
}
