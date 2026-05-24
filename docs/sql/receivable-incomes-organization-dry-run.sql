-- Receivable incomes organization_id dry-run mapping report
-- Issue: #598
-- Read-only, table-scoped check for future public.receivable_incomes hardening.

with owner_organization_mapping as (
  select
    owner_id,
    count(*) filter (where organization_id is not null) as owner_profiles_with_organization,
    count(distinct organization_id) filter (where organization_id is not null) as distinct_organizations
  from public.profiles
  group by owner_id
),
legacy_receivable_incomes as (
  select id, owner_id, receiver_member_id
  from public.receivable_incomes
  where organization_id is null
),
classified_legacy_receivable_incomes as (
  select
    legacy_receivable_incomes.id,
    case
      when owner_organization_mapping.owner_id is null then 'blocked_missing_owner_profile'
      when owner_organization_mapping.owner_profiles_with_organization = 0 then 'blocked_owner_without_organization'
      when owner_organization_mapping.distinct_organizations > 1 then 'blocked_ambiguous_owner_organization'
      when owner_organization_mapping.distinct_organizations = 1 then 'deterministically_mappable'
      else 'blocked_unknown'
    end as mapping_status
  from legacy_receivable_incomes
  left join owner_organization_mapping
    on owner_organization_mapping.owner_id = legacy_receivable_incomes.owner_id
)
select
  'receivable_incomes' as table_name,
  mapping_status,
  count(*) as row_count
from classified_legacy_receivable_incomes
group by mapping_status

union all

select
  'receivable_incomes' as table_name,
  'total_legacy_null_organization_rows' as mapping_status,
  count(*) as row_count
from legacy_receivable_incomes

order by mapping_status;
