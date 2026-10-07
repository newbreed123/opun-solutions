import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminPasscodeForm } from "@/components/admin/AdminPasscodeForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { sendCustomerInvitation } from "@/lib/customer-platform/admin-invitations";
import { getCustomerAdminDetail } from "@/lib/customer-platform/admin-store";
import { supabaseAdminFetch, supabaseAdminRpc } from "@/lib/supabase-admin";
import type {
  CustomerInvitationRow,
  FeatureRow,
} from "@/lib/customer-platform/types";

export const dynamic = "force-dynamic";

type CustomerDetailPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const { organizationId } = await params;
  const query = (await searchParams) ?? {};
  const configuredPasscode = process.env.OPZIX_ADMIN_PASSCODE?.trim();
  const authenticated = await isAdminAuthenticated();

  if (!configuredPasscode || !authenticated) {
    return (
      <AdminShell showLogout={false}>
        <div className="mx-auto max-w-xl rounded-2xl border border-dark-border bg-dark-card p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
            OPZIX ADMIN
          </p>
          <h1 className="mt-3 text-3xl font-bold text-primary">
            Customer Management
          </h1>
          <p className="mt-3 text-secondary">
            Enter the internal passcode to view customer accounts.
          </p>
          <AdminPasscodeForm
            title="Internal Passcode"
            description="Enter the internal passcode to view customer accounts."
            submitLabel="Continue"
          />
        </div>
      </AdminShell>
    );
  }

  if (!isUuid(organizationId)) notFound();
  const customer = await getCustomerAdminDetail(organizationId);
  if (!customer) notFound();

  const invitation = customer.invitation;
  const displayName = customer.customerName;
  const inviteNotice = stringParam(query.invite);
  const pageError = stringParam(query.error);
  const mlsStatus =
    customer.mlsData && Object.keys(customer.mlsData).length > 0
      ? "Details submitted"
      : "Not started";
  const launchStatus =
    customer.organization.status === "active"
      ? "Launched"
      : customer.organization.status === "archived"
        ? "Archived"
        : customer.organization.status === "suspended"
          ? "Suspended"
          : "Not launched";

  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl">
        <Link
          href="/opzix-admin/customers"
          className="text-sm font-semibold text-brand-cyan hover:underline"
        >
          ← Customer Management
        </Link>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">
              Customer detail
            </p>
            <h1 className="mt-2 text-3xl font-bold text-primary">
              {customer.organization.name}
            </h1>
            <p className="mt-2 text-secondary">{displayName}</p>
            {customer.isQa ? (
              <span className="mt-3 inline-flex rounded-full border border-amber-300/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-100">
                QA / Test account
              </span>
            ) : null}
          </div>
          <a
            href="#onboarding"
            className="rounded-full border border-dark-border px-4 py-2 text-sm font-semibold text-secondary hover:border-brand-cyan hover:text-primary"
          >
            View Onboarding
          </a>
        </div>

        {inviteNotice === "failed" ? (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-amber-300/35 bg-amber-400/10 p-4 text-amber-100"
          >
            <p className="font-bold">
              Customer created — invitation failed.
            </p>
            <p className="mt-1 text-sm">
              The organization and onboarding records are preserved. Retry the
              invitation without creating another customer.
            </p>
          </div>
        ) : inviteNotice === "sent" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-emerald-100">
            Onboarding invitation sent.
          </p>
        ) : null}
        {pageError ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100"
          >
            The requested customer action could not be completed. Review the
            record and try again.
          </p>
        ) : null}

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DetailCard title="Customer" value={displayName}>
            <p>{invitation?.email ?? "No invitation email"}</p>
          </DetailCard>
          <DetailCard
            title="Organization"
            value={customer.organization.name}
          >
            <p>Account type: {customer.organization.organization_type}</p>
          </DetailCard>
          <DetailCard title="Plan" value={customer.plan?.name ?? "Unassigned"}>
            <p>Plan controls features separately from commercial terms.</p>
          </DetailCard>
          <DetailCard
            title="Commercial terms"
            value={`${formatMoney(customer.terms?.monthly_subscription)} / month`}
          >
            <p>Setup fee: {formatMoney(customer.terms?.setup_fee)}</p>
          </DetailCard>
          <DetailCard
            title="Invitation status"
            value={inviteLabel(invitation?.invitation_state)}
          >
            <p>
              {invitation?.invited_at
                ? `Last sent ${formatDate(invitation.invited_at)}`
                : "No invite has been sent"}
            </p>
            {invitation?.invitation_state === "invite_failed" ? (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-amber-300/25 bg-amber-400/[0.06] p-3 text-sm text-amber-100"
              >
                <p className="font-bold">Invitation failed</p>
                {invitation.auth_user_id ? (
                  <p className="mt-1">
                    An Auth account already exists for this email.
                  </p>
                ) : null}
                <p className="mt-2 font-semibold">Reason</p>
                <p>{invitationFailureReason(invitation.last_error)}</p>
              </div>
            ) : null}
          </DetailCard>
          <DetailCard
            title="Onboarding progress"
            value={`${customer.onboarding?.completion_percent ?? 0}%`}
          >
            <p>
              {customer.onboarding?.status ?? "not_started"} ·{" "}
              {customer.onboarding?.current_step ?? "account"}
            </p>
          </DetailCard>
          <DetailCard title="MLS / IDX status" value={mlsStatus}>
            <p>Subject to applicable MLS and brokerage review.</p>
          </DetailCard>
          <DetailCard title="Platform launch status" value={launchStatus}>
            <p>Organization status: {customer.organization.status}</p>
          </DetailCard>
          <DetailCard
            title="Created"
            value={formatDate(customer.organization.created_at)}
          >
            <p>
              Last activity:{" "}
              {customer.lastActivity
                ? formatDate(customer.lastActivity.created_at)
                : "No activity"}
            </p>
          </DetailCard>
        </section>

        {invitation && customer.organization.status !== "archived" ? (
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h2 className="text-lg font-bold text-primary">
                Invitation actions
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Invitation links are delivered to the customer's email only.
                They are never shown here.
              </p>
              {invitation.invitation_state !== "activated" ? (
                <form action={resendInviteAction} className="mt-4">
                  <input
                    type="hidden"
                    name="invitation_id"
                    value={invitation.id}
                  />
                  <button type="submit" className="btn btn-primary min-h-11">
                    {invitation.auth_user_id
                      ? "Send Account Setup Link"
                      : "Retry Invitation"}
                  </button>
                </form>
              ) : (
                <p className="mt-4 text-sm font-semibold text-emerald-200">
                  Account activated
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-dark-border bg-dark-card p-5">
              <h2 className="text-lg font-bold text-primary">
                Edit commercial terms
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Pricing is stored independently and does not grant feature
                access.
              </p>
              <form action={editTermsAction} className="mt-4 grid gap-4 sm:grid-cols-2">
                <input
                  type="hidden"
                  name="invitation_id"
                  value={invitation.id}
                />
                <MoneyField
                  name="setup_fee"
                  label="Setup Fee (USD)"
                  value={customer.terms?.setup_fee ?? 0}
                />
                <MoneyField
                  name="monthly_subscription"
                  label="Monthly Subscription (USD)"
                  value={customer.terms?.monthly_subscription ?? 0}
                />
                <button type="submit" className="btn btn-primary min-h-11 sm:col-span-2">
                  Save Commercial Terms
                </button>
              </form>
            </section>
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-5">
          <div>
            <h2 className="text-xl font-bold text-primary">
              Feature entitlements
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              These settings are independent of the selected plan and negotiated
              subscription amount.
            </p>
          </div>
          {invitation && customer.organization.status !== "archived" ? (
            <form action={saveFeatureAccessAction} className="mt-5">
              <input
                type="hidden"
                name="invitation_id"
                value={invitation.id}
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {customer.features.map((feature) => (
                  <label
                    key={feature.id}
                    className="flex items-start gap-3 rounded-xl border border-dark-border bg-white/[0.025] p-3"
                  >
                    <input
                      type="checkbox"
                      name="enabled_feature_codes"
                      value={feature.code}
                      defaultChecked={feature.enabled}
                      className="mt-1 accent-cyan-400"
                    />
                    <span>
                      <span className="block font-semibold text-primary">
                        {feature.name}
                      </span>
                      <span className="mt-1 block text-xs text-secondary">
                        {feature.description}
                      </span>
                      <span className="mt-1 block text-[11px] uppercase tracking-wide text-muted">
                        {feature.enabled ? "Enabled" : "Unavailable"} ·{" "}
                        {feature.source}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
              <button type="submit" className="btn btn-primary mt-5 min-h-11">
                Save Feature Access
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-secondary">
              {customer.organization.status === "archived"
                ? "Archived organizations are read-only in Customer Hub."
                : "A customer invitation is required before customer-specific access can be assigned."}
            </p>
          )}
        </section>

        <section
          id="onboarding"
          className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-5"
        >
          <h2 className="text-xl font-bold text-primary">Onboarding</h2>
          <p className="mt-2 text-sm text-secondary">
            Current step: {customer.onboarding?.current_step ?? "account"} ·
            Status: {customer.onboarding?.status ?? "not_started"} · Completion:{" "}
            {customer.onboarding?.completion_percent ?? 0}%
          </p>
          <h3 className="mt-5 text-sm font-bold text-primary">
            Recent activity
          </h3>
          {customer.recentActivity.length ? (
            <ul className="mt-2 divide-y divide-dark-border">
              {customer.recentActivity.map((event, index) => (
                <li
                  key={`${event.event_name}-${event.created_at}-${index}`}
                  className="flex flex-wrap justify-between gap-2 py-3 text-sm"
                >
                  <span className="text-secondary">
                    {event.event_name.replaceAll("_", " ")}
                  </span>
                  <time className="text-muted">
                    {formatDateTime(event.created_at)}
                  </time>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No activity recorded.</p>
          )}
        </section>

        {customer.isQa && customer.organization.status !== "archived" ? (
          <section className="mt-8 rounded-2xl border border-amber-300/25 bg-amber-400/[0.04] p-5">
            <h2 className="text-lg font-bold text-primary">
              QA / test account controls
            </h2>
            <p className="mt-2 text-sm text-secondary">
              Archive suspends memberships and blocks customer access without
              deleting customer or audit data.
            </p>
            <form action={archiveQaCustomerAction} className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="hidden"
                name="organization_id"
                value={customer.organization.id}
              />
              <label className="flex items-center gap-2 text-sm text-secondary">
                <input type="checkbox" name="confirm_archive" value="yes" required />
                I confirm this QA organization should be archived.
              </label>
              <button
                type="submit"
                className="rounded-full border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/10"
              >
                Archive QA Organization
              </button>
            </form>
          </section>
        ) : null}

        <p className="mb-8 mt-6 text-xs text-muted">
          Active organization members: {customer.activeMembers}
        </p>
      </div>
    </AdminShell>
  );
}

async function resendInviteAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }
  const invitationId = stringField(formData, "invitation_id");
  if (!isUuid(invitationId)) throw new Error("Invalid invitation reference.");
  const result = await sendCustomerInvitation(invitationId, true);
  const organizationId = await organizationForInvitation(invitationId);
  if (!organizationId) throw new Error("Invitation organization was not found.");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(
    `/opzix-admin/customers/${organizationId}?invite=${result.ok ? "sent" : "failed"}`,
  );
}

async function editTermsAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }
  const invitationId = stringField(formData, "invitation_id");
  const setupFee = parseMoney(stringField(formData, "setup_fee"));
  const monthlySubscription = parseMoney(
    stringField(formData, "monthly_subscription"),
  );
  const organizationId = await organizationForInvitation(invitationId);
  if (!organizationId || setupFee === null || monthlySubscription === null) {
    redirect(`/opzix-admin/customers/${organizationId ?? ""}?error=terms`);
  }

  const updated = await supabaseAdminFetch<null>(
    "organization_commercial_terms",
    {
      method: "POST",
      query: { on_conflict: "organization_id" },
      body: {
        organization_id: organizationId,
        setup_fee: setupFee,
        monthly_subscription: monthlySubscription,
        currency: "USD",
        updated_at: new Date().toISOString(),
      },
      prefer: "resolution=merge-duplicates,return=minimal",
    },
  );
  if (!updated.ok) throw new Error(updated.error);
  await recordAdminEvent(organizationId, "commercial_terms_updated");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}`);
}

async function saveFeatureAccessAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }
  const invitationId = stringField(formData, "invitation_id");
  const organizationId = await organizationForInvitation(invitationId);
  if (!organizationId) throw new Error("Invitation organization was not found.");

  const features = await supabaseAdminFetch<FeatureRow[]>("features", {
    query: { select: "id,code", order: "code.asc" },
  });
  if (!features.ok) throw new Error(features.error);

  const enabledCodes = new Set(
    formData
      .getAll("enabled_feature_codes")
      .filter((value): value is string => typeof value === "string"),
  );
  const updates = features.data.map((feature) => ({
    organization_id: organizationId,
    feature_id: feature.id,
    enabled: enabledCodes.has(feature.code),
    reason: "Updated by Opzix admin",
    updated_at: new Date().toISOString(),
  }));
  if (updates.length) {
    const result = await supabaseAdminFetch<null>(
      "organization_feature_overrides",
      {
        method: "POST",
        query: { on_conflict: "organization_id,feature_id" },
        body: updates,
        prefer: "resolution=merge-duplicates,return=minimal",
      },
    );
    if (!result.ok) throw new Error(result.error);
  }

  await recordAdminEvent(organizationId, "feature_entitlements_updated", {
    enabledCount: String(enabledCodes.size),
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}`);
}

async function archiveQaCustomerAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }
  const confirmed = stringField(formData, "confirm_archive") === "yes";
  const organizationId = stringField(formData, "organization_id");
  if (!isUuid(organizationId)) throw new Error("Invalid organization reference.");
  if (!confirmed || !organizationId) {
    redirect(`/opzix-admin/customers/${organizationId ?? ""}?error=archive`);
  }

  const archived = await supabaseAdminRpc<boolean>("archive_qa_customer", {
    p_organization_id: organizationId,
  });
  if (!archived.ok || archived.data !== true) {
    throw new Error(
      archived.ok ? "QA customer was not archived." : archived.error,
    );
  }
  revalidatePath("/opzix-admin/customers");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}`);
}

async function organizationForInvitation(invitationId: string) {
  if (!isUuid(invitationId)) return null;
  const result = await supabaseAdminFetch<CustomerInvitationRow[]>(
    "organization_invitations",
    {
      query: {
        select:
          "id,organization_id,email,first_name,last_name,auth_user_id,plan_code,status,invitation_state,invited_at,accepted_at,last_error,metadata,updated_at",
        id: `eq.${invitationId}`,
        limit: 1,
      },
    },
  );
  if (!result.ok) throw new Error(result.error);
  return result.data[0]?.organization_id ?? null;
}

async function recordAdminEvent(
  organizationId: string,
  eventName: string,
  metadata: Record<string, string> = {},
) {
  const result = await supabaseAdminFetch<null>(
    "customer_account_audit_events",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        event_name: eventName,
        target_type: "organization",
        metadata: { ...metadata, actor: "opzix-admin-session" },
      },
      prefer: "return=minimal",
    },
  );
  if (!result.ok) throw new Error(result.error);
}

function DetailCard({
  title,
  value,
  children,
}: {
  title: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-cyan">
        {title}
      </p>
      <p className="mt-2 break-words font-bold text-primary">{value}</p>
      <div className="mt-2 text-sm leading-5 text-secondary">{children}</div>
    </div>
  );
}

function MoneyField({
  name,
  label,
  value,
}: {
  name: string;
  label: string;
  value: number;
}) {
  return (
    <label className="text-sm font-semibold text-secondary">
      {label}
      <input
        name={name}
        type="number"
        min="0"
        step="0.01"
        required
        defaultValue={value.toFixed(2)}
        className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
      />
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
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function inviteLabel(state: string | undefined) {
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

function invitationFailureReason(code: string | null) {
  switch (code) {
    case "resend_not_configured":
      return "Account setup email delivery is not configured. Configure the server-side RESEND_API_KEY and OPZIX_AUTH_FROM_EMAIL settings, then send a new account setup link.";
    case "invite_redirect_not_configured":
      return "The server-side invitation redirect is missing. Set OPZIX_AUTH_REDIRECT_URL to the approved invitation URL before retrying.";
    case "invite_redirect_invalid":
      return "The server-side invitation redirect is not an approved URL. Correct OPZIX_AUTH_REDIRECT_URL before retrying.";
    case "supabase_auth_transport_error":
      return "Supabase Auth could not be reached. Check Supabase service availability before retrying.";
    case "supabase_link_transport_error":
      return "Supabase Auth could not create the account setup link. Check Supabase Auth availability before retrying.";
    default: {
      const authStatus = /^supabase_auth_http_(\d{3})$/.exec(code ?? "");
      if (authStatus) {
        return `Supabase Auth rejected the invitation (HTTP ${authStatus[1]}). Check the Supabase Auth logs and delivery configuration before retrying.`;
      }
      const linkStatus = /^supabase_link_http_(\d{3})$/.exec(code ?? "");
      if (linkStatus) {
        return `Supabase Auth could not create the account setup link (HTTP ${linkStatus[1]}). Check the Supabase Auth logs before retrying.`;
      }
      return "The invitation provider could not complete the request. Check the Supabase Auth and email-delivery logs before retrying.";
    }
  }
}
