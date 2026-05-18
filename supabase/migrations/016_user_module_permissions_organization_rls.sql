-- FamilyFinance SaaS multi-tenant transition
-- Adds organization-aware RLS policies for user_module_permissions only.
--
-- Transitional rule:
-- - rows with organization_id use organization membership for reads;
-- - writes remain restricted to row owner during transition;
-- - legacy rows with organization_id IS NULL remain accessible only to their owner_id.
--
-- This migration does not:
-- - make organization_id NOT NULL;
-- - remove owner_id;
-- - change profiles;
-- - change user_feature_permissions;
-- - change admin, access-control, routes or billing.

alter table public.user_module_permissions enable row level security;

drop policy if exists "permissions_select_family" on public.user_module_permissions;
drop policy if exists "permissions_insert_family" on public.user_module_permissions;
drop policy if exists "permissions_update_family" on public.user_module_permissions;
drop policy if exists "permissions_delete_family" on public.user_module_permissions;

create policy "module_permissions_select_organization_or_legacy"
on public.user_module_permissions
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

create policy "module_permissions_insert_owner_organization_or_legacy"
on public.user_module_permissions
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

create policy "module_permissions_update_owner_organization_or_legacy"
on public.user_module_permissions
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
  and (
    (
      organization_id is not null
      and public.is_organization_member(organization_id)
    )
    or organization_id is null
  )
);

create policy "module_permissions_delete_owner_organization_or_legacy"
on public.user_module_permissions
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
