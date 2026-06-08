-- GAP-014 admin invitation acceptance runtime boundary.
-- Accepts a pending invitation in one database transaction.
-- This migration intentionally does not add UI, email delivery, cron expiry,
-- ADMIN_EMAIL removal, owner_id retirement, or service-role client exposure.

create extension if not exists "pgcrypto";

create or replace function public.accept_organization_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  normalized_token text := trim(coalesce(p_token, ''));
  hashed_token text;
  invitation_record public.organization_invitations%rowtype;
  profile_record_id uuid;
  organization_slug text;
begin
  if current_auth_user_id is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  if normalized_token = '' then
    return jsonb_build_object('status', 'missing_token');
  end if;

  hashed_token := encode(digest(normalized_token, 'sha256'), 'hex');

  select *
    into invitation_record
  from public.organization_invitations
  where token_hash = hashed_token
  for update;

  if invitation_record.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select slug
    into organization_slug
  from public.organizations
  where id = invitation_record.organization_id;

  if invitation_record.status <> 'pending' then
    return jsonb_build_object(
      'status', invitation_record.status,
      'organization_id', invitation_record.organization_id,
      'organization_slug', organization_slug,
      'invitation_id', invitation_record.id
    );
  end if;

  if invitation_record.expires_at <= now() then
    update public.organization_invitations
    set
      status = 'expired',
      updated_at = now()
    where id = invitation_record.id;

    return jsonb_build_object(
      'status', 'expired',
      'organization_id', invitation_record.organization_id,
      'organization_slug', organization_slug,
      'invitation_id', invitation_record.id
    );
  end if;

  if current_email = '' or current_email <> invitation_record.invited_email_normalized then
    return jsonb_build_object(
      'status', 'email_mismatch',
      'organization_id', invitation_record.organization_id,
      'organization_slug', organization_slug,
      'invitation_id', invitation_record.id
    );
  end if;

  insert into public.organization_memberships (
    organization_id,
    auth_user_id,
    role,
    is_active,
    updated_at
  )
  values (
    invitation_record.organization_id,
    current_auth_user_id,
    invitation_record.role,
    true,
    now()
  )
  on conflict (organization_id, auth_user_id)
  do update set
    role = case
      when public.organization_memberships.role = 'owner' then public.organization_memberships.role
      else excluded.role
    end,
    is_active = true,
    updated_at = now();

  update public.profiles
  set
    auth_user_id = current_auth_user_id,
    updated_at = now()
  where organization_id = invitation_record.organization_id
    and lower(trim(coalesce(email, ''))) = invitation_record.invited_email_normalized
    and (auth_user_id is null or auth_user_id = current_auth_user_id)
    and not exists (
      select 1
      from public.profiles existing_profile
      where existing_profile.auth_user_id = current_auth_user_id
        and existing_profile.id <> public.profiles.id
    )
  returning id into profile_record_id;

  update public.organization_invitations
  set
    status = 'accepted',
    accepted_at = now(),
    invited_auth_user_id = current_auth_user_id,
    updated_at = now()
  where id = invitation_record.id;

  return jsonb_build_object(
    'status', 'accepted',
    'organization_id', invitation_record.organization_id,
    'organization_slug', organization_slug,
    'invitation_id', invitation_record.id,
    'role', invitation_record.role,
    'email_domain', split_part(invitation_record.invited_email_normalized, '@', 2),
    'profile_linked', profile_record_id is not null
  );
end;
$$;

comment on function public.accept_organization_invitation(text) is
  'Accepts a pending organization invitation using the authenticated user and a raw one-time token. Stores no raw token and resolves organization/profile linking server-side.';

revoke all on function public.accept_organization_invitation(text) from public;
grant execute on function public.accept_organization_invitation(text) to authenticated;
