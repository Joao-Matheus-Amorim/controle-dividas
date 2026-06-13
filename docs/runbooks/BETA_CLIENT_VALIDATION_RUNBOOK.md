# Beta Client Validation Runbook

> Status DocDoc: Atual
> Uso atual: roteiro operacional para liberar um cliente beta a testar o app sem
> misturar validacao de uso com schema final, billing ou retirada completa de
> `owner_id`.
> Atualizado em: 2026-06-13.

## Objetivo

Validar que o cliente beta consegue usar o ciclo financeiro principal em uma
organizacao ativa:

- login;
- resolucao de organizacao ativa;
- dashboard;
- pessoas;
- gastos;
- contas a pagar;
- contas a receber;
- bancos;
- configuracoes basicas.

Este runbook nao fecha `owner_id`, nao altera RLS, nao executa SQL e nao valida
billing comercial.

## Fronteira para o beta

Para o beta, `owner_id` permanece como coluna legada transicional. O contrato
operacional e:

```txt
runtime por organization_id + memberships + permissoes;
owner_id apenas como compatibilidade ate schema final dedicado.
```

Nao fazer neste ciclo:

- remover coluna `owner_id`;
- reescrever migrations antigas;
- trocar policies RLS sem gate dedicado;
- implementar webhook Stripe;
- misturar redesign amplo com validacao funcional;
- abrir PR grande com schema, UI, RLS e billing juntos.

## Pre-condicoes

Antes de chamar o cliente para testar:

1. `main` ou branch candidata precisa estar com CI verde.
2. Deploy precisa apontar para o Supabase correto.
3. Migrations esperadas precisam estar aplicadas no banco alvo.
4. O usuario beta precisa ter:
   - auth user confirmado;
   - uma organizacao ativa;
   - membership ativa;
   - profile ativo;
   - permissoes suficientes para o fluxo combinado.
5. Se for testar producao, configurar os secrets do smoke pos-deploy.

Na Vercel/GitHub, a `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` precisa pertencer ao
mesmo projeto da `NEXT_PUBLIC_SUPABASE_URL`. Se uma
`NEXT_PUBLIC_SUPABASE_ANON_KEY` legada existir na Vercel, ela nao deve apontar
para outro projeto. O runtime prioriza a publishable key sincronizada pelo
deploy para evitar `Unregistered API key`.

Variaveis do smoke pos-deploy:

```env
PRODUCTION_APP_URL=URL_PUBLICA_DO_DEPLOY
E2E_POST_DEPLOY_EMAIL=EMAIL_DE_USUARIO_COM_ORGANIZACAO_ATIVA
E2E_POST_DEPLOY_PASSWORD=SENHA_DO_USUARIO_DE_SMOKE
```

## Validacao tecnica minima

Validacao local leve para PR beta:

```bash
npx vitest run __tests__/unit/owner-id-active-consumers-guards.test.ts __tests__/unit/organization-query-guards.test.ts
```

Smoke pos-deploy com usuario real de teste:

```bash
PLAYWRIGHT_SKIP_WEB_SERVER=true RUN_POST_DEPLOY_SMOKE_E2E=true npm run test:e2e -- tests/e2e/post-deploy-protected-smoke-gated.spec.ts
```

Se o ambiente permitir validar criacao de dados, usar apenas specs
data-changing gated com cleanup:

```bash
npm run test:e2e -- tests/e2e/create-family-member-data-changing-gated.spec.ts
npm run test:e2e -- tests/e2e/create-expense-data-changing-gated.spec.ts
npm run test:e2e -- tests/e2e/create-payable-data-changing-gated.spec.ts
npm run test:e2e -- tests/e2e/create-receivable-data-changing-gated.spec.ts
npm run test:e2e -- tests/e2e/create-bk-account-data-changing-gated.spec.ts
```

Nao rodar specs data-changing contra producao real sem cleanup, usuario de
smoke isolado e confirmacao do ambiente.

## Roteiro manual do cliente beta

Executar com um usuario beta preparado:

1. Entrar no app.
2. Confirmar que nao caiu em `/onboarding/organizacao` indevidamente.
3. Abrir dashboard e confirmar nome da organizacao ativa.
4. Criar ou revisar uma pessoa.
5. Registrar um gasto.
6. Criar uma conta a pagar.
7. Criar uma conta a receber.
8. Criar ou revisar uma conta bancaria.
9. Abrir configuracoes e confirmar categorias.
10. Sair e entrar novamente para confirmar persistencia de sessao e organizacao.

## Criterios de aceite

O beta esta utilizavel quando:

- usuario beta consegue acessar `/protected` sem loop de onboarding;
- rotas financeiras criticas abrem sem erro de Server Component;
- dashboard mostra dados ou estados vazios compreensiveis;
- criacao basica de registros funciona nos modulos principais;
- navegacao mobile nao bloqueia o fluxo principal;
- permissao insuficiente mostra bloqueio claro, nao erro generico;
- logs de runtime nao mostram falhas recorrentes nas rotas testadas.

## Se falhar

Classificar a falha antes de corrigir:

| Tipo | Acao |
| --- | --- |
| Login/sessao | Corrigir auth/proxy/env antes de mexer em finance runtime. |
| Onboarding/organizacao ativa | Corrigir membership/profile/active organization. |
| Rota financeira quebrada | Corrigir loader/action do modulo afetado em PR pequeno. |
| Permissao | Corrigir access-control ou seed de permissao, sem bypass. |
| Dados/relacionamentos | Conferir migration aplicada e loaders organization-first. |
| UI/copy | Ajustar estado vazio/erro no modulo, sem misturar schema. |

## Saida esperada

Registrar no PR ou handoff:

```txt
Beta client validation:
- Deploy/URL:
- Usuario de smoke:
- Rotas abertas:
- Fluxos manuais:
- Specs gated executadas:
- Falhas encontradas:
- Proximo PR recomendado:
```

