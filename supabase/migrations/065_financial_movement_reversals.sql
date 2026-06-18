-- Operational reversal for movement-backed payable and receivable status changes.
-- Reversal preserves the original ledger row, marks it as reversed, adjusts the
-- bank balance in the opposite direction, and returns the source record to its
-- open status.

alter table public.financial_movements
  add column if not exists reversed_at timestamptz;

alter table public.financial_movements
  add column if not exists reversed_by_profile_id uuid references public.profiles(id) on delete set null;

alter table public.financial_movements
  add column if not exists reversal_reason text;

create index if not exists financial_movements_reversed_at_idx
  on public.financial_movements(organization_id, reversed_at)
  where reversed_at is not null;

drop index if exists financial_movements_payable_bill_payment_once_idx;
create unique index financial_movements_payable_bill_payment_once_idx
  on public.financial_movements(payable_bill_id)
  where movement_type = 'payable_bill_payment'
    and reversed_at is null;

drop index if exists financial_movements_receivable_income_receipt_once_idx;
create unique index financial_movements_receivable_income_receipt_once_idx
  on public.financial_movements(receivable_income_id)
  where movement_type = 'receivable_income_receipt'
    and reversed_at is null;

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
  existing_movement_id uuid;
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
    and family_member_id = target_bill.responsible_member_id
  for update;

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

  select id
    into existing_movement_id
  from public.financial_movements
  where organization_id = target_organization_id
    and payable_bill_id = target_bill.id
    and movement_type = 'payable_bill_payment'
    and reversed_at is null
  limit 1
  for update;

  if existing_movement_id is not null then
    update public.payable_bills
    set status = 'pago',
        organization_id = target_organization_id
    where id = target_payable_bill_id
      and organization_id = target_organization_id;

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
  );

  update public.banks
  set current_balance = current_balance - target_bill.amount,
      organization_id = target_organization_id
  where id = target_bank.id
    and organization_id = target_organization_id;
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
  existing_movement_id uuid;
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
  );

  update public.banks
  set current_balance = current_balance + target_income.amount,
      organization_id = target_organization_id
  where id = target_bank.id
    and organization_id = target_organization_id;
end;
$$;

create or replace function public.reverse_financial_movement(
  target_organization_id uuid,
  target_financial_movement_id uuid,
  target_profile_id uuid,
  target_reversal_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_movement public.financial_movements%rowtype;
  target_bank public.banks%rowtype;
begin
  select *
    into target_movement
  from public.financial_movements
  where id = target_financial_movement_id
    and organization_id = target_organization_id
  for update;

  if not found then
    raise exception 'Movimentacao nao encontrada.';
  end if;

  if target_movement.reversed_at is not null then
    raise exception 'Movimentacao ja estornada.';
  end if;

  if target_movement.movement_type not in (
    'payable_bill_payment',
    'receivable_income_receipt'
  ) then
    raise exception 'Estorno disponivel apenas para pagamentos e recebimentos.';
  end if;

  if not (
    public.is_organization_admin(target_organization_id)
    or public.can_manage_organization_financial_movement(
      target_movement.organization_id,
      target_movement.family_member_id,
      target_movement.bank_id,
      target_movement.movement_type,
      target_movement.payable_bill_id,
      target_movement.receivable_income_id,
      'can_delete',
      target_movement.expense_id
    )
  ) then
    raise exception 'Voce nao tem permissao para estornar esta movimentacao.';
  end if;

  select *
    into target_bank
  from public.banks
  where id = target_movement.bank_id
    and organization_id = target_organization_id
  for update;

  if not found then
    raise exception 'Banco da movimentacao nao encontrado.';
  end if;

  if target_movement.movement_type = 'payable_bill_payment' then
    update public.payable_bills
    set status = 'pendente',
        organization_id = target_organization_id
    where id = target_movement.payable_bill_id
      and organization_id = target_organization_id;

    update public.banks
    set current_balance = current_balance + target_movement.amount,
        organization_id = target_organization_id
    where id = target_bank.id
      and organization_id = target_organization_id;
  elsif target_movement.movement_type = 'receivable_income_receipt' then
    update public.receivable_incomes
    set status = 'previsto',
        organization_id = target_organization_id
    where id = target_movement.receivable_income_id
      and organization_id = target_organization_id;

    update public.banks
    set current_balance = current_balance - target_movement.amount,
        organization_id = target_organization_id
    where id = target_bank.id
      and organization_id = target_organization_id;
  end if;

  update public.financial_movements
  set reversed_at = now(),
      reversed_by_profile_id = target_profile_id,
      reversal_reason = nullif(trim(target_reversal_reason), ''),
      updated_at = now()
  where id = target_movement.id
    and organization_id = target_organization_id;
end;
$$;

revoke all on function public.reverse_financial_movement(
  uuid,
  uuid,
  uuid,
  text
) from public;

grant execute on function public.reverse_financial_movement(
  uuid,
  uuid,
  uuid,
  text
) to authenticated;
