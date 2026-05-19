# Initial organization onboarding flow

## Status

Technical roadmap for future implementation. No runtime behavior change in this document.

Related issue: #315
Boundary correction issue: #317
Layout decision: ADR 0005

References:

- ADR 0004: `docs/adr/0004-initial-organization-onboarding-boundary.md`
- ADR 0005: `docs/adr/0005-onboarding-route-layout-strategy.md`
- Audit: `docs/audits/FIRST_ORGANIZATION_RUNTIME_ONBOARDING_AUDIT.md`
- Manual bootstrap plan: `docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md`

## Goal

Define a safe, explicit flow to create the first organization and owner membership without hiding tenant creation inside profile bootstrap helpers.

The final implementation must create:

- one organization;
- one active owner membership;
- a clear organization context for protected routes.

## Non-goals

This roadmap does not implement the flow.

Out of scope for the future first implementation:

- billing;
- orgSlug routes;
- organization selector;
- removing `ADMIN_EMAIL`;
- removing `owner_id`;
- making `organization_id` required;
- changing RLS policies.

## Current state

### Existing database model

The database already supports organizations and memberships through migration `006_organizations_memberships.sql`.

### Existing runtime behavior

`lib/organizations/server.ts` reads active memberships and related organizations for the authenticated user.

If there is no membership, the runtime has no active organization context.

### Existing profile bootstrap

`lib/finance/access-control.ts` and `lib/finance/admin-server.ts` can bootstrap or resolve an admin profile through the transitional `ADMIN_EMAIL` path.

This profile bootstrap must not create organization records or owner memberships.

A guard already protects this boundary.

### Existing protected layout boundary

`app/protected/layout.tsx` currently loads navigation permissions and current organization before rendering protected children.

That means a route placed directly under `/protected` may not render for a user with no active organization membership, because the layout can fail before the page is reached.

ADR 0005 resolves this by choosing a route outside the existing protected layout for the first implementation.

## Explicit onboarding route

The chosen user-facing route is:

```txt
/onboarding/organizacao
```

This route must still require an authenticated user, but it must not depend on `app/protected/layout.tsx` and must not require organization context before rendering.

Do not create `/protected/onboarding/organizacao` in the first implementation.

The route should not be a generic organization settings page. It should exist only to resolve the missing first organization context.

## Proposed flow

### 1. User signs in

The user authenticates through the existing Supabase auth flow.

### 2. Profile is resolved

`getCurrentProfile()` resolves or creates the profile according to current transitional rules.

This step must not create organizations.

### 3. Organization context is checked

The system checks `getUserOrganizations()`.

If the user has at least one active membership:

```txt
continue to /protected
```

If the user has no active memberships:

```txt
redirect to /onboarding/organizacao
```

The redirect must not rely on rendering a page that is blocked by the existing protected layout.

### 4. Onboarding form collects organization data

Minimum fields:

- organization display name;
- slug, either auto-generated from name or editable with validation.

Initial defaults:

- name: derived from profile/email, for example `Organização de <name>` or user-provided;
- slug: derived from name using lowercase, hyphenated, alphanumeric rules.

### 5. Server action validates access

The server action must validate:

- authenticated user exists;
- current profile exists and is active;
- user currently has no active organization membership;
- requested slug is valid;
- requested slug is available;
- profile bootstrap did not already create a hidden membership.

### 6. Server action creates tenant records

The action creates, in one controlled flow:

1. organization row;
2. owner membership row for the authenticated user.

The action should be idempotent where reasonable, but it must not silently attach a user to an unrelated existing organization.

### 7. Redirect after success

After success:

```txt
redirect to /protected
```

The protected layout can then resolve active organization normally.

## Security rules

The implementation must preserve these rules:

- no organization creation inside `getCurrentProfile()`;
- no organization creation inside `ensureAdminProfile()`;
- no service role in client components;
- no public exposure of service role keys;
- no bypass of RLS for normal user reads;
- organization creation must be server-side only;
- owner membership must use the authenticated user's auth id.

## Slug policy

The slug should follow the existing database constraint:

```txt
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Recommended implementation:

- normalize accents;
- lowercase;
- replace non-alphanumeric groups with `-`;
- trim leading/trailing hyphens;
- require non-empty slug;
- check uniqueness before insert;
- return friendly error if unavailable.

Do not add random suffixes silently in the first version. Make conflicts explicit.

## Error handling

The action should return user-facing feedback for:

- missing name;
- invalid slug;
- slug already used;
- user already has active organization;
- profile inactive;
- database failure.

Do not fail silently.

## Rollback

Before financial data is attached to the new organization, rollback is simple:

```txt
delete membership
then delete organization
```

After financial data uses the organization, rollback must be treated as data migration and should not be automatic.

## Recommended implementation sequence

### PR 1 - Add route shell

UI-only/server-only shell.

- Create `/onboarding/organizacao` page.
- Use a minimal onboarding-specific layout or page container.
- Show form shell and explanation.
- No database writes yet.

### PR 2 - Add server action validation only

Server action returns validation results but does not insert yet, or uses mocked internal helper guarded by tests.

### PR 3 - Add organization creation action

Functional PR.

- Create organization.
- Create owner membership.
- Revalidate/redirect.
- Add unit guard and integration-style test with mocked Supabase client.

### PR 4 - Wire no-organization redirect

Functional PR.

- If authenticated/profiled user has no organization context, redirect to `/onboarding/organizacao`.
- Keep users with memberships on existing flow.

## Open questions

- Should transitional `ADMIN_EMAIL` be required to create the first organization?
- Should any authenticated user without membership be allowed to create a new organization?
- Should multiple organizations per user be allowed before the selector exists?
- Should slug be editable in first version?
- Should organization creation be blocked until billing exists?

## Recommendation

For the first implementation, keep the scope conservative:

```txt
Only the current authenticated/profiled user with no active memberships can create their first organization.
```

Do not allow creating second organizations until the active organization selector exists.

Do not connect billing in the first version.

Do not remove `ADMIN_EMAIL` in the first version.

Use `/onboarding/organizacao` for the first route shell, outside the current protected layout.
