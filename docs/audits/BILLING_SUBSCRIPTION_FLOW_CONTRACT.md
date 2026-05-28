# Billing subscription flow contract

Atualizado em: 2026-05-28

## Objetivo

Este contrato define o fluxo de assinatura do GAP-006 e registra o primeiro runtime Stripe permitido.

Checkout runtime implementado neste passo: server action em Configuracoes cria uma Stripe Checkout Session para a organizacao resolvida no servidor. O objetivo continua sendo manter a mudanca pequena, auditavel e sem falso verde.

Evidencia real pendente: ainda nao ha conta Stripe de teste/credenciais configuradas para validar o checkout contra Stripe. Enquanto isso, `ENABLE_STRIPE_CHECKOUT=false` deve permanecer como padrao operacional.

Runbook operacional:

```txt
docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md
```

## Fluxo aprovado

### 1. Entrada de checkout

Superficie inicial:

```txt
Configuracoes > Plano da organizacao
```

Comportamento implementado:

- usuario owner/admin escolhe um plano pago;
- servidor cria uma checkout session para a organizacao ativa ou para o `orgSlug` da rota;
- checkout usa `organization.id` como chave de correlacao interna;
- checkout nao aceita `organization_id` vindo livremente do client;
- retorno de sucesso volta para a area de Configuracoes;
- retorno de cancelamento volta para a area de Configuracoes sem alterar plano local.

Arquivos:

- `components/settings/settings-billing-plan-status.tsx`;
- `app/protected/configuracoes/billing-actions.ts`;
- `lib/billing/stripe-checkout.ts`.

Price ids por plano pago:

- `STRIPE_PRICE_FAMILY_BASIC`;
- `STRIPE_PRICE_FAMILY_PLUS`;
- `STRIPE_PRICE_FAMILY_PRO`.

### 2. Portal de billing

Comportamento esperado quando portal runtime existir:

- usuario owner/admin abre portal somente se a organizacao possuir customer externo;
- servidor resolve a organizacao ativa antes de criar a sessao;
- portal nao recebe customer id do client;
- retorno volta para Configuracoes.

### 3. Webhook

Comportamento esperado quando webhook runtime existir:

- endpoint dedicado valida assinatura do provedor;
- evento e processado de forma idempotente;
- evento registra correlacao com `organization.id`;
- evento nao depende de sessao de usuario;
- falha de evento nao deve expor secrets em logs;
- atualizacao de `organizations.plan` ocorre somente depois de evento confiavel.

### 4. Estados locais

O runtime local deve tratar:

- `free` como fallback seguro;
- plano pago pendente enquanto checkout ainda nao foi confirmado;
- plano pago ativo somente apos webhook confiavel;
- cancelamento como downgrade controlado ou estado pendente definido;
- organizacao sem customer externo como status local sem portal.

## Secrets esperados

Nomes candidatos, sem valores neste contrato:

```txt
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL
STRIPE_PRICE_FAMILY_BASIC
STRIPE_PRICE_FAMILY_PLUS
STRIPE_PRICE_FAMILY_PRO
```

## Rollback operacional

Rollback minimo esperado:

- desativar CTA de checkout por `ENABLE_STRIPE_CHECKOUT=false`;
- manter `organizations.plan` como fonte local normalizada;
- nao apagar dados de assinatura sem exportar evidencia;
- preservar webhook idempotente para eventos atrasados durante rollback quando webhook existir;
- registrar evento manual quando houver correcao operacional de plano.

## Fora de escopo deste passo

Este passo nao implementa:

- rota de portal;
- endpoint webhook;
- tabelas de assinatura;
- cobranca real;
- enforcement comercial por plano;
- migracao de schema;
- mudanca RLS;
- E2E data-changing.

## Fronteira Stripe implementada

A fronteira de configuracao Stripe desta sequencia foi implementada e documentada em:

```txt
docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md
```

Resumo do estado atual:

- helper de fronteira Stripe versionado em `lib/billing/stripe-config.ts` com compatibilidade Vitest/Vite (sem `import "server-only"` direto);
- `ENABLE_STRIPE_CHECKOUT=false` por padrao;
- fail-fast em runtime de producao quando `ENABLE_STRIPE_CHECKOUT=true` e env vars obrigatorias estiverem ausentes;
- checkout runtime cria sessao Stripe somente quando a fronteira esta habilitada e pronta.

## Pendencias apos checkout runtime

- sem conta Stripe de teste/credenciais configuradas;
- sem evidencia real de checkout Stripe;
- sem webhook runtime;
- sem portal runtime;
- sem atualizacao automatica de `organizations.plan`;
- sem enforcement comercial final;
- manter webhook/portal separados em passos explicitos;
- preservar rollback operacional definido neste contrato.
