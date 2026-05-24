# Payable bills organization scope readiness

Issue: #590

## Purpose

Audit whether `public.payable_bills.organization_id` is ready for a future `NOT NULL` hardening migration.

This document does not introduce a migration. It records readiness and remaining transitional assumptions.

## Current finding

`payable_bills` is a candidate for a future organization scope hardening step, but it should not be hardened in this PR.

Current status:

```txt
Readiness: mostly ready, still transitional
Next safe step: table-scoped preflight/dry-run before a future dedicated hardening PR
```

## Write path review

### Create

`app/protected/contas-a-pagar/actions.ts` creates payable bills through `createPayableBill`.

Current create behavior:

- resolves current profile;
- requires active organization access;
- verifies the responsible member belongs to the current organization or legacy scope;
- checks permission for the selected responsible member;
- inserts `owner_id`;
- inserts `organization_id` from the active organization.

This is compatible with future `payable_bills.organization_id NOT NULL` hardening.

### Update

`updatePayableBill`:

- verifies the existing bill can be managed inside the current organization or legacy scope;
- verifies changed responsible member scope;
- checks responsible member permission;
- updates `organization_id` to the active organization.

`updatePayableBillStatus` also updates `organization_id` to the active organization while changing status.

These paths are compatible with future hardening and also help move touched legacy rows into scoped rows.

### Delete

`deletePayableBill`:

- verifies manage permission through `assertCanManagePayableBill`;
- deletes by `id`, `owner_id`, and current organization or legacy scope.

Delete does not need to write `organization_id`, but it still accepts transitional legacy rows.

## Read path review

`lib/finance/payables-server.ts` reads payable bills through `getPayableBillsFromClient`.

Current read behavior:

- filters by `owner_id`;
- filters by accessible `responsible_member_id` values;
- does not explicitly filter by `organization_id` in this read helper.

This is still transitional. Access is indirectly constrained by member access and current profile, but a future final state should prefer explicit organization scope in the payable bill read path before removing legacy assumptions.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` is still part of read/write/delete filters;
- `organization_id IS NULL` legacy fallback is still accepted in manage/delete paths;
- read path relies on accessible members instead of explicit `payable_bills.organization_id` filtering;
- no `NOT NULL` migration exists for `payable_bills` yet.

## Readiness decision

`payable_bills` is not blocked by create/update payload gaps: create, update, and status update paths set `organization_id`.

However, a future hardening PR should be separate and must include:

- table-scoped null-organization preflight evidence;
- table-scoped deterministic dry-run evidence;
- migration-local preflight guard;
- rollback instructions;
- static guard proving the migration is scoped only to `payable_bills`;
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
