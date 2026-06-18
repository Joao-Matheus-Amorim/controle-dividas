create or replace function public.delete_family_member_if_unlinked(
  target_organization_id uuid,
  target_family_member_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  locked_member_id uuid;
begin
  if not public.is_organization_admin(target_organization_id) then
    raise exception 'not authorized to delete family member'
      using errcode = '42501';
  end if;

  select id
    into locked_member_id
    from public.family_members
   where id = target_family_member_id
     and organization_id = target_organization_id
   for update;

  if locked_member_id is null then
    raise exception 'Pessoa nao encontrada.'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
      from public.expenses
     where family_member_id = target_family_member_id
       and organization_id = target_organization_id
  )
  or exists (
    select 1
      from public.payable_bills
     where responsible_member_id = target_family_member_id
       and organization_id = target_organization_id
  )
  or exists (
    select 1
      from public.receivable_incomes
     where receiver_member_id = target_family_member_id
       and organization_id = target_organization_id
  )
  or exists (
    select 1
      from public.banks
     where family_member_id = target_family_member_id
       and organization_id = target_organization_id
  )
  or exists (
    select 1
      from public.profiles
     where linked_family_member_id = target_family_member_id
       and organization_id = target_organization_id
  )
  or exists (
    select 1
      from public.financial_movements
     where family_member_id = target_family_member_id
       and organization_id = target_organization_id
  ) then
    raise exception 'Esta pessoa possui vinculos financeiros ou acesso criado. Desative a pessoa em vez de excluir.'
      using errcode = 'P0001';
  end if;

  delete from public.family_members
   where id = target_family_member_id
     and organization_id = target_organization_id;

  if not found then
    raise exception 'Pessoa nao encontrada.'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.delete_family_member_if_unlinked(uuid, uuid) from public;
grant execute on function public.delete_family_member_if_unlinked(uuid, uuid) to authenticated;
