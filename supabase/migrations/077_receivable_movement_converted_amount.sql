drop function if exists public.mark_receivable_income_received_with_movement(uuid, uuid, uuid, uuid, text);

create or replace function public.mark_receivable_income_received_with_movement(
  target_organization_id uuid,
  target_receivable_income_id uuid,
  target_bank_id uuid,
  target_profile_id uuid,
  target_recorded_timezone text default null,
  target_movement_amount numeric default null,
  target_movement_currency text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_income public.receivable_incomes%rowtype;
  target_bank public.banks%rowtype;
  target_owner_id uuid;
  existing_movement_id uuid;
  movement_amount numeric;
  movement_currency text;
begin
  select *
    into target_income
  from public.receivable_incomes
  where id = target_receivable_income_id
    and organization_id = target_organization_id
  for update;

  if not found then
    raise exception 'Recebimento nao encontrado.';
  end if;

  select *
    into target_bank
  from public.banks
  where id = target_bank_id
    and organization_id = target_organization_id
    and family_member_id = target_income.receiver_member_id
  for update;

  if not found then
    raise exception 'Banco selecionado nao pertence a pessoa recebedora.';
  end if;

  if not (
    public.is_organization_admin(target_organization_id)
    or public.can_manage_organization_receivable_income(
      target_organization_id,
      target_income.receiver_member_id,
      'can_edit'
    )
  ) then
    raise exception 'Voce nao tem permissao para editar este recebimento.';
  end if;

  if target_income.status = 'recebido' then
    return;
  end if;

  select id
    into existing_movement_id
  from public.financial_movements
  where organization_id = target_organization_id
    and receivable_income_id = target_income.id
    and movement_type = 'receivable_income_receipt'
    and reversed_at is null
  limit 1
  for update;

  if existing_movement_id is not null then
    update public.receivable_incomes
    set status = 'recebido',
        organization_id = target_organization_id
    where id = target_receivable_income_id
      and organization_id = target_organization_id;

    return;
  end if;

  movement_amount := coalesce(target_movement_amount, target_income.amount);
  movement_currency := upper(coalesce(nullif(trim(target_movement_currency), ''), target_bank.currency));

  if movement_amount <= 0 then
    raise exception 'Valor convertido do recebimento invalido.';
  end if;

  if movement_currency <> upper(target_bank.currency) then
    raise exception 'Moeda do movimento precisa ser a moeda do banco.';
  end if;

  update public.receivable_incomes
  set status = 'recebido',
      organization_id = target_organization_id
  where id = target_receivable_income_id
    and organization_id = target_organization_id;

  select owner_auth_user_id
    into target_owner_id
  from public.organizations
  where id = target_organization_id;

  insert into public.financial_movements (
    owner_id,
    organization_id,
    family_member_id,
    bank_id,
    movement_type,
    direction,
    amount,
    currency,
    recorded_timezone,
    payable_bill_id,
    receivable_income_id,
    created_by_profile_id,
    notes
  )
  values (
    target_owner_id,
    target_organization_id,
    target_income.receiver_member_id,
    target_bank.id,
    'receivable_income_receipt',
    'inflow',
    movement_amount,
    movement_currency,
    nullif(trim(target_recorded_timezone), ''),
    null,
    target_income.id,
    target_profile_id,
    'Recebimento de ' || coalesce(target_income.source, 'conta a receber')
  );

  update public.banks
  set current_balance = current_balance + movement_amount,
      organization_id = target_organization_id
  where id = target_bank.id
    and organization_id = target_organization_id;
end;
$$;

revoke all on function public.mark_receivable_income_received_with_movement(uuid, uuid, uuid, uuid, text, numeric, text) from anon;
revoke all on function public.mark_receivable_income_received_with_movement(uuid, uuid, uuid, uuid, text, numeric, text) from authenticated;
grant execute on function public.mark_receivable_income_received_with_movement(uuid, uuid, uuid, uuid, text, numeric, text) to authenticated;
