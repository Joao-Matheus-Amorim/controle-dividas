# Playwright onboarding E2E tests

Issue: #342

Follow-up: #344

## Goal

Prepare a safe contract for authenticated onboarding E2E tests.

The default Playwright command must not require real credentials:

```bash
npm run test:e2e
```

Authenticated onboarding tests must be skipped unless the environment explicitly enables them.

## Required variables

```txt
RUN_ONBOARDING_E2E=true
E2E_ONBOARDING_EMAIL
E2E_ONBOARDING_PASSWORD
```

Use only a dedicated E2E user in a dedicated test project.

Do not use production users or operational data.

## Required fixture state

The E2E user should start with:

```txt
Supabase Auth user exists
public.profiles is absent OR active with organization_id IS NULL
public.organization_memberships has no active row for the user
```

Migration `019_initial_organization_onboarding_rpc.sql` must be applied in the target Supabase project.

## Authenticated happy path

When `RUN_ONBOARDING_E2E=true`, the gated onboarding spec is allowed to mutate the dedicated E2E fixture by creating:

```txt
public.organizations row with a unique e2e-onboarding-* slug
public.organization_memberships owner row for the E2E auth user
public.profiles row or organization_id link for the E2E auth user
```

The happy path must verify:

```txt
login with the dedicated E2E user
redirect to /onboarding/organizacao
submit organization name and slug
friendly success feedback
manual navigation back to /protected
protected dashboard is reachable without returning to onboarding
```

## Fixture reset before re-running

Because the happy path creates an active organization membership, the same dedicated user cannot run the onboarding creation path twice without reset.

Before another authenticated onboarding run, reset only the dedicated E2E user in the dedicated test Supabase project:

```txt
remove the created e2e-onboarding-* organization data
remove active public.organization_memberships rows for the E2E auth user
set public.profiles.organization_id back to NULL for the E2E auth user, or remove the E2E profile row
keep the Supabase Auth user available for login
```

Do not run this reset against production.

Do not use a real user as the fixture.

## Data isolation

Use a unique organization slug for each run, such as:

```txt
e2e-onboarding-<timestamp>-<random>
```

## Out of scope

- Creating Supabase Auth users through Admin API.
- Automating fixture reset through service role credentials.
- Running against production data.
- Running authenticated onboarding in default CI.
- RLS live gate.
- Runtime, schema, RLS, or migration changes.
