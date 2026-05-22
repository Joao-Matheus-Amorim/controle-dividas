# Data-changing E2E cleanup strategy

Issue: #422

## Goal

Define the cleanup contract required before any Playwright E2E flow creates, updates, or deletes application data.

This document intentionally does not add data-changing browser tests. It defines the rules those tests must follow.

## Non-negotiable rules

```txt
No production user.
No production data.
No shared long-lived fixture mutation.
No data-changing E2E without cleanup.
No test that depends on data left by another test.
No test that silently ignores cleanup failure.
```

## Required gate

Every data-changing E2E spec must be skipped by default and gated behind an explicit environment flag.

Recommended flag:

```txt
RUN_DATA_CHANGING_E2E=true
```

A spec may use a narrower flag when needed, but it must still be skipped by default.

## Required data ownership

Every record created by a data-changing E2E test must be traceable to the test run.

Recommended identifiers:

```txt
e2e_run_id
e2e_slug
e2e_test_prefix
```

When the table does not have a dedicated metadata field, the test must store the marker in an existing safe text field such as name, title, description, or notes.

## Required cleanup lifecycle

Each data-changing E2E test must use this lifecycle:

```txt
1. Generate a unique run marker.
2. Create only records that include the marker.
3. Assert the user-visible behavior.
4. Delete records by marker in afterEach or afterAll.
5. Fail the test run if cleanup fails.
```

## Allowed cleanup approaches

Preferred approaches, in order:

1. Delete through application UI when the test scope is specifically validating delete behavior.
2. Delete through a documented test-only helper using service credentials, only when the helper is explicit, reviewed, and gated.
3. Use database reset only in isolated ephemeral environments.

## Not allowed

```txt
Deleting unmarked records.
Cleaning broad organization data.
Using production organization data.
Depending on record order from previous tests.
Leaving cleanup as a manual instruction only.
Catching cleanup errors without failing the run.
```

## First data-changing flow requirements

Before the first data-changing PR is merged, it must include or reuse:

```txt
A gated data-changing E2E flag.
A unique run marker helper.
A cleanup helper or UI cleanup path.
A test that proves cleanup ran.
Documentation of which tables or UI records are touched.
```

## Recommended next flow

The first data-changing flow should be the smallest reversible flow with the lowest dependency surface.

Recommended first candidate:

```txt
Create member/person
```

Reason:

```txt
It is foundational for family finance flows and can be uniquely marked by name or notes before other financial records depend on it.
```
