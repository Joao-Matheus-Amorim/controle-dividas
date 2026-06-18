-- Add organization-scoped catalog for receivable income source options.

create table if not exists public.receivable_income_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists receivable_income_sources_owner_id_idx
  on public.receivable_income_sources(owner_id);

create index if not exists receivable_income_sources_organization_id_idx
  on public.receivable_income_sources(organization_id);

create unique index if not exists receivable_income_sources_organization_name_unique_idx
  on public.receivable_income_sources(organization_id, lower(trim(name)));

alter table public.receivable_income_sources enable row level security;

drop policy if exists "receivable_income_sources_select_organization" on public.receivable_income_sources;
drop policy if exists "receivable_income_sources_insert_organization" on public.receivable_income_sources;
drop policy if exists "receivable_income_sources_update_organization" on public.receivable_income_sources;
drop policy if exists "receivable_income_sources_delete_organization" on public.receivable_income_sources;

create policy "receivable_income_sources_select_organization"
on public.receivable_income_sources
for select
using (
  public.is_organization_member(organization_id)
);

create policy "receivable_income_sources_insert_organization"
on public.receivable_income_sources
for insert
with check (
  public.is_organization_admin(organization_id)
  and public.organization_legacy_owner_matches(organization_id, owner_id)
);

create policy "receivable_income_sources_update_organization"
on public.receivable_income_sources
for update
using (
  public.is_organization_admin(organization_id)
)
with check (
  public.is_organization_admin(organization_id)
  and public.organization_legacy_owner_matches(organization_id, owner_id)
);

create policy "receivable_income_sources_delete_organization"
on public.receivable_income_sources
for delete
using (
  public.is_organization_admin(organization_id)
);
