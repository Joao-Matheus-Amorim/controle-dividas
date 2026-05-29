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
| Active organization UX and switch | Gated cleanup-backed covered |
| Explicit organization routes `/org/[orgSlug]` | Implemented with `/protected` compatibility |
| OrgSlug route E2E | Gated cleanup-backed covered |
| Permission-sensitive E2E | Gated covered |
| Data-changing E2E | Gated cleanup-backed covered |
| Admin and permissions documentation reconciliation | Covered |
| Supabase proxy and client boundary guards | Covered |
| RLS fallback removal and legacy owner/family policy cleanup | Covered by migrations `030` to `039` |

## Open gaps

| ID | Area | Current gap | Next safe action |
| --- | --- | --- | --- |
| GAP-005 | Compatibility | `owner_id` remains part of the transitional model. | Keep compatibility until the organization-only model is proven. |
| GAP-006 | Billing | Billing has a local plan contract, billing settings status UI, subscription flow contract, Stripe configuration boundary, Stripe checkout runtime, and a Stripe test account runbook. Real Stripe checkout evidence is pending because there is no Stripe test account/credentials configured yet. Portal, webhook, subscriptions, and commercial enforcement are not implemented. | Follow the Stripe test account runbook, validate checkout runtime evidence, then implement webhook and portal in dedicated PRs. |
| GAP-007 | Admin bootstrap | `ADMIN_EMAIL` remains a bootstrap mechanism. | Plan a final organization admin and invitation model. |
| GAP-010 | Documentation freshness | Audits can become stale after implementation PRs. | Reconcile docs after each merged implementation PR. |
| GAP-011 | UI contracts | Dashboard, primary finance lists, primary data-changing forms, selective visual snapshot strategy, dashboard summary deterministic fixture, and gated dashboard summary screenshot are documented. | Validate the first gated screenshot with the dashboard summary fixture before adding any broader visual coverage. |
| GAP-014 | Membership lifecycle | The one-active-membership database limit was removed, but final invitation/admin membership behavior still needs a dedicated decision. | Define final invitation/admin membership behavior before removing transitional bootstrap assumptions. |
| GAP-015 | Sensitive operation controls | Planning contract exists in `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`; audit event schema/read-side RLS is documented in `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md` and versioned in `supabase/migrations/040_audit_events_schema.sql`; audit event write boundary exists in `supabase/migrations/041_audit_events_write_boundary.sql` through `record_audit_event`; billing checkout audit runtime uses `record_audit_event`; admin permission audit runtime uses `record_audit_event`; admin user audit runtime uses `record_audit_event`; payable bill audit runtime uses `record_audit_event` for `finance.payable.status.update` and `finance.payable.delete`; receivable income audit runtime uses `record_audit_event` for `finance.receivable.status.update` and `finance.receivable.delete`; expense audit runtime uses `record_audit_event` for `finance.expense.delete`; category delete audit runtime uses `record_audit_event` for `finance.category.delete`; bank audit runtime uses `record_audit_event` for `finance.bank.balance.update` and `finance.bank.delete`; rate limit planning exists in `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`; data retention planning exists in `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`. Rate limiting and data retention runtime controls are not implemented. | Create dedicated implementation PRs for rate limits and retention policy before cleanup work. |
| GAP-016 | Onboarding terminology | The onboarding path and wording expose organization terminology that can feel abstract for personal/family finance users. | Define product copy and UX contract before UI changes. |
| GAP-017 | Notifications | Due-date alerts and notification channels are not implemented. | Define notification scope, channel, and opt-in model before implementation. |
| GAP-018 | Dashboard visualization | Dashboard chart/time-series visualization is not explicitly covered as a product capability. | Define dashboard insight requirements before adding charting dependencies. |
| GAP-019 | Client state strategy | There is no explicit client state strategy for growing filters, pagination, optimistic updates, and local UI coordination. | Document when local state, URL state, server actions, or a store should be used. |

## Recently closed gaps

| ID | Area | Closed by | Notes |
| --- | --- | --- | --- |
| GAP-001 | Organization UX | ADR 0002, active organization indicator, switch action, and gated multi-org switch E2E | Active organization UX is implemented and covered as a transitional contract. |
| GAP-002 | Routes | ADR 0007, `/org/[orgSlug]` routes, shared protected page implementations, and gated orgSlug E2E | `/protected` remains as compatibility, not as the only protected route family. |
| GAP-003 | RLS | Migrations `030` to `039` and RLS gated suites | Final fallback removal and legacy owner/family policy cleanup are versioned; CI evidence still depends on the manual RLS Live Gate. |
| GAP-004 | Legacy data | Hardening migrations `020` to `028` plus fallback-removal migrations `030` to `038` | Legacy `organization_id IS NULL` fallback is no longer the runtime/RLS contract. |
| GAP-008 | Multi-org tests | `tests/e2e/multi-org-switch-authenticated-gated.spec.ts` | Switching between organizations has cleanup-backed gated coverage. |
| GAP-009 | Schema hardening | Migrations `020` to `028` | `organization_id NOT NULL` hardening is versioned for tenant-scoped tables. |
| GAP-012 | Supabase proxy coverage | #488, #489, #490, #493, #494 | Covered by proxy entrypoint guard and Supabase client factory boundary guard. |
| GAP-013 | Finance server size | #496, #500, #518, #520, #522, #524, #526, #528, #530, #532, #534 | Resolved by extracting relation, seed, read-helper, and dashboard aggregation boundaries; ADR 0006 protects `lib/finance/server.ts` as an intentional compatibility facade/orchestrator. |

## Next recommended risk

GAP-006 remains a product implementation risk after evidence gates: billing status UI, subscription flow contract, Stripe configuration boundary, and checkout runtime exist, but real Stripe checkout evidence is pending until a Stripe test account and credentials exist. Webhook, portal, subscription state sync, and commercial enforcement are still not implemented.

GAP-011 is also a product-quality risk and should be handled as a focused test-hardening track before major UI redesigns.

GAP-014 through GAP-019 came from external review and must be handled as separate issue/PR cycles before implementation. GAP-015 now has a planning contract, audit event schema/read-side RLS, audit event write boundary, billing checkout audit runtime, admin permission audit runtime, admin user audit runtime, payable bill audit runtime, receivable income audit runtime, expense audit runtime, category delete audit runtime, bank audit runtime, rate limit plan, and data retention plan, but it remains open until rate limiting and data retention controls are implemented in dedicated PRs.

Reason:

- RLS Live Gate evidence and orgSlug E2E evidence still need dedicated environment runs before claiming full external proof;
- billing should not start until those evidence gates are intentionally handled or explicitly deferred;
- GAP-011 is reduced by dashboard, finance list, finance form, selective visual snapshot, dashboard summary deterministic fixture, and gated screenshot contracts; broad visual redesign still needs explicit evidence before any wider visual coverage;
- GAP-015 tracks controls expected by users handling sensitive financial data; billing checkout, admin permission, admin user, payable bill, receivable income, expense, category delete, and bank audit runtime exist, but rate limiting and retention runtime are still pending.

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
