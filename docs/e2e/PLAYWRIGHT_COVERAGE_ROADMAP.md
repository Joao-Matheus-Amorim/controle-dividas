# Playwright E2E coverage roadmap

Issue: #360

> Status DocDoc: Atual como mapa de cobertura E2E
> Uso atual: matriz de cobertura Playwright e sequencia segura para novos gates.
> Observacao: nao substitui specs reais, CI ou evidencia de execucao gated.

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

Follow-up: #416

Follow-up: #420

Follow-up: #422

Follow-up: #424

Follow-up: #432

Follow-up: #438

Follow-up: #452

Follow-up: #458

Follow-up: #465

Follow-up: #477

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
| Active organization switch | Gated cleanup-backed covered |
| OrgSlug route contract | Gated cleanup-backed covered |
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
| Hidden module navigation | Gated covered |
| Direct route denial | Gated covered |
| Data-changing cleanup strategy | Documented |
| Data-changing helper contract | Covered |
| Create member/person | Gated cleanup-backed covered |
| Create expense | Gated cleanup-backed covered |
| Create payable | Gated cleanup-backed covered |
| Create receivable | Gated cleanup-backed covered |
| Create bank account | Gated cleanup-backed covered |
| Update records | Gated cleanup-backed covered |
| Remaining record flow | Gated cleanup-backed covered |
| Dashboard summary visual snapshot | Gated deterministic snapshot covered |
| Post-deploy protected-route smoke | Manual gate exists; evidence pending |

## Protected route matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/protected` | Gated covered | Dashboard and active organization access. |
| `/protected` active organization switch | Gated cleanup-backed covered | Creates two temporary organizations for a dedicated user, switches via the real selector, reloads, and cleans up prefixed data. |
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
| `/org/[orgSlug]` | Gated cleanup-backed covered | Creates allowed and denied temporary organizations, proves allowed dashboard, denied slug handling, and `/protected` compatibility. |
| `/org/[orgSlug]/gastos` | Gated cleanup-backed covered | Reached through real dashboard navigation while preserving the slug. |

## Post-deploy smoke matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/protected` | Manual post-deploy smoke gate | Covered by `tests/e2e/post-deploy-protected-smoke-gated.spec.ts` when `RUN_POST_DEPLOY_SMOKE_E2E=true`. |
| `/protected/gastos` | Manual post-deploy smoke gate | Checks deployed route render and absence of the generic error boundary copy. |
| `/protected/contas-a-pagar` | Manual post-deploy smoke gate | Checks deployed route render and absence of the generic error boundary copy. |
| `/protected/contas-a-receber` | Manual post-deploy smoke gate | Checks deployed route render and absence of the generic error boundary copy. |
| `/protected/bancos` | Manual post-deploy smoke gate | Checks deployed route render and absence of the generic error boundary copy. |
| `/protected/configuracoes` | Manual post-deploy smoke gate | Checks deployed route render and absence of the generic error boundary copy. |

Required workflow inputs/secrets:

```txt
workflow input deployment_url or repository variable PRODUCTION_APP_URL/NEXT_PUBLIC_APP_URL
manual run PLAYWRIGHT_BASE_URL
E2E_POST_DEPLOY_EMAIL
E2E_POST_DEPLOY_PASSWORD
```

## Visual snapshot matrix

| Surface | Status | Notes |
| --- | --- | --- |
| `dashboard-summary-above-fold` | Gated deterministic snapshot covered | Uses `RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true`, `tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts`, `__tests__/fixtures/dashboard-summary-visual-snapshot.ts`, and the Windows baseline PNG `tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts-snapshots/dashboard-summary-above-fold-chromium-win32.png`. The fixture uses system fonts, so Playwright keeps platform-specific screenshot suffixes for Linux/macOS baselines. It captures only the contracted dashboard summary surface, not the full protected app. |

## Public/auth matrix

| Route | Status | Notes |
| --- | --- | --- |
| `/` | Covered | Public entry smoke in `tests/e2e/public-auth-pending-routes-smoke.spec.ts`. |
| `/auth/login` | Covered | Basic render and login interaction coverage. |
| `/auth/sign-up` | Covered | Non-mutating render smoke in `tests/e2e/auth-pages-smoke.spec.ts`. |
| `/auth/forgot-password` | Covered | Non-mutating render smoke in `tests/e2e/auth-pages-smoke.spec.ts`. |
| `/auth/update-password` | Covered | Non-mutating render smoke in `tests/e2e/public-auth-pending-routes-smoke.spec.ts`. |
| `/auth/error` | Covered | Error page smoke in `tests/e2e/public-auth-pending-routes-smoke.spec.ts`. |
| `/auth/confirm` | Covered | Missing-params redirect smoke in `tests/e2e/public-auth-pending-routes-smoke.spec.ts`. |
| `/onboarding/organizacao` | Covered | Auth and onboarding flows covered by gated contracts. |

## Permission-sensitive matrix

| Flow | Status | Notes |
| --- | --- | --- |
| Admin fixture | Covered | Skipped-by-default RUN_ADMIN_E2E contract is defined. |
| Limited user fixture | Covered | Skipped-by-default RUN_LIMITED_USER_E2E contract is defined. |
| Hidden module navigation | Gated covered | Limited-user hidden navigation expectation is covered. |
| Direct route denial | Gated covered | Limited-user direct route denial expectation is covered. |

## Data-changing flows

Data-changing browser tests use explicit opt-in flags and cleanup-backed fixtures. The cleanup strategy and helper contract are documented in `docs/e2e/DATA_CHANGING_CLEANUP_STRATEGY.md`.

| Flow | Status |
| --- | --- |
| Cleanup strategy | Documented |
| Data-changing helper contract | Covered |
| Create member/person | Gated cleanup-backed covered |
| Create expense | Gated cleanup-backed covered |
| Create payable | Gated cleanup-backed covered |
| Create receivable | Gated cleanup-backed covered |
| Create bank account | Gated cleanup-backed covered |
| Update records | Gated cleanup-backed covered |
| Remaining record flow | Gated cleanup-backed covered |

## Recommended next sequence

```txt
1. Pick the next uncovered SaaS risk outside covered public/auth, protected-route, permission-sensitive, and data-changing E2E blocks.
2. Keep each new risk behind an explicit issue, small PR, green CI, and accurate roadmap update.
```

## Definition of done for this phase

```txt
All public/auth smoke routes have explicit coverage or a documented reason to wait.
All protected non-admin module routes have active-organization smoke coverage.
Onboarding happy path and guard paths are gated and documented.
Protected shell and active organization access are gated and documented.
Active organization switching is covered by a cleanup-backed gated contract.
OrgSlug routing is covered by a cleanup-backed gated contract for allowed slug, inaccessible slug, and `/protected` compatibility.
Admin and limited-user coverage are blocked only by explicit fixture contracts.
No data-changing E2E test exists without cleanup strategy.
The data-changing E2E coverage block has cleanup-backed coverage for create, update, and remaining record lifecycle flows.
The first visual snapshot is gated, deterministic, versioned, and restricted to the dashboard summary above the fold.
```
