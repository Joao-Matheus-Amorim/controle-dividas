# Finance Server Boundaries Audit

Issue: #496

## Goal

Audit `lib/finance/server.ts` boundaries before any refactor.

This audit reduces GAP-013 by defining safe module boundaries, not by moving code.

## Current state

`lib/finance/server.ts` currently concentrates several responsibilities:

- current user lookup and auth redirect helper;
- initial seed orchestration for members and categories;
- relation normalization helpers;
- family member reads;
- expense category reads;
- expense reads and expense dashboard aggregation;
- payable bill reads and payable dashboard aggregation;
- receivable income reads and receivable dashboard aggregation.

This is not an immediate runtime bug, but it is a maintainability and refactor-risk concern.

## Existing split evidence

The codebase already has more focused server modules:

- `lib/finance/banks-server.ts` for bank account reads and dashboard data;
- `lib/finance/admin-server.ts` for admin dashboard data;
- `lib/finance/reports-server.ts` for report data.

That existing direction supports splitting `server.ts` by domain instead of adding more responsibilities to it.

## Proposed boundaries

Future work should split by stable business boundary:

| Future module | Responsibility |
| --- | --- |
| `lib/finance/seed-server.ts` | Initial default member/category seed only. |
| `lib/finance/members-server.ts` | Family member reads shared by finance modules. |
| `lib/finance/categories-server.ts` | Expense category reads shared by expense flows. |
| `lib/finance/expenses-server.ts` | Expense reads and expense dashboard aggregation. |
| `lib/finance/payables-server.ts` | Payable bill reads and payable dashboard aggregation. |
| `lib/finance/receivables-server.ts` | Receivable income reads and receivable dashboard aggregation. |
| `lib/finance/relations.ts` | Shared relation normalization helpers, if still needed. |

## Dependencies that need care

The following dependencies make blind movement risky:

- `seedInitialFinanceData()` is called by multiple read functions;
- `getCurrentUserId()` redirects unauthenticated users;
- `getCurrentProfile()` and `getAccessibleMemberIds()` enforce permission-sensitive visibility;
- dashboard aggregations depend on filtered member visibility;
- relation normalization currently hides Supabase relation array/object differences.

## Safe split order

1. Extract relation normalization helpers if a test or usage guard proves stable behavior.
2. Extract seed logic without changing call sites.
3. Extract member/category read helpers.
4. Extract one business module at a time, starting with a low-risk read-only module.
5. Update imports after each extracted module has green CI.
6. Update this register only after each merge.

## Forbidden actions

```txt
Do not split all finance server responsibilities in one PR.
Do not change query semantics while moving files.
Do not mix server module extraction with RLS, schema, billing, UI, or E2E work.
Do not remove seed calls unless a replacement contract exists.
Do not remove owner/access-control filters during movement.
```

## Acceptance criteria for future refactor PRs

Each future extraction PR must:

- move only one boundary;
- keep public exports compatible or update imports explicitly;
- preserve permission filters;
- preserve dashboard aggregation semantics;
- pass lint, typecheck, build, and tests;
- update this audit or gap register if the boundary status changes.

## Status

GAP-013 is not fully closed by this audit.

This audit defines the contract needed to perform future low-risk refactors without creating hidden debt.
