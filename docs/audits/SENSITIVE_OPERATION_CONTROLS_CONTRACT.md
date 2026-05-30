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
Billing checkout rate limit runtime exists for billing.checkout.start.
Expense delete rate limit runtime exists for finance.expense.delete.
Payable delete rate limit runtime exists for finance.payable.delete.
Payable status rate limit runtime exists for finance.payable.status.update.
Receivable delete rate limit runtime exists for finance.receivable.delete.
Receivable status rate limit runtime exists for finance.receivable.status.update.
Bank delete rate limit runtime exists for finance.bank.delete.
Bank balance rate limit runtime exists for finance.bank.balance.update.
Category delete rate limit runtime exists for finance.category.delete.
Admin permission rate limit runtime exists for admin.permission.update and admin.feature_permission.update.
Admin user rate limit runtime exists for admin.user.create, admin.user.update, admin.user.auth_link.sync, admin.user.delete, and admin.user.status.update.
No data retention cleanup runtime.
Audit event retention preflight runtime exists for owner/admin-only organization-scoped `audit_events` older than 365 days, with no cleanup job and no destructive deletion.
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
| Organization administration | membership role changes, user activation/deactivation, permission changes | Admin permission and admin user audit/rate limit runtime exist; remaining organization administration work still needs retention decisions. |
| Billing checkout | `app/protected/configuracoes/billing-actions.ts` and checkout session creation | Billing checkout rate limit runtime exists; Stripe metadata boundaries and audit events are covered for this step. |
| Finance mutations | create/update/delete/status transitions in expenses, payables, receivables, banks, categories, and people | Audit event categories and payload redaction. Expense delete, payable delete, payable status update, receivable delete, receivable status update, bank delete, bank balance update, and category delete rate limit runtime exist for this step. |
| Destructive actions | deletes and irreversible state transitions | Confirmation, audit event, rate limit, retention, and recovery decision. |
| Audit event retention | `app/protected/configuracoes/audit-retention-actions.ts` | Preflight-only count for owner/admin-only organization-scoped `audit_events` older than 365 days; no cleanup, anonymization, or destructive deletion exists. |

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

Rate limiting must be enforced server-side. Client-only throttling is not a GAP-015 control. The current runtime implementations are scoped to `billing.checkout.start`, `finance.expense.delete`, `finance.payable.delete`, `finance.payable.status.update`, `finance.receivable.delete`, `finance.receivable.status.update`, `finance.bank.delete`, `finance.bank.balance.update`, `finance.category.delete`, `admin.permission.update`, `admin.feature_permission.update`, `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete`, and `admin.user.status.update` and can be disabled with `DISABLE_SENSITIVE_RATE_LIMITS=true`.

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

Destructive retention work must not be bundled with unrelated runtime, RLS, billing, or UI changes. The current audit event retention preflight is read-only and does not implement cleanup or anonymization.

## Sequencing

GAP-015 should move in this order:

1. Create planning issues for rate limits, audit events, and retention policy.
2. Define the audit event schema and redaction model using `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`, `supabase/migrations/040_audit_events_schema.sql`, and `supabase/migrations/041_audit_events_write_boundary.sql` via `record_audit_event`.
3. Implement rate limits for one server boundary at a time using `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`; billing checkout, expense delete, payable delete, payable status update, receivable delete, receivable status update, bank delete, bank balance update, category delete, admin permission updates, and admin user lifecycle are the first runtime boundaries.
4. Add audit logging for one sensitive operation family at a time.
5. Define retention policy before any destructive cleanup automation using `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`.

## Non-goals

This contract does not implement:

- additional audit event runtime logging outside the documented covered families;
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
