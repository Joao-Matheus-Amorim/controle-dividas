# Initial organization onboarding flow

## Status

Runtime onboarding is implemented in small guarded steps.

Current implementation status:

- `/onboarding/organizacao` exists outside the protected layout.
- Authenticated users without an active organization membership are redirected to onboarding.
- The onboarding server action delegates tenant creation to a transactional database RPC.
- The RPC creates the initial organization, owner membership, and owner profile link in one database transaction.

Related issues and PRs:

- Initial onboarding roadmap: #315
- Layout boundary correction: #317
- Onboarding copy rollout: #334
- Redirect/cookie hardening: #332
- Automatic redirect copy correction: #336

References:

- ADR 0004: `docs/adr/0004-initial-organization-onboarding-boundary.md`
- ADR 0005: `docs/adr/0005-onboarding-route-layout-strategy.md`
- Audit: `docs/audits/FIRST_ORGANIZATION_RUNTIME_ONBOARDING_AUDIT.md`
- Manual bootstrap plan: `docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md`

## Goal

Create the first organization and owner membership through an explicit onboarding flow without hiding tenant creation inside profile bootstrap helpers.

The implementation must create or link:

- one organization;
- one active owner membership;
- one active owner profile linked to the organization;
- a clear organization context for protected routes.

## Non-goals

Out of scope for the initial implementation:

- billing;
- orgSlug routes;
- organization selector;
- removing `ADMIN_EMAIL`;
- removing `owner_id`;
- making `organization_id` required;
- relaxing RLS policies;
- allowing multiple active organizations per user.

## Current database model

The database supports organizations and memberships through migration `006_organizations_memberships.sql`.

Profiles are organization-aware through the nullable `organization_id` column added during the SaaS transition.

The transitional unique index in `018_one_active_membership_per_user.sql` prevents multiple active memberships for the same user until the organization selector exists.

## Explicit onboarding route

The user-facing route is:

```txt
/onboarding/organizacao
```

This route:

- requires an authenticated user through the session proxy flow;
- does not live under `/protected`;
- does not depend on `app/protected/layout.tsx`;
- exists only to resolve the missing first organization context.

Do not create `/protected/onboarding/organizacao` for this flow.

## Runtime flow

### 1. User signs in

The user authenticates through the existing Supabase auth flow.

### 2. Organization context is checked

The session proxy checks active organization membership for protected routes.

If the user has at least one active membership:

```txt
continue to /protected
```

If the user has no active membership:

```txt
redirect to /onboarding/organizacao
```

The redirect preserves Supabase cookies.

### 3. Onboarding form collects organization data

Minimum fields:

- organization display name;
- slug, either user-provided or normalized from the name.

Slug policy:

```txt
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

### 4. Server action validates basic input

The server action validates:

- required name;
- minimum name length;
- non-empty slug;
- slug format.

The action then calls the authenticated RPC:

```txt
public.create_initial_organization_onboarding(p_name, p_slug)
```

The action must not use service role and must not write directly to `profiles`, `organizations`, or `organization_memberships`.

### 5. Transactional RPC creates tenant records

The RPC runs as a database transaction and is responsible for the security-sensitive writes.

It validates:

- `auth.uid()` exists;
- name is present and valid;
- slug is present, valid, and available;
- an existing profile is active;
- an existing profile is not already linked to another organization;
- the user has no active membership.

It creates:

1. organization row;
2. owner membership row for the authenticated user;
3. owner profile row when no profile exists, or links an existing active legacy profile to the new organization.

If any step fails, PostgreSQL rolls back the transaction automatically.

### 6. After success

The current UI shows success feedback on the onboarding page.

The user can then use `Voltar para o app` to access `/protected`.

The flow does not currently perform automatic navigation after success.

## Security rules

The implementation preserves these rules:

- no organization creation inside `getCurrentProfile()`;
- no organization creation inside `ensureAdminProfile()`;
- no organization creation in `ProtectedLayout`;
- no organization creation in the session proxy;
- no service role in client components;
- no service role in the onboarding server action;
- no public exposure of service role keys;
- no RLS policy relaxation in this step;
- tenant creation is explicit and restricted to the onboarding RPC;
- owner membership uses `auth.uid()` from the authenticated caller;
- profile creation/linking is tied to the authenticated user only;
- active profiles already linked to another organization are blocked instead of silently reassigned.

## RLS posture

This flow uses a `SECURITY DEFINER` RPC with fixed `search_path = public` for controlled transactional onboarding.

This migration does not relax table RLS policies.

The function grants execute only to `authenticated` and revokes from `public` and `anon`.

## Error handling

The flow returns user-facing feedback for:

- missing name;
- short name;
- invalid slug;
- slug already used;
- unauthenticated user;
- inactive profile;
- existing active organization membership;
- profile already linked to an organization;
- database failure.

Do not fail silently.

## Rollback model

Rollback is handled by PostgreSQL transaction semantics inside the RPC.

The application layer must not implement manual partial rollback for this flow.

## Guard coverage

Guards must ensure:

- the onboarding route remains outside `/protected`;
- the page remains wired to `OrganizationOnboardingForm`;
- the server action delegates writes to the RPC;
- the server action does not use `createAdminClient`;
- the server action does not write directly to tenant tables;
- the migration uses `SECURITY DEFINER` with fixed search path;
- the function requires `auth.uid()`;
- the function is granted only to `authenticated`;
- profile bootstrap files do not create organizations or memberships;
- the transitional one-active-membership-per-user guard remains present.

## Remaining future work

Future PRs may address:

- automatic navigation after successful onboarding;
- invitation-based onboarding for additional users;
- organization selector;
- multiple organizations per user;
- billing gates;
- eventual removal or reduction of `ADMIN_EMAIL`.
