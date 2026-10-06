import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminPasscodeForm } from "@/components/admin/AdminPasscodeForm";
import {
  isAdminAuthenticated,
  logoutAdminAction,
} from "@/lib/admin-auth";
import {
  listCustomerOrganizations,
} from "@/lib/customer-platform/store";
import { supabaseAdminFetch } from "@/lib/supabase-admin";
import type { OrganizationRow, PlanCode, PlanRow } from "@/lib/customer-platform/types";

export const dynamic = "force-dynamic";

type CustomersAdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersAdminPage() {
  const configuredPasscode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const isAuthenticated = await isAdminAuthenticated();

  if (!configuredPasscode) {
    return (
      <AdminShell showLogout={false}>
        <LockedState
          title="Customer admin is not configured"
          message="Set OPZIX_ADMIN_PASSCODE before viewing customer accounts."
        />
      </AdminShell>
    );
  }

  if (!isAuthenticated) {
    return (
      <AdminShell showLogout={false}>
        <LockedState />
      </AdminShell>
    );
  }

  const organizations = await listCustomerOrganizations();

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Customer Accounts
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary">
            Opzix Customer Hub
          </h1>
          <p className="mt-3 max-w-3xl leading-relaxed text-secondary">
            Focused customer/account management for subscriptions, onboarding,
            plan assignment, and review status. This stays separate from the
            Founder Dashboard.
          </p>
        </div>
        <p className="rounded-full border border-dark-border bg-white/[0.04] px-4 py-2 text-sm font-semibold text-secondary">
          {organizations.data.length} organization
          {organizations.data.length === 1 ? "" : "s"}
        </p>
      </div>

      <section className="mb-8 rounded-2xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">
          Create assisted onboarding record
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          This creates the organization, assigned plan, onboarding shell, and
          invitation audit record. Email delivery through Supabase Auth should
          be connected before production invite sending.
        </p>
        <form action={createAssistedOnboardingAction} className="mt-5 grid gap-4 lg:grid-cols-6">
          <Field name="organization_name" label="Organization" />
          <Field name="slug" label="Slug" />
          <Field name="email" label="Customer email" type="email" />
          <label className="text-sm font-semibold text-secondary">
            Type
            <select
              name="organization_type"
              className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
            >
              <option value="agent">Agent</option>
              <option value="team">Team</option>
              <option value="brokerage">Brokerage</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm font-semibold text-secondary">
            Plan
            <select
              name="plan_code"
              className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
            >
              <option value="launch">Launch</option>
              <option value="growth">Growth</option>
              <option value="performance">Performance</option>
              <option value="brokerage">Brokerage</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary min-h-11 w-full">
              Create
            </button>
          </div>
        </form>
      </section>

      {!organizations.ok ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100">
          {organizations.error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-card">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead className="border-b border-dark-border bg-white/[0.035] text-xs uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Onboarding</th>
                <th className="px-4 py-3">Members</th>
                <th className="px-4 py-3">Timezone</th>
              </tr>
            </thead>
            <tbody>
              {organizations.data.map((summary) => (
                <tr
                  key={summary.organization.id}
                  className="border-b border-dark-border/70 align-top"
                >
                  <td className="px-4 py-4">
                    <p className="font-bold text-primary">
                      {summary.organization.name}
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted">
                      {summary.organization.slug}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.organization.organization_type}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.plan?.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.organization.status}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.onboarding?.completion_percent ?? 0}% -{" "}
                    {summary.onboarding?.status ?? "not_started"}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.activeMembers}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.organization.timezone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

async function createAssistedOnboardingAction(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }

  const name = stringField(formData, "organization_name");
  const email = stringField(formData, "email");
  const slug = slugify(stringField(formData, "slug") || name);
  const organizationType = stringField(formData, "organization_type") || "agent";
  const planCode = (stringField(formData, "plan_code") || "launch") as PlanCode;

  if (!name || !email || !slug) {
    redirect("/opzix-admin/customers");
  }

  const plan = await supabaseAdminFetch<PlanRow[]>("plans", {
    query: { select: "id,code,name,status", code: `eq.${planCode}`, limit: 1 },
  });
  const planRow = plan.ok ? plan.data[0] : null;
  if (!planRow) {
    throw new Error("Plan assignment failed because the plan code was not found.");
  }

  const organizationResult = await supabaseAdminFetch<OrganizationRow[]>(
    "organizations",
    {
      method: "POST",
      body: {
        name,
        slug,
        organization_type: organizationType,
        status: "onboarding",
      },
      prefer: "return=representation",
    },
  );
  if (!organizationResult.ok || !organizationResult.data[0]) {
    throw new Error(organizationResult.ok ? "Organization was not returned." : organizationResult.error);
  }
  const organization = organizationResult.data[0];

  await supabaseAdminFetch<null>("organization_subscriptions", {
    method: "POST",
    body: {
      organization_id: organization.id,
      plan_id: planRow.id,
      status: "active",
    },
    prefer: "returning=minimal",
  });

  await supabaseAdminFetch<null>("organization_onboarding", {
    method: "POST",
    body: {
      organization_id: organization.id,
      current_step: "account",
      completion_percent: 0,
      status: "not_started",
    },
    prefer: "returning=minimal",
  });

  await supabaseAdminFetch<null>("organization_invitations", {
    method: "POST",
    body: {
      organization_id: organization.id,
      email,
      role: "owner",
      plan_code: planCode,
      status: "pending",
      metadata: { source: "opzix-admin/customers" },
    },
    prefer: "returning=minimal",
  });

  await supabaseAdminFetch<null>("customer_account_audit_events", {
    method: "POST",
    body: {
      organization_id: organization.id,
      event_name: "customer_invited",
      target_type: "organization_invitation",
      metadata: { email, planCode },
    },
    prefer: "returning=minimal",
  });

  revalidatePath("/opzix-admin/customers");
  redirect("/opzix-admin/customers");
}

function AdminShell({
  children,
  showLogout = true,
}: {
  children: ReactNode;
  showLogout?: boolean;
}) {
  return (
    <main className="min-h-screen bg-dark px-4 py-6 text-primary">
      <header className="mx-auto mb-6 flex max-w-7xl items-center justify-between rounded-2xl border border-dark-border bg-dark-card px-5 py-4">
        <div>
          <p className="text-lg font-black tracking-[0.22em] text-primary">OPZIX</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-cyan">
            Admin
          </p>
        </div>
        {showLogout ? (
          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="rounded-full border border-dark-border bg-white/[0.04] px-3 py-2 text-sm font-semibold text-secondary transition hover:border-brand-cyan hover:text-primary"
            >
              Logout
            </button>
          </form>
        ) : null}
      </header>
      {children}
    </main>
  );
}

function LockedState({
  title = "Customer Management",
  message = "Enter the internal passcode to view customer accounts.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
        OPZIX ADMIN
      </p>
      <h1 className="mt-3 text-3xl font-bold text-primary">{title}</h1>
      <p className="mt-3 text-secondary">{message}</p>
      <AdminPasscodeForm
        title="Internal Passcode"
        description="Enter the internal passcode to view customer accounts."
        submitLabel="Continue"
      />
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <label className="text-sm font-semibold text-secondary">
      {label}
      <input
        name={name}
        type={type}
        className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
      />
    </label>
  );
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}
