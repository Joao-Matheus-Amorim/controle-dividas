# Billing settings status and checkout entry contract

Atualizado em: 2026-05-28

## Objetivo

Este contrato registra o bloco de plano em Configuracoes e a primeira entrada de checkout runtime do GAP-006.

A superficie escolhida e:

```txt
Configuracoes > Plano da organizacao
```

## Estado implementado

- `components/settings/settings-billing-plan-status.tsx` renderiza o plano atual da organizacao e os CTAs de checkout dos planos pagos.
- `features/protected-pages/configuracoes-page.tsx` busca `getCurrentOrganization(orgSlug)` e passa `plan`, `status`, `trial_ends_at` e o estado da fronteira Stripe.
- O bloco usa `lib/billing/plans.ts` como fonte unica do contrato local de planos.
- Os CTAs chamam server action, nao aceitam `organization_id` do client e ficam desabilitados quando `ENABLE_STRIPE_CHECKOUT` esta desligado ou incompleto.
- O bloco informa que plano local, webhook, portal e enforcement comercial continuam fora deste passo.

## Fora de escopo

Este passo nao implementa:

- billing portal;
- webhooks;
- tabelas `subscriptions`;
- cobranca real;
- enforcement comercial por plano;
- migrations;
- alteracoes RLS;
- E2E data-changing.

## Contratos relacionados

O contrato de fluxo de assinatura fica em:

```txt
docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md
```

A fronteira de configuracao Stripe fica em:

```txt
docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md
```

O checkout runtime inicial esta implementado em PR proprio. Portal de billing, webhook idempotente e rollback operacional continuam separados.
