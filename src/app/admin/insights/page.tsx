import {
  listAuditInsightScans,
  type AuditScanRow,
} from "@/lib/audit-scan-log";
import {
  listAssistantConversations,
  type AssistantConversationRow,
} from "@/lib/assistant-conversation-log";
import { ScoreStabilityCell } from "@/components/admin/ScoreStabilityCell";
import {
  buildScoreStabilityByDomain,
  domainForScan,
  type ScoreStabilitySummary,
} from "@/lib/score-stability";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<
  Record<string, string | string[] | undefined> | undefined
>;

type AdminInsightsPageProps = {
  searchParams?: SearchParams;
};

type GroupMetric = {
  label: string;
  count: number;
  percentage: number;
};

type ConversionGroupMetric = GroupMetric & {
  converted: number;
  conversionRate: number;
};

type ScoreGroupMetric = GroupMetric & {
  averageScore: number;
};

type Insights = {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  leadSubmissions: number;
  leadConversionRate: number;
  contacted: number;
  notContacted: number;
  issueMetrics: GroupMetric[];
  archetypeMetrics: GroupMetric[];
  platformMetrics: GroupMetric[];
  benchmarkGroupMetrics: ScoreGroupMetric[];
  pageTypeMetrics: GroupMetric[];
  scoringConfidenceMetrics: GroupMetric[];
  revenueRiskMetrics: GroupMetric[];
  conversionByConcern: ConversionGroupMetric[];
  conversionByArchetype: ConversionGroupMetric[];
  conversionByBenchmarkGroup: ConversionGroupMetric[];
  conversionByRevenueRisk: ConversionGroupMetric[];
  assistantQuestionInsights: AssistantQuestionInsights;
  recentScans: RecentScanRow[];
};

type RecentScanRow = AuditScanRow & {
  scoreStability: ScoreStabilitySummary | undefined;
};

type AssistantQuestionInsights = {
  totalQuestions: number;
  costQuestions: number;
  rebuildQuestions: number;
  roiQuestions: number;
  bookingQuestions: number;
  leadSubmittedQuestions: number;
  recentQuestions: AssistantConversationRow[];
  topAssistantQuestions: GroupMetric[];
  topIntents: GroupMetric[];
  commonQuestions: GroupMetric[];
  questionsBySiteType: GroupMetric[];
  questionsByLeadStatus: GroupMetric[];
};

export default async function AdminInsightsPage({
  searchParams,
}: AdminInsightsPageProps) {
  const params = (await searchParams) ?? {};
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode = getParam(params, "passcode");

  if (!passcode) {
    return (
      <DashboardShell>
        <LockedState
          title="Insights are not configured"
          message="Set OPZIX_ADMIN_PASSCODE before this dashboard can show internal audit data."
        />
      </DashboardShell>
    );
  }

  if (providedPasscode !== passcode) {
    return (
      <DashboardShell>
        <LockedState
          title="Passcode required"
          message="Enter the internal passcode to view Opzix Audit intelligence."
        />
      </DashboardShell>
    );
  }

  const [scans, assistantConversations] = await Promise.all([
    listAuditInsightScans(),
    listAssistantConversations(),
  ]);
  const insights = buildInsights(scans.data, assistantConversations.data);

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Opzix Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl">
            Audit Insights
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
            Internal scan volume, issue mix, platform patterns, and scan-to-lead conversion.
          </p>
        </div>
        <a
          href={`/opzix-admin/scans?passcode=${encodeURIComponent(
            providedPasscode,
          )}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dark-border bg-white/[0.04] px-4 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
        >
          View Scan Table
        </a>
      </div>

      {!scans.ok ? (
        <WarningPanel message={scans.error} />
      ) : (
        <div className="space-y-8">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard label="Total scans" value={insights.totalScans} />
            <MetricCard label="Today" value={insights.scansToday} />
            <MetricCard label="This week" value={insights.scansThisWeek} />
            <MetricCard label="This month" value={insights.scansThisMonth} />
            <MetricCard label="Lead submissions" value={insights.leadSubmissions} />
            <MetricCard
              label="Lead conversion"
              value={formatPercent(insights.leadConversionRate)}
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <AnalyticsPanel title="Primary Concerns">
              <MetricRows rows={insights.issueMetrics} emptyLabel="No concerns yet." />
            </AnalyticsPanel>
            <AnalyticsPanel title="Archetypes">
              <MetricRows
                rows={insights.archetypeMetrics}
                emptyLabel="No archetypes yet."
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="Platforms">
              <MetricRows
                rows={insights.platformMetrics}
                emptyLabel="No platforms yet."
              />
            </AnalyticsPanel>
          </section>

          <section className="grid gap-6 xl:grid-cols-4">
            <AnalyticsPanel title="Benchmark Groups">
              <ScoreRows
                rows={insights.benchmarkGroupMetrics}
                emptyLabel="No benchmark groups yet."
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="Page Types">
              <MetricRows
                rows={insights.pageTypeMetrics}
                emptyLabel="No submitted page types yet."
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="Scoring Confidence">
              <MetricRows
                rows={insights.scoringConfidenceMetrics}
                emptyLabel="No scoring confidence data yet."
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="Revenue Risk Areas">
              <MetricRows
                rows={insights.revenueRiskMetrics}
                emptyLabel="No revenue risk areas yet."
              />
            </AnalyticsPanel>
          </section>

          <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
            <AnalyticsPanel title="Lead Conversion">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <ConversionSplitCard
                  label="Submitted"
                  count={insights.contacted}
                  total={insights.totalScans}
                />
                <ConversionSplitCard
                  label="Not submitted"
                  count={insights.notContacted}
                  total={insights.totalScans}
                />
              </div>
            </AnalyticsPanel>

            <div className="grid gap-6 lg:grid-cols-2">
              <AnalyticsPanel title="Conversion by Concern">
                <ConversionRows
                  rows={insights.conversionByConcern}
                  emptyLabel="No concern conversions yet."
                />
              </AnalyticsPanel>
              <AnalyticsPanel title="Conversion by Archetype">
                <ConversionRows
                  rows={insights.conversionByArchetype}
                  emptyLabel="No archetype conversions yet."
                />
              </AnalyticsPanel>
              <AnalyticsPanel title="Conversion by Benchmark">
                <ConversionRows
                  rows={insights.conversionByBenchmarkGroup}
                  emptyLabel="No benchmark conversions yet."
                />
              </AnalyticsPanel>
              <AnalyticsPanel title="Conversion by Revenue Risk">
                <ConversionRows
                  rows={insights.conversionByRevenueRisk}
                  emptyLabel="No revenue-risk conversions yet."
                />
              </AnalyticsPanel>
            </div>
          </section>

          <AnalyticsPanel title="Assistant Question Insights">
            {!assistantConversations.ok ? (
              <p className="mb-4 text-sm text-muted">
                Assistant conversation logging is not available yet:{" "}
                {assistantConversations.error}
              </p>
            ) : null}
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <MetricCard
                label="Assistant questions"
                value={insights.assistantQuestionInsights.totalQuestions}
              />
              <MetricCard
                label="Cost Questions"
                value={insights.assistantQuestionInsights.costQuestions}
              />
              <MetricCard
                label="Rebuild Questions"
                value={insights.assistantQuestionInsights.rebuildQuestions}
              />
              <MetricCard
                label="ROI Questions"
                value={insights.assistantQuestionInsights.roiQuestions}
              />
              <MetricCard
                label="Booking/Contact"
                value={insights.assistantQuestionInsights.bookingQuestions}
              />
              <MetricCard
                label="Lead Submitted"
                value={insights.assistantQuestionInsights.leadSubmittedQuestions}
              />
            </section>
            <div className="mt-6">
              <TopAssistantQuestionsCard
                rows={insights.assistantQuestionInsights.topAssistantQuestions}
              />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-4">
              <MetricRows
                rows={insights.assistantQuestionInsights.topIntents}
                emptyLabel="No assistant intents logged yet."
              />
              <MetricRows
                rows={insights.assistantQuestionInsights.commonQuestions}
                emptyLabel="No assistant questions logged yet."
              />
              <MetricRows
                rows={insights.assistantQuestionInsights.questionsBySiteType}
                emptyLabel="No site-type question data yet."
              />
              <MetricRows
                rows={insights.assistantQuestionInsights.questionsByLeadStatus}
                emptyLabel="No lead-submission question data yet."
              />
            </div>
            <p className="mt-4 text-xs text-muted">
              Launch fields: question asked, detected intent, site type, score,
              and lead submitted. CTA click tracking can be added as a later
              refinement.
            </p>
            <div className="mt-6">
              <RecentAssistantQuestionsTable
                conversations={insights.assistantQuestionInsights.recentQuestions}
              />
            </div>
          </AnalyticsPanel>

          <AnalyticsPanel title="Recent Scans">
            <RecentScansTable scans={insights.recentScans} />
          </AnalyticsPanel>
        </div>
      )}
    </DashboardShell>
  );
}

function buildInsights(
  scans: AuditScanRow[],
  assistantConversations: AssistantConversationRow[] = [],
): Insights {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  const day = startOfWeek.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const leadSubmissions = scans.filter((scan) => scan.contact_submitted).length;
  const scoreStabilityByDomain = buildScoreStabilityByDomain(scans);

  return {
    totalScans: scans.length,
    scansToday: countSince(scans, startOfToday),
    scansThisWeek: countSince(scans, startOfWeek),
    scansThisMonth: countSince(scans, startOfMonth),
    leadSubmissions,
    leadConversionRate: percentage(leadSubmissions, scans.length),
    contacted: leadSubmissions,
    notContacted: scans.length - leadSubmissions,
    issueMetrics: groupByValue(scans, (scan) => scan.primary_concern),
    archetypeMetrics: groupByValue(scans, (scan) => scan.archetype),
    platformMetrics: groupByValue(scans, (scan) => scan.platform),
    benchmarkGroupMetrics: scoreByValue(scans, (scan) => scan.benchmark_group),
    pageTypeMetrics: groupByValue(scans, (scan) => scan.submitted_page_type),
    scoringConfidenceMetrics: groupByValue(scans, (scan) => scan.scoring_confidence),
    revenueRiskMetrics: groupByMultiValue(scans, (scan) => scan.revenue_risk_areas),
    conversionByConcern: conversionByValue(
      scans,
      (scan) => scan.primary_concern,
    ),
    conversionByArchetype: conversionByValue(scans, (scan) => scan.archetype),
    conversionByBenchmarkGroup: conversionByValue(
      scans,
      (scan) => scan.benchmark_group,
    ),
    conversionByRevenueRisk: conversionByMultiValue(
      scans,
      (scan) => scan.revenue_risk_areas,
    ),
    assistantQuestionInsights: buildAssistantQuestionInsights(
      assistantConversations,
    ),
    recentScans: scans.slice(0, 12).map((scan) => ({
      ...scan,
      scoreStability: scoreStabilityByDomain.get(domainForScan(scan)),
    })),
  };
}

function buildAssistantQuestionInsights(
  conversations: AssistantConversationRow[],
): AssistantQuestionInsights {
  return {
    totalQuestions: conversations.length,
    costQuestions: countByIntent(conversations, ["cost_estimate"]),
    rebuildQuestions: countByIntent(conversations, ["rebuild_vs_fix"]),
    roiQuestions: countByIntent(conversations, ["roi_value"]),
    bookingQuestions: countByIntent(conversations, ["contact_or_booking"]),
    leadSubmittedQuestions: conversations.filter(
      (conversation) => conversation.lead_submitted,
    ).length,
    recentQuestions: conversations.slice(0, 12),
    topAssistantQuestions: topAssistantQuestionRows(conversations),
    topIntents: groupAssistantByValue(
      conversations,
      (conversation) => conversation.detected_intent,
    ),
    commonQuestions: groupAssistantByValue(
      conversations,
      (conversation) => normalizeQuestionLabel(conversation.question),
    ).slice(0, 8),
    questionsBySiteType: groupAssistantByValue(
      conversations,
      (conversation) => conversation.site_type,
    ),
    questionsByLeadStatus: groupAssistantByValue(conversations, (conversation) =>
      conversation.lead_submitted ? "Lead submitted" : "No lead submitted",
    ),
  };
}

function TopAssistantQuestionsCard({ rows }: { rows: GroupMetric[] }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <h3 className="text-sm font-bold text-primary">Top Assistant Questions</h3>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No assistant questions logged yet.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[minmax(0,auto)_1fr_auto] items-baseline gap-2 text-sm"
            >
              <span className="font-semibold text-secondary">{row.label}</span>
              <span className="border-b border-dotted border-dark-border" />
              <span className="font-bold text-primary">{row.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function topAssistantQuestionRows(
  conversations: AssistantConversationRow[],
): GroupMetric[] {
  const launchIntents = [
    "cost_estimate",
    "rebuild_vs_fix",
    "roi_value",
    "score_explanation",
  ];
  const allRows = groupAssistantByValue(
    conversations,
    (conversation) => conversation.detected_intent,
  );

  return allRows
    .filter((row) => launchIntents.includes(row.label))
    .map((row) => ({
      ...row,
      label: assistantIntentLabel(row.label),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function RecentAssistantQuestionsTable({
  conversations,
}: {
  conversations: AssistantConversationRow[];
}) {
  if (conversations.length === 0) {
    return <p className="text-sm text-muted">No assistant questions logged yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Question</th>
            <th className="px-3 py-3">Intent</th>
            <th className="px-3 py-3">Site Type</th>
            <th className="px-3 py-3">Score</th>
            <th className="px-3 py-3">Lead Submitted</th>
          </tr>
        </thead>
        <tbody>
          {conversations.map((conversation) => (
            <tr
              key={conversation.id}
              className="border-b border-dark-border last:border-b-0"
            >
              <td className="px-3 py-4 text-secondary">
                {formatDate(conversation.created_at)}
              </td>
              <td className="max-w-sm px-3 py-4 text-primary">
                {conversation.question}
              </td>
              <td className="px-3 py-4 text-secondary">
                {cleanLabel(conversation.detected_intent)}
              </td>
              <td className="px-3 py-4 text-secondary">
                {cleanLabel(conversation.site_type)}
              </td>
              <td className="px-3 py-4 text-primary">
                {conversation.score ?? "unknown"}
              </td>
              <td className="px-3 py-4">
                <ContactBadge contacted={conversation.lead_submitted} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function countByIntent(
  conversations: AssistantConversationRow[],
  intents: string[],
) {
  return conversations.filter((conversation) =>
    intents.includes(conversation.detected_intent),
  ).length;
}

function groupAssistantByValue(
  conversations: AssistantConversationRow[],
  getValue: (conversation: AssistantConversationRow) => string | null | undefined,
) {
  const counts = new Map<string, number>();

  conversations.forEach((conversation) => {
    const label = cleanLabel(getValue(conversation));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, conversations.length),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function normalizeQuestionLabel(question: string) {
  return question.trim().replace(/\s+/g, " ").slice(0, 120);
}

function assistantIntentLabel(intent: string) {
  const labels: Record<string, string> = {
    cost_estimate: "Cost Estimate",
    rebuild_vs_fix: "Rebuild vs Fix",
    roi_value: "ROI Questions",
    score_explanation: "Score Explanation",
    fix_priority: "Fix Priority",
    implementation_plan: "Implementation Plan",
    platform_question: "Platform Questions",
    benchmark_question: "Benchmark Questions",
    competitive_question: "Competitive Questions",
    revenue_impact: "Revenue Impact",
    contact_or_booking: "Booking/Contact",
    explain_finding: "Explain Finding",
    compare_findings: "Compare Findings",
    general_unknown: "Unknown",
  };

  return labels[intent] ?? cleanLabel(intent);
}

function countSince(scans: AuditScanRow[], startDate: Date) {
  return scans.filter((scan) => new Date(scan.created_at) >= startDate).length;
}

function groupByValue(
  scans: AuditScanRow[],
  getValue: (scan: AuditScanRow) => string | null | undefined,
) {
  const counts = new Map<string, number>();

  scans.forEach((scan) => {
    const label = cleanLabel(getValue(scan));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, scans.length),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function conversionByValue(
  scans: AuditScanRow[],
  getValue: (scan: AuditScanRow) => string | null | undefined,
) {
  const groups = new Map<string, { total: number; converted: number }>();

  scans.forEach((scan) => {
    const label = cleanLabel(getValue(scan));
    const current = groups.get(label) ?? { total: 0, converted: 0 };
    current.total += 1;
    current.converted += scan.contact_submitted ? 1 : 0;
    groups.set(label, current);
  });

  return Array.from(groups.entries())
    .map(([label, group]) => ({
      label,
      count: group.total,
      converted: group.converted,
      percentage: percentage(group.total, scans.length),
      conversionRate: percentage(group.converted, group.total),
    }))
    .sort(
      (left, right) =>
        right.conversionRate - left.conversionRate ||
        right.converted - left.converted ||
        right.count - left.count,
    );
}

function scoreByValue(
  scans: AuditScanRow[],
  getValue: (scan: AuditScanRow) => string | null | undefined,
) {
  const groups = new Map<string, { count: number; scoreTotal: number }>();

  scans.forEach((scan) => {
    const label = cleanLabel(getValue(scan));
    const current = groups.get(label) ?? { count: 0, scoreTotal: 0 };
    current.count += 1;
    current.scoreTotal += scan.score;
    groups.set(label, current);
  });

  return Array.from(groups.entries())
    .map(([label, group]) => ({
      label,
      count: group.count,
      percentage: percentage(group.count, scans.length),
      averageScore: group.count === 0 ? 0 : group.scoreTotal / group.count,
    }))
    .sort(
      (left, right) =>
        right.count - left.count || right.averageScore - left.averageScore,
    );
}

function groupByMultiValue(
  scans: AuditScanRow[],
  getValues: (scan: AuditScanRow) => unknown[] | undefined,
) {
  const expanded = scans.flatMap((scan) =>
    normalizeUnknownList(getValues(scan)).map((label) => ({ scan, label })),
  );
  const counts = new Map<string, number>();

  expanded.forEach(({ label }) => {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => ({
      label,
      count,
      percentage: percentage(count, scans.length),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function conversionByMultiValue(
  scans: AuditScanRow[],
  getValues: (scan: AuditScanRow) => unknown[] | undefined,
) {
  const groups = new Map<string, { total: number; converted: number }>();

  scans.forEach((scan) => {
    normalizeUnknownList(getValues(scan)).forEach((label) => {
      const current = groups.get(label) ?? { total: 0, converted: 0 };
      current.total += 1;
      current.converted += scan.contact_submitted ? 1 : 0;
      groups.set(label, current);
    });
  });

  return Array.from(groups.entries())
    .map(([label, group]) => ({
      label,
      count: group.total,
      converted: group.converted,
      percentage: percentage(group.total, scans.length),
      conversionRate: percentage(group.converted, group.total),
    }))
    .sort(
      (left, right) =>
        right.conversionRate - left.conversionRate ||
        right.converted - left.converted ||
        right.count - left.count,
    );
}

function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-bg py-8 md:py-10">
      <div className="container-wide">{children}</div>
    </main>
  );
}

function LockedState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Admin
      </p>
      <h1 className="mt-3 text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-3 leading-relaxed text-secondary">{message}</p>
      <form className="mt-6 space-y-3">
        <label className="block text-sm font-semibold text-secondary">
          Passcode
          <input
            type="password"
            name="passcode"
            className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <button type="submit" className="btn btn-primary w-full">
          View Insights
        </button>
      </form>
    </div>
  );
}

function WarningPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-amber-100">
      {message}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-primary">{value}</p>
    </div>
  );
}

function AnalyticsPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-5 md:p-6">
      <h2 className="text-xl font-bold text-primary">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricRows({
  rows,
  emptyLabel,
}: {
  rows: GroupMetric[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 break-words text-sm font-semibold text-secondary">
              {row.label}
            </p>
            <p className="flex-none text-sm font-bold text-primary">
              {row.count} · {formatPercent(row.percentage)}
            </p>
          </div>
          <ProgressBar value={row.percentage} />
        </div>
      ))}
    </div>
  );
}

function ScoreRows({
  rows,
  emptyLabel,
}: {
  rows: ScoreGroupMetric[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 break-words text-sm font-semibold text-secondary">
              {row.label}
            </p>
            <p className="flex-none text-sm font-bold text-primary">
              {row.count} · avg {row.averageScore.toFixed(0)}
            </p>
          </div>
          <ProgressBar value={row.averageScore} />
        </div>
      ))}
    </div>
  );
}

function ConversionRows({
  rows,
  emptyLabel,
}: {
  rows: ConversionGroupMetric[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-secondary">
                {row.label}
              </p>
              <p className="mt-1 text-xs text-muted">
                {row.converted} of {row.count} converted
              </p>
            </div>
            <p className="flex-none text-sm font-bold text-primary">
              {formatPercent(row.conversionRate)}
            </p>
          </div>
          <ProgressBar value={row.conversionRate} />
        </div>
      ))}
    </div>
  );
}

function ConversionSplitCard({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <p className="text-sm font-semibold text-secondary">{label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-black text-primary">{count}</p>
        <p className="text-sm font-bold text-brand-cyan">
          {formatPercent(percentage(count, total))}
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-deep">
      <div
        className="h-full rounded-full bg-brand-cyan"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function RecentScansTable({ scans }: { scans: RecentScanRow[] }) {
  if (scans.length === 0) {
    return <p className="text-sm text-muted">No scans yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Domain</th>
            <th className="px-3 py-3">Score</th>
            <th className="px-3 py-3">Score Stability</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3">Primary concern</th>
            <th className="px-3 py-3">Platform</th>
            <th className="px-3 py-3">Contacted</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((scan) => (
            <tr key={scan.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-secondary">
                {formatDate(scan.created_at)}
              </td>
              <td className="px-3 py-4 font-semibold text-primary">
                {scan.normalized_domain || cleanLabel(scan.url)}
              </td>
              <td className="px-3 py-4 text-primary">{scan.score}</td>
              <td className="px-3 py-4">
                <ScoreStabilityCell summary={scan.scoreStability} />
              </td>
              <td className="px-3 py-4 text-secondary">{scan.status}</td>
              <td className="max-w-xs px-3 py-4 text-secondary">
                {cleanLabel(scan.primary_concern)}
              </td>
              <td className="px-3 py-4 text-secondary">
                {cleanLabel(scan.platform)}
              </td>
              <td className="px-3 py-4">
                <ContactBadge contacted={scan.contact_submitted} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ContactBadge({ contacted }: { contacted: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
        contacted
          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
          : "border-amber-300/30 bg-amber-400/10 text-amber-100"
      }`}
    >
      {contacted ? "Yes" : "No"}
    </span>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function cleanLabel(value: string | null | undefined) {
  return value?.trim() || "unknown";
}

function normalizeUnknownList(value: unknown[] | undefined) {
  return (Array.isArray(value) ? value : [])
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function percentage(count: number, total: number) {
  return total === 0 ? 0 : (count / total) * 100;
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 || value === 0 ? 0 : 1)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
