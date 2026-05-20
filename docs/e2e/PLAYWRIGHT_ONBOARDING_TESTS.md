# Playwright onboarding E2E tests

Issue: #342

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

## Data isolation

Use a unique organization slug for each run, such as:

```txt
e2e-onboarding-<timestamp>-<random>
```

## Out of scope

- Creating Supabase Auth users through Admin API.
- Running against production data.
- Running authenticated onboarding in default CI.
- RLS live gate.
- Runtime, schema, RLS, or migration changes.
