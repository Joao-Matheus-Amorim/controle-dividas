-- FamilyFinance SaaS multi-tenant transition
-- Adds organization-aware RLS policies for expenses only.
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

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

create policy "expenses_select_organization_or_legacy"
on public.expenses
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

create policy "expenses_insert_owner_organization_or_legacy"
on public.expenses
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

create policy "expenses_update_owner_organization_or_legacy"
on public.expenses
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

create policy "expenses_delete_owner_organization_or_legacy"
on public.expenses
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
