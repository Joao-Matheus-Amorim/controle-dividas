# Playwright onboarding E2E tests

Issue: #342

Follow-up: #344

Follow-up: #348

## Goal

Prepare a safe contract for authenticated onboarding E2E tests.

The default Playwright command must not require real credentials:

```bash
npm run test:e2e
```

Authenticated onboarding tests must be skipped unless the environment explicitly enables them.

## Initial onboarding variables

```txt
RUN_ONBOARDING_E2E=true
E2E_ONBOARDING_EMAIL
E2E_ONBOARDING_PASSWORD
```

Use only a dedicated E2E user in a dedicated test project.

Do not use production users or operational data.

## Initial onboarding fixture state

The initial onboarding E2E user should start without an active organization membership.

Migration `019_initial_organization_onboarding_rpc.sql` must be applied in the target Supabase project.

## Authenticated happy path

When `RUN_ONBOARDING_E2E=true`, the gated onboarding spec is allowed to mutate the dedicated E2E fixture by creating the first organization and owner membership.

The happy path must verify:

```txt
login with the dedicated E2E user
redirect to /onboarding/organizacao
submit organization name and slug
friendly success feedback
manual navigation back to /protected
protected dashboard is reachable without returning to onboarding
```

## Active organization variables

Use a separate dedicated E2E user for the already-onboarded path:

```txt
RUN_ACTIVE_ORG_E2E=true
E2E_ACTIVE_ORG_EMAIL
E2E_ACTIVE_ORG_PASSWORD
```

The active organization fixture must already have an active organization membership before the test runs.

The active organization path must verify:

```txt
login with the dedicated active-organization E2E user
protected dashboard is reachable
user is not redirected to /onboarding/organizacao
accessing /protected directly keeps the user inside the protected app
```

This fixture should not be reused as the initial onboarding fixture.

## Fixture reset before re-running initial onboarding

Because the happy path creates an active organization membership, the same dedicated user cannot run the onboarding creation path twice without reset.

Before another authenticated onboarding run, reset only the dedicated E2E user in the dedicated test Supabase project.

Do not run fixture reset against production.

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
