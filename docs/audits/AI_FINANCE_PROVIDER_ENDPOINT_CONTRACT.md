# AI Finance Provider Endpoint Contract

> Status DocDoc: Atual
> Uso atual: contrato do provider/modelo runtime e endpoint model-backed da IA
> financeira. Provider runtime implementado (OpenRouter), rate limit in-memory,
> auditoria integrada, endpoint `/api/ai/chat` para perguntas e rascunhos
> review-only com memoria curta.
> `/api/ai` continua como endpoint read-only inicial com tools financeiras.
> Roadmap vivo da feature completa: `docs/audits/AI_COPILOT_ROADMAP.md`.

## Objetivo

Definir a fronteira minima antes de qualquer chamada real a modelo para o
GAP-020.

O runtime com provider produz respostas para perguntas financeiras e rascunhos
review-only. Escrita continua exclusiva por Server Actions existentes com
validacao final.

Estado runtime separado:
- `/api/ai`: endpoint read-only para consultas financeiras guardadas
  (`getDashboardSummary`, `getUpcomingBills`, `getCategorySpendingSummary`,
  `getMemberLimitsSummary`). Nao chama modelo, nao gera rascunho com provider.
- `/api/ai/chat`: endpoint model-backed para responder perguntas naturais,
  manter memoria curta da conversa, retornar rascunhos revisaveis e operar com
  provider, rate limit, auditoria e classificacao de intent.

## Pre-condicoes obrigatorias (aplicadas)

- `lib/finance/ai-finance-intake-runtime.ts`: boundary server-only mantida.
- `components/finance/assisted-draft-review-boundary.tsx`: boundary UI mantida.
- `docs/audits/AI_FINANCE_INTAKE_CONTRACT.md`: contrato de intents vigente.
- `lib/ai/provider/`: abstracao de provider com OpenRouter e factory.
- `lib/ai/rate-limiter.ts`: rate limit in-memory por organizacao.
- `lib/ai/audit.ts`: auditoria integrada via `ai_actions`.
- `ENABLE_AI_FINANCE_PROVIDER`: feature flag server-side para rollback.

## Provider e configuracao

O provider deve ser escolhido em PR dedicado e documentado antes de runtime.

Estado atual:

- `lib/finance/ai-finance-provider-config.ts` define a fronteira de
  configuracao provider para runtime.
- O helper nao usa `import "server-only"` para manter compatibilidade com
  Vitest/Vite nos testes unitarios.
- `ENABLE_AI_FINANCE_PROVIDER` controla se o provider esta habilitado.
- Quando `ENABLE_AI_FINANCE_PROVIDER` estiver desativado, o app permanece
  funcional sem dependencia de env vars de IA.
- Quando `ENABLE_AI_FINANCE_PROVIDER=true`, o helper exige:
  - `AI_PROVIDER` (fallback: `AI_FINANCE_PROVIDER`);
  - `AI_MODEL` (fallback: `OPENROUTER_MODEL`);
  - `AI_API_KEY` (fallback: `OPENROUTER_API_KEY`).
  - A chave de API deve ser fornecida via `AI_API_KEY` ou `OPENROUTER_API_KEY`.
- Em runtime parecido com producao (`NODE_ENV=production` ou
  `APP_ENV=production`), faltas de env vars obrigatorias disparam fail-fast.
- Provider atual: OpenRouter via `lib/ai/provider/openrouter.ts`.
- Factory: `lib/ai/provider/factory.ts` usa o config boundary.
- Estrutura para trocar para OpenAI: criar `lib/ai/provider/openai.ts` e
  registrar em `providerMap` na factory; nenhuma mudanca no pipeline necessario.
- Rollback por feature flag server-side: `ENABLE_AI_FINANCE_PROVIDER`.

Regras obrigatorias:

- nenhuma dependencia de provider pode entrar sem guard de dependencia;
- nenhuma chave pode ser lida no client;
- a ausencia de configuracao deve falhar fechado;
- o provider configurado deve ser resolvido apenas no servidor;
- logs, erros e respostas nao podem persistir texto bruto do usuario fora do
  contrato de retencao curta de `ai_conversations`.

Qualquer variavel de ambiente futura deve ter:

- nome documentado;
- escopo server-only;
- comportamento quando ausente;
- rollback;
- teste/guard de ausencia de vazamento para client bundle.

## Endpoint model-backed

Endpoint implementado: `/api/ai/chat` (POST).

Funcionamento:
- Aceita `text` e `organization_id` no corpo da requisicao.
- Autentica e autoriza via sessao Supabase e perfil da organizacao ativa.
- Classifica a intent com `classifyAiFinanceIntent` (deterministico, local).
- Se provider habilitado e configurado: chama o modelo com system prompt.
- Se provider desabilitado: retorna feedback local review-only.
- Mantem conversa curta em `ai_conversations` por organizacao/perfil, com
  `expires_at` de 24 horas e limpeza manual via `/api/ai/chat/clear`.
- Audita a chamada em `ai_actions` com resultado agregado.
- Rate limit: 20 requisicoes por minuto por organizacao.

Regras obrigatorias (implementadas):

- aceita perguntas e intents financeiras suportadas para rascunho review-only;
- resolve organizacao ativa e permissoes no servidor;
- nunca chama `createExpense`, `createPayableBill`, `createReceivableIncome`
  ou `createBankAccount`;
- nunca retorna dados que permitam salvamento direto;
- respeita feature flag `ENABLE_AI_FINANCE_PROVIDER` para rollback.

## Memoria curta e retencao

Implementado em `ai_conversations`:

- Escopo: `organization_id` + `profile_id` com unique constraint.
- Conteudo: ultimas mensagens do copiloto, `intent`, `collected_data` e estado
  de conclusao do rascunho.
- Retencao: `expires_at` default de 24 horas, renovado a cada interacao.
- Limpeza: conversas expiradas sao removidas no acesso; usuario pode limpar a
  conversa via `/api/ai/chat/clear`.
- Acesso runtime: escrita/limpeza server-side via service role apos validacao da
  organizacao ativa e perfil autenticado.

## Rate limit, audit e abuso

Implementado em `lib/ai/rate-limiter.ts`:

- Rate limit dedicado: 20 requisicoes por minuto por organizacao.
- Chave: `chat:{organization_id}:{user_id}`.
- Retorna `429` com `retryAfterMs` quando excedido.
- Auditoria registrada em `ai_actions` para tentativas com rate limit excedido.
- Rollback por `ENABLE_AI_FINANCE_PROVIDER` server-side.
- Auditoria registra apenas resultado agregado, sem prompt bruto do usuario.

## Prompt e resposta estruturada

O prompt runtime futuro deve:

- informar que a saida e review-only;
- passar apenas catalogos permitidos da organizacao ativa;
- pedir pergunta de esclarecimento quando faltar campo obrigatorio;
- proibir salvamento direto;
- proibir ids fora dos catalogos;
- retornar shape compativel com `validateAiFinanceIntakeDraft`.

Resposta invalida, JSON malformado, intent desconhecida ou ids fora do catalogo
devem virar erro revisavel, nao tentativa de correcao silenciosa com dados
inventados.

## Fora de escopo deste contrato

- criar embeddings;
- salvamento automatico.
