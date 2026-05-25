# User feature permissions organization scope readiness

Issue: #628
Related issues: #614, #624, #626

## Purpose

Audit whether `public.user_feature_permissions.organization_id` is ready for future read-only preflight and dry-run checks.

This document does not introduce SQL checks, a migration, schema hardening, data backfill, RLS changes, billing, E2E, or fallback removal.

## Current finding

`user_feature_permissions` is now a candidate for the next evidence step, but it should not be hardened in this PR.

Current status:

```txt
Readiness: ready for read-only preflight and dry-run
Hardening: blocked until fresh preflight and dry-run evidence exists
Next safe step: dedicated read-only preflight/dry-run PR
```

## Read path review

### Admin dashboard read

`lib/finance/admin-server.ts` reads feature permissions through `getFamilyFeaturePermissions`.

Current read behavior:

- reads from `user_feature_permissions`;
- filters by `owner_id`;
- filters by active organization or legacy null organization scope;
- returns feature permission rows for the admin permissions page.

This is intentionally transitional because legacy null-organization rows may still exist until the table is hardened.

### Runtime access check read

`lib/finance/access-control.ts` reads feature permissions through `getFeaturePermission` and `canUseFeature`.

Current read behavior:

- reads from `user_feature_permissions`;
- filters by `profile_id`;
- filters by `feature_key`;
- filters by active organization or legacy null organization scope;
- prefers an organization-scoped row over a legacy null-organization row;
- grants admins all feature permissions without relying on table rows.

This is compatible with the transitional state.

## Write path review

`app/protected/admin/actions.ts` writes feature permissions through `saveProfileFeaturePermissions`.

Current write behavior:

- resolves the admin profile;
- requires active organization access;
- validates that the target profile belongs to the active organization or accepted legacy scope;
- builds one row per known feature permission key;
- upserts `user_feature_permissions` rows;
- writes `owner_id` from the admin profile;
- writes `organization_id` from the active organization;
- writes `profile_id` from the validated target profile;
- writes `granted_by` from the admin profile.

This is compatible with a future hardening sequence because new writes are organization-scoped.

## UI entrypoint review

The admin permissions page exposes the write path through a minimal callable feature permissions form:

```txt
app/protected/admin/permissoes/page.tsx
components/admin/permissions/admin-permissions-form-section.tsx
components/finance/feature-permissions-form.tsx
```

The form posts to `saveProfileFeaturePermissions`, making the write path user-triggerable in the admin surface.

## RLS review

`supabase/migrations/017_user_feature_permissions_organization_rls.sql` enables organization-aware RLS for `user_feature_permissions`.

Current RLS behavior remains transitional:

- organization-scoped rows use organization membership;
- legacy null-organization rows remain accepted through owner scope;
- `organization_id` is not yet `NOT NULL`.

This is compatible with readiness for read-only preflight/dry-run, not with immediate hardening.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` is still part of read/write records;
- `organization_id IS NULL` legacy fallback is still accepted in read and profile-validation paths;
- no `NOT NULL` migration exists for `user_feature_permissions` yet;
- no table-specific preflight/dry-run SQL exists yet.

## Readiness decision

`user_feature_permissions` is no longer blocked by missing product decision or missing callable write path.

The table is ready for a dedicated read-only preflight/dry-run PR.

A future hardening PR must still be separate and must include:

- fresh null-organization preflight evidence;
- fresh deterministic dry-run evidence;
- migration-local preflight guard;
- rollback instructions;
- static guard proving the migration is scoped only to `user_feature_permissions`;
- no runtime, RLS, UI, billing or E2E mixing.

## Out of scope

This audit does not change:

- schema;
- data;
- SQL preflight checks;
- dry-run checks;
- RLS policies;
- runtime behavior;
- UI behavior;
- billing;
- E2E;
- legacy `owner_id` fallback;
- legacy `organization_id IS NULL` fallback.