# Profiles readiness audit

Issue: #616
Current review: #636
Related issues: #618, #620, #622

## Purpose

Record the current readiness state for hardening profile organization scope.

This audit tracks read-only SQL preparation, the profile bootstrap runtime boundary, onboarding organization assignment, admin profile write paths, and the pending evidence gate. It does not add a migration, schema change, data change, RLS change, runtime change, UI change, billing change, E2E change, or legacy fallback removal.

## Finding

Profiles should not be schema-hardened in this PR.

The current product has explicit initial organization onboarding, and family profile write paths set the active organization scope. Profile bootstrap redirects the configured admin to explicit organization onboarding instead of creating an organization-less profile as a hidden side effect.

The profile table is ready for target-environment evidence review, but hardening remains blocked until that output is reviewed and recorded.

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

The profile bootstrap callers keep onboarding organization-first:

- `lib/finance/access-control.ts` redirects the configured admin without a profile to `/onboarding/organizacao`.
- `lib/finance/admin-server.ts` redirects the configured admin without a profile to `/onboarding/organizacao`.
- The onboarding action remains the explicit path that calls the initial organization onboarding RPC.
- Bootstrap callers do not create organizations or memberships implicitly.
- Bootstrap callers do not insert or upsert organization-less profiles.

## Onboarding organization assignment

`app/onboarding/organizacao/actions.ts` calls `create_initial_organization_onboarding`.

`supabase/migrations/019_initial_organization_onboarding_rpc.sql` keeps the initial organization path transactional:

- creates the organization;
- creates the owner membership;
- creates a new owner profile with `organization_id` when no profile exists;
- updates an existing active owner profile with `organization_id` when the profile exists but is still unscoped;
- blocks onboarding when the profile already has organization scope;
- blocks a second active organization membership during the transitional one-active-membership phase.

## Admin profile write paths

`app/protected/admin/actions.ts` writes family access profiles with active organization scope:

- `createFamilyUser` inserts profiles with `organization_id: organization.id`;
- `updateFamilyUser` updates profile fields and rewrites `organization_id: organization.id`;
- `syncFamilyUserAuthLink` links auth users and rewrites `organization_id: organization.id`;
- `toggleFamilyUserStatus` rewrites `organization_id: organization.id` when changing active status.

Delete remains scoped by owner and active organization or legacy null-organization filter.

## Reviewed areas

- `lib/finance/bootstrap-admin-profile.ts`
- `lib/finance/access-control.ts`
- `lib/finance/admin-server.ts`
- `lib/organizations/server.ts`
- `app/onboarding/organizacao/actions.ts`
- `supabase/migrations/019_initial_organization_onboarding_rpc.sql`
- `app/protected/admin/actions.ts`
- `docs/audits/PROFILES_EVIDENCE_STATUS.md`
- `docs/sql/profile-organization-null-check.sql`
- `docs/sql/profile-organization-dry-run.sql`

## Decision

The next safe step after this runtime alignment is to review the profiles read-only check output from the target environment before considering a schema-only hardening migration.

Profiles are ready for target-environment evidence review only.

No profiles hardening migration should be created until the read-only checks prove that remaining legacy rows are zero or otherwise safely resolved in a separate scoped PR.

If evidence shows any row needing review, stop and open a separate remediation issue before hardening.

## Out of scope

- No schema change.
- No data change.
- No RLS change.
- No runtime change.
- No UI change.
- No billing change.
- No E2E change.
- No legacy fallback removal.