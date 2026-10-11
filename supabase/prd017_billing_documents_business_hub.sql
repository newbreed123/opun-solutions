-- PRD-017: Customer billing ledger, private documents, and Business Hub.
-- Apply after PRD-016, PRD-016D, and PRD-016E migrations.
-- This migration is additive and does not seed real customer billing data.

create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('opzix-internal-documents', 'opzix-internal-documents', false)
on conflict (id) do update
set public = false;

create table if not exists public.customer_billing_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  invoice_number text not null unique,
  invoice_type text not null default 'setup_fee'
    check (invoice_type in ('setup_fee', 'subscription', 'services', 'adjustment', 'other')),
  issue_date date not null default current_date,
  due_date date null,
  due_condition text null,
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'draft'
    check (status in ('draft', 'issued', 'partially_paid', 'paid', 'void')),
  customer_description text null,
  issued_at timestamptz null,
  voided_at timestamptz null,
  created_by text not null default 'opzix-admin-session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_billing_invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  invoice_id uuid not null references public.customer_billing_invoices(id) on delete cascade,
  line_type text not null
    check (line_type in ('setup_fee', 'recurring_subscription', 'approved_service', 'adjustment', 'other')),
  description text not null,
  quantity numeric(12, 2) not null default 1 check (quantity > 0),
  unit_amount numeric(12, 2) not null check (unit_amount >= -1000000 and unit_amount <= 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_billing_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  invoice_id uuid not null references public.customer_billing_invoices(id) on delete restrict,
  payment_kind text not null default 'payment'
    check (payment_kind in ('payment', 'reversal')),
  reversal_of_payment_id uuid null references public.customer_billing_payments(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency = 'USD'),
  payment_method text not null
    check (payment_method in ('zelle', 'bank_transfer', 'check', 'cash', 'card_external', 'other')),
  received_on date not null default current_date,
  external_transaction_ref text null,
  payment_idempotency_key text null,
  payment_request_fingerprint text null,
  internal_note text null,
  recorded_by text not null default 'opzix-admin-session',
  created_at timestamptz not null default now(),
  constraint billing_reversal_requires_source
    check (
      (payment_kind = 'payment' and reversal_of_payment_id is null)
      or (payment_kind = 'reversal' and reversal_of_payment_id is not null)
    ),
  constraint billing_payment_idempotency_required
    check (
      payment_kind <> 'payment'
      or (
        nullif(trim(coalesce(payment_idempotency_key, '')), '') is not null
        and nullif(trim(coalesce(payment_request_fingerprint, '')), '') is not null
      )
    )
);

create table if not exists public.customer_billing_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invoice_id uuid null references public.customer_billing_invoices(id) on delete set null,
  note text not null,
  created_by text not null default 'opzix-admin-session',
  created_at timestamptz not null default now()
);

create table if not exists public.customer_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null
    check (category in (
      'agreements',
      'invoices',
      'receipts',
      'brand_assets',
      'mls_brokerage',
      'business_documents',
      'other'
    )),
  title text not null,
  description text null,
  visibility text not null default 'customer_visible'
    check (visibility in ('customer_visible', 'internal')),
  source text not null default 'opzix_admin'
    check (source in ('opzix_admin', 'customer')),
  status text not null default 'active'
    check (status in ('active', 'replaced', 'deleted')),
  bucket text not null default 'customer-assets',
  object_path text not null,
  filename text not null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  uploaded_by_user_id uuid null references auth.users(id) on delete set null,
  uploaded_by_label text null,
  replaced_by_document_id uuid null references public.customer_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, bucket, object_path)
);

alter table public.customer_documents
  drop constraint if exists customer_documents_visibility_bucket_scope;
alter table public.customer_documents
  add constraint customer_documents_visibility_bucket_scope
  check (
    (visibility = 'customer_visible' and bucket = 'customer-assets')
    or (visibility = 'internal' and bucket = 'opzix-internal-documents')
  );
alter table public.customer_documents
  drop constraint if exists customer_documents_customer_source_visible;
alter table public.customer_documents
  add constraint customer_documents_customer_source_visible
  check (source <> 'customer' or visibility = 'customer_visible');

create table if not exists public.customer_document_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category text not null
    check (category in (
      'agreements',
      'invoices',
      'receipts',
      'brand_assets',
      'mls_brokerage',
      'business_documents',
      'other'
    )),
  title text not null,
  message text null,
  status text not null default 'open'
    check (status in ('open', 'fulfilled', 'cancelled')),
  fulfilled_by_document_id uuid null references public.customer_documents(id) on delete set null,
  created_by text not null default 'opzix-admin-session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  fulfilled_at timestamptz null
);

create index if not exists customer_billing_invoices_org_status_idx
  on public.customer_billing_invoices(organization_id, status, issue_date desc);
create index if not exists customer_billing_line_items_invoice_idx
  on public.customer_billing_invoice_line_items(invoice_id, created_at);
create index if not exists customer_billing_payments_invoice_idx
  on public.customer_billing_payments(invoice_id, created_at);
create unique index if not exists customer_billing_external_ref_idx
  on public.customer_billing_payments(organization_id, external_transaction_ref)
  where external_transaction_ref is not null and payment_kind = 'payment';
create unique index if not exists customer_billing_payment_idempotency_idx
  on public.customer_billing_payments(organization_id, payment_idempotency_key)
  where payment_idempotency_key is not null and payment_kind = 'payment';
create unique index if not exists customer_billing_one_reversal_per_payment_idx
  on public.customer_billing_payments(reversal_of_payment_id)
  where payment_kind = 'reversal';
create index if not exists customer_documents_org_category_idx
  on public.customer_documents(organization_id, category, created_at desc);
create index if not exists customer_document_requests_org_status_idx
  on public.customer_document_requests(organization_id, status, created_at desc);

alter table public.customer_billing_invoices enable row level security;
alter table public.customer_billing_invoice_line_items enable row level security;
alter table public.customer_billing_payments enable row level security;
alter table public.customer_billing_notes enable row level security;
alter table public.customer_documents enable row level security;
alter table public.customer_document_requests enable row level security;

revoke all on public.customer_billing_invoices from public, anon, authenticated;
revoke all on public.customer_billing_invoice_line_items from public, anon, authenticated;
revoke all on public.customer_billing_payments from public, anon, authenticated;
revoke all on public.customer_billing_notes from public, anon, authenticated;
revoke all on public.customer_documents from public, anon, authenticated;
revoke all on public.customer_document_requests from public, anon, authenticated;

grant all on public.customer_billing_invoices to service_role;
grant all on public.customer_billing_invoice_line_items to service_role;
grant all on public.customer_billing_payments to service_role;
grant all on public.customer_billing_notes to service_role;
grant all on public.customer_documents to service_role;
grant all on public.customer_document_requests to service_role;

grant select on public.customer_billing_invoices to authenticated;
grant select on public.customer_billing_invoice_line_items to authenticated;
grant select (
  id,
  organization_id,
  invoice_id,
  payment_kind,
  reversal_of_payment_id,
  amount,
  currency,
  payment_method,
  received_on,
  external_transaction_ref,
  created_at
) on public.customer_billing_payments to authenticated;
grant select on public.customer_documents to authenticated;
grant select on public.customer_document_requests to authenticated;

drop policy if exists "Members can read billing invoices" on public.customer_billing_invoices;
create policy "Members can read billing invoices"
  on public.customer_billing_invoices for select
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read billing line items" on public.customer_billing_invoice_line_items;
create policy "Members can read billing line items"
  on public.customer_billing_invoice_line_items for select
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read billing payments" on public.customer_billing_payments;
create policy "Members can read billing payments"
  on public.customer_billing_payments for select
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read visible documents" on public.customer_documents;
create policy "Members can read visible documents"
  on public.customer_documents for select
  using (
    public.is_active_org_member(organization_id)
    and visibility = 'customer_visible'
    and status = 'active'
  );

drop policy if exists "Members can read document requests" on public.customer_document_requests;
create policy "Members can read document requests"
  on public.customer_document_requests for select
  using (public.is_active_org_member(organization_id));

create or replace function public.customer_invoice_line_total(p_invoice_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(sum(quantity * unit_amount), 0)::numeric(12, 2)
  from public.customer_billing_invoice_line_items
  where invoice_id = p_invoice_id;
$$;

create or replace function public.customer_invoice_payment_total(p_invoice_id uuid)
returns numeric
language sql
stable
set search_path = public
as $$
  select coalesce(sum(
    case
      when payment_kind = 'payment' then amount
      when payment_kind = 'reversal' then -amount
      else 0
    end
  ), 0)::numeric(12, 2)
  from public.customer_billing_payments
  where invoice_id = p_invoice_id;
$$;

create or replace function public.customer_payment_request_fingerprint(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_received_on date,
  p_external_transaction_ref text,
  p_internal_note text,
  p_recorded_by text
)
returns text
language sql
stable
set search_path = public
as $$
  select encode(
    extensions.digest(
      convert_to(
        jsonb_build_object(
          'invoice_id', p_invoice_id,
          'amount', round(p_amount, 2)::text,
          'payment_method', trim(coalesce(p_payment_method, '')),
          'received_on', p_received_on::text,
          'external_transaction_ref', nullif(trim(coalesce(p_external_transaction_ref, '')), ''),
          'internal_note', nullif(trim(coalesce(p_internal_note, '')), ''),
          'recorded_by', coalesce(nullif(trim(coalesce(p_recorded_by, '')), ''), 'opzix-admin-session')
        )::text,
        'UTF8'
      ),
      'sha256'
    ),
    'hex'
  );
$$;

create or replace function public.refresh_customer_invoice_status(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row public.customer_billing_invoices%rowtype;
  invoice_total numeric(12, 2);
  paid_total numeric(12, 2);
  new_status text;
begin
  select * into invoice_row
  from public.customer_billing_invoices
  where id = p_invoice_id
  for update;

  if not found or invoice_row.status in ('draft', 'void') then
    return;
  end if;

  invoice_total := public.customer_invoice_line_total(p_invoice_id);
  paid_total := public.customer_invoice_payment_total(p_invoice_id);

  if invoice_total <= 0 then
    new_status := 'issued';
  elsif paid_total >= invoice_total then
    new_status := 'paid';
  elsif paid_total > 0 then
    new_status := 'partially_paid';
  else
    new_status := 'issued';
  end if;

  update public.customer_billing_invoices
  set status = new_status,
      updated_at = now()
  where id = p_invoice_id;
end;
$$;

create or replace function public.prevent_non_draft_line_item_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  invoice_status text;
  invoice_org uuid;
begin
  select status, organization_id into invoice_status, invoice_org
  from public.customer_billing_invoices
  where id = coalesce(new.invoice_id, old.invoice_id);

  if invoice_status is distinct from 'draft' then
    raise exception 'Invoice line items can only be changed while the invoice is draft.';
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.organization_id is distinct from invoice_org then
    raise exception 'Line item organization must match invoice organization.';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists customer_billing_line_items_draft_only
  on public.customer_billing_invoice_line_items;
create trigger customer_billing_line_items_draft_only
before insert or update or delete on public.customer_billing_invoice_line_items
for each row execute function public.prevent_non_draft_line_item_change();

create or replace function public.prevent_payment_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Billing payments are append-only. Record a reversal instead.';
end;
$$;

drop trigger if exists customer_billing_payments_append_only
  on public.customer_billing_payments;
create trigger customer_billing_payments_append_only
before update or delete on public.customer_billing_payments
for each row execute function public.prevent_payment_mutation();

create or replace function public.validate_customer_billing_payment()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  invoice_row public.customer_billing_invoices%rowtype;
  invoice_total numeric(12, 2);
  paid_total numeric(12, 2);
  source_payment public.customer_billing_payments%rowtype;
begin
  select * into invoice_row
  from public.customer_billing_invoices
  where id = new.invoice_id
  for update;

  if not found then
    raise exception 'Invoice was not found.';
  end if;

  if invoice_row.organization_id is distinct from new.organization_id then
    raise exception 'Payment organization must match invoice organization.';
  end if;

  if invoice_row.status not in ('issued', 'partially_paid', 'paid') then
    raise exception 'Payments can only be recorded for issued invoices.';
  end if;

  invoice_total := public.customer_invoice_line_total(new.invoice_id);
  paid_total := public.customer_invoice_payment_total(new.invoice_id);

  if new.payment_kind = 'payment' then
    new.payment_idempotency_key := nullif(trim(coalesce(new.payment_idempotency_key, '')), '');
    if new.payment_idempotency_key is null then
      raise exception 'Payment idempotency key is required.';
    end if;

    new.payment_request_fingerprint := coalesce(
      nullif(trim(coalesce(new.payment_request_fingerprint, '')), ''),
      public.customer_payment_request_fingerprint(
        new.invoice_id,
        new.amount,
        new.payment_method,
        new.received_on,
        new.external_transaction_ref,
        new.internal_note,
        new.recorded_by
      )
    );

    if paid_total + new.amount > invoice_total then
      raise exception 'Payment exceeds the outstanding invoice balance.';
    end if;
  end if;

  if new.payment_kind = 'reversal' then
    new.payment_idempotency_key := null;
    new.payment_request_fingerprint := null;

    select * into source_payment
    from public.customer_billing_payments
    where id = new.reversal_of_payment_id
    for update;

    if not found
      or source_payment.invoice_id is distinct from new.invoice_id
      or source_payment.organization_id is distinct from new.organization_id
      or source_payment.payment_kind <> 'payment' then
      raise exception 'Payment reversal source is invalid.';
    end if;

    if exists (
      select 1
      from public.customer_billing_payments existing_reversal
      where existing_reversal.reversal_of_payment_id = source_payment.id
        and existing_reversal.payment_kind = 'reversal'
    ) then
      raise exception 'Payment has already been reversed.';
    end if;

    if new.amount is distinct from source_payment.amount then
      raise exception 'PRD-017 V1 supports full payment reversals only.';
    end if;

    if paid_total - new.amount < 0 then
      raise exception 'Payment reversal would create a negative paid balance.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists customer_billing_payments_validate
  on public.customer_billing_payments;
create trigger customer_billing_payments_validate
before insert on public.customer_billing_payments
for each row execute function public.validate_customer_billing_payment();

create or replace function public.refresh_customer_invoice_after_payment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  perform public.refresh_customer_invoice_status(new.invoice_id);
  return new;
end;
$$;

drop trigger if exists customer_billing_payments_refresh_invoice
  on public.customer_billing_payments;
create trigger customer_billing_payments_refresh_invoice
after insert on public.customer_billing_payments
for each row execute function public.refresh_customer_invoice_after_payment();

create or replace function public.issue_customer_billing_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row public.customer_billing_invoices%rowtype;
  invoice_total numeric(12, 2);
begin
  select * into invoice_row
  from public.customer_billing_invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice was not found.';
  end if;
  if invoice_row.status <> 'draft' then
    raise exception 'Only draft invoices can be issued.';
  end if;

  invoice_total := public.customer_invoice_line_total(p_invoice_id);
  if invoice_total <= 0 then
    raise exception 'Invoice must include at least one positive line item before issue.';
  end if;

  update public.customer_billing_invoices
  set status = 'issued',
      issued_at = now(),
      updated_at = now()
  where id = p_invoice_id;
end;
$$;

create or replace function public.record_customer_invoice_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_received_on date,
  p_external_transaction_ref text default null,
  p_idempotency_key text default null,
  p_internal_note text default null,
  p_recorded_by text default 'opzix-admin-session'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_row public.customer_billing_invoices%rowtype;
  existing_payment public.customer_billing_payments%rowtype;
  normalized_idempotency_key text;
  request_fingerprint text;
  violation_constraint text;
  payment_id uuid;
begin
  select * into invoice_row
  from public.customer_billing_invoices
  where id = p_invoice_id
  for update;

  if not found then
    raise exception 'Invoice was not found.';
  end if;

  normalized_idempotency_key := nullif(trim(coalesce(p_idempotency_key, '')), '');
  if normalized_idempotency_key is null then
    raise exception 'Payment idempotency key is required.';
  end if;

  request_fingerprint := public.customer_payment_request_fingerprint(
    invoice_row.id,
    round(p_amount, 2),
    p_payment_method,
    p_received_on,
    p_external_transaction_ref,
    p_internal_note,
    p_recorded_by
  );

  select * into existing_payment
  from public.customer_billing_payments
  where organization_id = invoice_row.organization_id
    and payment_kind = 'payment'
    and payment_idempotency_key = normalized_idempotency_key
  for update;

  if found then
    if existing_payment.payment_request_fingerprint = request_fingerprint then
      return existing_payment.id;
    end if;

    raise exception 'Payment idempotency key was reused with different payment details.';
  end if;

  insert into public.customer_billing_payments (
    organization_id,
    invoice_id,
    payment_kind,
    amount,
    currency,
    payment_method,
    received_on,
    external_transaction_ref,
    payment_idempotency_key,
    payment_request_fingerprint,
    internal_note,
    recorded_by
  )
  values (
    invoice_row.organization_id,
    invoice_row.id,
    'payment',
    round(p_amount, 2),
    invoice_row.currency,
    p_payment_method,
    p_received_on,
    nullif(trim(coalesce(p_external_transaction_ref, '')), ''),
    normalized_idempotency_key,
    request_fingerprint,
    nullif(trim(coalesce(p_internal_note, '')), ''),
    coalesce(nullif(trim(p_recorded_by), ''), 'opzix-admin-session')
  )
  returning id into payment_id;

  return payment_id;
exception
  when unique_violation then
    get stacked diagnostics violation_constraint = constraint_name;
    if violation_constraint = 'customer_billing_external_ref_idx' then
      raise exception 'External transaction reference has already been recorded for this organization.';
    end if;

    select * into existing_payment
    from public.customer_billing_payments
    where organization_id = invoice_row.organization_id
      and payment_kind = 'payment'
      and payment_idempotency_key = normalized_idempotency_key;

    if found and existing_payment.payment_request_fingerprint = request_fingerprint then
      return existing_payment.id;
    end if;

    raise exception 'Payment idempotency key was reused with different payment details.';
end;
$$;

create or replace function public.reverse_customer_invoice_payment(
  p_payment_id uuid,
  p_internal_note text default null,
  p_recorded_by text default 'opzix-admin-session'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_payment public.customer_billing_payments%rowtype;
  reversal_id uuid;
begin
  select * into source_payment
  from public.customer_billing_payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment was not found.';
  end if;
  if source_payment.payment_kind <> 'payment' then
    raise exception 'Only payment entries can be reversed.';
  end if;

  if exists (
    select 1
    from public.customer_billing_payments existing_reversal
    where existing_reversal.reversal_of_payment_id = source_payment.id
      and existing_reversal.payment_kind = 'reversal'
  ) then
    raise exception 'Payment has already been reversed.';
  end if;

  insert into public.customer_billing_payments (
    organization_id,
    invoice_id,
    payment_kind,
    reversal_of_payment_id,
    amount,
    currency,
    payment_method,
    received_on,
    external_transaction_ref,
    internal_note,
    recorded_by
  )
  values (
    source_payment.organization_id,
    source_payment.invoice_id,
    'reversal',
    source_payment.id,
    source_payment.amount,
    source_payment.currency,
    source_payment.payment_method,
    current_date,
    null,
    nullif(trim(coalesce(p_internal_note, '')), ''),
    coalesce(nullif(trim(p_recorded_by), ''), 'opzix-admin-session')
  )
  returning id into reversal_id;

  return reversal_id;
end;
$$;

create or replace function public.void_customer_billing_invoice(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_total numeric(12, 2);
begin
  paid_total := public.customer_invoice_payment_total(p_invoice_id);
  if paid_total <> 0 then
    raise exception 'Invoices with payment history cannot be voided until payments are reversed.';
  end if;

  update public.customer_billing_invoices
  set status = 'void',
      voided_at = now(),
      updated_at = now()
  where id = p_invoice_id
    and status in ('draft', 'issued');

  if not found then
    raise exception 'Invoice cannot be voided.';
  end if;
end;
$$;

revoke all on function public.issue_customer_billing_invoice(uuid) from public, anon, authenticated;
revoke all on function public.record_customer_invoice_payment(uuid, numeric, text, date, text, text, text, text) from public, anon, authenticated;
revoke all on function public.reverse_customer_invoice_payment(uuid, text, text) from public, anon, authenticated;
revoke all on function public.void_customer_billing_invoice(uuid) from public, anon, authenticated;
revoke all on function public.refresh_customer_invoice_status(uuid) from public, anon, authenticated;
revoke all on function public.customer_invoice_line_total(uuid) from public, anon, authenticated;
revoke all on function public.customer_invoice_payment_total(uuid) from public, anon, authenticated;
revoke all on function public.customer_payment_request_fingerprint(uuid, numeric, text, date, text, text, text) from public, anon, authenticated;
revoke all on function public.prevent_non_draft_line_item_change() from public, anon, authenticated;
revoke all on function public.prevent_payment_mutation() from public, anon, authenticated;
revoke all on function public.validate_customer_billing_payment() from public, anon, authenticated;
revoke all on function public.refresh_customer_invoice_after_payment() from public, anon, authenticated;

grant execute on function public.issue_customer_billing_invoice(uuid) to service_role;
grant execute on function public.record_customer_invoice_payment(uuid, numeric, text, date, text, text, text, text) to service_role;
grant execute on function public.reverse_customer_invoice_payment(uuid, text, text) to service_role;
grant execute on function public.void_customer_billing_invoice(uuid) to service_role;
grant execute on function public.refresh_customer_invoice_status(uuid) to service_role;
grant execute on function public.customer_invoice_line_total(uuid) to service_role;
grant execute on function public.customer_invoice_payment_total(uuid) to service_role;
grant execute on function public.customer_payment_request_fingerprint(uuid, numeric, text, date, text, text, text) to service_role;
grant execute on function public.prevent_non_draft_line_item_change() to service_role;
grant execute on function public.prevent_payment_mutation() to service_role;
grant execute on function public.validate_customer_billing_payment() to service_role;
grant execute on function public.refresh_customer_invoice_after_payment() to service_role;
