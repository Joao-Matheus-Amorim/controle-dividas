-- Migration: persist short-lived AI conversation state
-- Stores review-only copilot context with explicit retention and organization scope.

create table if not exists public.ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  intent text check (intent in ('gasto', 'conta_a_pagar', 'conta_a_receber', 'banco', 'pergunta')),
  messages jsonb not null default '[]'::jsonb,
  collected_data jsonb not null default '{}'::jsonb,
  is_complete boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null default (now() + interval '24 hours'),
  constraint ai_conversations_org_profile_unique unique (organization_id, profile_id),
  constraint ai_conversations_messages_array check (jsonb_typeof(messages) = 'array'),
  constraint ai_conversations_collected_data_object check (jsonb_typeof(collected_data) = 'object')
);

create index if not exists ai_conversations_organization_id_idx
  on public.ai_conversations(organization_id);

create index if not exists ai_conversations_profile_id_idx
  on public.ai_conversations(profile_id);

create index if not exists ai_conversations_expires_at_idx
  on public.ai_conversations(expires_at);

alter table public.ai_conversations enable row level security;

drop policy if exists "ai_conversations_service_role_all" on public.ai_conversations;
create policy "ai_conversations_service_role_all" on public.ai_conversations
for all to service_role
using (true)
with check (true);

drop policy if exists "ai_conversations_select_own_profile" on public.ai_conversations;
