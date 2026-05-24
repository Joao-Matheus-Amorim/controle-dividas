-- Issue: #618

select
  'profiles' as table_name,
  case
    when profiles.organization_id is not null then 'already_scoped'
    when profiles.auth_user_id is not null
      and memberships.organization_id is not null then 'deterministically_mappable'
    else 'needs_review'
  end as mapping_status,
  count(*) as row_count
from profiles
left join organization_memberships memberships
  on memberships.auth_user_id = profiles.auth_user_id
  and memberships.is_active = true
where profiles.organization_id is null
group by mapping_status

union all

select
  'profiles' as table_name,
  'total_legacy_null_organization_rows' as mapping_status,
  count(*) as row_count
from profiles
where organization_id is null;
