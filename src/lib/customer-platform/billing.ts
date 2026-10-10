import { supabaseAdminFetch, supabaseAdminRpc } from "@/lib/supabase-admin";
import type { OrganizationCommercialTermsRow } from "./types";

export type InvoiceStatus =
  | "draft"
  | "issued"
  | "partially_paid"
  | "paid"
  | "void";
export type InvoiceType =
  | "setup_fee"
  | "subscription"
  | "services"
  | "adjustment"
  | "other";
export type LineItemType =
  | "setup_fee"
  | "recurring_subscription"
  | "approved_service"
  | "adjustment"
  | "other";
export type PaymentMethod =
  | "zelle"
  | "bank_transfer"
  | "check"
  | "cash"
  | "card_external"
  | "other";

export type BillingInvoiceRow = {
  id: string;
  organization_id: string;
  invoice_number: string;
  invoice_type: InvoiceType;
  issue_date: string;
  due_date: string | null;
  due_condition: string | null;
  currency: "USD";
  status: InvoiceStatus;
  customer_description: string | null;
  issued_at: string | null;
  voided_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type BillingLineItemRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  line_type: LineItemType;
  description: string;
  quantity: number;
  unit_amount: number;
  created_at: string;
  updated_at: string;
};

export type BillingPaymentRow = {
  id: string;
  organization_id: string;
  invoice_id: string;
  payment_kind: "payment" | "reversal";
  reversal_of_payment_id: string | null;
  amount: number;
  currency: "USD";
  payment_method: PaymentMethod;
  received_on: string;
  external_transaction_ref: string | null;
  payment_idempotency_key: string | null;
  payment_request_fingerprint: string | null;
  internal_note: string | null;
  recorded_by: string;
  created_at: string;
};

export type BillingNoteRow = {
  id: string;
  organization_id: string;
  invoice_id: string | null;
  note: string;
  created_by: string;
  created_at: string;
};

export type BillingInvoice = BillingInvoiceRow & {
  lineItems: BillingLineItemRow[];
  payments: BillingPaymentRow[];
  subtotal: number;
  total: number;
  amountPaid: number;
  outstandingBalance: number;
};

export type BillingSummary = {
  invoices: BillingInvoice[];
  payments: BillingPaymentRow[];
  notes: BillingNoteRow[];
  setupFee: number;
  monthlySubscription: number;
  totalIssued: number;
  totalPaid: number;
  outstandingBalance: number;
  currency: "USD";
  unavailableReason?: string;
};

const BILLING_SELECT =
  "id,organization_id,invoice_number,invoice_type,issue_date,due_date,due_condition,currency,status,customer_description,issued_at,voided_at,created_by,created_at,updated_at";
const LINE_ITEM_SELECT =
  "id,organization_id,invoice_id,line_type,description,quantity,unit_amount,created_at,updated_at";
const PAYMENT_SELECT =
  "id,organization_id,invoice_id,payment_kind,reversal_of_payment_id,amount,currency,payment_method,received_on,external_transaction_ref,payment_idempotency_key,payment_request_fingerprint,internal_note,recorded_by,created_at";

export async function getOrganizationBillingSummary({
  organizationId,
  includeInternalNotes = false,
}: {
  organizationId: string;
  includeInternalNotes?: boolean;
}): Promise<BillingSummary> {
  const [termsResult, invoiceResult, lineItemResult, paymentResult, noteResult] =
    await Promise.all([
      supabaseAdminFetch<OrganizationCommercialTermsRow[]>(
        "organization_commercial_terms",
        {
          query: {
            select:
              "organization_id,setup_fee,monthly_subscription,currency,created_at,updated_at",
            organization_id: `eq.${organizationId}`,
            limit: 1,
          },
        },
      ),
      supabaseAdminFetch<BillingInvoiceRow[]>("customer_billing_invoices", {
        query: {
          select: BILLING_SELECT,
          organization_id: `eq.${organizationId}`,
          order: "issue_date.desc,created_at.desc",
          limit: 100,
        },
      }),
      supabaseAdminFetch<BillingLineItemRow[]>(
        "customer_billing_invoice_line_items",
        {
          query: {
            select: LINE_ITEM_SELECT,
            organization_id: `eq.${organizationId}`,
            order: "created_at.asc",
            limit: 500,
          },
        },
      ),
      supabaseAdminFetch<BillingPaymentRow[]>("customer_billing_payments", {
        query: {
          select: PAYMENT_SELECT,
          organization_id: `eq.${organizationId}`,
          order: "created_at.desc",
          limit: 250,
        },
      }),
      includeInternalNotes
        ? supabaseAdminFetch<BillingNoteRow[]>("customer_billing_notes", {
            query: {
              select:
                "id,organization_id,invoice_id,note,created_by,created_at",
              organization_id: `eq.${organizationId}`,
              order: "created_at.desc",
              limit: 100,
            },
          })
        : Promise.resolve({ ok: true as const, data: [], status: 200 }),
    ]);

  const terms = termsResult.ok ? termsResult.data[0] ?? null : null;
  if (!invoiceResult.ok || !lineItemResult.ok || !paymentResult.ok) {
    return emptyBillingSummary({
      terms,
      unavailableReason:
        "Billing records are not available until the PRD-017 billing migration is applied.",
    });
  }

  const linesByInvoice = groupBy(lineItemResult.data, (item) => item.invoice_id);
  const paymentsByInvoice = groupBy(paymentResult.data, (item) => item.invoice_id);
  const invoices = invoiceResult.data.map((invoice) =>
    enrichInvoice({
      invoice,
      lineItems: linesByInvoice.get(invoice.id) ?? [],
      payments: paymentsByInvoice.get(invoice.id) ?? [],
    }),
  );
  const activeInvoices = invoices.filter((invoice) => invoice.status !== "void");
  const totalIssued = roundMoney(
    activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0),
  );
  const totalPaid = roundMoney(
    paymentResult.data.reduce((sum, payment) => sum + paymentEffect(payment), 0),
  );
  const outstandingBalance = roundMoney(
    activeInvoices.reduce((sum, invoice) => sum + invoice.outstandingBalance, 0),
  );

  return {
    invoices,
    payments: paymentResult.data,
    notes: noteResult.ok ? noteResult.data : [],
    setupFee: Number(terms?.setup_fee ?? 0),
    monthlySubscription: Number(terms?.monthly_subscription ?? 0),
    totalIssued,
    totalPaid,
    outstandingBalance,
    currency: "USD",
  };
}

export async function createDraftInvoice({
  organizationId,
  invoiceType,
  invoiceNumber,
  issueDate,
  dueDate,
  dueCondition,
  customerDescription,
}: {
  organizationId: string;
  invoiceType: InvoiceType;
  invoiceNumber?: string;
  issueDate: string;
  dueDate?: string;
  dueCondition?: string;
  customerDescription?: string;
}) {
  const number = invoiceNumber?.trim() || generatedInvoiceNumber();
  return supabaseAdminFetch<BillingInvoiceRow[]>("customer_billing_invoices", {
    method: "POST",
    body: {
      organization_id: organizationId,
      invoice_number: number,
      invoice_type: invoiceType,
      issue_date: issueDate,
      due_date: dueDate || null,
      due_condition: dueCondition || null,
      currency: "USD",
      status: "draft",
      customer_description: customerDescription || null,
      created_by: "opzix-admin-session",
    },
    prefer: "return=representation",
  });
}

export async function addInvoiceLineItem({
  organizationId,
  invoiceId,
  lineType,
  description,
  quantity,
  unitAmount,
}: {
  organizationId: string;
  invoiceId: string;
  lineType: LineItemType;
  description: string;
  quantity: number;
  unitAmount: number;
}) {
  const invoice = await loadInvoiceForOrganization({ organizationId, invoiceId });
  if (!invoice) return { ok: false as const, error: "Invoice was not found.", status: 404 };

  return supabaseAdminFetch<BillingLineItemRow[]>(
    "customer_billing_invoice_line_items",
    {
      method: "POST",
      body: {
        organization_id: organizationId,
        invoice_id: invoiceId,
        line_type: lineType,
        description,
        quantity,
        unit_amount: unitAmount,
      },
      prefer: "return=representation",
    },
  );
}

export async function issueInvoice({
  organizationId,
  invoiceId,
}: {
  organizationId: string;
  invoiceId: string;
}) {
  const invoice = await loadInvoiceForOrganization({ organizationId, invoiceId });
  if (!invoice) return { ok: false as const, error: "Invoice was not found.", status: 404 };
  return supabaseAdminRpc<null>("issue_customer_billing_invoice", {
    p_invoice_id: invoiceId,
  });
}

export async function recordInvoicePayment({
  organizationId,
  invoiceId,
  amount,
  paymentMethod,
  receivedOn,
  externalTransactionRef,
  idempotencyKey,
  internalNote,
}: {
  organizationId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receivedOn: string;
  externalTransactionRef?: string;
  idempotencyKey: string;
  internalNote?: string;
}) {
  const invoice = await loadInvoiceForOrganization({ organizationId, invoiceId });
  if (!invoice) return { ok: false as const, error: "Invoice was not found.", status: 404 };
  if (!idempotencyKey.trim()) {
    return { ok: false as const, error: "Payment idempotency key is required.", status: 400 };
  }
  return supabaseAdminRpc<string>(
    "record_customer_invoice_payment",
    {
      p_invoice_id: invoiceId,
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_received_on: receivedOn,
      p_external_transaction_ref: externalTransactionRef || null,
      p_idempotency_key: idempotencyKey,
      p_internal_note: internalNote || null,
      p_recorded_by: "opzix-admin-session",
    },
  );
}

export async function reverseInvoicePayment({
  organizationId,
  paymentId,
  internalNote,
}: {
  organizationId: string;
  paymentId: string;
  internalNote?: string;
}) {
  const payment = await loadPaymentForOrganization({ organizationId, paymentId });
  if (!payment) return { ok: false as const, error: "Payment was not found.", status: 404 };
  return supabaseAdminRpc<string>(
    "reverse_customer_invoice_payment",
    {
      p_payment_id: paymentId,
      p_internal_note: internalNote || null,
      p_recorded_by: "opzix-admin-session",
    },
  );
}

export async function findSimilarInvoicePayments({
  organizationId,
  invoiceId,
  amount,
  paymentMethod,
  receivedOn,
}: {
  organizationId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receivedOn: string;
}) {
  const result = await supabaseAdminFetch<BillingPaymentRow[]>(
    "customer_billing_payments",
    {
      query: {
        select: PAYMENT_SELECT,
        organization_id: `eq.${organizationId}`,
        invoice_id: `eq.${invoiceId}`,
        payment_kind: "eq.payment",
        amount: `eq.${roundMoney(amount).toFixed(2)}`,
        payment_method: `eq.${paymentMethod}`,
        received_on: `eq.${receivedOn}`,
        order: "created_at.desc",
        limit: 10,
      },
    },
  );
  return result.ok ? result.data : [];
}

export async function voidInvoice({
  organizationId,
  invoiceId,
}: {
  organizationId: string;
  invoiceId: string;
}) {
  const invoice = await loadInvoiceForOrganization({ organizationId, invoiceId });
  if (!invoice) return { ok: false as const, error: "Invoice was not found.", status: 404 };
  return supabaseAdminRpc<null>("void_customer_billing_invoice", {
    p_invoice_id: invoiceId,
  });
}

export async function addBillingNote({
  organizationId,
  invoiceId,
  note,
}: {
  organizationId: string;
  invoiceId?: string;
  note: string;
}) {
  return supabaseAdminFetch<null>("customer_billing_notes", {
    method: "POST",
    body: {
      organization_id: organizationId,
      invoice_id: invoiceId || null,
      note,
      created_by: "opzix-admin-session",
    },
    prefer: "returning=minimal",
  });
}

export function paymentEffect(payment: BillingPaymentRow) {
  return payment.payment_kind === "reversal"
    ? -Number(payment.amount)
    : Number(payment.amount);
}

export function formatCurrency(value: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export function invoiceStatusLabel(status: InvoiceStatus) {
  return status.replaceAll("_", " ");
}

export function invoiceTypeLabel(type: InvoiceType) {
  switch (type) {
    case "setup_fee":
      return "Setup fee";
    case "subscription":
      return "Subscription";
    case "services":
      return "Approved services";
    case "adjustment":
      return "Adjustment";
    case "other":
      return "Other";
  }
}

export function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "zelle":
      return "Zelle";
    case "bank_transfer":
      return "Bank transfer";
    case "check":
      return "Check";
    case "cash":
      return "Cash";
    case "card_external":
      return "Card, externally confirmed";
    case "other":
      return "Other";
  }
}

function enrichInvoice({
  invoice,
  lineItems,
  payments,
}: {
  invoice: BillingInvoiceRow;
  lineItems: BillingLineItemRow[];
  payments: BillingPaymentRow[];
}): BillingInvoice {
  const subtotal = roundMoney(
    lineItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_amount),
      0,
    ),
  );
  const amountPaid = roundMoney(
    payments.reduce((sum, payment) => sum + paymentEffect(payment), 0),
  );
  const outstandingBalance =
    invoice.status === "void" ? 0 : roundMoney(Math.max(0, subtotal - amountPaid));
  return {
    ...invoice,
    lineItems,
    payments,
    subtotal,
    total: subtotal,
    amountPaid,
    outstandingBalance,
  };
}

async function loadInvoiceForOrganization({
  organizationId,
  invoiceId,
}: {
  organizationId: string;
  invoiceId: string;
}) {
  const result = await supabaseAdminFetch<BillingInvoiceRow[]>(
    "customer_billing_invoices",
    {
      query: {
        select: BILLING_SELECT,
        id: `eq.${invoiceId}`,
        organization_id: `eq.${organizationId}`,
        limit: 1,
      },
    },
  );
  return result.ok ? result.data[0] ?? null : null;
}

async function loadPaymentForOrganization({
  organizationId,
  paymentId,
}: {
  organizationId: string;
  paymentId: string;
}) {
  const result = await supabaseAdminFetch<BillingPaymentRow[]>(
    "customer_billing_payments",
    {
      query: {
        select: PAYMENT_SELECT,
        id: `eq.${paymentId}`,
        organization_id: `eq.${organizationId}`,
        limit: 1,
      },
    },
  );
  return result.ok ? result.data[0] ?? null : null;
}

function groupBy<T>(items: T[], getKey: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = getKey(item);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return grouped;
}

function emptyBillingSummary({
  terms,
  unavailableReason,
}: {
  terms: OrganizationCommercialTermsRow | null;
  unavailableReason?: string;
}): BillingSummary {
  return {
    invoices: [],
    payments: [],
    notes: [],
    setupFee: Number(terms?.setup_fee ?? 0),
    monthlySubscription: Number(terms?.monthly_subscription ?? 0),
    totalIssued: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    currency: "USD",
    unavailableReason,
  };
}

function generatedInvoiceNumber() {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 8).toUpperCase();
  return `OPZIX-${date}-${suffix}`;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
