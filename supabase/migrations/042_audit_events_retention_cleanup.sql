-- GAP-015 audit event retention cleanup boundary.
-- Adds an owner/admin-only RPC for deleting expired audit_events.
-- This migration intentionally does not add cron schedules, queue workers,
-- UI, billing behavior, RLS policy changes, or E2E coverage.

create or replace function public.cleanup_expired_audit_events(
  p_organization_id uuid,
  p_cutoff timestamptz
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to clean up audit events.';
  end if;

  if p_organization_id is null then
    raise exception 'Organization scope is required to clean up audit events.';
  end if;

  if p_cutoff is null then
    raise exception 'Retention cutoff is required to clean up audit events.';
  end if;

  if p_cutoff > now() - interval '365 days' then
    raise exception 'Retention cutoff must be at least 365 days old.';
  end if;

  if not public.is_organization_admin(p_organization_id) then
    raise exception 'Organization admin access is required to clean up audit events.';
  end if;

  delete from public.audit_events
  where organization_id = p_organization_id
    and occurred_at < p_cutoff;

  get diagnostics deleted_count = row_count;

  return deleted_count;
end;
$$;

comment on function public.cleanup_expired_audit_events(uuid, timestamptz) is
  'GAP-015 owner/admin-only retention cleanup boundary for expired audit_events.';

revoke all on function public.cleanup_expired_audit_events(uuid, timestamptz) from public;
revoke all on function public.cleanup_expired_audit_events(uuid, timestamptz) from anon;
grant execute on function public.cleanup_expired_audit_events(uuid, timestamptz) to authenticated;
