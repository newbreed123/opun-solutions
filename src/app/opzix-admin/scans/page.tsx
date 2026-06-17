import { listAuditScans, type AuditScanRow } from "@/lib/audit-scan-log";
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

type AdminScansPageProps = {
  searchParams?: SearchParams;
};

export default async function AdminScansPage({
  searchParams,
}: AdminScansPageProps) {
  const params = (await searchParams) ?? {};
  const passcode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const providedPasscode = getParam(params, "passcode");

  if (!passcode) {
    return (
      <AdminShell>
        <LockedState
          title="Admin scans are not configured"
          message="Set OPZIX_ADMIN_PASSCODE before this page can show internal scan data."
        />
      </AdminShell>
    );
  }

  if (providedPasscode !== passcode) {
    return (
      <AdminShell>
        <LockedState
          title="Passcode required"
          message="Enter the internal passcode to view audit scans."
        />
      </AdminShell>
    );
  }

  const contacted = normalizeContactedFilter(getParam(params, "contacted"));
  const status = getParam(params, "status");
  const primaryConcern = getParam(params, "primaryConcern");
  const scans = await listAuditScans({
    contacted,
    status,
    primaryConcern,
  });
  const scoreStabilityByDomain = buildScoreStabilityByDomain(scans.data);

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Internal
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary">
            Opzix Audit Scans
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
            Recent internal scan logs, filtered for lead follow-up review.
          </p>
        </div>
        <p className="rounded-full border border-dark-border bg-white/[0.04] px-4 py-2 text-sm font-semibold text-secondary">
          {scans.data.length} scan{scans.data.length === 1 ? "" : "s"}
        </p>
      </div>

      <form className="mb-8 grid gap-4 rounded-2xl border border-dark-border bg-dark-card p-4 md:grid-cols-4">
        <input type="hidden" name="passcode" value={providedPasscode} />
        <label className="text-sm font-semibold text-secondary">
          Contacted
          <select
            name="contacted"
            defaultValue={contacted ?? ""}
            className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
          >
            <option value="">All</option>
            <option value="yes">Contacted</option>
            <option value="no">Not contacted</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
          >
            <option value="">All</option>
            <option value="High Priority">High Priority</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Healthy">Healthy</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-secondary">
          Primary concern
          <input
            name="primaryConcern"
            defaultValue={primaryConcern}
            placeholder="Exact title"
            className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
          />
        </label>
        <div className="flex items-end">
          <button type="submit" className="btn btn-primary min-h-11 w-full">
            Apply Filters
          </button>
        </div>
      </form>

      {!scans.ok ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100">
          {scans.error}
        </div>
      ) : scans.data.length === 0 ? (
        <div className="rounded-2xl border border-dark-border bg-dark-card p-8 text-secondary">
          No scans match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-card">
          <table className="w-full min-w-[1680px] border-collapse text-left text-sm">
            <thead className="border-b border-dark-border bg-white/[0.035] text-xs uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">URL</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Score Stability</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Primary concern</th>
                <th className="px-4 py-3">Roadmap</th>
                <th className="px-4 py-3">Archetype</th>
                <th className="px-4 py-3">Industry</th>
                <th className="px-4 py-3">Platform</th>
                <th className="px-4 py-3">Site type</th>
                <th className="px-4 py-3">Site confidence</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Checkout</th>
                <th className="px-4 py-3">Mobile</th>
                <th className="px-4 py-3">Contacted</th>
              </tr>
            </thead>
            <tbody>
              {scans.data.map((scan) => (
                <ScanRow
                  key={scan.id}
                  scan={scan}
                  scoreStability={scoreStabilityByDomain.get(domainForScan(scan))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-dark-bg py-10">
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
          View Scans
        </button>
      </form>
    </div>
  );
}

function ScanRow({
  scan,
  scoreStability,
}: {
  scan: AuditScanRow;
  scoreStability: ScoreStabilitySummary | undefined;
}) {
  return (
    <tr className="border-b border-dark-border last:border-b-0">
      <td className="px-4 py-4 align-top text-secondary">
        {formatDate(scan.created_at)}
      </td>
      <td className="max-w-xs px-4 py-4 align-top">
        <p className="break-all font-semibold text-primary">{scan.url}</p>
        <p className="mt-1 text-xs text-muted">{scan.normalized_domain}</p>
      </td>
      <td className="px-4 py-4 align-top text-primary">{scan.score}</td>
      <td className="px-4 py-4 align-top">
        <ScoreStabilityCell summary={scoreStability} />
      </td>
      <td className="px-4 py-4 align-top text-secondary">{scan.status}</td>
      <td className="max-w-xs px-4 py-4 align-top text-secondary">
        {scan.primary_concern}
      </td>
      <td className="max-w-xs px-4 py-4 align-top">
        <RoadmapSummary value={scan.recommendation_roadmap} />
      </td>
      <td className="px-4 py-4 align-top">
        <DataBadge value={scan.archetype} />
      </td>
      <td className="px-4 py-4 align-top">
        <DataBadge value={scan.industry} />
      </td>
      <td className="px-4 py-4 align-top">
        <DataBadge value={scan.platform} />
      </td>
      <td className="px-4 py-4 align-top">
        <DataBadge value={scan.site_type} />
      </td>
      <td className="px-4 py-4 align-top">
        <DataBadge value={scan.site_type_confidence_label} />
      </td>
      <td className="px-4 py-4 align-top">
        <ReadinessBadge value={scan.tracking_readiness} />
      </td>
      <td className="px-4 py-4 align-top">
        <ReadinessBadge value={scan.checkout_readiness} />
      </td>
      <td className="px-4 py-4 align-top">
        <ReadinessBadge value={scan.mobile_readiness} />
      </td>
      <td className="px-4 py-4 align-top">
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${
            scan.contact_submitted
              ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
              : "border-amber-300/30 bg-amber-400/10 text-amber-100"
          }`}
        >
          {scan.contact_submitted ? "Yes" : "No"}
        </span>
      </td>
    </tr>
  );
}

function DataBadge({ value }: { value: string | null }) {
  return (
    <span className="inline-flex max-w-[13rem] rounded-full border border-dark-border bg-white/[0.04] px-3 py-1 text-xs font-semibold text-secondary">
      <span className="truncate">{value || "unknown"}</span>
    </span>
  );
}

function RoadmapSummary({ value }: { value: unknown }) {
  const roadmap = isRecord(value) ? value : {};
  const steps = Array.isArray(roadmap.steps) ? roadmap.steps : [];
  const firstStep = isRecord(steps[0])
    ? steps[0]
    : isRecord(roadmap.step1)
      ? roadmap.step1
      : null;

  if (!firstStep) {
    return <span className="text-xs text-muted">Not logged</span>;
  }

  const title = stringValue(firstStep.title) || "Roadmap step";
  const cost = stringValue(firstStep.cost);
  const timeline = stringValue(firstStep.timeline);

  return (
    <div className="space-y-1">
      <p className="font-semibold leading-snug text-primary">{title}</p>
      <p className="text-xs text-muted">
        {[cost, timeline].filter(Boolean).join(" / ") || "Cost/timeline pending"}
      </p>
    </div>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function ReadinessBadge({ value }: { value: string | null }) {
  const label = value || "unknown";
  const tone =
    label === "strong" || label === "ready" || label === "visible"
      ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-100"
      : label === "limited" || label === "crowded" || label === "high-priority"
        ? "border-red-300/30 bg-red-400/10 text-red-100"
        : "border-amber-300/30 bg-amber-400/10 text-amber-100";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] ${tone}`}
    >
      {label}
    </span>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function normalizeContactedFilter(value: string) {
  return value === "yes" || value === "no" ? value : undefined;
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
