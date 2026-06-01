# Billing webhook runtime contract

> Status DocDoc: Atual como contrato pre-runtime
> Uso atual: define os requisitos minimos do futuro webhook Stripe do GAP-006.
> Observacao: nao e evidencia de webhook implementado; o runtime segue
> bloqueado ate checkout e portal Stripe reais serem validados.

Atualizado em: 2026-05-31

## Objetivo

Este contrato define a fronteira minima para o futuro webhook Stripe do GAP-006 antes de qualquer runtime.

Checkout runtime e billing portal runtime ja existem em PRs separados. O webhook continua bloqueado ate existir evidencia real de checkout e portal Stripe em modo teste conforme:

```txt
docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md
```

## Superficie futura

Endpoint previsto:

```txt
app/api/stripe/webhook/route.ts
```

Esse endpoint deve aceitar apenas `POST` e deve validar a assinatura Stripe usando `STRIPE_WEBHOOK_SECRET` antes de interpretar qualquer payload.

## Regras obrigatorias

O PR runtime do webhook deve:

- ler o corpo bruto da request antes de parsear JSON;
- validar assinatura com `stripe.webhooks.constructEvent`;
- rejeitar payload sem assinatura valida;
- nunca confiar em `organization_id` fora de metadata Stripe validada;
- correlacionar eventos por `organization_id` presente em `checkout.session.completed` ou metadata de subscription;
- processar eventos de forma idempotente;
- registrar falhas sem incluir payload bruto, secrets, tokens ou dados de cartao;
- atualizar `organizations.plan` somente depois de evento confiavel;
- manter `free` como fallback seguro para eventos incompletos ou desconhecidos;
- preservar rollback por flag ou deploy revert sem quebrar checkout e portal ja existentes.

## Eventos candidatos

O primeiro runtime deve limitar o escopo a poucos eventos:

```txt
checkout.session.completed
customer.subscription.updated
customer.subscription.deleted
```

Qualquer outro evento deve ser ignorado com resposta segura e sem alterar estado local.

## Decisoes pendentes antes do runtime

Antes de implementar o endpoint, o PR deve decidir explicitamente:

- onde guardar idempotency/event ids processados;
- se o primeiro runtime atualiza apenas `organizations.plan` ou tambem `status` e `trial_ends_at`;
- como mapear Stripe Price IDs para `BillingPlanKey`;
- se o update usara service-role boundary ou RPC dedicada;
- como auditar resultado sem armazenar payload bruto.

## Fora de escopo deste contrato

Este contrato nao implementa:

- endpoint webhook;
- tabelas de assinatura;
- tabela de idempotencia;
- migration;
- RLS;
- enforcement comercial;
- E2E data-changing;
- alteracao de UI.

## Aceite do PR runtime futuro

O PR que implementar webhook deve incluir:

- unit guards para assinatura, raw body e eventos suportados;
- teste de idempotencia ou contrato explicito da tabela/RPC escolhida;
- docs atualizados em `docs/SAAS_GAP_REGISTER.md`, `docs/SAAS_OPERATIONAL_ROADMAP.md` e `docs/SAAS_RLS_LIVE_STATUS.md`;
- rollback documentado;
- evidencia de que checkout e portal Stripe reais foram validados antes do webhook runtime.
