-- PRD-016F: 24-hour customer activation invitations with short-lived email OTP.
-- Prepare-only migration. Do not apply without production approval.

create extension if not exists pgcrypto;

create table if not exists public.customer_activation_invitation_tokens (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  invitation_id uuid not null references public.organization_invitations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  token_hash text not null unique,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_activation_invitation_tokens_email_normalized
    check (email = lower(trim(email))),
  constraint customer_activation_invitation_tokens_expiry_valid
    check (expires_at > issued_at)
);

create table if not exists public.customer_activation_email_challenges (
  id uuid primary key,
  activation_token_id uuid not null references public.customer_activation_invitation_tokens(id) on delete cascade,
  invitation_id uuid not null references public.organization_invitations(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  code_hash text not null,
  delivery_status text not null default 'pending',
  delivery_attempted_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  delivery_failed_at timestamptz,
  expires_at timestamptz not null,
  verified_at timestamptz,
  consumed_at timestamptz,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  reservation_operation_id uuid,
  reservation_state text not null default 'none',
  reservation_created_at timestamptz,
  reservation_expires_at timestamptz,
  password_update_started_at timestamptz,
  password_update_finished_at timestamptz,
  password_update_unknown_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_activation_email_challenges_delivery_status_valid
    check (delivery_status in ('pending', 'sent', 'failed')),
  constraint customer_activation_email_challenges_reservation_state_valid
    check (reservation_state in (
      'none',
      'password_pending',
      'password_failed',
      'password_unknown',
      'password_succeeded',
      'finalized'
    )),
  constraint customer_activation_email_challenges_email_normalized
    check (email = lower(trim(email))),
  constraint customer_activation_email_challenges_expiry_valid
    check (expires_at > delivery_attempted_at)
);

alter table public.customer_activation_email_challenges
  add column if not exists delivery_status text not null default 'pending';
alter table public.customer_activation_email_challenges
  add column if not exists delivery_attempted_at timestamptz not null default now();
alter table public.customer_activation_email_challenges
  add column if not exists delivered_at timestamptz;
alter table public.customer_activation_email_challenges
  add column if not exists delivery_failed_at timestamptz;
alter table public.customer_activation_email_challenges
  add column if not exists reservation_operation_id uuid;
alter table public.customer_activation_email_challenges
  add column if not exists reservation_state text not null default 'none';
alter table public.customer_activation_email_challenges
  add column if not exists reservation_created_at timestamptz;
alter table public.customer_activation_email_challenges
  add column if not exists reservation_expires_at timestamptz;
alter table public.customer_activation_email_challenges
  add column if not exists password_update_started_at timestamptz;
alter table public.customer_activation_email_challenges
  add column if not exists password_update_finished_at timestamptz;
alter table public.customer_activation_email_challenges
  add column if not exists password_update_unknown_at timestamptz;
alter table public.customer_activation_email_challenges
  alter column sent_at drop not null;

create index if not exists customer_activation_invitation_tokens_invitation_idx
  on public.customer_activation_invitation_tokens(invitation_id, created_at desc);
create unique index if not exists customer_activation_invitation_tokens_active_idx
  on public.customer_activation_invitation_tokens(invitation_id)
  where consumed_at is null and revoked_at is null and superseded_at is null;
create index if not exists customer_activation_email_challenges_token_created_idx
  on public.customer_activation_email_challenges(activation_token_id, created_at desc);
create index if not exists customer_activation_email_challenges_invitation_created_idx
  on public.customer_activation_email_challenges(invitation_id, created_at desc);
create index if not exists customer_activation_email_challenges_reservation_idx
  on public.customer_activation_email_challenges(reservation_operation_id)
  where reservation_operation_id is not null;

alter table public.customer_activation_invitation_tokens enable row level security;
alter table public.customer_activation_email_challenges enable row level security;

revoke all on public.customer_activation_invitation_tokens from public, anon, authenticated;
revoke all on public.customer_activation_email_challenges from public, anon, authenticated;
grant all on public.customer_activation_invitation_tokens to service_role;
grant all on public.customer_activation_email_challenges to service_role;

create or replace function public.create_customer_activation_email_challenge(
  p_token_hash text,
  p_challenge_id uuid,
  p_code_hash text,
  p_expires_at timestamptz
)
returns table (
  ok boolean,
  invitation_id uuid,
  organization_id uuid,
  auth_user_id uuid,
  email text,
  business_name text,
  error text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  token_row public.customer_activation_invitation_tokens%rowtype;
  invitation public.organization_invitations%rowtype;
  organization public.organizations%rowtype;
  pending_count integer;
  sent_count integer;
  failed_count integer;
  now_value timestamptz := now();
begin
  if coalesce(trim(p_token_hash), '') = ''
    or p_challenge_id is null
    or coalesce(trim(p_code_hash), '') = ''
    or p_expires_at is null
    or p_expires_at <= now_value
    or p_expires_at > now_value + interval '15 minutes'
  then
    return query select false, null::uuid, null::uuid, null::uuid, null::text, null::text, 'invalid_request';
    return;
  end if;

  select * into token_row
  from public.customer_activation_invitation_tokens
  where token_hash = p_token_hash
  for update;

  if token_row.id is null
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.superseded_at is not null
    or token_row.expires_at <= now_value
  then
    return query select false, null::uuid, null::uuid, null::uuid, null::text, null::text, 'invalid_or_expired_invitation';
    return;
  end if;

  select * into invitation
  from public.organization_invitations
  where id = token_row.invitation_id
  for update;

  select * into organization
  from public.organizations
  where id = token_row.organization_id
  for update;

  if invitation.id is null
    or organization.id is null
    or organization.status = 'archived'
    or invitation.organization_id <> token_row.organization_id
    or invitation.auth_user_id <> token_row.auth_user_id
    or lower(invitation.email) <> token_row.email
    or invitation.invitation_state = 'activated'
  then
    return query select false, null::uuid, null::uuid, null::uuid, null::text, null::text, 'invitation_not_eligible';
    return;
  end if;

  select count(*) into pending_count
  from public.customer_activation_email_challenges
  where activation_token_id = token_row.id
    and delivery_status = 'pending'
    and created_at > now_value - interval '10 minutes';

  select count(*) into sent_count
  from public.customer_activation_email_challenges
  where activation_token_id = token_row.id
    and delivery_status = 'sent'
    and sent_at > now_value - interval '1 hour';

  select count(*) into failed_count
  from public.customer_activation_email_challenges
  where activation_token_id = token_row.id
    and delivery_status = 'failed'
    and delivery_failed_at > now_value - interval '1 hour';

  if pending_count >= 1 or sent_count >= 3 or failed_count >= 6 then
    return query select false, token_row.invitation_id, token_row.organization_id, token_row.auth_user_id, token_row.email, organization.name, 'rate_limited';
    return;
  end if;

  insert into public.customer_activation_email_challenges (
    id,
    activation_token_id,
    invitation_id,
    organization_id,
    auth_user_id,
    email,
    code_hash,
    delivery_status,
    delivery_attempted_at,
    expires_at
  ) values (
    p_challenge_id,
    token_row.id,
    token_row.invitation_id,
    token_row.organization_id,
    token_row.auth_user_id,
    token_row.email,
    p_code_hash,
    'pending',
    now_value,
    p_expires_at
  );

  return query select true, token_row.invitation_id, token_row.organization_id, token_row.auth_user_id, token_row.email, organization.name, null::text;
end;
$$;

create or replace function public.record_customer_activation_email_challenge_delivery(
  p_challenge_id uuid,
  p_delivered boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  challenge public.customer_activation_email_challenges%rowtype;
  now_value timestamptz := now();
begin
  select * into challenge
  from public.customer_activation_email_challenges
  where id = p_challenge_id
  for update;

  if challenge.id is null
    or challenge.consumed_at is not null
    or challenge.delivery_status <> 'pending'
  then
    return false;
  end if;

  if p_delivered then
    update public.customer_activation_email_challenges
    set delivery_status = 'sent',
        sent_at = now_value,
        delivered_at = now_value,
        updated_at = now_value
    where id = challenge.id;
  else
    update public.customer_activation_email_challenges
    set delivery_status = 'failed',
        delivery_failed_at = now_value,
        updated_at = now_value
    where id = challenge.id;
  end if;

  return true;
end;
$$;

create or replace function public.reserve_customer_activation_password_setup(
  p_token_hash text,
  p_challenge_id uuid,
  p_code_hash text,
  p_operation_id uuid
)
returns table (
  ok boolean,
  invitation_id uuid,
  organization_id uuid,
  auth_user_id uuid,
  email text,
  operation_id uuid,
  password_already_set boolean,
  error text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  token_row public.customer_activation_invitation_tokens%rowtype;
  challenge public.customer_activation_email_challenges%rowtype;
  invitation public.organization_invitations%rowtype;
  now_value timestamptz := now();
begin
  select * into token_row
  from public.customer_activation_invitation_tokens
  where token_hash = p_token_hash
  for update;

  select * into challenge
  from public.customer_activation_email_challenges
  where id = p_challenge_id
  for update;

  select * into invitation
  from public.organization_invitations
  where id = token_row.invitation_id
  for update;

  if token_row.id is null
    or challenge.id is null
    or invitation.id is null
    or p_operation_id is null
    or challenge.activation_token_id <> token_row.id
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.superseded_at is not null
    or token_row.expires_at <= now_value
    or challenge.consumed_at is not null
    or challenge.expires_at <= now_value
    or challenge.delivery_status <> 'sent'
    or invitation.invitation_state = 'activated'
    or invitation.auth_user_id <> token_row.auth_user_id
    or invitation.organization_id <> token_row.organization_id
    or lower(invitation.email) <> token_row.email
  then
    return query select false, null::uuid, null::uuid, null::uuid, null::text, null::uuid, false, 'invalid_or_expired_code';
    return;
  end if;

  if exists (
    select 1 from public.organizations
    where id = token_row.organization_id and status = 'archived'
  ) then
    return query select false, challenge.invitation_id, challenge.organization_id, challenge.auth_user_id, challenge.email, null::uuid, false, 'invitation_not_eligible';
    return;
  end if;

  if challenge.attempt_count >= 6 then
    return query select false, challenge.invitation_id, challenge.organization_id, challenge.auth_user_id, challenge.email, null::uuid, false, 'too_many_attempts';
    return;
  end if;

  if challenge.code_hash <> p_code_hash then
    update public.customer_activation_email_challenges
    set attempt_count = attempt_count + 1,
        updated_at = now_value
    where id = challenge.id;
    return query select false, challenge.invitation_id, challenge.organization_id, challenge.auth_user_id, challenge.email, null::uuid, false, 'invalid_code';
    return;
  end if;

  if challenge.reservation_state = 'password_succeeded'
    and challenge.reservation_operation_id is not null
  then
    return query select true, challenge.invitation_id, challenge.organization_id, challenge.auth_user_id, challenge.email, challenge.reservation_operation_id, true, null::text;
    return;
  end if;

  if challenge.reservation_state in ('password_pending', 'password_unknown') then
    if challenge.reservation_state = 'password_pending'
      and challenge.reservation_expires_at <= now_value
    then
      update public.customer_activation_email_challenges
      set reservation_state = 'password_unknown',
          password_update_unknown_at = coalesce(password_update_unknown_at, now_value),
          updated_at = now_value
      where id = challenge.id;
    end if;
    return query select false, challenge.invitation_id, challenge.organization_id, challenge.auth_user_id, challenge.email, null::uuid, false, 'activation_in_progress';
    return;
  end if;

  update public.customer_activation_email_challenges
  set verified_at = coalesce(verified_at, now_value),
      reservation_operation_id = p_operation_id,
      reservation_state = 'password_pending',
      reservation_created_at = now_value,
      reservation_expires_at = now_value + interval '15 minutes',
      password_update_started_at = now_value,
      password_update_finished_at = null,
      password_update_unknown_at = null,
      updated_at = now_value
  where id = challenge.id;

  return query select true, challenge.invitation_id, challenge.organization_id, challenge.auth_user_id, challenge.email, p_operation_id, false, null::text;
end;
$$;

create or replace function public.record_customer_activation_password_setup_result(
  p_token_hash text,
  p_challenge_id uuid,
  p_operation_id uuid,
  p_result text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  token_row public.customer_activation_invitation_tokens%rowtype;
  challenge public.customer_activation_email_challenges%rowtype;
  now_value timestamptz := now();
begin
  if p_result not in ('failed', 'unknown', 'succeeded') then
    return false;
  end if;

  select * into token_row
  from public.customer_activation_invitation_tokens
  where token_hash = p_token_hash
  for update;

  select * into challenge
  from public.customer_activation_email_challenges
  where id = p_challenge_id
  for update;

  if token_row.id is null
    or challenge.id is null
    or challenge.activation_token_id <> token_row.id
    or challenge.reservation_operation_id <> p_operation_id
    or challenge.reservation_state = 'finalized'
  then
    return false;
  end if;

  update public.customer_activation_email_challenges
  set reservation_state = case p_result
        when 'failed' then 'password_failed'
        when 'unknown' then 'password_unknown'
        else 'password_succeeded'
      end,
      password_update_finished_at = case
        when p_result in ('failed', 'succeeded') then now_value
        else password_update_finished_at
      end,
      password_update_unknown_at = case
        when p_result = 'unknown' then now_value
        else password_update_unknown_at
      end,
      updated_at = now_value
  where id = challenge.id;

  return true;
end;
$$;

create or replace function public.finalize_customer_activation_with_reservation(
  p_token_hash text,
  p_challenge_id uuid,
  p_operation_id uuid,
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  token_row public.customer_activation_invitation_tokens%rowtype;
  challenge public.customer_activation_email_challenges%rowtype;
  invitation public.organization_invitations%rowtype;
  now_value timestamptz := now();
begin
  select * into token_row
  from public.customer_activation_invitation_tokens
  where token_hash = p_token_hash
  for update;

  select * into challenge
  from public.customer_activation_email_challenges
  where id = p_challenge_id
  for update;

  select * into invitation
  from public.organization_invitations
  where id = token_row.invitation_id
  for update;

  if token_row.id is null
    or challenge.id is null
    or invitation.id is null
    or p_operation_id is null
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.superseded_at is not null
    or challenge.activation_token_id <> token_row.id
    or challenge.verified_at is null
    or challenge.consumed_at is not null
    or challenge.delivery_status <> 'sent'
    or challenge.reservation_operation_id <> p_operation_id
    or challenge.reservation_state <> 'password_succeeded'
    or token_row.auth_user_id <> p_user_id
    or challenge.auth_user_id <> p_user_id
    or invitation.auth_user_id <> p_user_id
    or token_row.email <> lower(trim(p_email))
    or challenge.email <> lower(trim(p_email))
    or lower(invitation.email) <> lower(trim(p_email))
    or invitation.organization_id <> token_row.organization_id
    or invitation.invitation_state = 'activated'
  then
    raise exception 'Activation reservation is not eligible for this authenticated account';
  end if;

  if exists (
    select 1 from public.organizations
    where id = token_row.organization_id and status = 'archived'
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
    invitation.role,
    'active',
    invitation.invited_at,
    now_value
  )
  on conflict (organization_id, user_id) do update
  set role = excluded.role,
      status = 'active',
      joined_at = coalesce(public.organization_members.joined_at, excluded.joined_at),
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
  set status = 'accepted',
      invitation_state = 'activated',
      accepted_at = now_value,
      updated_at = now_value,
      last_error = null
  where id = invitation.id;

  update public.customer_activation_invitation_tokens
  set consumed_at = now_value,
      updated_at = now_value
  where id = token_row.id;

  update public.customer_activation_email_challenges
  set consumed_at = now_value,
      reservation_state = 'finalized',
      password_update_finished_at = coalesce(password_update_finished_at, now_value),
      updated_at = now_value
  where id = challenge.id;

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
    jsonb_build_object('user_id', p_user_id, 'activation_method', 'application_token_email_otp')
  );

  return true;
end;
$$;

create or replace function public.reconcile_customer_activation_password_setup(
  p_invitation_id uuid,
  p_challenge_id uuid,
  p_operation_id uuid,
  p_observed_operation_id uuid,
  p_support_reference text
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  challenge public.customer_activation_email_challenges%rowtype;
  token_row public.customer_activation_invitation_tokens%rowtype;
  invitation public.organization_invitations%rowtype;
  now_value timestamptz := now();
begin
  if p_invitation_id is null
    or p_challenge_id is null
    or p_operation_id is null
    or p_observed_operation_id is null
    or coalesce(trim(p_support_reference), '') = ''
    or length(trim(p_support_reference)) > 100
  then
    raise exception 'Invalid reconciliation request';
  end if;

  select * into challenge
  from public.customer_activation_email_challenges
  where id = p_challenge_id
  for update;

  select * into token_row
  from public.customer_activation_invitation_tokens
  where id = challenge.activation_token_id
  for update;

  select * into invitation
  from public.organization_invitations
  where id = p_invitation_id
  for update;

  if challenge.id is null
    or token_row.id is null
    or invitation.id is null
    or challenge.invitation_id <> invitation.id
    or token_row.invitation_id <> invitation.id
    or challenge.organization_id <> invitation.organization_id
    or token_row.organization_id <> invitation.organization_id
    or challenge.auth_user_id <> invitation.auth_user_id
    or token_row.auth_user_id <> invitation.auth_user_id
    or challenge.email <> lower(invitation.email)
    or token_row.email <> lower(invitation.email)
    or challenge.reservation_operation_id <> p_operation_id
    or challenge.reservation_state <> 'password_unknown'
    or challenge.consumed_at is not null
    or token_row.consumed_at is not null
    or token_row.revoked_at is not null
    or token_row.superseded_at is not null
    or invitation.invitation_state = 'activated'
  then
    raise exception 'Activation reconciliation binding is invalid';
  end if;

  if p_observed_operation_id <> p_operation_id then
    raise exception 'Auth operation marker belongs to another operation';
  end if;

  update public.customer_activation_email_challenges
  set reservation_state = 'password_succeeded',
      password_update_finished_at = now_value,
      updated_at = now_value
  where id = challenge.id;

  insert into public.customer_account_audit_events (
    organization_id,
    event_name,
    target_type,
    target_id,
    metadata
  ) values (
    invitation.organization_id,
    'customer_activation_password_reconciled',
    'organization_invitation',
    invitation.id::text,
    jsonb_build_object(
      'operation_id', p_operation_id,
      'resolution', 'password_succeeded',
      'support_reference', left(trim(p_support_reference), 100)
    )
  );

  return 'password_succeeded';
end;
$$;

create or replace function public.verify_customer_activation_email_code(
  p_token_hash text,
  p_challenge_id uuid,
  p_code_hash text
)
returns table (
  ok boolean,
  invitation_id uuid,
  organization_id uuid,
  auth_user_id uuid,
  email text,
  error text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query select false, null::uuid, null::uuid, null::uuid, null::text, 'use_reservation_rpc';
end;
$$;

create or replace function public.activate_customer_invitation_with_token(
  p_token_hash text,
  p_challenge_id uuid,
  p_user_id uuid,
  p_email text
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  raise exception 'Use finalize_customer_activation_with_reservation';
end;
$$;

alter function public.create_customer_activation_email_challenge(text, uuid, text, timestamptz)
  owner to postgres;
alter function public.record_customer_activation_email_challenge_delivery(uuid, boolean)
  owner to postgres;
alter function public.reserve_customer_activation_password_setup(text, uuid, text, uuid)
  owner to postgres;
alter function public.record_customer_activation_password_setup_result(text, uuid, uuid, text)
  owner to postgres;
alter function public.finalize_customer_activation_with_reservation(text, uuid, uuid, uuid, text)
  owner to postgres;
alter function public.reconcile_customer_activation_password_setup(uuid, uuid, uuid, uuid, text)
  owner to postgres;
alter function public.verify_customer_activation_email_code(text, uuid, text)
  owner to postgres;
alter function public.activate_customer_invitation_with_token(text, uuid, uuid, text)
  owner to postgres;

revoke all on function public.create_customer_activation_email_challenge(text, uuid, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.record_customer_activation_email_challenge_delivery(uuid, boolean)
  from public, anon, authenticated;
revoke all on function public.reserve_customer_activation_password_setup(text, uuid, text, uuid)
  from public, anon, authenticated;
revoke all on function public.record_customer_activation_password_setup_result(text, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.finalize_customer_activation_with_reservation(text, uuid, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.reconcile_customer_activation_password_setup(uuid, uuid, uuid, uuid, text)
  from public, anon, authenticated;
revoke all on function public.verify_customer_activation_email_code(text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.activate_customer_invitation_with_token(text, uuid, uuid, text)
  from public, anon, authenticated;

grant execute on function public.create_customer_activation_email_challenge(text, uuid, text, timestamptz)
  to service_role;
grant execute on function public.record_customer_activation_email_challenge_delivery(uuid, boolean)
  to service_role;
grant execute on function public.reserve_customer_activation_password_setup(text, uuid, text, uuid)
  to service_role;
grant execute on function public.record_customer_activation_password_setup_result(text, uuid, uuid, text)
  to service_role;
grant execute on function public.finalize_customer_activation_with_reservation(text, uuid, uuid, uuid, text)
  to service_role;
grant execute on function public.reconcile_customer_activation_password_setup(uuid, uuid, uuid, uuid, text)
  to service_role;
