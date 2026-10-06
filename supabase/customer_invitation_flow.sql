-- PRD-016C: safe, idempotent organization setup and invitation lifecycle.
-- Apply after customer_accounts.sql.

alter table public.organizations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.organization_invitations
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists invitation_state text not null default 'draft',
  add column if not exists last_error text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.organization_invitations
  drop constraint if exists organization_invitations_invitation_state_check;
alter table public.organization_invitations
  add constraint organization_invitations_invitation_state_check
  check (invitation_state in (
    'draft',
    'invite_pending',
    'invited',
    'activated',
    'invite_failed'
  ));

update public.organization_invitations
set invitation_state = case
  when status = 'accepted' and auth_user_id is not null then 'activated'
  when status = 'accepted' then 'invite_failed'
  when status = 'sent' then 'invited'
  when status in ('expired', 'revoked') then 'invite_failed'
  else 'draft'
end
where invitation_state = 'draft';

create table if not exists public.organization_commercial_terms (
  organization_id uuid primary key
    references public.organizations(id) on delete cascade,
  setup_fee numeric(12, 2) not null default 0 check (setup_fee >= 0),
  monthly_subscription numeric(12, 2) not null default 0
    check (monthly_subscription >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_onboarding_requests (
  request_id uuid primary key,
  organization_id uuid not null unique
    references public.organizations(id) on delete cascade,
  invitation_id uuid not null unique
    references public.organization_invitations(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, status)
values ('custom', 'Custom', 'active')
on conflict (code) do update
set name = excluded.name,
    status = excluded.status,
    updated_at = now();

create index if not exists organization_invitations_org_updated_idx
  on public.organization_invitations(organization_id, updated_at desc);
create index if not exists organization_invitations_auth_user_idx
  on public.organization_invitations(auth_user_id);

alter table public.organization_commercial_terms enable row level security;
alter table public.customer_onboarding_requests enable row level security;

revoke all on public.organization_commercial_terms from anon, authenticated;
revoke all on public.customer_onboarding_requests from anon, authenticated;
grant all on public.organization_commercial_terms to service_role;
grant all on public.customer_onboarding_requests to service_role;
grant all on public.organizations to service_role;
grant all on public.organization_invitations to service_role;

create or replace function public.create_customer_onboarding(
  p_request_id uuid,
  p_customer_name text,
  p_business_name text,
  p_email text,
  p_organization_type text,
  p_plan_code text,
  p_setup_fee numeric,
  p_monthly_subscription numeric
)
returns table (
  organization_id uuid,
  invitation_id uuid,
  was_created boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_request public.customer_onboarding_requests%rowtype;
  customer_parts text[];
  first_name_value text;
  last_name_value text;
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
  organization_id_value uuid;
  invitation_id_value uuid;
  plan_id_value uuid;
begin
  if p_request_id is null
    or coalesce(trim(p_customer_name), '') = ''
    or coalesce(trim(p_business_name), '') = ''
    or coalesce(trim(p_email), '') = ''
    or p_organization_type is null
    or p_plan_code is null
    or p_setup_fee is null
    or p_monthly_subscription is null
    or p_setup_fee < 0
    or p_monthly_subscription < 0
    or p_organization_type not in ('agent', 'team', 'brokerage', 'other')
    or p_plan_code not in ('launch', 'growth', 'performance', 'brokerage', 'custom')
  then
    raise exception 'Invalid customer onboarding request';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_id::text, 0));

  select * into existing_request
  from public.customer_onboarding_requests requests
  where requests.request_id = p_request_id;

  if found then
    return query
      select existing_request.organization_id, existing_request.invitation_id, false;
    return;
  end if;

  select id into plan_id_value
  from public.plans
  where code = p_plan_code and status = 'active'
  limit 1;

  if plan_id_value is null then
    raise exception 'The selected plan is not available';
  end if;

  customer_parts := regexp_split_to_array(trim(p_customer_name), '\s+');
  first_name_value := customer_parts[1];
  last_name_value := nullif(
    trim(substr(trim(p_customer_name), length(first_name_value) + 1)),
    ''
  );

  base_slug := trim(both '-' from regexp_replace(
    lower(trim(p_business_name)),
    '[^a-z0-9]+',
    '-',
    'g'
  ));
  base_slug := left(coalesce(nullif(base_slug, ''), 'customer'), 72);
  candidate_slug := base_slug;

  perform pg_advisory_xact_lock(hashtextextended(base_slug, 0));
  while exists (
    select 1 from public.organizations organizations
    where organizations.slug = candidate_slug
  ) loop
    suffix := suffix + 1;
    candidate_slug := left(base_slug, 72 - length(suffix::text) - 1)
      || '-' || suffix::text;
  end loop;

  insert into public.organizations (
    name,
    slug,
    organization_type,
    status,
    metadata
  ) values (
    trim(p_business_name),
    candidate_slug,
    p_organization_type,
    'onboarding',
    jsonb_build_object(
      'source', 'opzix-admin/customers',
      'is_qa', false
    )
  )
  returning id into organization_id_value;

  insert into public.organization_subscriptions (
    organization_id,
    plan_id,
    status
  ) values (
    organization_id_value,
    plan_id_value,
    'active'
  );

  insert into public.organization_commercial_terms (
    organization_id,
    setup_fee,
    monthly_subscription
  ) values (
    organization_id_value,
    p_setup_fee,
    p_monthly_subscription
  );

  insert into public.organization_onboarding (
    organization_id,
    current_step,
    completion_percent,
    status
  ) values (
    organization_id_value,
    'account',
    0,
    'not_started'
  );

  insert into public.organization_invitations (
    organization_id,
    email,
    role,
    plan_code,
    status,
    invitation_state,
    first_name,
    last_name,
    metadata
  ) values (
    organization_id_value,
    lower(trim(p_email)),
    'owner',
    p_plan_code,
    'pending',
    'draft',
    first_name_value,
    last_name_value,
    jsonb_build_object('source', 'opzix-admin/customers')
  )
  returning id into invitation_id_value;

  insert into public.customer_onboarding_requests (
    request_id,
    organization_id,
    invitation_id
  ) values (
    p_request_id,
    organization_id_value,
    invitation_id_value
  );

  insert into public.customer_account_audit_events (
    organization_id,
    event_name,
    target_type,
    target_id,
    metadata
  ) values (
    organization_id_value,
    'customer_created',
    'organization',
    organization_id_value::text,
    jsonb_build_object('plan_code', p_plan_code, 'source', 'opzix-admin')
  );

  return query select organization_id_value, invitation_id_value, true;
end;
$$;

revoke all on function public.create_customer_onboarding(
  uuid, text, text, text, text, text, numeric, numeric
) from public, anon, authenticated;
grant execute on function public.create_customer_onboarding(
  uuid, text, text, text, text, text, numeric, numeric
) to service_role;

create or replace function public.activate_customer_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.organization_invitations%rowtype;
  now_value timestamptz := now();
begin
  select * into invitation
  from public.organization_invitations
  where id = p_invitation_id
  for update;

  if not found
    or invitation.auth_user_id is null
    or invitation.auth_user_id <> p_user_id
    or lower(invitation.email) <> lower(trim(p_email))
    or invitation.invitation_state not in (
      'invite_pending', 'invited', 'activated', 'invite_failed'
    )
  then
    raise exception 'Invitation is not assigned to this authenticated account';
  end if;

  if exists (
    select 1 from public.organizations
    where id = invitation.organization_id and status = 'archived'
  ) then
    raise exception 'Archived organizations cannot activate invitations';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    invited_at,
    joined_at
  ) values (
    invitation.organization_id,
    p_user_id,
    'owner',
    'active',
    invitation.invited_at,
    now_value
  )
  on conflict (organization_id, user_id) do update
  set role = excluded.role,
      status = 'active',
      joined_at = coalesce(
        public.organization_members.joined_at,
        excluded.joined_at
      ),
      updated_at = now_value;

  insert into public.profiles (
    user_id,
    first_name,
    last_name,
    preferred_name,
    updated_at
  ) values (
    p_user_id,
    invitation.first_name,
    invitation.last_name,
    nullif(concat_ws(' ', invitation.first_name, invitation.last_name), ''),
    now_value
  )
  on conflict (user_id) do update
  set first_name = excluded.first_name,
      last_name = excluded.last_name,
      preferred_name = excluded.preferred_name,
      updated_at = now_value;

  update public.organization_invitations
  set auth_user_id = p_user_id,
      status = 'accepted',
      invitation_state = 'activated',
      accepted_at = now_value,
      updated_at = now_value,
      last_error = null
  where id = invitation.id;

  insert into public.customer_account_audit_events (
    organization_id,
    event_name,
    target_type,
    target_id,
    metadata
  ) values (
    invitation.organization_id,
    'customer_invitation_activated',
    'organization_invitation',
    invitation.id::text,
    jsonb_build_object('user_id', p_user_id)
  );

  return true;
end;
$$;

revoke all on function public.activate_customer_invitation(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.activate_customer_invitation(uuid, uuid, text)
  to service_role;

create or replace function public.link_customer_invitation(
  p_invitation_id uuid,
  p_user_id uuid,
  p_delivery text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation public.organization_invitations%rowtype;
  now_value timestamptz := now();
begin
  if p_delivery not in ('supabase-auth', 'resend') then
    raise exception 'Invalid invitation delivery method';
  end if;

  select * into invitation
  from public.organization_invitations
  where id = p_invitation_id
  for update;

  if not found
    or (invitation.auth_user_id is not null and invitation.auth_user_id <> p_user_id)
  then
    raise exception 'Invitation cannot be linked to this Auth user';
  end if;

  if exists (
    select 1 from public.organizations
    where id = invitation.organization_id and status = 'archived'
  ) then
    raise exception 'Archived organizations cannot receive invitations';
  end if;

  insert into public.organization_members (
    organization_id,
    user_id,
    role,
    status,
    invited_at
  ) values (
    invitation.organization_id,
    p_user_id,
    invitation.role,
    case when invitation.invitation_state = 'activated'
      then 'active' else 'invited' end,
    now_value
  )
  on conflict (organization_id, user_id) do update
  set role = excluded.role,
      status = case
        when invitation.invitation_state = 'activated'
          or public.organization_members.status = 'active' then 'active'
        else 'invited'
      end,
      invited_at = coalesce(
        public.organization_members.invited_at,
        excluded.invited_at
      ),
      updated_at = now_value;

  update public.organization_invitations
  set auth_user_id = p_user_id,
      status = case when invitation.invitation_state = 'activated'
        then 'accepted' else 'sent' end,
      invitation_state = case when invitation.invitation_state = 'activated'
        then 'activated' else 'invited' end,
      invited_at = case when invitation.invitation_state = 'activated'
        then invitation.invited_at else now_value end,
      updated_at = now_value,
      last_error = null
  where id = invitation.id;

  insert into public.customer_account_audit_events (
    organization_id,
    event_name,
    target_type,
    target_id,
    metadata
  ) values (
    invitation.organization_id,
    case when invitation.invitation_state = 'activated'
      then 'customer_invitation_resent_after_activation'
      else 'customer_invitation_sent' end,
    'organization_invitation',
    invitation.id::text,
    jsonb_build_object(
      'delivery', p_delivery,
      'actor', 'opzix-admin-session'
    )
  );

  return case when invitation.invitation_state = 'activated'
    then 'activated' else 'invited' end;
end;
$$;

revoke all on function public.link_customer_invitation(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.link_customer_invitation(uuid, uuid, text)
  to service_role;

create or replace function public.archive_qa_customer(
  p_organization_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  organization public.organizations%rowtype;
  now_value timestamptz := now();
begin
  select * into organization
  from public.organizations
  where id = p_organization_id
  for update;

  if not found
    or coalesce(organization.metadata->>'is_qa', 'false') <> 'true'
  then
    raise exception 'Only explicitly marked QA organizations can be archived';
  end if;

  update public.organizations
  set status = 'archived',
      updated_at = now_value
  where id = organization.id;

  update public.organization_members
  set status = 'suspended',
      updated_at = now_value
  where organization_id = organization.id
    and status in ('active', 'invited');

  insert into public.customer_account_audit_events (
    organization_id,
    event_name,
    target_type,
    target_id,
    metadata
  ) values (
    organization.id,
    'qa_organization_archived',
    'organization',
    organization.id::text,
    jsonb_build_object('actor', 'opzix-admin-session')
  );

  return true;
end;
$$;

revoke all on function public.archive_qa_customer(uuid)
  from public, anon, authenticated;
grant execute on function public.archive_qa_customer(uuid)
  to service_role;
