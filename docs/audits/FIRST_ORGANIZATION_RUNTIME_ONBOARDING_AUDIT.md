# First organization runtime onboarding audit

## Status

Documentation audit for the current first-organization and owner membership runtime path.

Related issue: #309

References:

- `supabase/migrations/006_organizations_memberships.sql`
- `docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md`
- `lib/organizations/server.ts`
- `lib/finance/access-control.ts`
- `lib/finance/admin-server.ts`
- `lib/finance/bootstrap-admin-profile.ts`

## Context

FamilyFinance now has the database model needed for SaaS multi-tenancy:

- `organizations`
- `organization_memberships`
- owner/admin/member roles
- RLS helper functions
- RLS policies for organization access

However, the runtime path for creating or selecting the first organization is not yet fully explicit. This matters because the current profile bootstrap and the current organization access helper are separate concerns.

## Current database model

Migration `006_organizations_memberships.sql` creates:

- `public.organizations`
- `public.organization_memberships`
- `current_user_organization_ids()`
- `is_organization_member(uuid)`
- `is_organization_admin(uuid)`

It also creates policies that allow organization access based on active membership.

This model is valid as a SaaS foundation.

## Current runtime organization access

`lib/organizations/server.ts` currently does the following:

1. Reads the authenticated user from Supabase claims.
2. Loads active memberships for that `auth_user_id`.
3. If no memberships exist, returns an empty list.
4. Loads organizations for those memberships.
5. Chooses the default organization by preferring membership role `owner`; otherwise uses the first membership.
6. `requireOrganizationAccess()` throws `Voce nao tem acesso a esta organizacao.` when no organization context exists.

Important: this file reads organizations/memberships, but does not create the first organization or first owner membership.

## Current profile bootstrap

`lib/finance/access-control.ts` and `lib/finance/admin-server.ts` can bootstrap an admin profile when the authenticated email matches `ADMIN_EMAIL`.

After #304/#305/#306/#308:

- hardcoded personal bootstrap names were removed;
- bootstrap profile payload generation is centralized in `lib/finance/bootstrap-admin-profile.ts`;
- the bootstrap profile name is derived from email local-part or falls back to `Admin`;
- `ADMIN_EMAIL` remains as the temporary bootstrap gate.

Important: profile bootstrap does not create an organization or membership.

## Existing manual bootstrap plan

`docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md` documents a manual SQL path for creating the initial organization and owner membership.

That plan is useful and historically important, but it is not a runtime onboarding flow.

It assumes an operator manually identifies the owner auth user id and executes controlled SQL to insert:

- one organization;
- one owner membership.

## Gap

There is currently a gap between:

```txt
Admin profile bootstrap
```

and:

```txt
Organization/membership availability
```

A user can theoretically have an admin profile but no active organization membership. In that state, calls to `requireOrganizationAccess()` will fail.

This is safer than silently creating ambiguous organizations, but it is not a complete SaaS onboarding model.

## Why not implement automatic creation immediately

Automatically creating an organization in `getCurrentProfile()` or `ensureAdminProfile()` would mix concerns:

- profile resolution;
- admin bootstrap;
- organization creation;
- membership creation;
- onboarding policy;
- future billing policy.

That could create hidden coupling and make rollback harder.

A runtime creation path should be implemented only after the desired onboarding behavior is explicit.

## Required decision before functional implementation

Before adding runtime organization creation, decide:

1. When should the first organization be created?
2. Who is allowed to create it?
3. What default name should it use?
4. What default slug should it use?
5. How should slug collisions be handled?
6. Should `ADMIN_EMAIL` still be required in production?
7. Should organization owner role come from membership only, profile role, or both during transition?
8. Should this be a route/action dedicated to onboarding instead of hidden inside profile access?
9. How should this interact with future billing?
10. How should rollback work?

## Recommended next PR sequence

### 1. Add a guard documenting no hidden organization creation

Small test-only PR.

Scope:

- Guard that `lib/finance/access-control.ts` does not insert into `organizations` or `organization_memberships`.
- Guard that `lib/finance/admin-server.ts` does not insert into `organizations` or `organization_memberships`.
- Guard that organization reads still happen through `lib/organizations/server.ts`.

Reason:

- Prevent accidental hidden onboarding inside profile/bootstrap code.
- Keep current behavior explicit while the onboarding design is pending.

### 2. Create ADR for initial organization onboarding

Documentation decision PR.

Scope:

- Decide whether first organization creation happens via dedicated onboarding route/action, admin-only action, script, or manual operation.
- Decide slug/name policy.
- Decide interaction with `ADMIN_EMAIL`.
- Decide rollback and validation.

### 3. Implement runtime first-organization onboarding

Only after the ADR.

Possible implementation:

- dedicated onboarding route or server action;
- checks authenticated user;
- checks no active memberships exist;
- creates organization;
- creates owner membership;
- optionally updates/links profile;
- redirects to protected app.

Out of scope until ADR exists:

- billing;
- orgSlug routes;
- removing `owner_id`;
- removing `ADMIN_EMAIL`.

## Recommendation

Do not hide organization creation inside `getCurrentProfile()` or `ensureAdminProfile()`.

The immediate next safe step should be:

```txt
Guard against hidden organization creation in profile bootstrap
```

Then create an ADR for initial organization onboarding.

## Acceptance criteria for the next guard PR

- Profile bootstrap code does not create organizations or memberships.
- Organization context remains loaded through `lib/organizations/server.ts`.
- No runtime behavior changes.
- Gates pass with `RUN_RLS_TESTS=false`.
