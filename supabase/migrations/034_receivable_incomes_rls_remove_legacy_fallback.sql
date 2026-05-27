-- Remove legacy NULL-organization fallback from receivable_incomes RLS.
-- Preconditions:
-- - public.receivable_incomes.organization_id is NOT NULL.
-- - Legacy rows were backfilled or quarantined before this migration.

alter table public.receivable_incomes enable row level security;

drop policy if exists "receivable_incomes_select_organization_or_legacy" on public.receivable_incomes;
drop policy if exists "receivable_incomes_insert_owner_organization_or_legacy" on public.receivable_incomes;
drop policy if exists "receivable_incomes_update_owner_organization_or_legacy" on public.receivable_incomes;
drop policy if exists "receivable_incomes_delete_owner_organization_or_legacy" on public.receivable_incomes;

create policy "receivable_incomes_select_organization"
  on public.receivable_incomes
  for select
  using (public.is_organization_member(organization_id));

create policy "receivable_incomes_insert_owner_organization"
  on public.receivable_incomes
  for insert
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "receivable_incomes_update_owner_organization"
  on public.receivable_incomes
  for update
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  )
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "receivable_incomes_delete_owner_organization"
  on public.receivable_incomes
  for delete
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );
