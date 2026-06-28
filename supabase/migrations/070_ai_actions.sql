-- Migration: create ai_actions table for AI action logging

create table public.ai_actions (
  id uuid primary key default uuid_generate_v4(),
  action text not null,
  payload jsonb not null,
  result jsonb,
  success boolean not null default true,
  organization_id uuid not null references public.organizations(id),
  created_by uuid not null references public.profiles(id),
  created_at timestamp with time zone default now()
);

-- RLS policies
alter table public.ai_actions enable row level security;

create policy "ai_actions_service_role_insert" on public.ai_actions
for insert to service_role
with check (true);

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
