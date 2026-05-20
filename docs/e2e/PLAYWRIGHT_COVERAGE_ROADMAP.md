# Playwright E2E coverage roadmap

Issue: #360

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

## Protected route matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/protected` | Gated covered | Dashboard and active organization access. |
| `/protected/pessoas` | Gated covered | Read-only smoke. |
| `/protected/gastos` | Pending | Next recommended route smoke. |
| `/protected/contas-a-pagar` | Pending | Route smoke after expenses. |
| `/protected/contas-a-receber` | Pending | Route smoke after payables. |
| `/protected/bancos` | Pending | Route smoke after receivables. |
| `/protected/relatorios` | Pending | Route smoke after banks. |
| `/protected/configuracoes` | Pending | Route smoke after reports. |
| `/protected/admin` | Pending | Requires admin fixture definition. |
| `/protected/admin/usuarios` | Pending | Requires admin fixture definition. |
| `/protected/admin/permissoes` | Pending | Requires admin fixture definition. |

## Public/auth matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Pending | Public entry smoke. |
| `/auth/login` | Covered | Basic render and login interaction coverage. |
| `/auth/sign-up` | Pending | Non-mutating render smoke. |
| `/auth/forgot-password` | Pending | Non-mutating render smoke. |
| `/auth/update-password` | Pending | Expected state must be defined first. |
| `/auth/error` | Pending | Friendly error smoke. |
| `/auth/confirm` | Pending | Callback expectation must be defined first. |
| `/onboarding/organizacao` | Covered | Auth and onboarding flows covered by gated contracts. |

## Permission-sensitive matrix

| Flow | Status | Notes |
| --- | --- | --- |
| Admin fixture | Pending | Needed before admin route smoke. |
| Limited user fixture | Pending | Needed before negative permission coverage. |
| Hidden module navigation | Pending | Requires limited fixture. |
| Direct route denial | Pending | Requires expected behavior per route. |

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
1. Add gated smoke for /protected/gastos.
2. Add gated smoke for /protected/contas-a-pagar.
3. Add gated smoke for /protected/contas-a-receber.
4. Add gated smoke for /protected/bancos.
5. Add gated smoke for /protected/relatorios.
6. Add gated smoke for /protected/configuracoes.
7. Define admin fixture.
8. Add admin route smoke.
9. Define limited-user fixture.
10. Add permission-negative coverage.
11. Define cleanup strategy.
12. Add data-changing E2E flows one by one.
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
