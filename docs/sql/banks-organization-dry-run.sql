-- Banks organization_id dry-run mapping report
-- Issue: #604
-- Read-only, table-scoped check for future public.banks hardening.

with owner_organization_mapping as (
  select
    owner_id,
    count(*) filter (where organization_id is not null) as owner_profiles_with_organization,
    count(distinct organization_id) filter (where organization_id is not null) as distinct_organizations
  from public.profiles
  group by owner_id
),
legacy_banks as (
  select id, owner_id, family_member_id
  from public.banks
  where organization_id is null
),
classified_legacy_banks as (
  select
    legacy_banks.id,
    case
      when owner_organization_mapping.owner_id is null then 'blocked_missing_owner_profile'
      when owner_organization_mapping.owner_profiles_with_organization = 0 then 'blocked_owner_without_organization'
      when owner_organization_mapping.distinct_organizations > 1 then 'blocked_ambiguous_owner_organization'
      when owner_organization_mapping.distinct_organizations = 1 then 'deterministically_mappable'
      else 'blocked_unknown'
    end as mapping_status
  from legacy_banks
  left join owner_organization_mapping
    on owner_organization_mapping.owner_id = legacy_banks.owner_id
)
select
  'banks' as table_name,
  mapping_status,
  count(*) as row_count
from classified_legacy_banks
group by mapping_status

union all

select
  'banks' as table_name,
  'total_legacy_null_organization_rows' as mapping_status,
  count(*) as row_count
from legacy_banks

order by mapping_status;
