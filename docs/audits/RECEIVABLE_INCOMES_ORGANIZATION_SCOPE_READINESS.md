# Receivable incomes organization scope readiness

Issue: #596
Related issue: #598

## Purpose

Record the current organization-scoped runtime and RLS boundary for `public.receivable_incomes` after `supabase/migrations/054_receivable_incomes_organization_write_rls.sql`.

This document does not retire the legacy schema column. `owner_id remains a legacy schema column`, and schema-final owner_id removal remains out of scope.

## Current status

`receivable_incomes` now uses the active organization as the runtime boundary for reads and writes.

Current status:

```txt
Runtime boundary: organization-scoped
Write RLS boundary: organization + CONTAS_A_RECEBER permission scoped
Legacy owner_id: preserved from organization.owner_auth_user_id
```

## Read-only checks for future hardening

Table-scoped read-only checks still exist for future `receivable_incomes` hardening:

```txt
docs/sql/receivable-incomes-organization-null-preflight.sql
docs/sql/receivable-incomes-organization-dry-run.sql
```

These scripts are preparation only. They do not mutate data and do not apply constraints.

## Write path review

### Create

`app/protected/contas-a-receber/actions.ts` creates receivable incomes through `createReceivableIncome`.

Current create behavior:

- requires active organization access;
- verifies the receiver member belongs to the active organization;
- checks `CONTAS_A_RECEBER` permission for the selected receiver member;
- inserts `organization_id` from the active organization;
- inserts `owner_id` from `organization.owner_auth_user_id`.

### Update

`updateReceivableIncome`:

- verifies the existing income can be managed inside the active organization;
- verifies changed receiver member scope;
- checks receiver member permission;
- updates by `id` and active `organization_id`;
- updates `organization_id` to the active organization.

`updateReceivableIncomeStatus` also updates by `id` and active `organization_id` while changing status.

### Delete

`deleteReceivableIncome`:

- verifies manage permission through `assertCanManageReceivableIncome`;
- deletes by `id` and active `organization_id`.

## Read path review

`lib/organizations/receivables.ts` reads receivable incomes through `getOrganizationReceivableIncomes`.

Current read behavior:

- filters `family_members.organization_id` by the active organization;
- filters `receivable_incomes.organization_id` by the active organization;
- filters by accessible `receiver_member_id` values.

The read path filters `receivable_incomes.organization_id` and accessible members.

## RLS boundary

`supabase/migrations/054_receivable_incomes_organization_write_rls.sql` replaces owner-scoped write policies with organization-scoped write policies.

The write helper:

- validates that `receiver_member_id` belongs to the target organization;
- requires an active organization membership before admin or permission checks;
- allows organization admins;
- otherwise requires active `CONTAS_A_RECEBER` module permission for the requested action;
- preserves the legacy owner boundary with `organization_legacy_owner_matches(organization_id, owner_id)`.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id remains a legacy schema column`;
- new rows preserve the target organization's legacy owner through `organization.owner_auth_user_id`;
- older migrations are not rewritten;
- schema-final owner_id removal remains out of scope.

## Out of scope

This audit does not change:

- schema-final owner removal;
- seed data;
- billing;
- UI;
- E2E.
