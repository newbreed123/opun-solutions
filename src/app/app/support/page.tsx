import Link from "next/link";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function SupportPage() {
  const context = await requireCustomerContext();

  return (
    <section className="rounded-2xl border border-dark-border bg-dark-card p-6 md:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        Support
      </p>
      <h1 className="mt-3 text-3xl font-extrabold">Need help with onboarding?</h1>
      <p className="mt-3 max-w-3xl leading-7 text-secondary">
        Opzix can review setup questions, MLS/IDX approval items, integrations,
        and launch priorities for {context.organization.name}.
      </p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <SupportCard
          title="Onboarding Review"
          copy="Use this for incomplete fields, launch questions, or review status."
        />
        <SupportCard
          title="MLS/IDX"
          copy="Use this for MLS organization details, brokerage approval, or display requirements."
        />
        <SupportCard
          title="Plan & Features"
          copy="Use this for entitlement questions, feature overrides, or upgrade planning."
        />
      </div>
      <Link
        href="/book/strategy-session"
        className="btn btn-primary mt-8 min-h-12 w-full sm:w-auto"
      >
        Book a Strategy Session
      </Link>
    </section>
  );
}

function SupportCard({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-xl border border-dark-border bg-white/[0.035] p-5">
      <h2 className="text-lg font-bold text-primary">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-secondary">{copy}</p>
    </div>
  );
}
