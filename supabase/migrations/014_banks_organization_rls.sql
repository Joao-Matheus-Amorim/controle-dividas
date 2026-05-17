-- FamilyFinance SaaS multi-tenant transition
-- Adds organization-aware RLS policies for banks only.
--
-- Transitional rule:
-- - rows with organization_id use organization membership for reads;
-- - writes remain restricted to row owner during transition;
-- - legacy rows with organization_id IS NULL remain accessible only to their owner_id.
--
-- Banks are historical records. RLS must not depend on family_members.is_active.
--
-- This migration does not:
-- - make organization_id NOT NULL;
-- - remove owner_id;
-- - change other tables;
-- - change routes or billing.

alter table public.banks enable row level security;

drop policy if exists "banks_select_own" on public.banks;
drop policy if exists "banks_insert_own" on public.banks;
drop policy if exists "banks_update_own" on public.banks;
drop policy if exists "banks_delete_own" on public.banks;

create policy "banks_select_organization_or_legacy"
on public.banks
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

create policy "banks_insert_owner_organization_or_legacy"
on public.banks
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

create policy "banks_update_owner_organization_or_legacy"
on public.banks
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

create policy "banks_delete_owner_organization_or_legacy"
on public.banks
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
