# Billing Stripe configuration boundary

Atualizado em: 2026-05-28

## Objetivo

Este contrato fecha o proximo passo tecnico do GAP-006 antes de qualquer runtime de checkout.

A fronteira implementada define como habilitar/desabilitar Stripe em runtime server-side sem criar acoplamento prematuro com checkout, portal ou webhook.

## Estado implementado

- `lib/billing/stripe-config.ts` e server-only.
- `ENABLE_STRIPE_CHECKOUT` controla se o runtime Stripe esta habilitado.
- Quando `ENABLE_STRIPE_CHECKOUT` estiver desativado, o app permanece funcional sem dependencia de env vars Stripe.
- Quando `ENABLE_STRIPE_CHECKOUT=true`, o helper exige:
  - `STRIPE_SECRET_KEY`;
  - `STRIPE_WEBHOOK_SECRET`;
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`;
  - `NEXT_PUBLIC_APP_URL`.
- Em runtime parecido com producao (`NODE_ENV=production` ou `APP_ENV=production`), faltas de env vars obrigatorias disparam fail-fast.

## Fora de escopo

Este passo nao implementa:

- Stripe SDK;
- rota de checkout;
- rota de portal;
- endpoint webhook;
- tabela de subscriptions;
- cobranca real;
- enforcement comercial por plano;
- alteracao de schema;
- alteracao de RLS;
- E2E data-changing.

## Proximo passo seguro

Depois desta fronteira:

- implementar entrada de checkout em PR proprio;
- manter `ENABLE_STRIPE_CHECKOUT=false` por padrao ate o runtime estar pronto;
- separar webhook/portal em passos explicitos e auditaveis.

