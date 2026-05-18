-- FamilyFinance SaaS multi-tenant transition
-- Adds organization-aware RLS policies for profiles only.
--
-- Transitional rule:
-- - rows with organization_id use organization membership for reads;
-- - writes remain restricted to row owner during transition;
-- - legacy rows with organization_id IS NULL remain accessible only to their owner_id;
-- - authenticated users can still read their own linked profile through auth_user_id.
--
-- This migration does not:
-- - make organization_id NOT NULL;
-- - remove owner_id;
-- - change permissions tables;
-- - change admin, access-control, routes or billing.

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_family" on public.profiles;
drop policy if exists "profiles_insert_family" on public.profiles;
drop policy if exists "profiles_update_family" on public.profiles;
drop policy if exists "profiles_delete_family" on public.profiles;

create policy "profiles_select_organization_or_legacy"
on public.profiles
for select
using (
  auth_user_id = auth.uid()
  or (
    organization_id is not null
    and public.is_organization_member(organization_id)
  )
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
);

create policy "profiles_insert_owner_organization_or_legacy"
on public.profiles
for insert
with check (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
);

create policy "profiles_update_owner_organization_or_legacy"
on public.profiles
for update
using (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
)
with check (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
);

create policy "profiles_delete_owner_organization_or_legacy"
on public.profiles
for delete
using (
  owner_id = auth.uid()
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
);
