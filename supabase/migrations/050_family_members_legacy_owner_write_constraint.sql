-- Constrain family_members organization-admin writes to the target organization's
-- legacy owner id.
-- Scope: public.family_members write policies only.
--
-- Context:
-- - 049_family_members_organization_write_rls.sql moved writes from
--   owner_id = auth.uid() to organization-admin management.
-- - While legacy owner_id remains in finance reads, direct Supabase writes must
--   not create organization rows with an arbitrary legacy owner.
--
-- Rollback:
-- Recreate the policies from migration 049 if the legacy owner constraint must
-- be temporarily removed.

create or replace function public.organization_legacy_owner_matches(
  target_organization_id uuid,
  target_owner_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organizations o
    where o.id = target_organization_id
      and o.owner_auth_user_id = target_owner_id
  );
$$;

revoke all on function public.organization_legacy_owner_matches(uuid, uuid) from public;
grant execute on function public.organization_legacy_owner_matches(uuid, uuid) to authenticated;

alter table public.family_members enable row level security;

drop policy if exists "family_members_insert_organization" on public.family_members;
drop policy if exists "family_members_update_organization" on public.family_members;
drop policy if exists "family_members_delete_organization" on public.family_members;

create policy "family_members_insert_organization"
on public.family_members
for insert
with check (
  public.is_organization_admin(organization_id)
  and public.organization_legacy_owner_matches(organization_id, owner_id)
);

create policy "family_members_update_organization"
on public.family_members
for update
using (
  public.is_organization_admin(organization_id)
)
with check (
  public.is_organization_admin(organization_id)
  and public.organization_legacy_owner_matches(organization_id, owner_id)
);

create policy "family_members_delete_organization"
on public.family_members
for delete
using (
  public.is_organization_admin(organization_id)
);
