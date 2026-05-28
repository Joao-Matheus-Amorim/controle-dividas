# ADR 0008 - billing plan contract before Stripe

## Status

Aceito

## Data

2026-05-28

## Contexto

`organizations` ja possui os campos `plan`, `trial_ends_at` e `stripe_customer_id` desde a migration `006_organizations_memberships.sql`.

O app ainda nao possui checkout, webhook, portal de billing, assinatura Stripe ou enforcement comercial por plano. Implementar Stripe diretamente agora aumentaria risco porque os evidence gates externos ainda precisam de execucao dedicada:

- RLS Live Gate;
- E2E dedicado de `orgSlug`.

## Decisao

Antes de integrar Stripe, o projeto passa a ter um contrato local de planos em codigo:

```txt
lib/billing/plans.ts
```

Planos aceitos:

```txt
free
family_basic
family_plus
family_pro
```

Esse contrato deve permanecer alinhado com a constraint de schema de `organizations.plan`.

`free` e o plano de compatibilidade. Valores ausentes ou desconhecidos vindos do banco sao normalizados para `free` no runtime server-side.

## Limites

Este ADR nao implementa:

- Stripe SDK;
- checkout;
- billing portal;
- webhooks;
- tabelas `subscriptions`;
- cobranca real;
- limites comerciais por plano.

## Sequencia esperada

1. Manter o contrato local de planos alinhado ao schema.
2. Rodar/registrar os evidence gates externos pendentes.
3. Definir UI e fluxo de assinatura.
4. Implementar Stripe em PR proprio com secrets, webhook, testes e rollback separados.

## Relacao com docs vivos

- Status vivo: `docs/SAAS_RLS_LIVE_STATUS.md`
- Roadmap operacional: `docs/SAAS_OPERATIONAL_ROADMAP.md`
- Gap register: `docs/SAAS_GAP_REGISTER.md`
