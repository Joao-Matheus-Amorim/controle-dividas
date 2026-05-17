-- FamilyFinance SaaS multi-tenant transition
-- Adds nullable organization_id columns to existing tables.
-- This migration is intentionally non-destructive:
-- - does not backfill data;
-- - does not change existing RLS policies;
-- - does not remove owner_id;
-- - does not make organization_id NOT NULL;
-- - does not change application queries or Server Actions.

alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.family_members
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.expense_categories
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.expenses
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.payable_bills
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.receivable_incomes
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.banks
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.user_module_permissions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.user_feature_permissions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

create index if not exists profiles_organization_id_idx
  on public.profiles(organization_id);

create index if not exists family_members_organization_id_idx
  on public.family_members(organization_id);

create index if not exists expense_categories_organization_id_idx
  on public.expense_categories(organization_id);

create index if not exists expenses_organization_id_expense_date_idx
  on public.expenses(organization_id, expense_date desc);

create index if not exists payable_bills_organization_id_due_date_idx
  on public.payable_bills(organization_id, due_date asc);

create index if not exists receivable_incomes_organization_id_expected_date_idx
  on public.receivable_incomes(organization_id, expected_date asc);

create index if not exists banks_organization_id_idx
  on public.banks(organization_id);

create index if not exists user_module_permissions_organization_id_idx
  on public.user_module_permissions(organization_id);

create index if not exists user_feature_permissions_organization_id_idx
  on public.user_feature_permissions(organization_id);
