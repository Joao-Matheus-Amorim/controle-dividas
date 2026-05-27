-- Remove legacy NULL-organization fallback from expenses RLS.
-- Gate 4 scope: public.expenses only.
--
-- Preconditions:
-- - 022_expenses_organization_scope_hardening.sql has made
--   public.expenses.organization_id NOT NULL.
-- - Gated RLS coverage exists for authenticated user isolation.
--
-- Rollback:
-- See docs/runbooks/EXPENSES_RLS_FALLBACK_REMOVAL.md for concrete SQL.

alter table public.expenses enable row level security;

drop policy if exists "expenses_select_organization_or_legacy" on public.expenses;
drop policy if exists "expenses_insert_owner_organization_or_legacy" on public.expenses;
drop policy if exists "expenses_update_owner_organization_or_legacy" on public.expenses;
drop policy if exists "expenses_delete_owner_organization_or_legacy" on public.expenses;

create policy "expenses_select_organization"
on public.expenses
for select
using (public.is_organization_member(organization_id));

create policy "expenses_insert_owner_organization"
on public.expenses
for insert
with check (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "expenses_update_owner_organization"
on public.expenses
for update
using (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
)
with check (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "expenses_delete_owner_organization"
on public.expenses
for delete
using (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

