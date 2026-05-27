-- Remove legacy NULL-organization fallback from user_module_permissions RLS.
-- Preconditions:
-- - public.user_module_permissions.organization_id is NOT NULL.
-- - Legacy rows were backfilled or quarantined before this migration.

alter table public.user_module_permissions enable row level security;

drop policy if exists "module_permissions_select_organization_or_legacy" on public.user_module_permissions;
drop policy if exists "module_permissions_insert_owner_organization_or_legacy" on public.user_module_permissions;
drop policy if exists "module_permissions_update_owner_organization_or_legacy" on public.user_module_permissions;
drop policy if exists "module_permissions_delete_owner_organization_or_legacy" on public.user_module_permissions;

create policy "module_permissions_select_organization"
  on public.user_module_permissions
  for select
  using (public.is_organization_member(organization_id));

create policy "module_permissions_insert_owner_organization"
  on public.user_module_permissions
  for insert
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "module_permissions_update_owner_organization"
  on public.user_module_permissions
  for update
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  )
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "module_permissions_delete_owner_organization"
  on public.user_module_permissions
  for delete
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );
