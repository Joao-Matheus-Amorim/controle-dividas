-- FamilyFinance - permissoes avancadas por escopo e funcionalidades
-- Esta migration amplia o modelo existente sem quebrar os dados atuais.

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('admin', 'adult', 'child', 'custom', 'user'));

alter table public.user_module_permissions
  add column if not exists scope text not null default 'own'
  check (scope in ('own', 'selected', 'family'));

alter table public.user_module_permissions
  add column if not exists allowed_member_ids uuid[] not null default '{}';

create table if not exists public.user_feature_permissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  feature_key text not null,
  is_enabled boolean not null default false,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, feature_key)
);

create index if not exists permissions_scope_idx on public.user_module_permissions(scope);
create index if not exists feature_permissions_owner_id_idx on public.user_feature_permissions(owner_id);
create index if not exists feature_permissions_profile_key_idx on public.user_feature_permissions(profile_id, feature_key);

alter table public.user_feature_permissions enable row level security;

create policy "feature_permissions_select_family"
on public.user_feature_permissions
for select
using (owner_id = auth.uid());

create policy "feature_permissions_insert_family"
on public.user_feature_permissions
for insert
with check (owner_id = auth.uid());

create policy "feature_permissions_update_family"
on public.user_feature_permissions
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

create policy "feature_permissions_delete_family"
on public.user_feature_permissions
for delete
using (owner_id = auth.uid());