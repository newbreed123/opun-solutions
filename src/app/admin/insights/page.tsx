import {
  listAuditInsightScans,
  type AuditScanRow,
} from "@/lib/audit-scan-log";
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
  conversionByConcern: ConversionGroupMetric[];
  conversionByArchetype: ConversionGroupMetric[];
  recentScans: AuditScanRow[];
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

  const scans = await listAuditInsightScans();
  const insights = buildInsights(scans.data);

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
            </div>
          </section>

          <AnalyticsPanel title="Recent Scans">
            <RecentScansTable scans={insights.recentScans} />
          </AnalyticsPanel>
        </div>
      )}
    </DashboardShell>
  );
}

function buildInsights(scans: AuditScanRow[]): Insights {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  const day = startOfWeek.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const leadSubmissions = scans.filter((scan) => scan.contact_submitted).length;

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
    conversionByConcern: conversionByValue(
      scans,
      (scan) => scan.primary_concern,
    ),
    conversionByArchetype: conversionByValue(scans, (scan) => scan.archetype),
    recentScans: scans.slice(0, 12),
  };
}

function countSince(scans: AuditScanRow[], startDate: Date) {
  return scans.filter((scan) => new Date(scan.created_at) >= startDate).length;
}

function groupByValue(
  scans: AuditScanRow[],
  getValue: (scan: AuditScanRow) => string | null,
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
  getValue: (scan: AuditScanRow) => string | null,
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

function RecentScansTable({ scans }: { scans: AuditScanRow[] }) {
  if (scans.length === 0) {
    return <p className="text-sm text-muted">No scans yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-left text-sm">
        <thead className="border-b border-dark-border text-xs uppercase tracking-[0.16em] text-muted">
          <tr>
            <th className="px-3 py-3">Date</th>
            <th className="px-3 py-3">Domain</th>
            <th className="px-3 py-3">Score</th>
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
