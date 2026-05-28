# Sensitive Action Audit Event Schema Plan

GAP: GAP-015

## Purpose

This document defines the planning contract for sensitive-action audit event schema and redaction before any migration or runtime logging exists.

It is the next planning slice after `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.

## Current status

```txt
Planning only.
No audit_events table.
No migration.
No runtime logging.
No RLS policy.
No UI.
No billing behavior change.
No E2E change.
```

Audit logging is not implemented yet.

## Event shape candidate

Future schema work should start from this candidate shape:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Server-generated audit event id. |
| `occurred_at` | yes | Server timestamp, not client-provided. |
| `actor_user_id` | yes | Authenticated user that initiated the action. |
| `organization_id` | yes | Active organization resolved on the server. |
| `action` | yes | Stable operation key, for example `billing.checkout.start`. |
| `target_type` | yes | Domain object family, for example `payable_bill` or `permission`. |
| `target_id` | conditional | Target record id when one exists. |
| `outcome` | yes | `success`, `denied`, `validation_error`, or `failure`. |
| `request_id` | recommended | Correlation id if available. |
| `metadata` | optional | Redacted JSON summary only. |
| `created_at` | yes | Database timestamp if schema keeps both event and insert timestamps. |

The implementation PR may adjust field names, but it must keep the same decisions explicit: actor, organization, action, target, outcome, correlation, and safe metadata.

## Operation key candidates

Initial operation keys should be stable strings, not translated UI labels:

| Operation family | Candidate keys |
| --- | --- |
| Billing checkout | `billing.checkout.start`, `billing.checkout.denied`, `billing.checkout.failed` |
| Admin users | `admin.user.create`, `admin.user.update`, `admin.user.deactivate` |
| Permissions | `admin.permission.update`, `admin.feature_permission.update` |
| Finance deletes | `finance.expense.delete`, `finance.payable.delete`, `finance.receivable.delete`, `finance.bank.delete`, `finance.category.delete` |
| Finance status changes | `finance.payable.status.update`, `finance.receivable.status.update` |
| Organization membership | `organization.membership.role.update`, `organization.membership.status.update` |

Each runtime PR should add only the keys it actually emits.

## Redaction rules

Audit metadata must be intentionally small.

Allowed metadata examples:

- changed field names;
- previous and next status values for low-sensitivity enum changes;
- plan key;
- target display label when it is already visible in the app and not a secret;
- validation error category;
- denial reason category.

Forbidden metadata examples:

- passwords;
- auth tokens;
- Supabase service role keys;
- Stripe secret keys;
- raw Stripe payloads;
- full financial payloads;
- bank account details beyond an internal target id;
- free-form notes;
- full before/after row snapshots.

## Access and RLS planning

The audit event storage decision must be made in a dedicated schema PR.

Before runtime logging, that PR must define:

- whether users can read their own organization audit events;
- whether only owner/admin can read audit events;
- whether service-role writes are required;
- insert policy or RPC boundary;
- retention period;
- backfill behavior, if any;
- rollback path for the table/RPC/policies.

## Runtime sequencing

Audit logging should be added incrementally:

1. Create schema/RLS/RPC or write boundary in one PR.
2. Add billing checkout audit events in one PR.
3. Add admin user/permission audit events in one PR.
4. Add destructive finance audit events one family at a time.
5. Add status-transition audit events after delete coverage is stable.

## Acceptance

A future audit logging PR must:

- reference this plan;
- implement one operation family at a time;
- prove actor and organization are resolved server-side;
- prove forbidden metadata is not logged;
- add focused tests for emitted events or guard coverage;
- update `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.
