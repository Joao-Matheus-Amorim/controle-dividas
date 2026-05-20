# Playwright onboarding E2E tests

Issue: #342

Follow-up: #344

Follow-up: #348

Follow-up: #350

Follow-up: #354

## Goal

Maintain a safe contract for authenticated onboarding and protected-shell E2E tests.

The default Playwright command must not require real credentials:

```bash
npm run test:e2e
```

Authenticated tests must be skipped unless the environment explicitly enables them.

Use only dedicated E2E users in a dedicated test project.

Do not use production users or operational data.

Migration `019_initial_organization_onboarding_rpc.sql` must be applied in the target Supabase project before running onboarding creation coverage.

## Initial onboarding path

Variables:

```txt
RUN_ONBOARDING_E2E=true
E2E_ONBOARDING_EMAIL
E2E_ONBOARDING_PASSWORD
```

Fixture state:

```txt
The E2E user starts without an active organization membership.
```

The happy path verifies:

```txt
login with the dedicated E2E user
redirect to /onboarding/organizacao
submit organization name and slug
friendly success feedback
manual navigation back to /protected
protected dashboard is reachable without returning to onboarding
```

Because this path creates an active organization membership, the same dedicated user cannot run the onboarding creation path twice without reset.

## Active organization path

Variables:

```txt
RUN_ACTIVE_ORG_E2E=true
E2E_ACTIVE_ORG_EMAIL
E2E_ACTIVE_ORG_PASSWORD
```

Fixture state:

```txt
The E2E user already has an active organization membership.
```

The active organization path verifies:

```txt
login with the dedicated active-organization E2E user
protected dashboard is reachable
user is not redirected to /onboarding/organizacao
accessing /protected directly keeps the user inside the protected app
```

This fixture should not be reused as the initial onboarding fixture.

## Protected shell path

This path reuses the active organization variables and fixture.

The protected shell path verifies:

```txt
login with the dedicated active-organization E2E user
protected shell brand is visible
active organization indicator is visible
Dashboard navigation is visible
monthly dashboard heading is visible
```

This path should not create or mutate application data.

## Onboarding guard path

Variables:

```txt
RUN_ONBOARDING_CASE_E2E=true
E2E_ONBOARDING_CASE_EMAIL
E2E_ONBOARDING_CASE_PASSWORD
E2E_ONBOARDING_CASE_SLUG
```

Fixture state:

```txt
The E2E user reaches onboarding.
The configured slug is already unavailable in the dedicated test project.
```

The onboarding guard path verifies:

```txt
login with the dedicated onboarding-case E2E user
redirect to /onboarding/organizacao
submit organization name and the configured slug
friendly guard message is shown
user remains on /onboarding/organizacao
```

This fixture should not be reused as the successful initial onboarding fixture unless it is reset first.

## Fixture reset

Before another authenticated onboarding creation run, reset only the dedicated E2E user in the dedicated test Supabase project.

Do not run fixture reset against production.

Do not use a real user as the fixture.

## Data isolation

Use a unique organization slug for successful creation runs, such as:

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
