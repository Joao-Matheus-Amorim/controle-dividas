# Banks organization scope readiness

Issue: #602
Related issue: #604

## Purpose

Audit whether `public.banks.organization_id` is ready for a future `NOT NULL` hardening migration.

This document does not introduce a migration. It records readiness and remaining transitional assumptions.

## Current finding

`banks` is a candidate for a future organization scope hardening step, but it should not be hardened in this PR.

Current status:

```txt
Readiness: mostly ready, still transitional
Next safe step: future dedicated hardening PR after fresh preflight/dry-run evidence
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

- resolves current profile;
- requires active organization access;
- verifies the linked family member belongs to the current organization or legacy scope;
- checks permission for the selected linked member;
- inserts `owner_id`;
- inserts `organization_id` from the active organization.

This is compatible with future `banks.organization_id NOT NULL` hardening.

### Update

`updateBankAccount`:

- verifies the existing bank account can be managed inside the current organization or legacy scope;
- verifies changed linked member scope;
- checks linked member permission;
- updates `organization_id` to the active organization.

`updateBankAccountBalance` also updates `organization_id` to the active organization while changing balance.

These paths are compatible with future hardening and also help move touched legacy rows into scoped rows.

### Delete

`deleteBankAccount`:

- verifies manage permission through `assertCanManageBankAccount`;
- deletes by `id`, `owner_id`, and current organization or legacy scope.

Delete does not need to write `organization_id`, but it still accepts transitional legacy rows.

## Read path review

`lib/finance/banks-server.ts` reads bank accounts through `getBankAccounts`.

Current read behavior:

- filters by `owner_id`;
- filters by accessible `family_member_id` values;
- does not explicitly filter by `organization_id` in this read helper.

`getActiveFamilyMembersByOwner` also reads active members by `owner_id`; the visible members are later restricted to accessible member ids.

This is still transitional. Access is indirectly constrained by member access and current profile, but a future final state should prefer explicit organization scope in the bank account read path before removing legacy assumptions.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` is still part of read/write/delete filters;
- `organization_id IS NULL` legacy fallback is still accepted in manage/delete paths;
- read path relies on accessible members instead of explicit `banks.organization_id` filtering;
- no `NOT NULL` migration exists for `banks` yet.

## Readiness decision

`banks` is not blocked by create/update payload gaps: create, update, and balance update paths set `organization_id`.

However, a future hardening PR should be separate and must include:

- fresh null-organization preflight evidence;
- fresh deterministic dry-run evidence;
- migration-local preflight guard;
- rollback instructions;
- static guard proving the migration is scoped only to `banks`;
- no runtime, RLS, UI, billing or E2E mixing.

## Out of scope

This audit does not change:

- schema;
- data;
- RLS policies;
- runtime behavior;
- UI;
- billing;
- E2E;
- legacy `owner_id` fallback.
