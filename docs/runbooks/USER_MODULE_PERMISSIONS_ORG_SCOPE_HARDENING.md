# User module permissions organization scope hardening runbook

Issue: #612
Migration: `supabase/migrations/026_user_module_permissions_organization_scope_hardening.sql`

## Purpose

Harden `public.user_module_permissions.organization_id` as `NOT NULL` with a schema-only migration.

## Preconditions

Run these read-only checks before applying:

- `docs/sql/module-permissions-organization-null-preflight.sql`
- `docs/sql/module-permissions-organization-dry-run.sql`

Required apply condition:

```txt
null_organization_rows = 0
```

If any null rows exist, stop and create a separate remediation PR.

## Apply

Apply migration `026_user_module_permissions_organization_scope_hardening.sql` only after the preconditions are satisfied.

The migration also fails before hardening if null `organization_id` rows still exist.

## Rollback

Rollback is schema-only: relax `public.user_module_permissions.organization_id` from `NOT NULL` back to nullable.

Rollback does not recreate legacy data and does not modify rows.

## Out of scope

No data backfill, RLS policy change, runtime change, UI change, billing change, E2E change, `owner_id` removal, or read-path fallback removal.
