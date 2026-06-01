-- Restore relationship constraints expected by PostgREST embedded selects and
-- remove legacy owner-only policies left behind on previously bootstrapped DBs.
--
-- Context:
-- - Some remote databases had migrations 001-042 marked as applied after the
--   tables already existed, but the original foreign keys were absent.
-- - Finance pages depend on PostgREST relationships such as
--   family_members(id, name) and expense_categories(id, name).

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_family_member_id_fkey'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_family_member_id_fkey
      foreign key (family_member_id)
      references public.family_members(id)
      on delete cascade
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_category_id_fkey'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_category_id_fkey
      foreign key (category_id)
      references public.expense_categories(id)
      on delete set null
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'payable_bills_responsible_member_id_fkey'
      and conrelid = 'public.payable_bills'::regclass
  ) then
    alter table public.payable_bills
      add constraint payable_bills_responsible_member_id_fkey
      foreign key (responsible_member_id)
      references public.family_members(id)
      on delete set null
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'receivable_incomes_receiver_member_id_fkey'
      and conrelid = 'public.receivable_incomes'::regclass
  ) then
    alter table public.receivable_incomes
      add constraint receivable_incomes_receiver_member_id_fkey
      foreign key (receiver_member_id)
      references public.family_members(id)
      on delete set null
      not valid;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'banks_family_member_id_fkey'
      and conrelid = 'public.banks'::regclass
  ) then
    alter table public.banks
      add constraint banks_family_member_id_fkey
      foreign key (family_member_id)
      references public.family_members(id)
      on delete cascade
      not valid;
  end if;
end $$;

alter table public.expenses validate constraint expenses_family_member_id_fkey;
alter table public.expenses validate constraint expenses_category_id_fkey;
alter table public.payable_bills validate constraint payable_bills_responsible_member_id_fkey;
alter table public.receivable_incomes validate constraint receivable_incomes_receiver_member_id_fkey;
alter table public.banks validate constraint banks_family_member_id_fkey;

drop policy if exists "family_members_select_own" on public.family_members;
drop policy if exists "family_members_insert_own" on public.family_members;
drop policy if exists "family_members_update_own" on public.family_members;
drop policy if exists "family_members_delete_own" on public.family_members;

drop policy if exists "expense_categories_select_own" on public.expense_categories;
drop policy if exists "expense_categories_insert_own" on public.expense_categories;
drop policy if exists "expense_categories_update_own" on public.expense_categories;
drop policy if exists "expense_categories_delete_own" on public.expense_categories;

drop policy if exists "expenses_select_own" on public.expenses;
drop policy if exists "expenses_insert_own" on public.expenses;
drop policy if exists "expenses_update_own" on public.expenses;
drop policy if exists "expenses_delete_own" on public.expenses;

drop policy if exists "payable_bills_select_own" on public.payable_bills;
drop policy if exists "payable_bills_insert_own" on public.payable_bills;
drop policy if exists "payable_bills_update_own" on public.payable_bills;
drop policy if exists "payable_bills_delete_own" on public.payable_bills;

drop policy if exists "receivable_incomes_select_own" on public.receivable_incomes;
drop policy if exists "receivable_incomes_insert_own" on public.receivable_incomes;
drop policy if exists "receivable_incomes_update_own" on public.receivable_incomes;
drop policy if exists "receivable_incomes_delete_own" on public.receivable_incomes;

drop policy if exists "banks_select_own" on public.banks;
drop policy if exists "banks_insert_own" on public.banks;
drop policy if exists "banks_update_own" on public.banks;
drop policy if exists "banks_delete_own" on public.banks;

notify pgrst, 'reload schema';
