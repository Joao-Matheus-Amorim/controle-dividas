-- Migration: allow acao_pagamento in ai_conversations intent check constraint
-- ConversationIntent type includes "acao_pagamento", but the DB constraint didn't.

alter table if exists public.ai_conversations
  drop constraint if exists ai_conversations_intent_check;

alter table if exists public.ai_conversations
  add constraint ai_conversations_intent_check
  check (intent in ('gasto', 'conta_a_pagar', 'conta_a_receber', 'banco', 'acao_pagamento', 'pergunta'));
