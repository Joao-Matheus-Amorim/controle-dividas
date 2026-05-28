# Billing settings status contract

Atualizado em: 2026-05-28

## Objetivo

Este contrato fecha o primeiro passo runtime do GAP-006 sem integrar Stripe.

A superficie escolhida e:

```txt
Configurações > Plano da organizacao
```

## Estado implementado

- `components/settings/settings-billing-plan-status.tsx` renderiza o plano atual da organizacao.
- `features/protected-pages/configuracoes-page.tsx` busca `getCurrentOrganization(orgSlug)` e passa `plan`, `status` e `trial_ends_at`.
- O bloco usa `lib/billing/plans.ts` como fonte unica do contrato local de planos.
- O bloco e read-only e informa que billing comercial ainda nao esta ativo.

## Fora de escopo

Este passo nao implementa:

- Stripe SDK;
- checkout;
- billing portal;
- webhooks;
- tabelas `subscriptions`;
- cobranca real;
- enforcement comercial por plano;
- migrations;
- alteracoes RLS;
- E2E data-changing.

## Proximo passo seguro

O contrato de fluxo de assinatura fica em:

```txt
docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md
```

Antes de implementar Stripe runtime, esse contrato deve definir:

- entrada de checkout;
- retorno de sucesso/cancelamento;
- portal de billing;
- webhook idempotente;
- rollback operacional;
- secrets esperados por ambiente.
