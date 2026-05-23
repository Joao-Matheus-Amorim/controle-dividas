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

## Next recommended risk

GAP-001 is the next recommended risk: define active organization and multiple-organization UX behavior.

GAP-011 is also a product-quality risk and should be handled as a focused test-hardening track before major UI redesigns.

Reason:

- GAP-001 must come before explicit organization routes;
- GAP-001 informs permission behavior;
- GAP-001 prevents tests around undefined behavior;
- GAP-001 avoids designing billing around ambiguous organization context;
- GAP-011 prevents critical finance UI regressions from passing unnoticed during redesigns/refactors.

## Boundaries

```txt
No false green.
No stale documentation.
No merge without green CI.
No broad mixed PR.
No route, billing, schema, or RLS final work before its contract exists.
No broad snapshot dump without a clear UI contract.
```
