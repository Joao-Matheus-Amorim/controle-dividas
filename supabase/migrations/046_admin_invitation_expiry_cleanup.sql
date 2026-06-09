-- GAP-007/GAP-014 admin invitation expiry cleanup boundary.
-- Adds the cron-safe RPC used to expire pending invitations after their
-- configured expiry timestamp. This migration intentionally does not remove
-- ADMIN_EMAIL, retire owner_id, add delivery providers, or change UI flows.

create or replace function public.expire_pending_organization_invitations(
  p_cutoff timestamptz default now()
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  expired_count integer := 0;
begin
  if p_cutoff is null then
    raise exception 'Invitation expiry cutoff is required.';
  end if;

  update public.organization_invitations
  set
    status = 'expired',
    updated_at = now()
  where status = 'pending'
    and expires_at <= p_cutoff;

  get diagnostics expired_count = row_count;

  return expired_count;
end;
$$;

comment on function public.expire_pending_organization_invitations(timestamptz) is
  'GAP-007/GAP-014 service-role cron cleanup for pending organization invitations whose expires_at cutoff has passed.';

revoke all on function public.expire_pending_organization_invitations(timestamptz) from public;
revoke all on function public.expire_pending_organization_invitations(timestamptz) from anon;
revoke all on function public.expire_pending_organization_invitations(timestamptz) from authenticated;
grant execute on function public.expire_pending_organization_invitations(timestamptz) to service_role;
