-- Align family_members write policies with organization-admin-scoped member management.
-- Scope: public.family_members only.
--
-- Preconditions:
-- - 021_family_members_organization_scope_hardening.sql has made
--   public.family_members.organization_id NOT NULL.
-- - 031_family_members_rls_remove_legacy_fallback.sql has removed the
--   legacy NULL-organization fallback.
--
-- Rollback:
-- Recreate the owner-scoped write policies from migration 031 if family
-- member management must temporarily return to owner-only writes.

alter table public.family_members enable row level security;

drop policy if exists "family_members_insert_owner_organization" on public.family_members;
drop policy if exists "family_members_update_owner_organization" on public.family_members;
drop policy if exists "family_members_delete_owner_organization" on public.family_members;

create policy "family_members_insert_organization"
on public.family_members
for insert
with check (
  public.is_organization_admin(organization_id)
);

create policy "family_members_update_organization"
on public.family_members
for update
using (
  public.is_organization_admin(organization_id)
)
with check (
  public.is_organization_admin(organization_id)
);

create policy "family_members_delete_organization"
on public.family_members
for delete
using (
  public.is_organization_admin(organization_id)
);
