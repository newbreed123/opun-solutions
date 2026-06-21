import {
  listZoraConversations,
  type ZoraConversationRow,
} from "@/lib/zora-conversation-log";
import {
  buildWeeklyZoraLearningReport,
  listZoraFailures,
  listZoraLearningRows,
  zoraPlaybooks,
  type ZoraFailureRow,
  type ZoraLearningRow,
} from "@/lib/zora-learning";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type SearchParams = Promise<
  Record<string, string | string[] | undefined> | undefined
>;

type ZoraInsightsPageProps = {
  searchParams?: SearchParams;
};

type GroupMetric = {
  label: string;
  count: number;
  percentage: number;
};

type PlaybookPerformance = {
  id: string;
  intent: string;
  primaryCta: string;
  usageCount: number;
  auditClicks: number;
  strategyClicks: number;
  successRate: number;
};

type ZoraInsights = {
  totalConversations: number;
  qualified: number;
  averageLeadScore: number;
  auditClicks: number;
  auditClickRate: number;
  strategyCallClicks: number;
  strategyCallRate: number;
  askQuestionClicks: number;
  askQuestionRate: number;
  faqOpened: number;
  faqOpenedRate: number;
  leadTemperatures: GroupMetric[];
  topIntents: GroupMetric[];
  topQuestions: GroupMetric[];
  topBusinessTypes: GroupMetric[];
  topIndustries: GroupMetric[];
  topBusinessModels: GroupMetric[];
  topChallenges: GroupMetric[];
  failureReasons: GroupMetric[];
  unresolvedQuestions: ZoraFailureRow[];
  bestPlaybooks: PlaybookPerformance[];
  recentFailures: ZoraFailureRow[];
  recentLearningRows: ZoraLearningRow[];
  weeklyReport: string;
};

export default async function ZoraInsightsPage({
  searchParams,
}: ZoraInsightsPageProps) {
  const params = (await searchParams) ?? {};
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode = getParam(params, "passcode");

  if (!passcode) {
    return (
      <AdminShell>
        <LockedState
          title="Zora insights are not configured"
          message="Set OPZIX_ADMIN_PASSCODE before this page can show internal Zora learning data."
        />
      </AdminShell>
    );
  }

  if (providedPasscode !== passcode) {
    return (
      <AdminShell>
        <LockedState
          title="Passcode required"
          message="Enter the internal passcode to view Zora learning intelligence."
        />
      </AdminShell>
    );
  }

  const [conversations, failures, learningRows] = await Promise.all([
    listZoraConversations(1500),
    listZoraFailures(750),
    listZoraLearningRows(1500),
  ]);
  const insights = buildZoraInsights(
    conversations.data,
    failures.data,
    learningRows.data,
  );

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Opzix Learning
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl">
            Zora Insights
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
            Conversation patterns, CTA performance, failure review, and playbook
            intelligence for improving Zora without fine-tuning.
          </p>
        </div>
        <a
          href={`/admin/insights?passcode=${encodeURIComponent(providedPasscode)}`}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dark-border bg-white/[0.04] px-4 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
        >
          Main Insights
        </a>
      </div>

      {!conversations.ok ? <WarningPanel message={conversations.error} /> : null}
      {!failures.ok ? <WarningPanel message={failures.error} /> : null}
      {!learningRows.ok ? <WarningPanel message={learningRows.error} /> : null}

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label="Conversations" value={insights.totalConversations} />
          <MetricCard label="Qualified" value={insights.qualified} />
          <MetricCard label="Avg lead score" value={insights.averageLeadScore} />
          <MetricCard
            label="Audit click rate"
            value={formatPercent(insights.auditClickRate)}
          />
          <MetricCard
            label="Strategy rate"
            value={formatPercent(insights.strategyCallRate)}
          />
          <MetricCard
            label="Failures"
            value={insights.recentFailures.length}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-4">
          <AnalyticsPanel title="CTA Performance">
            <MetricRows
              rows={[
                metric("Audit clicked", insights.auditClicks, insights.totalConversations),
                metric(
                  "Strategy call clicked",
                  insights.strategyCallClicks,
                  insights.totalConversations,
                ),
                metric(
                  "Ask question clicked",
                  insights.askQuestionClicks,
                  insights.totalConversations,
                ),
                metric("FAQ opened", insights.faqOpened, insights.totalConversations),
              ]}
              emptyLabel="No CTA events yet."
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Lead Quality">
            <MetricRows
              rows={insights.leadTemperatures}
              emptyLabel="No lead temperature data yet."
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Top Intents">
            <MetricRows rows={insights.topIntents} emptyLabel="No intent data yet." />
          </AnalyticsPanel>
          <AnalyticsPanel title="Top Challenges">
            <MetricRows
              rows={insights.topChallenges}
              emptyLabel="No challenge data yet."
            />
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
          <AnalyticsPanel title="Top Questions">
            <MetricRows
              rows={insights.topQuestions}
              emptyLabel="No user messages yet."
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Top Industries">
            <MetricRows
              rows={insights.topIndustries}
              emptyLabel="No industry data yet."
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Top Business Models">
            <MetricRows
              rows={insights.topBusinessModels}
              emptyLabel="No business model data yet."
            />
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <AnalyticsPanel title="Failure Reasons">
            <MetricRows
              rows={insights.failureReasons}
              emptyLabel="No failures logged yet."
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Recent Failure Review">
            <RecentFailuresTable failures={insights.recentFailures} />
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <AnalyticsPanel title="Best Performing Responses">
            <PlaybookTable rows={insights.bestPlaybooks} />
          </AnalyticsPanel>
          <AnalyticsPanel title="Unresolved Questions">
            <RecentFailuresTable failures={insights.unresolvedQuestions} compact />
          </AnalyticsPanel>
        </section>

        <AnalyticsPanel title="Learning Dataset Samples">
          <LearningRowsTable rows={insights.recentLearningRows} />
        </AnalyticsPanel>

        <AnalyticsPanel title="Weekly Learning Summary">
          <pre className="whitespace-pre-wrap rounded-xl border border-dark-border bg-dark-deep p-4 text-sm leading-relaxed text-secondary">
            {insights.weeklyReport}
          </pre>
          <p className="mt-3 text-xs text-muted">
            TODO: connect this helper to a weekly cron or scheduled email when the
            site has a cron pattern.
          </p>
        </AnalyticsPanel>
      </div>
    </AdminShell>
  );
}

function buildZoraInsights(
  conversations: ZoraConversationRow[],
  failures: ZoraFailureRow[],
  learningRows: ZoraLearningRow[],
): ZoraInsights {
  const qualified = conversations.filter(
    (conversation) =>
      conversation.conversation_outcome === "qualified" ||
      Boolean(conversation.business_type && (conversation.challenge || conversation.website_url)),
  );
  const scores = conversations
    .map((conversation) => conversation.lead_score)
    .filter((score): score is number => typeof score === "number");
  const auditClicks = conversations.filter((conversation) => conversation.audit_clicked).length;
  const strategyCallClicks = conversations.filter(
    (conversation) => conversation.strategy_call_clicked,
  ).length;
  const askQuestionClicks = conversations.filter(
    (conversation) => conversation.ask_question_clicked,
  ).length;
  const faqOpened = conversations.filter((conversation) => conversation.faq_opened).length;

  return {
    totalConversations: conversations.length,
    qualified: qualified.length,
    averageLeadScore: scores.length
      ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
      : 0,
    auditClicks,
    auditClickRate: percentage(auditClicks, conversations.length),
    strategyCallClicks,
    strategyCallRate: percentage(strategyCallClicks, conversations.length),
    askQuestionClicks,
    askQuestionRate: percentage(askQuestionClicks, conversations.length),
    faqOpened,
    faqOpenedRate: percentage(faqOpened, conversations.length),
    leadTemperatures: groupByValue(conversations, (row) => row.lead_temperature),
    topIntents: groupByValue(conversations, (row) => row.intent || row.current_step),
    topQuestions: groupByValue(conversations, (row) =>
      normalizeQuestion(row.latest_user_message),
    ).slice(0, 10),
    topBusinessTypes: groupByValue(conversations, (row) => row.business_type),
    topIndustries: groupByValue(
      conversations,
      (row) => row.inferred_industry || row.industry,
    ),
    topBusinessModels: groupByValue(conversations, (row) => row.inferred_business_model),
    topChallenges: groupByValue(conversations, (row) => row.challenge),
    failureReasons: groupByValue(failures, (row) => row.failure_reason),
    unresolvedQuestions: failures
      .filter((failure) => failure.failure_reason === "no_next_step" || !failure.reviewed)
      .slice(0, 8),
    bestPlaybooks: buildPlaybookPerformance(learningRows),
    recentFailures: failures.slice(0, 12),
    recentLearningRows: learningRows.slice(0, 12),
    weeklyReport: buildWeeklyZoraLearningReport({
      conversations,
      failures,
      learningRows,
    }),
  };
}

function buildPlaybookPerformance(rows: ZoraLearningRow[]): PlaybookPerformance[] {
  return zoraPlaybooks
    .map((playbook) => {
      const matchingRows = rows.filter((row) => row.intent === playbook.intent);
      const auditClicks = matchingRows.filter((row) => row.audit_clicked).length;
      const strategyClicks = matchingRows.filter(
        (row) => row.strategy_call_clicked,
      ).length;
      const successCount = auditClicks + strategyClicks;

      return {
        id: playbook.id,
        intent: playbook.intent,
        primaryCta: playbook.primaryCta,
        usageCount: matchingRows.length,
        auditClicks,
        strategyClicks,
        successRate: percentage(successCount, matchingRows.length),
      };
    })
    .sort(
      (left, right) =>
        right.successRate - left.successRate ||
        right.usageCount - left.usageCount ||
        left.intent.localeCompare(right.intent),
    );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-bg py-8 md:py-10">
      <div className="container-wide">{children}</div>
    </main>
  );
}

function LockedState({ title, message }: { title: string; message: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Opzix Admin
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
          View Zora Insights
        </button>
      </form>
    </div>
  );
}

function WarningPanel({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-amber-100">
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

function AnalyticsPanel({ title, children }: { title: string; children: ReactNode }) {
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
  if (rows.length === 0) return <p className="text-sm text-muted">{emptyLabel}</p>;

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 break-words text-sm font-semibold text-secondary">
              {row.label}
            </p>
            <p className="flex-none text-sm font-bold text-primary">
              {row.count} - {formatPercent(row.percentage)}
            </p>
          </div>
          <ProgressBar value={row.percentage} />
        </div>
      ))}
    </div>
  );
}

function RecentFailuresTable({
  failures,
  compact = false,
}: {
  failures: ZoraFailureRow[];
  compact?: boolean;
}) {
  if (failures.length === 0) {
    return <p className="text-sm text-muted">No failures logged yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Reason</th>
            <th className="px-3 py-3">Intent</th>
            <th className="px-3 py-3">User message</th>
            {!compact ? <th className="px-3 py-3">Reviewed</th> : null}
          </tr>
        </thead>
        <tbody>
          {failures.map((failure) => (
            <tr key={failure.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-secondary">{formatDate(failure.created_at)}</td>
              <td className="px-3 py-4 text-primary">{cleanLabel(failure.failure_reason)}</td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(failure.detected_intent)}</td>
              <td className="max-w-sm px-3 py-4 text-secondary">
                {failure.user_message || "unknown"}
              </td>
              {!compact ? (
                <td className="px-3 py-4">
                  <StatusBadge active={failure.reviewed} trueLabel="Reviewed" falseLabel="Open" />
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlaybookTable({ rows }: { rows: PlaybookPerformance[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No playbook data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Intent</th>
            <th className="px-3 py-3">Primary CTA</th>
            <th className="px-3 py-3">Usage</th>
            <th className="px-3 py-3">Audit</th>
            <th className="px-3 py-3">Strategy</th>
            <th className="px-3 py-3">Success</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-primary">{cleanLabel(row.intent)}</td>
              <td className="px-3 py-4 text-secondary">{row.primaryCta}</td>
              <td className="px-3 py-4 text-secondary">{row.usageCount}</td>
              <td className="px-3 py-4 text-secondary">{row.auditClicks}</td>
              <td className="px-3 py-4 text-secondary">{row.strategyClicks}</td>
              <td className="px-3 py-4 text-primary">{formatPercent(row.successRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LearningRowsTable({ rows }: { rows: ZoraLearningRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No learning rows logged yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Intent</th>
            <th className="px-3 py-3">Business</th>
            <th className="px-3 py-3">Challenge</th>
            <th className="px-3 py-3">Message</th>
            <th className="px-3 py-3">CTA</th>
            <th className="px-3 py-3">Outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-secondary">{formatDate(row.created_at)}</td>
              <td className="px-3 py-4 text-primary">{cleanLabel(row.intent)}</td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(row.business_type)}</td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(row.challenge)}</td>
              <td className="max-w-md px-3 py-4 text-secondary">
                {row.user_message || "unknown"}
              </td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(row.cta_clicked)}</td>
              <td className="px-3 py-4 text-secondary">
                {cleanLabel(row.conversion_outcome)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-brand-cyan"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function StatusBadge({
  active,
  trueLabel,
  falseLabel,
}: {
  active: boolean;
  trueLabel: string;
  falseLabel: string;
}) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
        active
          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
          : "border-amber-300/30 bg-amber-400/10 text-amber-100"
      }`}
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
}

function groupByValue<T>(
  rows: T[],
  getValue: (row: T) => string | null | undefined,
): GroupMetric[] {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    const label = cleanLabel(getValue(row));
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => metric(label, count, rows.length))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
}

function metric(label: string, count: number, total: number): GroupMetric {
  return {
    label,
    count,
    percentage: percentage(count, total),
  };
}

function percentage(count: number, total: number) {
  return total === 0 ? 0 : (count / total) * 100;
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

function cleanLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeQuestion(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 120) || "Unknown";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
