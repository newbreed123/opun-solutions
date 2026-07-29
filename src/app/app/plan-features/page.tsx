import { Check, Lock, SlidersHorizontal } from "lucide-react";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function PlanFeaturesPage() {
  const context = await requireCustomerContext();
  const grouped = groupEntitlements(context.entitlements);

  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border border-dark-border bg-dark-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
          Plan & Features
        </p>
        <h1 className="mt-3 text-3xl font-extrabold">
          {context.plan?.name ?? "Unassigned"} Plan
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Entitlements are resolved server-side from the assigned plan plus any
          organization-specific overrides. Components should use feature access
          data from this layer instead of hardcoding plan checks.
        </p>
      </section>

      {Object.entries(grouped).map(([category, entitlements]) => (
        <section
          key={category}
          className="rounded-2xl border border-dark-border bg-dark-card p-6"
        >
          <h2 className="text-xl font-bold capitalize text-primary">{category}</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {entitlements.map((entitlement) => {
              const available = entitlement.accessLevel !== "unavailable";
              const Icon =
                entitlement.source === "override"
                  ? SlidersHorizontal
                  : available
                    ? Check
                    : Lock;

              return (
                <div
                  key={entitlement.featureCode}
                  className="rounded-xl border border-dark-border bg-white/[0.035] p-4"
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`mt-0.5 h-5 w-5 ${
                        available ? "text-brand-cyan" : "text-muted"
                      }`}
                    />
                    <div>
                      <h3 className="font-bold text-primary">
                        {entitlement.featureName}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-secondary">
                        {entitlement.description || entitlement.featureCode}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
                        {entitlement.accessLevel.replaceAll("_", " ")}
                        {entitlement.source === "override" ? " - override" : ""}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupEntitlements(
  entitlements: Awaited<ReturnType<typeof requireCustomerContext>>["entitlements"],
) {
  return entitlements.reduce<Record<string, typeof entitlements>>(
    (groups, entitlement) => {
      const key = entitlement.category || "platform";
      groups[key] = groups[key] ?? [];
      groups[key].push(entitlement);
      return groups;
    },
    {},
  );
}
