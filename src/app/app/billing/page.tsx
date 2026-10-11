import Link from "next/link";
import { FileDown, ReceiptText } from "lucide-react";
import {
  formatCurrency,
  getOrganizationBillingSummary,
  invoiceStatusLabel,
  invoiceTypeLabel,
  paymentMethodLabel,
} from "@/lib/customer-platform/billing";
import {
  documentCategoryLabel,
  listCustomerDocuments,
} from "@/lib/customer-platform/documents";
import { requireCustomerContext } from "@/lib/customer-platform/store";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const context = await requireCustomerContext();
  const [billing, documents] = await Promise.all([
    getOrganizationBillingSummary({ organizationId: context.organization.id }),
    listCustomerDocuments({ organizationId: context.organization.id }),
  ]);
  const billingDocuments = documents.ok
    ? documents.data.filter((document) =>
        ["invoices", "receipts", "agreements"].includes(document.category),
      )
    : [];

  return (
    <div className="grid min-w-0 gap-6">
      <section className="min-w-0 rounded-xl border border-dark-border bg-dark-card p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-cyan">
          Billing
        </p>
        <h1 className="mt-3 text-3xl font-extrabold text-primary">
          Billing for {context.organization.name}
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          View your setup balance, confirmed payments, subscription terms, and
          downloadable billing documents. Opzix does not charge your monthly
          subscription until there is an explicitly approved billing workflow.
        </p>
        {billing.unavailableReason ? (
          <p className="mt-5 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-sm text-amber-100">
            {billing.unavailableReason}
          </p>
        ) : null}
      </section>

      <section className="grid min-w-0 gap-4 md:grid-cols-3">
        <BillingStat title="Setup fee" value={formatCurrency(billing.setupFee)} />
        <BillingStat title="Paid" value={formatCurrency(billing.totalPaid)} />
        <BillingStat
          title="Remaining balance"
          value={formatCurrency(billing.outstandingBalance)}
        />
      </section>

      <section className="min-w-0 rounded-xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Subscription Terms</h2>
        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-dark-border bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Monthly subscription
            </p>
            <p className="mt-2 text-2xl font-extrabold text-primary">
              {formatCurrency(billing.monthlySubscription)} / month
            </p>
          </div>
          <div className="min-w-0 rounded-lg border border-dark-border bg-white/[0.025] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Starts
            </p>
            <p className="mt-2 text-lg font-bold text-primary">
              When your website goes live and billing is explicitly confirmed.
            </p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-xl border border-dark-border bg-dark-card p-5">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-primary">Invoices</h2>
            <p className="mt-2 text-sm text-secondary">
              Balances are calculated from issued invoices and confirmed
              payments.
            </p>
          </div>
          <Link href="/app/support" className="btn btn-secondary min-h-10">
            Billing Support
          </Link>
        </div>
        {billing.invoices.length ? (
          <div className="mt-5 grid gap-4">
            {billing.invoices.map((invoice) => (
              <article
                key={invoice.id}
                className="min-w-0 rounded-lg border border-dark-border bg-white/[0.025] p-4"
              >
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-bold text-primary">
                      {invoice.invoice_number}
                    </p>
                    <p className="mt-1 text-sm text-secondary">
                      {invoiceTypeLabel(invoice.invoice_type)} ·{" "}
                      {invoiceStatusLabel(invoice.status)}
                    </p>
                  </div>
                  <div className="min-w-0 text-left sm:text-right">
                    <p className="break-words font-bold text-primary">
                      {formatCurrency(invoice.total)}
                    </p>
                    <p className="text-sm text-secondary">
                      Remaining {formatCurrency(invoice.outstandingBalance)}
                    </p>
                  </div>
                </div>
                {invoice.customer_description ? (
                  <p className="mt-3 text-sm leading-6 text-secondary">
                    {invoice.customer_description}
                  </p>
                ) : null}
                {invoice.due_condition ? (
                  <p className="mt-3 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 p-3 text-sm text-primary">
                    {invoice.due_condition}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted">
            No customer-facing invoices have been issued yet.
          </p>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Payment History</h2>
        {billing.payments.length ? (
          <div className="mt-4 divide-y divide-dark-border">
            {billing.payments.map((payment) => (
              <div key={payment.id} className="flex min-w-0 flex-wrap justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-primary">
                    {payment.payment_kind === "reversal" ? "Payment reversal" : "Payment received"}
                  </p>
                  <p className="text-secondary">
                    {paymentMethodLabel(payment.payment_method)} ·{" "}
                    {formatDate(payment.received_on)}
                  </p>
                </div>
                <p className="font-bold text-primary">
                  {payment.payment_kind === "reversal" ? "-" : ""}
                  {formatCurrency(payment.amount)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No confirmed payments have been posted to your account yet.
          </p>
        )}
      </section>

      <section className="min-w-0 rounded-xl border border-dark-border bg-dark-card p-5">
        <h2 className="text-xl font-bold text-primary">Billing Documents</h2>
        {billingDocuments.length ? (
          <div className="mt-4 grid gap-3">
            {billingDocuments.map((document) => (
              <div
                key={document.id}
                className="grid min-w-0 gap-3 rounded-lg border border-dark-border bg-white/[0.025] p-3 sm:flex sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-start gap-3 sm:items-center">
                  <ReceiptText className="h-5 w-5 shrink-0 text-brand-cyan" />
                  <div className="min-w-0">
                    <p className="break-words font-semibold text-primary sm:truncate">
                      {document.title}
                    </p>
                    <p className="text-xs text-secondary">
                      {documentCategoryLabel(document.category)} ·{" "}
                      {formatDate(document.created_at)}
                    </p>
                  </div>
                </div>
                {document.downloadUrl ? (
                  <a
                    href={document.downloadUrl}
                    className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-brand-cyan"
                  >
                    <FileDown className="h-4 w-4" />
                    Download
                  </a>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No billing documents have been shared yet.
          </p>
        )}
      </section>
    </div>
  );
}

function BillingStat({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-dark-border bg-dark-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-cyan">
        {title}
      </p>
      <p className="mt-2 break-words text-3xl font-extrabold text-primary">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not dated";
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}
