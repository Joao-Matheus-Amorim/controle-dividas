# RLS Live Gate

Issue: #580

## Purpose

Define the separated GitHub Actions gate for real RLS tests against a dedicated Supabase test environment.

This gate is intentionally separate from the default CI workflow.

## Workflow

```txt
.github/workflows/rls-live-gate.yml
```

The workflow is manual-only:

```txt
workflow_dispatch
```

It must not run automatically on every pull request or push.

## Required environment

The workflow requires a dedicated RLS Supabase test environment.

Required repository variable:

```txt
RLS_TEST_SUPABASE_URL
```

Required repository secrets:

```txt
RLS_TEST_SUPABASE_ANON_KEY
RLS_TEST_SUPABASE_SERVICE_ROLE_KEY
RLS_TEST_USER_A_EMAIL
RLS_TEST_USER_A_PASSWORD
RLS_TEST_USER_B_EMAIL
RLS_TEST_USER_B_PASSWORD
```

These values must not point to production or operational data.

## Gate flag

The workflow sets:

```txt
RUN_RLS_TESTS=true
```

This flag must stay inside the dedicated RLS Live Gate workflow. The default CI workflow must not enable real RLS tests by default.

## What the gate runs

The first version runs:

```txt
npm ci
npm run test
```

with the RLS environment variables set.

The existing gated RLS suites are expected to stay skipped unless `RUN_RLS_TESTS=true` and the required Supabase variables are configured.

## Safety boundaries

This gate does not change:

- RLS policies;
- migrations;
- runtime code;
- UI;
- billing;
- E2E;
- production data.

Service role credentials are allowed only for setup and cleanup in RLS fixtures. They must not be used as proof of user-level access.

User-level RLS assertions must use authenticated user clients.

## When to run

Run this workflow manually when validating RLS behavior before or after sensitive changes, such as:

- RLS policy changes;
- organization scope hardening;
- permission model changes;
- changes to RLS test fixtures or helpers.

## Stop criteria

Stop and investigate if:

- required environment values are missing;
- tests require production data;
- cleanup is broad or unsafe;
- service role is used to prove RLS behavior;
- the workflow becomes part of the default CI path without a separate decision.
