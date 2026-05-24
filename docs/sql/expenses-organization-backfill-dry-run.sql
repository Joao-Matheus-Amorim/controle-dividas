-- Expenses organization_id backfill dry-run mapping report
-- Issue: #586
--
-- Read-only, table-scoped dry-run for future expenses.organization_id hardening.
-- Run this after docs/sql/expenses-organization-null-preflight.sql and before
-- any future data-changing backfill or NOT NULL migration for public.expenses.
--
-- This report classifies legacy public.expenses rows where organization_id IS NULL
-- by whether their owner_id can be deterministically mapped to exactly one
-- organization through existing profiles.organization_id values.
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
legacy_expenses as (
  select
    id,
    owner_id,
    family_member_id,
    category_id
  from public.expenses
  where organization_id is null
),
classified_legacy_expenses as (
  select
    legacy_expenses.id,
    legacy_expenses.owner_id,
    legacy_expenses.family_member_id,
    legacy_expenses.category_id,
    case
      when owner_organization_mapping.owner_id is null then 'blocked_missing_owner_profile'
      when owner_organization_mapping.owner_profiles_with_organization = 0 then 'blocked_owner_without_organization'
      when owner_organization_mapping.distinct_organizations > 1 then 'blocked_ambiguous_owner_organization'
      when owner_organization_mapping.distinct_organizations = 1 then 'deterministically_mappable'
      else 'blocked_unknown'
    end as mapping_status
  from legacy_expenses
  left join owner_organization_mapping
    on owner_organization_mapping.owner_id = legacy_expenses.owner_id
)
select
  'expenses' as table_name,
  mapping_status,
  count(*) as row_count
from classified_legacy_expenses
group by mapping_status

union all

select
  'expenses' as table_name,
  'total_legacy_null_organization_rows' as mapping_status,
  count(*) as row_count
from legacy_expenses

order by mapping_status;
