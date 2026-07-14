import {
  Activity,
  BarChart3,
  CalendarDays,
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
  demoZoraIntelligenceInsights,
} from "@/lib/founder-dashboard/mock-data";
import { getFounderDashboardMetrics } from "@/lib/founder-dashboard/events";
import type { ZoraIntelligenceInsights } from "@/lib/founder-dashboard/events";
import {
  getFounderDateRange,
  type FounderDateRange,
  type FounderDateRangePreset,
} from "@/lib/founder-dashboard/date-ranges";
import { calculateFunnelRates, percentage } from "@/lib/founder-dashboard/metrics";
import { listAppointments } from "@/lib/scheduling/appointments";
import { formatTimezoneLabel } from "@/lib/scheduling/display";
import type { AppointmentRecord } from "@/lib/scheduling/types";
import type {
  FounderDashboardEvent,
  FounderDashboardMetrics,
  FounderEvent,
  FunnelStep,
  IndustryCategory,
  ProblemCategory,
} from "@/lib/founder-dashboard/types";

export const dynamic = "force-dynamic";

const FOUNDER_DASHBOARD_TIMEZONE = "America/New_York";

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

type SchedulingStats = {
  upcoming: number;
  today: number;
  tomorrow: number;
  bookedInRange: number;
  cancelled: number;
  completed: number;
  noShow: number;
};

const demoZoraStatusLabel = "Demo Zora insights until real Zora events are collected.";

const dateFilterOptions: Array<{
  label: string;
  preset: Exclude<FounderDateRangePreset, "custom">;
}> = [
  { label: "Today", preset: "today" },
  { label: "Yesterday", preset: "yesterday" },
  { label: "7 Days", preset: "last_7_days" },
  { label: "Month", preset: "this_month" },
  { label: "Year", preset: "this_year" },
];

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
  const dateRange = getFounderDateRange(
    getParam(params, "preset") || "today",
    getParam(params, "from"),
    getParam(params, "to"),
  );

  if (passcode && providedPasscode !== passcode) {
    return (
      <DashboardShell>
        <LockedState />
      </DashboardShell>
    );
  }

  const dashboardData = await getFounderDashboardMetrics({
    from: dateRange.from,
    to: dateRange.to,
  });
  const appointmentsData = await listAppointments({
    from: dateRange.from,
    to: dateRange.to,
  });
  const hasRealEvents = dashboardData.ok && dashboardData.data.events.length > 0;
  const status = dataSourceStatus(
    dashboardData.ok,
    hasRealEvents,
    dashboardData.ok ? undefined : dashboardData.error,
  );
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
  const recentDebugEvents = dashboardData.ok
    ? dashboardData.data.events.slice(0, 25)
    : [];
  const hasRealZoraInsightEvents =
    dashboardData.ok && dashboardData.data.zoraInsights.hasRealZoraInsightEvents;
  const zoraInsights = hasRealZoraInsightEvents
    ? dashboardData.data.zoraInsights
    : demoZoraIntelligenceInsights;
  const funnelSteps = calculateFunnelRates(metrics);
  const healthMetrics = buildHealthMetrics(metrics);
  const latestEvent = dashboardData.ok ? dashboardData.data.events[0] : undefined;
  const appointments = appointmentsData.ok ? appointmentsData.data : [];
  const schedulingStats = buildSchedulingStats(appointments);

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
          {status.label}
        </div>
      </div>

      {!passcode ? (
        <WarningPanel
          icon={ShieldAlert}
          message="Internal dashboard prototype. Add authentication before production use."
        />
      ) : null}

      <DateRangeControls
        dateRange={dateRange}
        passcode={providedPasscode}
      />

      <DashboardDataStatus
        dateRange={dateRange}
        status={status}
        totalEvents={dashboardData.ok ? dashboardData.data.events.length : 0}
        latestEvent={latestEvent}
        showingDemoPreview={!hasRealEvents}
      />

      <div className="mt-6 space-y-8">
        {!hasRealEvents ? (
          <AnalyticsPanel
            eyebrow="Live Event Visibility"
            title={dashboardData.ok ? "No Live Events Found for This Date Range" : status.label}
            description={
              dashboardData.ok
                ? "The dashboard did not receive conversion_events rows for the selected range. Demo preview values are shown below so the dashboard layout remains inspectable."
                : "The dashboard could not load live conversion_events rows. Demo preview values are shown below so the dashboard layout remains inspectable."
            }
          >
            <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">
              Demo preview
            </div>
          </AnalyticsPanel>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
          {buildKpiCards(metrics).map((card) => (
            <KpiCard key={card.label} card={card} />
          ))}
        </section>

        <AnalyticsPanel
          eyebrow="Scheduling"
          title="Native Strategy Sessions"
          description={
            appointmentsData.ok
              ? "Live appointments from the native scheduling table. Main dashboard rows omit prospect email."
              : "Appointments could not be loaded from Supabase."
          }
        >
          <SchedulingPanel stats={schedulingStats} appointments={appointments} />
        </AnalyticsPanel>

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

        <AnalyticsPanel
          eyebrow="Zora Intelligence"
          title="Conversation Learning"
          description={
            hasRealZoraInsightEvents
              ? "Live sanitized Zora events grouped into founder-level learning signals."
              : demoZoraStatusLabel
          }
        >
          {!hasRealZoraInsightEvents ? (
            <div className="mb-5 rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">
              {demoZoraStatusLabel}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InsightStatCard
              label="Zora Conversations"
              value={zoraInsights.totalZoraConversations}
              helper="Conversation starts or message signals"
            />
            <InsightStatCard
              label="Qualified Leads"
              value={zoraInsights.qualifiedZoraLeads}
              helper={`${formatPercent(zoraInsights.qualifiedLeadRate)} qualified rate`}
            />
            <InsightStatCard
              label="Profile Completion Rate"
              value={formatPercent(zoraInsights.leadProfileCompletionRate)}
              helper={`${zoraInsights.leadProfileCompleted} completed profiles`}
            />
            <InsightStatCard
              label="Low Confidence Fallbacks"
              value={zoraInsights.lowConfidenceFallbacks}
              helper={`${formatPercent(zoraInsights.lowConfidenceFallbackRate)} fallback rate`}
            />
          </div>
        </AnalyticsPanel>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <AnalyticsPanel
            eyebrow="Top Prospect Questions"
            title="Sanitized Question Summaries"
            description="Short non-sensitive summaries only; raw chat messages are not displayed."
          >
            <InsightRows
              rows={zoraInsights.topQuestionSummaries}
              emptyLabel="No sanitized Zora question summaries yet."
            />
          </AnalyticsPanel>

          <AnalyticsPanel
            eyebrow="Top Detected Intent"
            title="Intent Mix"
            description="Grouped Zora intent categories such as offer, concept, framework, action, pricing, and fallback."
          >
            <InsightRows
              rows={zoraInsights.topZoraIntents}
              emptyLabel="No detected Zora intents yet."
            />
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <AnalyticsPanel
            eyebrow="Top Concepts / Offers"
            title="What Users Ask About"
            description="Concepts and services detected from sanitized Zora routing signals."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <InsightSubpanel title="Concepts users ask about">
                <InsightRows
                  rows={zoraInsights.topZoraConcepts}
                  emptyLabel="No concept detections yet."
                />
              </InsightSubpanel>
              <InsightSubpanel title="Services users ask about">
                <InsightRows
                  rows={zoraInsights.topZoraOffers}
                  emptyLabel="No offer detections yet."
                />
              </InsightSubpanel>
            </div>
          </AnalyticsPanel>

          <AnalyticsPanel
            eyebrow="Solution Framework Usage"
            title="Framework Demand"
            description="Frameworks Zora used to explain prospect problems and next steps."
          >
            <InsightRows
              rows={zoraInsights.topSolutionFrameworks}
              emptyLabel="No solution framework usage yet."
            />
          </AnalyticsPanel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AnalyticsPanel
            eyebrow="Conversation Quality"
            title="Qualification and Drop-off Signals"
            description="Session-level attribution requires anonymous sessionId."
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <HealthRateCard
                metric={{
                  label: "Low-confidence fallback rate",
                  value: zoraInsights.lowConfidenceFallbackRate,
                  base: "Fallbacks / conversations",
                }}
              />
              <HealthRateCard
                metric={{
                  label: "Qualified lead rate",
                  value: zoraInsights.qualifiedLeadRate,
                  base: "Qualified leads / conversations",
                }}
              />
              <HealthRateCard
                metric={{
                  label: "CTA click rate",
                  value: zoraInsights.ctaClickRate,
                  base: "Zora CTA clicks / conversations",
                }}
              />
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <InsightStatCard
                label="With Business Type"
                value={zoraInsights.conversationsWithBusinessType}
                helper="Profile context present"
              />
              <InsightStatCard
                label="With Challenge"
                value={zoraInsights.conversationsWithChallenge}
                helper="Problem context present"
              />
              <InsightStatCard
                label="With Website Domain"
                value={zoraInsights.conversationsWithWebsiteDomain}
                helper="Domain context present"
              />
              <InsightStatCard
                label="All 3 Fields"
                value={zoraInsights.conversationsWithAllProfileFields}
                helper="Business, challenge, and domain"
              />
            </div>
            <p className="mt-4 text-sm leading-6 text-muted">
              Strategy call clicks after Zora:{" "}
              <span className="font-bold text-primary">
                {zoraInsights.strategyCallClicksAfterZora}
              </span>
              . Session-level attribution requires anonymous sessionId.
            </p>
          </AnalyticsPanel>

          <AnalyticsPanel
            eyebrow="Founder Insight Notes"
            title="Zora Learning Actions"
            description="Static v3 notes for prioritizing knowledge and campaign updates."
          >
            <div className="space-y-3">
              {[
                "Repeated unknown questions should become Brain entries.",
                "High offer interest should become landing pages.",
                "High framework usage should influence Google Ads campaigns.",
                "Low-confidence fallback spikes mean Zora needs knowledge/playbook updates.",
              ].map((note) => (
                <div
                  key={note}
                  className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-4 text-sm font-semibold leading-6 text-primary"
                >
                  {note}
                </div>
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

        <RecentEventsDebugPanel events={recentDebugEvents} hasRealEvents={hasRealEvents} />

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

function buildSchedulingStats(appointments: AppointmentRecord[]): SchedulingStats {
  const now = new Date();
  const today = localDateKey(now);
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localDateKey(tomorrowDate);

  return {
    upcoming: appointments.filter(
      (appointment) =>
        appointment.status === "confirmed" &&
        new Date(appointment.start_at).getTime() >= now.getTime(),
    ).length,
    today: appointments.filter(
      (appointment) => localDateKey(new Date(appointment.start_at)) === today,
    ).length,
    tomorrow: appointments.filter(
      (appointment) => localDateKey(new Date(appointment.start_at)) === tomorrow,
    ).length,
    bookedInRange: appointments.length,
    cancelled: appointments.filter((appointment) => appointment.status === "cancelled").length,
    completed: appointments.filter((appointment) => appointment.status === "completed").length,
    noShow: appointments.filter((appointment) => appointment.status === "no_show").length,
  };
}

function SchedulingPanel({
  stats,
  appointments,
}: {
  stats: SchedulingStats;
  appointments: AppointmentRecord[];
}) {
  const statRows = [
    ["Upcoming", stats.upcoming],
    ["Today", stats.today],
    ["Tomorrow", stats.tomorrow],
    ["Booked in range", stats.bookedInRange],
    ["Cancelled", stats.cancelled],
    ["Completed", stats.completed],
    ["No-show", stats.noShow],
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {statRows.map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-dark-border bg-dark-deep/60 p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {label}
            </p>
            <p className="mt-3 text-3xl font-black text-primary">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted">No appointments found for this date range.</p>
        ) : (
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="border-b border-dark-border text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Website</th>
                <th className="px-3 py-3">Business Type</th>
                <th className="px-3 py-3">Challenge</th>
                <th className="px-3 py-3">Audit</th>
              </tr>
            </thead>
            <tbody>
              {appointments.slice(0, 18).map((appointment) => (
                <tr
                  key={appointment.id}
                  className="border-b border-dark-border last:border-b-0"
                >
                  <td className="px-3 py-4 font-semibold text-primary">
                    {formatAppointmentDate(appointment)}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {cleanInsightLabel(appointment.status)}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {appointment.source || "direct"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {appointment.website_domain || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {appointment.business_type || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {appointment.challenge || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-muted">
                    {appointment.scan_id ? "available" : "none"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
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

function localDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FOUNDER_DASHBOARD_TIMEZONE,
  }).formatToParts(date);
  const valueFor = (type: string) =>
    parts.find((part) => part.type === type)?.value || "";
  const year = valueFor("year");
  const month = valueFor("month");
  const day = valueFor("day");

  return `${year}-${month}-${day}`;
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
    strategy_call_booking_viewed: "Booking page viewed",
    strategy_call_slot_selected: "Booking slot selected",
    strategy_call_booking_started: "Booking started",
    strategy_call_booking_failed: "Booking failed",
    strategy_call_confirmation_email_sent: "Confirmation email sent",
    strategy_call_reminder_24h_sent: "24-hour reminder sent",
    strategy_call_reminder_1h_sent: "1-hour reminder sent",
    zora_message_received: "Zora message received",
    zora_intent_detected: "Zora intent detected",
    zora_concept_detected: "Zora concept detected",
    zora_offer_detected: "Zora offer detected",
    zora_solution_framework_used: "Zora solution framework used",
    zora_playbook_used: "Zora playbook used",
    zora_low_confidence_fallback: "Zora low-confidence fallback",
    zora_lead_profile_completed: "Zora lead profile completed",
    zora_cta_clicked: "Zora CTA clicked",
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

function DateRangeControls({
  dateRange,
  passcode,
}: {
  dateRange: FounderDateRange;
  passcode: string;
}) {
  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-5 md:p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
            <CalendarDays className="h-4 w-4" />
            Date Range
          </p>
          <h2 className="mt-3 text-2xl font-bold text-primary">
            {dateRange.label}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {dateFilterOptions.map((option) => (
            <a
              key={option.preset}
              href={dashboardRangeHref(passcode, option.preset)}
              className={dateRangeButtonClass(dateRange.preset === option.preset)}
            >
              {option.label}
            </a>
          ))}
          <a
            href={dashboardRangeHref(passcode, "custom", dateRange.from, dateRange.to)}
            className={dateRangeButtonClass(dateRange.preset === "custom")}
          >
            Custom
          </a>
        </div>
      </div>

      <form
        action="/admin/founder-dashboard"
        className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end"
      >
        {passcode ? <input type="hidden" name="passcode" value={passcode} /> : null}
        <input type="hidden" name="preset" value="custom" />
        <label className="block text-sm font-semibold text-secondary">
          From
          <input
            type="date"
            name="from"
            defaultValue={dateInputValue(dateRange.from)}
            className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <label className="block text-sm font-semibold text-secondary">
          To
          <input
            type="date"
            name="to"
            defaultValue={dateInputValue(dateRange.to)}
            className="mt-2 min-h-12 w-full rounded-xl border border-dark-border bg-dark-deep px-4 text-primary outline-none focus:border-brand-cyan"
          />
        </label>
        <button type="submit" className="btn btn-secondary min-h-12">
          Apply
        </button>
      </form>
    </section>
  );
}

function DashboardDataStatus({
  dateRange,
  status,
  totalEvents,
  latestEvent,
  showingDemoPreview,
}: {
  dateRange: FounderDateRange;
  status: DashboardStatus;
  totalEvents: number;
  latestEvent?: FounderDashboardEvent;
  showingDemoPreview: boolean;
}) {
  return (
    <section className={`mt-5 rounded-2xl border p-5 ${statusPanelClass(status.tone)}`}>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-sm font-bold text-primary">{status.label}</p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Range: {dateRange.label} | Events: {formatNumber(totalEvents)}
            {latestEvent
              ? ` | Last event: ${latestEvent.eventName} at ${formatTime(latestEvent.createdAt)}`
              : " | Last event: none"}
          </p>
          {showingDemoPreview ? (
            <p className="mt-2 text-sm font-semibold text-amber-100">
              Demo data shown below as a preview.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

type DashboardStatus = {
  label: string;
  tone: "live" | "empty" | "demo" | "error";
};

function dataSourceStatus(
  ok: boolean,
  hasRealEvents: boolean,
  error?: string,
): DashboardStatus {
  if (ok && hasRealEvents) {
    return { label: "Live internal events loaded", tone: "live" };
  }

  if (ok) {
    return { label: "No live events found for this date range", tone: "empty" };
  }

  if (error?.toLowerCase().includes("supabase")) {
    return { label: "Supabase unavailable", tone: "error" };
  }

  return { label: "API error", tone: "error" };
}

function statusPanelClass(tone: DashboardStatus["tone"]) {
  if (tone === "live") {
    return "border-emerald-300/30 bg-emerald-400/10";
  }

  if (tone === "error") {
    return "border-red-300/30 bg-red-400/10";
  }

  if (tone === "demo") {
    return "border-amber-300/30 bg-amber-400/10";
  }

  return "border-amber-300/30 bg-amber-400/10";
}

function dateRangeButtonClass(active: boolean) {
  return [
    "inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-bold transition-colors",
    active
      ? "border-brand-cyan bg-brand-cyan text-dark-bg"
      : "border-dark-border bg-dark-deep/60 text-secondary hover:border-brand-cyan hover:text-primary",
  ].join(" ");
}

function dashboardRangeHref(
  passcode: string,
  preset: FounderDateRangePreset,
  from?: string,
  to?: string,
) {
  const params = new URLSearchParams();

  if (passcode) params.set("passcode", passcode);
  params.set("preset", preset);

  if (preset === "custom") {
    if (from) params.set("from", dateInputValue(from));
    if (to) params.set("to", dateInputValue(to));
  }

  return `/admin/founder-dashboard?${params.toString()}`;
}

function dateInputValue(value: string) {
  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function InsightStatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: number | string;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-primary">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </div>
  );
}

function InsightSubpanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
      <h3 className="text-sm font-bold text-primary">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function InsightRows({
  rows,
  emptyLabel,
}: {
  rows: ZoraIntelligenceInsights["topZoraIntents"];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">{emptyLabel}</p>;
  }

  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-start justify-between gap-4">
            <p className="min-w-0 break-words text-sm font-semibold text-secondary">
              {cleanInsightLabel(row.label)}
            </p>
            <p className="flex-none text-sm font-bold text-primary">
              {row.count}
            </p>
          </div>
          <ProgressBar value={percentage(row.count, total)} />
        </div>
      ))}
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

function RecentEventsDebugPanel({
  events,
  hasRealEvents,
}: {
  events: FounderDashboardEvent[];
  hasRealEvents: boolean;
}) {
  return (
    <details
      open={hasRealEvents}
      className="rounded-2xl border border-dark-border bg-dark-card p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] md:p-6"
    >
      <summary className="cursor-pointer text-xl font-bold text-primary">
        Recent Events
      </summary>
      <p className="mt-3 text-sm leading-6 text-muted">
        Latest 25 sanitized events for the selected date range. Raw messages,
        names, emails, and phone numbers are not displayed.
      </p>
      <div className="mt-5 overflow-x-auto">
        {events.length === 0 ? (
          <p className="text-sm text-muted">
            No live events found for this date range.
          </p>
        ) : (
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="border-b border-dark-border text-xs uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-3 py-3">Event</th>
                <th className="px-3 py-3">Timestamp</th>
                <th className="px-3 py-3">Source</th>
                <th className="px-3 py-3">Website Domain</th>
                <th className="px-3 py-3">Business Type</th>
                <th className="px-3 py-3">Challenge</th>
                <th className="px-3 py-3">Industry</th>
                <th className="px-3 py-3">Scan ID</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-dark-border last:border-b-0"
                >
                  <td className="px-3 py-4 font-semibold text-primary">
                    {cleanInsightLabel(event.eventName)}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {formatDate(event.createdAt)}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {event.source || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {event.websiteDomain || event.websiteUrl || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {event.businessType || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {event.challenge || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-secondary">
                    {event.industry || "unknown"}
                  </td>
                  <td className="px-3 py-4 text-muted">
                    {event.scanId || "none"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </details>
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

function formatAppointmentDate(appointment: AppointmentRecord) {
  return `${formatDate(appointment.start_at, appointment.timezone)} ${formatTimezoneLabel(
    appointment.timezone,
  )}`;
}

function formatDate(value: string, timezone = FOUNDER_DASHBOARD_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function formatTime(value: string, timezone = FOUNDER_DASHBOARD_TIMEZONE) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(value));
}

function cleanInsightLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
