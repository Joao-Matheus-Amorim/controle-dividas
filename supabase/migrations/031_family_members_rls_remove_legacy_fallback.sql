-- Remove legacy NULL-organization fallback from family_members RLS.
-- Gate 4 scope: public.family_members only.
--
-- Preconditions:
-- - 021_family_members_organization_scope_hardening.sql has made
--   public.family_members.organization_id NOT NULL.
-- - Gated RLS coverage exists for authenticated user isolation.
--
-- Rollback:
-- See docs/runbooks/FAMILY_MEMBERS_RLS_FALLBACK_REMOVAL.md for concrete SQL.

alter table public.family_members enable row level security;

drop policy if exists "family_members_select_organization_or_legacy" on public.family_members;
drop policy if exists "family_members_insert_owner_organization_or_legacy" on public.family_members;
drop policy if exists "family_members_update_owner_organization_or_legacy" on public.family_members;
drop policy if exists "family_members_delete_owner_organization_or_legacy" on public.family_members;

create policy "family_members_select_organization"
on public.family_members
for select
using (public.is_organization_member(organization_id));

create policy "family_members_insert_owner_organization"
on public.family_members
for insert
with check (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "family_members_update_owner_organization"
on public.family_members
for update
using (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
)
with check (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

create policy "family_members_delete_owner_organization"
on public.family_members
for delete
using (
  owner_id = auth.uid()
  and public.is_organization_member(organization_id)
);

