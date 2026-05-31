# Sensitive Operation Rate Limit Plan

GAP: GAP-015

## Purpose

This document defines the planning contract for rate limiting sensitive operations as runtime coverage expands one server boundary at a time.

It follows `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md` and complements `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`.

## Current status

```txt
Billing checkout rate limit runtime exists for `billing.checkout.start`.
Billing portal rate limit runtime exists for `billing.portal.start`.
Billing portal runtime is limited by `billing.portal.start`.
Login rate limit runtime exists for `auth.login.password`.
Signup authorized email rate limit runtime exists for `auth.signup.authorized_email.check`.
Signup submit rate limit runtime exists for `auth.signup.submit`.
Auth confirm rate limit runtime exists for `auth.confirm.verify`.
Password reset rate limit runtime exists for `auth.password_reset.request`.
Password update rate limit runtime exists for `auth.password_update.submit`.
Onboarding organization rate limit runtime exists for `onboarding.organization.create`.
Expense delete rate limit runtime exists for `finance.expense.delete`.
Expense write rate limit runtime exists for `finance.expense.create` and `finance.expense.update`.
Payable delete rate limit runtime exists for `finance.payable.delete`.
Payable status rate limit runtime exists for `finance.payable.status.update`.
Payable write rate limit runtime exists for `finance.payable.create` and `finance.payable.update`.
Receivable delete rate limit runtime exists for `finance.receivable.delete`.
Receivable status rate limit runtime exists for `finance.receivable.status.update`.
Receivable write rate limit runtime exists for `finance.receivable.create` and `finance.receivable.update`.
Bank delete rate limit runtime exists for `finance.bank.delete`.
Bank balance rate limit runtime exists for `finance.bank.balance.update`.
Bank write rate limit runtime exists for `finance.bank.create` and `finance.bank.update`.
Member limit rate limit runtime exists for `finance.member.limit.update`.
Member status rate limit runtime exists for `finance.member.status.update`.
Member write rate limit runtime exists for `finance.member.create` and `finance.member.update`.
Category delete rate limit runtime exists for `finance.category.delete`.
Category write rate limit runtime exists for `finance.category.create` and `finance.category.update`.
Admin permission rate limit runtime exists for `admin.permission.update` and `admin.feature_permission.update`.
Admin user rate limit runtime exists for `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete`, and `admin.user.status.update`.
Storage is process-local memory for the first runtime step, with expired buckets evicted before new tracking.
Rollback is `DISABLE_SENSITIVE_RATE_LIMITS=true`.
No middleware change.
No schema change.
No RLS change.
No UI change.
No billing behavior change.
No E2E change.
```

Rate limiting is implemented only for billing checkout start attempts, billing portal start attempts, login password attempts, signup authorized email checks, signup submit attempts, auth confirm verify attempts, password reset requests, password update attempts, onboarding organization creation attempts, expense delete attempts, expense write attempts, payable delete attempts, payable status update attempts, payable write attempts, receivable delete attempts, receivable status update attempts, receivable write attempts, bank delete attempts, bank balance update attempts, bank write attempts, member limit update attempts, member status update attempts, member write attempts, category delete attempts, category write attempts, admin permission update attempts, and admin user lifecycle attempts.

## Control model

Every future rate limit implementation must define:

| Decision | Requirement |
| --- | --- |
| Operation key | Stable server-side key such as `billing.checkout.start`. |
| Actor key | Authenticated user id when available; anonymous identifier only for public auth flows. |
| Organization key | Active organization id for tenant-scoped operations. |
| Target key | Optional target id for sensitive repeated actions against one resource. |
| Window | Fixed, sliding, or token-bucket window with explicit duration. |
| Threshold | Maximum attempts allowed in the window. |
| Response | Safe user-facing error and server-side outcome category. |
| Storage | Explicit backend decision before runtime. The first runtime uses process-local memory with expired bucket cleanup and must not be treated as durable abuse prevention. |
| Bypass | Explicit internal/admin bypass policy, if any. |
| Rollback | How to disable or relax the limiter without data loss. |

Client-only throttling is not a GAP-015 control. The limiter must run on the server boundary that performs or authorizes the sensitive operation.

## Candidate operation tiers

Initial limits should be grouped by risk:

| Tier | Operation examples | Initial posture |
| --- | --- | --- |
| Public auth | `auth.login.password`, `auth.signup.authorized_email.check`, `auth.signup.submit`, `auth.confirm.verify`, `auth.password_reset.request`, `auth.password_update.submit` | Highest abuse risk; actor may be anonymous. Runtime public-auth boundaries use organization key `public-auth`; login password, signup authorized email preflight, signup submit, and password reset request key by normalized email, with shared buckets for missing/malformed emails, auth confirm verify keys by public client actor plus OTP type without using the token hash as a rate-limit key, and password update keys by current auth user id or a shared missing-session bucket. Additional broader public-auth limits still need a durable/cache-backed storage decision. |
| Initial organization onboarding | `onboarding.organization.create` | Authenticated onboarding boundary before an active organization exists. Runtime uses organization key `onboarding`, actor by current auth user id, and a shared `missing-session` bucket; no onboarding audit runtime exists for this step because the organization context is created by the RPC. |
| Billing checkout and portal | `billing.checkout.start`, `billing.portal.start` | Authenticated and organization-scoped. Portal requires server-resolved `stripe_customer_id`. |
| Expense delete | `finance.expense.delete` | Authenticated, organization-scoped, permission-gated. |
| Expense writes | `finance.expense.create`, `finance.expense.update` | Authenticated and organization-scoped; create is actor/organization-scoped, and update is target-scoped. |
| Payable delete | `finance.payable.delete` | Authenticated, organization-scoped, permission-gated. |
| Payable status update | `finance.payable.status.update` | Authenticated, organization-scoped, permission-gated. |
| Payable writes | `finance.payable.create`, `finance.payable.update` | Authenticated and organization-scoped; create is actor/organization-scoped, and update is target-scoped only when payable fields change. |
| Receivable delete | `finance.receivable.delete` | Authenticated, organization-scoped, permission-gated. |
| Receivable status update | `finance.receivable.status.update` | Authenticated, organization-scoped, permission-gated. |
| Receivable writes | `finance.receivable.create`, `finance.receivable.update` | Authenticated and organization-scoped; create is actor/organization-scoped, and update is target-scoped only when receivable fields change. |
| Bank delete | `finance.bank.delete` | Authenticated, organization-scoped, permission-gated. |
| Bank balance update | `finance.bank.balance.update` | Authenticated, organization-scoped, permission-gated. |
| Bank writes | `finance.bank.create`, `finance.bank.update` | Authenticated and organization-scoped; create is actor/organization-scoped, and update is target-scoped only when non-balance bank fields change. |
| Member limit update | `finance.member.limit.update` | Authenticated, organization-scoped, owner-scoped, and target-scoped. |
| Member status update | `finance.member.status.update` | Authenticated, organization-scoped, owner-scoped, and target-scoped. |
| Member writes | `finance.member.create`, `finance.member.update` | Authenticated and organization-scoped, keyed by the current profile actor so linked members do not share the family owner's bucket; create is actor/organization-scoped, and profile update is target-scoped. |
| Category delete | `finance.category.delete` | Authenticated and organization-scoped. |
| Category writes | `finance.category.create`, `finance.category.update` | Authenticated and organization-scoped; create is actor/organization-scoped, and update is target-scoped. |
| Admin permission updates | `admin.permission.update`, `admin.feature_permission.update` | Authenticated, organization-scoped, owner/admin only. |
| Admin user lifecycle | `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete`, `admin.user.status.update` | Authenticated, organization-scoped, owner/admin only. |
| Admin mutations | user create/update/deactivate, permission updates | Authenticated, organization-scoped, owner/admin only. |
| Destructive finance actions | delete expense/payable/receivable/bank/category | Authenticated, organization-scoped, permission-gated. |
| Status transitions | payable/receivable status updates | Authenticated, organization-scoped, lower initial risk than deletes. |

The first runtime PR should cover one tier only.

## Key design

Future implementations should prefer composite keys:

```txt
rate_limit:{operation_key}:{actor_key}:{organization_key}:{target_key?}
```

Rules:

- never use translated UI labels as operation keys;
- never trust `organization_id` supplied by the client;
- derive organization from the active server context;
- derive actor from authenticated server context;
- include target id only when it reduces abuse without causing excessive cardinality;
- destructive delete rate limits should default to operation/actor/organization buckets so deleting many distinct records still reaches the threshold;
- keep keys free of raw emails, names, tokens, or full payload values.

## Response contract

Rate limit responses must:

- avoid revealing whether a target exists outside the actor's organization;
- avoid exposing exact security thresholds in normal UI copy;
- be compatible with Server Actions returning form state;
- be compatible with route handlers returning HTTP status codes;
- produce an audit outcome category after audit logging exists.

## Storage decision required before runtime

Before implementation, choose and document one storage model:

| Option | Notes |
| --- | --- |
| Database table | Durable and auditable, but needs schema/RLS/write-boundary decisions. |
| External cache | Better for short windows, but needs operational dependency and env handling. |
| Platform limiter | Acceptable only if limits can include actor and organization dimensions. |

The first runtime limiter uses process-local memory to keep the rollout schema-free and reversible. It sweeps expired buckets before tracking new traffic so long-lived processes do not retain stale actor/organization/target entries forever. This is acceptable for the initial billing checkout, billing portal, login password, signup authorized email preflight, signup submit, auth confirm verify, password reset request, password update submit, onboarding organization create, expense delete, expense write, payable delete, payable status update, payable write, receivable delete, receivable status update, receivable write, bank delete, bank balance update, bank write, member limit update, member status update, member write, category delete, category write, admin permission update, and admin user lifecycle boundaries because they are focused, server-side, and protected by `DISABLE_SENSITIVE_RATE_LIMITS=true` rollback. Additional broader or public-auth limits still need a durable/cache-backed storage decision before implementation.

## Sequencing

Rate limiting should move in this order:

1. Billing checkout limit in one PR using process-local memory and `DISABLE_SENSITIVE_RATE_LIMITS=true` rollback.
2. Add focused tests for allowed, blocked, and reset-window behavior.
3. Add expense delete limit in one PR using the same server-side limiter.
4. Add payable delete limit in one PR using the same server-side limiter.
5. Add receivable delete limit in one PR using the same server-side limiter.
6. Add bank delete limit in one PR using the same server-side limiter.
7. Add category delete limit in one PR using the same server-side limiter.
8. Add admin permission update limits in one PR using the same server-side limiter.
9. Add admin user lifecycle limits in one PR using the same server-side limiter.
10. Add payable status update limit in one PR using the same server-side limiter.
11. Add receivable status update limit in one PR using the same server-side limiter.
12. Add bank balance update limit in one PR using the same server-side limiter.
13. Add bank write limits in one PR using the same server-side limiter.
14. Add member limit update limit in one PR using the same server-side limiter.
15. Add member status update limit in one PR using the same server-side limiter.
16. Add member write limits in one PR using the same server-side limiter.
17. Add category write limits in one PR using the same server-side limiter.
18. Add expense write limits in one PR using the same server-side limiter.
19. Add payable write limits in one PR using the same server-side limiter.
20. Add receivable write limits in one PR using the same server-side limiter.
21. Expand to durable/cache-backed storage before public auth flow limits.
22. Add audit outcome events after audit event storage exists.
23. Expand to remaining status transitions.

## Non-goals

This plan does not implement:

- storage tables;
- external cache configuration;
- UI copy changes;
- billing checkout or portal behavior changes;
- E2E coverage.

## Acceptance

A future rate limit PR must:

- reference this plan;
- implement one operation tier at a time;
- prove actor and organization are resolved server-side;
- include a rollback or disable mechanism;
- include focused unit/integration coverage;
- update `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.
