# Legacy `organization_id IS NULL` Production Evidence

Issue: #564

## Purpose

Record the observed production Supabase evidence after running the read-only legacy organization preflight and dry-run scripts.

This note is documentation-only. It does not apply a backfill, does not alter schema, does not change RLS policies, and does not remove legacy `owner_id` fallback.

## Scripts executed

The following read-only scripts were executed in Supabase SQL Editor:

```txt
docs/sql/legacy-organization-null-preflight.sql
docs/sql/legacy-organization-backfill-dry-run.sql
```

No data-changing SQL was executed.

## Preflight result summary

The preflight returned `0` rows with `organization_id IS NULL` for every transitional table:

| Table | `organization_id IS NULL` rows |
| --- | ---: |
| `profiles` | 0 |
| `family_members` | 0 |
| `expense_categories` | 0 |
| `expenses` | 0 |
| `payable_bills` | 0 |
| `receivable_incomes` | 0 |
| `banks` | 0 |
| `user_module_permissions` | 0 |
| `user_feature_permissions` | 0 |

## Dry-run mapping result summary

The dry-run returned `0` for total legacy rows and all mapping/blocking categories for every transitional table:

| Table | Total legacy null rows | Deterministically mappable | Missing owner/profile | Owner without organization | Ambiguous owner organization |
| --- | ---: | ---: | ---: | ---: | ---: |
| `profiles` | 0 | 0 | 0 | 0 | 0 |
| `family_members` | 0 | 0 | 0 | 0 | 0 |
| `expense_categories` | 0 | 0 | 0 | 0 | 0 |
| `expenses` | 0 | 0 | 0 | 0 | 0 |
| `payable_bills` | 0 | 0 | 0 | 0 | 0 |
| `receivable_incomes` | 0 | 0 | 0 | 0 | 0 |
| `banks` | 0 | 0 | 0 | 0 | 0 |
| `user_module_permissions` | 0 | 0 | 0 | 0 | 0 |
| `user_feature_permissions` | 0 | 0 | 0 | 0 | 0 |

## Interpretation

At the time of execution, the production database had no remaining legacy null-organization rows in the transitional tenant tables covered by the preflight and dry-run.

This evidence supports planning a future `organization_id NOT NULL` hardening path, but it does not by itself apply that hardening.

## Next required step before schema hardening

Before any future `organization_id NOT NULL` migration:

1. Re-run both read-only scripts immediately before the migration PR is approved.
2. Confirm the result is still zero for every transitional table.
3. Confirm bootstrap/admin organization assignment behavior is compatible with non-null organization scope.
4. Keep runtime write guards and RLS guards green.
5. Prepare a dedicated migration PR for schema hardening only.

## Explicitly not done here

This evidence note does not change:

- data;
- migrations;
- RLS policies;
- runtime actions;
- auth/linking;
- UI;
- billing;
- E2E;
- `owner_id` fallback;
- `organization_id` nullability.
