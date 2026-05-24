-- Issue: #618

select
  'profiles' as table_name,
  count(*) as null_organization_rows
from profiles
where organization_id is null;
