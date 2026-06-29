# AI Copilot Roadmap

> Status DocDoc: Atual
> Uso atual: fonte viva para acompanhar a feature de IA financeira como
> copiloto review-only. Todo PR que conclui, reduz ou altera um bloco deste
> roadmap deve atualizar este documento no mesmo escopo.
> Este documento nao autoriza salvamento automatico, provider/modelo em
> producao, chat livre, embeddings ou escrita direta no banco.

## 1. Objetivo

Transformar a IA financeira em um copiloto operacional seguro para entrada
rapida, leitura contextual e insights financeiros, mantendo revisao humana antes
de qualquer gravacao.

O produto-alvo e um Copiloto Financeiro Review-Only:

- entende texto natural do usuario;
- classifica a intencao financeira;
- gera rascunhos revisaveis;
- responde perguntas sobre dados existentes quando o usuario tem permissao;
- sugere proximas acoes sem executa-las automaticamente;
- registra auditoria e respeita organizacao ativa, RLS e escopo de membros.

## 2. Estado Atual

| Area | Estado | Evidencia |
| --- | --- | --- |
| Rascunhos assistidos deterministicos | Implementado | `lib/finance/*-draft.ts` e `components/finance/assisted-draft-review-boundary.tsx` |
| Boundary review-only de intake | Implementado | `lib/finance/ai-finance-intake-runtime.ts` |
| Catalogos server-side por organizacao | Implementado | `lib/finance/ai-finance-intake-catalogs.ts` |
| Config fail-closed de provider futuro | Implementado como boundary pre-runtime | `lib/finance/ai-finance-provider-config.ts` |
| Endpoint `/api/ai` | Implementado como read-only inicial | `app/api/ai/route.ts` |
| Acoes `/api/ai` | Somente leitura | `getDashboardSummary`, `getUpcomingBills`, `getCategorySpendingSummary`, `getMemberLimitsSummary` |
| Auditoria de acoes de IA | Implementado | `ai_actions`, `lib/ai/audit.ts` |
| RLS de auditoria de IA | Implementado por autor | `supabase/migrations/070_ai_actions.sql` |
| Chat/copiloto UI | UI inicial implementada em PR | `components/ai/ai-command-bar.tsx`, `components/app/app-shell.tsx` |
| Classificador de intencao | Implementado em PR | `lib/finance/ai-finance-intent-classifier.ts` |
| Rascunho universal review-only | Implementado em PR | `lib/finance/ai-finance-universal-draft.ts` |
| Perguntas financeiras read-only | Expandido em PR | `getCategorySpendingSummary`, `getMemberLimitsSummary` em `lib/ai/tools/finance-tools.ts` |
| Insights no dashboard | Implementado em PR | `lib/finance/dashboard-insights.ts`, `components/dashboard/dashboard-ai-insights.tsx` |
| Provider/modelo real | Nao implementado | Pendente AI-07 |
| Salvamento automatico | Nao implementado e proibido | Invariante de seguranca |

## 3. Modelo Operacional

Fluxo esperado quando a feature estiver completa:

1. Usuario escreve uma frase no copiloto ou em uma entrada assistida.
2. Sistema resolve organizacao ativa, perfil, permissoes e escopo de membros.
3. Sistema classifica a intencao.
4. Para intencao de escrita, sistema gera rascunho review-only.
5. Para intencao de leitura, sistema consulta apenas dados permitidos.
6. UI mostra resultado, campos faltantes, erros e proximas acoes sugeridas.
7. Usuario revisa e confirma em formulario ou fluxo explicito.
8. Apenas Server Actions existentes gravam dados, com validacoes finais.
9. Toda chamada runtime relevante registra auditoria agregada sem expor segredo.

## 4. Invariantes De Seguranca

| Invariante | Regra |
| --- | --- |
| Review-only | IA nunca grava direto no banco. |
| Sem IDs inventados | IDs devem vir de catalogos da organizacao ativa. |
| Organizacao ativa | Toda leitura/escrita passa por contexto da organizacao ativa. |
| Permissao primeiro | Permissoes e escopo de membros vencem qualquer sugestao do modelo. |
| Server-only | Provider, chaves e prompts runtime ficam fora do client. |
| Fail-closed | Ausencia de config, provider ou permissao nega a operacao. |
| Auditoria | Endpoint/modelo registram tentativa/resultado agregado. |
| Sem prompt bruto persistido | Texto bruto so pode ser persistido com contrato de retencao dedicado. |
| Rollback | Toda exposicao de provider/modelo precisa de feature flag server-side. |
| Billing isolado | IA nao ativa billing nem enforcement comercial. |

## 5. Roadmap Por Bloco

| Bloco | Nome | Objetivo | Status | Evidencia/PR |
| --- | --- | --- | --- | --- |
| AI-00 | Roadmap vivo | Criar este documento e regra de acompanhamento | Concluido | Este PR |
| AI-01 | Reconciliacao documental | Alinhar GAP-020, DocDoc e contratos com `/api/ai` read-only existente | Concluido | Este PR |
| AI-02 | Command Bar IA | Definir e implementar UI inicial "O que aconteceu?" | Concluido | PR #968 |
| AI-03 | Classificador de intencao | Detectar gasto, conta a pagar, recebivel, banco, pergunta ou recusa | Concluido | PR #969 |
| AI-04 | Rascunho universal | Unificar rascunhos review-only para as quatro intents financeiras | Concluido | PR #970 |
| AI-05 | Perguntas financeiras read-only | Expandir consultas seguras sobre dashboard, vencimentos, categorias e limites | Concluido | PR #970 |
| AI-06 | Insights no dashboard | Exibir resumo inteligente do mes e alertas contextuais | Em revisao | `lib/finance/dashboard-insights.ts`, `components/dashboard/dashboard-ai-insights.tsx`, `__tests__/unit/dashboard-ai-insights.test.ts` |
| AI-07 | Provider/modelo real | Integrar modelo externo fail-closed, com rate limit, audit e rollback | Bloqueado | Decisao de provider e gates |
| AI-08 | Historico/memoria | Avaliar historico seguro de interacoes sem vazamento de dados sensiveis | Futuro | - |
| AI-09 | Acoes assistidas | Preparar acoes como marcar pago/abrir filtros, sempre com confirmacao forte | Futuro | - |

## 6. Criterio De Conclusao Por Bloco

Um bloco so pode sair de `Planejado` ou `Em andamento` para `Concluido` quando:

- o PR correspondente estiver mergeado em `main`;
- docs vivos forem atualizados no mesmo PR;
- riscos de organizacao ativa, RLS e permissoes forem revisados;
- o fluxo continuar review-only quando envolver escrita;
- houver rollback documentado quando houver runtime/provider;
- validacao executada for registrada no PR ou neste documento;
- a coluna `Evidencia/PR` apontar para o PR ou arquivo que comprova a entrega.

## 7. Decisoes Pendentes

| Decisao | Status | Observacao |
| --- | --- | --- |
| Provider/modelo | Pendente | Nao escolher provider sem PR dedicado e guard de dependencia. |
| Retencao de prompts | Pendente | Prompt bruto nao deve ser persistido ate existir contrato explicito. |
| UI do copiloto | Decidida para AI-02 | Command bar global no AppShell, local review-only, sem chat solto e sem provider. |
| Rate limit do provider | Pendente | Deve usar actor, organizacao e target claros. |
| Escopo de perguntas financeiras | Pendente | Comecar por perguntas read-only de baixo risco. |
| Acoes semi-automaticas | Futuro | Exigir confirmacao forte e audit dedicado. |

## 8. Sequencia Recomendada De PRs

1. AI-00/AI-01: criar roadmap vivo e reconciliar contratos existentes.
2. AI-02: documentar e implementar command bar review-only sem provider.
3. AI-03: criar classificador deterministico de intencao.
4. AI-04: conectar classificador aos rascunhos universais review-only.
5. AI-05: expandir `/api/ai` para perguntas financeiras read-only.
6. AI-06: adicionar insights textuais no dashboard.
7. AI-07: somente depois escolher provider/modelo e implementar chamada real.

## 9. Historico De Atualizacoes

| Data | Bloco | Mudanca | PR |
| --- | --- | --- | --- |
| 2026-06-28 | AI-00/AI-01 | Criacao do roadmap vivo e reconciliacao documental inicial | Este PR |
| 2026-06-28 | AI-02 | Implementacao inicial da command bar global "O que aconteceu?" em modo seguro, sem provider, sem endpoint novo e sem salvamento | Este PR |
| 2026-06-28 | AI-03 | Implementacao do classificador deterministico local para gasto, conta a pagar, conta a receber, banco, pergunta e recusa, sem provider e sem salvamento | Este PR |
| 2026-06-28 | AI-04/AI-05 | Rascunho universal review-only e expansao de perguntas financeiras read-only sem provider, sem endpoint model-backed e sem salvamento | Este PR |
| 2026-06-28 | AI-06 | Insights deterministicos no dashboard usando dados ja permitidos, sem provider, sem endpoint novo e sem salvamento | Este PR |

## 10. Fora De Escopo Por Enquanto

- chat livre com memoria longa;
- provider/modelo real em producao;
- embeddings;
- salvamento automatico;
- marcar conta como paga sem confirmacao forte;
- criar/editar/excluir registros diretamente pelo endpoint de IA;
- expor chave de provider no client;
- registrar prompt bruto sem contrato de retencao;
- usar service role para leituras financeiras do usuario;
- burlar RLS, membership ou escopo de membros.
