-- Remove legacy NULL-organization fallback from payable_bills RLS.
-- Preconditions:
-- - public.payable_bills.organization_id is NOT NULL.
-- - Legacy rows were backfilled or quarantined before this migration.

alter table public.payable_bills enable row level security;

drop policy if exists "payable_bills_select_organization_or_legacy" on public.payable_bills;
drop policy if exists "payable_bills_insert_owner_organization_or_legacy" on public.payable_bills;
drop policy if exists "payable_bills_update_owner_organization_or_legacy" on public.payable_bills;
drop policy if exists "payable_bills_delete_owner_organization_or_legacy" on public.payable_bills;

create policy "payable_bills_select_organization"
  on public.payable_bills
  for select
  using (public.is_organization_member(organization_id));

create policy "payable_bills_insert_owner_organization"
  on public.payable_bills
  for insert
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "payable_bills_update_owner_organization"
  on public.payable_bills
  for update
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  )
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "payable_bills_delete_owner_organization"
  on public.payable_bills
  for delete
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );
