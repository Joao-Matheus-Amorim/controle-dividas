# ADR 0008 - billing plan contract before Stripe

## Status

Aceito

## Data

2026-05-28

## Contexto

`organizations` ja possui os campos `plan`, `trial_ends_at` e `stripe_customer_id` desde a migration `006_organizations_memberships.sql`.

No inicio desta decisao, o app ainda nao possuia checkout, webhook, portal de billing, subscription sync ou enforcement comercial por plano. Implementar Stripe diretamente em um pacote amplo aumentaria risco porque os evidence gates externos ainda precisam de execucao dedicada:

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

A primeira superficie runtime permitida antes de Stripe foi o status inicial:

```txt
components/settings/settings-billing-plan-status.tsx
```

Ela exibe o plano atual da organizacao em Configuracoes usando `lib/billing/plans.ts`.

O fluxo de assinatura antes do runtime Stripe esta documentado em:

```txt
docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md
```

Esse contrato define entrada de checkout, retorno, portal, webhook idempotente, subscription sync, secrets e rollback antes da primeira implementacao runtime.

A fronteira de configuracao Stripe antes de checkout runtime esta documentada em:

```txt
docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md
```

Essa fronteira versiona helper de configuracao server-side, flag de habilitacao e fail-fast de env vars obrigatorias em runtime de producao.

Depois dessa fronteira, checkout runtime e billing portal runtime foram implementados em PRs proprios, mantendo webhooks, subscription sync, cobranca real e enforcement comercial fora desses passos.

## Limites

Este ADR e sua sequencia nao implementam:

- webhooks;
- tabelas `subscriptions`;
- subscription sync;
- cobranca real;
- limites comerciais por plano.

## Sequencia esperada

1. Manter o contrato local de planos alinhado ao schema.
2. Exibir status read-only do plano atual da organizacao.
3. Rodar/registrar os evidence gates externos pendentes.
4. Definir UI e fluxo de assinatura.
5. Implementar fronteira de configuracao Stripe.
6. Implementar checkout runtime em PR proprio.
7. Implementar billing portal runtime em PR proprio.
8. Validar evidencia real de checkout e portal com Stripe de teste.
9. Implementar webhook e subscription sync em PRs separados com testes e rollback.

## Relacao com docs vivos

- Status vivo: `docs/SAAS_RLS_LIVE_STATUS.md`
- Roadmap operacional: `docs/SAAS_OPERATIONAL_ROADMAP.md`
- Gap register: `docs/SAAS_GAP_REGISTER.md`
- Contrato do fluxo: `docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md`
- Contrato da fronteira Stripe: `docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md`
