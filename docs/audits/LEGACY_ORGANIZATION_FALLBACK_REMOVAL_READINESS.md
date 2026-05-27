# Legacy organization fallback removal readiness

Issue: #641

Related issues: #643, #645, #647, #648, #650, #652, #654

## Purpose

Document the current readiness state for removing the legacy organization fallback from runtime reads and write-validation paths.

This document is a control/status record for the fallback-removal sequence. It must not be used to justify broad fallback removal in one PR.

## Current finding

Legacy fallback removal is partially complete and must continue one surface at a time.

Completed scoped removals:

```txt
#643 runtime permission reads in lib/finance/access-control.ts
#645 admin dashboard reads in lib/finance/admin-server.ts
#647 admin write validation and deletion boundaries in app/protected/admin/actions.ts
#648 bank organization helper reads in lib/organizations/banks.ts
#650 category organization helper reads in lib/organizations/categories.ts
#652 payable organization helper reads in lib/organizations/payables.ts
#654 expense organization helper reads in lib/organizations/expenses.ts
#641 receivable organization helper reads in lib/organizations/receivables.ts
```

The remaining legacy fallback surfaces must stay scoped to later PRs. Do not remove fallback broadly across runtime, organization helpers, schema, RLS, UI, or E2E in the same change.

## Fallback pattern still present

The remaining transitional fallback pattern is represented by helpers named `organizationOrLegacyFilter` and by query filters equivalent to:

```txt
organization_id.eq.<active organization id>,organization_id.is.null
```

This pattern is still allowed only in surfaces that have not yet been removed by a dedicated scoped PR.

## Reviewed source inventory

The current fallback-removal inventory includes these source areas:

```txt
lib/finance/access-control.ts
lib/finance/admin-server.ts
app/protected/admin/actions.ts
lib/organizations/banks.ts
lib/organizations/categories.ts
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

## Removed fallback surfaces

### Runtime permission reads

lib/finance/access-control.ts no longer accepts legacy null organization rows when reading runtime permission data.

The removed surface includes:

- active family members for permission scope expansion;
- module permissions;
- feature permissions;
- visible module keys.

### Admin dashboard reads

lib/finance/admin-server.ts no longer accepts legacy null organization rows when reading admin dashboard data.

The removed surface includes:

- family members;
- profiles;
- module permissions;
- feature permissions.

These reads now require active organization scope and keep owner checks where still needed during the transition.

### Admin write validation and deletion boundaries

app/protected/admin/actions.ts no longer accepts legacy null organization rows while validating or targeting existing records.

The removed surface includes:

- unique email checks;
- unique linked member checks;
- member ownership checks;
- profile ownership checks;
- profile update, link, delete and status paths;
- module permission save validation;
- feature permission save validation.

These paths now require active organization scope and keep owner checks where still needed during the transition. New writes continue to write the active organization id.

### Bank organization helper reads

lib/organizations/banks.ts no longer accepts legacy null organization rows when reading bank organization helper data.

The removed surface includes:

- bank dashboard member reads from `family_members`;
- bank account reads from `banks`.

These reads now require active organization scope and keep owner checks where still needed during the transition. Historical bank account visibility for inactive members remains preserved without accepting null organization rows.

### Category organization helper reads

lib/organizations/categories.ts no longer accepts legacy null organization rows when reading expense category organization helper data.

The removed surface includes:

- expense category reads from `expense_categories`.

These reads now require active organization scope and keep owner checks where still needed during the transition.

### Payable organization helper reads

lib/organizations/payables.ts no longer accepts legacy null organization rows when reading payable organization helper data.

The removed surface includes:

- payable bill reads from `payable_bills`;
- payable dashboard member reads from `family_members`.

These reads now require active organization scope and keep owner checks where still needed during the transition. Existing module permission/member filtering remains preserved without accepting null organization rows.

### Expense organization helper reads

lib/organizations/expenses.ts no longer accepts legacy null organization rows when reading expense organization helper data.

The removed surface includes:

- expense member reads from `family_members`;
- expense category reads from `expense_categories`;
- expense reads from `expenses`.

These reads now require active organization scope and keep owner checks where still needed during the transition. Existing module permission/member filtering remains preserved without accepting null organization rows.

### Receivable organization helper reads

lib/organizations/receivables.ts no longer accepts legacy null organization rows when reading receivable organization helper data.

The removed surface includes:

- receivable income reads from `receivable_incomes`;
- receivable dashboard member reads from `family_members`.

These reads now require active organization scope and keep owner checks where still needed during the transition. Existing module permission/member filtering remains preserved without accepting null organization rows.

## Remaining fallback categories

### Organization feature read paths

The remaining organization helper files still use active organization or legacy null organization filtering while reading hardened financial records and related members. This is transitional runtime compatibility, not schema readiness.

Remaining helper surfaces include:

```txt
lib/organizations/people.ts
```

## Required next step

The next safe step is a separate scoped runtime PR that removes one remaining fallback surface at a time and proves the target code path no longer accepts legacy null organization rows.

That later PR must:

- remove fallback only from a reviewed path;
- keep active organization filtering explicit;
- keep owner checks where still needed during the transition;
- update tests for the exact path being changed;
- avoid schema, RLS, UI, and E2E mixing unless a separate issue explicitly scopes them.

## Stop criteria

Do not remove legacy fallback if any of the following is true:

- a read path still depends on legacy null organization rows for valid active data;
- an admin validation path would stop finding an existing valid record without a migration/remediation plan;
- a test only removes a string assertion without proving the target behavior;
- the PR mixes fallback removal with unrelated schema, RLS, UI, or E2E work.

## Out of scope for the scoped fallback-removal sequence

The fallback-removal sequence does not change by itself:

- schema;
- data;
- migrations;
- RLS policies;
- UI;
- E2E;
- legacy owner fallback.
