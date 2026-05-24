-- Legacy organization_id null preflight counters
-- Issue: #558
--
-- Read-only preflight script.
-- Run this before any future organization_id backfill or NOT NULL hardening.
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, or migration statements here.

select
  'profiles' as table_name,
  count(*) as null_organization_rows
from public.profiles
where organization_id is null

union all

select
  'family_members' as table_name,
  count(*) as null_organization_rows
from public.family_members
where organization_id is null

union all

select
  'expense_categories' as table_name,
  count(*) as null_organization_rows
from public.expense_categories
where organization_id is null

union all

select
  'expenses' as table_name,
  count(*) as null_organization_rows
from public.expenses
where organization_id is null

union all

select
  'payable_bills' as table_name,
  count(*) as null_organization_rows
from public.payable_bills
where organization_id is null

union all

select
  'receivable_incomes' as table_name,
  count(*) as null_organization_rows
from public.receivable_incomes
where organization_id is null

union all

select
  'banks' as table_name,
  count(*) as null_organization_rows
from public.banks
where organization_id is null

union all

select
  'user_module_permissions' as table_name,
  count(*) as null_organization_rows
from public.user_module_permissions
where organization_id is null

union all

select
  'user_feature_permissions' as table_name,
  count(*) as null_organization_rows
from public.user_feature_permissions
where organization_id is null

order by table_name;
