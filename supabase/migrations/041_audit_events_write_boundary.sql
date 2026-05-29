-- GAP-015 sensitive-action audit event write boundary.
-- Adds an authenticated RPC for member-scoped audit event writes.
-- This migration intentionally does not wire runtime logging into app code,
-- rate limiting, retention jobs, UI, billing behavior, or E2E coverage.

create or replace function public.record_audit_event(
  p_organization_id uuid,
  p_action text,
  p_target_type text,
  p_target_id uuid,
  p_outcome text,
  p_request_id text,
  p_metadata jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid := auth.uid();
  sanitized_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
  new_audit_event_id uuid;
begin
  if current_auth_user_id is null then
    raise exception 'Authentication is required to record an audit event.';
  end if;

  if p_organization_id is null then
    raise exception 'Organization scope is required to record an audit event.';
  end if;

  if not public.is_organization_member(p_organization_id) then
    raise exception 'Organization membership is required to record an audit event.';
  end if;

  if nullif(trim(p_action), '') is null or p_action !~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$' then
    raise exception 'Audit event action must be a stable operation key.';
  end if;

  if nullif(trim(p_target_type), '') is null or p_target_type !~ '^[a-z0-9]+(?:[._-][a-z0-9]+)*$' then
    raise exception 'Audit event target_type must be a stable target key.';
  end if;

  if p_outcome not in ('success', 'denied', 'validation_error', 'failure') then
    raise exception 'Audit event outcome is invalid.';
  end if;

  if jsonb_typeof(sanitized_metadata) <> 'object' then
    raise exception 'Audit event metadata must be a redacted JSON object.';
  end if;

  if sanitized_metadata::text ~* '(password|token|secret|service_role|stripe_secret|raw_payload|full_payload|before|after|notes)' then
    raise exception 'Audit event metadata contains forbidden sensitive keys.';
  end if;

  insert into public.audit_events (
    actor_user_id,
    organization_id,
    action,
    target_type,
    target_id,
    outcome,
    request_id,
    metadata
  ) values (
    current_auth_user_id,
    p_organization_id,
    trim(p_action),
    trim(p_target_type),
    p_target_id,
    p_outcome,
    nullif(trim(p_request_id), ''),
    sanitized_metadata
  )
  returning id into new_audit_event_id;

  return new_audit_event_id;
end;
$$;

comment on function public.record_audit_event(uuid, text, text, uuid, text, text, jsonb) is
  'GAP-015 authenticated member-scoped write boundary for redacted audit events. Runtime logging is wired in later PRs.';

revoke all on function public.record_audit_event(uuid, text, text, uuid, text, text, jsonb) from public;
revoke all on function public.record_audit_event(uuid, text, text, uuid, text, text, jsonb) from anon;
grant execute on function public.record_audit_event(uuid, text, text, uuid, text, text, jsonb) to authenticated;
