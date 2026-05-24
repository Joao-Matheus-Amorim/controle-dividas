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
-- Every transitional table must appear in the result, even when it has zero
-- legacy null-organization rows. A missing table row would make the report
-- ambiguous because reviewers could not distinguish "checked and zero" from
-- "not checked".
--
-- This file must remain SELECT-only. Do not add INSERT, UPDATE, DELETE, ALTER,
-- DROP, TRUNCATE, CREATE, GRANT, REVOKE, MERGE, CALL, or migration statements.

with transitional_tables as (
  select 1 as sort_order, 'profiles' as table_name
  union all select 2, 'family_members'
  union all select 3, 'expense_categories'
  union all select 4, 'expenses'
  union all select 5, 'payable_bills'
  union all select 6, 'receivable_incomes'
  union all select 7, 'banks'
  union all select 8, 'user_module_permissions'
  union all select 9, 'user_feature_permissions'
),
owner_organization_mapping as (
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
),
legacy_mapping_summary as (
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
)
select
  transitional_tables.table_name,
  coalesce(legacy_mapping_summary.total_legacy_null_organization_rows, 0) as total_legacy_null_organization_rows,
  coalesce(legacy_mapping_summary.deterministically_mappable_rows, 0) as deterministically_mappable_rows,
  coalesce(legacy_mapping_summary.blocked_missing_owner_profile_rows, 0) as blocked_missing_owner_profile_rows,
  coalesce(legacy_mapping_summary.blocked_owner_without_organization_rows, 0) as blocked_owner_without_organization_rows,
  coalesce(legacy_mapping_summary.blocked_ambiguous_owner_organization_rows, 0) as blocked_ambiguous_owner_organization_rows
from transitional_tables
left join legacy_mapping_summary
  on legacy_mapping_summary.table_name = transitional_tables.table_name
order by transitional_tables.sort_order;
