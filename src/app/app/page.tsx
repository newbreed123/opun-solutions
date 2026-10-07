import Link from "next/link";
import { Check, Circle } from "lucide-react";
import {
  getOrganizationLaunchProgress,
  launchStageLabel,
  launchStages,
} from "@/lib/customer-platform/launch-progress";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function CustomerAppPage() {
  const context = await requireCustomerContext();
  const launch = await getOrganizationLaunchProgress(context.organization.id);
  const currentIndex = Math.max(
    0,
    launchStages.findIndex((stage) => stage.code === launch.status.current_stage),
  );

  return (
    <div className="grid gap-6 lg:gap-8">
      <section className="rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
          Your Website Launch
        </p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold text-primary">
                {launch.status.progress_percent}%
              </span>
              <span className="pb-2 text-sm font-semibold text-secondary">
                {launchStageLabel(launch.status.current_stage)}
              </span>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-dark-deep">
              <div
                className="h-full rounded-full bg-brand-cyan"
                style={{ width: `${launch.status.progress_percent}%` }}
              />
            </div>
            {launch.status.estimated_launch_window ? (
              <p className="mt-4 text-sm text-secondary">
                Estimated launch window:{" "}
                <span className="font-semibold text-primary">
                  {launch.status.estimated_launch_window}
                </span>
              </p>
            ) : null}
          </div>
          <div className="grid gap-3">
            {launchStages.map((stage, index) => {
              const complete = index < currentIndex;
              const current = index === currentIndex;
              const Icon = complete ? Check : Circle;
              return (
                <div
                  key={stage.code}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${
                    current
                      ? "border-brand-cyan bg-brand-cyan/10 text-primary"
                      : "border-dark-border bg-white/[0.025] text-secondary"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      complete || current ? "text-brand-cyan" : "text-muted"
                    }`}
                  />
                  <span>{stage.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-dark-border bg-dark-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Latest Update From Opzix
          </p>
          <p className="mt-3 leading-7 text-secondary">
            {launch.status.latest_update ||
              "Opzix will post launch updates here as your platform moves forward."}
          </p>
          <p className="mt-3 text-xs text-muted">
            Updated {formatDate(launch.status.updated_at)}
          </p>
        </div>
        <div className="rounded-xl border border-dark-border bg-dark-card p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-cyan">
            Next From You
          </p>
          <p className="mt-3 leading-7 text-secondary">
            {launch.status.next_customer_action || "No action needed right now."}
          </p>
          <Link
            href="/app/onboarding"
            className="mt-4 inline-flex text-sm font-semibold text-brand-cyan"
          >
            View onboarding
          </Link>
        </div>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "not yet";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
