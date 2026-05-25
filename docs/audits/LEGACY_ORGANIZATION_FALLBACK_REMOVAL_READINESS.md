# Legacy organization fallback removal readiness

Issue: #641

## Purpose

Document the current readiness state for removing the legacy organization fallback from runtime reads and write-validation paths.

This PR is a documentation-only readiness audit with a static guard. It does not remove runtime fallback, does not change schema, does not change RLS policies, does not change UI, does not change billing, and does not add E2E coverage.

## Current finding

Legacy fallback removal is not ready to happen in this PR.

The schema hardening sequence has moved the critical tenant-scoped tables to `organization_id NOT NULL`, but runtime code still contains transitional helpers that accept the active organization or a legacy null organization scope. Removing that behavior must be a later scoped runtime PR after this inventory is reviewed.

## Fallback pattern still present

The current runtime fallback pattern is represented by helpers named `organizationOrLegacyFilter` and by query filters equivalent to:

```txt
organization_id.eq.<active organization id>,organization_id.is.null
```

This audit does not remove that pattern. It only records where it still exists and what a later removal PR must prove.

## Reviewed source inventory

The current fallback-removal inventory includes these source areas:

```txt
lib/finance/access-control.ts
lib/finance/admin-server.ts
app/protected/admin/actions.ts
lib/organizations/banks.ts
lib/organizations/categories.ts
lib/organizations/expenses.ts
lib/organizations/payables.ts
lib/organizations/receivables.ts
lib/organizations/people.ts
app/protected/configuracoes/actions.ts
app/protected/pessoas/actions.ts
app/protected/gastos/actions.ts
app/protected/contas-a-pagar/actions.ts
app/protected/contas-a-receber/actions.ts
app/protected/bancos/actions.ts
```

## Current fallback categories

### Runtime permission reads

`lib/finance/access-control.ts` still accepts legacy null organization rows when reading:

- active family members for permission scope expansion;
- module permissions;
- feature permissions;
- visible module keys.

### Admin dashboard reads

`lib/finance/admin-server.ts` still accepts legacy null organization rows when reading:

- family members;
- profiles;
- module permissions;
- feature permissions.

### Admin write validation and deletion boundaries

`app/protected/admin/actions.ts` still accepts legacy null organization rows while validating or targeting existing records for:

- unique email checks;
- unique linked member checks;
- member ownership checks;
- profile ownership checks;
- profile update, link, delete and status paths;
- module permission save validation;
- feature permission save validation.

New writes in these actions already write the active organization id, but existing legacy lookup compatibility is still present.

### Organization feature read paths

The organization helper files still use active organization or legacy null organization filtering while reading hardened financial records and related members. This is transitional runtime compatibility, not schema readiness.

## Required next step

The next safe step is a separate scoped runtime PR that removes one fallback surface at a time and proves the target code path no longer accepts legacy null organization rows.

That later PR must:

- remove fallback only from a reviewed path;
- keep active organization filtering explicit;
- keep owner checks where still needed during the transition;
- update tests for the exact path being changed;
- avoid schema, RLS, billing, UI, and E2E mixing unless a separate issue explicitly scopes them.

## Stop criteria

Do not remove legacy fallback if any of the following is true:

- a read path still depends on legacy null organization rows for valid active data;
- an admin validation path would stop finding an existing valid record without a migration/remediation plan;
- a test only removes a string assertion without proving the target behavior;
- the PR mixes fallback removal with unrelated schema, RLS, billing, UI, or E2E work.

## Out of scope

This audit does not change:

- runtime behavior;
- schema;
- data;
- migrations;
- RLS policies;
- UI;
- billing;
- E2E;
- legacy fallback itself.
