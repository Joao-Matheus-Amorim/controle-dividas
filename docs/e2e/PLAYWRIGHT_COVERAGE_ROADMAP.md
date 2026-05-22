# Playwright E2E coverage roadmap

Issue: #360

Follow-up: #362

Follow-up: #366

Follow-up: #370

Follow-up: #374

Follow-up: #380

Follow-up: #384

Follow-up: #388

Follow-up: #392

Follow-up: #396

Follow-up: #400

Follow-up: #404

Follow-up: #408

Follow-up: #412

## Goal

Define an auditable Playwright E2E roadmap for the current SaaS phase.

This document does not claim absolute browser coverage for every line of code. It defines the route and journey coverage needed to avoid hidden gaps, false green tests, and undocumented E2E fixtures.

## Rules

```txt
No false green.
No undocumented fixture.
No production user.
No production data.
No runtime, schema, RLS, billing, UI, and E2E mixed in the same PR.
No data-mutating E2E flow before a documented cleanup strategy exists.
```

## Current coverage

| Area | Status |
| --- | --- |
| Playwright foundation | Covered |
| Public auth smoke | Covered |
| Protected unauthenticated redirects | Covered |
| Initial onboarding happy path | Gated covered |
| Active organization user path | Gated covered |
| Onboarding guard path | Gated covered |
| Protected app shell | Gated covered |
| Protected people route | Gated covered |
| Protected expenses route | Gated covered |
| Protected payables route | Gated covered |
| Protected receivables route | Gated covered |
| Protected banks route | Gated covered |
| Protected reports route | Gated covered |
| Protected settings route | Gated covered |
| Admin fixture contract | Covered |
| Protected admin route | Gated covered |
| Protected admin users route | Gated covered |
| Protected admin permissions route | Gated covered |
| Limited user fixture contract | Covered |
| Limited-user negative expectation contract | Covered |

## Protected route matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/protected` | Gated covered | Dashboard and active organization access. |
| `/protected/pessoas` | Gated covered | Read-only smoke. |
| `/protected/gastos` | Gated covered | Read-only smoke. |
| `/protected/contas-a-pagar` | Gated covered | Read-only smoke. |
| `/protected/contas-a-receber` | Gated covered | Read-only smoke. |
| `/protected/bancos` | Gated covered | Read-only smoke. |
| `/protected/relatorios` | Gated covered | Read-only smoke. |
| `/protected/configuracoes` | Gated covered | Read-only smoke. |
| `/protected/admin` | Gated covered | Read-only smoke. |
| `/protected/admin/usuarios` | Gated covered | Read-only smoke. |
| `/protected/admin/permissoes` | Gated covered | Read-only smoke. |

## Public/auth matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Pending | Public entry smoke. |
| `/auth/login` | Covered | Basic render and login interaction coverage. |
| `/auth/sign-up` | Covered | Non-mutating render smoke in `tests/e2e/auth-pages-smoke.spec.ts`. |
| `/auth/forgot-password` | Covered | Non-mutating render smoke in `tests/e2e/auth-pages-smoke.spec.ts`. |
| `/auth/update-password` | Pending | Expected state must be defined first. |
| `/auth/error` | Pending | Friendly error smoke. |
| `/auth/confirm` | Pending | Callback expectation must be defined first. |
| `/onboarding/organizacao` | Covered | Auth and onboarding flows covered by gated contracts. |

## Permission-sensitive matrix

| Flow | Status | Notes |
| --- | --- | --- |
| Admin fixture | Covered | Skipped-by-default RUN_ADMIN_E2E contract is defined. |
| Limited user fixture | Covered | Skipped-by-default RUN_LIMITED_USER_E2E contract is defined. |
| Hidden module navigation | Pending | Next permission-negative coverage. |
| Direct route denial | Pending | Requires hidden module navigation baseline first. |

## Data-changing flows

Data-changing browser tests are intentionally pending until cleanup is documented.

| Flow | Status |
| --- | --- |
| Create member/person | Pending cleanup strategy |
| Create expense | Pending cleanup strategy |
| Create payable | Pending cleanup strategy |
| Create receivable | Pending cleanup strategy |
| Create bank account | Pending cleanup strategy |
| Update/delete records | Pending cleanup strategy |

## Recommended next sequence

```txt
1. Add permission-negative coverage.
2. Define cleanup strategy.
3. Add data-changing E2E flows one by one.
```

## Definition of done for this phase

```txt
All public/auth smoke routes have explicit coverage or a documented reason to wait.
All protected non-admin module routes have active-organization smoke coverage.
Onboarding happy path and guard paths are gated and documented.
Protected shell and active organization access are gated and documented.
Admin and limited-user coverage are blocked only by explicit fixture contracts.
No data-changing E2E test exists without cleanup strategy.
```
