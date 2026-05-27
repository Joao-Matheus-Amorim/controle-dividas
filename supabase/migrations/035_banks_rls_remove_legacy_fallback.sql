-- Remove legacy NULL-organization fallback from banks RLS.
-- Preconditions:
-- - public.banks.organization_id is NOT NULL.
-- - Legacy rows were backfilled or quarantined before this migration.

alter table public.banks enable row level security;

drop policy if exists "banks_select_organization_or_legacy" on public.banks;
drop policy if exists "banks_insert_owner_organization_or_legacy" on public.banks;
drop policy if exists "banks_update_owner_organization_or_legacy" on public.banks;
drop policy if exists "banks_delete_owner_organization_or_legacy" on public.banks;

create policy "banks_select_organization"
  on public.banks
  for select
  using (public.is_organization_member(organization_id));

create policy "banks_insert_owner_organization"
  on public.banks
  for insert
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "banks_update_owner_organization"
  on public.banks
  for update
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  )
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "banks_delete_owner_organization"
  on public.banks
  for delete
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );
