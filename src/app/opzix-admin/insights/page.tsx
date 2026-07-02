import {
  listAuditInsightScans,
  type AuditScanRow,
} from "@/lib/audit-scan-log";
import {
  listAssistantConversations,
  type AssistantConversationRow,
} from "@/lib/assistant-conversation-log";
import {
  listConversionEvents,
  type ConversionEventRow,
} from "@/lib/conversion-event-log";
import {
  listZoraConversations,
  type ZoraConversationRow,
} from "@/lib/zora-conversation-log";
import {
  listZoraFailures,
  listZoraLearningRows,
  type ZoraFailureRow,
  type ZoraLearningRow,
} from "@/lib/zora-learning";
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

type FunnelStep = {
  key: string;
  label: string;
  count: number;
};

type FunnelRate = {
  label: string;
  from: number;
  to: number;
  rate: number;
};

type GrowthInsights = {
  totalEvents: number;
  uniqueSessions: number;
  zoraStarted: number;
  zoraQualified: number;
  auditStarted: number;
  auditCompleted: number;
  strategyCallClicked: number;
  strategyCallBooked: number;
  contactFormSubmitted: number;
  funnelSteps: FunnelStep[];
  funnelRates: FunnelRate[];
  topBusinessTypes: GroupMetric[];
  topChallenges: GroupMetric[];
  topIndustries: GroupMetric[];
  leadTemperatures: GroupMetric[];
  averageLeadScore: number;
  topQuestions: GroupMetric[];
  failedIntents: GroupMetric[];
  repeatedFailures: GroupMetric[];
  pricingQuestions: number;
  liveAgentRequests: number;
  auditRequests: number;
  sourceMetrics: GroupMetric[];
  pagePathMetrics: GroupMetric[];
  utmCampaignMetrics: GroupMetric[];
  utmSourceMetrics: GroupMetric[];
  utmMediumMetrics: GroupMetric[];
  gclidCount: number;
  recentEvents: ConversionEventRow[];
};

export default async function GrowthIntelligenceDashboard({
  searchParams,
}: AdminInsightsPageProps) {
  const params = (await searchParams) ?? {};
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode = getParam(params, "passcode");

  if (!passcode) {
    return (
      <DashboardShell>
        <LockedState
          title="Growth intelligence is not configured"
          message="Set OPZIX_ADMIN_PASSCODE before this dashboard can show internal growth data."
        />
      </DashboardShell>
    );
  }

  if (providedPasscode !== passcode) {
    return (
      <DashboardShell>
        <LockedState
          title="Passcode required"
          message="Enter the internal passcode to view Opzix Growth Intelligence."
        />
      </DashboardShell>
    );
  }

  const [
    conversionEvents,
    scans,
    zoraConversations,
    zoraFailures,
    zoraLearningRows,
    assistantConversations,
  ] = await Promise.all([
    listConversionEvents(1500),
    listAuditInsightScans(),
    listZoraConversations(1500),
    listZoraFailures(750),
    listZoraLearningRows(1500),
    listAssistantConversations(1000),
  ]);

  const insights = buildGrowthInsights({
    events: conversionEvents.data,
    scans: scans.data,
    zoraConversations: zoraConversations.data,
    zoraFailures: zoraFailures.data,
    zoraLearningRows: zoraLearningRows.data,
    assistantConversations: assistantConversations.data,
  });

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Opzix Intelligence
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl">
            Growth Intelligence Dashboard
          </h1>
          <p className="mt-3 max-w-4xl leading-relaxed text-secondary">
            Full-funnel visibility from traffic and landing-page activity through Zora,
            audit scans, strategy call intent, booked calls, and contact form submissions.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/opzix-admin/scans?passcode=${encodeURIComponent(providedPasscode)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dark-border bg-white/[0.04] px-4 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
          >
            Scan Table
          </a>
          <a
            href={`/opzix-admin/zora-insights?passcode=${encodeURIComponent(providedPasscode)}`}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dark-border bg-white/[0.04] px-4 text-sm font-semibold text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
          >
            Zora Details
          </a>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        {!conversionEvents.ok ? <WarningPanel message={conversionEvents.error} /> : null}
        {"warning" in conversionEvents && conversionEvents.warning ? (
          <WarningPanel message={conversionEvents.warning} />
        ) : null}
        {!scans.ok ? <WarningPanel message={scans.error} /> : null}
        {!zoraConversations.ok ? <WarningPanel message={zoraConversations.error} /> : null}
        {!zoraFailures.ok ? <WarningPanel message={zoraFailures.error} /> : null}
        {!zoraLearningRows.ok ? <WarningPanel message={zoraLearningRows.error} /> : null}
        {!assistantConversations.ok ? (
          <WarningPanel message={assistantConversations.error} />
        ) : null}
      </div>

      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Events" value={insights.totalEvents} />
          <MetricCard label="Sessions" value={insights.uniqueSessions} />
          <MetricCard label="Zora started" value={insights.zoraStarted} />
          <MetricCard label="Audit started" value={insights.auditStarted} />
          <MetricCard label="Booked calls" value={insights.strategyCallBooked} />
        </section>

        <AnalyticsPanel title="Growth Funnel">
          <FunnelSummary steps={insights.funnelSteps} />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {insights.funnelRates.map((rate) => (
              <RateCard key={rate.label} rate={rate} />
            ))}
          </div>
        </AnalyticsPanel>

        <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <AnalyticsPanel title="Funnel Counts">
            <MetricRows
              rows={[
                metric("Zora conversations started", insights.zoraStarted, insights.zoraStarted),
                metric("Zora qualified leads", insights.zoraQualified, insights.zoraStarted),
                metric("Audit started", insights.auditStarted, insights.zoraStarted),
                metric("Audit completed", insights.auditCompleted, insights.auditStarted),
                metric("Strategy call clicked", insights.strategyCallClicked, insights.auditCompleted),
                metric("Strategy call booked", insights.strategyCallBooked, insights.strategyCallClicked),
                metric("Contact form submitted", insights.contactFormSubmitted, insights.auditCompleted),
              ]}
              emptyLabel="No funnel data yet."
            />
          </AnalyticsPanel>
          <AnalyticsPanel title="Lead Intelligence">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Hot/warm/cold" value={insights.leadTemperatures.length} />
              <MetricCard label="Avg lead score" value={insights.averageLeadScore} />
              <MetricCard label="Live agent requests" value={insights.liveAgentRequests} />
              <MetricCard label="Audit requests" value={insights.auditRequests} />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-4">
              <MetricRows rows={insights.topBusinessTypes} emptyLabel="No business types yet." />
              <MetricRows rows={insights.topChallenges} emptyLabel="No challenges yet." />
              <MetricRows rows={insights.topIndustries} emptyLabel="No industries yet." />
              <MetricRows rows={insights.leadTemperatures} emptyLabel="No lead temperatures yet." />
            </div>
          </AnalyticsPanel>
        </section>

        <AnalyticsPanel title="Zora Intelligence">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Pricing questions" value={insights.pricingQuestions} />
            <MetricCard label="Live agent requests" value={insights.liveAgentRequests} />
            <MetricCard label="Audit requests" value={insights.auditRequests} />
            <MetricCard label="Failed intents" value={insights.failedIntents.length} />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <AnalyticsSubpanel title="Most Common Questions">
              <MetricRows rows={insights.topQuestions} emptyLabel="No questions yet." />
            </AnalyticsSubpanel>
            <AnalyticsSubpanel title="Most Common Failed Intents">
              <MetricRows rows={insights.failedIntents} emptyLabel="No failed intents yet." />
            </AnalyticsSubpanel>
            <AnalyticsSubpanel title="Repeated Response Failures">
              <MetricRows rows={insights.repeatedFailures} emptyLabel="No repeated failures yet." />
            </AnalyticsSubpanel>
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Source Attribution">
          <div className="grid gap-6 xl:grid-cols-5">
            <MetricRows rows={insights.sourceMetrics} emptyLabel="No source data yet." />
            <MetricRows rows={insights.pagePathMetrics} emptyLabel="No page path data yet." />
            <MetricRows rows={insights.utmCampaignMetrics} emptyLabel="No UTM campaigns yet." />
            <MetricRows rows={insights.utmSourceMetrics} emptyLabel="No UTM sources yet." />
            <div>
              <MetricRows rows={insights.utmMediumMetrics} emptyLabel="No UTM media yet." />
              <div className="mt-4 rounded-xl border border-dark-border bg-dark-deep/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                  GCLID captured
                </p>
                <p className="mt-2 text-2xl font-black text-primary">
                  {insights.gclidCount}
                </p>
              </div>
            </div>
          </div>
        </AnalyticsPanel>

        <AnalyticsPanel title="Recent Conversion Activity">
          <RecentEventsTable events={insights.recentEvents} />
        </AnalyticsPanel>
      </div>
    </DashboardShell>
  );
}

function buildGrowthInsights({
  events,
  scans,
  zoraConversations,
  zoraFailures,
  zoraLearningRows,
  assistantConversations,
}: {
  events: ConversionEventRow[];
  scans: AuditScanRow[];
  zoraConversations: ZoraConversationRow[];
  zoraFailures: ZoraFailureRow[];
  zoraLearningRows: ZoraLearningRow[];
  assistantConversations: AssistantConversationRow[];
}): GrowthInsights {
  const eventCounts = countEvents(events);
  const zoraQualifiedRows = zoraConversations.filter((conversation) =>
    isQualifiedZoraConversation(conversation),
  );
  const auditStarted = Math.max(eventCounts.audit_started ?? 0, scans.length);
  const auditCompleted = Math.max(eventCounts.audit_completed ?? 0, scans.length);
  const strategyCallClicked = Math.max(
    eventCounts.strategy_call_clicked ?? 0,
    zoraConversations.filter((conversation) => conversation.strategy_call_clicked).length,
  );
  const contactFormSubmitted = Math.max(
    eventCounts.contact_form_submitted ?? 0,
    scans.filter((scan) => scan.contact_submitted).length,
  );
  const zoraStarted = Math.max(
    eventCounts.zora_conversation_started ?? 0,
    zoraConversations.length,
  );
  const zoraQualified = Math.max(
    eventCounts.zora_qualified_lead ?? 0,
    zoraQualifiedRows.length,
  );
  const strategyCallBooked = eventCounts.strategy_call_booked ?? 0;
  const leadScores = [
    ...zoraConversations
      .map((conversation) => conversation.lead_score)
      .filter((score): score is number => typeof score === "number"),
    ...events
      .map((event) => event.lead_score)
      .filter((score): score is number => typeof score === "number"),
  ];
  const funnelSteps = [
    { key: "zora_started", label: "Zora Started", count: zoraStarted },
    { key: "zora_qualified", label: "Zora Qualified", count: zoraQualified },
    { key: "audit_started", label: "Audit Started", count: auditStarted },
    { key: "audit_completed", label: "Audit Completed", count: auditCompleted },
    { key: "strategy_clicked", label: "Strategy Call Clicked", count: strategyCallClicked },
    { key: "strategy_booked", label: "Strategy Call Booked", count: strategyCallBooked },
    { key: "contact_submitted", label: "Contact Form Submitted", count: contactFormSubmitted },
  ];

  return {
    totalEvents: events.length || fallbackTotalEvents(funnelSteps),
    uniqueSessions: countUnique(events, (event) => event.session_id),
    zoraStarted,
    zoraQualified,
    auditStarted,
    auditCompleted,
    strategyCallClicked,
    strategyCallBooked,
    contactFormSubmitted,
    funnelSteps,
    funnelRates: [
      rate("Zora Started -> Audit Started", zoraStarted, auditStarted),
      rate("Audit Started -> Audit Completed", auditStarted, auditCompleted),
      rate("Audit Completed -> Strategy Call Clicked", auditCompleted, strategyCallClicked),
      rate("Strategy Call Clicked -> Strategy Call Booked", strategyCallClicked, strategyCallBooked),
    ],
    topBusinessTypes: groupMany(
      [
        ...zoraConversations.map((row) => row.business_type),
        ...events.map((row) => row.business_type),
      ],
      zoraConversations.length + events.length,
    ),
    topChallenges: groupMany(
      [
        ...zoraConversations.map((row) => row.challenge),
        ...events.map((row) => row.challenge),
      ],
      zoraConversations.length + events.length,
    ),
    topIndustries: groupMany(
      zoraConversations.map((row) => row.industry || row.inferred_industry),
      zoraConversations.length,
    ),
    leadTemperatures: groupMany(
      [
        ...zoraConversations.map((row) => row.lead_temperature),
        ...events.map((row) => row.lead_temperature),
      ],
      zoraConversations.length + events.length,
    ),
    averageLeadScore: leadScores.length
      ? Math.round(leadScores.reduce((sum, score) => sum + score, 0) / leadScores.length)
      : 0,
    topQuestions: groupMany(
      [
        ...zoraConversations.map((row) => normalizeQuestion(row.latest_user_message)),
        ...zoraLearningRows.map((row) => normalizeQuestion(row.user_message)),
        ...assistantConversations.map((row) => normalizeQuestion(row.question)),
      ],
      zoraConversations.length + zoraLearningRows.length + assistantConversations.length,
    ).slice(0, 10),
    failedIntents: groupMany(
      zoraFailures.map((row) => row.detected_intent || row.failure_reason),
      zoraFailures.length,
    ),
    repeatedFailures: groupMany(
      zoraFailures.map((row) => normalizeQuestion(row.assistant_response)),
      zoraFailures.length,
    ).slice(0, 8),
    pricingQuestions: countMatchingQuestions(
      zoraConversations,
      zoraLearningRows,
      assistantConversations,
      /\b(price|pricing|cost|how much|budget|fee|quote)\b/i,
    ),
    liveAgentRequests: zoraConversations.filter((row) => row.live_agent_requested).length,
    auditRequests:
      zoraConversations.filter((row) => row.audit_clicked).length +
      (eventCounts.audit_started ?? 0),
    sourceMetrics: groupMany(events.map((row) => row.source), events.length),
    pagePathMetrics: groupMany(events.map((row) => row.page_path), events.length).slice(0, 8),
    utmCampaignMetrics: groupMany(events.map((row) => row.utm_campaign), events.length),
    utmSourceMetrics: groupMany(events.map((row) => row.utm_source), events.length),
    utmMediumMetrics: groupMany(events.map((row) => row.utm_medium), events.length),
    gclidCount: events.filter((event) => Boolean(event.gclid)).length,
    recentEvents: events.slice(0, 30),
  };
}

function countEvents(events: ConversionEventRow[]) {
  return events.reduce<Record<string, number>>((counts, event) => {
    counts[event.event_name] = (counts[event.event_name] ?? 0) + 1;
    return counts;
  }, {});
}

function isQualifiedZoraConversation(conversation: ZoraConversationRow) {
  return Boolean(
    conversation.conversation_outcome === "qualified" ||
      conversation.current_step === "qualification_completed" ||
      (conversation.business_type &&
        (conversation.challenge || conversation.website_url || conversation.lead_score)),
  );
}

function fallbackTotalEvents(steps: FunnelStep[]) {
  return steps.reduce((total, step) => total + step.count, 0);
}

function countUnique<T>(rows: T[], getValue: (row: T) => string | null | undefined) {
  return new Set(rows.map(getValue).filter(Boolean)).size;
}

function rate(label: string, from: number, to: number): FunnelRate {
  return {
    label,
    from,
    to,
    rate: percentage(to, from),
  };
}

function countMatchingQuestions(
  zoraConversations: ZoraConversationRow[],
  zoraLearningRows: ZoraLearningRow[],
  assistantConversations: AssistantConversationRow[],
  pattern: RegExp,
) {
  return [
    ...zoraConversations.map((row) => row.latest_user_message),
    ...zoraLearningRows.map((row) => row.user_message),
    ...assistantConversations.map((row) => row.question),
  ].filter((value) => pattern.test(value || "")).length;
}

function DashboardShell({ children }: { children: ReactNode }) {
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
          View Growth Intelligence
        </button>
      </form>
    </div>
  );
}

function WarningPanel({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm text-amber-100">
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

function AnalyticsSubpanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <h3 className="text-sm font-bold text-primary">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function FunnelSummary({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      {steps.map((step, index) => (
        <div key={step.key} className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Step {index + 1}
          </p>
          <p className="mt-2 text-sm font-semibold text-secondary">{step.label}</p>
          <p className="mt-3 text-3xl font-black text-primary">{step.count}</p>
        </div>
      ))}
    </div>
  );
}

function RateCard({ rate: item }: { rate: FunnelRate }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <p className="text-sm font-semibold text-secondary">{item.label}</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <p className="text-3xl font-black text-primary">{formatPercent(item.rate)}</p>
        <p className="text-xs text-muted">
          {item.to} / {item.from}
        </p>
      </div>
      <ProgressBar value={item.rate} />
    </div>
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
              {row.count} / {formatPercent(row.percentage)}
            </p>
          </div>
          <ProgressBar value={row.percentage} />
        </div>
      ))}
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

function RecentEventsTable({ events }: { events: ConversionEventRow[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No conversion events logged yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1280px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Created</th>
            <th className="px-3 py-3">Event</th>
            <th className="px-3 py-3">Source</th>
            <th className="px-3 py-3">Website URL</th>
            <th className="px-3 py-3">Business Type</th>
            <th className="px-3 py-3">Challenge</th>
            <th className="px-3 py-3">Lead Temp</th>
            <th className="px-3 py-3">Session</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-secondary">{formatDate(event.created_at)}</td>
              <td className="px-3 py-4 font-semibold text-primary">
                {cleanLabel(event.event_name)}
              </td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(event.source)}</td>
              <td className="max-w-xs px-3 py-4 text-secondary">
                {event.website_url || "unknown"}
              </td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(event.business_type)}</td>
              <td className="px-3 py-4 text-secondary">{cleanLabel(event.challenge)}</td>
              <td className="px-3 py-4 text-secondary">
                {cleanLabel(event.lead_temperature)}
              </td>
              <td className="max-w-xs px-3 py-4 text-muted">
                {event.session_id || "unknown"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function groupMany(values: Array<string | null | undefined>, total: number): GroupMetric[] {
  const counts = new Map<string, number>();

  values.forEach((value) => {
    const label = cleanLabel(value);
    if (label === "Unknown") return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, count]) => metric(label, count, total || values.length))
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
  return `${value.toFixed(value >= 10 || value === 0 ? 0 : 1)}%`;
}

function cleanLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeQuestion(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ").slice(0, 140) || undefined;
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

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}
