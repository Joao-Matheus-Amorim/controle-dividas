# Sensitive Operation Rate Limit Plan

GAP: GAP-015

## Purpose

This document defines the planning contract for rate limiting sensitive operations before any runtime limiter exists.

It follows `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md` and complements `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`.

## Current status

```txt
Planning only.
No rate limit runtime.
No storage dependency.
No middleware change.
No Server Action wrapper.
No schema change.
No RLS change.
No UI change.
No billing behavior change.
No E2E change.
```

Rate limiting is not implemented yet.

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
| Storage | Explicit backend decision before runtime. |
| Bypass | Explicit internal/admin bypass policy, if any. |
| Rollback | How to disable or relax the limiter without data loss. |

Client-only throttling is not a GAP-015 control. The limiter must run on the server boundary that performs or authorizes the sensitive operation.

## Candidate operation tiers

Initial limits should be grouped by risk:

| Tier | Operation examples | Initial posture |
| --- | --- | --- |
| Public auth | login, signup, password reset | Highest abuse risk; actor may be anonymous. |
| Billing checkout | `billing.checkout.start` | Authenticated and organization-scoped. |
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

No runtime limiter should be added until the storage model and rollback path are explicit.

## Sequencing

Rate limiting should move in this order:

1. Choose storage model and disable/rollback mechanism.
2. Implement public auth flow limits or billing checkout limit in one PR.
3. Add focused tests for allowed, blocked, and reset-window behavior.
4. Add audit outcome events after audit event storage exists.
5. Expand to admin mutations.
6. Expand to destructive finance actions.

## Non-goals

This plan does not implement:

- limiter middleware;
- Server Action wrappers;
- storage tables;
- external cache configuration;
- audit events;
- UI copy changes;
- billing checkout behavior changes;
- E2E coverage.

## Acceptance

A future rate limit PR must:

- reference this plan;
- implement one operation tier at a time;
- prove actor and organization are resolved server-side;
- include a rollback or disable mechanism;
- include focused unit/integration coverage;
- update `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.
