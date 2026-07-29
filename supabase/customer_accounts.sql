-- PRD-016: Opzix customer accounts, onboarding, and entitlements.
--
-- Apply this after the existing Supabase bootstrap scripts. The application
-- reads these tables from trusted server code and uses RLS as the tenant
-- isolation boundary for future direct authenticated reads.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text null,
  last_name text null,
  preferred_name text null,
  phone text null,
  avatar_url text null,
  timezone text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  organization_type text not null default 'agent'
    check (organization_type in ('agent', 'team', 'brokerage', 'other')),
  timezone text not null default 'America/New_York',
  status text not null default 'active'
    check (status in ('active', 'onboarding', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner'
    check (role in ('owner', 'admin', 'agent', 'staff', 'viewer')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_at timestamptz null,
  joined_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'active'
    check (status in ('active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.features (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text null,
  category text not null default 'platform',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_features (
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  access_level text not null default 'available'
    check (access_level in ('available', 'unavailable', 'available_with_limit')),
  limits_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, feature_id)
);

create table if not exists public.organization_subscriptions (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  status text not null default 'active'
    check (status in ('trialing', 'active', 'past_due', 'cancelled', 'suspended')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz null,
  external_subscription_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_feature_overrides (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  enabled boolean not null,
  limits_json jsonb not null default '{}'::jsonb,
  reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, feature_id)
);

create table if not exists public.organization_onboarding (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  current_step text not null default 'account',
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'submitted', 'reviewed')),
  submitted_at timestamptz null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_onboarding_data (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section text not null,
  data_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (organization_id, section)
);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null default 'owner'
    check (role in ('owner', 'admin', 'agent', 'staff', 'viewer')),
  plan_code text null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'accepted', 'expired', 'revoked')),
  invited_by uuid null references auth.users(id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.customer_account_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid null references auth.users(id) on delete set null,
  organization_id uuid null references public.organizations(id) on delete cascade,
  event_name text not null,
  target_type text null,
  target_id text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

insert into public.plans (code, name, status)
values
  ('launch', 'Launch', 'active'),
  ('growth', 'Growth', 'active'),
  ('performance', 'Performance', 'active'),
  ('brokerage', 'Brokerage', 'active')
on conflict (code) do update
set name = excluded.name,
    status = excluded.status,
    updated_at = now();

insert into public.features (code, name, description, category)
values
  ('idx_property_search', 'IDX Property Search', 'MLS/IDX-powered home search experience.', 'platform'),
  ('crm', 'CRM', 'Contact organization and follow-up foundation.', 'operations'),
  ('ai_property_assistant', 'AI Buyer Advisor', 'AI guidance for buyer questions and next steps.', 'ai'),
  ('analytics', 'Analytics', 'Core platform activity and conversion visibility.', 'intelligence'),
  ('automated_follow_up', 'Automated Follow-up', 'Repeatable follow-up reminders and workflows.', 'automation'),
  ('advanced_crm', 'Advanced CRM', 'Deeper pipeline and sales visibility.', 'operations'),
  ('ai_isa', 'AI ISA', 'AI-supported lead qualification and booking workflows.', 'ai'),
  ('client_portal', 'Client Portal', 'Future buyer and seller portal foundations.', 'platform'),
  ('internal_ai', 'Internal AI Assistant', 'Private business assistant for internal operations.', 'ai'),
  ('team_management', 'Team Management', 'Team member management and operating visibility.', 'brokerage'),
  ('lead_routing', 'Lead Routing', 'Route leads to the right person or workflow.', 'brokerage'),
  ('brokerage_reporting', 'Brokerage Reporting', 'Brokerage-level dashboards and reporting.', 'brokerage'),
  ('google_ads_management', 'Google Ads Management', 'Professional service for paid acquisition.', 'services'),
  ('google_business_management', 'Google Business Profile Management', 'Professional service for local visibility.', 'services'),
  ('advanced_seo', 'Advanced SEO', 'Professional service for search visibility.', 'services')
on conflict (code) do update
set name = excluded.name,
    description = excluded.description,
    category = excluded.category,
    updated_at = now();

with plan_feature_seed(plan_code, feature_code, access_level, limits_json) as (
  values
    ('launch', 'idx_property_search', 'available', '{}'::jsonb),
    ('launch', 'crm', 'available', '{}'::jsonb),
    ('launch', 'ai_property_assistant', 'available', '{}'::jsonb),
    ('launch', 'analytics', 'available_with_limit', '{"level":"foundation"}'::jsonb),
    ('growth', 'idx_property_search', 'available', '{}'::jsonb),
    ('growth', 'crm', 'available', '{}'::jsonb),
    ('growth', 'analytics', 'available', '{}'::jsonb),
    ('growth', 'ai_property_assistant', 'available', '{}'::jsonb),
    ('growth', 'automated_follow_up', 'available', '{}'::jsonb),
    ('growth', 'advanced_crm', 'available', '{}'::jsonb),
    ('performance', 'idx_property_search', 'available', '{}'::jsonb),
    ('performance', 'crm', 'available', '{}'::jsonb),
    ('performance', 'analytics', 'available', '{}'::jsonb),
    ('performance', 'ai_property_assistant', 'available', '{}'::jsonb),
    ('performance', 'automated_follow_up', 'available', '{}'::jsonb),
    ('performance', 'advanced_crm', 'available', '{}'::jsonb),
    ('performance', 'ai_isa', 'available', '{}'::jsonb),
    ('performance', 'client_portal', 'available_with_limit', '{"status":"preview"}'::jsonb),
    ('performance', 'internal_ai', 'available', '{}'::jsonb),
    ('brokerage', 'idx_property_search', 'available', '{}'::jsonb),
    ('brokerage', 'crm', 'available', '{}'::jsonb),
    ('brokerage', 'analytics', 'available', '{}'::jsonb),
    ('brokerage', 'ai_property_assistant', 'available', '{}'::jsonb),
    ('brokerage', 'automated_follow_up', 'available', '{}'::jsonb),
    ('brokerage', 'advanced_crm', 'available', '{}'::jsonb),
    ('brokerage', 'ai_isa', 'available', '{}'::jsonb),
    ('brokerage', 'client_portal', 'available', '{}'::jsonb),
    ('brokerage', 'internal_ai', 'available', '{}'::jsonb),
    ('brokerage', 'team_management', 'available', '{}'::jsonb),
    ('brokerage', 'lead_routing', 'available', '{}'::jsonb),
    ('brokerage', 'brokerage_reporting', 'available', '{}'::jsonb)
)
insert into public.plan_features (plan_id, feature_id, access_level, limits_json)
select plans.id, features.id, seed.access_level, seed.limits_json
from plan_feature_seed seed
join public.plans plans on plans.code = seed.plan_code
join public.features features on features.code = seed.feature_code
on conflict (plan_id, feature_id) do update
set access_level = excluded.access_level,
    limits_json = excluded.limits_json,
    updated_at = now();

create index if not exists organizations_status_idx on public.organizations(status);
create index if not exists organization_members_user_status_idx on public.organization_members(user_id, status);
create index if not exists organization_members_org_status_idx on public.organization_members(organization_id, status);
create index if not exists organization_invitations_email_idx on public.organization_invitations(email);
create index if not exists customer_account_audit_events_org_created_idx on public.customer_account_audit_events(organization_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.plans enable row level security;
alter table public.features enable row level security;
alter table public.plan_features enable row level security;
alter table public.organization_subscriptions enable row level security;
alter table public.organization_feature_overrides enable row level security;
alter table public.organization_onboarding enable row level security;
alter table public.organization_onboarding_data enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.customer_account_audit_events enable row level security;

create or replace function public.is_active_org_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members memberships
    where memberships.organization_id = target_organization_id
      and memberships.user_id = auth.uid()
      and memberships.status = 'active'
  );
$$;

create or replace function public.active_org_role(target_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select memberships.role
  from public.organization_members memberships
  where memberships.organization_id = target_organization_id
    and memberships.user_id = auth.uid()
    and memberships.status = 'active'
  limit 1;
$$;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Members can read organizations" on public.organizations;
create policy "Members can read organizations"
  on public.organizations for select
  to authenticated
  using (public.is_active_org_member(id));

drop policy if exists "Members can read memberships" on public.organization_members;
create policy "Members can read memberships"
  on public.organization_members for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Authenticated users can read active plans" on public.plans;
create policy "Authenticated users can read active plans"
  on public.plans for select
  to authenticated
  using (status = 'active');

drop policy if exists "Authenticated users can read features" on public.features;
create policy "Authenticated users can read features"
  on public.features for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can read plan features" on public.plan_features;
create policy "Authenticated users can read plan features"
  on public.plan_features for select
  to authenticated
  using (true);

drop policy if exists "Members can read subscriptions" on public.organization_subscriptions;
create policy "Members can read subscriptions"
  on public.organization_subscriptions for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read feature overrides" on public.organization_feature_overrides;
create policy "Members can read feature overrides"
  on public.organization_feature_overrides for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read onboarding" on public.organization_onboarding;
create policy "Members can read onboarding"
  on public.organization_onboarding for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Admins can update onboarding" on public.organization_onboarding;
create policy "Admins can update onboarding"
  on public.organization_onboarding for update
  to authenticated
  using (public.active_org_role(organization_id) in ('owner', 'admin'))
  with check (public.active_org_role(organization_id) in ('owner', 'admin'));

drop policy if exists "Members can read onboarding data" on public.organization_onboarding_data;
create policy "Members can read onboarding data"
  on public.organization_onboarding_data for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Admins can write onboarding data" on public.organization_onboarding_data;
create policy "Admins can write onboarding data"
  on public.organization_onboarding_data for all
  to authenticated
  using (public.active_org_role(organization_id) in ('owner', 'admin'))
  with check (public.active_org_role(organization_id) in ('owner', 'admin'));

revoke all on public.profiles from anon;
revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;
revoke all on public.organization_subscriptions from anon;
revoke all on public.organization_feature_overrides from anon;
revoke all on public.organization_onboarding from anon;
revoke all on public.organization_onboarding_data from anon;
revoke all on public.organization_invitations from anon;
revoke all on public.customer_account_audit_events from anon;

grant all on public.profiles to service_role;
grant all on public.organizations to service_role;
grant all on public.organization_members to service_role;
grant all on public.plans to service_role;
grant all on public.features to service_role;
grant all on public.plan_features to service_role;
grant all on public.organization_subscriptions to service_role;
grant all on public.organization_feature_overrides to service_role;
grant all on public.organization_onboarding to service_role;
grant all on public.organization_onboarding_data to service_role;
grant all on public.organization_invitations to service_role;
grant all on public.customer_account_audit_events to service_role;
