-- Financial movements ledger base.
-- This migration creates the central movement table used by future app flows.
-- Runtime integrations that mark payables as paid or receivables as received
-- are intentionally added in later PRs.

create extension if not exists "pgcrypto";

create table if not exists public.financial_movements (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  family_member_id uuid not null references public.family_members(id) on delete restrict,
  bank_id uuid not null references public.banks(id) on delete restrict,
  movement_type text not null,
  direction text not null,
  amount numeric(12,2) not null,
  currency text not null default 'EUR',
  occurred_at timestamptz not null default now(),
  recorded_timezone text,
  payable_bill_id uuid references public.payable_bills(id) on delete restrict,
  receivable_income_id uuid references public.receivable_incomes(id) on delete restrict,
  created_by_profile_id uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint financial_movements_amount_positive_check
    check (amount > 0),
  constraint financial_movements_currency_format_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint financial_movements_direction_check
    check (direction in ('inflow', 'outflow')),
  constraint financial_movements_type_check
    check (movement_type in ('payable_bill_payment', 'receivable_income_receipt')),
  constraint financial_movements_payable_type_check
    check (
      movement_type <> 'payable_bill_payment'
      or (
        direction = 'outflow'
        and payable_bill_id is not null
        and receivable_income_id is null
      )
    ),
  constraint financial_movements_receivable_type_check
    check (
      movement_type <> 'receivable_income_receipt'
      or (
        direction = 'inflow'
        and receivable_income_id is not null
        and payable_bill_id is null
      )
    )
);

comment on table public.financial_movements is
  'Central financial ledger for money movements. Initial supported types are payable_bill_payment and receivable_income_receipt.';

comment on column public.financial_movements.occurred_at is
  'Server-side timestamp captured automatically when the movement is recorded. Display should convert to the viewer local timezone.';

comment on column public.financial_movements.recorded_timezone is
  'Optional browser-reported IANA timezone for audit/report context; occurred_at remains the source of truth.';

create index if not exists financial_movements_organization_occurred_at_idx
  on public.financial_movements(organization_id, occurred_at desc);

create index if not exists financial_movements_bank_occurred_at_idx
  on public.financial_movements(bank_id, occurred_at desc);

create index if not exists financial_movements_family_member_occurred_at_idx
  on public.financial_movements(family_member_id, occurred_at desc);

create index if not exists financial_movements_type_occurred_at_idx
  on public.financial_movements(movement_type, occurred_at desc);

create index if not exists financial_movements_payable_bill_idx
  on public.financial_movements(payable_bill_id)
  where payable_bill_id is not null;

create index if not exists financial_movements_receivable_income_idx
  on public.financial_movements(receivable_income_id)
  where receivable_income_id is not null;

alter table public.financial_movements enable row level security;

revoke all on public.financial_movements from anon;
revoke all on public.financial_movements from authenticated;

grant select, insert, update, delete on public.financial_movements to authenticated;

create or replace function public.financial_movement_refs_match_organization(
  target_organization_id uuid,
  target_family_member_id uuid,
  target_bank_id uuid,
  target_movement_type text,
  target_payable_bill_id uuid,
  target_receivable_income_id uuid
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
      )
      when target_movement_type = 'receivable_income_receipt' then exists (
        select 1
        from public.receivable_incomes ri
        where ri.id = target_receivable_income_id
          and ri.organization_id = target_organization_id
          and ri.receiver_member_id = target_family_member_id
          and target_payable_bill_id is null
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
  uuid
) from public;
grant execute on function public.financial_movement_refs_match_organization(
  uuid,
  uuid,
  uuid,
  text,
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
  target_action text
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
        target_receivable_income_id
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
  text
) from public;
grant execute on function public.can_manage_organization_financial_movement(
  uuid,
  uuid,
  uuid,
  text,
  uuid,
  uuid,
  text
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
      receivable_income_id
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
      'can_create'
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
      'can_edit'
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
      'can_edit'
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
      'can_delete'
    )
  );
