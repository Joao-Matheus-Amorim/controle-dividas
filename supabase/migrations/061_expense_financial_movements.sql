-- Link new expenses to the financial ledger when a bank is selected.

alter table public.financial_movements
  add column if not exists expense_id uuid references public.expenses(id) on delete restrict;

drop index if exists financial_movements_expense_idx;
drop index if exists financial_movements_expense_payment_once_idx;
create unique index financial_movements_expense_payment_once_idx
  on public.financial_movements(expense_id)
  where movement_type = 'expense_payment';

alter table public.financial_movements
  drop constraint if exists financial_movements_type_check;

alter table public.financial_movements
  add constraint financial_movements_type_check
    check (movement_type in ('payable_bill_payment', 'receivable_income_receipt', 'expense_payment'));

alter table public.financial_movements
  drop constraint if exists financial_movements_payable_type_check;

alter table public.financial_movements
  add constraint financial_movements_payable_type_check
    check (
      movement_type <> 'payable_bill_payment'
      or (
        direction = 'outflow'
        and payable_bill_id is not null
        and receivable_income_id is null
        and expense_id is null
      )
    );

alter table public.financial_movements
  drop constraint if exists financial_movements_receivable_type_check;

alter table public.financial_movements
  add constraint financial_movements_receivable_type_check
    check (
      movement_type <> 'receivable_income_receipt'
      or (
        direction = 'inflow'
        and receivable_income_id is not null
        and payable_bill_id is null
        and expense_id is null
      )
    );

alter table public.financial_movements
  drop constraint if exists financial_movements_expense_type_check;

alter table public.financial_movements
  add constraint financial_movements_expense_type_check
    check (
      movement_type <> 'expense_payment'
      or (
        direction = 'outflow'
        and expense_id is not null
        and payable_bill_id is null
        and receivable_income_id is null
      )
    );

create or replace function public.financial_movement_refs_match_organization(
  target_organization_id uuid,
  target_family_member_id uuid,
  target_bank_id uuid,
  target_movement_type text,
  target_payable_bill_id uuid,
  target_receivable_income_id uuid,
  target_expense_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when target_organization_id is null then false
      when target_family_member_id is null then false
      when target_bank_id is null then false
      when not exists (
        select 1
        from public.family_members fm
        where fm.id = target_family_member_id
          and fm.organization_id = target_organization_id
      ) then false
      when not exists (
        select 1
        from public.banks b
        where b.id = target_bank_id
          and b.organization_id = target_organization_id
      ) then false
      when target_movement_type = 'payable_bill_payment' then exists (
        select 1
        from public.payable_bills pb
        where pb.id = target_payable_bill_id
          and pb.organization_id = target_organization_id
          and pb.responsible_member_id = target_family_member_id
          and target_receivable_income_id is null
          and target_expense_id is null
      )
      when target_movement_type = 'receivable_income_receipt' then exists (
        select 1
        from public.receivable_incomes ri
        where ri.id = target_receivable_income_id
          and ri.organization_id = target_organization_id
          and ri.receiver_member_id = target_family_member_id
          and target_payable_bill_id is null
          and target_expense_id is null
      )
      when target_movement_type = 'expense_payment' then exists (
        select 1
        from public.expenses e
        where e.id = target_expense_id
          and e.organization_id = target_organization_id
          and e.family_member_id = target_family_member_id
          and target_payable_bill_id is null
          and target_receivable_income_id is null
      )
      else false
    end;
$$;

revoke all on function public.financial_movement_refs_match_organization(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  uuid
) from public;

grant execute on function public.financial_movement_refs_match_organization(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  uuid
) to authenticated;

create or replace function public.can_manage_organization_financial_movement(
  target_organization_id uuid,
  target_family_member_id uuid,
  target_bank_id uuid,
  target_movement_type text,
  target_payable_bill_id uuid,
  target_receivable_income_id uuid,
  target_action text,
  target_expense_id uuid default null
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when target_action not in ('can_create', 'can_edit', 'can_delete') then false
      when not public.financial_movement_refs_match_organization(
        target_organization_id,
        target_family_member_id,
        target_bank_id,
        target_movement_type,
        target_payable_bill_id,
        target_receivable_income_id,
        target_expense_id
      ) then false
      when public.is_organization_admin(target_organization_id) then true
      when target_movement_type = 'payable_bill_payment' then
        public.can_manage_organization_payable_bill(
          target_organization_id,
          target_family_member_id,
          case
            when target_action = 'can_delete' then 'can_delete'
            else 'can_edit'
          end
        )
      when target_movement_type = 'receivable_income_receipt' then
        public.can_manage_organization_receivable_income(
          target_organization_id,
          target_family_member_id,
          case
            when target_action = 'can_delete' then 'can_delete'
            else 'can_edit'
          end
        )
      when target_movement_type = 'expense_payment' then
        public.can_manage_organization_expense(
          target_organization_id,
          target_family_member_id,
          (
            select e.category_id
            from public.expenses e
            where e.id = target_expense_id
              and e.organization_id = target_organization_id
          ),
          case
            when target_action = 'can_delete' then 'can_delete'
            else 'can_edit'
          end
        )
      else false
    end;
$$;

revoke all on function public.can_manage_organization_financial_movement(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  text,
  uuid
) from public;

grant execute on function public.can_manage_organization_financial_movement(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  text,
  uuid
) to authenticated;

create or replace function public.create_expense_with_movement(
  target_organization_id uuid,
  target_owner_id uuid,
  target_family_member_id uuid,
  target_category_id uuid,
  target_expense_date date,
  target_description text,
  target_purchase_location text,
  target_amount numeric,
  target_payment_method text,
  target_bank_id uuid,
  target_notes text,
  target_profile_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_bank public.banks%rowtype;
  created_expense_id uuid;
begin
  select *
    into target_bank
  from public.banks
  where id = target_bank_id
    and organization_id = target_organization_id
    and family_member_id = target_family_member_id
  for update;

  if not found then
    raise exception 'Banco selecionado nao pertence a pessoa responsavel pelo gasto.';
  end if;

  if target_category_id is not null and not exists (
    select 1
    from public.expense_categories ec
    where ec.id = target_category_id
      and ec.organization_id = target_organization_id
  ) then
    raise exception 'Categoria nao pertence a esta organizacao.';
  end if;

  if not (
    public.is_organization_admin(target_organization_id)
    or public.can_manage_organization_expense(
      target_organization_id,
      target_family_member_id,
      target_category_id,
      'can_create'
    )
  ) then
    raise exception 'Voce nao tem permissao para cadastrar gasto para esta pessoa.';
  end if;

  insert into public.expenses (
    owner_id,
    organization_id,
    family_member_id,
    category_id,
    expense_date,
    description,
    purchase_location,
    amount,
    payment_method,
    bank_or_card,
    notes
  )
  values (
    target_owner_id,
    target_organization_id,
    target_family_member_id,
    target_category_id,
    target_expense_date,
    target_description,
    nullif(trim(target_purchase_location), ''),
    target_amount,
    nullif(trim(target_payment_method), ''),
    target_bank.bank_name,
    nullif(trim(target_notes), '')
  )
  returning id into created_expense_id;

  insert into public.financial_movements (
    owner_id,
    organization_id,
    family_member_id,
    bank_id,
    movement_type,
    direction,
    amount,
    currency,
    occurred_at,
    expense_id,
    created_by_profile_id,
    notes
  )
  values (
    target_owner_id,
    target_organization_id,
    target_family_member_id,
    target_bank.id,
    'expense_payment',
    'outflow',
    target_amount,
    target_bank.currency,
    target_expense_date::timestamptz,
    created_expense_id,
    target_profile_id,
    'Gasto: ' || target_description
  );

  update public.banks
  set current_balance = current_balance - target_amount,
      organization_id = target_organization_id
  where id = target_bank.id
    and organization_id = target_organization_id;

  return created_expense_id;
end;
$$;

revoke all on function public.create_expense_with_movement(
  uuid,
  uuid,
  uuid,
  uuid,
  date,
  text,
  text,
  numeric,
  text,
  uuid,
  text,
  uuid
) from public;

grant execute on function public.create_expense_with_movement(
  uuid,
  uuid,
  uuid,
  uuid,
  date,
  text,
  text,
  numeric,
  text,
  uuid,
  text,
  uuid
) to authenticated;

drop policy if exists "financial_movements_select_organization" on public.financial_movements;
drop policy if exists "financial_movements_insert_organization" on public.financial_movements;
drop policy if exists "financial_movements_update_organization" on public.financial_movements;
drop policy if exists "financial_movements_delete_organization" on public.financial_movements;

create policy "financial_movements_select_organization"
  on public.financial_movements
  for select
  using (
    public.is_organization_member(organization_id)
    and public.financial_movement_refs_match_organization(
      organization_id,
      family_member_id,
      bank_id,
      movement_type,
      payable_bill_id,
      receivable_income_id,
      expense_id
    )
  );

create policy "financial_movements_insert_organization"
  on public.financial_movements
  for insert
  with check (
    public.organization_legacy_owner_matches(organization_id, owner_id)
    and public.can_manage_organization_financial_movement(
      organization_id,
      family_member_id,
      bank_id,
      movement_type,
      payable_bill_id,
      receivable_income_id,
      'can_create',
      expense_id
    )
  );

create policy "financial_movements_update_organization"
  on public.financial_movements
  for update
  using (
    public.can_manage_organization_financial_movement(
      organization_id,
      family_member_id,
      bank_id,
      movement_type,
      payable_bill_id,
      receivable_income_id,
      'can_edit',
      expense_id
    )
  )
  with check (
    public.organization_legacy_owner_matches(organization_id, owner_id)
    and public.can_manage_organization_financial_movement(
      organization_id,
      family_member_id,
      bank_id,
      movement_type,
      payable_bill_id,
      receivable_income_id,
      'can_edit',
      expense_id
    )
  );

create policy "financial_movements_delete_organization"
  on public.financial_movements
  for delete
  using (
    public.can_manage_organization_financial_movement(
      organization_id,
      family_member_id,
      bank_id,
      movement_type,
      payable_bill_id,
      receivable_income_id,
      'can_delete',
      expense_id
    )
  );
