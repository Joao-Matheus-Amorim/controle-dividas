# Billing Stripe configuration boundary

Atualizado em: 2026-05-28

## Objetivo

Este contrato fecha a fronteira tecnica do GAP-006 para habilitar/desabilitar Stripe em runtime server-side sem acoplar checkout, portal e webhook no mesmo passo.

## Estado implementado

- `lib/billing/stripe-config.ts` define a fronteira de configuracao Stripe para runtime server-side.
- O helper nao usa `import "server-only"` para manter compatibilidade com Vitest/Vite nos testes unitarios.
- `ENABLE_STRIPE_CHECKOUT` controla se o runtime Stripe esta habilitado.
- Quando `ENABLE_STRIPE_CHECKOUT` estiver desativado, o app permanece funcional sem dependencia de env vars Stripe.
- Quando `ENABLE_STRIPE_CHECKOUT=true`, o helper exige:
  - `STRIPE_SECRET_KEY`;
  - `STRIPE_WEBHOOK_SECRET`;
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`;
  - `NEXT_PUBLIC_APP_URL`.
- Em runtime parecido com producao (`NODE_ENV=production` ou `APP_ENV=production`), faltas de env vars obrigatorias disparam fail-fast.
- Price ids de checkout sao separados por plano pago e lidos somente na entrada de checkout:
  - `STRIPE_PRICE_FAMILY_BASIC`;
  - `STRIPE_PRICE_FAMILY_PLUS`;
  - `STRIPE_PRICE_FAMILY_PRO`.

## Fora de escopo

Este contrato de fronteira nao implementa:

- rota de portal;
- endpoint webhook;
- tabela de subscriptions;
- cobranca real;
- enforcement comercial por plano;
- alteracao de schema;
- alteracao de RLS;
- E2E data-changing.

## Checkout runtime

O primeiro checkout runtime dedicado fica em:

```txt
app/protected/configuracoes/billing-actions.ts
lib/billing/stripe-checkout.ts
components/settings/settings-billing-plan-status.tsx
```

Ele respeita `ENABLE_STRIPE_CHECKOUT`, resolve owner/admin no servidor e nao implementa webhook, portal ou enforcement comercial.

## Evidencia Stripe pendente

Ainda nao ha conta Stripe de teste/credenciais configuradas para validar checkout real.

Enquanto essa evidencia nao existir:

- manter `ENABLE_STRIPE_CHECKOUT=false` por padrao;
- nao declarar checkout Stripe validado;
- nao iniciar webhook, portal ou enforcement comercial como se checkout real ja tivesse evidencia.

Runbook para criar/configurar conta Stripe de teste:

```txt
docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md
```
