# SaaS RLS Live Status

Issue: #224

## 1. Objetivo

Este documento registra o estado vivo atual da transicao SaaS multi-tenant do FamilyFinance apos a conclusao do bloco principal de RLS financeira, do onboarding inicial por RPC transacional, da evolucao da cobertura Playwright/E2E gated e do inicio controlado de hardening `organization_id NOT NULL`.

Ele complementa o `README.md` sem apagar o historico e sem substituir documentos PMBOK ja existentes.

## 2. Estado atual resumido

O projeto esta em modo:

```txt
SaaS multi-tenant transicional com RLS financeira principal aplicada, onboarding inicial transacional, cobertura E2E principal gated e hardening parcial de organization scope.
```

Isso significa:

- `organizations` e `organization_memberships` existem;
- `organization_id` existe nas tabelas principais;
- principais modulos financeiros usam organization-aware queries/actions;
- RLS financeira principal ja foi migrada para organization-aware com fallback legado;
- o onboarding inicial cria organization, owner membership e profile/link por RPC transacional autenticada;
- Playwright/E2E possui cobertura versionada para public/auth smoke, rotas protegidas, contratos autenticados gated, permission-sensitive gated e fluxos data-changing com cleanup;
- `expense_categories.organization_id` ja foi endurecido como `NOT NULL` pela migration `020`;
- `family_members.organization_id` ja foi endurecido como `NOT NULL` pela migration `021`;
- `owner_id` ainda existe e continua sendo usado como compatibilidade;
- `organization_id` ainda e nullable nas demais tabelas tenant-scoped nao endurecidas;
- rotas por `orgSlug` ainda nao existem;
- selector de organizacao ainda nao existe;
- billing/Stripe ainda nao foi implementado.

## 3. Migrations SaaS/RLS/hardening atuais

As migrations relevantes para SaaS/RLS/hardening ja mergeadas sao:

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
020_expense_categories_organization_scope_hardening.sql
021_family_members_organization_scope_hardening.sql
```

Observacoes operacionais:

```txt
A migration 019 precisa estar aplicada no Supabase de cada ambiente antes de depender do onboarding inicial em runtime.
As migrations 020 e 021 exigem evidencia recente de preflight/dry-run com zero linhas bloqueadas ou ambiguas para suas tabelas-alvo.
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
OU legado organization_id IS NULL + owner_id onde a tabela ainda permite estado legado

Escrita:
owner/organizacao ativa durante transicao, conforme guardas de write path
```

Observacoes importantes:

- `expense_categories` precisou de hotfix de escrita na migration `009` e depois recebeu hardening `NOT NULL` na migration `020`;
- `family_members` recebeu hardening `NOT NULL` na migration `021` apos o seed default passar a incluir `organization_id`;
- `banks` preserva comportamento historico e nao depende de `family_members.is_active` na RLS;
- nenhuma dessas migrations remove `owner_id`;
- as demais tabelas tenant-scoped continuam transicionais ate hardening especifico futuro;
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

## 7. Playwright/E2E versionado

A cobertura Playwright/E2E principal ja foi adicionada e documentada em `docs/e2e/PLAYWRIGHT_COVERAGE_ROADMAP.md`.

Blocos atualmente cobertos no roadmap:

- public/auth smoke;
- protected unauthenticated redirects;
- onboarding e active organization gated;
- protected app shell e rotas protegidas principais gated;
- rotas admin gated;
- limited-user hidden navigation e direct route denial gated;
- data-changing flows gated com cleanup-backed coverage para create, update e remaining record lifecycle.

Observacoes importantes:

- fluxos autenticados e data-changing continuam skipped-by-default;
- fluxos data-changing dependem de flags explicitas e cleanup documentado;
- essa cobertura nao significa RLS final, billing, rotas por `orgSlug`, selector de organizacao ou schema final.

## 8. Validacao operacional recente

Gates do CI comum:

- validacao de ambiente obrigatorio;
- `npm ci`;
- `npm audit --audit-level=moderate`;
- `npm run lint`;
- `npm run typecheck`;
- `npm run build`;
- `npm run test`.

Validacao recente informada no gate comum:

```txt
Suites unitarias, integracao, guards arquiteturais e testes RLS reais skipped-by-default rodam no CI comum.
Suites Playwright autenticadas/data-changing permanecem gated e nao rodam por padrao sem contrato de ambiente.
```

## 9. O que ainda nao esta pronto

Ainda nao foi feito:

- RLS Live Gate separado em CI com ambiente Supabase dedicado;
- admin multi-org pleno;
- UX de organization ativa com selector;
- rotas por `orgSlug`;
- billing/Stripe;
- `organization_id NOT NULL` nas demais tabelas tenant-scoped transicionais;
- remocao de `owner_id`;
- down migrations automatizadas.

## 10. Proximos passos recomendados

Ordem segura:

1. manter CI comum verde com lint, typecheck, build e testes;
2. continuar reconciliando documentacao quando blocos de E2E/RLS/schema mudarem;
3. auditar e aposentar helpers owner-only por etapas;
4. criar RLS Live Gate separado;
5. continuar hardening `organization_id NOT NULL` por tabela, somente com preflight, dry-run, rollback e guard;
6. planejar UX de organization ativa;
7. so depois pensar em rotas por `orgSlug`;
8. billing apenas depois de isolamento/UX estarem maduros;
9. remocao de `owner_id` apenas em gate futuro apos schema/read-path final.

## 11. Regra de manutencao

Daqui para frente, o README deve ser atualizado de forma enxuta e apontar para este documento quando o assunto for status SaaS/RLS.

Evitar duplicar longos blocos de plano no README.