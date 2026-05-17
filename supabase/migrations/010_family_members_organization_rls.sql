-- FamilyFinance SaaS multi-tenant transition
-- Adds organization-aware RLS policies for family_members only.
--
-- Transitional rule:
-- - rows with organization_id use organization membership for reads;
-- - writes remain restricted to row owner during transition;
-- - legacy rows with organization_id IS NULL remain accessible only to their owner_id.
--
-- This migration does not:
-- - make organization_id NOT NULL;
-- - remove owner_id;
-- - change other tables;
-- - change routes or billing.

alter table public.family_members enable row level security;

drop policy if exists "family_members_select_own" on public.family_members;
drop policy if exists "family_members_insert_own" on public.family_members;
drop policy if exists "family_members_update_own" on public.family_members;
drop policy if exists "family_members_delete_own" on public.family_members;

create policy "family_members_select_organization_or_legacy"
on public.family_members
for select
using (
  (
    organization_id is not null
    and public.is_organization_member(organization_id)
  )
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
);

create policy "family_members_insert_owner_organization_or_legacy"
on public.family_members
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

create policy "family_members_update_owner_organization_or_legacy"
on public.family_members
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
  and organization_id is not null
  and public.is_organization_member(organization_id)
);

create policy "family_members_delete_owner_organization_or_legacy"
on public.family_members
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
