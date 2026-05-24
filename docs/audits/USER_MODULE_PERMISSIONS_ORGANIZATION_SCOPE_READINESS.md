# User module permissions organization scope readiness

Issue: #608

## Purpose

Audit whether `public.user_module_permissions.organization_id` is ready for a future `NOT NULL` hardening migration.

This document does not introduce a migration. It records readiness and remaining transitional assumptions.

## Current finding

`user_module_permissions` is a candidate for a future organization scope hardening step, but it should not be hardened in this PR.

Current status:

```txt
Readiness: mostly ready, still transitional
Next safe step: table-scoped preflight/dry-run before a future dedicated hardening PR
```

## Write path review

### Family user creation

`app/protected/admin/actions.ts` creates default module permissions inside `createFamilyUser`.

Current create behavior:

- resolves the admin profile;
- requires active organization access;
- validates the linked family member belongs to the current organization or legacy scope;
- inserts the new profile with `organization_id` from the active organization;
- inserts `user_module_permissions` rows with `owner_id`;
- inserts `user_module_permissions.organization_id` from the active organization;
- links the permission rows to the created profile.

This is compatible with future `user_module_permissions.organization_id NOT NULL` hardening.

### Permission save/upsert

`saveProfilePermissions`:

- resolves the admin profile;
- requires active organization access;
- verifies the target profile belongs to the current organization or legacy scope;
- builds one permission row per finance module;
- upserts `user_module_permissions` with `organization_id` from the active organization.

This is compatible with future hardening and also helps move touched legacy permission rows into scoped rows.

## Read path review

`lib/finance/admin-server.ts` reads module permissions through `getFamilyPermissions`.

Current read behavior:

- filters by `owner_id`;
- filters by active organization or legacy null organization scope;
- keeps `organization_id IS NULL` fallback while the table remains transitional.

This is intentionally transitional. A future final state can remove the legacy fallback after schema hardening and any needed production validation.

## Transitional assumptions still present

The following remain intentional transitional behavior:

- `owner_id` is still part of read/write filters;
- `organization_id IS NULL` legacy fallback is still accepted in read/profile-validation paths;
- no `NOT NULL` migration exists for `user_module_permissions` yet.

## Readiness decision

`user_module_permissions` is not blocked by create/upsert payload gaps: both active write paths set `organization_id`.

However, a future hardening PR should be separate and must include:

- table-scoped null-organization preflight evidence;
- table-scoped deterministic dry-run evidence;
- migration-local preflight guard;
- rollback instructions;
- static guard proving the migration is scoped only to `user_module_permissions`;
- no runtime, RLS, UI, billing or E2E mixing.

## Out of scope

This audit does not change:

- schema;
- data;
- RLS policies;
- runtime behavior;
- UI;
- billing;
- E2E;
- legacy `owner_id` fallback.