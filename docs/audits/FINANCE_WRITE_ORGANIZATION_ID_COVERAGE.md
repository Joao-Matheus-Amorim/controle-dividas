# Finance Write organization_id Coverage Audit

Issue: #552

## Goal

Audit finance write paths to verify that tenant-scoped runtime writes set or preserve the active `organization_id` while the SaaS data model remains transitional.

This PR is audit/guard only. It does not change runtime behavior, schema, RLS policies, UI, billing, or E2E.

## Guard added

A focused static guard was added in:

```txt
__tests__/unit/finance-write-organization-id-coverage.test.ts
```

The guard verifies representative finance write paths for:

- write to the expected table;
- `organization_id: organization.id` on create/update/upsert paths where the row must be moved into the active organization scope;
- `organizationOrLegacyFilter(organization.id)` on update/delete paths that intentionally support transitional legacy rows.

This is a CI backstop for obvious regressions. It does not replace behavioral RLS tests against real authenticated database sessions.

## Coverage summary

| Area | Table | Create sets organization_id | Updates set organization_id | Write filter scopes organization/legacy | Status |
| --- | --- | --- | --- | --- | --- |
| Pessoas | `family_members` | yes | yes | yes | covered |
| Configuracoes | `expense_categories` | yes | yes | yes | covered |
| Gastos | `expenses` | yes | yes | yes | covered |
| Bancos | `banks` | yes | yes | yes | covered |
| Contas a pagar | `payable_bills` | yes | yes | yes | covered |
| Contas a receber | `receivable_incomes` | yes | yes | yes | covered |
| Admin usuarios | `profiles` | yes for family users | yes | yes | covered/transitional |
| Admin permissoes | `user_module_permissions` | yes | yes via upsert | current form has no delete path | covered |
| Feature permissions | `user_feature_permissions` | no active write path found | no active write path found | no active write path found | no active write path |
| Bootstrap admin | `profiles` | no organization at bootstrap | not applicable | not applicable | transitional |

## Findings

### Covered runtime finance writes

The audited Server Actions load the active organization through `requireOrganizationAccess()` and set `organization_id: organization.id` in create/update payloads.

Covered areas:

- `app/protected/pessoas/actions.ts`
- `app/protected/configuracoes/actions.ts`
- `app/protected/gastos/actions.ts`
- `app/protected/bancos/actions.ts`
- `app/protected/contas-a-pagar/actions.ts`
- `app/protected/contas-a-receber/actions.ts`
- `app/protected/admin/actions.ts`

### Transitional update/delete filtering

Update/delete paths intentionally continue to support transitional legacy rows through:

```txt
organizationOrLegacyFilter(organization.id)
```

This lets legacy rows with `organization_id IS NULL` be edited into the active organization scope while the schema remains transitional.

This is not the final SaaS data model. It remains acceptable only while `organization_id` is nullable and legacy `owner_id` fallback is still supported.

### Bootstrap admin profile

`lib/finance/bootstrap-admin-profile.ts` creates the first admin profile before organization onboarding assigns an active organization context. That object intentionally does not set `organization_id` yet.

The guard records this as transitional instead of marking it as final coverage.

### user_feature_permissions

This audit did not find an active runtime write path for `user_feature_permissions` in the inspected admin write actions. Reads are handled in `lib/finance/admin-server.ts`, and RLS policy coverage is tracked separately by the RLS inventory guards.

If feature permission writes are introduced later, the same PR must set `organization_id: organization.id` and add that path to `finance-write-organization-id-coverage.test.ts`.

## Follow-up recommendations

1. Keep the static guard as a CI backstop for finance write regressions.
2. Add behavioral tests when the harness can safely simulate authenticated non-service-role users.
3. Do not remove legacy organization filtering until there is a completed backfill and rollback plan.
4. Plan a separate issue for eventual `organization_id NOT NULL` hardening after transitional rows are backfilled.

## Out of scope

This audit does not change:

- migrations;
- RLS policies;
- runtime actions;
- auth/linking;
- UI;
- billing;
- E2E;
- legacy `owner_id` fallback;
- `organization_id` nullability.
