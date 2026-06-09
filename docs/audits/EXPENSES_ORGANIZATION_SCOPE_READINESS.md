# Expenses organization scope readiness

Issue: #582
Related issue: #586

## Purpose

Audit whether `public.expenses.organization_id` is ready for a future `NOT NULL` hardening migration.

This document records the current readiness state and the dedicated write-boundary migration for `expenses`. It does not introduce schema-final removal of legacy `owner_id`.

## Current finding

`expenses` is organization-hardened and now has organization-scoped runtime/RLS write boundaries.

Current status:

```txt
Readiness: organization write/read boundary versioned
Next safe step: continue with the next dedicated owner_id consumer before schema retirement
```

## Read-only checks for future hardening

Table-scoped read-only checks now exist for future `expenses` hardening:

```txt
docs/sql/expenses-organization-null-preflight.sql
docs/sql/expenses-organization-backfill-dry-run.sql
```

These scripts are preparation only. They do not mutate data and do not apply constraints.

## Write path review

### Create

`app/protected/gastos/actions.ts` creates expenses through `createExpense`.

Current create behavior:

- resolves current profile;
- requires active organization access;
- verifies the selected family member belongs to the current organization;
- verifies the selected category belongs to the current organization when provided;
- checks permission for the selected member;
- inserts `owner_id` from the target organization's legacy owner;
- inserts `organization_id` from the active organization.

This is compatible with future `expenses.organization_id NOT NULL` hardening.

### Update

`updateExpense`:

- verifies the existing expense can be managed inside the current organization;
- verifies changed member/category scope;
- checks member permission;
- updates `organization_id` to the active organization.

This is compatible with the organization-first boundary and keeps legacy `owner_id` as compatibility data only.

### Delete

`deleteExpense`:

- verifies manage permission through `assertCanManageExpense`;
- deletes by `id` and current organization.

Delete does not need to write `organization_id`.

## Read path review

`lib/organizations/expenses.ts` reads expenses through `getOrganizationExpenses`.

Current read behavior:

- filters by active `organization_id`;
- filters by accessible `family_member_id` values;
- builds relations from organization-scoped member/category reads.

The organization read path filters `expenses.organization_id` and accessible member ids, not `profile.owner_id`.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` remains in the schema and payloads as compatibility data;
- new expense writes preserve the target organization's legacy owner id;
- write RLS validates GASTOS permission by action/member and constrains the legacy owner id to the target organization;
- schema final still cannot remove `owner_id` until all consumers are retired.

## Readiness decision

`expenses` is not blocked by create/update payload gaps: current create and update paths set `organization_id`, and create preserves the target organization's legacy owner id.

However, a future hardening PR should be separate and must include:

- focused RLS guard evidence;
- rollback instructions;
- static guard proving the migration is scoped only to `expenses`;
- no runtime, RLS, UI, billing or E2E mixing.

## Out of scope

This audit does not change:

- schema final;
- historical migrations;
- UI;
- billing;
- E2E;
- removal of the legacy `owner_id` column.
