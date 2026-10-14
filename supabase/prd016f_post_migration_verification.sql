-- PRD-016F read-only post-migration verification.
-- Run the membership fingerprint query immediately before and after migration;
-- the two rows must be identical.

-- 1. Membership/invitation baseline fingerprint (run before and after).
select
  (select count(*) from public.organization_members) as membership_count,
  (select md5(coalesce(string_agg(
      jsonb_build_array(
        id, organization_id, user_id, role, status,
        invited_at, joined_at, created_at, updated_at
      )::text,
      E'\n' order by id
    ), '')) from public.organization_members) as membership_fingerprint,
  (select count(*) from public.organization_invitations) as invitation_count,
  (select md5(coalesce(string_agg(
      jsonb_build_array(
        id, organization_id, email, role, status, auth_user_id,
        invitation_state, invited_at, accepted_at, updated_at
      )::text,
      E'\n' order by id
    ), '')) from public.organization_invitations) as invitation_fingerprint;

-- 2. Tables, RLS, and policy inventory. relrowsecurity must be true.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced,
  count(p.policyname) as policy_count
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
left join pg_catalog.pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relname in (
    'customer_activation_invitation_tokens',
    'customer_activation_email_challenges'
  )
group by n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
order by c.relname;

-- 3. Required hash and reservation columns.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and (
    (table_name = 'customer_activation_invitation_tokens'
      and column_name in ('token_hash', 'consumed_at', 'revoked_at', 'superseded_at'))
    or
    (table_name = 'customer_activation_email_challenges'
      and column_name in (
        'code_hash', 'delivery_status', 'attempt_count', 'consumed_at',
        'reservation_operation_id', 'reservation_state',
        'reservation_created_at', 'reservation_expires_at',
        'password_update_started_at', 'password_update_finished_at',
        'password_update_unknown_at'
      ))
  )
order by table_name, ordinal_position;

-- 4. Foreign keys and check constraints, including reservation states.
select
  conrelid::regclass as table_name,
  conname as constraint_name,
  contype as constraint_type,
  pg_catalog.pg_get_constraintdef(oid, true) as definition
from pg_catalog.pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid in (
    'public.customer_activation_invitation_tokens'::regclass,
    'public.customer_activation_email_challenges'::regclass
  )
order by conrelid::regclass::text, conname;

-- 5. Active-token uniqueness. This must be a unique partial index on invitation_id.
select indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and tablename = 'customer_activation_invitation_tokens'
order by indexname;

-- 6. Exact function identities, owners, SECURITY DEFINER, and search paths.
with expected(name, identity_args) as (
  values
    ('create_customer_activation_email_challenge', 'text, uuid, text, timestamp with time zone'),
    ('record_customer_activation_email_challenge_delivery', 'uuid, boolean'),
    ('reserve_customer_activation_password_setup', 'text, uuid, text, uuid'),
    ('record_customer_activation_password_setup_result', 'text, uuid, uuid, text'),
    ('finalize_customer_activation_with_reservation', 'text, uuid, uuid, uuid, text'),
    ('reconcile_customer_activation_password_setup', 'uuid, uuid, uuid, uuid, text'),
    ('verify_customer_activation_email_code', 'text, uuid, text'),
    ('activate_customer_invitation_with_token', 'text, uuid, uuid, text')
)
select
  e.name as expected_name,
  e.identity_args as expected_identity_args,
  p.oid is not null as exists,
  pg_catalog.pg_get_userbyid(p.proowner) as owner,
  p.prosecdef as security_definer,
  p.proconfig as function_config
from expected e
left join pg_catalog.pg_proc p
  on p.pronamespace = 'public'::regnamespace
  and p.proname = e.name
  and pg_catalog.pg_get_function_identity_arguments(p.oid) = e.identity_args
order by e.name;

-- 7. Execute privileges. Expected: anon=false, authenticated=false,
-- service_role=true only for the six active RPCs. Deprecated bypass RPCs
-- must be false for all three roles.
with functions(signature, active) as (
  values
    ('public.create_customer_activation_email_challenge(text,uuid,text,timestamp with time zone)', true),
    ('public.record_customer_activation_email_challenge_delivery(uuid,boolean)', true),
    ('public.reserve_customer_activation_password_setup(text,uuid,text,uuid)', true),
    ('public.record_customer_activation_password_setup_result(text,uuid,uuid,text)', true),
    ('public.finalize_customer_activation_with_reservation(text,uuid,uuid,uuid,text)', true),
    ('public.reconcile_customer_activation_password_setup(uuid,uuid,uuid,uuid,text)', true),
    ('public.verify_customer_activation_email_code(text,uuid,text)', false),
    ('public.activate_customer_invitation_with_token(text,uuid,uuid,text)', false)
)
select
  signature,
  active,
  pg_catalog.has_function_privilege('anon', signature, 'EXECUTE') as anon_execute,
  pg_catalog.has_function_privilege('authenticated', signature, 'EXECUTE') as authenticated_execute,
  pg_catalog.has_function_privilege('service_role', signature, 'EXECUTE') as service_role_execute
from functions
order by signature;

-- 8. Direct table privileges. anon/authenticated must have none; service_role
-- may have privileges because application access is server-side only.
select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'customer_activation_invitation_tokens',
    'customer_activation_email_challenges'
  )
order by table_name, grantee, privilege_type;

-- 9. No alternate public activation function may bypass reservation.
select
  p.proname,
  pg_catalog.pg_get_function_identity_arguments(p.oid) as identity_arguments,
  pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
  pg_catalog.has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
from pg_catalog.pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname ilike '%activation%'
order by p.proname, identity_arguments;

-- 10. Unknown-outcome reconciliation must require a non-null exact Auth marker
-- and must not contain a transition to password_failed.
select
  pg_catalog.pg_get_functiondef(
    'public.reconcile_customer_activation_password_setup(uuid,uuid,uuid,uuid,text)'::regprocedure
  ) ilike '%p_observed_operation_id is null%' as rejects_absent_marker,
  pg_catalog.pg_get_functiondef(
    'public.reconcile_customer_activation_password_setup(uuid,uuid,uuid,uuid,text)'::regprocedure
  ) not ilike '%resolution := ''password_failed''%' as no_inconclusive_failure_transition;
