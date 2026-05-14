-- FamilyFinance Admin familiar, profiles e permissoes por modulo/acao

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  linked_family_member_id uuid references public.family_members(id) on delete set null,
  name text not null,
  email text,
  role text not null default 'user' check (role in ('admin', 'user')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_module_permissions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  module text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(profile_id, module)
);

create index if not exists profiles_auth_user_id_idx on public.profiles(auth_user_id);
create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists permissions_owner_id_idx on public.user_module_permissions(owner_id);
create index if not exists permissions_profile_module_idx on public.user_module_permissions(profile_id, module);

alter table public.profiles enable row level security;
alter table public.user_module_permissions enable row level security;

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = auth_user_id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = auth_user_id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = auth_user_id)
with check (auth.uid() = auth_user_id);

create policy "permissions_select_owner"
on public.user_module_permissions
for select
using (owner_id = auth.uid());

create policy "permissions_insert_owner"
on public.user_module_permissions
for insert
with check (owner_id = auth.uid());

create policy "permissions_update_owner"
on public.user_module_permissions
for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
