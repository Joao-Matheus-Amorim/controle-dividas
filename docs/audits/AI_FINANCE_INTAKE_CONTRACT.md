# AI Finance Intake Contract

> Status DocDoc: Atual
> Uso atual: contrato vigente para a futura IA financeira.
> Inclui fronteira server-only review-only antes de provider/modelo.
> Este documento nao e evidencia de modelo, endpoint, provider, prompt runtime,
> schema novo, RLS novo ou salvamento automatico.
> Provider/endpoint futuro deve seguir
> `docs/audits/AI_FINANCE_PROVIDER_ENDPOINT_CONTRACT.md`.
> Roadmap vivo da feature completa: `docs/audits/AI_COPILOT_ROADMAP.md`.

## Objetivo

Definir o contrato minimo antes de trocar os rascunhos assistidos atuais por um
fluxo com modelo de IA.

O objetivo do primeiro runtime de IA financeira e ajudar o usuario a preencher
um rascunho revisavel. A IA nao deve salvar diretamente sem revisao humana.

## Estado atual no codigo

Varredura em 2026-06-25:

- `lib/finance/expense-draft.ts`, `lib/finance/payable-draft.ts`,
  `lib/finance/receivable-draft.ts` e `lib/finance/bank-draft.ts` existem como
  parsers deterministicos de rascunho assistido;
- `components/finance/expense-form.tsx`,
  `components/finance/payable-bill-form.tsx`,
  `components/finance/receivable-income-form.tsx` e
  `components/finance/bank-account-form.tsx` aplicam sugestoes apenas via botao
  `type="button"` e mantem o envio real no `formAction` do formulario;
- `components/finance/assisted-draft-review-boundary.tsx` centraliza a UI
  review-only dos rascunhos assistidos, sem `formAction`, sem `type="submit"`
  e sem chamada para Server Actions de criacao;
- `__tests__/unit/finance-assisted-draft-contract-guards.test.ts` guarda que os
  rascunhos continuam review-only e fora dos caminhos de Server Action;
- as categorias, origens, bancos e pessoas usados nas telas de criacao saem de
  consultas com organizacao ativa e permissoes do modulo;
- `app/protected/gastos/actions.ts`,
  `app/protected/contas-a-pagar/actions.ts`,
  `app/protected/contas-a-receber/actions.ts` e
  `app/protected/bancos/actions.ts` ainda fazem a validacao final de membro,
  categoria, origem, banco, permissao e `organization_id` antes de gravar.
- `lib/finance/ai-finance-intake-schema.ts` define as intents permitidas, o
  shape estruturado de rascunho e a validacao contra catalogos recebidos da
  organizacao ativa; isso nao chama modelo, endpoint ou Server Action.
- `lib/finance/ai-finance-intake-catalogs.ts` monta catalogos server-side por
  intent a partir da organizacao ativa, dos membros acessiveis para `can_create`
  e das listas controladas de banco, tipo de conta e moeda; isso nao chama
  modelo, endpoint ou Server Action.
- `lib/finance/ai-finance-intake-runtime.ts` monta a fronteira server-only
  review-only: carrega catalogos reais, valida o rascunho estruturado, retorna
  provider: `none`, `canAutoSave: false` e `directSaveAction: null`, sem chamar
  modelo, endpoint ou Server Action de criacao.
- `lib/finance/ai-finance-provider-config.ts` monta a fronteira de configuracao
  fail-closed do provider futuro, desligada por padrao e sem dependencia de
  modelo.
- `app/api/ai/route.ts` existe como endpoint inicial read-only separado do
  intake de rascunhos. Hoje ele expoe apenas `getDashboardSummary` e
  `getUpcomingBills`, usa guards de permissao, registra auditoria em
  `ai_actions` e nao chama Server Actions de escrita.

Isso esta pronto para continuar como rascunho assistido deterministico. Ainda
nao esta pronto para provider, endpoint model-backed de rascunho ou chamada de
modelo.

## Intents permitidas

A IA financeira so pode produzir uma destas intents:

```txt
gasto
conta_a_pagar
conta_a_receber
banco
```

Qualquer pedido fora dessas intents deve virar pergunta de esclarecimento ou
recusa controlada no proprio fluxo.

## Regra de salvamento

O resultado da IA deve ser sempre review-only:

- preencher campos sugeridos no formulario;
- mostrar campos obrigatorios faltantes;
- pedir confirmacao antes de chamar qualquer Server Action;
- nunca chamar `createExpense`, `createPayableBill`, `createReceivableIncome`
  ou `createBankAccount` diretamente a partir do modelo;
- nunca inventar ids de pessoa, categoria, banco ou origem.

## Escopo de pessoa

Para usuario nao-admin:

- a pessoa financeira padrao e sempre a pessoa vinculada ao usuario logado;
- a IA nao pode escolher outra pessoa;
- se o usuario pedir para lancar em outra pessoa, o fluxo deve bloquear ou
  pedir permissao/admin conforme o runtime existente.

Para owner/admin:

- a IA pode sugerir a pessoa mencionada no texto apenas se ela existir na
  organizacao ativa;
- quando houver ambiguidade, deve perguntar qual pessoa usar.

## Catalogos permitidos

A IA so pode escolher opcoes vindas do estado atual da organizacao ativa.

### Categorias de gastos e contas a pagar

Gasto e conta a pagar usam categorias de custo da organizacao.

O catalogo inicial esperado tem 20 categorias raiz:

```txt
receitas
moradia
utilidades
alimentacao
alimentacao-fora
transporte
saude
educacao
filhos
trabalho
marketing
roupas-e-acessorios
lazer-e-entretenimento
viagens
igreja-e-doacoes
investimentos
negocios
documentacao-e-taxas
transferencias
dividas-e-financiamentos
```

O modelo deve receber o catalogo real da organizacao como opcoes permitidas.
Se uma categoria foi renomeada, criada ou excluida pelo admin, a IA deve seguir
o catalogo atual, nao uma lista fixa no prompt.

`transferencias` pode ser sugerida para classificacao operacional, mas nao deve
entrar em total de gastos reportavel.

### Contas a receber

Conta a receber nao usa categoria de gasto.

A IA deve escolher apenas uma origem de recebimento existente na organizacao.
Se nao houver origem adequada, deve perguntar se o admin quer criar uma origem
em Configuracoes ou pedir outra origem existente.

### Bancos

Quando o texto mencionar algo como `cartao itau`, `itau`, `nubank`, `wise` ou
outro banco/cartao, a IA deve mapear apenas para uma conta bancaria existente.

Se houver mais de uma conta compativel, deve perguntar qual banco usar. Se nao
houver conta compativel, deve perguntar se o usuario quer cadastrar o banco
antes de salvar o lancamento.

## Campos obrigatorios por intent

### gasto

Obrigatorios:

- pessoa financeira;
- categoria;
- valor;
- data;
- descricao;

Opcionais:

- banco/cartao;
- local da compra;
- forma de pagamento;
- observacoes.

### conta_a_pagar

Obrigatorios:

- pessoa responsavel;
- categoria;
- nome;
- valor;
- vencimento;
- status;
- tipo: `fixa` ou `avulsa`.

Opcionais:

- banco usado;
- recorrencia;
- observacoes.

Se o texto disser `para pagar`, `vence`, `amanha`, `proximo mes` ou linguagem
equivalente de futuro, o status padrao deve ser pendente, nao pago.

### conta_a_receber

Obrigatorios:

- pessoa recebedora;
- origem;
- valor;
- data esperada;
- status;
- tipo: `fixa` ou `variavel`.

Opcionais:

- banco de recebimento;
- origem do pagamento;
- observacoes.

Se o texto disser `para receber`, `vai cair`, `vence`, `amanha` ou linguagem
equivalente de futuro, o status padrao deve ser previsto, nao recebido.

### banco

Obrigatorios:

- pessoa vinculada;
- nome do banco;
- tipo de conta;
- saldo atual;
- moeda.

Opcionais:

- observacoes.

Saldos negativos devem ser preservados quando o texto trouxer sinal negativo.
Codigos de moeda so podem ser aceitos como token isolado.

## Perguntas obrigatorias quando faltar dado

A IA deve perguntar antes de montar um rascunho salvavel quando faltar:

- pessoa obrigatoria para admin/owner;
- categoria de gasto ou conta a pagar;
- origem de recebimento;
- banco/cartao mencionado mas ambiguo;
- valor;
- data obrigatoria;
- status quando o texto permitir mais de uma interpretacao.

Exemplo:

```txt
Usuario: paguei mercado 83 no cartao Itau ontem
IA: Encontrei um gasto de 83 para ontem no cartao Itau. Qual descricao voce
quer usar?
```

Se `cartao Itau` nao existir no catalogo de bancos:

```txt
IA: Nao encontrei um banco ou cartao Itau cadastrado. Deseja cadastrar esse
banco antes ou escolher uma conta existente?
```

## Limites antes do runtime

Antes de chamar qualquer modelo:

- usar `lib/finance/ai-finance-intake-schema.ts` como contrato inicial de
  resposta estruturada;
- passar catalogos reais da organizacao ativa via
  `lib/finance/ai-finance-intake-catalogs.ts`;
- passar todo rascunho por `lib/finance/ai-finance-intake-runtime.ts` antes de
  preencher UI ou expor qualquer futura chamada de modelo;
- manter a exibicao inicial em
  `components/finance/assisted-draft-review-boundary.tsx`, sem submit direto;
- validar todo id retornado no servidor;
- aplicar as mesmas permissoes e RLS ja existentes;
- manter rate limit e audit para a acao final de salvar;
- registrar guard para impedir salvamento direto sem revisao.
- seguir `docs/audits/AI_FINANCE_PROVIDER_ENDPOINT_CONTRACT.md` antes de
  escolher provider, criar endpoint ou adicionar chave de API.
- manter `lib/finance/ai-finance-provider-config.ts` desligado por padrao ate
  existir PR dedicado de runtime.

## Fora de escopo deste contrato

- escolher provider/modelo;
- criar endpoint de IA;
- adicionar chave de API;
- salvar conversa;
- criar embeddings;
- criar cron;
- alterar migrations;
- alterar RLS;
- adicionar dependencia.
