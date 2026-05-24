# Receivable incomes organization scope readiness

Issue: #596

## Purpose

Audit whether `public.receivable_incomes.organization_id` is ready for a future `NOT NULL` hardening migration.

This document does not introduce a migration. It records readiness and remaining transitional assumptions.

## Current finding

`receivable_incomes` is a candidate for a future organization scope hardening step, but it should not be hardened in this PR.

Current status:

```txt
Readiness: mostly ready, still transitional
Next safe step: table-scoped preflight/dry-run before a future dedicated hardening PR
```

## Write path review

### Create

`app/protected/contas-a-receber/actions.ts` creates receivable incomes through `createReceivableIncome`.

Current create behavior:

- resolves current profile;
- requires active organization access;
- verifies the receiver member belongs to the current organization or legacy scope;
- checks permission for the selected receiver member;
- inserts `owner_id`;
- inserts `organization_id` from the active organization.

This is compatible with future `receivable_incomes.organization_id NOT NULL` hardening.

### Update

`updateReceivableIncome`:

- verifies the existing income can be managed inside the current organization or legacy scope;
- verifies changed receiver member scope;
- checks receiver member permission;
- updates `organization_id` to the active organization.

`updateReceivableIncomeStatus` also updates `organization_id` to the active organization while changing status.

These paths are compatible with future hardening and also help move touched legacy rows into scoped rows.

### Delete

`deleteReceivableIncome`:

- verifies manage permission through `assertCanManageReceivableIncome`;
- deletes by `id`, `owner_id`, and current organization or legacy scope.

Delete does not need to write `organization_id`, but it still accepts transitional legacy rows.

## Read path review

`lib/finance/receivables-server.ts` reads receivable incomes through `getReceivableIncomesFromClient`.

Current read behavior:

- filters by `owner_id`;
- filters by accessible `receiver_member_id` values;
- does not explicitly filter by `organization_id` in this read helper.

This is still transitional. Access is indirectly constrained by member access and current profile, but a future final state should prefer explicit organization scope in the receivable income read path before removing legacy assumptions.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` is still part of read/write/delete filters;
- `organization_id IS NULL` legacy fallback is still accepted in manage/delete paths;
- read path relies on accessible members instead of explicit `receivable_incomes.organization_id` filtering;
- no `NOT NULL` migration exists for `receivable_incomes` yet.

## Readiness decision

`receivable_incomes` is not blocked by create/update payload gaps: create, update, and status update paths set `organization_id`.

However, a future hardening PR should be separate and must include:

- table-scoped null-organization preflight evidence;
- table-scoped deterministic dry-run evidence;
- migration-local preflight guard;
- rollback instructions;
- static guard proving the migration is scoped only to `receivable_incomes`;
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
