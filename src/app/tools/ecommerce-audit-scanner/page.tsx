"use client";

import { FormEvent, useState } from "react";
import Button from "@/components/Button";
import Section from "@/components/Section";
import {
  AlertTriangle,
  BarChart3,
  Check,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Monitor,
  Search,
  ServerCog,
  ShoppingCart,
  Sparkles,
  Smartphone,
  Target,
  Wand2,
  WifiOff,
} from "lucide-react";

type AuditCategory = {
  key: string;
  label: string;
  score: number;
  status: string;
  explanation: string;
  priority: "Low" | "Medium" | "High";
  issues: string[];
};

type AuditResult = {
  website: string;
  mode: "mock";
  generatedAt: string;
  overallScore: number;
  overallStatus: string;
  overallExplanation: string;
  summary: string;
  diagnostics: LiveDiagnostics;
  categories: AuditCategory[];
  recommendedNextSteps: string[];
};

type LiveDiagnostics = {
  finalUrl: string;
  title: string | null;
  metaDescription: string | null;
  desktopScreenshotUrl: string | null;
  mobileScreenshotUrl: string | null;
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
    label: "UX/UI",
    description: "Navigation, mobile clarity, page hierarchy",
    icon: Wand2,
  },
  {
    label: "Conversion",
    description: "CTA clarity, trust, lead and checkout friction",
    icon: Target,
  },
  {
    label: "Technical",
    description: "Performance, metadata, template stability",
    icon: ServerCog,
  },
  {
    label: "Tracking",
    description: "Events, attribution, campaign visibility",
    icon: BarChart3,
  },
  {
    label: "Operations",
    description: "Order flow, support routing, backend handoffs",
    icon: ShoppingCart,
  },
];

const recentScans = [
  {
    website: "https://example-store.com",
    score: 67,
    date: "Mock data",
    status: "Review needed",
  },
  {
    website: "https://demo-fashion.co",
    score: 74,
    date: "Mock data",
    status: "Watchlist",
  },
  {
    website: "https://sample-homegoods.com",
    score: 59,
    date: "Mock data",
    status: "High priority",
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

function priorityClasses(priority: AuditCategory["priority"]) {
  if (priority === "High") {
    return "border-red-300/30 bg-red-400/10 text-red-100";
  }

  if (priority === "Medium") {
    return "border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan";
  }

  return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
}

function scoreTone(score: number) {
  if (score < 65) {
    return "text-red-100";
  }

  if (score < 80) {
    return "text-brand-cyan";
  }

  return "text-emerald-100";
}

export default function EcommerceAuditScannerPage() {
  const [website, setWebsite] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [audit, setAudit] = useState<AuditResult | null>(null);

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
            : data.error
        );
        setAudit(null);
        return;
      }

      setAudit(data.audit);
      setWebsite(normalizedWebsite);
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
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
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
              className="mt-8 rounded-[2rem] border border-dark-border bg-dark-card p-4 shadow-card-glow sm:p-5"
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

          <div className="card-elevated relative overflow-hidden p-5 md:p-6">
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
        <div className="mx-auto max-w-6xl">
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
                        audit.overallScore
                      )}`}
                    >
                      {audit.overallScore}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-secondary">
                      {audit.overallStatus}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted">
                      {audit.overallExplanation}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Report Generated
                    </p>
                    <h2 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                      Ecommerce Audit Preview for {audit.website}
                    </h2>
                    <p className="mt-4 leading-relaxed text-secondary">
                      {audit.summary}
                    </p>
                    <div className="mt-5 inline-flex rounded-full border border-dark-border bg-white/[0.035] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted">
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
                      <span className="inline-flex items-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-muted">
                        Export coming soon
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-5">
                {audit.categories.map((category) => (
                  <div key={category.key} className="card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-bold text-primary">
                        {category.label}
                      </p>
                      <span
                        className={`rounded-full border px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] ${priorityClasses(
                          category.priority
                        )}`}
                      >
                        {category.priority}
                      </span>
                    </div>
                    <p className={`mt-5 text-4xl font-black ${scoreTone(category.score)}`}>
                      {category.score}
                    </p>
                    <p className="mt-2 text-sm font-bold text-primary">
                      {category.status}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {category.explanation}
                    </p>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan"
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card-elevated p-6 md:p-8">
                <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                      Browser Capture
                    </p>
                    <h3 className="mt-3 text-3xl font-bold text-primary md:text-4xl">
                      Live Diagnostics
                    </h3>
                    <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
                      Lightweight Playwright diagnostics from the submitted URL:
                      screenshots, metadata, console errors, and failed network
                      requests. Strategic recommendations remain mock analysis.
                    </p>
                  </div>
                  <a
                    href={audit.diagnostics.finalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-2xl border border-dark-border bg-white/[0.035] px-4 py-3 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open scanned URL
                  </a>
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <div className="rounded-[2rem] border border-dark-border bg-dark-deep/70 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-brand-cyan" />
                      <h4 className="text-xl font-bold text-primary">
                        Desktop Screenshot Preview
                      </h4>
                    </div>
                    {audit.diagnostics.desktopScreenshotUrl ? (
                      <img
                        src={audit.diagnostics.desktopScreenshotUrl}
                        alt={`Desktop screenshot of ${audit.website}`}
                        className="aspect-[16/10] w-full rounded-2xl border border-dark-border object-cover object-top"
                      />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] p-6 text-center text-secondary">
                        Desktop screenshot could not be captured.
                      </div>
                    )}
                  </div>

                  <div className="rounded-[2rem] border border-dark-border bg-dark-deep/70 p-4">
                    <div className="mb-4 flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-brand-cyan" />
                      <h4 className="text-xl font-bold text-primary">
                        Mobile Screenshot Preview
                      </h4>
                    </div>
                    {audit.diagnostics.mobileScreenshotUrl ? (
                      <img
                        src={audit.diagnostics.mobileScreenshotUrl}
                        alt={`Mobile screenshot of ${audit.website}`}
                        className="mx-auto aspect-[9/14] max-h-[34rem] w-full max-w-[18rem] rounded-2xl border border-dark-border object-cover object-top"
                      />
                    ) : (
                      <div className="mx-auto flex aspect-[9/14] max-h-[34rem] w-full max-w-[18rem] items-center justify-center rounded-2xl border border-dark-border bg-white/[0.035] p-6 text-center text-secondary">
                        Mobile screenshot could not be captured.
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[2rem] border border-dark-border bg-white/[0.035] p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-brand-cyan" />
                      <h4 className="text-xl font-bold text-primary">
                        Metadata Summary
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-primary">
                            Page title
                          </p>
                          {!audit.diagnostics.title && (
                            <span className="rounded-full border border-red-300/30 bg-red-400/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-100">
                              Missing
                            </span>
                          )}
                        </div>
                        <p className="break-words text-secondary">
                          {audit.diagnostics.title ??
                            "Missing title. Titles help users and search engines understand page context."}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-primary">
                            Meta description
                          </p>
                          {!audit.diagnostics.metaDescription && (
                            <span className="rounded-full border border-red-300/30 bg-red-400/10 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.14em] text-red-100">
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

                  <div className="rounded-[2rem] border border-dark-border bg-white/[0.035] p-5">
                    <div className="mb-5 flex items-center gap-3">
                      <WifiOff className="h-5 w-5 text-brand-cyan" />
                      <h4 className="text-xl font-bold text-primary">
                        Console Diagnostics
                      </h4>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <p className="text-sm font-bold text-primary">
                          Console errors
                        </p>
                        <p className="mt-2 text-3xl font-black text-brand-cyan">
                          {audit.diagnostics.consoleErrors.length}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-dark-border bg-dark-deep/70 p-4">
                        <p className="text-sm font-bold text-primary">
                          Failed requests
                        </p>
                        <p className="mt-2 text-3xl font-black text-brand-cyan">
                          {audit.diagnostics.failedRequests.length}
                        </p>
                      </div>
                    </div>

                    {audit.diagnostics.consoleErrors.length === 0 &&
                    audit.diagnostics.failedRequests.length === 0 ? (
                      <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
                        No critical console issues detected.
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {[
                          ...audit.diagnostics.consoleErrors,
                          ...audit.diagnostics.failedRequests,
                        ]
                          .slice(0, 5)
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
                        label: "High priority",
                        description:
                          "High priority issues should be fixed first because they are most likely to affect revenue, lead quality, tracking confidence, or operational flow.",
                      },
                      {
                        label: "Medium priority",
                        description:
                          "Medium priority issues may affect conversion or operations and should be planned into the next improvement cycle.",
                      },
                      {
                        label: "Low priority",
                        description:
                          "Low priority issues are polish or optimization items that can improve the experience after the core system is working cleanly.",
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
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                        Placeholder Storage
                      </p>
                      <h3 className="mt-3 text-3xl font-bold text-primary">
                        Recent Scans
                      </h3>
                    </div>
                    <span className="rounded-full border border-dark-border bg-white/[0.035] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                      Mock data
                    </span>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-muted">
                    This table is a placeholder until database storage is added.
                  </p>

                  <div className="hidden overflow-hidden rounded-2xl border border-dark-border md:block">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-white/[0.04] text-muted">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Website URL</th>
                          <th className="px-4 py-3 font-semibold">Score</th>
                          <th className="px-4 py-3 font-semibold">Date</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border">
                        {recentScans.map((scan) => (
                          <tr key={scan.website}>
                            <td className="px-4 py-3 text-secondary">
                              {scan.website}
                            </td>
                            <td className="px-4 py-3 font-bold text-brand-cyan">
                              {scan.score}
                            </td>
                            <td className="px-4 py-3 text-muted">{scan.date}</td>
                            <td className="px-4 py-3 text-secondary">
                              {scan.status}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="grid gap-3 md:hidden">
                    {recentScans.map((scan) => (
                      <div
                        key={scan.website}
                        className="rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                      >
                        <p className="break-words text-sm font-bold text-primary">
                          {scan.website}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <p className="text-muted">Score</p>
                            <p className="mt-1 font-bold text-brand-cyan">
                              {scan.score}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Date</p>
                            <p className="mt-1 font-semibold text-secondary">
                              {scan.date}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted">Status</p>
                            <p className="mt-1 font-semibold text-secondary">
                              {scan.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {audit.categories.map((category) => (
                  <div key={category.key} className="card-elevated p-6">
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                          Priority Review
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-primary">
                          {category.label}
                        </h3>
                      </div>
                      <AlertTriangle className="h-6 w-6 flex-none text-brand-cyan" />
                    </div>

                    <div className="space-y-3">
                      {category.issues.map((issue) => (
                        <div
                          key={issue}
                          className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-secondary"
                        >
                          <Check className="mt-1 h-4 w-4 flex-none text-brand-cyan" />
                          <p className="leading-relaxed">{issue}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="card-elevated p-6 md:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
                    Recommended Next Steps
                  </p>
                  <h3 className="mt-3 text-3xl font-bold text-primary">
                    What to Review First
                  </h3>
                  <div className="mt-6 space-y-3">
                    {audit.recommendedNextSteps.map((step, index) => (
                      <div
                        key={step}
                        className="flex gap-4 rounded-2xl border border-dark-border bg-white/[0.035] p-4"
                      >
                        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-blue to-brand-cyan text-sm font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="leading-relaxed text-secondary">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

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
    </>
  );
}
