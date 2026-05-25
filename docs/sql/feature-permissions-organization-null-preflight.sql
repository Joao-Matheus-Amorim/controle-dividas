-- Issue #630
-- Read-only preflight for future user feature permissions organization scope hardening.
-- This file must remain read-only. Do not add writes, DDL, grants, or function calls.

select
  count(*) filter (where "organization_id" is null) as null_organization_rows,
  count(*) filter (where "organization_id" is not null) as scoped_rows,
  count(*) as total_rows
from "public"."user_feature_permissions";

select
  count(*) as null_organization_rows_without_matching_profile_scope
from "public"."user_feature_permissions" as permission
left join "public"."profiles" as profile
  on profile."id" = permission."profile_id"
where permission."organization_id" is null
  and (
    profile."id" is null
    or profile."organization_id" is null
  );

select
  permission."profile_id",
  permission."feature_key",
  permission."owner_id",
  permission."organization_id",
  profile."organization_id" as profile_organization_id,
  profile."owner_id" as profile_owner_id
from "public"."user_feature_permissions" as permission
left join "public"."profiles" as profile
  on profile."id" = permission."profile_id"
where permission."organization_id" is null
order by permission."created_at" asc, permission."profile_id" asc, permission."feature_key" asc;
