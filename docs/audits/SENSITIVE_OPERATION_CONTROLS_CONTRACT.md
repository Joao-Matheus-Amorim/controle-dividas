# Sensitive Operation Controls Contract

GAP: GAP-015

## Purpose

This document defines the planning contract for sensitive operation controls before any runtime implementation.

It covers:

- rate limiting;
- sensitive-action audit logging;
- data retention policy.

Related planning documents:

- `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`
- `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`
- `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`

## Current status

```txt
Audit event schema/read-side RLS exists in supabase/migrations/040_audit_events_schema.sql.
Audit event write boundary exists in supabase/migrations/041_audit_events_write_boundary.sql via record_audit_event.
Billing checkout audit runtime exists via record_audit_event.
Admin permission audit runtime exists via record_audit_event.
Admin user audit runtime exists via record_audit_event.
No rate limit runtime.
No data retention runtime.
No UI change.
No billing webhook, portal, or commercial enforcement change.
No E2E change.
```

Remaining runtime controls are not implemented yet. This document exists to prevent later PRs from claiming GAP-015 runtime coverage without a specific implementation surface, validation plan, and rollback plan.

## Sensitive operation inventory

Initial candidates that need explicit control decisions before runtime work:

| Surface | Examples | Control decision needed |
| --- | --- | --- |
| Auth and session flows | login, signup, password reset, password update | Rate limits and audit outcome model. |
| Organization administration | membership role changes, user activation/deactivation, permission changes | Audit events, actor/target model, and retention. |
| Billing checkout | `app/protected/configuracoes/billing-actions.ts` and checkout session creation | Rate limits, audit event on attempt/outcome, and Stripe metadata boundaries. |
| Finance mutations | create/update/delete/status transitions in expenses, payables, receivables, banks, categories, and people | Audit event categories and payload redaction. |
| Destructive actions | deletes and irreversible state transitions | Confirmation, audit event, retention, and recovery decision. |

## Rate limiting contract

Rate limiting must be planned before implementation.

Each implementation PR must define:

- operation key;
- actor identity;
- organization scope;
- route or Server Action boundary;
- limit window;
- threshold;
- response behavior;
- bypass policy for internal/admin flows;
- rollback strategy.

Rate limiting must be enforced server-side. Client-only throttling is not a GAP-015 control.

## Sensitive-action audit logging contract

Audit logging must be planned before implementation.

Each audit event design must define:

- event id;
- occurred at;
- actor user id;
- organization id;
- action;
- target type;
- target id;
- outcome;
- request id or correlation id;
- safe metadata;
- redaction rules.

Audit logs must not store secrets, raw tokens, Stripe secrets, full financial payloads, or unnecessary personal data. Before/after values may only be stored as a minimal summary when the implementation PR explicitly justifies the retention and redaction model.

## Data retention contract

Retention policy must be planned before implementation.

Each retention PR must define:

- data class;
- retention period;
- deletion or anonymization behavior;
- legal/product owner decision;
- user-visible expectation;
- backup/restore implication;
- audit event for retention actions;
- rollback or recovery path.

Destructive retention work must not be bundled with unrelated runtime, RLS, billing, or UI changes.

## Sequencing

GAP-015 should move in this order:

1. Create planning issues for rate limits, audit events, and retention policy.
2. Define the audit event schema and redaction model using `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`, `supabase/migrations/040_audit_events_schema.sql`, and `supabase/migrations/041_audit_events_write_boundary.sql` via `record_audit_event`.
3. Implement rate limits for one server boundary at a time using `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`.
4. Add audit logging for one sensitive operation family at a time.
5. Define retention policy before any destructive cleanup automation using `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`.

## Non-goals

This contract does not implement:

- rate limiting runtime;
- finance audit event runtime logging;
- retention jobs;
- billing webhook or portal behavior;
- commercial enforcement;
- new UI flows;
- broad E2E coverage.

## Acceptance

A future PR can claim progress on GAP-015 only when it:

- references this contract;
- references `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md` when changing audit event behavior;
- references `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md` when changing rate limit behavior;
- references `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md` when changing data retention behavior;
- targets exactly one control family or one operation surface;
- includes focused tests or guards;
- documents validation and rollback;
- keeps docs, code, and guards aligned.
