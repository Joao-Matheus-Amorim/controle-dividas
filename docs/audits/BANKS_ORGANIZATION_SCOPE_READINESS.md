# Banks organization scope readiness

Issue: #602
Related issue: #604

## Purpose

Audit whether `public.banks.organization_id` is ready for a future `NOT NULL` hardening migration.

This document does not introduce a migration. It records readiness and remaining transitional assumptions.

## Current finding

`banks` already has `organization_id NOT NULL` hardening and now has an organization-first read/write boundary for the organization-aware runtime path.

Current status:

```txt
Readiness: organization-aware runtime path ready, still transitional because owner_id remains in the schema
Next safe step: continue the next owner_id consumer in a dedicated PR
```

## Read-only checks for future hardening

Table-scoped read-only checks now exist for future `banks` hardening:

```txt
docs/sql/banks-organization-null-preflight.sql
docs/sql/banks-organization-dry-run.sql
```

These scripts are preparation only. They do not mutate data and do not apply constraints.

## Write path review

### Create

`app/protected/bancos/actions.ts` creates bank accounts through `createBankAccount`.

Current create behavior:

- requires active organization access;
- verifies the linked family member belongs to the current organization;
- checks permission for the selected linked member;
- inserts `owner_id` from `organization.owner_auth_user_id` for legacy compatibility;
- inserts `organization_id` from the active organization.

This is compatible with future `banks.organization_id NOT NULL` hardening.

### Update

`updateBankAccount`:

- verifies the existing bank account can be managed inside the current organization;
- verifies changed linked member scope;
- checks linked member permission;
- updates `organization_id` to the active organization.

`updateBankAccountBalance` also updates `organization_id` to the active organization while changing balance.

These paths are compatible with future hardening and also help move touched legacy rows into scoped rows.

### Delete

`deleteBankAccount`:

- verifies manage permission through `assertCanManageBankAccount`;
- deletes by `id` and current organization.

Delete does not need to write `organization_id`.

## Read path review

`lib/organizations/banks.ts` reads bank accounts through `getOrganizationBankAccounts`.

Current read behavior:

- filters by `organization_id`;
- filters by accessible `family_member_id` values;
- reads members through `organization_id` and accessible member ids;
- does not filter by member active status so historical bank accounts remain visible.

Organization-aware bank reads filter by `organization_id` and accessible members, not `profile.owner_id`.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` is still selected and written as a legacy compatibility column;
- RLS writes rely on `can_manage_organization_bank(organization_id, family_member_id, action)` plus `organization_legacy_owner_matches(organization_id, owner_id)` while the legacy column exists;
- legacy finance facade helpers under `lib/finance/banks-server.ts` remain compatibility-only.

## Readiness decision

`banks` is not blocked by create/update payload gaps: create, update, and balance update paths set `organization_id`; create also preserves the target organization's legacy owner id.

Any future schema-retirement PR should be separate and must include:

- fresh null-organization preflight evidence;
- fresh deterministic dry-run evidence;
- migration-local preflight guard;
- rollback instructions;
- static guard proving the migration is scoped only to `banks`;
- no UI, billing or E2E mixing.

## Out of scope

This audit does not change:

- schema drop;
- data backfill;
- UI;
- billing;
- E2E;
- removal of the legacy `owner_id` column.
