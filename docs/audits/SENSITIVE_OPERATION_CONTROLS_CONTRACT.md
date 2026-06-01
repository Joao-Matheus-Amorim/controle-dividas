# Sensitive Operation Controls Contract

GAP: GAP-015

> Status DocDoc: Atual
> Uso atual: contrato vigente para GAP-015, consolidando rate limits,
> sensitive-action audit runtime e retention.
> Observacao: se houver conflito, reconciliar com
> `docs/SAAS_GAP_REGISTER.md` e `docs/VALIDACAO_TECNICA.md` antes de abrir
> novo PR.

## Purpose

This document defines the planning contract for sensitive operation controls and tracks each focused runtime boundary as it lands.

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
Billing portal audit runtime exists via record_audit_event.
Billing portal runtime exists for billing.portal.start.
Admin permission audit runtime exists via record_audit_event.
Admin user audit runtime exists via record_audit_event.
Billing checkout rate limit runtime exists for billing.checkout.start.
Billing portal rate limit runtime exists for billing.portal.start.
Login rate limit runtime exists for auth.login.password with no auth audit runtime.
Signup authorized email rate limit runtime exists for auth.signup.authorized_email.check with no auth audit runtime.
Signup submit rate limit runtime exists for auth.signup.submit with no auth audit runtime.
Auth confirm rate limit runtime exists for auth.confirm.verify with no auth audit runtime.
Password reset rate limit runtime exists for auth.password_reset.request with no auth audit runtime.
Password update rate limit runtime exists for auth.password_update.submit with no auth audit runtime.
Onboarding organization rate limit runtime exists for onboarding.organization.create with no onboarding audit runtime.
Expense delete rate limit runtime exists for finance.expense.delete.
Expense write audit runtime exists for finance.expense.create and finance.expense.update.
Expense write rate limit runtime exists for finance.expense.create and finance.expense.update.
Payable delete rate limit runtime exists for finance.payable.delete.
Payable status rate limit runtime exists for finance.payable.status.update.
Payable write audit runtime exists for finance.payable.create and finance.payable.update.
Payable write rate limit runtime exists for finance.payable.create and finance.payable.update.
Receivable delete rate limit runtime exists for finance.receivable.delete.
Receivable status rate limit runtime exists for finance.receivable.status.update.
Receivable write audit runtime exists for finance.receivable.create and finance.receivable.update.
Receivable write rate limit runtime exists for finance.receivable.create and finance.receivable.update.
Bank delete rate limit runtime exists for finance.bank.delete.
Bank balance rate limit runtime exists for finance.bank.balance.update.
Bank write audit runtime exists for finance.bank.create and finance.bank.update.
Bank write rate limit runtime exists for finance.bank.create and finance.bank.update.
Member limit audit runtime exists for finance.member.limit.update.
Member status audit runtime exists for finance.member.status.update.
Member write audit runtime exists for finance.member.create and finance.member.update.
Category write audit runtime exists for finance.category.create and finance.category.update.
Member limit rate limit runtime exists for finance.member.limit.update.
Member status rate limit runtime exists for finance.member.status.update.
Member write rate limit runtime exists for finance.member.create and finance.member.update.
Category delete rate limit runtime exists for finance.category.delete.
Category write rate limit runtime exists for finance.category.create and finance.category.update.
Admin permission rate limit runtime exists for admin.permission.update and admin.feature_permission.update.
Admin user rate limit runtime exists for admin.user.create, admin.user.update, admin.user.auth_link.sync, admin.user.delete, and admin.user.status.update.
Audit event retention cleanup runtime exists for confirmed owner/admin-only cleanup of expired audit_events through cleanup_expired_audit_events.
Audit event retention preflight runtime exists for owner/admin-only organization-scoped `audit_events` older than 365 days, with confirmed cleanup runtime and no cleanup job.
No UI change.
No billing webhook, subscription sync, or commercial enforcement change.
No E2E change.
```

Remaining broader runtime controls are not implemented yet. This document exists to prevent later PRs from claiming GAP-015 runtime coverage without a specific implementation surface, validation plan, and rollback plan.

## Sensitive operation inventory

Initial candidates that need explicit control decisions before runtime work:

| Surface | Examples | Control decision needed |
| --- | --- | --- |
| Auth and session flows | login, signup, password reset, password update | Login password, signup authorized email, signup submit, auth confirm, password reset request, and password update rate limit runtime exist for public auth entry/recovery; remaining auth/session flows still need rate limits and audit outcome model. |
| Initial organization onboarding | `app/onboarding/organizacao/actions.ts` and `create_initial_organization_onboarding` | Onboarding organization rate limit runtime exists for `onboarding.organization.create`; no onboarding audit runtime exists because the organization context is created by this boundary. |
| Organization administration | membership role changes, user activation/deactivation, permission changes | Admin permission and admin user audit/rate limit runtime exist; remaining organization administration work still needs retention decisions. |
| Billing checkout and portal | `app/protected/configuracoes/billing-actions.ts`, checkout session creation, and portal session creation | Billing checkout and billing portal rate limit runtime exists; Stripe metadata/customer boundaries and audit events are covered for these steps. |
| Finance mutations | create/update/delete/status transitions in expenses, payables, receivables, banks, categories, and people | Audit event categories and payload redaction. Expense delete, expense write, payable delete, payable status update, payable write, receivable delete, receivable status update, receivable write, bank delete, bank balance update, bank write, member limit update, member status update, member write, category delete, and category write rate limit runtime exist for this step. |
| Destructive actions | deletes and irreversible state transitions | Confirmation, audit event, rate limit, retention, and recovery decision. |
| Audit event retention | `app/protected/configuracoes/audit-retention-actions.ts` and `supabase/migrations/042_audit_events_retention_cleanup.sql` | Owner/admin-only preflight and confirmed cleanup through `cleanup_expired_audit_events` for organization-scoped `audit_events` older than 365 days; no anonymization or cleanup job exists. |

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

Rate limiting must be enforced server-side. Client-only throttling is not a GAP-015 control. The current runtime implementations are scoped to `billing.checkout.start`, `billing.portal.start`, `auth.login.password`, `auth.signup.authorized_email.check`, `auth.signup.submit`, `auth.confirm.verify`, `auth.password_reset.request`, `auth.password_update.submit`, `onboarding.organization.create`, `finance.expense.delete`, `finance.expense.create`, `finance.expense.update`, `finance.payable.delete`, `finance.payable.status.update`, `finance.payable.create`, `finance.payable.update`, `finance.receivable.delete`, `finance.receivable.status.update`, `finance.receivable.create`, `finance.receivable.update`, `finance.bank.delete`, `finance.bank.balance.update`, `finance.bank.create`, `finance.bank.update`, `finance.member.limit.update`, `finance.member.status.update`, `finance.member.create`, `finance.member.update`, `finance.category.delete`, `finance.category.create`, `finance.category.update`, `admin.permission.update`, `admin.feature_permission.update`, `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete`, and `admin.user.status.update` and can be disabled with `DISABLE_SENSITIVE_RATE_LIMITS=true`.

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

Destructive retention work must not be bundled with unrelated runtime, RLS, billing, or UI changes. The current audit event retention cleanup is limited to confirmed owner/admin-only `audit_events` cleanup and does not implement anonymization or cleanup jobs.

## Sequencing

GAP-015 should move in this order:

1. Create planning issues for rate limits, audit events, and retention policy.
2. Define the audit event schema and redaction model using `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`, `supabase/migrations/040_audit_events_schema.sql`, and `supabase/migrations/041_audit_events_write_boundary.sql` via `record_audit_event`.
3. Implement rate limits for one server boundary at a time using `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`; billing checkout, billing portal, expense delete, expense write, payable delete, payable status update, payable write, receivable delete, receivable status update, receivable write, bank delete, bank balance update, bank write, member limit update, member status update, member write, category delete, category write, admin permission updates, and admin user lifecycle are the first runtime boundaries.
4. Add audit logging for one sensitive operation family at a time.
5. Define retention policy before any destructive cleanup automation using `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`; audit_events now have the first confirmed owner/admin-only cleanup boundary.

## Non-goals

This contract does not implement:

- additional audit event runtime logging outside the documented covered families;
- retention jobs;
- billing webhook behavior;
- subscription sync;
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
