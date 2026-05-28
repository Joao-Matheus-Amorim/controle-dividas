-- Version the final cleanup of legacy owner/family RLS policies.
-- These policies were safe during earlier transition phases, but final
-- organization-scoped RLS must not keep owner-only access paths.
--
-- This migration is intentionally idempotent because some environments already
-- dropped part of this set in earlier organization RLS migrations or by manual
-- production cleanup.

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

drop policy if exists "profiles_select_family" on public.profiles;
drop policy if exists "profiles_insert_family" on public.profiles;
drop policy if exists "profiles_update_family" on public.profiles;
drop policy if exists "profiles_delete_family" on public.profiles;

drop policy if exists "permissions_select_family" on public.user_module_permissions;
drop policy if exists "permissions_insert_family" on public.user_module_permissions;
drop policy if exists "permissions_update_family" on public.user_module_permissions;
drop policy if exists "permissions_delete_family" on public.user_module_permissions;

drop policy if exists "feature_permissions_select_family" on public.user_feature_permissions;
drop policy if exists "feature_permissions_insert_family" on public.user_feature_permissions;
drop policy if exists "feature_permissions_update_family" on public.user_feature_permissions;
drop policy if exists "feature_permissions_delete_family" on public.user_feature_permissions;
