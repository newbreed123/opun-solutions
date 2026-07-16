import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Filter,
  MessageSquare,
  Search,
} from "lucide-react";
import type { ReactNode } from "react";
import type {
  FounderConversationDashboard,
  ConversationQuery,
  ConversationSummary,
  FunnelStage,
  IntegrationHealth,
  LostOpportunity,
  PromptVersionPerformance,
  QuestionCategory,
} from "@/lib/founder-dashboard/conversations";

type FounderZoraIntelligenceProps = {
  data: FounderConversationDashboard;
  query: ConversationQuery;
  passcode: string;
};

export function FounderZoraIntelligence({
  data,
  query,
  passcode,
}: FounderZoraIntelligenceProps) {
  return (
    <div className="space-y-8" id="overview">
      <StickyNav />
      <ExecutiveSummary data={data} />
      <VisualFunnel stages={data.funnel} />

      <section
        id="zora-conversations"
        className="rounded-2xl border border-dark-border bg-dark-card p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] md:p-6"
      >
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
              Conversation Explorer
            </p>
            <h2 className="mt-3 text-2xl font-bold text-primary">
              Zora Conversations
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              Search real persisted transcripts and session rows. Analytics
              starts can exist without readable transcripts when a visitor opens
              Zora but never sends a message.
            </p>
          </div>
          <div className="rounded-xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">
            Conversation data may contain visitor-provided information. Handle
            according to the Opzix privacy policy.
          </div>
        </div>

        <ConversationFilters query={query} passcode={passcode} />
        <ConversationTable rows={data.summaries} passcode={passcode} />
      </section>

      <section id="lost-opportunities" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel
          eyebrow="Priority Alerts"
          title="Lost Opportunities"
          description="Meaningful intent that did not produce an audit completion, booking, or contact event."
        >
          <LostOpportunityTable rows={data.lostOpportunities} passcode={passcode} />
        </Panel>
        <Panel
          eyebrow="Data Honesty"
          title="Missing Instrumentation"
          description="Places where the dashboard refuses to invent data."
        >
          <div className="space-y-3">
            {data.missingDataNotes.map((note) => (
              <div
                key={note}
                className="rounded-xl border border-dark-border bg-dark-deep/60 p-4 text-sm leading-6 text-secondary"
              >
                {note}
              </div>
            ))}
          </div>
        </Panel>
      </section>

      <section id="questions" className="grid gap-6 xl:grid-cols-2">
        <Panel
          eyebrow="Question Intelligence"
          title="Most Asked Questions"
          description="Grouped only from persisted conversation text and summaries."
        >
          <QuestionTable rows={data.questionCategories} />
        </Panel>
        <Panel
          eyebrow="Objection Intelligence"
          title="Top Objections"
          description="Categories only appear when real conversation text supports them."
        >
          <QuestionTable rows={data.objections} />
        </Panel>
      </section>

      <section id="integrations" className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel
          eyebrow="Quality"
          title="Prompt Version Performance"
          description="Version tracking is now captured for new conversations so comparisons become trustworthy over time."
        >
          <PromptVersionTable rows={data.promptVersions} />
        </Panel>
        <Panel
          eyebrow="Integration Health"
          title="Systems Status"
          description="Status is based on configuration plus recent successful events where possible."
        >
          <IntegrationHealthGrid rows={data.integrationHealth} />
        </Panel>
      </section>
    </div>
  );
}

function StickyNav() {
  const items = [
    ["Overview", "#overview"],
    ["Conversations", "#zora-conversations"],
    ["Funnel", "#funnel"],
    ["Audits", "#funnel"],
    ["Bookings", "#funnel"],
    ["Traffic", "#questions"],
    ["Integrations", "#integrations"],
  ];

  return (
    <nav className="sticky top-0 z-10 -mx-2 overflow-x-auto border-y border-dark-border bg-dark-bg/90 px-2 py-3 backdrop-blur">
      <div className="flex min-w-max gap-2">
        {items.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="rounded-full border border-dark-border bg-dark-deep px-4 py-2 text-sm font-bold text-secondary transition-colors hover:border-brand-cyan hover:text-primary"
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  );
}

function ExecutiveSummary({ data }: { data: FounderConversationDashboard }) {
  const summary = data.executiveSummary;

  return (
    <section className="rounded-2xl border border-brand-cyan/25 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.96))] p-5 md:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
        Executive Summary
      </p>
      <h2 className="mt-3 text-3xl font-bold text-primary">{summary.greeting}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MiniMetric label="Visitors" value={summary.visitors} />
        <MiniMetric label="Zora conversations" value={summary.zoraConversations} />
        <MiniMetric label="Audits started" value={summary.auditsStarted} />
        <MiniMetric label="Audits completed" value={summary.auditsCompleted} />
        <MiniMetric label="Calls booked" value={summary.strategyCallsBooked} />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {[
          ["Biggest funnel leak", summary.biggestFunnelLeak],
          ["Top visitor question", summary.topVisitorQuestion],
          ["Top Zora issue", summary.topZoraIssue],
          ["Recommended action", summary.recommendedAction],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-dark-border bg-dark-deep/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              {label}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-primary">{value}</p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm font-semibold text-secondary">
        Confidence: {summary.confidence} | Supporting sample: {summary.sampleSize}
      </p>
    </section>
  );
}

function VisualFunnel({ stages }: { stages: FunnelStage[] }) {
  return (
    <section
      id="funnel"
      className="rounded-2xl border border-dark-border bg-dark-card p-5 shadow-[0_24px_70px_rgba(2,8,23,0.32)] md:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
        Visual Funnel
      </p>
      <h2 className="mt-3 text-2xl font-bold text-primary">
        Visitor to Revenue Path
      </h2>
      <div className="mt-6 grid gap-3">
        {stages.map((stage, index) => (
          <a
            key={stage.key}
            href={stage.href}
            className="grid gap-3 rounded-xl border border-dark-border bg-dark-deep/60 p-4 transition-colors hover:border-brand-cyan sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Stage {index + 1}
              </p>
              <p className="mt-1 text-base font-bold text-primary">{stage.label}</p>
              {stage.note ? (
                <p className="mt-1 text-xs leading-5 text-amber-100">{stage.note}</p>
              ) : null}
            </div>
            <FunnelStat label="Count" value={formatNumber(stage.count)} />
            <FunnelStat
              label="From previous"
              value={stage.fromPrevious === null ? "Baseline" : formatPercent(stage.fromPrevious)}
            />
            <FunnelStat
              label="Drop-off"
              value={stage.dropoff === null ? "-" : formatNumber(stage.dropoff)}
            />
          </a>
        ))}
      </div>
    </section>
  );
}

function ConversationFilters({
  query,
  passcode,
}: {
  query: ConversationQuery;
  passcode: string;
}) {
  return (
    <form className="mt-6 grid gap-3 rounded-xl border border-dark-border bg-dark-deep/60 p-4 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto]">
      {passcode ? <input type="hidden" name="passcode" value={passcode} /> : null}
      {query.from ? <input type="hidden" name="from" value={query.from} /> : null}
      {query.to ? <input type="hidden" name="to" value={query.to} /> : null}
      <label className="block text-sm font-semibold text-secondary">
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" /> Search
        </span>
        <input
          name="q"
          defaultValue={query.q || ""}
          placeholder="message, website, industry, campaign"
          className="mt-2 min-h-11 w-full rounded-lg border border-dark-border bg-dark-bg px-3 text-primary outline-none focus:border-brand-cyan"
        />
      </label>
      <SelectFilter label="Website" name="website" value={query.website} options={["all", "supplied", "missing"]} />
      <SelectFilter label="Qualified" name="qualified" value={query.qualified} options={["all", "qualified", "not_qualified"]} />
      <SelectFilter label="Audit" name="audit" value={query.audit} options={["all", "started", "completed"]} />
      <SelectFilter label="Booking" name="booking" value={query.booking} options={["all", "started", "completed"]} />
      <SelectFilter label="Transcript" name="transcript" value={query.transcript} options={["all", "complete", "legacy_partial", "analytics_only"]} />
      <button className="btn btn-secondary min-h-11 self-end" type="submit">
        <Filter className="h-4 w-4" />
        Filter
      </button>
    </form>
  );
}

function ConversationTable({
  rows,
  passcode,
}: {
  rows: ConversationSummary[];
  passcode: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
        No matching Zora conversations were found for this date range.
        Conversation-start analytics may exist without persisted transcripts,
        and legacy rows may only have partial latest-message pairs.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            {[
              "Started at",
              "Visitor/session",
              "Source",
              "Landing page",
              "Industry",
              "Website",
              "Messages",
              "Transcript",
              "Qualification",
              "Audit",
              "Booking",
              "Score",
              "Outcome",
              "Action",
            ].map((heading) => (
              <th key={heading} className="px-3 py-3">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-secondary">{formatDate(row.startedAt)}</td>
              <td className="px-3 py-4 font-mono text-xs text-muted">{truncateId(row.sessionId || row.id)}</td>
              <td className="px-3 py-4 text-secondary">{row.source || "unknown"}</td>
              <td className="max-w-[220px] px-3 py-4 text-secondary">{row.landingPage || "untracked"}</td>
              <td className="px-3 py-4 text-secondary">{row.industry || row.businessType || "unknown"}</td>
              <td className="max-w-[220px] px-3 py-4 text-secondary">{row.websiteUrl || "not supplied"}</td>
              <td className="px-3 py-4 text-primary">{row.messageCount}</td>
              <td className="px-3 py-4">
                <StatusPill label={transcriptStatusLabel(row.transcriptStatus)} />
              </td>
              <td className="px-3 py-4"><StatusPill label={row.qualificationStatus} /></td>
              <td className="px-3 py-4"><StatusPill label={row.auditStatus} /></td>
              <td className="px-3 py-4"><StatusPill label={row.bookingStatus} /></td>
              <td className="px-3 py-4 font-bold text-primary">{row.conversationScore ?? "Unreviewed"}</td>
              <td className="px-3 py-4 text-secondary">{row.outcome}</td>
              <td className="px-3 py-4">
                <a
                  href={conversationHref(row.id, passcode)}
                  className="inline-flex items-center gap-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 font-bold text-brand-cyan hover:border-brand-cyan"
                >
                  <MessageSquare className="h-4 w-4" />
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LostOpportunityTable({
  rows,
  passcode,
}: {
  rows: LostOpportunity[];
  passcode: string;
}) {
  if (!rows.length) {
    return <p className="text-sm text-muted">No supported lost-opportunity rows yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            {["Industry", "Need", "Intent", "Last step", "Likely friction", "Recommendation", "Confidence", "Link"].map((heading) => (
              <th key={heading} className="px-3 py-3">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 text-secondary">{row.industry}</td>
              <td className="max-w-[260px] px-3 py-4 text-primary">{row.need}</td>
              <td className="px-3 py-4 text-secondary">{row.intentLevel}</td>
              <td className="px-3 py-4 text-secondary">{row.lastStep}</td>
              <td className="max-w-[280px] px-3 py-4 text-secondary">{row.likelyFriction}</td>
              <td className="max-w-[280px] px-3 py-4 text-secondary">{row.recommendedFollowUp}</td>
              <td className="px-3 py-4 text-secondary">{row.confidence}</td>
              <td className="px-3 py-4">
                <a className="font-bold text-brand-cyan" href={conversationHref(row.id, passcode)}>
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuestionTable({ rows }: { rows: QuestionCategory[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted">Insufficient real data for this category.</p>;
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <a
          key={row.label}
          href={row.href}
          className="block rounded-xl border border-dark-border bg-dark-deep/60 p-4 hover:border-brand-cyan"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-primary">{row.label}</p>
              <p className="mt-1 text-xs text-muted">
                Drop-off: {row.commonDropoffStage}
              </p>
            </div>
            <p className="text-lg font-black text-brand-cyan">{row.count}</p>
          </div>
          <div className="mt-3 grid gap-2 text-xs text-secondary sm:grid-cols-4">
            <span>{formatPercent(row.percentage)} of conversations</span>
            <span>{formatPercent(row.conversionRate)} converted</span>
            <span>{formatPercent(row.auditStartRate)} audit-start</span>
            <span>{formatPercent(row.bookingRate)} booked</span>
          </div>
        </a>
      ))}
    </div>
  );
}

function PromptVersionTable({ rows }: { rows: PromptVersionPerformance[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted">No prompt-version data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.14em] text-muted">
          <tr>
            {["Prompt version", "Convos", "Qualified", "Website", "Audit start", "Audit complete", "Booking", "Avg score"].map((heading) => (
              <th key={heading} className="px-3 py-3">{heading}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.promptVersion} className="border-b border-dark-border last:border-b-0">
              <td className="px-3 py-4 font-mono text-xs text-secondary">{row.promptVersion}</td>
              <td className="px-3 py-4 text-primary">{row.conversations}</td>
              <td className="px-3 py-4 text-secondary">{formatPercent(row.qualificationRate)}</td>
              <td className="px-3 py-4 text-secondary">{formatPercent(row.websiteSuppliedRate)}</td>
              <td className="px-3 py-4 text-secondary">{formatPercent(row.auditStartRate)}</td>
              <td className="px-3 py-4 text-secondary">{formatPercent(row.auditCompletionRate)}</td>
              <td className="px-3 py-4 text-secondary">{formatPercent(row.bookingRate)}</td>
              <td className="px-3 py-4 text-primary">{row.averageQualityScore ?? "Unreviewed"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IntegrationHealthGrid({ rows }: { rows: IntegrationHealth[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="rounded-xl border border-dark-border bg-dark-deep/60 p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-primary">{row.label}</p>
            {row.status === "Connected" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-300" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-200" />
            )}
          </div>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-brand-cyan">
            {row.status}
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">{row.detail}</p>
        </div>
      ))}
    </div>
  );
}

function Panel({
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
      <h2 className="mt-3 text-2xl font-bold text-primary">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-deep/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black text-primary">{formatNumber(value)}</p>
    </div>
  );
}

function FunnelStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-28 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-right">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-primary">{value}</p>
    </div>
  );
}

function SelectFilter({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value?: string;
  options: string[];
}) {
  return (
    <label className="block text-sm font-semibold text-secondary">
      {label}
      <select
        name={name}
        defaultValue={value || "all"}
        className="mt-2 min-h-11 w-full rounded-lg border border-dark-border bg-dark-bg px-3 text-primary outline-none focus:border-brand-cyan"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPill({ label }: { label: string }) {
  const positive = /completed|qualified|started/.test(label);

  return (
    <span
      className={[
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize",
        positive
          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
          : "border-dark-border bg-dark-deep text-muted",
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function transcriptStatusLabel(status: ConversationSummary["transcriptStatus"]) {
  if (status === "complete") return "complete transcript";
  if (status === "legacy_partial") return "legacy partial";
  return "analytics-only";
}

function conversationHref(id: string, passcode: string) {
  const params = new URLSearchParams();
  if (passcode) params.set("passcode", passcode);
  const suffix = params.toString();
  return `/admin/founder-dashboard/conversations/${encodeURIComponent(id)}${suffix ? `?${suffix}` : ""}`;
}

function truncateId(value: string) {
  return value.length > 14 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value || "unknown";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
