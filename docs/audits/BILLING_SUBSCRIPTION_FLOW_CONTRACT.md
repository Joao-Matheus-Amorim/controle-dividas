# Billing subscription flow contract

Atualizado em: 2026-05-28

## Objetivo

Este contrato define o fluxo de assinatura do GAP-006 antes de qualquer runtime Stripe.

Ele nao implementa SDK, rotas, webhooks, checkout ou portal. O objetivo e deixar a proxima PR de runtime pequena, auditavel e sem falso verde.

## Fluxo aprovado

### 1. Entrada de checkout

Superficie inicial:

```txt
Configurações > Plano da organizacao
```

Comportamento esperado quando Stripe runtime existir:

- usuario owner/admin escolhe um plano pago;
- servidor cria uma checkout session para a organizacao ativa;
- checkout usa `organization.id` como chave de correlacao interna;
- checkout nao aceita `organization_id` vindo livremente do client;
- retorno de sucesso volta para a area de Configuracoes;
- retorno de cancelamento volta para a area de Configuracoes sem alterar plano local.

### 2. Portal de billing

Comportamento esperado quando Stripe runtime existir:

- usuario owner/admin abre portal somente se a organizacao possuir customer externo;
- servidor resolve a organizacao ativa antes de criar a sessao;
- portal nao recebe customer id do client;
- retorno volta para Configuracoes.

### 3. Webhook

Comportamento esperado quando Stripe runtime existir:

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
```

## Rollback operacional

Rollback minimo esperado antes de runtime:

- desativar CTA de checkout por feature flag ou remocao da superficie;
- manter `organizations.plan` como fonte local normalizada;
- nao apagar dados de assinatura sem exportar evidencia;
- preservar webhook idempotente para eventos atrasados durante rollback;
- registrar evento manual quando houver correcao operacional de plano.

## Fora de escopo deste contrato

Este contrato nao implementa:

- Stripe SDK;
- rota de checkout;
- rota de portal;
- endpoint webhook;
- tabelas de assinatura;
- cobranca real;
- enforcement comercial por plano;
- migracao de schema;
- mudanca RLS;
- E2E data-changing.

## Proxima PR segura

Implementar a fronteira de configuracao Stripe sem criar checkout:

- validar env vars obrigatorias para runtime Stripe;
- criar helper server-only para ler configuracao;
- manter o app funcional quando Stripe estiver desativado;
- adicionar guards para impedir uso no client.
