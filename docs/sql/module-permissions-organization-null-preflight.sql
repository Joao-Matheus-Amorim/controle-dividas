-- Issue: #610

select
  'module_permissions' as table_name,
  count(*) as null_organization_rows
from "public"."user_module_permissions"
where "organization_id" is null;
