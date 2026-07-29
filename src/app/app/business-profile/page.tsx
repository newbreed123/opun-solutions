import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function BusinessProfilePage() {
  const context = await requireCustomerContext();
  const businessData = context.onboardingData.find(
    (row) => row.section === "business",
  )?.data_json;

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Business Profile
      </p>
      <h1 className="mt-3 text-3xl font-extrabold">
        {context.organization.name}
      </h1>
      <p className="mt-3 max-w-3xl leading-7 text-secondary">
        This is the organization profile attached to the subscribed platform
        account. The business onboarding step is the source of truth during
        launch review.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Info label="Organization type" value={context.organization.organization_type} />
        <Info label="Status" value={context.organization.status} />
        <Info label="Timezone" value={context.organization.timezone} />
        <Info label="Primary market" value={stringValue(businessData?.primary_market)} />
        <Info label="Brokerage" value={stringValue(businessData?.brokerage_name)} />
        <Info label="Current CRM" value={stringValue(businessData?.current_crm)} />
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-xl border border-dark-border bg-white/[0.035] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
        {label}
      </p>
      <p className="mt-2 text-sm text-primary">{value || "Not provided"}</p>
    </div>
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}
