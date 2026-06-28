-- Multi-currency support for organization-level display and record-level values.
-- Stores the original currency on expenses, payables, and receivables.
-- Adds an organization display currency used for converted summaries.

alter table public.organizations
  add column if not exists display_currency text not null default 'EUR';

alter table public.organizations
  drop constraint if exists organizations_display_currency_format_check;

alter table public.organizations
  add constraint organizations_display_currency_format_check
    check (display_currency ~ '^[A-Z]{3}$');

alter table public.expenses
  add column if not exists currency text;

alter table public.payable_bills
  add column if not exists currency text;

alter table public.receivable_incomes
  add column if not exists currency text;

update public.expenses e
set currency = coalesce(
  (
    select fm.currency
    from public.financial_movements fm
    where fm.expense_id = e.id
      and fm.organization_id = e.organization_id
    order by fm.created_at desc
    limit 1
  ),
  (
    select b.currency
    from public.banks b
    where b.organization_id = e.organization_id
      and b.bank_name = e.bank_or_card
      and b.family_member_id = e.family_member_id
    order by b.created_at desc
    limit 1
  ),
  (
    select m.currency
    from public.family_members m
    where m.id = e.family_member_id
    limit 1
  ),
  'EUR'
)
where e.currency is null;

update public.payable_bills pb
set currency = coalesce(
  (
    select fm.currency
    from public.financial_movements fm
    where fm.payable_bill_id = pb.id
      and fm.organization_id = pb.organization_id
    order by fm.created_at desc
    limit 1
  ),
  (
    select b.currency
    from public.banks b
    where b.organization_id = pb.organization_id
      and b.bank_name = pb.bank_used
      and b.family_member_id = pb.responsible_member_id
    order by b.created_at desc
    limit 1
  ),
  (
    select m.currency
    from public.family_members m
    where m.id = pb.responsible_member_id
    limit 1
  ),
  'EUR'
)
where pb.currency is null;

update public.receivable_incomes ri
set currency = coalesce(
  (
    select fm.currency
    from public.financial_movements fm
    where fm.receivable_income_id = ri.id
      and fm.organization_id = ri.organization_id
    order by fm.created_at desc
    limit 1
  ),
  (
    select b.currency
    from public.banks b
    where b.organization_id = ri.organization_id
      and b.bank_name = ri.receiving_bank
      and b.family_member_id = ri.receiver_member_id
    order by b.created_at desc
    limit 1
  ),
  (
    select m.currency
    from public.family_members m
    where m.id = ri.receiver_member_id
    limit 1
  ),
  'EUR'
)
where ri.currency is null;

alter table public.expenses
  alter column currency set default 'EUR';

alter table public.payable_bills
  alter column currency set default 'EUR';

alter table public.receivable_incomes
  alter column currency set default 'EUR';

update public.expenses set currency = 'EUR' where currency is null;
update public.payable_bills set currency = 'EUR' where currency is null;
update public.receivable_incomes set currency = 'EUR' where currency is null;

alter table public.expenses
  alter column currency set not null;

alter table public.payable_bills
  alter column currency set not null;

alter table public.receivable_incomes
  alter column currency set not null;

alter table public.expenses
  drop constraint if exists expenses_currency_format_check;

alter table public.expenses
  add constraint expenses_currency_format_check
    check (currency ~ '^[A-Z]{3}$');

alter table public.payable_bills
  drop constraint if exists payable_bills_currency_format_check;

alter table public.payable_bills
  add constraint payable_bills_currency_format_check
    check (currency ~ '^[A-Z]{3}$');

alter table public.receivable_incomes
  drop constraint if exists receivable_incomes_currency_format_check;

alter table public.receivable_incomes
  add constraint receivable_incomes_currency_format_check
    check (currency ~ '^[A-Z]{3}$');
