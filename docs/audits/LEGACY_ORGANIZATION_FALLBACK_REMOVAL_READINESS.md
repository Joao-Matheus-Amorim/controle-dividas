# Legacy organization fallback removal readiness

Issue: #641

Related issues: #643, #645, #647, #648, #650, #652, #654

> Status DocDoc: Parcialmente superado
> Uso seguro: historico e controle da remocao gradual do fallback legado de
> organizacao.
> Superado por / observacao: revalidar contra codigo atual, migrations `030` a
> `043`, `docs/VALIDACAO_TECNICA.md` e `docs/SAAS_GAP_REGISTER.md` antes de
> abrir novo PR baseado neste inventario.

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
#641 people organization helper reads in lib/organizations/people.ts
#641 people page and action paths in app/protected/pessoas
#641 settings action paths in app/protected/configuracoes/actions.ts
#641 expense action paths in app/protected/gastos/actions.ts
#641 payable action paths in app/protected/contas-a-pagar/actions.ts
#641 receivable action paths in app/protected/contas-a-receber/actions.ts
#641 bank action paths in app/protected/bancos/actions.ts
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

These reads now require active organization scope and no longer use `owner_id` as read authority in this helper during the transition.

Configuracoes uses the organization-scoped category list, but category create/edit/delete controls, actions, and `expense_categories` write RLS are restricted to owner/admin category managers. New categories still write the organization's legacy owner id for compatibility while `owner_id` remains in the schema.

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

### People organization helper reads

lib/organizations/people.ts no longer accepts legacy null organization rows when reading people organization helper data.

The removed surface includes:

- people reads from `family_members`.

These reads now require active organization scope and no longer use `owner_id` as read authority in this helper during the transition.

### People page and action paths

app/protected/pessoas no longer accepts legacy null organization rows when reading linked access profiles or mutating family members.

The removed surface includes:

- linked profile reads from `profiles`;
- family member update validation and writes;
- family member status validation and writes.

These paths now require active organization scope and keep owner checks on writes while `family_members` RLS still requires `owner_id = auth.uid()`. New and updated writes continue to write the active organization id.

### Settings action paths

app/protected/configuracoes/actions.ts no longer accepts legacy null organization rows when validating, updating, or deleting settings records.

The removed surface includes:

- expense category edit validation reads from `expense_categories`;
- expense category update writes;
- expense category delete writes;
- family member monthly limit update writes.

These paths now require active organization scope. Category writes are restricted to owner/admin category managers and new categories preserve the organization's legacy owner id for compatibility; family member limit writes keep owner checks while `family_members` RLS remains owner-compatible. New and updated writes continue to write the active organization id.

### Expense action paths

app/protected/gastos/actions.ts no longer accepts legacy null organization rows when validating, updating, or deleting expense records.

The removed surface includes:

- selected member validation reads from `family_members`;
- selected category validation reads from `expense_categories`;
- expense edit/delete validation reads from `expenses`;
- expense update writes;
- expense delete writes.

These paths now require active organization scope and keep owner checks where still needed during the transition. New and updated writes continue to write the active organization id.

### Payable action paths

app/protected/contas-a-pagar/actions.ts no longer accepts legacy null organization rows when validating, updating, or deleting payable records.

The removed surface includes:

- payable selected member validation reads from `family_members`;
- payable edit/delete validation reads from `payable_bills`;
- payable update writes;
- payable status update writes;
- payable delete writes.

These paths now require active organization scope and keep owner checks where still needed during the transition. New and updated writes continue to write the active organization id.

### Receivable action paths

app/protected/contas-a-receber/actions.ts no longer accepts legacy null organization rows when validating, updating, or deleting receivable records.

The removed surface includes:

- receivable selected member validation reads from `family_members`;
- receivable edit/delete validation reads from `receivable_incomes`;
- receivable update writes;
- receivable status update writes;
- receivable delete writes.

These paths now require active organization scope and keep owner checks where still needed during the transition. New and updated writes continue to write the active organization id.

### Bank action paths

app/protected/bancos/actions.ts no longer accepts legacy null organization rows when validating, updating, or deleting bank records.

The removed surface includes:

- bank selected member validation reads from `family_members`;
- bank edit/delete validation reads from `banks`;
- bank update writes;
- bank balance update writes;
- bank delete writes.

These paths now require active organization scope and keep owner checks where still needed during the transition. New and updated writes continue to write the active organization id.

## Remaining fallback categories

### Server action read and write-validation paths

The organization helper files no longer use active organization or legacy null organization filtering. The remaining fallback surfaces are server action read and write-validation paths that still support transitional legacy null organization rows. This is transitional runtime compatibility, not schema readiness.

Remaining action surfaces: none in the reviewed inventory.

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
