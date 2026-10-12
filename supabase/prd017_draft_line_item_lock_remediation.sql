-- PRD-017: Serialize draft invoice line-item mutations with invoice issuance.
-- Apply after supabase/prd017_billing_documents_business_hub.sql.
-- This patch replaces only the existing trigger function. It does not modify
-- invoice, payment, line-item, document, or customer records.

create or replace function public.prevent_non_draft_line_item_change()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_invoice_id uuid;
  invoice_status text;
  invoice_org uuid;
  line_item_org uuid;
begin
  if tg_op = 'UPDATE' then
    if new.invoice_id is distinct from old.invoice_id then
      raise exception 'Invoice line item invoice cannot be changed.';
    end if;

    if new.organization_id is distinct from old.organization_id then
      raise exception 'Invoice line item organization cannot be changed.';
    end if;
  end if;

  parent_invoice_id := coalesce(new.invoice_id, old.invoice_id);
  line_item_org := coalesce(new.organization_id, old.organization_id);

  select status, organization_id into invoice_status, invoice_org
  from public.customer_billing_invoices
  where id = parent_invoice_id
  for update;

  if invoice_status is distinct from 'draft' then
    raise exception 'Invoice line items can only be changed while the invoice is draft.';
  end if;

  if line_item_org is distinct from invoice_org then
    raise exception 'Line item organization must match invoice organization.';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function public.prevent_non_draft_line_item_change()
  from public, anon, authenticated;
grant execute on function public.prevent_non_draft_line_item_change()
  to service_role;
