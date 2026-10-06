import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminPasscodeForm } from "@/components/admin/AdminPasscodeForm";
import {
  isAdminAuthenticated,
  logoutAdminAction,
} from "@/lib/admin-auth";
import {
  createCustomerOnboarding,
  sendCustomerInvitation,
} from "@/lib/customer-platform/admin-invitations";
import { listCustomerAdminOrganizations } from "@/lib/customer-platform/admin-store";
import { supabaseAdminFetch } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type CustomersAdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomersAdminPage({
  searchParams,
}: CustomersAdminPageProps) {
  const params = (await searchParams) ?? {};
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

  const organizations = await listCustomerAdminOrganizations();
  const requestedId = stringParam(params.request);
  const requestId = isUuid(requestedId) ? requestedId : crypto.randomUUID();
  const createError = stringParam(params.error) === "create";

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            Customer Accounts
          </p>
          <h1 className="mt-3 text-4xl font-bold text-primary">
            Customer Management
          </h1>
        </div>
        <p className="rounded-full border border-dark-border bg-white/[0.04] px-4 py-2 text-sm font-semibold text-secondary">
          {organizations.data.length} organization
          {organizations.data.length === 1 ? "" : "s"}
        </p>
      </div>

      <section className="mb-8 rounded-2xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Onboard a customer</h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Enter the customer and commercial details. Opzix creates their
          organization and sends a secure account setup invitation.
        </p>
        {createError ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100"
          >
            Customer creation did not complete. The request is safe to retry
            using the same form.
          </p>
        ) : null}
        <form
          action={createCustomerAction}
          className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <input type="hidden" name="request_id" value={requestId} />
          <Field name="customer_name" label="Customer Name" required />
          <Field name="business_name" label="Business Name" required />
          <Field name="email" label="Customer Email" type="email" required />
          <SelectField name="organization_type" label="Account Type">
            <option value="agent">Agent</option>
            <option value="team">Team</option>
            <option value="brokerage">Brokerage</option>
            <option value="other">Other</option>
          </SelectField>
          <SelectField name="plan_code" label="Plan">
            <option value="launch">Launch</option>
            <option value="growth">Growth</option>
            <option value="performance">Performance</option>
            <option value="brokerage">Brokerage</option>
            <option value="custom">Custom</option>
          </SelectField>
          <Field
            name="setup_fee"
            label="Setup Fee (USD)"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            required
          />
          <Field
            name="monthly_subscription"
            label="Monthly Subscription (USD)"
            type="number"
            min="0"
            step="0.01"
            defaultValue="0"
            required
          />
          <div className="flex items-end">
            <button type="submit" className="btn btn-primary min-h-11 w-full">
              Send Onboarding Invite
            </button>
          </div>
        </form>
      </section>

      {!organizations.ok ? (
        <div
          role="alert"
          className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100"
        >
          {organizations.error}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-dark-border bg-dark-card">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead className="border-b border-dark-border bg-white/[0.035] text-xs uppercase tracking-[0.16em] text-muted">
              <tr>
                <th className="px-4 py-3">Organization</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Onboarding</th>
                <th className="px-4 py-3">Invite Status</th>
                <th className="px-4 py-3">Last Activity</th>
                <th className="px-4 py-3">Action</th>
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
                    {summary.isQa ? (
                      <span className="mt-1 inline-flex rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-xs font-semibold text-amber-100">
                        QA / Test
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.customerName}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.plan?.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {formatMoney(summary.terms?.monthly_subscription)}
                    <span className="block text-xs text-muted">per month</span>
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.onboarding?.completion_percent ?? 0}% -{" "}
                    {summary.onboarding?.status ?? "not_started"}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {inviteStatus(summary.invitation?.invitation_state)}
                  </td>
                  <td className="px-4 py-4 text-secondary">
                    {summary.lastActivity
                      ? formatDate(summary.lastActivity.created_at)
                      : "No activity"}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/opzix-admin/customers/${summary.organization.id}`}
                      className="font-semibold text-brand-cyan hover:underline"
                    >
                      View Customer
                    </Link>
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

async function createCustomerAction(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }

  const requestId = stringField(formData, "request_id");
  const customerName = stringField(formData, "customer_name");
  const businessName = stringField(formData, "business_name");
  const email = stringField(formData, "email").toLowerCase();
  const organizationType = stringField(formData, "organization_type");
  const planCode = stringField(formData, "plan_code");
  const setupFee = parseMoney(stringField(formData, "setup_fee"));
  const monthlySubscription = parseMoney(
    stringField(formData, "monthly_subscription"),
  );

  if (
    !isUuid(requestId) ||
    customerName.length < 2 ||
    customerName.length > 160 ||
    businessName.length < 2 ||
    businessName.length > 160 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !["agent", "team", "brokerage", "other"].includes(organizationType) ||
    !["launch", "growth", "performance", "brokerage", "custom"].includes(
      planCode,
    ) ||
    setupFee === null ||
    monthlySubscription === null
  ) {
    const safeRequestId = isUuid(requestId) ? requestId : crypto.randomUUID();
    redirect(
      `/opzix-admin/customers?error=create&request=${encodeURIComponent(safeRequestId)}`,
    );
  }

  const created = await createCustomerOnboarding({
    requestId,
    customerName,
    businessName,
    email,
    organizationType,
    planCode,
    setupFee,
    monthlySubscription,
  });
  if (!created.ok) {
    console.error("Customer onboarding record creation failed.", {
      error: created.error,
    });
    redirect(
      `/opzix-admin/customers?error=create&request=${encodeURIComponent(requestId)}`,
    );
  }

  const invitation = await sendCustomerInvitation(created.invitationId);
  revalidatePath("/opzix-admin/customers");
  revalidatePath(`/opzix-admin/customers/${created.organizationId}`);
  redirect(
    `/opzix-admin/customers/${created.organizationId}?invite=${invitation.ok ? "sent" : "failed"}`,
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
  required = false,
  defaultValue,
  min,
  step,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  min?: string;
  step?: string;
}) {
  return (
    <label className="text-sm font-semibold text-secondary">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        step={step}
        defaultValue={defaultValue}
        className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none placeholder:text-muted focus:border-brand-cyan"
      />
    </label>
  );
}

function SelectField({
  name,
  label,
  children,
}: {
  name: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="text-sm font-semibold text-secondary">
      {label}
      <select
        name={name}
        className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
      >
        {children}
      </select>
    </label>
  );
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseMoney(value: string) {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function inviteStatus(
  state: string | undefined,
) {
  switch (state) {
    case "draft":
      return "Draft";
    case "invite_pending":
      return "Sending";
    case "invited":
      return "Invite sent";
    case "activated":
      return "Activated";
    case "invite_failed":
      return "Invite failed";
    default:
      return "Not invited";
  }
}

function formatMoney(value: number | undefined) {
  if (value === undefined) return "Not set";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}
