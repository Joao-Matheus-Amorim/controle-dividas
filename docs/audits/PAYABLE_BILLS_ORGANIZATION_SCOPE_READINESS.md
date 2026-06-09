# Payable bills organization scope readiness

Issue: #590
Related issue: #592

## Purpose

Record the current organization-scoped runtime and RLS boundary for
`public.payable_bills`.

This document does not remove `owner_id`. It records the transitional contract
after `supabase/migrations/053_payable_bills_organization_write_rls.sql`.

## Current finding

`payable_bills` is organization-scoped for current runtime reads and writes.

Current status:

```txt
Read/write boundary: organization-scoped
Legacy owner_id: still present and preserved as the target organization owner
Schema-final owner_id removal: out of scope
```

## Read-only checks for future schema work

Table-scoped read-only checks still exist for future schema hardening:

```txt
docs/sql/payable-bills-organization-null-preflight.sql
docs/sql/payable-bills-organization-dry-run.sql
```

These scripts are preparation only. They do not mutate data and do not remove
`owner_id`. They do not apply constraints.

## Write path review

### Create

`app/protected/contas-a-pagar/actions.ts` creates payable bills through
`createPayableBill`.

Current create behavior:

- requires active organization access;
- verifies the responsible member belongs to the current organization;
- checks `CONTAS_A_PAGAR` permission for the selected responsible member;
- inserts `organization_id` from the active organization;
- inserts `owner_id` from `organization.owner_auth_user_id`.

This keeps the legacy owner id aligned with the target organization while
runtime remains organization-first.

### Update

`updatePayableBill`:

- verifies the existing bill inside the current organization;
- verifies the current and changed responsible member belong to the current
  organization;
- checks `CONTAS_A_PAGAR` permission for the responsible member;
- updates by `id` and active `organization_id`;
- does not filter writes by `profile.owner_id`.

`updatePayableBillStatus` also updates by `id` and active `organization_id`,
with exact count verification.

### Delete

`deletePayableBill`:

- verifies manage permission through `assertCanManagePayableBill`;
- deletes by `id` and active `organization_id`;
- does not filter deletes by `profile.owner_id`.

## Read path review

`lib/organizations/payables.ts` reads payable bills through
`getOrganizationPayableBills`.

Current read behavior:

- filters `family_members.organization_id` by the active organization;
- filters `payable_bills.organization_id` by the active organization;
- filters `payable_bills.responsible_member_id` by accessible member ids.

The read path filters `payable_bills.organization_id` and accessible members
instead of relying on `owner_id`.

## RLS write boundary

`supabase/migrations/053_payable_bills_organization_write_rls.sql` moves writes
from authenticated-user ownership to organization-scoped writes.

The direct-client RLS boundary:

- requires the responsible member to belong to the target organization;
- requires active membership in the target organization before admin or module
  permissions are honored;
- allows organization admins;
- otherwise checks `CONTAS_A_PAGAR` module permissions for `can_create`,
  `can_edit`, or `can_delete`;
- honors `family`, `selected`, and `own` permission scopes;
- requires `organization_legacy_owner_matches(organization_id, owner_id)` for
  insert/update rows.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- owner_id remains a legacy schema column;
- new rows preserve the target organization owner in `owner_id`;
- old migrations remain historical and are not rewritten;
- schema-final owner_id removal remains out of scope.

## Out of scope

This audit does not change:

- schema-final owner_id removal;
- historical migrations;
- UI;
- billing;
- E2E.
