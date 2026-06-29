# AI Finance Provider Endpoint Contract

> Status DocDoc: Atual
> Uso atual: contrato pre-runtime para o futuro provider/modelo e para endpoint
> model-backed de geracao de rascunho da IA financeira.
> `/api/ai` ja existe como endpoint read-only inicial, mas isso nao e evidencia
> de provider, modelo, chave de API, prompt runtime, schema novo, RLS novo ou
> salvamento automatico.
> Roadmap vivo da feature completa: `docs/audits/AI_COPILOT_ROADMAP.md`.

## Objetivo

Definir a fronteira minima antes de qualquer chamada real a modelo para o
GAP-020.

O primeiro runtime com provider deve continuar produzindo apenas rascunhos
revisaveis. A chamada ao modelo nao pode salvar dados, chamar Server Actions de
criacao ou inventar ids fora dos catalogos da organizacao ativa.

Estado runtime separado: `/api/ai` existe hoje como endpoint read-only inicial
para consultas financeiras guardadas (`getDashboardSummary`, `getUpcomingBills`,
`getCategorySpendingSummary`, `getMemberLimitsSummary`). Esse endpoint nao chama
modelo, nao gera rascunho com provider e nao autoriza direct save.

## Pre-condicoes obrigatorias

Antes de implementar endpoint ou provider:

- manter `lib/finance/ai-finance-intake-runtime.ts` como boundary server-only
  para catalogos reais, validacao e resposta `review_only`;
- manter `components/finance/assisted-draft-review-boundary.tsx` como boundary
  de UI sem `formAction`, sem `type="submit"` e sem Server Action de criacao;
- usar `docs/audits/AI_FINANCE_INTAKE_CONTRACT.md` como contrato de intents,
  campos obrigatorios, catalogos permitidos e perguntas de esclarecimento;
- adicionar guard dedicado para qualquer dependencia, env ou rota de provider;
- manter rollback por feature flag server-side antes de expor a UI.

## Provider e configuracao

O provider deve ser escolhido em PR dedicado e documentado antes de runtime.

Estado atual:

- `lib/finance/ai-finance-provider-config.ts` define a fronteira de
  configuracao provider para runtime server-side futuro.
- O helper nao usa `import "server-only"` para manter compatibilidade com
  Vitest/Vite nos testes unitarios.
- `ENABLE_AI_FINANCE_PROVIDER` controla se o provider futuro esta habilitado.
- Quando `ENABLE_AI_FINANCE_PROVIDER` estiver desativado, o app permanece
  funcional sem dependencia de env vars de IA.
- Quando `ENABLE_AI_FINANCE_PROVIDER=true`, o helper exige:
  - `AI_FINANCE_PROVIDER`;
  - `AI_FINANCE_MODEL`;
  - `AI_FINANCE_PROVIDER_API_KEY`.
- Em runtime parecido com producao (`NODE_ENV=production` ou
  `APP_ENV=production`), faltas de env vars obrigatorias disparam fail-fast.

Regras obrigatorias:

- nenhuma dependencia de provider pode entrar sem guard de dependencia;
- nenhuma chave pode ser lida no client;
- a ausencia de configuracao deve falhar fechado;
- o provider configurado deve ser resolvido apenas no servidor;
- logs, erros e respostas nao podem persistir texto bruto do usuario sem
  contrato de retencao dedicado.

Qualquer variavel de ambiente futura deve ter:

- nome documentado;
- escopo server-only;
- comportamento quando ausente;
- rollback;
- teste/guard de ausencia de vazamento para client bundle.

## Endpoint model-backed futuro

O endpoint model-backed futuro deve ser dedicado a gerar rascunho revisavel.
Ele nao substitui o endpoint read-only inicial enquanto nao houver provider,
rate limit dedicado, audit agregado sem prompt bruto e rollback server-side.

Regras obrigatorias:

- aceitar apenas intents `gasto`, `conta_a_pagar`, `conta_a_receber` e `banco`;
- resolver organizacao ativa e permissoes no servidor;
- carregar catalogos reais por `getAiFinanceIntakeCatalogs`;
- chamar o modelo com catalogos permitidos, nao com ids inventados;
- validar a resposta com `buildAiFinanceReviewOnlyBoundary`;
- retornar campos sugeridos, `missingFields` e `errors`;
- nunca chamar `createExpense`, `createPayableBill`, `createReceivableIncome`
  ou `createBankAccount`;
- nunca retornar `canAutoSave: true`;
- nunca retornar `directSaveAction` diferente de `null`.

## Rate limit, audit e abuso

Antes de expor o endpoint:

- adicionar rate limit dedicado para geracao de rascunho;
- definir actor, organizacao e target do bucket;
- definir rollback por env server-side;
- registrar audit somente para tentativa/resultado agregado, sem prompt bruto;
- documentar erro para limite excedido sem vazar configuracao interna.

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

- escolher provider/modelo final;
- adicionar dependencia de provider;
- criar endpoint runtime;
- adicionar chave de API;
- persistir conversa;
- criar embeddings;
- alterar schema;
- alterar RLS;
- salvar automaticamente.
