# Organization Scope Hardening Plan

Issue: #566
Status reconciliation: #575

## Purpose

Define the safe plan for schema hardening steps where tenant-scoped rows require a non-empty organization scope.

This document is still a planning/control document. It records completed incremental hardening and the remaining order. It does not update data, does not change RLS policies, and does not remove legacy `owner_id` fallback.

## Current evidence

The following safety chain exists:

1. Legacy readiness audit.
2. Read-only null-organization preflight counters.
3. Backfill runbook with rollback and validation requirements.
4. Read-only deterministic mapping dry-run.
5. Production evidence showing zero legacy null-organization rows across transitional tenant tables.
6. Incremental hardening already completed for the first finance tables.

## Current hardening state

| Table | Current status | Notes |
| --- | --- | --- |
| `expense_categories` | hardened | `020_expense_categories_organization_scope_hardening.sql` applies `organization_id NOT NULL` after a migration-local preflight guard |
| `family_members` | hardened | `021_family_members_organization_scope_hardening.sql` applies `organization_id NOT NULL` after seed contract and migration-local preflight guard |
| `expenses` | hardened | `022_expenses_organization_scope_hardening.sql` applies `organization_id NOT NULL` after expenses-specific readiness, preflight, dry-run and migration-local preflight guard |
| `payable_bills` | hardened | `023_payable_bills_organization_scope_hardening.sql` applies `organization_id NOT NULL` after payable bills-specific readiness, preflight, dry-run and migration-local preflight guard |
| `receivable_incomes` | hardened | `024_receivable_incomes_organization_scope_hardening.sql` applies `organization_id NOT NULL` after receivable incomes-specific readiness, preflight, dry-run and migration-local preflight guard |
| `banks` | hardened | `025_banks_organization_scope_hardening.sql` applies `organization_id NOT NULL` after banks-specific readiness, preflight, dry-run and migration-local preflight guard |
| `user_module_permissions` | hardened | `026_user_module_permissions_organization_scope_hardening.sql` applies `organization_id NOT NULL` after module permissions-specific readiness, preflight, dry-run and migration-local preflight guard |
| `user_feature_permissions` | ready for preflight/dry-run | `docs/audits/USER_FEATURE_PERMISSIONS_ORGANIZATION_SCOPE_READINESS.md` confirms scoped callable write path and keeps hardening blocked until fresh read-only evidence exists |
| `profiles` | special handling required | `docs/audits/PROFILES_READINESS.md` references profiles read-only checks; hardening still requires target-environment evidence review before any migration |

## Required pre-migration evidence

Before any future schema-hardening PR is approved, the PR must include fresh evidence from the target environment:

```txt
docs/sql/legacy-organization-null-preflight.sql
docs/sql/legacy-organization-backfill-dry-run.sql
```

For every target table, the evidence must show:

- zero null-organization rows;
- zero blocked rows;
- zero ambiguous rows;
- no drift between review and execution.

Table-specific preflight/dry-run scripts may also be added for the target table when useful for review clarity.

## Recommended order

Do not harden every table in one PR. Continue using a small PR sequence:

1. Remaining non-profile finance tables with active write guards.
2. Permission tables after confirming all write paths set organization scope.
3. `profiles` only after bootstrap/admin organization assignment is proven compatible.
4. Legacy fallback removal only after schema hardening and read-path migration are complete.

Already completed in this sequence:

1. `expense_categories`.
2. `family_members`.
3. `expenses`.
4. `payable_bills`.
5. `receivable_incomes`.
6. `banks`.
7. `user_module_permissions`.

## Stop criteria

Stop the hardening plan if any of the following is true:

- preflight shows any target row without organization scope;
- dry-run shows blocked or ambiguous rows;
- runtime write guards fail;
- RLS guards fail;
- bootstrap/admin profile creation can still produce organization-less profiles;
- rollback is not documented;
- the PR mixes schema hardening with runtime, RLS, UI, billing, or E2E changes.

## Rollback expectations

A future schema-hardening PR must document rollback explicitly.

A rollback plan must include:

- the exact constraint or schema change to revert;
- expected impact of reverting;
- confirmation that reverting schema does not revert data;
- validation queries after rollback.

A rollback plan that only says "revert the PR" is not enough.

## Profiles blocker

`profiles` requires special treatment because bootstrap/admin profile creation has historically allowed a profile to exist before organization onboarding assigns the organization scope.

Before hardening `profiles`, the project must prove one of these paths:

1. bootstrap/admin creation assigns organization scope before profile creation; or
2. onboarding creates organization scope atomically with the profile; or
3. `profiles` remains transitional while dependent tables are hardened first.

Until that is resolved, `profiles` must not be hardened together with lower-risk finance tables.

## Out of scope

This plan does not change:

- data;
- migrations by itself;
- RLS policies;
- runtime actions;
- auth/linking;
- UI;
- billing;
- E2E;
- legacy owner fallback.