import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const context = await requireCustomerContext();
  const profile = context.profile;

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Account
      </p>
      <h1 className="mt-3 text-3xl font-extrabold">Account Settings</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Info label="Email" value={context.user.email} />
        <Info label="Preferred name" value={profile?.preferred_name} />
        <Info label="First name" value={profile?.first_name} />
        <Info label="Last name" value={profile?.last_name} />
        <Info label="Phone" value={profile?.phone} />
        <Info label="Timezone" value={profile?.timezone || context.organization.timezone} />
      </div>
      <p className="mt-6 text-sm leading-6 text-secondary">
        Profile editing is intentionally limited in this foundation sprint.
        Onboarding captures changes first so Opzix can review account and
        organization details before launch.
      </p>
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
