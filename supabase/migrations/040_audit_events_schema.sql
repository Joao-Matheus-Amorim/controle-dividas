-- GAP-015 sensitive-action audit event storage.
-- Creates the audit_events table and read-side RLS only.
-- This migration intentionally does not add runtime logging, triggers, RPCs,
-- rate limiting, retention jobs, UI, billing behavior, or E2E coverage.

create extension if not exists "pgcrypto";

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_user_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  outcome text not null,
  request_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_action_format_check
    check (action ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  constraint audit_events_target_type_format_check
    check (target_type ~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$'),
  constraint audit_events_outcome_check
    check (outcome in ('success', 'denied', 'validation_error', 'failure')),
  constraint audit_events_metadata_object_check
    check (jsonb_typeof(metadata) = 'object')
);

comment on table public.audit_events is
  'GAP-015 sensitive-action audit event storage. Runtime logging is intentionally added in later PRs.';

comment on column public.audit_events.metadata is
  'Redacted JSON summary only. Do not store secrets, raw tokens, Stripe secrets, full financial payloads, free-form notes, or full before/after row snapshots.';

create index if not exists audit_events_organization_occurred_at_idx
  on public.audit_events(organization_id, occurred_at desc);

create index if not exists audit_events_actor_occurred_at_idx
  on public.audit_events(actor_user_id, occurred_at desc);

create index if not exists audit_events_action_occurred_at_idx
  on public.audit_events(action, occurred_at desc);

create index if not exists audit_events_target_idx
  on public.audit_events(target_type, target_id)
  where target_id is not null;

alter table public.audit_events enable row level security;

revoke all on public.audit_events from anon;
revoke all on public.audit_events from authenticated;

grant select on public.audit_events to authenticated;

drop policy if exists "audit_events_select_organization_admin" on public.audit_events;

create policy "audit_events_select_organization_admin"
on public.audit_events
for select
using (public.is_organization_admin(organization_id));
