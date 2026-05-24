# Feature decision status

Issue: #624

## Purpose

Record the decision status for the feature permission table before any later hardening work.

## Current status

```txt
Decision status: pending
Hardening status: blocked
```

## Current evidence

The existing audit found read paths but did not confirm an active application write path.

## Decision

Do not create a hardening migration yet.

The next step must be one of:

1. define a scoped write path in a separate PR;
2. deprecate the table in a separate PR;
3. keep the table blocked until requirements are clear.

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
