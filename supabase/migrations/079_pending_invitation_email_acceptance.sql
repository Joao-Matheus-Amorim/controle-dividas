create or replace function public.get_pending_organization_invitations_for_current_email()
returns table (
  invitation_id uuid,
  organization_id uuid,
  organization_slug text,
  organization_name text,
  role text,
  expires_at timestamptz,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
begin
  if current_auth_user_id is null or current_email = '' then
    return;
  end if;

  return query
  select
    invitation.id,
    invitation.organization_id,
    organization.slug,
    organization.name,
    invitation.role,
    invitation.expires_at,
    invitation.created_at
  from public.organization_invitations invitation
  join public.organizations organization
    on organization.id = invitation.organization_id
  where invitation.invited_email_normalized = current_email
    and invitation.status = 'pending'
    and invitation.expires_at > now()
  order by invitation.created_at desc;
end;
$$;

create or replace function public.accept_organization_invitation_by_id(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  invitation_record public.organization_invitations%rowtype;
  profile_record_id uuid;
  organization_slug text;
  organization_owner_auth_user_id uuid;
  profile_created boolean := false;
begin
  if current_auth_user_id is null then
    return jsonb_build_object('status', 'unauthenticated');
  end if;

  if p_invitation_id is null then
    return jsonb_build_object('status', 'missing_invitation');
  end if;

  select *
    into invitation_record
  from public.organization_invitations
  where id = p_invitation_id
  for update;

  if invitation_record.id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  select slug, owner_auth_user_id
    into organization_slug, organization_owner_auth_user_id
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

  update public.profiles
  set
    organization_id = invitation_record.organization_id,
    auth_user_id = current_auth_user_id,
    role = case
      when invitation_record.role = 'member' then 'user'
      else invitation_record.role
    end,
    is_active = true,
    updated_at = now()
  where (
      (
        organization_id = invitation_record.organization_id
        and lower(trim(coalesce(email, ''))) = invitation_record.invited_email_normalized
      )
      or (
        auth_user_id = current_auth_user_id
        and organization_id is null
      )
    )
    and (auth_user_id is null or auth_user_id = current_auth_user_id)
    and not exists (
      select 1
      from public.profiles existing_profile
      where existing_profile.auth_user_id = current_auth_user_id
        and existing_profile.id <> public.profiles.id
    )
  returning id into profile_record_id;

  if profile_record_id is null then
    insert into public.profiles (
      owner_id,
      auth_user_id,
      organization_id,
      name,
      email,
      role,
      is_active
    )
    values (
      organization_owner_auth_user_id,
      current_auth_user_id,
      invitation_record.organization_id,
      coalesce(nullif(split_part(invitation_record.invited_email_normalized, '@', 1), ''), 'Usuario'),
      invitation_record.invited_email_normalized,
      case
        when invitation_record.role = 'member' then 'user'
        else invitation_record.role
      end,
      true
    )
    returning id into profile_record_id;

    profile_created := true;
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
    'profile_linked', profile_record_id is not null,
    'profile_created', profile_created
  );
end;
$$;

revoke all on function public.get_pending_organization_invitations_for_current_email() from public;
revoke all on function public.accept_organization_invitation_by_id(uuid) from public;
grant execute on function public.get_pending_organization_invitations_for_current_email() to authenticated;
grant execute on function public.accept_organization_invitation_by_id(uuid) to authenticated;
