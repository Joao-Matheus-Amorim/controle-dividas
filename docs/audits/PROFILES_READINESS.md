# Profiles readiness audit

Issue: #616
Related issues: #618, #620, #622

## Purpose

Record the current readiness state for hardening profile organization scope.

This audit now tracks read-only SQL preparation, the profile bootstrap runtime boundary, and the pending evidence gate. It does not add a migration, schema change, data change, RLS change, runtime change, UI change, billing change, E2E change, or legacy fallback removal.

## Finding

Profiles should not be schema-hardened in this PR.

The current product has explicit initial organization onboarding, and family profile write paths set the active organization scope. Profile bootstrap now redirects the configured admin to explicit organization onboarding instead of creating an organization-less profile as a hidden side effect.

## Read-only checks for future hardening

Table-scoped read-only checks exist for future profiles hardening:

```txt
docs/sql/profile-organization-null-check.sql
docs/sql/profile-organization-dry-run.sql
```

These checks are preparation only. They gather read-only evidence and do not mutate data or apply constraints.

## Evidence status

The current evidence status is tracked in:

```txt
docs/audits/PROFILES_EVIDENCE_STATUS.md
```

Current status: pending target-environment output.

## Runtime bootstrap boundary

The profile bootstrap callers now keep onboarding organization-first:

- `lib/finance/access-control.ts` redirects the configured admin without a profile to `/onboarding/organizacao`.
- `lib/finance/admin-server.ts` redirects the configured admin without a profile to `/onboarding/organizacao`.
- The onboarding action remains the explicit path that calls the initial organization onboarding RPC.
- Bootstrap callers do not create organizations or memberships implicitly.
- Bootstrap callers do not insert or upsert organization-less profiles.

## Reviewed areas

- `lib/finance/bootstrap-admin-profile.ts`
- `lib/finance/access-control.ts`
- `lib/finance/admin-server.ts`
- `lib/organizations/server.ts`
- `app/protected/admin/actions.ts`
- initial organization onboarding docs and migration
- existing bootstrap organization guards

## Decision

The next safe step after this runtime alignment is to review the profiles read-only check output from the target environment before considering a schema-only hardening migration.

No profiles hardening migration should be created until the checks prove that remaining legacy rows are zero or otherwise safely resolved in a separate scoped PR.

## Out of scope

- No schema change.
- No data change.
- No RLS change.
- No runtime change.
- No UI change.
- No billing change.
- No E2E change.
- No legacy fallback removal.