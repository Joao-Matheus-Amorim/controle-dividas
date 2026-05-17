-- FamilyFinance SaaS multi-tenant transition
-- Hotfix for expense_categories write policies.
--
-- The previous organization-aware write policies allowed any active organization
-- member to update or delete rows in the same organization. During the current
-- transition, application writes are still owner-scoped, so RLS writes must also
-- require row ownership.
--
-- This migration keeps organization-aware reads, while restricting update/delete
-- to the row owner. It does not change other tables.

alter table public.expense_categories enable row level security;

drop policy if exists "expense_categories_update_organization_or_legacy" on public.expense_categories;
drop policy if exists "expense_categories_delete_organization_or_legacy" on public.expense_categories;

create policy "expense_categories_update_owner_organization_or_legacy"
on public.expense_categories
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

create policy "expense_categories_delete_owner_organization_or_legacy"
on public.expense_categories
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
