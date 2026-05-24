# User feature permissions write path audit

Issue: #614
Related issues: #624, #626

## Purpose

Audit whether `public.user_feature_permissions.organization_id` is ready for future organization scope hardening.

This document does not introduce a migration. It records the current read/write surface and the reason schema hardening must not proceed yet.

## Current finding

`user_feature_permissions` is not ready for schema hardening.

Current status:

```txt
Readiness: blocked pending readiness, preflight, and dry-run
Decision: keep and use feature permissions
Write path: scoped server action exists
Next safe step: readiness audit or UI integration in a separate PR
```

Decision status is tracked in:

```txt
docs/audits/FEATURE_DECISION_STATUS.md
```

## Read path review

### Admin dashboard read

`lib/finance/admin-server.ts` reads feature permissions through `getFamilyFeaturePermissions`.

Current read behavior:

- reads from `user_feature_permissions`;
- filters by `owner_id`;
- filters by active organization or legacy null organization scope;
- returns an empty list for older local databases where the table is not present.

This is read-only and intentionally transitional.

### Runtime access check read

`lib/finance/access-control.ts` reads feature permissions through `getFeaturePermission` and `canUseFeature`.

Current read behavior:

- reads from `user_feature_permissions`;
- filters by `profile_id`;
- filters by `feature_key`;
- filters by active organization or legacy null organization scope;
- prefers an organization-scoped row over a legacy null-organization row.

This is read-only and intentionally transitional.

## Write path review

A scoped application write path now exists:

```txt
app/protected/admin/actions.ts
saveProfileFeaturePermissions
```

Current write behavior:

- validates the target profile belongs to the active organization or accepted legacy scope;
- writes one row per known feature permission key;
- writes `owner_id` from the admin profile;
- writes `organization_id` from the active organization;
- writes `profile_id` from the validated target profile;
- writes `granted_by` from the admin profile.

## Decision

Do not add preflight/dry-run SQL or a schema hardening migration for `user_feature_permissions` yet.

A future hardening sequence may resume only after readiness, read-only preflight, and read-only dry-run evidence are reviewed in separate scoped PRs.

## Out of scope

This audit does not change:

- schema;
- RLS policies;
- UI;
- billing;
- E2E;
- legacy `owner_id` fallback;
- legacy `organization_id IS NULL` fallback.