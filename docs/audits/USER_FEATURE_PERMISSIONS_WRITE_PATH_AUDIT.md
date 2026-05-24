# User feature permissions write path audit

Issue: #614
Related issue: #624

## Purpose

Audit whether `public.user_feature_permissions.organization_id` is ready for future organization scope hardening.

This document does not introduce a migration. It records the current read/write surface and the reason hardening must not proceed yet.

## Current finding

`user_feature_permissions` is not ready for schema hardening.

Current status:

```txt
Readiness: blocked
Decision: keep and use feature permissions
Next safe step: define and implement a scoped write path in a separate PR
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

No active application write path was found for `user_feature_permissions` in the audited source surface.

Specifically, no source code path was found that creates or mutates `user_feature_permissions` rows with:

- `insert`;
- `upsert`;
- `update`;
- `delete`.

Because there is no confirmed application write path yet, the project cannot currently prove that future rows will always receive `organization_id`.

## Decision

Do not add preflight/dry-run SQL or a schema hardening migration for `user_feature_permissions` yet.

The product will keep and use feature permissions. A future hardening sequence may resume only after a real write path exists and is proven to set `organization_id` from the active organization.

## Out of scope

This audit does not change:

- schema;
- data;
- RLS policies;
- runtime behavior;
- UI;
- billing;
- E2E;
- legacy `owner_id` fallback;
- legacy `organization_id IS NULL` fallback.