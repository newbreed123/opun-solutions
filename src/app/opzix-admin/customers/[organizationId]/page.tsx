import Link from "next/link";
import type { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AdminPasscodeForm } from "@/components/admin/AdminPasscodeForm";
import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  addBillingNote,
  addInvoiceLineItem,
  createDraftInvoice,
  formatCurrency,
  findSimilarInvoicePayments,
  getOrganizationBillingSummary,
  invoiceStatusLabel,
  invoiceTypeLabel,
  issueInvoice,
  paymentMethodLabel,
  recordInvoicePayment,
  removeInvoiceLineItem,
  reverseInvoicePayment,
  updateInvoiceLineItem,
  voidInvoice,
  type InvoiceType,
  type LineItemType,
  type PaymentMethod,
} from "@/lib/customer-platform/billing";
import { sendCustomerInvitation } from "@/lib/customer-platform/admin-invitations";
import { getCustomerAdminDetail } from "@/lib/customer-platform/admin-store";
import {
  DOCUMENT_ACCEPT,
  archiveCustomerDocument,
  createDocumentRequest,
  documentCategoryLabel,
  listCustomerDocuments,
  listDocumentRequests,
  uploadCustomerDocument,
  type CustomerDocumentCategory,
  type CustomerDocumentVisibility,
} from "@/lib/customer-platform/documents";
import {
  archiveCustomerOrganization,
  loadCustomerDeletionSummary,
  permanentlyDeleteCustomerOrganization,
  restoreCustomerOrganization,
} from "@/lib/customer-platform/lifecycle";
import {
  defaultProgressForStage,
  getOrganizationLaunchProgress,
  isLaunchStage,
  launchStageLabel,
  launchStages,
  saveOrganizationLaunchUpdate,
} from "@/lib/customer-platform/launch-progress";
import { supabaseAdminFetch } from "@/lib/supabase-admin";
import type {
  CustomerInvitationRow,
  FeatureRow,
  PlanRow,
} from "@/lib/customer-platform/types";

export const dynamic = "force-dynamic";

type CustomerDetailPageProps = {
  params: Promise<{ organizationId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const invoiceTypes: InvoiceType[] = [
  "setup_fee",
  "subscription",
  "services",
  "adjustment",
  "other",
];
const lineItemTypes: LineItemType[] = [
  "setup_fee",
  "recurring_subscription",
  "approved_service",
  "adjustment",
  "other",
];
const paymentMethods: PaymentMethod[] = [
  "zelle",
  "bank_transfer",
  "check",
  "cash",
  "card_external",
  "other",
];
const documentCategories: CustomerDocumentCategory[] = [
  "agreements",
  "invoices",
  "receipts",
  "brand_assets",
  "mls_brokerage",
  "business_documents",
  "other",
];

const billingErrorMessages: Record<string, string> = {
  billing: "Billing action could not be completed. Review the invoice and try again.",
  "billing-invalid":
    "Billing action could not be completed. Review the submitted values and try again.",
  "billing-issue-empty":
    "Invoice must include at least one positive line item before it can be issued.",
  "billing-issue-state":
    "Only draft invoices can be issued.",
  "billing-issue-failed":
    "Invoice could not be issued. Review the invoice and try again.",
  "billing-payment-invoice-state":
    "Invoice must be issued before recording a payment.",
  "billing-payment-exceeds-balance":
    "Payment exceeds the outstanding invoice balance.",
  "billing-payment-duplicate":
    "Duplicate payment submission detected. Review the payment history before trying again.",
  "billing-payment-conflict":
    "Payment could not be recorded because the reference or request key conflicts with an existing payment.",
  "billing-payment-failed":
    "Payment could not be recorded. Review the invoice and try again.",
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
  const launchProgress = await getOrganizationLaunchProgress(organizationId);
  const deletionSummary = await loadCustomerDeletionSummary(organizationId);
  const planOptions = await loadPlanOptions();
  const [billing, documents, documentRequests] = await Promise.all([
    getOrganizationBillingSummary({
      organizationId,
      includeInternalNotes: true,
    }),
    listCustomerDocuments({ organizationId, includeInternal: true, includeArchived: true }),
    listDocumentRequests(organizationId),
  ]);

  const invitation = customer.invitation;
  const displayName = customer.customerName;
  const inviteNotice = stringParam(query.invite);
  const pageError = stringParam(query.error);
  const billingErrorMessage = billingErrorMessages[pageError] ?? "";
  const actionNotice = stringParam(query.action);
  const mode = stringParam(query.mode);
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
          <Link
            href={`/opzix-admin/customers/${customer.organization.id}/onboarding`}
            className="rounded-full border border-dark-border px-4 py-2 text-sm font-semibold text-secondary hover:border-brand-cyan hover:text-primary"
          >
            View Onboarding
          </Link>
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
        {billingErrorMessage ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100"
          >
            {billingErrorMessage}
          </p>
        ) : pageError ? (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100"
          >
            The requested customer action could not be completed. Review the
            record and try again.
          </p>
        ) : null}
        {actionNotice === "saved" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-emerald-100">
            Customer changes saved.
          </p>
        ) : actionNotice === "archived" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-emerald-100">
            Customer archived. Historical records were preserved.
          </p>
        ) : actionNotice === "restored" ? (
          <p className="mt-6 rounded-xl border border-emerald-300/30 bg-emerald-400/10 p-4 text-emerald-100">
            Customer restored.
          </p>
        ) : actionNotice === "delete-blocked" ? (
          <p className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100">
            Permanent deletion was blocked. Review dependencies and archive
            status below.
          </p>
        ) : actionNotice === "payment-review" ? (
          <p className="mt-6 rounded-xl border border-amber-300/30 bg-amber-400/10 p-4 text-amber-100">
            Payment recorded. A similar payment already existed for that invoice,
            amount, method, and date, so review the payment history before taking
            any additional action.
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-primary">Billing</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Internal ledger records confirmed invoices and payments.
                Uploaded PDFs are supporting documents, not the source of
                truth.
              </p>
            </div>
            <div className="grid gap-2 text-right text-sm">
              <span className="font-bold text-primary">
                Outstanding {formatCurrency(billing.outstandingBalance)}
              </span>
              <span className="text-secondary">
                Paid {formatCurrency(billing.totalPaid)}
              </span>
            </div>
          </div>
          {billing.unavailableReason ? (
            <p className="mt-4 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
              {billing.unavailableReason}
            </p>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Dependency label="Setup fee" value={formatCurrency(billing.setupFee)} />
            <Dependency label="Monthly subscription" value={formatCurrency(billing.monthlySubscription)} />
            <Dependency label="Open balance" value={formatCurrency(billing.outstandingBalance)} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <form action={createInvoiceAction} className="rounded-xl border border-dark-border bg-dark-deep p-4">
              <input type="hidden" name="organization_id" value={customer.organization.id} />
              <h3 className="font-bold text-primary">Create Draft Invoice</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold text-secondary">
                  Type
                  <select
                    name="invoice_type"
                    className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary outline-none"
                  >
                    {invoiceTypes.map((type) => (
                      <option key={type} value={type}>
                        {invoiceTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-semibold text-secondary">
                  Invoice number
                  <input
                    name="invoice_number"
                    className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary outline-none"
                    placeholder="Auto-generated if blank"
                  />
                </label>
                <label className="text-sm font-semibold text-secondary">
                  Issue date
                  <input
                    name="issue_date"
                    type="date"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-secondary">
                  Due date
                  <input
                    name="due_date"
                    type="date"
                    className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-secondary sm:col-span-2">
                  Customer-facing description
                  <textarea
                    name="customer_description"
                    rows={3}
                    className="mt-2 w-full rounded-xl border border-dark-border bg-dark-card px-3 py-2 text-primary outline-none"
                  />
                </label>
                <label className="text-sm font-semibold text-secondary sm:col-span-2">
                  Due condition
                  <input
                    name="due_condition"
                    className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary outline-none"
                    placeholder="Example: Balance due after website completion"
                  />
                </label>
                <button type="submit" className="btn btn-primary min-h-11 sm:col-span-2">
                  Create Draft Invoice
                </button>
              </div>
            </form>

            <form action={addBillingNoteAction} className="rounded-xl border border-dark-border bg-dark-deep p-4">
              <input type="hidden" name="organization_id" value={customer.organization.id} />
              <h3 className="font-bold text-primary">Internal Billing Note</h3>
              <label className="mt-4 block text-sm font-semibold text-secondary">
                Note
                <textarea
                  name="note"
                  rows={5}
                  required
                  className="mt-2 w-full rounded-xl border border-dark-border bg-dark-card px-3 py-2 text-primary outline-none"
                />
              </label>
              <button type="submit" className="btn btn-secondary mt-3 min-h-11">
                Add Note
              </button>
            </form>
          </div>

          <div className="mt-6 grid gap-4">
            {billing.invoices.map((invoice) => {
              const canIssueInvoice =
                invoice.status === "draft" && invoice.total > 0;

              return (
                <article
                  key={invoice.id}
                  className="rounded-xl border border-dark-border bg-white/[0.025] p-4"
                >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-primary">
                      {invoice.invoice_number}
                    </h3>
                    <p className="mt-1 text-sm text-secondary">
                      {invoiceTypeLabel(invoice.invoice_type)} ·{" "}
                      {invoiceStatusLabel(invoice.status)}
                    </p>
                    {invoice.customer_description ? (
                      <p className="mt-2 text-sm leading-6 text-secondary">
                        {invoice.customer_description}
                      </p>
                    ) : null}
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-bold text-primary">
                      Total {formatCurrency(invoice.total)}
                    </p>
                    <p className="text-secondary">
                      Paid {formatCurrency(invoice.amountPaid)}
                    </p>
                    <p className="text-secondary">
                      Open {formatCurrency(invoice.outstandingBalance)}
                    </p>
                  </div>
                </div>
                {invoice.status === "draft" ? (
                  <form action={addLineItemAction} className="mt-4 grid gap-3 rounded-lg border border-dark-border bg-dark-deep p-3 md:grid-cols-5">
                    <input type="hidden" name="organization_id" value={customer.organization.id} />
                    <input type="hidden" name="invoice_id" value={invoice.id} />
                    <label className="text-sm font-semibold text-secondary">
                      Line type
                      <select name="line_type" className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary">
                        {lineItemTypes.map((type) => (
                          <option key={type} value={type}>
                            {type.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-semibold text-secondary md:col-span-2">
                      Description
                      <input name="description" required className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary" />
                    </label>
                    <label className="text-sm font-semibold text-secondary">
                      Quantity
                      <input name="quantity" type="number" min="0.01" step="0.01" defaultValue="1.00" className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary" />
                    </label>
                    <label className="text-sm font-semibold text-secondary">
                      Amount
                      <input name="unit_amount" type="number" step="0.01" required className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary" />
                    </label>
                    <button type="submit" className="btn btn-secondary min-h-11 md:col-span-5">
                      Add Line Item
                    </button>
                  </form>
                ) : null}
                {invoice.lineItems.length ? (
                  <div className="mt-4 divide-y divide-dark-border text-sm">
                    {invoice.lineItems.map((item) =>
                      invoice.status === "draft" ? (
                        <div key={item.id} className="grid gap-3 py-3">
                          <form
                            action={updateLineItemAction}
                            className="grid gap-3 rounded-lg border border-dark-border bg-dark-deep p-3 md:grid-cols-5"
                          >
                            <input type="hidden" name="organization_id" value={customer.organization.id} />
                            <input type="hidden" name="invoice_id" value={invoice.id} />
                            <input type="hidden" name="line_item_id" value={item.id} />
                            <label className="text-sm font-semibold text-secondary">
                              Line type
                              <select
                                name="line_type"
                                defaultValue={item.line_type}
                                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary"
                              >
                                {lineItemTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type.replaceAll("_", " ")}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="text-sm font-semibold text-secondary md:col-span-2">
                              Description
                              <input
                                name="description"
                                required
                                defaultValue={item.description}
                                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary"
                              />
                            </label>
                            <label className="text-sm font-semibold text-secondary">
                              Quantity
                              <input
                                name="quantity"
                                type="number"
                                min="0.01"
                                step="0.01"
                                defaultValue={item.quantity}
                                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary"
                              />
                            </label>
                            <label className="text-sm font-semibold text-secondary">
                              Amount
                              <input
                                name="unit_amount"
                                type="number"
                                step="0.01"
                                required
                                defaultValue={item.unit_amount}
                                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary"
                              />
                            </label>
                            <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-5">
                              <span className="font-semibold text-primary">
                                Current line total:{" "}
                                {formatCurrency(Number(item.quantity) * Number(item.unit_amount))}
                              </span>
                              <button type="submit" className="btn btn-secondary min-h-10">
                                Save Line Item
                              </button>
                            </div>
                          </form>
                          <form
                            action={removeLineItemAction}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/25 bg-amber-400/[0.06] p-3"
                          >
                            <input type="hidden" name="organization_id" value={customer.organization.id} />
                            <input type="hidden" name="invoice_id" value={invoice.id} />
                            <input type="hidden" name="line_item_id" value={item.id} />
                            <label className="flex items-center gap-2 text-sm font-semibold text-amber-100">
                              <input
                                type="checkbox"
                                name="confirm_remove"
                                value="yes"
                                required
                                className="h-4 w-4 rounded border-amber-300/50 bg-dark-card"
                              />
                              Confirm removing this draft line item
                            </label>
                            <button
                              type="submit"
                              className="rounded-full border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/10"
                            >
                              Remove Line Item
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div key={item.id} className="flex justify-between gap-3 py-2">
                          <span className="text-secondary">{item.description}</span>
                          <span className="font-semibold text-primary">
                            {formatCurrency(Number(item.quantity) * Number(item.unit_amount))}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-3">
                  {invoice.status === "draft" ? (
                    <div className="grid gap-2">
                      <form action={issueInvoiceAction}>
                        <input type="hidden" name="organization_id" value={customer.organization.id} />
                        <input type="hidden" name="invoice_id" value={invoice.id} />
                        <button
                          type="submit"
                          disabled={!canIssueInvoice}
                          className="btn btn-primary min-h-10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Issue Invoice
                        </button>
                      </form>
                      {!canIssueInvoice ? (
                        <p className="max-w-xl text-sm text-amber-100">
                          Add at least one positive line item before issuing this
                          invoice.
                        </p>
                      ) : null}
                    </div>
                  ) : null}
                  {invoice.status === "issued" || invoice.status === "partially_paid" ? (
                    <form action={recordPaymentAction} className="grid gap-3 rounded-lg border border-dark-border bg-dark-deep p-3 sm:grid-cols-3 lg:grid-cols-6">
                      <input type="hidden" name="organization_id" value={customer.organization.id} />
                      <input type="hidden" name="invoice_id" value={invoice.id} />
                      <input type="hidden" name="payment_idempotency_key" value={crypto.randomUUID()} />
                      <label className="text-sm font-semibold text-secondary">
                        Amount
                        <input name="amount" type="number" min="0.01" step="0.01" required className="mt-2 min-h-10 w-full rounded-lg border border-dark-border bg-dark-card px-3 text-primary" />
                      </label>
                      <label className="text-sm font-semibold text-secondary">
                        Method
                        <select name="payment_method" className="mt-2 min-h-10 w-full rounded-lg border border-dark-border bg-dark-card px-3 text-primary">
                          {paymentMethods.map((method) => (
                            <option key={method} value={method}>
                              {paymentMethodLabel(method)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-secondary">
                        Received
                        <input name="received_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className="mt-2 min-h-10 w-full rounded-lg border border-dark-border bg-dark-card px-3 text-primary" />
                      </label>
                      <label className="text-sm font-semibold text-secondary">
                        Reference
                        <input name="external_transaction_ref" className="mt-2 min-h-10 w-full rounded-lg border border-dark-border bg-dark-card px-3 text-primary" />
                      </label>
                      <label className="text-sm font-semibold text-secondary">
                        Internal note
                        <input name="internal_note" className="mt-2 min-h-10 w-full rounded-lg border border-dark-border bg-dark-card px-3 text-primary" />
                      </label>
                      <button type="submit" className="btn btn-primary min-h-10 self-end">
                        Record Payment
                      </button>
                    </form>
                  ) : null}
                  {invoice.status === "draft" || invoice.status === "issued" ? (
                    <form action={voidInvoiceAction}>
                      <input type="hidden" name="organization_id" value={customer.organization.id} />
                      <input type="hidden" name="invoice_id" value={invoice.id} />
                      <button type="submit" className="rounded-full border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/10">
                        Void Invoice
                      </button>
                    </form>
                  ) : null}
                </div>
                {invoice.payments.length ? (
                  <div className="mt-4 rounded-lg border border-dark-border bg-dark-deep p-3">
                    <h4 className="text-sm font-bold text-primary">Payments</h4>
                    <div className="mt-2 divide-y divide-dark-border text-sm">
                      {invoice.payments.map((payment) => (
                        <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                          <span className="text-secondary">
                            {payment.payment_kind === "reversal" ? "Reversal" : "Payment"} ·{" "}
                            {paymentMethodLabel(payment.payment_method)} ·{" "}
                            {formatDate(payment.received_on)}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-primary">
                              {payment.payment_kind === "reversal" ? "-" : ""}
                              {formatCurrency(payment.amount)}
                            </span>
                            {payment.payment_kind === "payment" && !isPaymentReversed(invoice.payments, payment.id) ? (
                              <form action={reversePaymentAction}>
                                <input type="hidden" name="organization_id" value={customer.organization.id} />
                                <input type="hidden" name="payment_id" value={payment.id} />
                                <button type="submit" className="text-xs font-semibold text-amber-100">
                                  Reverse
                                </button>
                              </form>
                            ) : payment.payment_kind === "payment" ? (
                              <span className="text-xs font-semibold text-muted">Reversed</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
                </article>
              );
            })}
            {!billing.invoices.length ? (
              <p className="text-sm text-muted">No invoices have been created.</p>
            ) : null}
          </div>

          {billing.notes.length ? (
            <div className="mt-6 rounded-xl border border-dark-border bg-dark-deep p-4">
              <h3 className="font-bold text-primary">Internal Billing Notes</h3>
              <ul className="mt-3 divide-y divide-dark-border text-sm">
                {billing.notes.map((note) => (
                  <li key={note.id} className="py-2 text-secondary">
                    {note.note}
                    <span className="block text-xs text-muted">
                      {formatDateTime(note.created_at)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-5">
          <h2 className="text-xl font-bold text-primary">Documents</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Upload private organization-scoped documents and choose whether the
            customer can see them.
          </p>
          <div className="mt-5 grid gap-6 xl:grid-cols-2">
            <form action={uploadAdminDocumentAction} className="grid gap-3 rounded-xl border border-dark-border bg-dark-deep p-4">
              <input type="hidden" name="organization_id" value={customer.organization.id} />
              <label className="text-sm font-semibold text-secondary">
                Category
                <select name="category" className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary">
                  {documentCategories.map((category) => (
                    <option key={category} value={category}>
                      {documentCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-secondary">
                Visibility
                <select name="visibility" className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary">
                  <option value="customer_visible">Customer visible</option>
                  <option value="internal">Internal only</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-secondary">
                Title
                <input name="title" required className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary" />
              </label>
              <label className="text-sm font-semibold text-secondary">
                File
                <input name="file" type="file" accept={DOCUMENT_ACCEPT} required className="mt-2 block w-full rounded-xl border border-dark-border bg-dark-card px-3 py-3 text-sm text-secondary file:mr-4 file:rounded-lg file:border-0 file:bg-brand-cyan file:px-3 file:py-2 file:font-semibold file:text-slate-950" />
              </label>
              <button type="submit" className="btn btn-primary min-h-11">
                Upload Document
              </button>
            </form>

            <form action={requestDocumentAction} className="grid gap-3 rounded-xl border border-dark-border bg-dark-deep p-4">
              <input type="hidden" name="organization_id" value={customer.organization.id} />
              <h3 className="font-bold text-primary">Request Customer Document</h3>
              <label className="text-sm font-semibold text-secondary">
                Category
                <select name="category" className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary">
                  {documentCategories.map((category) => (
                    <option key={category} value={category}>
                      {documentCategoryLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-semibold text-secondary">
                Request title
                <input name="title" required className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary" />
              </label>
              <label className="text-sm font-semibold text-secondary">
                Message
                <textarea name="message" rows={3} className="mt-2 w-full rounded-xl border border-dark-border bg-dark-card px-3 py-2 text-primary" />
              </label>
              <button type="submit" className="btn btn-secondary min-h-11">
                Request Document
              </button>
            </form>
          </div>
          <div className="mt-6 grid gap-3">
            {documents.ok && documents.data.map((document) => (
              <div key={document.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dark-border bg-white/[0.025] p-3 text-sm">
                <div>
                  <p className="font-semibold text-primary">{document.title}</p>
                  <p className="text-secondary">
                    {documentCategoryLabel(document.category)} ·{" "}
                    {document.visibility === "customer_visible" ? "Customer visible" : "Internal only"} ·{" "}
                    {document.status === "active" ? "Active" : "Archived"} ·{" "}
                    {formatDate(document.created_at)}
                  </p>
                </div>
                <div className="flex gap-3">
                  {document.viewUrl ? <a href={document.viewUrl} className="font-semibold text-brand-cyan">View</a> : null}
                  {document.downloadUrl ? <a href={document.downloadUrl} className="font-semibold text-brand-cyan">Download</a> : null}
                  {document.status === "active" ? (
                    <form action={archiveAdminDocumentAction}>
                      <input type="hidden" name="organization_id" value={customer.organization.id} />
                      <input type="hidden" name="document_id" value={document.id} />
                      <button type="submit" className="font-semibold text-amber-100">
                        Archive
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
            {(!documents.ok || !documents.data.length) ? (
              <p className="text-sm text-muted">No documents are attached.</p>
            ) : null}
          </div>
          {documentRequests.length ? (
            <div className="mt-6 rounded-xl border border-dark-border bg-dark-deep p-4">
              <h3 className="font-bold text-primary">Document Requests</h3>
              <ul className="mt-3 divide-y divide-dark-border text-sm">
                {documentRequests.map((request) => (
                  <li key={request.id} className="py-2 text-secondary">
                    {request.title} · {documentCategoryLabel(request.category)} · {request.status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

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

        {mode === "edit" ? (
          <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-5">
            <h2 className="text-xl font-bold text-primary">Edit Customer</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Update customer and organization display data. Email changes are
              intentionally excluded because identity changes require a separate
              verified workflow.
            </p>
            <form action={saveCustomerEditAction} className="mt-5 grid gap-4 lg:grid-cols-2">
              <input type="hidden" name="organization_id" value={customer.organization.id} />
              <label className="text-sm font-semibold text-secondary">
                Customer display name
                <input
                  name="customer_display_name"
                  defaultValue={displayName === "Not invited" ? "" : displayName}
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                />
              </label>
              <label className="text-sm font-semibold text-secondary">
                Customer email
                <input
                  value={invitation?.email ?? ""}
                  readOnly
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-muted outline-none"
                />
              </label>
              <label className="text-sm font-semibold text-secondary">
                Organization name
                <input
                  name="organization_name"
                  required
                  defaultValue={customer.organization.name}
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                />
              </label>
              <label className="text-sm font-semibold text-secondary">
                Business type
                <select
                  name="organization_type"
                  defaultValue={customer.organization.organization_type}
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                >
                  <option value="agent">Agent</option>
                  <option value="team">Team</option>
                  <option value="brokerage">Brokerage</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-secondary">
                Contact phone
                <input
                  name="phone"
                  defaultValue={customer.profile?.phone ?? ""}
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                />
              </label>
              <label className="text-sm font-semibold text-secondary">
                Customer status
                <select
                  name="organization_status"
                  defaultValue={customer.organization.status}
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                >
                  <option value="active">Active</option>
                  <option value="onboarding">Onboarding</option>
                  <option value="suspended">Suspended</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="text-sm font-semibold text-secondary">
                Plan assignment
                <select
                  name="plan_code"
                  defaultValue={customer.plan?.code ?? "custom"}
                  className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
                >
                  {planOptions.map((plan) => (
                    <option key={plan.code} value={plan.code}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
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
              <label className="flex items-center gap-2 rounded-xl border border-dark-border bg-white/[0.025] p-3 text-sm font-semibold text-secondary lg:col-span-2">
                <input
                  type="checkbox"
                  name="is_test_account"
                  value="yes"
                  defaultChecked={customer.isQa}
                  className="accent-cyan-400"
                />
                Mark as confirmed QA / test organization
              </label>
              <div className="flex flex-wrap gap-3 lg:col-span-2">
                <button type="submit" className="btn btn-primary min-h-11">
                  Save Customer
                </button>
                <Link
                  href={`/opzix-admin/customers/${customer.organization.id}`}
                  className="btn btn-secondary min-h-11"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </section>
        ) : (
          <div className="mt-6">
            <Link
              href={`/opzix-admin/customers/${customer.organization.id}?mode=edit`}
              className="inline-flex rounded-full border border-dark-border px-4 py-2 text-sm font-semibold text-secondary hover:border-brand-cyan hover:text-primary"
            >
              Edit Customer
            </Link>
          </div>
        )}

        <section className="mt-8 rounded-2xl border border-dark-border bg-dark-card p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">
                Platform Launch
              </h2>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Customer-facing launch progress is separate from onboarding
                completion. Keep language focused on the launch journey.
              </p>
            </div>
            <div className="rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 px-4 py-3 text-sm">
              <span className="font-bold text-primary">
                {launchProgress.status.progress_percent}%
              </span>{" "}
              <span className="text-secondary">
                {launchStageLabel(launchProgress.status.current_stage)}
              </span>
            </div>
          </div>
          <form action={saveLaunchProgressAction} className="mt-5 grid gap-4 lg:grid-cols-2">
            <input
              type="hidden"
              name="organization_id"
              value={customer.organization.id}
            />
            <label className="text-sm font-semibold text-secondary">
              Current stage
              <select
                name="current_stage"
                defaultValue={launchProgress.status.current_stage}
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              >
                {launchStages.map((stage) => (
                  <option key={stage.code} value={stage.code}>
                    {stage.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-secondary">
              Progress %
              <input
                name="progress_percent"
                type="number"
                min="0"
                max="100"
                defaultValue={launchProgress.status.progress_percent}
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <label className="text-sm font-semibold text-secondary lg:col-span-2">
              Customer-facing status
              <input
                name="customer_status"
                defaultValue={
                  launchProgress.status.customer_status ??
                  launchStageLabel(launchProgress.status.current_stage)
                }
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <label className="text-sm font-semibold text-secondary lg:col-span-2">
              Latest update from Opzix
              <textarea
                name="latest_update"
                rows={4}
                defaultValue={launchProgress.status.latest_update ?? ""}
                className="mt-2 w-full rounded-xl border border-dark-border bg-dark-deep px-3 py-2 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <label className="text-sm font-semibold text-secondary">
              Next customer action
              <input
                name="next_customer_action"
                defaultValue={launchProgress.status.next_customer_action ?? ""}
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <label className="text-sm font-semibold text-secondary">
              Estimated launch window
              <input
                name="estimated_launch_window"
                defaultValue={launchProgress.status.estimated_launch_window ?? ""}
                className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-deep px-3 text-primary outline-none focus:border-brand-cyan"
              />
            </label>
            <button type="submit" className="btn btn-primary min-h-11 lg:col-span-2">
              Save Launch Update
            </button>
          </form>
          {launchProgress.updates.length ? (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-primary">Update history</h3>
              <ul className="mt-2 divide-y divide-dark-border">
                {launchProgress.updates.slice(0, 5).map((update) => (
                  <li key={update.id} className="py-3 text-sm">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="font-semibold text-primary">
                        {launchStageLabel(update.stage)} · {update.progress_percent}%
                      </span>
                      <time className="text-muted">
                        {formatDateTime(update.created_at)}
                      </time>
                    </div>
                    {update.customer_message ? (
                      <p className="mt-1 text-secondary">
                        {update.customer_message}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
          <Link
            href={`/opzix-admin/customers/${customer.organization.id}/onboarding`}
            className="mt-4 inline-flex text-sm font-semibold text-brand-cyan hover:underline"
          >
            Open complete onboarding review
          </Link>
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

        <section
          id="danger-zone"
          className="mt-8 rounded-2xl border border-amber-300/25 bg-amber-400/[0.04] p-5"
        >
          <h2 className="text-lg font-bold text-primary">
            Customer lifecycle controls
          </h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Archive preserves onboarding, billing metadata, assets and audit
            history. Permanent deletion is restricted and blocked when
            protected dependencies are present.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {customer.organization.status === "archived" ? (
              <form action={restoreCustomerAction} className="flex flex-wrap items-center gap-3">
                <input
                  type="hidden"
                  name="organization_id"
                  value={customer.organization.id}
                />
                <label className="flex items-center gap-2 text-sm text-secondary">
                  <input type="checkbox" name="confirm_restore" value="yes" required />
                  Confirm restore
                </label>
                <button type="submit" className="btn btn-secondary min-h-11">
                  Restore Customer
                </button>
              </form>
            ) : (
              <form action={archiveCustomerAction} className="flex flex-wrap items-center gap-3">
                <input
                  type="hidden"
                  name="organization_id"
                  value={customer.organization.id}
                />
                <label className="flex items-center gap-2 text-sm text-secondary">
                  <input type="checkbox" name="confirm_archive" value="yes" required />
                  Confirm archive
                </label>
                <button
                  type="submit"
                  className="rounded-full border border-amber-300/40 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/10"
                >
                  Archive Customer
                </button>
              </form>
            )}
          </div>

          {deletionSummary ? (
            <div className="mt-6 rounded-xl border border-dark-border bg-dark-deep p-4">
              <h3 className="text-sm font-bold text-primary">
                Permanent deletion dependency summary
              </h3>
              <div className="mt-4 grid gap-3 text-sm text-secondary sm:grid-cols-2 lg:grid-cols-3">
                <Dependency label="Organization members" value={deletionSummary.organizationMembers} />
                <Dependency label="Auth identities" value={deletionSummary.authIdentities} />
                <Dependency label="Shared Auth relationships" value={deletionSummary.sharedAuthRelationships} />
                <Dependency label="Invitations" value={deletionSummary.invitations} />
                <Dependency label="Onboarding records" value={deletionSummary.onboardingRecords} />
                <Dependency label="Onboarding assets" value={deletionSummary.onboardingAssets} />
                <Dependency label="Storage objects" value={deletionSummary.storageObjects} />
                <Dependency label="Launch updates" value={deletionSummary.launchUpdates} />
                <Dependency label="Notes / info requests" value={deletionSummary.notesAndInformationRequests} />
                <Dependency label="Subscriptions / entitlements" value={deletionSummary.subscriptionsAndEntitlements} />
                <Dependency label="Financial dependencies" value={deletionSummary.financialDependencies} />
                <Dependency label="Billing invoices" value={deletionSummary.billingInvoices} />
                <Dependency label="Billing payments" value={deletionSummary.billingPayments} />
                <Dependency label="Documents / requests" value={deletionSummary.documents} />
                <Dependency label="Audit events" value={deletionSummary.auditEvents} />
              </div>
              <dl className="mt-4 grid gap-3 rounded-lg border border-dark-border bg-white/[0.025] p-3 text-sm text-secondary sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    QA / Test account
                  </dt>
                  <dd className="mt-1 font-semibold text-primary">
                    {deletionSummary.isTestAccount ? "Yes" : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Permanent deletion allowed
                  </dt>
                  <dd className="mt-1 font-semibold text-primary">
                    {deletionSummary.canDelete ? "Yes" : "No"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Active deletion job
                  </dt>
                  <dd className="mt-1 font-semibold text-primary">
                    {deletionSummary.activeDeletionJobState
                      ? deletionSummary.activeDeletionJobState.replaceAll("_", " ")
                      : "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                    Auth identity handling
                  </dt>
                  <dd className="mt-1 font-semibold text-primary">
                    Preserved
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted">
                Auth users are never deleted by this workflow. Shared identities
                remain available for other organizations.
              </p>
              {deletionSummary.associatedExternalData.map((note) => (
                <p key={note} className="mt-2 text-sm text-muted">
                  {note}
                </p>
              ))}
              {deletionSummary.protectedReasons.length ? (
                <div className="mt-4 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
                  <p className="font-bold">Deletion blocked</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {deletionSummary.protectedReasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <form action={deleteCustomerAction} className="mt-5 grid gap-3">
                <input
                  type="hidden"
                  name="organization_id"
                  value={customer.organization.id}
                />
                <label className="text-sm font-semibold text-secondary">
                  Type the exact organization name to permanently delete:
                  <span className="ml-1 text-primary">{customer.organization.name}</span>
                  <input
                    name="confirmation_name"
                    className="mt-2 min-h-11 w-full rounded-xl border border-dark-border bg-dark-card px-3 text-primary outline-none focus:border-red-300"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-secondary">
                  <input type="checkbox" name="confirm_delete" value="yes" required />
                  I understand this deletes organization-scoped records and
                  storage objects but not Supabase Auth users.
                </label>
                <button
                  type="submit"
                  className="justify-self-start rounded-full border border-red-300/40 px-4 py-2 text-sm font-semibold text-red-100 hover:bg-red-400/10 disabled:opacity-50"
                  disabled={!deletionSummary.canDelete}
                >
                  Permanently Delete
                </button>
              </form>
            </div>
          ) : null}
        </section>

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

async function saveCustomerEditAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }

  const organizationId = stringField(formData, "organization_id");
  if (!isUuid(organizationId)) throw new Error("Invalid organization reference.");

  const customer = await getCustomerAdminDetail(organizationId);
  if (!customer) throw new Error("Customer was not found.");

  const organizationName = stringField(formData, "organization_name");
  const customerDisplayName = stringField(formData, "customer_display_name");
  const organizationType = stringField(formData, "organization_type");
  const organizationStatus = stringField(formData, "organization_status");
  const planCode = stringField(formData, "plan_code");
  const phone = stringField(formData, "phone");
  const setupFee = parseMoney(stringField(formData, "setup_fee"));
  const monthlySubscription = parseMoney(
    stringField(formData, "monthly_subscription"),
  );
  const isTestAccount = stringField(formData, "is_test_account") === "yes";

  if (
    organizationName.length < 2 ||
    organizationName.length > 160 ||
    !["agent", "team", "brokerage", "other"].includes(organizationType) ||
    !["active", "onboarding", "suspended", "archived"].includes(
      organizationStatus,
    ) ||
    setupFee === null ||
    monthlySubscription === null
  ) {
    redirect(`/opzix-admin/customers/${organizationId}?mode=edit&error=edit`);
  }

  const names = splitCustomerName(customerDisplayName);
  const changedFields = new Set<string>();
  if (organizationName !== customer.organization.name) changedFields.add("organization_name");
  if (organizationType !== customer.organization.organization_type) changedFields.add("business_type");
  if (organizationStatus !== customer.organization.status) changedFields.add("customer_status");
  if (isTestAccount !== customer.isQa) changedFields.add("qa_classification");
  if ((customer.profile?.phone ?? "") !== phone) changedFields.add("contact_information");
  if (customer.plan?.code !== planCode) changedFields.add("plan_assignment");
  if ((customer.terms?.setup_fee ?? 0) !== setupFee) changedFields.add("setup_fee");
  if ((customer.terms?.monthly_subscription ?? 0) !== monthlySubscription) {
    changedFields.add("monthly_subscription");
  }

  const now = new Date().toISOString();
  const metadata = {
    ...(isRecord(customer.organization.metadata)
      ? customer.organization.metadata
      : {}),
    is_qa: isTestAccount,
  };
  const organizationBody: Record<string, unknown> = {
    name: organizationName,
    organization_type: organizationType,
    is_test_account: isTestAccount,
    metadata,
    updated_at: now,
  };
  if (organizationStatus !== "archived") {
    organizationBody.status = organizationStatus;
  }

  const organizationUpdate = await supabaseAdminFetch<null>("organizations", {
    method: "PATCH",
    query: { id: `eq.${organizationId}` },
    body: organizationBody,
    prefer: "return=minimal",
  });
  if (!organizationUpdate.ok) throw new Error(organizationUpdate.error);

  if (customer.invitation) {
    const invitationUpdate = await supabaseAdminFetch<null>(
      "organization_invitations",
      {
        method: "PATCH",
        query: { id: `eq.${customer.invitation.id}` },
        body: {
          first_name: names.firstName,
          last_name: names.lastName,
          plan_code: planCode,
          metadata: {
            ...(isRecord(customer.invitation.metadata)
              ? customer.invitation.metadata
              : {}),
            is_qa: isTestAccount,
          },
          updated_at: now,
        },
        prefer: "return=minimal",
      },
    );
    if (!invitationUpdate.ok) throw new Error(invitationUpdate.error);
  }

  if (customer.invitation?.auth_user_id) {
    const profileUpdate = await supabaseAdminFetch<null>("profiles", {
      method: "POST",
      query: { on_conflict: "user_id" },
      body: {
        user_id: customer.invitation.auth_user_id,
        first_name: names.firstName,
        last_name: names.lastName,
        preferred_name: customerDisplayName || null,
        phone: phone || null,
        updated_at: now,
      },
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    if (!profileUpdate.ok) throw new Error(profileUpdate.error);
  }

  const plan = await planByCode(planCode);
  if (!plan) redirect(`/opzix-admin/customers/${organizationId}?mode=edit&error=edit`);
  const subscriptionUpdate = await supabaseAdminFetch<null>(
    "organization_subscriptions",
    {
      method: "POST",
      query: { on_conflict: "organization_id" },
      body: {
        organization_id: organizationId,
        plan_id: plan.id,
        status: customer.subscription?.status ?? "active",
        starts_at: customer.subscription?.starts_at ?? now,
        external_subscription_id:
          customer.subscription?.external_subscription_id ?? null,
        updated_at: now,
      },
      prefer: "resolution=merge-duplicates,return=minimal",
    },
  );
  if (!subscriptionUpdate.ok) throw new Error(subscriptionUpdate.error);

  const termsUpdate = await supabaseAdminFetch<null>(
    "organization_commercial_terms",
    {
      method: "POST",
      query: { on_conflict: "organization_id" },
      body: {
        organization_id: organizationId,
        setup_fee: setupFee,
        monthly_subscription: monthlySubscription,
        currency: "USD",
        updated_at: now,
      },
      prefer: "resolution=merge-duplicates,return=minimal",
    },
  );
  if (!termsUpdate.ok) throw new Error(termsUpdate.error);

  if (organizationStatus === "archived") {
    const archived = await archiveCustomerOrganization(organizationId);
    if (!archived.ok) throw new Error(archived.error);
  } else if (customer.organization.status === "archived") {
    const restored = await restoreCustomerOrganization(organizationId);
    if (!restored.ok) throw new Error(restored.error);
    const statusUpdate = await supabaseAdminFetch<null>("organizations", {
      method: "PATCH",
      query: { id: `eq.${organizationId}` },
      body: { status: organizationStatus, updated_at: now },
      prefer: "return=minimal",
    });
    if (!statusUpdate.ok) throw new Error(statusUpdate.error);
  }

  await recordAdminEvent(organizationId, "customer_profile_updated", {
    changedFields: Array.from(changedFields).sort().join(",") || "none",
  });
  revalidatePath("/opzix-admin/customers");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function saveLaunchProgressAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }

  const organizationId = stringField(formData, "organization_id");
  const stage = stringField(formData, "current_stage");
  if (!isUuid(organizationId) || !isLaunchStage(stage)) {
    throw new Error("Invalid launch progress update.");
  }
  const progressInput = Number(stringField(formData, "progress_percent"));
  const progressPercent = Number.isFinite(progressInput)
    ? Math.min(100, Math.max(0, Math.round(progressInput)))
    : defaultProgressForStage(stage);
  const customerStatus =
    stringField(formData, "customer_status") || launchStageLabel(stage);
  const latestUpdate = stringField(formData, "latest_update");
  const nextCustomerAction =
    stringField(formData, "next_customer_action") ||
    "No action needed right now.";
  const estimatedLaunchWindow = stringField(formData, "estimated_launch_window");

  const result = await saveOrganizationLaunchUpdate({
    organizationId,
    stage,
    progressPercent,
    customerStatus,
    latestUpdate,
    nextCustomerAction,
    estimatedLaunchWindow,
  });
  if (!result.ok) throw new Error(result.error);

  await recordAdminEvent(organizationId, "platform_launch_status_updated", {
    stage,
    progressPercent: String(progressPercent),
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app");
  redirect(`/opzix-admin/customers/${organizationId}`);
}

async function archiveCustomerAction(formData: FormData) {
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

  const archived = await archiveCustomerOrganization(organizationId);
  if (!archived.ok) throw new Error(archived.error);
  revalidatePath("/opzix-admin/customers");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}?action=archived`);
}

async function restoreCustomerAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }
  const confirmed = stringField(formData, "confirm_restore") === "yes";
  const organizationId = stringField(formData, "organization_id");
  if (!isUuid(organizationId) || !confirmed) {
    redirect(`/opzix-admin/customers/${organizationId ?? ""}?error=restore`);
  }

  const restored = await restoreCustomerOrganization(organizationId);
  if (!restored.ok) throw new Error(restored.error);
  revalidatePath("/opzix-admin/customers");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}?action=restored`);
}

async function deleteCustomerAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized customer admin action.");
  }
  const organizationId = stringField(formData, "organization_id");
  const confirmationName = stringField(formData, "confirmation_name");
  const confirmed = stringField(formData, "confirm_delete") === "yes";
  if (!isUuid(organizationId) || !confirmed) {
    redirect(`/opzix-admin/customers/${organizationId ?? ""}?error=delete`);
  }

  const result = await permanentlyDeleteCustomerOrganization({
    organizationId,
    confirmationName,
  });
  if (!result.ok) {
    revalidatePath(`/opzix-admin/customers/${organizationId}`);
    redirect(`/opzix-admin/customers/${organizationId}?action=delete-blocked`);
  }
  revalidatePath("/opzix-admin/customers");
  redirect("/opzix-admin/customers?filter=archived&action=deleted");
}

async function createInvoiceAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceType = stringField(formData, "invoice_type");
  const issueDate = stringField(formData, "issue_date");
  if (!isInvoiceType(invoiceType) || !isDateField(issueDate)) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await createDraftInvoice({
    organizationId,
    invoiceType,
    invoiceNumber: stringField(formData, "invoice_number"),
    issueDate,
    dueDate: dateOrUndefined(stringField(formData, "due_date")),
    dueCondition: stringField(formData, "due_condition"),
    customerDescription: stringField(formData, "customer_description"),
  });
  if (!result.ok) redirect(`/opzix-admin/customers/${organizationId}?error=billing`);
  await recordAdminEvent(organizationId, "customer_billing_invoice_created", {
    invoiceType,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function addLineItemAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceId = stringField(formData, "invoice_id");
  const lineType = stringField(formData, "line_type");
  const quantity = parsePositiveMoney(stringField(formData, "quantity"));
  const unitAmount = parseSignedMoney(stringField(formData, "unit_amount"));
  const description = stringField(formData, "description");
  if (
    !isUuid(invoiceId) ||
    !isLineItemType(lineType) ||
    quantity === null ||
    unitAmount === null ||
    description.length < 2
  ) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await addInvoiceLineItem({
    organizationId,
    invoiceId,
    lineType,
    description,
    quantity,
    unitAmount,
  });
  if (!result.ok) redirect(`/opzix-admin/customers/${organizationId}?error=billing`);
  await recordAdminEvent(organizationId, "customer_billing_line_item_added", {
    invoiceId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function updateLineItemAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceId = stringField(formData, "invoice_id");
  const lineItemId = stringField(formData, "line_item_id");
  const lineType = stringField(formData, "line_type");
  const quantity = parsePositiveMoney(stringField(formData, "quantity"));
  const unitAmount = parseSignedMoney(stringField(formData, "unit_amount"));
  const description = stringField(formData, "description");
  if (
    !isUuid(invoiceId) ||
    !isUuid(lineItemId) ||
    !isLineItemType(lineType) ||
    quantity === null ||
    unitAmount === null ||
    description.length < 2
  ) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await updateInvoiceLineItem({
    organizationId,
    invoiceId,
    lineItemId,
    lineType,
    description,
    quantity,
    unitAmount,
  });
  if (!result.ok) redirect(`/opzix-admin/customers/${organizationId}?error=billing`);
  await recordAdminEvent(organizationId, "customer_billing_line_item_updated", {
    invoiceId,
    lineItemId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/billing");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function removeLineItemAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceId = stringField(formData, "invoice_id");
  const lineItemId = stringField(formData, "line_item_id");
  const confirmed = stringField(formData, "confirm_remove") === "yes";
  if (!isUuid(invoiceId) || !isUuid(lineItemId) || !confirmed) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await removeInvoiceLineItem({
    organizationId,
    invoiceId,
    lineItemId,
  });
  if (!result.ok) redirect(`/opzix-admin/customers/${organizationId}?error=billing`);
  await recordAdminEvent(organizationId, "customer_billing_line_item_removed", {
    invoiceId,
    lineItemId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/billing");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function issueInvoiceAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceId = stringField(formData, "invoice_id");
  if (!isUuid(invoiceId)) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await issueInvoice({ organizationId, invoiceId });
  if (!result.ok) {
    redirect(
      `/opzix-admin/customers/${organizationId}?error=${billingIssueErrorCode(result.error)}`,
    );
  }
  await recordAdminEvent(organizationId, "customer_billing_invoice_issued", {
    invoiceId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/billing");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function recordPaymentAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceId = stringField(formData, "invoice_id");
  const amount = parsePositiveMoney(stringField(formData, "amount"));
  const paymentMethod = stringField(formData, "payment_method");
  const receivedOn = stringField(formData, "received_on");
  const idempotencyKey = stringField(formData, "payment_idempotency_key");
  if (
    !isUuid(invoiceId) ||
    amount === null ||
    !isPaymentMethod(paymentMethod) ||
    !isDateField(receivedOn) ||
    !idempotencyKey
  ) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const similarPayments = await findSimilarInvoicePayments({
    organizationId,
    invoiceId,
    amount,
    paymentMethod,
    receivedOn,
  });
  const result = await recordInvoicePayment({
    organizationId,
    invoiceId,
    amount,
    paymentMethod,
    receivedOn,
    externalTransactionRef: stringField(formData, "external_transaction_ref"),
    idempotencyKey,
    internalNote: stringField(formData, "internal_note"),
  });
  if (!result.ok) {
    redirect(
      `/opzix-admin/customers/${organizationId}?error=${billingPaymentErrorCode(result.error)}`,
    );
  }
  await recordAdminEvent(organizationId, "customer_billing_payment_recorded", {
    invoiceId,
    amount: String(amount),
    possibleDuplicatePaymentCount: String(similarPayments.length),
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/billing");
  redirect(
    `/opzix-admin/customers/${organizationId}?action=${similarPayments.length ? "payment-review" : "saved"}`,
  );
}

async function reversePaymentAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const paymentId = stringField(formData, "payment_id");
  if (!isUuid(paymentId)) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await reverseInvoicePayment({
    organizationId,
    paymentId,
    internalNote: "Admin reversal from Customer Hub.",
  });
  if (!result.ok) {
    redirect(
      `/opzix-admin/customers/${organizationId}?error=${billingPaymentErrorCode(result.error)}`,
    );
  }
  await recordAdminEvent(organizationId, "customer_billing_payment_reversed", {
    paymentId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/billing");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function voidInvoiceAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const invoiceId = stringField(formData, "invoice_id");
  if (!isUuid(invoiceId)) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await voidInvoice({ organizationId, invoiceId });
  if (!result.ok) redirect(`/opzix-admin/customers/${organizationId}?error=billing`);
  await recordAdminEvent(organizationId, "customer_billing_invoice_voided", {
    invoiceId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/billing");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function addBillingNoteAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) throw new Error("Unauthorized billing action.");
  const organizationId = validOrganizationId(formData);
  const note = stringField(formData, "note");
  if (note.length < 2) {
    redirect(`/opzix-admin/customers/${organizationId}?error=billing-invalid`);
  }
  const result = await addBillingNote({ organizationId, note });
  if (!result.ok) redirect(`/opzix-admin/customers/${organizationId}?error=billing`);
  await recordAdminEvent(organizationId, "customer_billing_note_added");
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function uploadAdminDocumentAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized document action.");
  }
  const organizationId = validOrganizationId(formData);
  const category = stringField(formData, "category");
  const visibility = stringField(formData, "visibility");
  const title = stringField(formData, "title");
  const file = formData.get("file");
  if (
    !isDocumentCategory(category) ||
    !isDocumentVisibility(visibility) ||
    title.length < 2 ||
    !(file instanceof File)
  ) {
    redirect(`/opzix-admin/customers/${organizationId}?error=document`);
  }
  const result = await uploadCustomerDocument({
    organizationId,
    source: "opzix_admin",
    title,
    category,
    visibility,
    file,
  });
  if (!result.ok) throw new Error(result.error);
  await recordAdminEvent(organizationId, "customer_document_uploaded", {
    category,
    visibility,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/documents");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function archiveAdminDocumentAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized document action.");
  }
  const organizationId = validOrganizationId(formData);
  const documentId = stringField(formData, "document_id");
  if (!isUuid(documentId)) {
    redirect(`/opzix-admin/customers/${organizationId}?error=document`);
  }
  const archived = await archiveCustomerDocument({ organizationId, documentId });
  if (!archived.ok) throw new Error(archived.error);
  if (!archived.data.length) throw new Error("Document was not found.");
  await recordAdminEvent(organizationId, "customer_document_archived", {
    documentId,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/documents");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
}

async function requestDocumentAction(formData: FormData) {
  "use server";
  if (!(await isAdminAuthenticated())) {
    throw new Error("Unauthorized document action.");
  }
  const organizationId = validOrganizationId(formData);
  const category = stringField(formData, "category");
  const title = stringField(formData, "title");
  if (!isDocumentCategory(category) || title.length < 2) {
    redirect(`/opzix-admin/customers/${organizationId}?error=document`);
  }
  const result = await createDocumentRequest({
    organizationId,
    category,
    title,
    message: stringField(formData, "message"),
  });
  if (!result.ok) throw new Error(result.error);
  await recordAdminEvent(organizationId, "customer_document_requested", {
    category,
  });
  revalidatePath(`/opzix-admin/customers/${organizationId}`);
  revalidatePath("/app/documents");
  redirect(`/opzix-admin/customers/${organizationId}?action=saved`);
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

async function loadPlanOptions() {
  const result = await supabaseAdminFetch<PlanRow[]>("plans", {
    query: {
      select: "id,code,name,status",
      status: "eq.active",
      order: "name.asc",
    },
  });
  if (!result.ok) throw new Error(result.error);
  return result.data;
}

async function planByCode(planCode: string) {
  const result = await supabaseAdminFetch<PlanRow[]>("plans", {
    query: {
      select: "id,code,name,status",
      code: `eq.${planCode}`,
      status: "eq.active",
      limit: 1,
    },
  });
  if (!result.ok) throw new Error(result.error);
  return result.data[0] ?? null;
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

function Dependency({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-dark-border bg-white/[0.025] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-primary">{value}</p>
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

function splitCustomerName(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseMoney(value: string) {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function parsePositiveMoney(value: string) {
  const amount = parseMoney(value);
  return amount !== null && amount > 0 ? amount : null;
}

function parseSignedMoney(value: string) {
  if (!/^-?\d{1,10}(\.\d{1,2})?$/.test(value)) return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function validOrganizationId(formData: FormData) {
  const organizationId = stringField(formData, "organization_id");
  if (!isUuid(organizationId)) throw new Error("Invalid organization reference.");
  return organizationId;
}

function isDateField(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isPaymentReversed(
  payments: { payment_kind: string; reversal_of_payment_id: string | null }[],
  paymentId: string,
) {
  return payments.some(
    (payment) =>
      payment.payment_kind === "reversal" &&
      payment.reversal_of_payment_id === paymentId,
  );
}

function dateOrUndefined(value: string) {
  return isDateField(value) ? value : undefined;
}

function billingIssueErrorCode(error: string) {
  if (/positive line item|at least one/i.test(error)) {
    return "billing-issue-empty";
  }
  if (/only draft/i.test(error)) {
    return "billing-issue-state";
  }
  return "billing-issue-failed";
}

function billingPaymentErrorCode(error: string) {
  if (/issued invoices|must be issued/i.test(error)) {
    return "billing-payment-invoice-state";
  }
  if (/exceeds.*outstanding|outstanding invoice balance/i.test(error)) {
    return "billing-payment-exceeds-balance";
  }
  if (/already been recorded|already submitted|duplicate/i.test(error)) {
    return "billing-payment-duplicate";
  }
  if (/idempotency key was reused|transaction reference/i.test(error)) {
    return "billing-payment-conflict";
  }
  return "billing-payment-failed";
}

function isInvoiceType(value: string): value is InvoiceType {
  return invoiceTypes.includes(value as InvoiceType);
}

function isLineItemType(value: string): value is LineItemType {
  return lineItemTypes.includes(value as LineItemType);
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod);
}

function isDocumentCategory(value: string): value is CustomerDocumentCategory {
  return documentCategories.includes(value as CustomerDocumentCategory);
}

function isDocumentVisibility(value: string): value is CustomerDocumentVisibility {
  return value === "customer_visible" || value === "internal";
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
