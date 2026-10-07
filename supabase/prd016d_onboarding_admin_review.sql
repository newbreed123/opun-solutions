-- PRD-016D Part 4: onboarding review, notes, information requests, and asset metadata.
-- Apply after supabase/customer_accounts.sql.

create extension if not exists "pgcrypto";

alter table public.organization_onboarding
  add column if not exists submitted_by_user_id uuid null references auth.users(id) on delete set null;

insert into storage.buckets (id, name, public)
values ('customer-assets', 'customer-assets', false)
on conflict (id) do update
set public = false;

create table if not exists public.organization_onboarding_reviews (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  review_status text not null default 'submitted'
    check (
      review_status in (
        'submitted',
        'under_review',
        'information_requested',
        'ready_for_implementation',
        'approved_for_launch_work'
      )
    ),
  original_submitted_at timestamptz null,
  last_customer_update_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_onboarding_internal_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  note text not null check (length(trim(note)) > 0),
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_onboarding_information_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'open'
    check (status in ('open', 'resolved', 'cancelled')),
  requested_items jsonb not null default '[]'::jsonb,
  message text null,
  created_by text null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create table if not exists public.organization_onboarding_assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section text not null,
  asset_type text not null,
  bucket text not null,
  object_path text not null,
  filename text null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid null references auth.users(id) on delete set null,
  uploaded_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, bucket, object_path)
);

create table if not exists public.organization_launch_status (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  current_stage text not null default 'onboarding_received'
    check (
      current_stage in (
        'onboarding_received',
        'discovery_review',
        'mls_brokerage_approval',
        'brand_content',
        'website_development',
        'ai_lead_setup',
        'quality_assurance',
        'client_review',
        'ready_to_launch',
        'live'
      )
    ),
  progress_percent integer not null default 10 check (progress_percent between 0 and 100),
  customer_status text null,
  latest_update text null,
  next_customer_action text null,
  estimated_launch_window text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_launch_updates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stage text not null
    check (
      stage in (
        'onboarding_received',
        'discovery_review',
        'mls_brokerage_approval',
        'brand_content',
        'website_development',
        'ai_lead_setup',
        'quality_assurance',
        'client_review',
        'ready_to_launch',
        'live'
      )
    ),
  progress_percent integer not null check (progress_percent between 0 and 100),
  customer_message text null,
  next_customer_action text null,
  estimated_launch_window text null,
  created_by text null,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_onboarding_data_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  section text not null,
  previous_data_json jsonb null,
  new_data_json jsonb not null,
  changed_at timestamptz not null default now()
);

create index if not exists onboarding_review_status_idx
  on public.organization_onboarding_reviews(review_status);
create index if not exists onboarding_notes_org_created_idx
  on public.organization_onboarding_internal_notes(organization_id, created_at desc);
create index if not exists onboarding_info_requests_org_status_idx
  on public.organization_onboarding_information_requests(organization_id, status, created_at desc);
create index if not exists onboarding_assets_org_section_idx
  on public.organization_onboarding_assets(organization_id, section, created_at desc);
create index if not exists onboarding_data_history_org_created_idx
  on public.organization_onboarding_data_history(organization_id, changed_at desc);
create index if not exists organization_launch_updates_org_created_idx
  on public.organization_launch_updates(organization_id, created_at desc);

alter table public.organization_onboarding_reviews enable row level security;
alter table public.organization_onboarding_internal_notes enable row level security;
alter table public.organization_onboarding_information_requests enable row level security;
alter table public.organization_onboarding_assets enable row level security;
alter table public.organization_onboarding_data_history enable row level security;
alter table public.organization_launch_status enable row level security;
alter table public.organization_launch_updates enable row level security;

drop policy if exists "Members can read onboarding review" on public.organization_onboarding_reviews;
create policy "Members can read onboarding review"
  on public.organization_onboarding_reviews for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read onboarding information requests" on public.organization_onboarding_information_requests;
create policy "Members can read onboarding information requests"
  on public.organization_onboarding_information_requests for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read onboarding assets" on public.organization_onboarding_assets;
create policy "Members can read onboarding assets"
  on public.organization_onboarding_assets for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read launch status" on public.organization_launch_status;
create policy "Members can read launch status"
  on public.organization_launch_status for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read launch updates" on public.organization_launch_updates;
create policy "Members can read launch updates"
  on public.organization_launch_updates for select
  to authenticated
  using (public.is_active_org_member(organization_id));

drop policy if exists "Members can read own customer asset objects" on storage.objects;
create policy "Members can read own customer asset objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'customer-assets'
    and public.is_active_org_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Members can insert own customer asset objects" on storage.objects;
create policy "Members can insert own customer asset objects"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'customer-assets'
    and public.is_active_org_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Members can update own customer asset objects" on storage.objects;
create policy "Members can update own customer asset objects"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'customer-assets'
    and public.is_active_org_member((storage.foldername(name))[1]::uuid)
  )
  with check (
    bucket_id = 'customer-assets'
    and public.is_active_org_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Members can delete own customer asset objects" on storage.objects;
create policy "Members can delete own customer asset objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'customer-assets'
    and public.is_active_org_member((storage.foldername(name))[1]::uuid)
  );

revoke all on public.organization_onboarding_reviews from anon, authenticated;
revoke all on public.organization_onboarding_internal_notes from anon, authenticated;
revoke all on public.organization_onboarding_information_requests from anon, authenticated;
revoke all on public.organization_onboarding_assets from anon, authenticated;
revoke all on public.organization_onboarding_data_history from anon, authenticated;
revoke all on public.organization_launch_status from anon, authenticated;
revoke all on public.organization_launch_updates from anon, authenticated;

grant select on public.organization_onboarding_reviews to authenticated;
grant select on public.organization_onboarding_information_requests to authenticated;
grant select on public.organization_onboarding_assets to authenticated;
grant select on public.organization_launch_status to authenticated;
grant select on public.organization_launch_updates to authenticated;

grant all on public.organization_onboarding_reviews to service_role;
grant all on public.organization_onboarding_internal_notes to service_role;
grant all on public.organization_onboarding_information_requests to service_role;
grant all on public.organization_onboarding_assets to service_role;
grant all on public.organization_onboarding_data_history to service_role;
grant all on public.organization_launch_status to service_role;
grant all on public.organization_launch_updates to service_role;

create or replace function public.sync_onboarding_review_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'submitted' then
    insert into public.organization_onboarding_reviews (
      organization_id,
      review_status,
      original_submitted_at,
      last_customer_update_at,
      updated_at
    )
    values (
      new.organization_id,
      'submitted',
      new.submitted_at,
      new.updated_at,
      now()
    )
    on conflict (organization_id) do update
    set original_submitted_at = coalesce(
          public.organization_onboarding_reviews.original_submitted_at,
          excluded.original_submitted_at
        ),
        last_customer_update_at = excluded.last_customer_update_at,
        updated_at = now();
  elsif exists (
    select 1
    from public.organization_onboarding_reviews reviews
    where reviews.organization_id = new.organization_id
  ) then
    update public.organization_onboarding_reviews
    set last_customer_update_at = new.updated_at,
        updated_at = now()
    where organization_id = new.organization_id;
  end if;

  return new;
end;
$$;

drop trigger if exists organization_onboarding_review_snapshot on public.organization_onboarding;
create trigger organization_onboarding_review_snapshot
after insert or update on public.organization_onboarding
for each row execute function public.sync_onboarding_review_snapshot();

create or replace function public.capture_onboarding_data_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.data_json is distinct from new.data_json then
    insert into public.organization_onboarding_data_history (
      organization_id,
      section,
      previous_data_json,
      new_data_json,
      changed_at
    )
    values (
      new.organization_id,
      new.section,
      case when tg_op = 'UPDATE' then old.data_json else null end,
      new.data_json,
      now()
    );
  end if;

  return new;
end;
$$;

drop trigger if exists organization_onboarding_data_history_capture on public.organization_onboarding_data;
create trigger organization_onboarding_data_history_capture
after insert or update on public.organization_onboarding_data
for each row execute function public.capture_onboarding_data_history();
