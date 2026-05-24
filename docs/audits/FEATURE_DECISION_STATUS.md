# Feature decision status

Issue: #624

## Purpose

Record the decision status for the feature permission table before any later hardening work.

## Current status

```txt
Decision status: use feature permissions
Hardening status: blocked until scoped write path exists
```

## Current evidence

The existing audit found read paths but did not confirm an active application write path.

## Decision

The product will keep and use feature permissions.

Do not create a hardening migration yet.

The next implementation step is a separate scoped write-path PR.

That future PR must prove that writes set organization scope from the active organization before any preflight, dry-run, or schema hardening PR is opened.

## Out of scope

- No migration.
- No schema change.
- No data change.
- No runtime change.
- No RLS change.
- No UI change.
- No billing change.
- No E2E change.
- No fallback removal.
