-- FamilyFinance SaaS multi-tenant transition
-- Adds organization-aware RLS policies for expense_categories only.
-- This migration is intentionally scoped to a single table.
--
-- Transitional rule:
-- - rows with organization_id use organization membership;
-- - legacy rows with organization_id IS NULL remain accessible only to their owner_id.
--
-- This migration does not:
-- - make organization_id NOT NULL;
-- - remove owner_id;
-- - change other tables;
-- - change routes or billing.

alter table public.expense_categories enable row level security;

drop policy if exists "expense_categories_select_own" on public.expense_categories;
drop policy if exists "expense_categories_insert_own" on public.expense_categories;
drop policy if exists "expense_categories_update_own" on public.expense_categories;
drop policy if exists "expense_categories_delete_own" on public.expense_categories;

create policy "expense_categories_select_organization_or_legacy"
on public.expense_categories
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

create policy "expense_categories_insert_organization_or_legacy"
on public.expense_categories
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

create policy "expense_categories_update_organization_or_legacy"
on public.expense_categories
for update
using (
  (
    organization_id is not null
    and public.is_organization_member(organization_id)
  )
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
)
with check (
  owner_id = auth.uid()
  and (
    organization_id is not null
    and public.is_organization_member(organization_id)
  )
);

create policy "expense_categories_delete_organization_or_legacy"
on public.expense_categories
for delete
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
