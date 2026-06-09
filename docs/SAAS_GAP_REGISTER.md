# SaaS Gap Register

> Status DocDoc: Atual
> Uso atual: registro vivo de gaps, riscos e proximas acoes seguras.
> Regra: se um plano antigo contradiz este registro, atualizar o plano ou marcar
> o plano como superado antes de usar.

Issue: #482

## Purpose

This document centralizes known SaaS gaps so future work is chosen from documented risk instead of memory.

This is documentation only.

## Rule

```txt
A gap is not solved until a small PR is merged with green CI and the related documentation is updated.
Every PR that closes or reduces a gap, block, or feature must update the living documentation in the same scope.
Architecture decisions, route changes, boundary changes, and compatibility changes require an ADR or decision record before runtime.
Regra operacional: todo PR que fecha ou reduz gap, bloco ou funcionalidade atualiza a documentacao viva no mesmo escopo.
Decisao arquitetural, mudanca de rota, boundary ou compatibilidade exige ADR ou registro decisorio antes do runtime.
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
| GAP-005 | Compatibility | `owner_id` remains part of the transitional model; admin read/write paths in `lib/finance/admin-server.ts` and `app/protected/admin/actions.ts` now require admin rights in the active organization and are organization-first; `lib/finance/access-control.ts` also resolves permissions and accessible members by active organization; people and category read helpers can resolve by active organization, while settings category management still lists only rows compatible with owner-scoped writes/RLS; schema and other consumers still preserve owner compatibility. | Continue with the next dedicated owner_id consumer before schema retirement. |
| GAP-006 | Billing | Billing has a local plan contract, billing settings status UI, subscription flow contract, Stripe configuration boundary, Stripe checkout runtime, billing portal runtime, Stripe test account runbook, and webhook pre-runtime contract. Real Stripe checkout and portal evidence is pending because there is no Stripe test account/credentials configured yet. Webhook, subscription sync, and commercial enforcement are not implemented. | Follow the Stripe test account runbook, validate checkout and portal runtime evidence, then implement webhook and subscription sync in dedicated PRs. |
| GAP-007 | Admin bootstrap | The final organization admin and invitation contract exists in `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md`; schema/preflight is versioned in `supabase/migrations/044_admin_invitations_schema.sql`; create/revoke/resend runtime is versioned in `app/protected/admin/invitation-actions.ts`; acceptance/linking runtime is versioned in `supabase/migrations/045_accept_admin_invitation_rpc.sql` and `supabase/migrations/047_accept_admin_invitation_profile_creation.sql` plus `app/auth/convite/actions.ts` with audit and rate limit, creating/linking profiles before active membership; the delivery/UI contract exists in `docs/audits/ADMIN_INVITATION_DELIVERY_UI_CONTRACT.md`; delivery adapter runtime is versioned in `lib/admin-invitations/delivery.ts`; invitation UI is versioned in `app/auth/convite/page.tsx` plus `components/admin-invitation-acceptance-form.tsx`; cron expiry is versioned in `supabase/migrations/046_admin_invitation_expiry_cleanup.sql`, `app/api/cron/admin-invitations/expire/route.ts`, and `vercel.json`; admin read/write/access-control paths are organization-first; and `lib/finance/access-control.ts` plus `lib/finance/admin-server.ts` no longer use `ADMIN_EMAIL` as a runtime gate. | Keep `ADMIN_EMAIL` out of runtime bootstrap and continue owner_id retirement in dedicated PRs. |
| GAP-010 | Documentation freshness | Audits can become stale after implementation PRs. | Reconcile docs after each merged implementation PR. |
| GAP-011 | UI contracts | Dashboard, primary finance lists, primary data-changing forms, selective visual snapshot strategy, dashboard summary deterministic fixture, gated dashboard summary screenshot, and the first versioned dashboard summary snapshot evidence are covered. | Use the versioned dashboard summary baseline before adding any broader visual coverage; every new visual surface still needs its own deterministic fixture and gated command. |
| GAP-014 | Membership lifecycle | The one-active-membership database limit was removed; final invitation/admin membership behavior is defined by `docs/audits/ADMIN_INVITATION_BOOTSTRAP_CONTRACT.md`; invitation storage preflight, create/revoke/resend runtime, acceptance/linking runtime that creates/links profile before membership, delivery/UI contract, delivery adapter runtime, invitation UI, cron expiry cleanup, and removal of the `ADMIN_EMAIL` runtime gate exist. | Continue membership lifecycle cleanup through owner_id retirement and invitation lifecycle validation. |
| GAP-015 | Sensitive operation controls | Planning contract exists in `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`; audit event schema/read-side RLS is documented in `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md` and versioned in `supabase/migrations/040_audit_events_schema.sql`; audit event write boundary exists in `supabase/migrations/041_audit_events_write_boundary.sql` through `record_audit_event`; billing checkout audit runtime uses `record_audit_event`; billing checkout rate limit runtime covers `billing.checkout.start` with process-local storage, expired bucket cleanup, and `DISABLE_SENSITIVE_RATE_LIMITS` rollback; billing portal audit runtime uses `record_audit_event`; billing portal rate limit runtime covers `billing.portal.start` with process-local storage and `DISABLE_SENSITIVE_RATE_LIMITS` rollback; admin permission audit runtime uses `record_audit_event`; admin permission rate limit runtime covers `admin.permission.update` and `admin.feature_permission.update`; admin user audit runtime uses `record_audit_event`; admin user rate limit runtime covers `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete`, and `admin.user.status.update`; admin invitation audit runtime uses `record_audit_event`; admin invitation rate limit runtime covers `admin.invitation.create`, `admin.invitation.revoke`, `admin.invitation.resend`, and `admin.invitation.accept`; payable bill audit runtime, payable delete rate limit runtime, payable status rate limit runtime, payable write audit runtime, and payable write rate limit runtime cover `finance.payable.status.update`, `finance.payable.delete`, `finance.payable.create`, and `finance.payable.update`; receivable income audit runtime, receivable delete rate limit runtime, receivable status rate limit runtime, receivable write audit runtime, and receivable write rate limit runtime cover `finance.receivable.status.update`, `finance.receivable.delete`, `finance.receivable.create`, and `finance.receivable.update`; expense audit runtime, expense delete rate limit runtime, expense write audit runtime, and expense write rate limit runtime cover `finance.expense.delete`, `finance.expense.create`, and `finance.expense.update`; category delete audit runtime and category delete rate limit runtime cover `finance.category.delete`; category write audit runtime and category write rate limit runtime cover `finance.category.create` and `finance.category.update`; bank audit runtime, bank delete rate limit runtime, bank balance rate limit runtime, bank write audit runtime, and bank write rate limit runtime cover `finance.bank.balance.update`, `finance.bank.delete`, `finance.bank.create`, and `finance.bank.update`; member limit audit runtime and member limit rate limit runtime cover `finance.member.limit.update`; member status audit runtime and member status rate limit runtime cover `finance.member.status.update`; member write audit runtime and member write rate limit runtime cover `finance.member.create` and `finance.member.update`; rate limit planning exists in `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`; data retention planning exists in `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`; audit event retention preflight and cleanup runtime count and delete confirmed owner/admin-only organization-scoped `audit_events` older than 365 days via `cleanup_expired_audit_events`. Remaining broader rate limiting and data retention cleanup runtime controls are not implemented. | Create dedicated implementation PRs for broader rate limits and retention policy before cleanup work. |
| GAP-016 | Onboarding terminology | Onboarding terminology contract exists in `docs/audits/ONBOARDING_TERMINOLOGY_CONTRACT.md`; first user-facing runtime copy adoption is implemented in `app/onboarding/organizacao/page.tsx`, `app/onboarding/organizacao/actions.ts`, and `components/onboarding/organization-onboarding-form.tsx`. The route remains `/onboarding/organizacao`; no schema, RLS, billing, permission, layout, or dependency change is implemented. | Keep using the contract for any further onboarding copy or UX change; route rename remains blocked until ADR or decision record. |
| GAP-017 | Notifications | Notification scope contract exists in `docs/audits/NOTIFICATION_SCOPE_CONTRACT.md`, defining due-date/overdue alert candidates, in-app first delivery, external channel gates, opt-in rules, tenant scope, permission boundaries, deduplication, and rollback expectations. No notification runtime, UI, cron, schema, RLS, billing, or dependency change is implemented. | Use the contract before adding in-app alerts, email, push, notification preferences, jobs, or providers; update it when the first runtime implementation lands. |
| GAP-018 | Dashboard visualization | Dashboard visualization contract exists in `docs/audits/DASHBOARD_VISUALIZATION_CONTRACT.md`, defining first insight candidates, server-side data rules, permission boundaries, textual fallbacks, mobile behavior, and charting dependency gates. No chart runtime, UI change, schema, RLS, billing, or dependency change is implemented. | Use the contract before adding dashboard charts or time-series; update it when the first runtime implementation lands. |
| GAP-019 | Client state strategy | Client state strategy contract exists in `docs/audits/CLIENT_STATE_STRATEGY_CONTRACT.md`, covering local state, URL state, useActionState, useTransition, @tanstack/react-table, server data, and the boundary for any future store. No runtime, UI, schema, RLS, billing, or dependency change is implemented. | Use the contract before adding filters, pagination, optimistic updates, or a global store; update it when the first runtime implementation lands. |

GAP-015 public auth note: login rate limit runtime covers `auth.login.password` in `app/auth/login/actions.ts` using the normalized email as actor key and `public-auth` as organization key, with shared buckets for missing or malformed emails. This step has sem audit runtime because `record_audit_event` requires an authenticated organization member.

GAP-015 public auth note: signup authorized email rate limit runtime covers `auth.signup.authorized_email.check` in `app/auth/sign-up/actions.ts` using the normalized email as actor key and `public-auth` as organization key. This step has sem audit runtime because `record_audit_event` requires an authenticated organization member.

GAP-015 public auth note: signup submit rate limit runtime covers `auth.signup.submit` in `app/auth/sign-up/actions.ts` using the normalized email as actor key and `public-auth` as organization key, with shared buckets for missing or malformed emails and server-side authorized-profile lookup before Supabase signup. This step has sem audit runtime because `record_audit_event` requires an authenticated organization member.

GAP-015 public auth note: auth confirm rate limit runtime covers `auth.confirm.verify` in `app/auth/confirm/route.ts` using the public client actor as actor key, OTP type as target key, and `public-auth` as organization key. This step has sem audit runtime because `record_audit_event` requires an authenticated organization member.

GAP-015 public auth note: password reset rate limit runtime covers `auth.password_reset.request` in `app/auth/forgot-password/actions.ts` using the normalized email as actor key and `public-auth` as organization key. This step has sem audit runtime because `record_audit_event` requires an authenticated organization member.

GAP-015 public auth note: password update rate limit runtime covers `auth.password_update.submit` in `app/auth/update-password/actions.ts` using the current auth user id as actor key, a shared `missing-session` bucket when no recovery session is present, and `public-auth` as organization key. This step has sem audit runtime because `record_audit_event` requires an authenticated organization member.

GAP-015 onboarding note: onboarding organization rate limit runtime covers `onboarding.organization.create` in `app/onboarding/organizacao/actions.ts` using the current auth user id as actor key, a shared `missing-session` bucket when no session is present, and `onboarding` as organization key before calling `create_initial_organization_onboarding`. This step has sem audit runtime because the organization context is created by this boundary.

GAP-006 billing portal note: billing portal runtime covers `billing.portal.start` in `app/protected/configuracoes/billing-actions.ts` using server-resolved organization context and `stripe_customer_id` only from the active organization. Webhook, subscription sync, and commercial enforcement are not implemented.

GAP-015 billing portal note: billing portal audit runtime uses `record_audit_event` and billing portal rate limit runtime covers `billing.portal.start` with process-local storage and `DISABLE_SENSITIVE_RATE_LIMITS` rollback.

## Recently closed gaps

| ID | Area | Closed by | Notes |
| --- | --- | --- | --- |
| GAP-001 | Organization UX | ADR 0002, active organization indicator, switch action, and gated multi-org switch E2E | Active organization UX is implemented and covered as a transitional contract. |
| GAP-002 | Routes | ADR 0007, `/org/[orgSlug]` routes, shared protected page implementations, and gated orgSlug E2E | `/protected` remains as compatibility, not as the only protected route family. |
| GAP-003 | RLS | Migrations `030` to `039`, RLS gated suites, and RLS Live Gate evidence | Final fallback removal and legacy owner/family policy cleanup are versioned; RLS Live Gate is green in run `26913026310` with artifact `rls-live-gate-evidence-26913026310-5`. |
| GAP-004 | Legacy data | Hardening migrations `020` to `028` plus fallback-removal migrations `030` to `038` | Legacy `organization_id IS NULL` fallback is no longer the runtime/RLS contract. |
| GAP-008 | Multi-org tests | `tests/e2e/multi-org-switch-authenticated-gated.spec.ts` | Switching between organizations has cleanup-backed gated coverage. |
| GAP-009 | Schema hardening | Migrations `020` to `028` | `organization_id NOT NULL` hardening is versioned for tenant-scoped tables. |
| GAP-012 | Supabase proxy coverage | #488, #489, #490, #493, #494 | Covered by proxy entrypoint guard and Supabase client factory boundary guard. |
| GAP-013 | Finance server size | #496, #500, #518, #520, #522, #524, #526, #528, #530, #532, #534 | Resolved by extracting relation, seed, read-helper, and dashboard aggregation boundaries; ADR 0006 protects `lib/finance/server.ts` as an intentional compatibility facade/orchestrator. |

## Next recommended risk

GAP-006 remains a product implementation risk after evidence gates: billing status UI, subscription flow contract, Stripe configuration boundary, checkout runtime, billing portal runtime, and webhook pre-runtime contract exist, but real Stripe checkout and portal evidence is pending until a Stripe test account and credentials exist. Webhook, subscription sync, and commercial enforcement are still not implemented.

GAP-011 is also a product-quality risk and should continue as a focused test-hardening track before major UI redesigns.

GAP-014 through GAP-019 came from external review and must be handled as separate issue/PR cycles before implementation. GAP-015 now has a planning contract, audit event schema/read-side RLS, audit event write boundary, billing checkout audit runtime, billing checkout rate limit runtime, billing portal audit runtime, billing portal rate limit runtime, expense delete rate limit runtime, expense write audit runtime, expense write rate limit runtime, payable delete rate limit runtime, payable status rate limit runtime, payable write audit runtime, payable write rate limit runtime, receivable delete rate limit runtime, receivable status rate limit runtime, receivable write audit runtime, receivable write rate limit runtime, bank delete rate limit runtime, bank balance rate limit runtime, bank write audit runtime, bank write rate limit runtime, member limit audit runtime, member limit rate limit runtime, member status audit runtime, member status rate limit runtime, member write audit runtime, member write rate limit runtime, category delete audit runtime, category delete rate limit runtime, category write audit runtime, category write rate limit runtime, admin permission audit runtime, admin permission rate limit runtime, admin user audit runtime, admin user rate limit runtime, admin invitation accept audit and rate limit runtime, payable bill audit runtime, receivable income audit runtime, expense audit runtime, bank audit runtime, rate limit plan, and data retention plan, audit event retention preflight, and audit event retention cleanup runtime, but it remains open until broader rate limiting and data retention cleanup controls are implemented in dedicated PRs.

Reason:

- orgSlug E2E evidence still needs a dedicated environment run before claiming full external route proof; RLS Live Gate evidence is green in run `26913026310`;
- billing webhook and subscription sync work should not start until checkout and portal evidence gates have real Stripe test evidence;
- GAP-011 is reduced by dashboard, finance list, finance form, selective visual snapshot, dashboard summary deterministic fixture, gated screenshot contracts, and the first versioned dashboard summary snapshot evidence; broad visual redesign still needs explicit evidence before any wider visual coverage;
- GAP-015 tracks controls expected by users handling sensitive financial data; billing checkout audit, billing checkout rate limiting, billing portal audit, billing portal rate limiting, expense delete rate limiting, expense write audit and rate limiting, payable delete rate limiting, payable status rate limiting, payable write audit and rate limiting, receivable delete rate limiting, receivable status rate limiting, receivable write audit and rate limiting, bank delete rate limiting, bank balance rate limiting, bank write audit and rate limiting, member limit audit and rate limiting, member status audit and rate limiting, member write audit and rate limiting, category delete audit and rate limiting, category write audit and rate limiting, admin permission audit and rate limiting, admin user audit and rate limiting, admin invitation audit and rate limiting, payable bill, receivable income, expense, and bank audit runtime exist, but broader rate limiting and retention cleanup runtime are still pending.

GAP-019 now has a client state strategy contract, but runtime adoption remains future work.

GAP-018 now has a dashboard visualization contract, but chart runtime remains future work.

GAP-016 now has an onboarding terminology contract and first runtime copy adoption, but route terminology remains future work until an ADR or decision record exists.

GAP-017 now has a notification scope contract, but notification runtime, channels, preferences, jobs, and providers remain future work.

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
