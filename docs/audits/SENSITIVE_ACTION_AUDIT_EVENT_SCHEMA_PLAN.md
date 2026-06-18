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
Admin user audit runtime exists in app/protected/admin/actions.ts using record_audit_event.
Admin invitation audit runtime exists in app/protected/admin/invitation-actions.ts using record_audit_event.
Payable bill audit runtime exists in app/protected/contas-a-pagar/actions.ts using record_audit_event.
Payable write audit runtime exists in app/protected/contas-a-pagar/actions.ts using record_audit_event.
Receivable income audit runtime exists in app/protected/contas-a-receber/actions.ts using record_audit_event.
Receivable write audit runtime exists in app/protected/contas-a-receber/actions.ts using record_audit_event.
Expense audit runtime exists in app/protected/gastos/actions.ts using record_audit_event.
Expense write audit runtime exists in app/protected/gastos/actions.ts using record_audit_event.
Category delete audit runtime exists in app/protected/configuracoes/actions.ts using record_audit_event.
Category write audit runtime exists in app/protected/configuracoes/actions.ts using record_audit_event.
Bank audit runtime exists in app/protected/bancos/actions.ts using record_audit_event.
Bank write audit runtime exists in app/protected/bancos/actions.ts using record_audit_event.
Member limit audit runtime exists in lib/finance/member-limit-controls.ts, app/protected/configuracoes/actions.ts, and app/protected/pessoas/actions.ts using record_audit_event.
Member status audit runtime exists in lib/finance/member-status-controls.ts and app/protected/pessoas/actions.ts using record_audit_event.
Member write audit runtime exists in lib/finance/member-write-controls.ts and app/protected/pessoas/actions.ts using record_audit_event for `finance.member.create`, `finance.member.update`, and `finance.member.delete`.
Read-side RLS exists for organization owner/admin.
No insert/update/delete policy for authenticated users.
No UI.
No billing webhook, subscription sync, or commercial enforcement change.
No E2E change.
```

Audit event storage is versioned. Billing checkout, billing portal, admin permission, admin user, admin invitation create/revoke/resend/accept, payable bill, payable write, receivable income, receivable write, expense, expense write, category delete, category write, bank, bank write, member limit, member status, and member write audit logging are implemented. Other operation families remain pending.

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
| Billing portal | `billing.portal.start`, `billing.portal.failed` |
| Admin users | `admin.user.create`, `admin.user.update`, `admin.user.activate`, `admin.user.deactivate`, `admin.user.delete`, `admin.user.auth_link.sync` |
| Admin invitations | `admin.invitation.create`, `admin.invitation.revoke`, `admin.invitation.resend`, `admin.invitation.accept` |
| Permissions | `admin.permission.update`, `admin.feature_permission.update` |
| Finance deletes | `finance.expense.delete`, `finance.payable.delete`, `finance.receivable.delete`, `finance.bank.delete`, `finance.category.delete` |
| Finance expense writes | `finance.expense.create`, `finance.expense.update` |
| Finance payable writes | `finance.payable.create`, `finance.payable.update` |
| Finance receivable writes | `finance.receivable.create`, `finance.receivable.update` |
| Finance category writes | `finance.category.create`, `finance.category.update` |
| Finance bank writes | `finance.bank.create`, `finance.bank.update` |
| Finance status/balance/limit changes | `finance.payable.status.update`, `finance.receivable.status.update`, `finance.bank.balance.update`, `finance.member.limit.update`, `finance.member.status.update` |
| Finance member writes | `finance.member.create`, `finance.member.update`, `finance.member.delete` |
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
- Billing portal runtime calls `record_audit_event` for `billing.portal.start` session creation and `billing.portal.failed` setup failures.
- Admin permission runtime calls `record_audit_event` for module and feature permission updates.
- Admin user runtime calls `record_audit_event` for family access creation, update, auth link sync, activation/deactivation, and deletion.
- Admin invitation runtime calls `record_audit_event` for create, revoke, resend preparation, and successful accept without storing raw email addresses, invitation tokens, hashes, or links in metadata.
- Payable bill runtime calls `record_audit_event` for creation, update, status updates, and deletion without storing amounts, names, notes, or full payloads.
- Receivable income runtime calls `record_audit_event` for creation, update, status updates, and deletion without storing amounts, sources, banks, notes, or full payloads.
- Expense runtime calls `record_audit_event` for creation, update, and deletion without storing amounts, descriptions, locations, payment details, or notes.
- Category delete runtime calls `record_audit_event` for deletion.
- Category write runtime calls `record_audit_event` for category creation and update without storing names or descriptions.
- Bank runtime calls `record_audit_event` for creation, update, balance updates, and deletion without storing balances, bank names, notes, or full payloads.
- Member limit runtime calls `record_audit_event` for monthly limit updates without storing previous or next amounts.
- Member write runtime calls `record_audit_event` for family member creation, profile updates, and guarded deletion without storing names, roles, or financial amounts.

Runtime logging PRs must call the write boundary from one operation family at a time.

## Runtime sequencing

Audit logging should be added incrementally:

1. Keep `040_audit_events_schema.sql` as schema/read-side RLS only.
2. Keep `041_audit_events_write_boundary.sql` as the authenticated write boundary.
3. Billing checkout and billing portal audit runtime are wired through `record_audit_event`.
4. Admin permission audit runtime is wired through `record_audit_event`.
5. Admin user audit runtime is wired through `record_audit_event`.
6. Finance delete, status, bank balance, and category delete audit runtimes are wired through `record_audit_event`.
7. Member limit and member status audit runtimes are wired through `record_audit_event` without storing financial amounts or status before/after values.
8. Member write audit runtime is wired through `record_audit_event` without storing names, roles, or financial amounts.
9. Add any remaining operation family only after documenting its redaction model.

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
