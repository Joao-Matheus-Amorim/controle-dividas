# Admin bootstrap and initial organization onboarding audit

## Status

Documentation audit for the current admin bootstrap model and the path toward SaaS-grade onboarding.

Related issue: #302

## Context

FamilyFinance is now positioned as a SaaS-first, multi-tenant financial product. The current codebase has a transitional admin bootstrap mechanism originally useful for a private/family deployment, but not sufficient as the long-term production model.

The current runtime still depends on `ADMIN_EMAIL` in key places. This audit documents the current behavior, identifies risks, and recommends a sequence of small PRs before removing `ADMIN_EMAIL` or changing onboarding behavior.

## Current code paths

### `lib/finance/access-control.ts`

`getCurrentProfile()` resolves the authenticated user profile.

Current behavior:

1. Try to find an existing profile by `auth_user_id`.
2. If not found, try to find an authorized profile by email using service role.
3. If found and active, link `auth_user_id` to that profile.
4. If no profile is found, allow bootstrap only when the user's email matches `ADMIN_EMAIL`.
5. When bootstrapping, upsert a new admin profile with:

```ts
name: "Danyel"
role: "admin"
is_active: true
owner_id: user.id
auth_user_id: user.id
```

Risk:

- `ADMIN_EMAIL` is a global bootstrap switch, not a SaaS onboarding model.
- `name: "Danyel"` is a hardcoded personal/prototype value.
- The bootstrap profile does not explicitly create or select an organization in this function.
- The behavior is duplicated conceptually with admin-specific code.

### `lib/finance/admin-server.ts`

`ensureAdminProfile()` repeats a similar profile bootstrap path for admin pages.

Current behavior:

1. Load profile by `auth_user_id`.
2. If profile exists, require `role === "admin"` and `is_active`.
3. If not found, allow bootstrap only when the user's email matches `ADMIN_EMAIL`.
4. Upsert a new admin profile with:

```ts
name: "Danyel"
role: "admin"
is_active: true
owner_id: user.id
auth_user_id: user.id
```

Risk:

- The bootstrap logic is duplicated with `getCurrentProfile()`.
- The same hardcoded name appears in a second production path.
- Admin bootstrap and organization ownership are not expressed as a single explicit onboarding flow.

### `lib/finance/profile-linking.ts`

`linkAuthUserToFamilyProfile()` links an authenticated user to a pre-existing profile matched by email.

Current behavior:

- Uses the service role client.
- Finds profile by email.
- Refuses inactive profiles.
- Refuses profiles already linked to another auth user.
- Updates `auth_user_id` when safe.

Assessment:

- This is a valid transitional invite/linking mechanism.
- It should eventually become part of an explicit invitation/onboarding flow.
- It should remain separate from first-owner bootstrap logic.

### Organizations and memberships

Migration `006_organizations_memberships.sql` introduced:

- `organizations`
- `organization_memberships`
- owner/admin/member roles
- RLS helpers and policies

Assessment:

- The database model already supports SaaS organization ownership.
- The runtime onboarding path is not yet fully aligned with this model.
- The project should move from global `ADMIN_EMAIL` bootstrap to organization-owner onboarding.

## Current acceptable transitional behavior

The following can remain temporarily:

- `ADMIN_EMAIL` as an emergency/initial bootstrap gate while onboarding is incomplete.
- Email-based profile linking for pre-created family/organization users.
- Legacy owner-based compatibility while `organization_id` is nullable and `owner_id` still exists.

However, these must be treated as transitional and not as the final SaaS model.

## Current unacceptable long-term debt

The following should not remain long-term:

- hardcoded profile name `Danyel` in bootstrap paths;
- duplicated admin bootstrap logic;
- global `ADMIN_EMAIL` as the primary SaaS admin provisioning model;
- implicit organization selection/creation during first access;
- lack of an explicit first-organization onboarding decision.

## Recommended PR sequence

### 1. Replace hardcoded bootstrap name

Small functional PR.

Scope:

- Replace `name: "Danyel"` with a derived value:
  - email local-part; or
  - `user.email`; or
  - a neutral fallback like `Admin`.
- Apply in both `access-control.ts` and `admin-server.ts`.
- Add guard coverage so the hardcoded personal name does not return.

Out of scope:

- removing `ADMIN_EMAIL`;
- changing organizations;
- changing RLS;
- onboarding UI.

### 2. Centralize admin bootstrap helper

Small refactor PR.

Scope:

- Extract shared bootstrap profile payload/helper.
- Use the same helper from access-control and admin-server.
- Keep behavior identical.

Out of scope:

- onboarding UI;
- organization creation;
- permission model change.

### 3. Audit first-organization creation path

Documentation or test-first PR.

Scope:

- Determine where the first organization is created today.
- Determine what happens when an `ADMIN_EMAIL` user has a profile but no organization membership.
- Define expected SaaS behavior.

Out of scope:

- full onboarding implementation.

### 4. Design owner onboarding flow

ADR or implementation-plan PR.

Scope:

- Decide how first organization is created.
- Decide how owner membership is created.
- Decide when profile is created.
- Decide how invite/profile linking interacts with organizations.

Out of scope:

- billing;
- orgSlug routes;
- removing legacy owner_id.

### 5. Deprecate `ADMIN_EMAIL`

Only after explicit onboarding exists.

Possible final state:

- `ADMIN_EMAIL` becomes dev-only or emergency-only.
- Production onboarding creates organization owner through a controlled flow.
- Admin role comes from organization membership and permissions, not global email.

## Recommended immediate next PR

```txt
Replace hardcoded bootstrap admin name
```

Reason:

- It is small.
- It removes obvious prototype residue.
- It does not change auth semantics.
- It does not affect RLS or organization access.
- It reduces the most visible SaaS-quality debt in the bootstrap path.

## Acceptance criteria for the immediate next PR

- No occurrence of `name: "Danyel"` remains in runtime bootstrap code.
- Bootstrap still works for the configured admin email.
- No organization/RLS behavior changes.
- Tests/gates pass with `RUN_RLS_TESTS=false`.
