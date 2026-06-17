-- Atomic status + financial movement writes.
-- These RPCs keep payable/receivable status changes and ledger inserts in the
-- same database transaction so a movement failure cannot leave a paid/received
-- status without its financial_movements row.

create unique index if not exists financial_movements_payable_bill_payment_once_idx
  on public.financial_movements(payable_bill_id)
  where movement_type = 'payable_bill_payment'
    and payable_bill_id is not null;

create unique index if not exists financial_movements_receivable_income_receipt_once_idx
  on public.financial_movements(receivable_income_id)
  where movement_type = 'receivable_income_receipt'
    and receivable_income_id is not null;

create or replace function public.mark_payable_bill_paid_with_movement(
  target_organization_id uuid,
  target_payable_bill_id uuid,
  target_bank_id uuid,
  target_profile_id uuid,
  target_recorded_timezone text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_bill public.payable_bills%rowtype;
  target_bank public.banks%rowtype;
  target_owner_id uuid;
begin
  select *
    into target_bill
  from public.payable_bills
  where id = target_payable_bill_id
    and organization_id = target_organization_id
  for update;

  if not found then
    raise exception 'Conta nao encontrada.';
  end if;

  select *
    into target_bank
  from public.banks
  where id = target_bank_id
    and organization_id = target_organization_id
    and family_member_id = target_bill.responsible_member_id;

  if not found then
    raise exception 'Banco selecionado nao pertence ao responsavel desta conta.';
  end if;

  if not (
    public.is_organization_admin(target_organization_id)
    or public.can_manage_organization_payable_bill(
      target_organization_id,
      target_bill.responsible_member_id,
      'can_edit'
    )
  ) then
    raise exception 'Voce nao tem permissao para editar esta conta.';
  end if;

  if target_bill.status = 'pago' then
    return;
  end if;

  update public.payable_bills
  set status = 'pago',
      organization_id = target_organization_id
  where id = target_payable_bill_id
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
    target_bill.responsible_member_id,
    target_bank.id,
    'payable_bill_payment',
    'outflow',
    target_bill.amount,
    target_bank.currency,
    nullif(trim(target_recorded_timezone), ''),
    target_bill.id,
    null,
    target_profile_id,
    'Pagamento de ' || coalesce(target_bill.name, 'conta')
  )
  on conflict do nothing;
end;
$$;

create or replace function public.mark_receivable_income_received_with_movement(
  target_organization_id uuid,
  target_receivable_income_id uuid,
  target_bank_id uuid,
  target_profile_id uuid,
  target_recorded_timezone text default null
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
    and family_member_id = target_income.receiver_member_id;

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
    target_income.amount,
    target_bank.currency,
    nullif(trim(target_recorded_timezone), ''),
    null,
    target_income.id,
    target_profile_id,
    'Recebimento de ' || coalesce(target_income.source, 'conta a receber')
  )
  on conflict do nothing;
end;
$$;

revoke all on function public.mark_payable_bill_paid_with_movement(
  uuid,
  uuid,
  uuid,
  uuid,
  text
) from public;

revoke all on function public.mark_receivable_income_received_with_movement(
  uuid,
  uuid,
  uuid,
  uuid,
  text
) from public;

grant execute on function public.mark_payable_bill_paid_with_movement(
  uuid,
  uuid,
  uuid,
  uuid,
  text
) to authenticated;

grant execute on function public.mark_receivable_income_received_with_movement(
  uuid,
  uuid,
  uuid,
  uuid,
  text
) to authenticated;
