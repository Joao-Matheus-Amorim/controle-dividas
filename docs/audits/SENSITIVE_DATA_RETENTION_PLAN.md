# Sensitive Data Retention Plan

GAP: GAP-015

## Purpose

This document defines the planning contract for sensitive data retention before any cleanup automation, anonymization, or destructive deletion exists.

It follows:

- `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`
- `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`
- `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`

## Current status

```txt
Audit event retention preflight runtime exists.
Audit events use a 365-day candidate retention cutoff for preflight counting only.
No retention cleanup runtime.
No cleanup job.
No anonymization job.
No destructive deletion.
No schema change.
No RLS change.
No UI change.
No billing behavior change.
No E2E change.
```

Data retention cleanup controls are not implemented yet. The current runtime only counts organization-scoped `audit_events` older than the candidate cutoff in `app/protected/configuracoes/audit-retention-actions.ts`.

## Data classes

Future retention work must classify data before any runtime change:

| Data class | Examples | Initial posture |
| --- | --- | --- |
| Auth identity | user id, email references, session-related metadata | Keep only through provider-supported flows and product/legal decision. |
| Organization membership | membership roles, active status, organization ownership | Retain while organization exists; deletion needs ownership transfer/closure decision. |
| Financial records | expenses, payable bills, receivable incomes, banks, categories, family members | User-owned financial history; no automatic deletion until product policy exists. |
| Billing references | plan, Stripe customer id, checkout/session references | Keep minimal references needed for billing support and reconciliation. |
| Audit events | sensitive-action event summaries | Preflight counts owner/admin-only organization-scoped events older than 365 days; no cleanup or anonymization exists yet. |
| Operational evidence | gated test artifacts, CI summaries, docs evidence | Retain as repo/CI evidence; do not mix with user data retention. |

## Required decisions

Every future retention implementation must define:

- data class;
- legal/product owner decision;
- retention period;
- deletion, anonymization, or archival behavior;
- actor authorized to trigger the action;
- organization scope;
- audit event emitted for the action;
- user-visible expectation;
- backup/restore implication;
- rollback or recovery path.

No retention cleanup runtime should be added until these decisions are documented for the specific data class.

## Destructive action rules

Retention work that deletes or anonymizes data must:

- be isolated in its own PR;
- avoid bundling with RLS, billing, UI redesign, or broad refactors;
- use server-resolved organization scope;
- avoid trusting `organization_id` supplied by the client;
- define dry-run or preview behavior where feasible;
- define recovery limits clearly;
- emit an audit event after audit event storage exists.

## Candidate retention policies

These are planning candidates, not active policies:

| Candidate | Notes |
| --- | --- |
| Soft-deleted operational entities | Decide whether soft delete is needed before physical deletion. |
| Audit events | Candidate retention window must balance accountability and privacy. |
| Closed organizations | Requires ownership, billing, export, and legal decision before cleanup. |
| Inactive members | Must preserve financial record references unless an anonymization policy exists. |
| Billing metadata | Must not delete data required for Stripe reconciliation or support. |

## Non-goals

This plan does not implement:

- retention jobs;
- cron schedules;
- queue workers;
- anonymization runtime;
- destructive delete flows;
- export flows;
- schema changes;
- RLS changes;
- billing cancellation or portal behavior;
- UI changes;
- E2E coverage.

## Sequencing

Data retention should move in this order:

1. Decide product/legal retention policy per data class.
2. Define audit event storage before destructive retention actions.
3. Add dry-run/preflight query for one data class. Audit event retention preflight now exists for `audit_events` with a 365-day cutoff.
4. Add runtime cleanup or anonymization for one data class.
5. Add focused tests and rollback instructions.
6. Update live docs and gap register only after implementation evidence.

## Acceptance

A future retention PR must:

- reference this plan;
- target one data class only;
- document the retention period and deletion/anonymization behavior;
- prove organization scope is resolved server-side;
- include audit event behavior when audit storage exists;
- include rollback or recovery notes;
- update `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.
