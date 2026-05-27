-- Remove legacy NULL-organization fallback from expense_categories RLS.
-- Gate 4 scope: public.expense_categories only.
--
-- Preconditions:
-- - 020_expense_categories_organization_scope_hardening.sql has made
--   public.expense_categories.organization_id NOT NULL.
-- - Gated RLS coverage exists for authenticated user isolation.
--
-- Rollback:
-- Recreate the previous policies from migrations 008 and 009 if a production
-- issue requires restoring the transitional owner fallback.

alter table public.expense_categories enable row level security;

drop policy if exists "expense_categories_select_organization_or_legacy" on public.expense_categories;
drop policy if exists "expense_categories_insert_organization_or_legacy" on public.expense_categories;
drop policy if exists "expense_categories_update_organization_or_legacy" on public.expense_categories;
drop policy if exists "expense_categories_delete_organization_or_legacy" on public.expense_categories;
drop policy if exists "expense_categories_update_owner_organization_or_legacy" on public.expense_categories;
drop policy if exists "expense_categories_delete_owner_organization_or_legacy" on public.expense_categories;

create policy "expense_categories_select_organization"
on public.expense_categories
for select
using (public.is_organization_member(organization_id));

create policy "expense_categories_insert_owner_organization"
on public.expense_categories
for insert
with check (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "expense_categories_update_owner_organization"
on public.expense_categories
for update
using (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
)
with check (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "expense_categories_delete_owner_organization"
on public.expense_categories
for delete
using (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

