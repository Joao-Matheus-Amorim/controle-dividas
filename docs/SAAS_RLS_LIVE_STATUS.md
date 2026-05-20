# SaaS RLS Live Status

Issue: #224

## 1. Objetivo

Este documento registra o estado vivo atual da transicao SaaS multi-tenant do FamilyFinance apos a conclusao do bloco principal de RLS financeira e do onboarding inicial por RPC transacional.

Ele complementa o `README.md` sem apagar o historico e sem substituir documentos PMBOK ja existentes.

## 2. Estado atual resumido

O projeto esta em modo:

```txt
SaaS multi-tenant transicional com RLS financeira principal aplicada e onboarding inicial transacional.
```

Isso significa:

- `organizations` e `organization_memberships` existem;
- `organization_id` existe nas tabelas principais;
- principais modulos financeiros usam organization-aware queries/actions;
- RLS financeira principal ja foi migrada para organization-aware com fallback legado;
- o onboarding inicial cria organization, owner membership e profile/link por RPC transacional autenticada;
- `owner_id` ainda existe e continua sendo usado como compatibilidade;
- `organization_id` ainda e nullable;
- rotas por `orgSlug` ainda nao existem;
- selector de organizacao ainda nao existe;
- billing/Stripe ainda nao foi implementado;
- Playwright/E2E ainda nao foi implementado.

## 3. Migrations SaaS/RLS atuais

As migrations relevantes para SaaS/RLS ja mergeadas sao:

```txt
006_organizations_memberships.sql
007_add_organization_id_columns.sql
008_expense_categories_organization_rls.sql
009_expense_categories_owner_write_rls.sql
010_family_members_organization_rls.sql
011_expenses_organization_rls.sql
012_payable_bills_organization_rls.sql
013_receivable_incomes_organization_rls.sql
014_banks_organization_rls.sql
015_profiles_organization_rls.sql
016_user_module_permissions_organization_rls.sql
017_user_feature_permissions_organization_rls.sql
018_one_active_membership_per_user.sql
019_initial_organization_onboarding_rpc.sql
```

Observacao operacional:

```txt
A migration 019 precisa estar aplicada no Supabase de cada ambiente antes de depender do onboarding inicial em runtime.
```

## 4. RLS financeira principal

Tabelas ja cobertas por RLS organization-aware:

- `expense_categories`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Tabelas de identidade/permissao ja cobertas por RLS organization-aware transicional:

- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Padrao aplicado:

```txt
Leitura:
organization_id com membership
OU legado organization_id IS NULL + owner_id

Escrita:
owner da linha durante transicao
```

Observacoes importantes:

- `expense_categories` precisou de hotfix de escrita na migration `009`;
- `banks` preserva comportamento historico e nao depende de `family_members.is_active` na RLS;
- nenhuma dessas migrations remove `owner_id`;
- nenhuma torna `organization_id NOT NULL`;
- a migration `019` adiciona RPC transacional de onboarding, mas nao relaxa RLS.

## 5. Onboarding inicial transacional

O fluxo atual usa:

```txt
/onboarding/organizacao
```

A action chama a RPC autenticada:

```txt
public.create_initial_organization_onboarding(p_name, p_slug)
```

A RPC:

- exige `auth.uid()`;
- usa `SECURITY DEFINER` com `search_path = public`;
- revoga acesso de `public` e `anon`;
- concede execute apenas para `authenticated`;
- cria a organization;
- cria owner membership ativa;
- cria profile minimo ativo ou vincula profile legado ativo sem `organization_id`;
- bloqueia profile inativo;
- bloqueia profile ja vinculado a outra organization;
- bloqueia usuario que ja possui membership ativa.

## 6. Testes RLS gated versionados

Ja existem testes RLS gated versionados no repositorio para:

- `expense_categories`;
- `category-owner-scope`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Os testes RLS gated versionados rodam somente quando o ambiente dedicado esta configurado:

```txt
RUN_RLS_TESTS=true
RLS_TEST_SUPABASE_URL
RLS_TEST_SUPABASE_ANON_KEY
RLS_TEST_SUPABASE_SERVICE_ROLE_KEY
RLS_TEST_USER_A_EMAIL
RLS_TEST_USER_A_PASSWORD
RLS_TEST_USER_B_EMAIL
RLS_TEST_USER_B_PASSWORD
```

No CI comum, sem `RUN_RLS_TESTS=true`, as suites reais ficam desativadas para nao tocar Supabase externo.

## 7. Validacao operacional recente

Gates locais recentes do fluxo de onboarding/RPC:

- `npm run typecheck`;
- `npm run lint`;
- `npm run test -- __tests__/unit/onboarding-route-shell-guards.test.ts`;
- `RUN_RLS_TESTS=false npm run test`;
- `npm run build`.

Validacao recente informada:

```txt
46 arquivos de teste passaram
180 testes passaram
10 testes RLS reais ficaram skipped no gate comum
```

## 8. O que ainda nao esta pronto

Ainda nao foi feito:

- Playwright/E2E;
- RLS Live Gate separado em CI com ambiente Supabase dedicado;
- admin multi-org pleno;
- UX de organization ativa com selector;
- rotas por `orgSlug`;
- billing/Stripe;
- `organization_id NOT NULL`;
- remocao de `owner_id`;
- down migrations automatizadas.

## 9. Proximos passos recomendados

Ordem segura:

1. aplicar e validar a migration `019` em cada ambiente Supabase;
2. adicionar typecheck explicito no CI;
3. adicionar fundacao Playwright;
4. cobrir onboarding inicial com E2E;
5. auditar e aposentar helpers owner-only por etapas;
6. criar RLS Live Gate separado;
7. planejar UX de organization ativa;
8. so depois pensar em rotas por `orgSlug`;
9. billing apenas depois de isolamento/UX estarem maduros;
10. `organization_id NOT NULL` e remocao de `owner_id` apenas em gate futuro.

## 10. Regra de manutencao

Daqui para frente, o README deve ser atualizado de forma enxuta e apontar para este documento quando o assunto for status SaaS/RLS.

Evitar duplicar longos blocos de plano no README.
