# SaaS Gap Register

Issue: #482

## Purpose

This document centralizes known SaaS gaps so future work is chosen from documented risk instead of memory.

This is documentation only.

## Rule

```txt
A gap is not solved until a small PR is merged with green CI and the related documentation is updated.
```

## Completed blocks

| Block | Status |
| --- | --- |
| Public/auth smoke E2E | Covered |
| Protected route smoke E2E | Covered |
| Permission-sensitive E2E | Gated covered |
| Data-changing E2E | Gated cleanup-backed covered |
| Admin and permissions documentation reconciliation | Covered |
| Supabase proxy and client boundary guards | Covered |

## Open gaps

| ID | Area | Current gap | Next safe action |
| --- | --- | --- | --- |
| GAP-001 | Organization UX | Multiple-organization behavior is not yet defined as a product and access contract. | Define the active-organization UX contract before route or billing work. |
| GAP-002 | Routes | Protected routes still use `/protected` instead of explicit organization routes. | Plan route migration only after GAP-001. |
| GAP-003 | RLS | Final finance RLS hardening is not complete. | Continue with small planning and test PRs before any broad policy rollout. |
| GAP-004 | Legacy data | Legacy `organization_id IS NULL` fallback still exists. | Validate backfill and removal criteria before any cleanup. |
| GAP-005 | Compatibility | `owner_id` remains part of the transitional model. | Keep compatibility until the organization-only model is proven. |
| GAP-006 | Billing | Billing is not implemented. | Define billing after organization context, RLS, and route strategy are stable. |
| GAP-007 | Admin bootstrap | `ADMIN_EMAIL` remains a bootstrap mechanism. | Plan a final organization admin and invitation model. |
| GAP-008 | Multi-org tests | Switching between organizations has no dedicated tests because the UX contract is not defined. | Define behavior first, then add tests. |
| GAP-009 | Schema hardening | `organization_id NOT NULL` is not safe yet. | Prove backfill, inserts, RLS readiness, and rollback first. |
| GAP-010 | Documentation freshness | Audits can become stale after implementation PRs. | Reconcile docs after each merged implementation PR. |
| GAP-011 | UI contracts | Critical finance UI components do not yet have explicit contract or snapshot-style coverage. | Start with one representative critical component and add non-brittle contract coverage before broad expansion. |
| GAP-014 | One active membership | The current one-active-membership model limits multi-organization use cases and must be explicit as product behavior. | Define the active organization UX/product contract before changing membership rules. |
| GAP-015 | Sensitive operation controls | Rate limiting, sensitive-action audit logging, and data retention policies are not yet documented as implemented controls. | Create planning issues for rate limits, audit events, and retention policy before runtime work. |
| GAP-016 | Onboarding terminology | The onboarding path and wording expose organization terminology that can feel abstract for personal/family finance users. | Define product copy and UX contract before UI changes. |
| GAP-017 | Notifications | Due-date alerts and notification channels are not implemented. | Define notification scope, channel, and opt-in model before implementation. |
| GAP-018 | Dashboard visualization | Dashboard chart/time-series visualization is not explicitly covered as a product capability. | Define dashboard insight requirements before adding charting dependencies. |
| GAP-019 | Client state strategy | There is no explicit client state strategy for growing filters, pagination, optimistic updates, and local UI coordination. | Document when local state, URL state, server actions, or a store should be used. |

## Recently closed gaps

| ID | Area | Closed by | Notes |
| --- | --- | --- | --- |
| GAP-012 | Supabase proxy coverage | #488, #489, #490, #493, #494 | Covered by proxy entrypoint guard and Supabase client factory boundary guard. This does not claim final RLS hardening or final tenant-isolation readiness. |
| GAP-013 | Finance server size | #496, #500, #518, #520, #522, #524, #526, #528, #530, #532, #534 | Resolved by extracting relation, seed, read-helper, and dashboard aggregation boundaries; adding failure-path coverage; documenting ADR 0006; and protecting `lib/finance/server.ts` as an intentional compatibility façade/orchestrator with guard coverage. |

## Next recommended risk

GAP-001 is the next recommended risk: define active organization and multiple-organization UX behavior.

GAP-011 is also a product-quality risk and should be handled as a focused test-hardening track before major UI redesigns.

GAP-014 through GAP-019 came from external review and must be handled as separate issue/PR cycles before implementation.

Reason:

- GAP-001 must come before explicit organization routes;
- GAP-001 informs permission behavior;
- GAP-001 prevents tests around undefined behavior;
- GAP-001 avoids designing billing around ambiguous organization context;
- GAP-011 prevents critical finance UI regressions from passing unnoticed during redesigns/refactors;
- GAP-015 tracks controls expected by users handling sensitive financial data.

## Boundaries

```txt
No false green.
No stale documentation.
No merge without green CI.
No broad mixed PR.
No route, billing, schema, or RLS final work before its contract exists.
No broad snapshot dump without a clear UI contract.
No security-control implementation without a small issue, validation plan, and rollback strategy.
```