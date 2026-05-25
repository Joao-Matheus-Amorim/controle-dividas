# User feature permissions organization scope hardening runbook

Issue: #634
Migration: `supabase/migrations/027_user_feature_permissions_organization_scope_hardening.sql`

## Purpose

Apply schema-only hardening to require `organization_id` on `user_feature_permissions`.

## Preconditions

Run and review the read-only checks before applying the migration:

```txt
docs/sql/feature-permissions-organization-null-preflight.sql
docs/sql/feature-permissions-organization-dry-run.sql
```

Required evidence:

```txt
null_organization_rows = 0
null_organization_rows_without_matching_profile_scope = 0
needs_review = 0
```

Do not apply the migration if any legacy null-organization row remains.

## Apply

Apply the migration only after CI is green and the evidence above is reviewed.

The migration has a local preflight guard. It raises an exception before `ALTER TABLE` if any target row still has `organization_id IS NULL`.

## Validation after apply

Run:

```sql
select
  count(*) filter (where "organization_id" is null) as null_organization_rows,
  count(*) filter (where "organization_id" is not null) as scoped_rows,
  count(*) as total_rows
from "public"."user_feature_permissions";
```

Expected:

```txt
null_organization_rows = 0
```

## Rollback

Rollback is schema-only. It does not restore data and does not change RLS or runtime code.

To roll back the schema constraint:

```sql
alter table "public"."user_feature_permissions"
  alter column "organization_id" drop not null;
```

This puts the column back to nullable.

## Out of scope

This runbook does not change:

- runtime behavior;
- UI behavior;
- RLS policies;
- billing;
- E2E;
- data values;
- legacy `owner_id` fallback;
- legacy fallback removal.