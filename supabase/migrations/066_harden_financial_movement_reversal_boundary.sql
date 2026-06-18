-- Hardens movement reversal so table/API clients cannot spoof reversal flags
-- and direct RPC callers still pass the same rate-limit and audit boundary.

create extension if not exists "pgcrypto";

revoke update on public.financial_movements from authenticated;

create table if not exists public.financial_movement_reversal_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  financial_movement_id uuid not null references public.financial_movements(id) on delete cascade,
  attempted_at timestamptz not null default now()
);

comment on table public.financial_movement_reversal_attempts is
  'Durable short-window rate-limit attempts for finance.movement.reverse direct RPC calls.';

create index if not exists financial_movement_reversal_attempts_window_idx
  on public.financial_movement_reversal_attempts(
    organization_id,
    actor_profile_id,
    financial_movement_id,
    attempted_at desc
  );

alter table public.financial_movement_reversal_attempts enable row level security;

revoke all on public.financial_movement_reversal_attempts from public;
revoke all on public.financial_movement_reversal_attempts from anon;
revoke all on public.financial_movement_reversal_attempts from authenticated;

create or replace function public.block_direct_financial_movement_reversal_updates()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_setting('app.allow_financial_movement_reversal_update', true) = 'on' then
    return new;
  end if;

  if old.reversed_at is distinct from new.reversed_at
    or old.reversed_by_profile_id is distinct from new.reversed_by_profile_id
    or old.reversal_reason is distinct from new.reversal_reason then
    raise exception 'Reversal metadata can only be changed through reverse_financial_movement.';
  end if;

  return new;
end;
$$;

revoke all on function public.block_direct_financial_movement_reversal_updates() from public;
revoke all on function public.block_direct_financial_movement_reversal_updates() from anon;
revoke all on function public.block_direct_financial_movement_reversal_updates() from authenticated;

drop trigger if exists financial_movements_block_direct_reversal_updates on public.financial_movements;

create trigger financial_movements_block_direct_reversal_updates
  before update of reversed_at, reversed_by_profile_id, reversal_reason
  on public.financial_movements
  for each row
  execute function public.block_direct_financial_movement_reversal_updates();

drop function if exists public.reverse_financial_movement(uuid, uuid, uuid, text);

create function public.reverse_financial_movement(
  target_organization_id uuid,
  target_financial_movement_id uuid,
  target_profile_id uuid,
  target_reversal_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_movement public.financial_movements%rowtype;
  target_bank public.banks%rowtype;
  actor_profile public.profiles%rowtype;
  recent_attempt_count integer := 0;
  audit_metadata jsonb := '{}'::jsonb;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to reverse a financial movement.';
  end if;

  select *
    into actor_profile
  from public.profiles
  where id = target_profile_id
    and auth_user_id = auth.uid();

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Perfil autenticado nao encontrado.'
    );
  end if;

  select *
    into target_movement
  from public.financial_movements
  where id = target_financial_movement_id
    and organization_id = target_organization_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Movimentacao nao encontrada.'
    );
  end if;

  if target_movement.reversed_at is not null then
    return jsonb_build_object(
      'success', false,
      'error', 'Movimentacao ja estornada.'
    );
  end if;

  if target_movement.movement_type not in (
    'payable_bill_payment',
    'receivable_income_receipt'
  ) then
    return jsonb_build_object(
      'success', false,
      'error', 'Estorno disponivel apenas para pagamentos e recebimentos.'
    );
  end if;

  select count(*)
    into recent_attempt_count
  from public.financial_movement_reversal_attempts
  where organization_id = target_organization_id
    and actor_profile_id = actor_profile.id
    and financial_movement_id = target_movement.id
    and attempted_at >= now() - interval '10 minutes';

  insert into public.financial_movement_reversal_attempts (
    organization_id,
    actor_profile_id,
    financial_movement_id
  )
  values (
    target_organization_id,
    actor_profile.id,
    target_movement.id
  );

  if recent_attempt_count >= 5 then
    perform public.record_audit_event(
      target_organization_id,
      'finance.movement.reverse',
      'financial_movement',
      target_movement.id,
      'denied',
      null,
      jsonb_build_object(
        'status', 'rate_limited',
        'movement_type', target_movement.movement_type,
        'family_member_id', target_movement.family_member_id
      )
    );

    return jsonb_build_object(
      'success', false,
      'error', 'Muitas tentativas de estorno. Tente novamente em alguns minutos.'
    );
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
    perform public.record_audit_event(
      target_organization_id,
      'finance.movement.reverse',
      'financial_movement',
      target_movement.id,
      'denied',
      null,
      jsonb_build_object(
        'status', 'permission_denied',
        'movement_type', target_movement.movement_type,
        'family_member_id', target_movement.family_member_id
      )
    );

    return jsonb_build_object(
      'success', false,
      'error', 'Voce nao tem permissao para estornar esta movimentacao.'
    );
  end if;

  select *
    into target_bank
  from public.banks
  where id = target_movement.bank_id
    and organization_id = target_organization_id
  for update;

  if not found then
    return jsonb_build_object(
      'success', false,
      'error', 'Banco da movimentacao nao encontrado.'
    );
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

  perform set_config('app.allow_financial_movement_reversal_update', 'on', true);

  update public.financial_movements
  set reversed_at = now(),
      reversed_by_profile_id = actor_profile.id,
      reversal_reason = nullif(trim(target_reversal_reason), ''),
      updated_at = now()
  where id = target_movement.id
    and organization_id = target_organization_id;

  audit_metadata := jsonb_build_object(
    'movement_reversed', true,
    'movement_type', target_movement.movement_type,
    'direction', target_movement.direction,
    'family_member_id', target_movement.family_member_id,
    'payable_bill_id', target_movement.payable_bill_id,
    'receivable_income_id', target_movement.receivable_income_id
  );

  perform public.record_audit_event(
    target_organization_id,
    'finance.movement.reverse',
    'financial_movement',
    target_movement.id,
    'success',
    null,
    audit_metadata
  );

  return jsonb_build_object('success', true);
end;
$$;

comment on function public.reverse_financial_movement(uuid, uuid, uuid, text) is
  'Atomic movement reversal boundary. Enforces authenticated actor profile, can_delete permission, DB-side rate limit, audit event logging, source status restoration, and bank balance reversal.';

revoke all on function public.reverse_financial_movement(
  uuid,
  uuid,
  uuid,
  text
) from public;
revoke all on function public.reverse_financial_movement(
  uuid,
  uuid,
  uuid,
  text
) from anon;

grant execute on function public.reverse_financial_movement(
  uuid,
  uuid,
  uuid,
  text
) to authenticated;
