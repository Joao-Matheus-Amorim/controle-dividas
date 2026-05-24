# Organization Scope Hardening Plan

Issue: #566

## Purpose

Define the safe plan for a future schema hardening step where tenant-scoped rows require a non-empty organization scope.

This document is planning-only. It does not apply schema changes, does not update data, does not change RLS policies, and does not remove legacy `owner_id` fallback.

## Current evidence

The following safety chain exists:

1. Legacy readiness audit.
2. Read-only null-organization preflight counters.
3. Backfill runbook with rollback and validation requirements.
4. Read-only deterministic mapping dry-run.
5. Production evidence showing zero legacy null-organization rows across transitional tenant tables.

## Candidate tables

The hardening candidates are the tenant-scoped transitional tables currently covered by the preflight and dry-run evidence:

| Table | Candidate status | Notes |
| --- | --- | --- |
| `family_members` | candidate | finance/member write guards are in place |
| `expense_categories` | candidate | finance/category write guards are in place |
| `expenses` | candidate | finance/expense write guards are in place |
| `payable_bills` | candidate | payable write guards are in place |
| `receivable_incomes` | candidate | receivable write guards are in place |
| `banks` | candidate | bank write guards are in place |
| `user_module_permissions` | candidate | permission write guards are in place |
| `user_feature_permissions` | candidate after write-path confirmation | prior audits found no active write path in the audited surface |
| `profiles` | special handling required | bootstrap/admin profile behavior must be resolved before hardening |

## Required pre-migration evidence

Before any future schema-hardening PR is approved, the PR must include fresh evidence from the production target environment:

```txt
docs/sql/legacy-organization-null-preflight.sql
docs/sql/legacy-organization-backfill-dry-run.sql
```

The evidence must show:

- zero null-organization rows for every target table;
- zero blocked rows;
- zero ambiguous rows;
- no drift between review and execution.

## Recommended order

Do not harden every table in one PR. Use a small PR sequence:

1. Non-profile finance tables with active write guards.
2. Permission tables after confirming all write paths set organization scope.
3. `profiles` only after bootstrap/admin organization assignment is proven compatible.
4. Legacy fallback removal only after schema hardening and read-path migration are complete.

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
- migrations;
- RLS policies;
- runtime actions;
- auth/linking;
- UI;
- billing;
- E2E;
- legacy `owner_id` fallback;
- schema nullability.
