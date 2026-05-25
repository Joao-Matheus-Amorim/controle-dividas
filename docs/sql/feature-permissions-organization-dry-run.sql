-- Issue #630
-- Read-only dry-run for future user feature permissions organization scope hardening.
-- This file must remain read-only. Do not add writes, DDL, grants, or function calls.

with legacy_rows as (
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
), classified as (
  select
    *,
    case
      when profile_organization_id is not null
        and profile_owner_id = owner_id
        then 'deterministically_mappable'
      else 'needs_review'
    end as mapping_status
  from legacy_rows
)
select
  mapping_status,
  count(*) as row_count
from classified
group by mapping_status
order by mapping_status;

with legacy_rows as (
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
)
select
  profile_id,
  feature_key,
  owner_id,
  organization_id,
  profile_organization_id,
  profile_owner_id,
  case
    when profile_organization_id is not null
      and profile_owner_id = owner_id
      then 'deterministically_mappable'
    else 'needs_review'
  end as mapping_status
from legacy_rows
order by mapping_status desc, profile_id asc, feature_key asc;
