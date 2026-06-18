-- Keep finance create writes self-scoped for non-admin users at the RLS boundary.
-- Owner/admin organization members can still create records for any active member.
-- Non-admin create writes must target the authenticated profile linked_family_member_id,
-- even when module permissions use family or selected scope for other actions.

create or replace function public.can_manage_organization_bank(
  target_organization_id uuid,
  target_family_member_id uuid,
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
      when public.is_organization_admin(target_organization_id) then true
      when target_action not in ('can_create', 'can_edit', 'can_delete') then false
      else exists (
        select 1
        from public.profiles p
        join public.user_module_permissions ump
          on ump.profile_id = p.id
          and ump.organization_id = target_organization_id
          and ump.module = 'BANCOS'
        where p.auth_user_id = auth.uid()
          and p.organization_id = target_organization_id
          and p.is_active = true
          and case target_action
            when 'can_create' then ump.can_create
            when 'can_edit' then ump.can_edit
            when 'can_delete' then ump.can_delete
            else false
          end
          and case
            when target_action = 'can_create' then p.linked_family_member_id = target_family_member_id
            else (
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
          end
      )
    end;
$$;

revoke all on function public.can_manage_organization_bank(uuid, uuid, text) from public;
grant execute on function public.can_manage_organization_bank(uuid, uuid, text) to authenticated;

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
      when not public.is_organization_member(target_organization_id) then false
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
          and case
            when target_action = 'can_create' then p.linked_family_member_id = target_family_member_id
            else (
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
          end
      )
    end;
$$;

revoke all on function public.can_manage_organization_expense(uuid, uuid, uuid, text) from public;
grant execute on function public.can_manage_organization_expense(uuid, uuid, uuid, text) to authenticated;

create or replace function public.can_manage_organization_payable_bill(
  target_organization_id uuid,
  target_responsible_member_id uuid,
  target_action text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when target_responsible_member_id is null then false
      when not exists (
        select 1
        from public.family_members fm
        where fm.id = target_responsible_member_id
          and fm.organization_id = target_organization_id
      ) then false
      when not public.is_organization_member(target_organization_id) then false
      when public.is_organization_admin(target_organization_id) then true
      when target_action not in ('can_create', 'can_edit', 'can_delete') then false
      else exists (
        select 1
        from public.profiles p
        join public.user_module_permissions ump
          on ump.profile_id = p.id
          and ump.organization_id = target_organization_id
          and ump.module = 'CONTAS_A_PAGAR'
        where p.auth_user_id = auth.uid()
          and p.organization_id = target_organization_id
          and p.is_active = true
          and case target_action
            when 'can_create' then ump.can_create
            when 'can_edit' then ump.can_edit
            when 'can_delete' then ump.can_delete
            else false
          end
          and case
            when target_action = 'can_create' then p.linked_family_member_id = target_responsible_member_id
            else (
              ump.scope = 'family'
              or (
                ump.scope = 'selected'
                and target_responsible_member_id = any(coalesce(ump.allowed_member_ids, '{}'::uuid[]))
              )
              or (
                ump.scope = 'own'
                and p.linked_family_member_id = target_responsible_member_id
              )
            )
          end
      )
    end;
$$;

revoke all on function public.can_manage_organization_payable_bill(uuid, uuid, text) from public;
grant execute on function public.can_manage_organization_payable_bill(uuid, uuid, text) to authenticated;

create or replace function public.can_manage_organization_receivable_income(
  target_organization_id uuid,
  target_receiver_member_id uuid,
  target_action text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when target_receiver_member_id is null then false
      when not exists (
        select 1
        from public.family_members fm
        where fm.id = target_receiver_member_id
          and fm.organization_id = target_organization_id
      ) then false
      when not public.is_organization_member(target_organization_id) then false
      when public.is_organization_admin(target_organization_id) then true
      when target_action not in ('can_create', 'can_edit', 'can_delete') then false
      else exists (
        select 1
        from public.profiles p
        join public.user_module_permissions ump
          on ump.profile_id = p.id
          and ump.organization_id = target_organization_id
          and ump.module = 'CONTAS_A_RECEBER'
        where p.auth_user_id = auth.uid()
          and p.organization_id = target_organization_id
          and p.is_active = true
          and case target_action
            when 'can_create' then ump.can_create
            when 'can_edit' then ump.can_edit
            when 'can_delete' then ump.can_delete
            else false
          end
          and case
            when target_action = 'can_create' then p.linked_family_member_id = target_receiver_member_id
            else (
              ump.scope = 'family'
              or (
                ump.scope = 'selected'
                and target_receiver_member_id = any(coalesce(ump.allowed_member_ids, '{}'::uuid[]))
              )
              or (
                ump.scope = 'own'
                and p.linked_family_member_id = target_receiver_member_id
              )
            )
          end
      )
    end;
$$;

revoke all on function public.can_manage_organization_receivable_income(uuid, uuid, text) from public;
grant execute on function public.can_manage_organization_receivable_income(uuid, uuid, text) to authenticated;
