-- Issue: #610

select
  'module_permissions' as table_name,
  case
    when count(distinct profiles.organization_id) filter (where profiles.organization_id is not null) = 1
      then 'deterministically_mappable'
    else 'needs_review'
  end as mapping_status,
  count(*) as row_count
from "public"."user_module_permissions" module_permissions
left join "public"."profiles" profiles
  on profiles.owner_id = module_permissions.owner_id
where module_permissions.organization_id is null
group by module_permissions.owner_id

union all

select
  'module_permissions' as table_name,
  'total_legacy_null_organization_rows' as mapping_status,
  count(*) as row_count
from "public"."user_module_permissions"
where organization_id is null;
