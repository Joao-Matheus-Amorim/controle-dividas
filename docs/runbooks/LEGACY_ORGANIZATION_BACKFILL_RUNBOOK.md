# Legacy `organization_id IS NULL` Backfill Runbook

Issue: #560

## Purpose

This runbook defines the safe process for a future legacy `organization_id IS NULL` backfill.

It is intentionally documentation-only. It does not apply a backfill, does not change schema nullability, does not change RLS policies, and does not remove legacy `owner_id` fallback.

## Current phase

The project is still in the planning/preflight phase.

Completed prerequisites:

- RLS coverage inventory and guards exist.
- Finance write paths are guarded to set or preserve `organization_id`.
- Legacy `organization_id IS NULL` readiness audit exists.
- Read-only preflight counters exist at `docs/sql/legacy-organization-null-preflight.sql`.

Not completed yet:

- No production backfill has been applied.
- No `organization_id NOT NULL` constraint has been applied.
- No legacy `owner_id` fallback has been removed.

## Mandatory preflight evidence

Before any future backfill PR is approved, collect and paste the following evidence into the PR body:

1. CI status for the backfill branch.
2. Output of `docs/sql/legacy-organization-null-preflight.sql`.
3. Table-by-table mapping rule showing how each legacy row gets its organization.
4. Expected number of rows to update per table.
5. Manual Supabase execution notes, when a migration must be applied manually.
6. Rollback strategy for every table touched.
7. Post-backfill validation queries and results.

If any evidence is missing, the backfill PR must not be merged.

## Required execution order

A future backfill must proceed in this order:

1. Pull latest `main` and create a small branch for one table or one tightly related table group.
2. Run `docs/sql/legacy-organization-null-preflight.sql` and save the output.
3. Define the ownership mapping rule for the target table.
4. Write the backfill SQL in a dedicated migration or approved manual SQL file.
5. Add a rollback plan before execution.
6. Add post-backfill validation SQL before execution.
7. Run CI.
8. Apply the backfill only after review and green CI.
9. Run the preflight again after execution.
10. Paste before/after counts into the PR or follow-up issue.

## Table-by-table stop/go criteria

### Proceed with a table backfill only if

- The table appears in the preflight output.
- The null count is known.
- The owner-to-organization mapping is deterministic.
- Ambiguous rows are explicitly listed and excluded or handled by a separate plan.
- Rollback SQL or restore procedure is documented.
- Post-backfill validation SQL exists.

### Stop immediately if

- A row can map to more than one organization.
- The mapping requires guessing.
- The table contains rows without a reliable owner/profile relationship.
- Preflight counts changed unexpectedly between review and execution.
- CI is not green.
- Rollback is not documented.

## Blocking criteria for `organization_id NOT NULL`

Do not add `organization_id NOT NULL` until all of these are true:

- Preflight returns zero `organization_id IS NULL` rows for every transitional table.
- Bootstrap admin organization assignment is resolved.
- RLS tests remain green.
- Runtime write guards remain green.
- A rollback plan exists for the nullability migration.
- The migration has been reviewed separately from the data backfill.

## Blocking criteria for removing legacy `owner_id` fallback

Do not remove legacy `owner_id` fallback until all of these are true:

- Every transitional table has been backfilled.
- `organization_id NOT NULL` is already safely applied where appropriate.
- Read paths no longer depend on `organizationOrLegacyFilter`.
- Update/delete paths no longer need legacy fallback behavior.
- Behavioral tests cover organization-only access.
- RLS guards and runtime guards are updated in the same PR series.

## Rollback requirements

Every future backfill PR must include one of the following:

- SQL rollback that restores the previous `organization_id` values from a backup table or exported snapshot; or
- a documented restore procedure using a database backup/export taken immediately before execution.

A rollback plan that says only "revert the PR" is not enough for data backfills.

## Post-backfill validation

After any future backfill, run validation queries that prove:

- expected rows were updated;
- no unexpected table was modified;
- target table has fewer or zero `organization_id IS NULL` rows;
- no row was assigned to an organization without a deterministic mapping;
- application guards and RLS tests still pass.

At minimum, rerun:

```txt
docs/sql/legacy-organization-null-preflight.sql
```

## Out of scope for this runbook PR

This runbook does not change:

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
