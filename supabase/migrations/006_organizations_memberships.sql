-- FamilyFinance SaaS multi-tenant base
-- Creates organizations and organization_memberships without touching existing financial tables.
-- This migration is intentionally small and non-destructive.

create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_auth_user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_status_check check (status in ('active', 'trialing', 'past_due', 'suspended', 'cancelled')),
  constraint organizations_plan_check check (plan in ('free', 'family_basic', 'family_plus', 'family_pro')),
  constraint organizations_slug_format_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, auth_user_id),
  constraint organization_memberships_role_check check (role in ('owner', 'admin', 'adult', 'child', 'custom', 'member'))
);

create index if not exists organizations_owner_auth_user_id_idx
  on public.organizations(owner_auth_user_id);

create index if not exists organizations_slug_idx
  on public.organizations(slug);

create index if not exists organizations_status_idx
  on public.organizations(status);

create index if not exists organization_memberships_auth_user_id_idx
  on public.organization_memberships(auth_user_id);

create index if not exists organization_memberships_organization_id_idx
  on public.organization_memberships(organization_id);

create index if not exists organization_memberships_organization_role_idx
  on public.organization_memberships(organization_id, role);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

-- RLS helper functions.
-- These functions avoid recursive RLS policies on organization_memberships.
-- Do not replace these helpers with policies that query organization_memberships
-- directly from organization_memberships policies, because that can trigger 42P17.

create or replace function public.current_user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id
  from public.organization_memberships m
  where m.auth_user_id = auth.uid()
    and m.is_active = true;
$$;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.auth_user_id = auth.uid()
      and m.is_active = true
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.auth_user_id = auth.uid()
      and m.is_active = true
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function public.current_user_organization_ids() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;

grant execute on function public.current_user_organization_ids() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;

create policy "organizations_select_member"
on public.organizations
for select
using (public.is_organization_member(id));

create policy "organizations_insert_owner"
on public.organizations
for insert
with check (owner_auth_user_id = auth.uid());

create policy "organizations_update_owner_or_admin"
on public.organizations
for update
using (public.is_organization_admin(id))
with check (public.is_organization_admin(id));

create policy "organizations_delete_owner"
on public.organizations
for delete
using (
  exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = organizations.id
      and m.auth_user_id = auth.uid()
      and m.is_active = true
      and m.role = 'owner'
  )
);

create policy "organization_memberships_select_member"
on public.organization_memberships
for select
using (public.is_organization_member(organization_id));

create policy "organization_memberships_insert_admin"
on public.organization_memberships
for insert
with check (public.is_organization_admin(organization_id));

create policy "organization_memberships_update_admin"
on public.organization_memberships
for update
using (public.is_organization_admin(organization_id))
with check (public.is_organization_admin(organization_id));

create policy "organization_memberships_delete_admin"
on public.organization_memberships
for delete
using (public.is_organization_admin(organization_id));
