# Finance Server Boundaries Audit

Issue: #496
Coverage contract: #500

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
- `lib/finance/reports-server.ts` for report data;
- `lib/finance/relations.ts` for relation normalization helpers.

That existing direction supports splitting `server.ts` by domain instead of adding more responsibilities to it.

## Proposed boundaries

Future work should split by stable business boundary:

| Future module | Responsibility | Minimum coverage contract |
| --- | --- | --- |
| `lib/finance/seed-server.ts` | Initial default member/category seed only. | Unit or integration-style test proving upsert payload shape and duplicate-safe contract, or a focused guard if direct DB mocking is not practical. |
| `lib/finance/members-server.ts` | Family member reads shared by finance modules. | Test or guard proving owner/profile scoping is preserved. |
| `lib/finance/categories-server.ts` | Expense category reads shared by expense flows. | Test or guard proving owner/profile scoping and ordering are preserved. |
| `lib/finance/expenses-server.ts` | Expense reads and expense dashboard aggregation. | Tests for permission-filtered reads and dashboard totals. |
| `lib/finance/payables-server.ts` | Payable bill reads and payable dashboard aggregation. | Tests for permission-filtered reads, status enrichment, and totals. |
| `lib/finance/receivables-server.ts` | Receivable income reads and receivable dashboard aggregation. | Tests for permission-filtered reads, status enrichment, and totals. |
| `lib/finance/relations.ts` | Shared relation normalization helpers. | Unit tests for null, object, empty array, and array relation inputs. |

## Coverage rule

A finance server extraction is not complete just because lint, typecheck, and build pass.

Every future extraction PR must include explicit behavior coverage for the moved boundary:

- pure helpers need focused unit tests;
- query-shaping code needs tests or guards proving filters, selected relations, and ordering were preserved;
- dashboard aggregation code needs tests for totals, counts, computed status, and member visibility;
- permission-sensitive code needs targeted coverage proving `getCurrentProfile()` and `getAccessibleMemberIds()` semantics were not bypassed;
- docs must state what remains intentionally unextracted when the PR is partial.

A move-only PR without matching behavior coverage is not acceptable for GAP-013.

## Dependencies that need care

The following dependencies make blind movement risky:

- `seedInitialFinanceData()` is called by multiple read functions;
- `getCurrentUserId()` redirects unauthenticated users;
- `getCurrentProfile()` and `getAccessibleMemberIds()` enforce permission-sensitive visibility;
- dashboard aggregations depend on filtered member visibility;
- relation normalization hides Supabase relation array/object differences.

## Safe split order

1. Extract relation normalization helpers with focused unit coverage.
2. Extract seed logic without changing call sites and with seed contract coverage.
3. Extract member/category read helpers with scoping/order coverage.
4. Extract one business module at a time, starting with a low-risk read-only module.
5. Update imports after each extracted module has green CI and matching behavior coverage.
6. Update this audit or gap register only after each merge.

## Forbidden actions

```txt
Do not split all finance server responsibilities in one PR.
Do not change query semantics while moving files.
Do not rely only on TypeScript/build success as refactor proof.
Do not move query-shaping or aggregation code without tests or guards.
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
- include tests or guards matching the moved boundary;
- pass lint, typecheck, build, and tests;
- update this audit or gap register if the boundary status changes.

## Status

GAP-013 is not fully closed by this audit or by the first relation-helper extraction.

This audit defines the contract needed to perform future low-risk refactors without creating hidden debt.