-- Legacy organization_id backfill dry-run mapping report
-- Issue: #562
--
-- Read-only dry-run script.
-- Run this after docs/sql/legacy-organization-null-preflight.sql and before any
-- future data-changing backfill.
--
-- This report classifies legacy rows where organization_id IS NULL by whether
-- their owner_id can be deterministically mapped to exactly one organization
-- through existing profiles.organization_id values.
--
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, or migration statements.

with owner_organization_mapping as (
  select
    owner_id,
    count(*) as owner_profile_rows,
    count(*) filter (where organization_id is not null) as owner_profiles_with_organization,
    count(distinct organization_id) filter (where organization_id is not null) as distinct_organizations
  from public.profiles
  group by owner_id
),
legacy_rows as (
  select 'profiles' as table_name, id, owner_id from public.profiles where organization_id is null
  union all
  select 'family_members' as table_name, id, owner_id from public.family_members where organization_id is null
  union all
  select 'expense_categories' as table_name, id, owner_id from public.expense_categories where organization_id is null
  union all
  select 'expenses' as table_name, id, owner_id from public.expenses where organization_id is null
  union all
  select 'payable_bills' as table_name, id, owner_id from public.payable_bills where organization_id is null
  union all
  select 'receivable_incomes' as table_name, id, owner_id from public.receivable_incomes where organization_id is null
  union all
  select 'banks' as table_name, id, owner_id from public.banks where organization_id is null
  union all
  select 'user_module_permissions' as table_name, id, owner_id from public.user_module_permissions where organization_id is null
  union all
  select 'user_feature_permissions' as table_name, id, owner_id from public.user_feature_permissions where organization_id is null
)
select
  legacy_rows.table_name,
  count(*) as total_legacy_null_organization_rows,
  count(*) filter (
    where owner_organization_mapping.distinct_organizations = 1
  ) as deterministically_mappable_rows,
  count(*) filter (
    where owner_organization_mapping.owner_id is null
  ) as blocked_missing_owner_profile_rows,
  count(*) filter (
    where owner_organization_mapping.owner_id is not null
      and owner_organization_mapping.owner_profiles_with_organization = 0
  ) as blocked_owner_without_organization_rows,
  count(*) filter (
    where owner_organization_mapping.distinct_organizations > 1
  ) as blocked_ambiguous_owner_organization_rows
from legacy_rows
left join owner_organization_mapping
  on owner_organization_mapping.owner_id = legacy_rows.owner_id
group by legacy_rows.table_name
order by legacy_rows.table_name;
