# Family Members Organization Scope Hardening

Issue: #572

## Purpose

Document the safety notes for hardening `public.family_members.organization_id`.

This runbook applies only to:

```txt
supabase/migrations/021_family_members_organization_scope_hardening.sql
```

## Scope

Target column:

```txt
public.family_members.organization_id
```

No other table is in scope.

## Required checks

Before applying the migration in any persistent environment, record fresh evidence from:

```txt
docs/sql/legacy-organization-null-preflight.sql
docs/sql/legacy-organization-backfill-dry-run.sql
```

The `family_members` rows must show zero null organization rows, zero blocked rows, and zero ambiguous rows.

The migration also has an internal preflight guard and fails before the schema change if `public.family_members.organization_id IS NULL` rows exist.

## Seed compatibility

Runtime seed code must use:

```txt
buildDefaultFamilyMemberSeedRows(ownerId, organizationId)
```

Every default family member seed row must include:

```txt
organization_id: organizationId
```

## Rollback expectation

Rollback is schema-only. It does not change existing data.

The rollback path is to remove the `NOT NULL` requirement from `public.family_members.organization_id`, then re-run the same validation evidence.

## Explicitly out of scope

This change does not update data, backfill data, alter `profiles`, harden other tables, change RLS, change UI, change billing, change E2E tests, or remove legacy `owner_id` fallback.
