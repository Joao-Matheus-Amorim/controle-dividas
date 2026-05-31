# Billing Stripe test account runbook

Atualizado em: 2026-05-28

## Objetivo

Este runbook define o passo operacional para criar/configurar uma conta Stripe de teste e validar a evidencia real do checkout runtime e do billing portal runtime do GAP-006.

Ele existe porque checkout runtime e billing portal runtime ja estao implementados, mas ainda nao ha conta Stripe de teste/credenciais configuradas.

## Escopo

Este runbook cobre apenas:

- criar ou preparar uma conta Stripe em modo teste;
- criar price ids de teste para os planos pagos;
- configurar variaveis de ambiente de teste;
- validar que o checkout abre uma Stripe Checkout Session real;
- validar que o portal abre uma Stripe Billing Portal Session real quando a organizacao possui `stripe_customer_id`;
- registrar evidencia antes de qualquer webhook.

## Fora de escopo

Este runbook nao implementa:

- webhook runtime;
- subscription sync;
- enforcement comercial;
- migrations;
- RLS;
- mudanca de UI;
- E2E data-changing.

## Variaveis esperadas

As credenciais devem ser configuradas fora do repositorio. Nunca commitar valores reais.

```txt
ENABLE_STRIPE_CHECKOUT=true
STRIPE_SECRET_KEY=<test secret key>
STRIPE_WEBHOOK_SECRET=<test webhook secret, reservado para etapa futura>
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<test publishable key>
NEXT_PUBLIC_APP_URL=<app url usada no retorno do checkout>
STRIPE_PRICE_FAMILY_BASIC=<test price id>
STRIPE_PRICE_FAMILY_PLUS=<test price id>
STRIPE_PRICE_FAMILY_PRO=<test price id>
```

## Preflight

Antes de validar checkout e portal reais:

1. Confirmar que a conta Stripe esta em modo teste.
2. Confirmar que os tres price ids de teste existem.
3. Confirmar que `NEXT_PUBLIC_APP_URL` aponta para o ambiente em teste.
4. Confirmar que o usuario de teste possui membership `owner` ou `admin`.
5. Confirmar que usuario sem `owner/admin` ve CTA desabilitado.
6. Confirmar que `ENABLE_STRIPE_CHECKOUT=false` ainda mantem o app funcional sem Stripe.

## Validacao manual minima de checkout

Com as variaveis de teste configuradas:

1. Entrar no app com usuario `owner/admin`.
2. Abrir `Configuracoes > Plano da organizacao`.
3. Acionar checkout de um plano pago.
4. Confirmar redirecionamento para Stripe Checkout em modo teste.
5. Cancelar o checkout.
6. Confirmar retorno para Configuracoes com `billing_checkout=cancelled`.
7. Confirmar que `organizations.plan` nao mudou localmente.

## Validacao manual minima de portal

Com uma organizacao de teste que ja possua `stripe_customer_id` apontando para um customer Stripe em modo teste:

1. Entrar no app com usuario `owner/admin`.
2. Abrir `Configuracoes > Plano da organizacao`.
3. Acionar `Abrir portal`.
4. Confirmar redirecionamento para Stripe Billing Portal em modo teste.
5. Sair do portal.
6. Confirmar retorno para Configuracoes com `billing_portal=returned`.

## Evidencia esperada

Registrar no PR ou no status vivo apenas depois da validacao real:

```txt
Ambiente:
Branch/SHA:
APP_ENV:
ENABLE_STRIPE_CHECKOUT:
Plano testado:
Resultado do redirect para Stripe Checkout:
Resultado do cancel_url:
Resultado do redirect para Stripe Billing Portal:
Resultado do return_url:
Confirmacao de que organizations.plan nao mudou:
```

## Regra de sequenciamento

Nao iniciar webhook, subscription sync ou enforcement comercial antes de existir evidencia real de checkout e portal Stripe em modo teste.
