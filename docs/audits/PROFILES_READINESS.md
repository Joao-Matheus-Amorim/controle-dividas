# Profiles readiness audit

Issue: #616
Related issue: #618

## Purpose

Record the current readiness state for hardening profile organization scope.

This PR is documentation and read-only SQL preparation only. It does not add a migration, runtime change, RLS change, UI change, billing change, E2E change, or legacy fallback removal.

## Finding

Profiles should not be schema-hardened in this PR.

The current product has explicit initial organization onboarding, and family profile write paths set the active organization scope. However, bootstrap profile creation remains transitional and can still happen before onboarding links the profile to an organization.

## Read-only checks for future hardening

Table-scoped read-only checks now exist for future profiles hardening:

```txt
docs/sql/profile-organization-null-check.sql
docs/sql/profile-organization-dry-run.sql
```

These checks are preparation only. They gather read-only evidence and do not mutate data or apply constraints.

## Reviewed areas

- `lib/finance/bootstrap-admin-profile.ts`
- `lib/finance/access-control.ts`
- `lib/finance/admin-server.ts`
- `lib/organizations/server.ts`
- `app/protected/admin/actions.ts`
- initial organization onboarding docs and migration
- existing bootstrap organization guards

## Decision

The next safe step after these checks is to review their output from the target environment before considering a schema-only hardening migration.

No profiles hardening migration should be created until the checks prove that remaining legacy rows are zero or otherwise safely resolved in a separate scoped PR.

## Out of scope

- No schema change.
- No data change.
- No runtime change.
- No RLS change.
- No UI change.
- No billing change.
- No E2E change.
- No legacy fallback removal.
