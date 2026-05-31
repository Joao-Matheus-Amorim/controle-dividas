# Billing settings status, checkout entry, and portal contract

Atualizado em: 2026-05-28

## Objetivo

Este contrato registra o bloco de plano em Configuracoes, a entrada de checkout runtime e o billing portal runtime do GAP-006.

A superficie escolhida e:

```txt
Configuracoes > Plano da organizacao
```

## Estado implementado

- `components/settings/settings-billing-plan-status.tsx` renderiza o plano atual da organizacao e os CTAs de checkout dos planos pagos.
- `features/protected-pages/configuracoes-page.tsx` busca `requireOrganizationAccess(orgSlug)` e passa `plan`, `status`, `trial_ends_at`, permissao de billing por membership e o estado da fronteira Stripe.
- O bloco usa `lib/billing/plans.ts` como fonte unica do contrato local de planos.
- Os CTAs chamam server action, nao aceitam `organization_id` do client e ficam desabilitados quando `ENABLE_STRIPE_CHECKOUT` esta desligado ou incompleto.
- O bloco exibe entrada de billing portal somente para owner/admin com configuracao Stripe pronta e organizacao com `stripe_customer_id`.
- O billing portal runtime usa a operacao `billing.portal.start`.
- O bloco informa que plano local, webhook e enforcement comercial continuam fora deste passo.

## Fora de escopo

Este passo nao implementa:

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

O checkout runtime inicial e o billing portal runtime estao implementados em PRs proprios. Webhook idempotente e rollback operacional continuam separados.

Evidencia real de checkout e portal Stripe segue pendente ate existir conta Stripe de teste/credenciais configuradas.
