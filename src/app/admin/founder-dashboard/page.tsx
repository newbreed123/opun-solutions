import {
  Activity,
  BarChart3,
  CircleAlert,
  ClipboardList,
  Contact,
  MessageSquare,
  MousePointerClick,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  demoFounderDashboardMetrics,
  demoIndustryCategories,
  demoProblemCategories,
  demoRecentFounderEvents,
} from "@/lib/founder-dashboard/mock-data";
import { getFounderDashboardMetrics } from "@/lib/founder-dashboard/events";
import { calculateFunnelRates, percentage } from "@/lib/founder-dashboard/metrics";
import type {
  FounderDashboardEvent,
  FounderDashboardMetrics,
  FounderEvent,
  FunnelStep,
  IndustryCategory,
  ProblemCategory,
} from "@/lib/founder-dashboard/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<
  Record<string, string | string[] | undefined> | undefined
>;

type FounderDashboardPageProps = {
  searchParams?: SearchParams;
};

type KpiCard = {
  label: string;
  value: number;
  icon: LucideIcon;
  helper: string;
};

type HealthMetric = {
  label: string;
  value: number;
  base: string;
};

const dataStatusLabel = "Demo data until GA4 API is connected.";
const liveDataStatusLabel = "Live internal events";

const insightCards = [
  "Audit completion rate is strong",
  "Zora engagement needs monitoring",
  "Strategy call rate is the main revenue signal",
  "Track problem categories before scaling ad spend",
];

export default async function FounderDashboardPage({
  searchParams,
}: FounderDashboardPageProps) {
  const params = (await searchParams) ?? {};
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode = getParam(params, "passcode");

  if (passcode && providedPasscode !== passcode) {
    return (
      <DashboardShell>
        <LockedState />
      </DashboardShell>
    );
  }

  const dashboardData = await getFounderDashboardMetrics();
  const hasRealEvents = dashboardData.ok && dashboardData.data.events.length > 0;
  const metrics = hasRealEvents
    ? dashboardData.data.metrics
    : demoFounderDashboardMetrics;
  const problemCategories = hasRealEvents
    ? categoryRows(
        dashboardData.data.topProblems,
        "Sourced from sanitized event challenge fields.",
      )
    : demoProblemCategories;
  const industryCategories = hasRealEvents
    ? categoryRows(
        dashboardData.data.topIndustries,
        "Sourced from sanitized industry and business type fields.",
      )
    : demoIndustryCategories;
  const recentEvents = hasRealEvents
    ? dashboardData.data.events.slice(0, 12).map(founderEventForDisplay)
    : demoRecentFounderEvents;
  const funnelSteps = calculateFunnelRates(metrics);
  const healthMetrics = buildHealthMetrics(metrics);

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Opzix Internal
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary md:text-5xl">
            Opzix Founder Dashboard
          </h1>
          <p className="mt-3 max-w-4xl leading-relaxed text-secondary">
            Track acquisition, audit engagement, Zora usage, and sales intent.
          </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm font-semibold text-brand-cyan">
          <CircleAlert className="h-4 w-4 flex-none" />
          {hasRealEvents ? liveDataStatusLabel : dataStatusLabel}
        </div>
      </div>

      {!passcode ? (
        <WarningPanel
          icon={ShieldAlert}
          message="Internal dashboard prototype. Add authentication before production use."
        />
      ) : null}

      <div className="mt-6 space-y-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          {buildKpiCards(metrics).map((card) => (
            <KpiCard key={card.label} card={card} />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AnalyticsPanel
            eyebrow="Funnel View"
            title="Audit to Revenue Intent"
            description={
              hasRealEvents
                ? "Each step shows live internal count and conversion from the previous step."
                : "Each step shows demo count and conversion from the previous step."
            }
          >
            <FunnelView steps={funnelSteps} />
          </AnalyticsPanel>

          <AnalyticsPanel
            eyebrow="Conversion Health"
            title="Rate Snapshot"
            description="Simple ratios from the current dashboard counts."
          >
            <div className="space-y-4">
              {healthMetrics.map((metric) => (
                <HealthRateCard key={metric.label} metric={metric} />
              ))}
            </div>
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <AnalyticsPanel
            eyebrow="Lead Profile Placeholders"
            title="Top Business Problems"
            description={
              hasRealEvents
                ? "Grouped from sanitized challenge fields on internal events."
                : "Eventually sourced from Zora lead profile data."
            }
          >
            <CategoryGrid categories={problemCategories} />
          </AnalyticsPanel>

          <AnalyticsPanel
            eyebrow="Market Mix Placeholders"
            title="Top Industries"
            description={
              hasRealEvents
                ? "Grouped from sanitized industry and business type fields."
                : "Eventually sourced from Zora qualification and scanner industry detection."
            }
          >
            <CategoryGrid categories={industryCategories} />
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <AnalyticsPanel
            eyebrow="Recent Activity"
            title="Latest Funnel Events"
            description={
              hasRealEvents
                ? "Latest sanitized internal events; no names, emails, phones, or message content."
                : "Mock event stream only; no private customer data is shown."
            }
          >
            <RecentActivity events={recentEvents} />
          </AnalyticsPanel>

          <AnalyticsPanel
            eyebrow="Founder Insights"
            title="Operating Notes"
            description="Static v1 insights to guide founder review."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {insightCards.map((insight) => (
                <div
                  key={insight}
                  className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-4"
                >
                  <Sparkles className="h-5 w-5 text-brand-cyan" />
                  <p className="mt-4 text-sm font-semibold leading-6 text-primary">
                    {insight}
                  </p>
                </div>
              ))}
            </div>
          </AnalyticsPanel>
        </section>

        <AnalyticsPanel
          eyebrow="Future Data Sources"
          title="GA4 and Internal Event Integration"
          description="This v2 uses internal event storage first and still avoids GA4 API work until credentials and architecture are ready."
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              "GA4 Data API",
              "Supabase event storage",
              "Internal event database",
              "Google Ads attribution",
            ].map((source) => (
              <div
                key={source}
                className="rounded-xl border border-dark-border bg-dark-deep/60 p-4 text-sm font-semibold text-secondary"
              >
                {source}
              </div>
            ))}
          </div>
        </AnalyticsPanel>
      </div>
    </DashboardShell>
  );
}

function buildKpiCards(metrics: FounderDashboardMetrics): KpiCard[] {
  return [
    {
      label: "Audit Started",
      value: metrics.auditStarted,
      icon: Activity,
      helper: "Scanner entry",
    },
    {
      label: "Audit Completed",
      value: metrics.auditCompleted,
      icon: ClipboardList,
      helper: "Finished scans",
    },
    {
      label: "Zora Conversations",
      value: metrics.zoraConversations,
      icon: MessageSquare,
      helper: "Assistant engagement",
    },
    {
      label: "Audit Assistant Prompts",
      value: metrics.auditAssistantPrompts,
      icon: MousePointerClick,
      helper: "Prompt clicks",
    },
    {
      label: "Strategy Calls Booked",
      value: metrics.strategyCallsBooked,
      icon: PhoneCall,
      helper: "Revenue signal",
    },
    {
      label: "Contact Forms Submitted",
      value: metrics.contactFormsSubmitted,
      icon: Contact,
      helper: "Direct inquiry",
    },
    {
      label: "Zora Qualified Leads",
      value: metrics.zoraQualifiedLeads,
      icon: Users,
      helper: "Qualification signal",
    },
  ];
}

function buildHealthMetrics(metrics: FounderDashboardMetrics): HealthMetric[] {
  return [
    {
      label: "Audit completion rate",
      value: percentage(metrics.auditCompleted, metrics.auditStarted),
      base: "Audit completed / audit started",
    },
    {
      label: "Zora engagement rate",
      value: percentage(metrics.zoraConversations, metrics.auditCompleted),
      base: "Zora conversations / audit completed",
    },
    {
      label: "Strategy call rate",
      value: percentage(metrics.strategyCallsBooked, metrics.zoraConversations),
      base: "Booked calls / Zora conversations",
    },
    {
      label: "Contact submission rate",
      value: percentage(metrics.contactFormsSubmitted, metrics.auditCompleted),
      base: "Contact forms / audit completed",
    },
  ];
}

function categoryRows(
  rows: Array<{ label: string; count: number }>,
  note: string,
): ProblemCategory[] {
  return rows.map((row) => ({
    ...row,
    note,
  }));
}

function founderEventForDisplay(event: FounderDashboardEvent): FounderEvent {
  return {
    id: event.id,
    eventName: event.eventName,
    label: labelForEvent(event.eventName),
    occurredAt: event.createdAt,
    source: [event.source || "unknown", event.websiteUrl].filter(Boolean).join(" - "),
    websiteUrl: event.websiteUrl,
  };
}

function labelForEvent(eventName: FounderDashboardEvent["eventName"]) {
  const labels: Record<FounderDashboardEvent["eventName"], string> = {
    audit_started: "Audit started",
    audit_completed: "Audit completed",
    zora_conversation_started: "Zora conversation started",
    audit_assistant_prompt_clicked: "Audit assistant prompt clicked",
    strategy_call_booked: "Strategy call booked",
    contact_form_submitted: "Contact form submitted",
    zora_qualified_lead: "Zora qualified lead",
    pdf_downloaded: "PDF downloaded",
    strategy_call_clicked: "Strategy call clicked",
  };

  return labels[eventName];
}

function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-bg py-8 md:py-10">
      <div className="container-wide">{children}</div>
    </main>
  );
}

function LockedState() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Opzix Admin
      </p>
      <h1 className="mt-3 text-3xl font-bold text-primary">Passcode required</h1>
      <p className="mt-3 leading-relaxed text-secondary">
        Enter the internal passcode to view the Opzix Founder Dashboard.
      </p>
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
          View Founder Dashboard
        </button>
      </form>
    </div>
  );
}

function WarningPanel({
  icon: Icon,
  message,
}: {
  icon: LucideIcon;
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm font-semibold text-amber-100">
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 flex-none" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function AnalyticsPanel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
        {eyebrow}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function KpiCard({ card }: { card: KpiCard }) {
  const Icon = card.icon;

  return (
    <div className="rounded-2xl border border-dark-border bg-dark-card p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          {card.label}
        </p>
        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 text-3xl font-black text-primary">
        {formatNumber(card.value)}
      </p>
      <p className="mt-2 text-sm text-muted">{card.helper}</p>
    </div>
  );
}

function FunnelView({ steps }: { steps: FunnelStep[] }) {
  return (
    <div className="space-y-3">
      {steps.map((step, index) => (
        <div key={step.key}>
          <div className="grid gap-3 rounded-xl border border-dark-border bg-dark-deep/60 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Step {index + 1}
              </p>
              <p className="mt-2 text-base font-bold text-primary">{step.label}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <p className="text-2xl font-black text-primary">
                {formatNumber(step.count)}
              </p>
              <span className="rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-brand-cyan">
                {step.conversionFromPrevious === null
                  ? "Baseline"
                  : `${formatPercent(step.conversionFromPrevious)} from previous`}
              </span>
            </div>
          </div>
          {index < steps.length - 1 ? (
            <div className="flex justify-center py-2 text-brand-cyan" aria-hidden="true">
              <TrendingUp className="h-5 w-5 rotate-90" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function HealthRateCard({ metric }: { metric: HealthMetric }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-primary">{metric.label}</p>
          <p className="mt-1 text-xs leading-5 text-muted">{metric.base}</p>
        </div>
        <p className="flex-none text-2xl font-black text-brand-cyan">
          {formatPercent(metric.value)}
        </p>
      </div>
      <ProgressBar value={metric.value} />
    </div>
  );
}

function CategoryGrid({
  categories,
}: {
  categories: Array<ProblemCategory | IndustryCategory>;
}) {
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {categories.length === 0 ? (
        <p className="text-sm text-muted">No categorized event data yet.</p>
      ) : null}
      {categories.map((category) => (
        <div
          key={category.label}
          className="rounded-xl border border-dark-border bg-dark-deep/60 p-4"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-bold text-primary">{category.label}</p>
            <p className="text-sm font-black text-brand-cyan">{category.count}</p>
          </div>
          <ProgressBar value={percentage(category.count, total)} />
          <p className="mt-3 text-xs leading-5 text-muted">{category.note}</p>
        </div>
      ))}
    </div>
  );
}

function RecentActivity({ events }: { events: FounderEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="grid gap-3 rounded-xl border border-dark-border bg-dark-deep/60 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 text-brand-cyan">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-primary">{event.label}</p>
            <p className="mt-1 text-xs text-muted">{event.source}</p>
          </div>
          <p className="text-xs font-semibold text-secondary">
            {formatDate(event.occurredAt)}
          </p>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-brand-cyan"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 || value === 0 ? 0 : 1)}%`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
