-- GAP-007/GAP-014 admin invitation schema preflight.
-- Creates invitation storage and RLS boundaries only.
-- This migration intentionally does not add runtime actions, email delivery,
-- token generation, acceptance flows, cron expiry, UI, or ADMIN_EMAIL removal.

create extension if not exists "pgcrypto";

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invited_email_normalized text not null,
  invited_auth_user_id uuid references auth.users(id) on delete set null,
  invited_by_auth_user_id uuid not null references auth.users(id) on delete restrict,
  role text not null default 'member',
  status text not null default 'pending',
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_invitations_email_normalized_check
    check (
      invited_email_normalized = lower(trim(invited_email_normalized))
      and invited_email_normalized ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),
  constraint organization_invitations_role_check
    check (role in ('admin', 'adult', 'child', 'custom', 'member')),
  constraint organization_invitations_status_check
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  constraint organization_invitations_token_hash_check
    check (char_length(trim(token_hash)) >= 32),
  constraint organization_invitations_expiry_check
    check (expires_at > created_at),
  constraint organization_invitations_status_dates_check
    check (
      (status = 'accepted' and accepted_at is not null and revoked_at is null)
      or (status = 'revoked' and revoked_at is not null and accepted_at is null)
      or (status in ('pending', 'expired') and accepted_at is null and revoked_at is null)
    )
);

comment on table public.organization_invitations is
  'GAP-007/GAP-014 invitation schema preflight. Runtime invitation creation, delivery, acceptance, expiry, audit events, rate limits, and ADMIN_EMAIL removal are intentionally handled in later PRs.';

comment on column public.organization_invitations.invited_email_normalized is
  'Lowercase trimmed email used for invite lookup/linking. Do not treat email alone as admin authority.';

comment on column public.organization_invitations.token_hash is
  'Hash of the invitation token only. Raw invitation tokens must never be stored.';

create unique index if not exists organization_invitations_token_hash_idx
  on public.organization_invitations(token_hash);

create unique index if not exists organization_invitations_pending_email_idx
  on public.organization_invitations(organization_id, invited_email_normalized)
  where status = 'pending';

create index if not exists organization_invitations_org_status_expires_idx
  on public.organization_invitations(organization_id, status, expires_at);

create index if not exists organization_invitations_invited_email_idx
  on public.organization_invitations(invited_email_normalized);

create index if not exists organization_invitations_invited_auth_user_idx
  on public.organization_invitations(invited_auth_user_id)
  where invited_auth_user_id is not null;

create index if not exists organization_invitations_issuer_idx
  on public.organization_invitations(invited_by_auth_user_id, created_at desc);

alter table public.organization_invitations enable row level security;

revoke all on public.organization_invitations from anon;
revoke all on public.organization_invitations from authenticated;

grant select, insert, update on public.organization_invitations to authenticated;

drop policy if exists "organization_invitations_select_admin" on public.organization_invitations;
drop policy if exists "organization_invitations_insert_admin" on public.organization_invitations;
drop policy if exists "organization_invitations_update_admin" on public.organization_invitations;

create policy "organization_invitations_select_admin"
on public.organization_invitations
for select
using (public.is_organization_admin(organization_id));

create policy "organization_invitations_insert_admin"
on public.organization_invitations
for insert
with check (
  public.is_organization_admin(organization_id)
  and invited_by_auth_user_id = auth.uid()
  and status = 'pending'
  and accepted_at is null
  and revoked_at is null
);

create policy "organization_invitations_update_admin"
on public.organization_invitations
for update
using (public.is_organization_admin(organization_id))
with check (public.is_organization_admin(organization_id));
