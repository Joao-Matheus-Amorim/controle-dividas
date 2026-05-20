-- FamilyFinance SaaS multi-tenant onboarding
-- Creates the initial organization, owner membership, and owner profile
-- in one database transaction through an authenticated RPC.
--
-- Security notes:
-- - The function requires auth.uid().
-- - The function is SECURITY DEFINER with a fixed search_path.
-- - Execute is granted only to authenticated.
-- - RLS policies are not relaxed by this migration.
-- - The function does not create second active memberships during the
--   transitional one-active-membership-per-user phase.

create or replace function public.create_initial_organization_onboarding(
  p_name text,
  p_slug text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_auth_user_id uuid := auth.uid();
  current_email text := nullif(auth.jwt() ->> 'email', '');
  profile_record record;
  new_organization_id uuid;
begin
  if current_auth_user_id is null then
    raise exception 'Faça login para continuar o onboarding.';
  end if;

  if nullif(trim(p_name), '') is null then
    raise exception 'Informe o nome da organização.';
  end if;

  if length(trim(p_name)) < 3 then
    raise exception 'O nome da organização deve ter pelo menos 3 caracteres.';
  end if;

  if nullif(trim(p_slug), '') is null then
    raise exception 'Informe um slug válido para a organização.';
  end if;

  if p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Use apenas letras minúsculas, números e hífens no slug.';
  end if;

  select p.id, p.is_active, p.organization_id
    into profile_record
  from public.profiles p
  where p.auth_user_id = current_auth_user_id
  limit 1;

  if profile_record.id is not null and profile_record.is_active is not true then
    raise exception 'Seu perfil está inativo.';
  end if;

  if profile_record.id is not null and profile_record.organization_id is not null then
    raise exception 'Seu perfil já está vinculado a uma organização. Peça ao suporte para revisar seu acesso.';
  end if;

  if exists (
    select 1
    from public.organization_memberships m
    where m.auth_user_id = current_auth_user_id
      and m.is_active = true
  ) then
    raise exception 'Você já possui uma organização ativa.';
  end if;

  if exists (
    select 1
    from public.organizations o
    where o.slug = p_slug
  ) then
    raise exception 'Este slug já está em uso.';
  end if;

  insert into public.organizations (
    slug,
    name,
    owner_auth_user_id,
    plan,
    status
  ) values (
    p_slug,
    trim(p_name),
    current_auth_user_id,
    'free',
    'active'
  )
  returning id into new_organization_id;

  insert into public.organization_memberships (
    organization_id,
    auth_user_id,
    role,
    is_active
  ) values (
    new_organization_id,
    current_auth_user_id,
    'owner',
    true
  );

  if profile_record.id is null then
    insert into public.profiles (
      owner_id,
      auth_user_id,
      organization_id,
      name,
      email,
      role,
      is_active
    ) values (
      current_auth_user_id,
      current_auth_user_id,
      new_organization_id,
      coalesce(nullif(split_part(coalesce(current_email, ''), '@', 1), ''), 'Usuario'),
      current_email,
      'admin',
      true
    );
  else
    update public.profiles
    set
      organization_id = new_organization_id,
      role = 'admin',
      updated_at = now()
    where id = profile_record.id
      and auth_user_id = current_auth_user_id
      and organization_id is null
      and is_active = true;

    if not found then
      raise exception 'Não foi possível vincular seu perfil à organização.';
    end if;
  end if;

  return new_organization_id;
exception
  when unique_violation then
    if sqlerrm ilike '%organizations_slug%' or sqlerrm ilike '%organizations_slug_key%' then
      raise exception 'Este slug já está em uso.';
    end if;

    if sqlerrm ilike '%organization_memberships_one_active_per_user_idx%' then
      raise exception 'Você já possui uma organização ativa.';
    end if;

    if sqlerrm ilike '%profiles_auth_user_id%' then
      raise exception 'Seu perfil já foi criado. Tente novamente.';
    end if;

    raise;
end;
$$;

revoke all on function public.create_initial_organization_onboarding(text, text) from public;
revoke all on function public.create_initial_organization_onboarding(text, text) from anon;
grant execute on function public.create_initial_organization_onboarding(text, text) to authenticated;
