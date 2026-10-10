import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Check, Circle, FileUp, LifeBuoy } from "lucide-react";
import {
  formatCurrency,
  getOrganizationBillingSummary,
} from "@/lib/customer-platform/billing";
import { customerGreeting } from "@/lib/customer-platform/greeting";
import {
  getOrganizationLaunchProgress,
  launchStageLabel,
  launchStages,
} from "@/lib/customer-platform/launch-progress";
import {
  documentCategoryLabel,
  listCustomerDocuments,
  listDocumentRequests,
} from "@/lib/customer-platform/documents";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function CustomerAppPage() {
  const context = await requireCustomerContext();
  const [launch, billing, documents, documentRequests] = await Promise.all([
    getOrganizationLaunchProgress(context.organization.id),
    getOrganizationBillingSummary({ organizationId: context.organization.id }),
    listCustomerDocuments({ organizationId: context.organization.id }),
    listDocumentRequests(context.organization.id),
  ]);
  const currentIndex = Math.max(
    0,
    launchStages.findIndex((stage) => stage.code === launch.status.current_stage),
  );
  const recentDocuments = documents.ok ? documents.data.slice(0, 3) : [];
  const openDocumentRequests = documentRequests.filter(
    (request) => request.status === "open",
  );
  const enabledTools = context.entitlements.filter(
    (entitlement) => entitlement.accessLevel !== "unavailable",
  );
  const preferredName =
    context.profile?.preferred_name ||
    context.profile?.first_name ||
    context.user.email.split("@")[0];

  return (
    <div className="grid gap-6 lg:gap-8">
      <section className="rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
          Business Hub
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-primary md:text-4xl">
          {customerGreeting({
            preferredName,
            timezone: context.organization.timezone,
          })}
        </h1>
        <p className="mt-3 text-xl font-semibold text-secondary">
          Welcome to {context.organization.name}.
        </p>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              My Website
            </p>
            <h2 className="mt-3 text-2xl font-extrabold text-primary">
              {launchStageLabel(launch.status.current_stage)}
            </h2>
          </div>
          <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 px-4 py-3 text-sm">
            <span className="font-bold text-primary">
              {launch.status.progress_percent}%
            </span>{" "}
            <span className="text-secondary">complete</span>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-dark-deep">
          <div
            className="h-full rounded-full bg-brand-cyan"
            style={{ width: `${launch.status.progress_percent}%` }}
          />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-lg border border-dark-border bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Latest Opzix update
            </p>
            <p className="mt-2 leading-7 text-secondary">
              {launch.status.latest_update ||
                "Opzix will post launch updates here as your platform moves forward."}
            </p>
          </div>
          <div className="rounded-lg border border-dark-border bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Next action
            </p>
            <p className="mt-2 leading-7 text-secondary">
              {launch.status.next_customer_action || "No action needed right now."}
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {launchStages.slice(0, 5).map((stage, index) => {
            const complete = index < currentIndex;
            const current = index === currentIndex;
            const Icon = complete ? Check : Circle;
            return (
              <div
                key={stage.code}
                className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                  current
                    ? "border-brand-cyan bg-brand-cyan/10 text-primary"
                    : "border-dark-border bg-white/[0.025] text-secondary"
                }`}
              >
                <Icon className="h-4 w-4 text-brand-cyan" />
                <span>{stage.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <OverviewCard title="Billing" href="/app/billing" action="View billing">
          <div className="mt-4 grid gap-3">
            <Metric label="Paid" value={formatCurrency(billing.totalPaid)} />
            <Metric
              label="Outstanding"
              value={formatCurrency(billing.outstandingBalance)}
            />
            <Metric
              label="Monthly"
              value={`${formatCurrency(billing.monthlySubscription)} / month`}
            />
          </div>
        </OverviewCard>

        <OverviewCard title="Documents" href="/app/documents" action="View all">
          {openDocumentRequests.length ? (
            <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              {openDocumentRequests.length} requested document
              {openDocumentRequests.length === 1 ? "" : "s"} need attention.
            </p>
          ) : (
            <p className="mt-4 text-sm text-secondary">
              No document requests are open right now.
            </p>
          )}
          {recentDocuments.length ? (
            <ul className="mt-4 space-y-2 text-sm text-secondary">
              {recentDocuments.map((document) => (
                <li key={document.id} className="truncate">
                  {document.title} · {documentCategoryLabel(document.category)}
                </li>
              ))}
            </ul>
          ) : null}
        </OverviewCard>

        <OverviewCard title="Support" href="/app/support" action="Contact support">
          <p className="mt-4 text-sm leading-6 text-secondary">
            Questions about billing, documents, launch timing, or your business
            tools can start here.
          </p>
        </OverviewCard>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Quick Actions</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/app/onboarding" label="View Onboarding" />
          <QuickAction href="/app/billing" label="View Billing" />
          <QuickAction href="/app/documents" label="Upload Document" icon="upload" />
          <QuickAction href="/app/support" label="Contact Support" icon="support" />
        </div>
      </section>

      <section className="rounded-xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Business Tools</h2>
        {enabledTools.length ? (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {enabledTools.slice(0, 6).map((tool) => (
              <div
                key={tool.featureCode}
                className="rounded-lg border border-dark-border bg-white/[0.025] p-4"
              >
                <p className="font-bold text-primary">{tool.featureName}</p>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  {tool.description || "Available in your Opzix plan."}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            Business tools will appear here as they become available for your
            account.
          </p>
        )}
      </section>
    </div>
  );
}

function OverviewCard({
  title,
  href,
  action,
  children,
}: {
  title: string;
  href: string;
  action: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-primary">{title}</h2>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-brand-cyan"
        >
          {action}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-secondary">{label}</span>
      <span className="font-bold text-primary">{value}</span>
    </div>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon?: "upload" | "support";
}) {
  const Icon = icon === "upload" ? FileUp : icon === "support" ? LifeBuoy : ArrowRight;
  return (
    <Link
      href={href}
      className="flex min-h-12 items-center justify-between gap-3 rounded-lg border border-dark-border bg-white/[0.025] px-4 text-sm font-semibold text-primary hover:border-brand-cyan"
    >
      {label}
      <Icon className="h-4 w-4 text-brand-cyan" />
    </Link>
  );
}
