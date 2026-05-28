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

## Evidence output

Every workflow execution writes an evidence summary to GitHub Step Summary and uploads an artifact named:

```txt
rls-live-gate-evidence-<run_id>-<run_attempt>
```

The artifact contains:

```txt
rls-live-gate-evidence/summary.md
```

The summary records workflow metadata, ref, SHA, actor, run id, run attempt, `APP_ENV`, `RUN_RLS_TESTS`, and both environment validation and test outcomes.

Secret values are intentionally not printed. The contract table records each required variable/secret entry as `present` or `missing`, and validation status is the authoritative signal for whether the gate is correctly prepared.

Only record this gate as CI evidence in `docs/SAAS_RLS_LIVE_STATUS.md` after a real GitHub Actions run has completed successfully.

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

Operational sequence:

1. Configure the dedicated repository variable and secrets.
2. Run `RLS Live Gate` with `workflow_dispatch`.
3. Confirm the run result in GitHub Actions.
4. Download or inspect the `rls-live-gate-evidence-<run_id>-<run_attempt>` artifact.
5. Update `docs/SAAS_RLS_LIVE_STATUS.md` with the run metadata only after the run is green.

## Stop criteria

Stop and investigate if:

- required environment values are missing;
- tests require production data;
- cleanup is broad or unsafe;
- service role is used to prove RLS behavior;
- the workflow becomes part of the default CI path without a separate decision.
