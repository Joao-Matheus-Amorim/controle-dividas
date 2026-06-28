-- Migration: create ai_actions table for AI action logging
-- Idempotent: handles pre-existing table from manual creation.

create table if not exists public.ai_actions (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  payload jsonb not null,
  result jsonb,
  success boolean not null default true,
  organization_id uuid not null references public.organizations(id),
  created_by uuid references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- Ensure created_by is NOT NULL (clean up any null rows first)
delete from public.ai_actions where created_by is null;
alter table public.ai_actions alter column created_by set not null;

-- RLS policies
alter table public.ai_actions enable row level security;

drop policy if exists "ai_actions_service_role_insert" on public.ai_actions;
create policy "ai_actions_service_role_insert" on public.ai_actions
for insert to service_role
with check (true);

drop policy if exists "ai_actions_select_organization_members" on public.ai_actions;
drop policy if exists "Allow select by organization" on public.ai_actions;
drop policy if exists "Allow service_role insert" on public.ai_actions;
create policy "ai_actions_select_organization_members" on public.ai_actions
for select to authenticated
using (
  exists (
    select 1
    from public.profiles profile
    where profile.id = ai_actions.created_by
      and profile.organization_id = ai_actions.organization_id
      and profile.auth_user_id = auth.uid()
  )
);
