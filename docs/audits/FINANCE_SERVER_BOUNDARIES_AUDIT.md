# Finance Server Boundaries Audit

Issue: #496
Coverage contract: #500
Read-helper status update: #518

## Goal

Audit `lib/finance/server.ts` boundaries before and during GAP-013 refactors.

This audit reduces GAP-013 by defining safe module boundaries, tracking completed extractions, and keeping the remaining work explicit.

## Current state

`lib/finance/server.ts` has been reduced substantially, but GAP-013 is not fully closed.

It still owns the public compatibility façade and dashboard aggregation functions, while several focused helpers now live in dedicated modules.

Current responsibilities still present in `lib/finance/server.ts`:

- current user lookup and auth redirect helper;
- initial seed façade via `seedInitialFinanceData()`;
- public compatibility exports for finance read functions;
- expense dashboard aggregation;
- payable bill dashboard aggregation;
- receivable income dashboard aggregation.

Responsibilities already extracted from `lib/finance/server.ts`:

- relation normalization helpers;
- initial seed payload builders;
- initial seed upsert orchestration;
- family member reads;
- expense category reads;
- permission-filtered expense reads;
- permission-filtered payable bill reads;
- permission-filtered receivable income reads.

This is no longer the same level of concentrated risk as the original audit, but dashboard aggregation and façade responsibilities still require careful follow-up.

## Existing split evidence

The codebase already has focused server modules:

- `lib/finance/banks-server.ts` for bank account reads and dashboard data;
- `lib/finance/admin-server.ts` for admin dashboard data;
- `lib/finance/reports-server.ts` for report data;
- `lib/finance/relations.ts` for relation normalization helpers;
- `lib/finance/seed-payloads.ts` for default seed payload builders;
- `lib/finance/seed-server.ts` for default seed orchestration;
- `lib/finance/members-server.ts` for family member reads;
- `lib/finance/categories-server.ts` for expense category reads;
- `lib/finance/expenses-server.ts` for permission-filtered expense reads;
- `lib/finance/payables-server.ts` for permission-filtered payable bill reads;
- `lib/finance/receivables-server.ts` for permission-filtered receivable income reads.

That direction supports continuing to split by business boundary instead of adding more responsibilities to `server.ts`.

## Boundary status

| Module | Responsibility | Status | Coverage status |
| --- | --- | --- | --- |
| `lib/finance/relations.ts` | Shared relation normalization helpers. | Extracted. | Covered by focused unit tests for null, object, empty array, and array relation inputs. |
| `lib/finance/seed-payloads.ts` | Initial default member/category seed payload builders. | Extracted. | Covered by focused unit tests for payload shape and duplicate-safe contract. |
| `lib/finance/seed-server.ts` | Initial default seed upsert orchestration. | Extracted. | Covered by focused unit tests for table/upsert behavior and error propagation. |
| `lib/finance/members-server.ts` | Family member reads shared by finance modules. | Extracted. | Covered by focused unit tests for table, select fields, owner scope, ordering, null-data fallback, and error propagation. |
| `lib/finance/categories-server.ts` | Expense category reads shared by expense flows. | Extracted. | Covered by focused unit tests for table, select fields, owner scope, name ordering, null-data fallback, and error propagation. |
| `lib/finance/expenses-server.ts` | Permission-filtered expense reads. | Extracted. | Covered by focused unit tests for permission short-circuit, query shape, owner/member filters, ordering, relation normalization, null-data fallback, and error propagation. |
| `lib/finance/payables-server.ts` | Permission-filtered payable bill reads. | Extracted. | Covered by focused unit tests for permission short-circuit, query shape, owner/member filters, ordering, relation normalization, `bill_type` fallback, null-data fallback, and error propagation. |
| `lib/finance/receivables-server.ts` | Permission-filtered receivable income reads. | Extracted. | Covered by focused unit tests for permission short-circuit, query shape, owner/member filters, ordering, relation normalization, null-data fallback, and error propagation. |
| Expense dashboard aggregation | Member filtering, totals, remaining limit, used percent, exceeded flag. | Pending. | Needs dedicated tests before extraction. |
| Payable dashboard aggregation | Status enrichment, totals, counts, type buckets, member visibility. | Pending. | Needs dedicated tests before extraction. |
| Receivable dashboard aggregation | Status enrichment, totals, counts, type buckets, member visibility. | Pending. | Needs dedicated tests before extraction. |
| `lib/finance/server.ts` façade | Backward-compatible public exports and seed-before-read orchestration. | Still present. | Should remain until call sites are intentionally migrated or protected by compatibility tests. |

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

The following dependencies still make blind movement risky:

- `seedInitialFinanceData()` is called by multiple public read functions;
- `getCurrentUserId()` redirects unauthenticated users;
- `getCurrentProfile()` and `getAccessibleMemberIds()` enforce permission-sensitive visibility;
- dashboard aggregations depend on filtered member visibility;
- dashboard aggregations depend on status enrichment rules;
- relation normalization hides Supabase relation array/object differences.

## Safe split order

Completed:

1. Extract relation normalization helpers with focused unit coverage.
2. Extract seed payload helpers with focused unit coverage.
3. Extract seed orchestration with focused unit coverage.
4. Extract member/category read helpers with scoping/order coverage.
5. Extract permission-filtered read helpers for expenses, payables, and receivables with query/permission/normalization coverage.

Remaining recommended order:

1. Add or confirm dashboard aggregation coverage before moving dashboard code.
2. Extract expense dashboard aggregation in a dedicated PR.
3. Extract payable dashboard aggregation in a dedicated PR.
4. Extract receivable dashboard aggregation in a dedicated PR.
5. Reassess whether `lib/finance/server.ts` should remain as a compatibility façade or whether call sites should migrate to domain modules.
6. Update this audit or the gap register only after each merge.

## Forbidden actions

```txt
Do not split all finance server responsibilities in one PR.
Do not change query semantics while moving files.
Do not rely only on TypeScript/build success as refactor proof.
Do not move dashboard aggregation code without tests or guards.
Do not mix server module extraction with RLS, schema, billing, UI, routes, or E2E work.
Do not remove seed calls unless a replacement contract exists.
Do not remove owner/access-control filters during movement.
Do not claim GAP-013 is closed until dashboards and façade strategy are explicitly resolved.
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

GAP-013 is partially reduced, not fully closed.

Completed read-helper extractions now have focused tests. The remaining risk is concentrated in dashboard aggregation and the long-term compatibility façade strategy for `lib/finance/server.ts`.