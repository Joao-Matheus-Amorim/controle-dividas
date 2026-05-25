# Feature decision status

Issue: #624
Related issue: #626

## Purpose

Record the decision status for the feature permission table before any later hardening work.

## Current status

```txt
Decision status: use feature permissions
Write path status: scoped callable write path added
Hardening status: blocked until readiness, preflight, and dry-run are completed
```

## Current evidence

The product will keep and use feature permissions.

A scoped server action now writes feature permission rows with organization scope from the active organization, and the admin permissions page exposes a minimal callable feature permissions form.

## Decision

Do not create a hardening migration yet.

The next implementation step after this write path should be a separate readiness audit or a focused UI refinement PR.

A future hardening sequence may only proceed after readiness, read-only preflight, and read-only dry-run evidence are reviewed in separate scoped PRs.

## Out of scope

- No migration.
- No schema change.
- No data change outside the explicit server action when invoked.
- No RLS change.
- No billing change.
- No E2E change.
- No fallback removal.