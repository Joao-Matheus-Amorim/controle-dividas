-- Align expense_categories write policies with organization-admin-scoped category management.
-- Scope: public.expense_categories only.
--
-- Preconditions:
-- - 020_expense_categories_organization_scope_hardening.sql has made
--   public.expense_categories.organization_id NOT NULL.
-- - 030_expense_categories_rls_remove_legacy_fallback.sql has removed the
--   legacy NULL-organization fallback.
--
-- Rollback:
-- Recreate the owner-scoped write policies from migration 030 if category
-- management must temporarily return to owner-only writes.

alter table public.expense_categories enable row level security;

drop policy if exists "expense_categories_insert_owner_organization" on public.expense_categories;
drop policy if exists "expense_categories_update_owner_organization" on public.expense_categories;
drop policy if exists "expense_categories_delete_owner_organization" on public.expense_categories;

create policy "expense_categories_insert_organization"
on public.expense_categories
for insert
with check (
  public.is_organization_admin(organization_id)
);

create policy "expense_categories_update_organization"
on public.expense_categories
for update
using (
  public.is_organization_admin(organization_id)
)
with check (
  public.is_organization_admin(organization_id)
);

create policy "expense_categories_delete_organization"
on public.expense_categories
for delete
using (
  public.is_organization_admin(organization_id)
);
