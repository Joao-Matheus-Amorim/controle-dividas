# Sensitive Action Audit Event Schema Plan

GAP: GAP-015

## Purpose

This document defines the contract for sensitive-action audit event schema and redaction.

It is the next planning slice after `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.

## Current status

```txt
Schema migration exists in supabase/migrations/040_audit_events_schema.sql.
Write boundary exists in supabase/migrations/041_audit_events_write_boundary.sql.
Billing checkout audit runtime exists in app/protected/configuracoes/billing-actions.ts using record_audit_event.
Admin permission audit runtime exists in app/protected/admin/actions.ts using record_audit_event.
Read-side RLS exists for organization owner/admin.
No insert/update/delete policy for authenticated users.
No UI.
No billing webhook, portal, or commercial enforcement change.
No E2E change.
```

Audit event storage is versioned. Billing checkout and admin permission audit logging are implemented; other operation families remain pending.

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

## Access and RLS decision

The initial audit event storage decision is:

- `public.audit_events` stores sensitive-action audit event summaries.
- Owner/admin members can read events for their organization through RLS.
- Authenticated users do not receive insert, update, or delete grants.
- `public.record_audit_event(...)` is the authenticated member-scoped write boundary.
- Billing checkout runtime calls `record_audit_event` for checkout session creation and checkout setup failures.
- Admin permission runtime calls `record_audit_event` for module and feature permission updates.

Runtime logging PRs must call the write boundary from one operation family at a time.

## Runtime sequencing

Audit logging should be added incrementally:

1. Keep `040_audit_events_schema.sql` as schema/read-side RLS only.
2. Keep `041_audit_events_write_boundary.sql` as the authenticated write boundary.
3. Billing checkout audit runtime is wired through `record_audit_event`.
4. Admin permission audit runtime is wired through `record_audit_event`; admin user lifecycle audit events remain pending.
5. Add destructive finance audit events one family at a time.
6. Add status-transition audit events after delete coverage is stable.

## Acceptance

A future audit logging PR must:

- reference this plan;
- preserve `040_audit_events_schema.sql` or document the migration replacement;
- preserve `041_audit_events_write_boundary.sql` or document the write-boundary replacement;
- implement one operation family at a time;
- prove actor and organization are resolved server-side;
- prove forbidden metadata is not logged;
- add focused tests for emitted events or guard coverage;
- update `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.
