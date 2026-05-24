# Legacy `organization_id IS NULL` Backfill Readiness Audit

Issue: #556

## Goal

Audit whether the project is ready for a future backfill of legacy tenant rows where `organization_id IS NULL`.

This PR is audit/guard only. It does not apply a data backfill, does not change schema nullability, does not change RLS, and does not remove legacy `owner_id` fallback.

## Current state

Migration `007_add_organization_id_columns.sql` intentionally added nullable `organization_id` columns to existing tenant-scoped tables.

The migration explicitly does not:

- backfill existing rows;
- change existing RLS policies;
- remove `owner_id`;
- make `organization_id NOT NULL`;
- change application queries or Server Actions.

## Transitional tables

The following tables are still transitional because `organization_id` is nullable and legacy `owner_id` fallback is still supported:

| Table | Current status | Backfill readiness |
| --- | --- | --- |
| `profiles` | nullable `organization_id` | not ready for `NOT NULL`; bootstrap admin can be organization-less |
| `family_members` | nullable `organization_id` | writes guarded; data backfill still needed |
| `expense_categories` | nullable `organization_id` | writes guarded; data backfill still needed |
| `expenses` | nullable `organization_id` | writes guarded; data backfill still needed |
| `payable_bills` | nullable `organization_id` | writes guarded; data backfill still needed |
| `receivable_incomes` | nullable `organization_id` | writes guarded; data backfill still needed |
| `banks` | nullable `organization_id` | writes guarded; data backfill still needed |
| `user_module_permissions` | nullable `organization_id` | writes guarded; data backfill still needed |
| `user_feature_permissions` | nullable `organization_id` | no active write path found in prior audit; data backfill still needed if rows exist |

## Runtime notes

### Finance writes

The finance write guard now verifies that key create/update/upsert paths set `organization_id: organization.id` and that update/delete paths remain scoped by `organizationOrLegacyFilter(organization.id)` while legacy rows remain supported.

This reduces new null-organization drift but does not migrate historical data.

### Bootstrap admin profile

`lib/finance/bootstrap-admin-profile.ts` intentionally creates the initial admin profile without `organization_id` because organization onboarding has not assigned the active organization scope yet.

This is the main intentional runtime path that remains organization-less and must be handled before any `profiles.organization_id NOT NULL` migration.

## Preflight counters

A read-only SQL preflight was added in:

```txt
docs/sql/legacy-organization-null-preflight.sql
```

Run it before any future backfill or `organization_id NOT NULL` hardening to capture the current number of legacy rows per table where `organization_id IS NULL`.

The preflight is intentionally read-only and returns one result set with:

```txt
table_name | null_organization_rows
```

It does not update data, alter schema, create objects, drop objects, or grant/revoke permissions.

## Guards added

Focused guards were added in:

```txt
__tests__/unit/legacy-organization-null-backfill-readiness.test.ts
__tests__/unit/legacy-organization-null-preflight-guards.test.ts
```

They verify:

- migration `007` still lists the transitional tables with nullable `organization_id` columns;
- migration `007` does not silently introduce a backfill;
- migration `007` does not silently introduce `organization_id NOT NULL`;
- bootstrap admin profile remains explicitly organization-less until onboarding assigns scope;
- the preflight SQL covers every transitional table;
- the preflight SQL remains read-only executable SQL.

## Follow-up recommendations

Before any actual backfill or nullability hardening:

1. Run `docs/sql/legacy-organization-null-preflight.sql` and save the results in the backfill PR notes.
2. Create a data backfill migration plan per table.
3. Define how bootstrap admin profiles are assigned to an organization.
4. Add a rollback plan for every backfill step.
5. Backfill in a dedicated PR before attempting any `NOT NULL` constraint.
6. Remove legacy `owner_id` fallback only after backfill, behavioral tests, and RLS validation.

## Explicitly out of scope

This audit does not change:

- data;
- migrations;
- RLS policies;
- runtime actions;
- auth/linking;
- UI;
- billing;
- E2E;
- `owner_id` fallback;
- `organization_id` nullability.
