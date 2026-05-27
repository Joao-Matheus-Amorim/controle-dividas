-- Remove legacy NULL-organization fallback from profiles RLS.
-- Preconditions:
-- - public.profiles.organization_id is NOT NULL.
-- - Legacy rows were backfilled or quarantined before this migration.

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_organization_or_legacy" on public.profiles;
drop policy if exists "profiles_insert_owner_organization_or_legacy" on public.profiles;
drop policy if exists "profiles_update_owner_organization_or_legacy" on public.profiles;
drop policy if exists "profiles_delete_owner_organization_or_legacy" on public.profiles;

create policy "profiles_select_organization"
  on public.profiles
  for select
  using (
    auth_user_id = auth.uid()
    or public.is_organization_member(organization_id)
  );

create policy "profiles_insert_owner_organization"
  on public.profiles
  for insert
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "profiles_update_owner_organization"
  on public.profiles
  for update
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  )
  with check (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );

create policy "profiles_delete_owner_organization"
  on public.profiles
  for delete
  using (
    owner_id = auth.uid()
    and public.is_organization_member(organization_id)
  );
