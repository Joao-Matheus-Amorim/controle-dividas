-- Move expense writes from authenticated-user ownership to organization-scoped writes.
-- Preconditions:
-- - public.expenses.organization_id is NOT NULL.
-- - public.organization_legacy_owner_matches(uuid, uuid) exists from migration 050.
-- - Application actions enforce the same GASTOS module/member permissions before writes.

alter table public.expenses enable row level security;

create or replace function public.can_manage_organization_expense(
  target_organization_id uuid,
  target_family_member_id uuid,
  target_category_id uuid,
  target_action text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when target_family_member_id is null then false
      when not exists (
        select 1
        from public.family_members fm
        where fm.id = target_family_member_id
          and fm.organization_id = target_organization_id
      ) then false
      when target_category_id is not null and not exists (
        select 1
        from public.expense_categories ec
        where ec.id = target_category_id
          and ec.organization_id = target_organization_id
      ) then false
      when public.is_organization_admin(target_organization_id) then true
      when target_action not in ('can_create', 'can_edit', 'can_delete') then false
      else exists (
        select 1
        from public.profiles p
        join public.user_module_permissions ump
          on ump.profile_id = p.id
          and ump.organization_id = target_organization_id
          and ump.module = 'GASTOS'
        where p.auth_user_id = auth.uid()
          and p.organization_id = target_organization_id
          and p.is_active = true
          and case target_action
            when 'can_create' then ump.can_create
            when 'can_edit' then ump.can_edit
            when 'can_delete' then ump.can_delete
            else false
          end
          and (
            ump.scope = 'family'
            or (
              ump.scope = 'selected'
              and target_family_member_id = any(coalesce(ump.allowed_member_ids, '{}'::uuid[]))
            )
            or (
              ump.scope = 'own'
              and p.linked_family_member_id = target_family_member_id
            )
          )
      )
    end;
$$;

revoke all on function public.can_manage_organization_expense(uuid, uuid, uuid, text) from public;
grant execute on function public.can_manage_organization_expense(uuid, uuid, uuid, text) to authenticated;

drop policy if exists "expenses_insert_owner_organization" on public.expenses;
drop policy if exists "expenses_update_owner_organization" on public.expenses;
drop policy if exists "expenses_delete_owner_organization" on public.expenses;

create policy "expenses_insert_organization"
  on public.expenses
  for insert
  with check (
    public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_create')
    and public.organization_legacy_owner_matches(organization_id, owner_id)
  );

create policy "expenses_update_organization"
  on public.expenses
  for update
  using (
    public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_edit')
  )
  with check (
    public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_edit')
    and public.organization_legacy_owner_matches(organization_id, owner_id)
  );

create policy "expenses_delete_organization"
  on public.expenses
  for delete
  using (
    public.can_manage_organization_expense(organization_id, family_member_id, category_id, 'can_delete')
  );
