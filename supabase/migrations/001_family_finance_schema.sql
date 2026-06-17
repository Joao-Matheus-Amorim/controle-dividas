-- FamilyFinance initial database schema
-- Run this file in the Supabase SQL editor or through Supabase migrations.

create extension if not exists "pgcrypto";

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text,
  monthly_limit numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  expense_date date not null,
  description text not null,
  purchase_location text,
  amount numeric(10,2) not null check (amount >= 0),
  payment_method text,
  bank_or_card text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payable_bills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text,
  amount numeric(10,2) not null check (amount >= 0),
  due_date date not null,
  responsible_member_id uuid references public.family_members(id) on delete set null,
  status text not null default 'pendente' check (status in ('pago', 'pendente', 'atrasado')),
  bank_used text,
  recurrence text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.receivable_incomes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  receiver_member_id uuid references public.family_members(id) on delete set null,
  source text not null,
  payment_origin text,
  income_type text not null check (income_type in ('fixa', 'variavel')),
  amount numeric(10,2) not null check (amount >= 0),
  expected_date date not null,
  status text not null default 'previsto' check (status in ('previsto', 'recebido', 'atrasado')),
  receiving_bank text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.banks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  family_member_id uuid references public.family_members(id) on delete cascade,
  bank_name text not null,
  account_type text,
  current_balance numeric(10,2) not null default 0,
  currency text not null default 'EUR',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists family_members_owner_id_idx on public.family_members(owner_id);
create index if not exists expense_categories_owner_id_idx on public.expense_categories(owner_id);
create index if not exists expenses_owner_id_expense_date_idx on public.expenses(owner_id, expense_date desc);
create index if not exists payable_bills_owner_id_due_date_idx on public.payable_bills(owner_id, due_date asc);
create index if not exists receivable_incomes_owner_id_expected_date_idx on public.receivable_incomes(owner_id, expected_date asc);
create index if not exists banks_owner_id_idx on public.banks(owner_id);

alter table public.family_members enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.payable_bills enable row level security;
alter table public.receivable_incomes enable row level security;
alter table public.banks enable row level security;

create policy "family_members_select_own" on public.family_members for select using (auth.uid() = owner_id);
create policy "family_members_insert_own" on public.family_members for insert with check (auth.uid() = owner_id);
create policy "family_members_update_own" on public.family_members for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "family_members_delete_own" on public.family_members for delete using (auth.uid() = owner_id);

create policy "expense_categories_select_own" on public.expense_categories for select using (auth.uid() = owner_id);
create policy "expense_categories_insert_own" on public.expense_categories for insert with check (auth.uid() = owner_id);
create policy "expense_categories_update_own" on public.expense_categories for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "expense_categories_delete_own" on public.expense_categories for delete using (auth.uid() = owner_id);

create policy "expenses_select_own" on public.expenses for select using (auth.uid() = owner_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = owner_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = owner_id);

create policy "payable_bills_select_own" on public.payable_bills for select using (auth.uid() = owner_id);
create policy "payable_bills_insert_own" on public.payable_bills for insert with check (auth.uid() = owner_id);
create policy "payable_bills_update_own" on public.payable_bills for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "payable_bills_delete_own" on public.payable_bills for delete using (auth.uid() = owner_id);

create policy "receivable_incomes_select_own" on public.receivable_incomes for select using (auth.uid() = owner_id);
create policy "receivable_incomes_insert_own" on public.receivable_incomes for insert with check (auth.uid() = owner_id);
create policy "receivable_incomes_update_own" on public.receivable_incomes for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "receivable_incomes_delete_own" on public.receivable_incomes for delete using (auth.uid() = owner_id);

create policy "banks_select_own" on public.banks for select using (auth.uid() = owner_id);
create policy "banks_insert_own" on public.banks for insert with check (auth.uid() = owner_id);
create policy "banks_update_own" on public.banks for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "banks_delete_own" on public.banks for delete using (auth.uid() = owner_id);
