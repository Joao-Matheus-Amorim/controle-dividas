# SaaS RLS Live Status

Issue: #224

## 1. Objetivo

Este documento registra o estado vivo atual da transicao SaaS multi-tenant do FamilyFinance depois da conclusao do hardening de `organization_id`, da remocao do fallback RLS legado, do onboarding inicial por RPC transacional e da evolucao da cobertura Playwright/E2E gated.

Ele complementa o `README.md` e aponta para o roadmap operacional em `docs/SAAS_OPERATIONAL_ROADMAP.md`.

## 2. Estado atual resumido

O projeto esta em modo:

```txt
SaaS multi-tenant transicional endurecido: organization_id e obrigatorio nas tabelas tenant-scoped principais, RLS usa membership por organization, e owner_id ainda existe como compatibilidade/write ownership.
```

Isso significa:

- `organizations` e `organization_memberships` existem;
- `organization_id` existe nas tabelas principais;
- as tabelas tenant-scoped principais foram endurecidas com `organization_id NOT NULL` nas migrations `020` a `028`;
- os modulos financeiros, Admin, profiles e permissoes usam queries/actions escopadas por organizacao ativa;
- as policies RLS finais das migrations `030` a `038` removem o fallback `organization_id IS NULL`;
- o onboarding inicial cria organization, owner membership e profile/link por RPC transacional autenticada;
- Playwright/E2E possui cobertura versionada para public/auth smoke, rotas protegidas, contratos autenticados gated, permission-sensitive gated e fluxos data-changing com cleanup;
- `owner_id` ainda existe e continua sendo usado como compatibilidade e write ownership;
- rotas por `orgSlug` ainda nao existem;
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
022_expenses_organization_scope_hardening.sql
023_payable_bills_organization_scope_hardening.sql
024_receivable_incomes_organization_scope_hardening.sql
025_banks_organization_scope_hardening.sql
026_user_module_permissions_organization_scope_hardening.sql
027_user_feature_permissions_organization_scope_hardening.sql
028_profiles_organization_scope_hardening.sql
029_drop_one_active_membership_per_user_limit.sql
030_expense_categories_rls_remove_legacy_fallback.sql
031_family_members_rls_remove_legacy_fallback.sql
032_expenses_rls_remove_legacy_fallback.sql
033_payable_bills_rls_remove_legacy_fallback.sql
034_receivable_incomes_rls_remove_legacy_fallback.sql
035_banks_rls_remove_legacy_fallback.sql
036_profiles_rls_remove_legacy_fallback.sql
037_user_module_permissions_rls_remove_legacy_fallback.sql
038_user_feature_permissions_rls_remove_legacy_fallback.sql
```

Observacoes operacionais:

```txt
A migration 019 precisa estar aplicada no Supabase de cada ambiente antes de depender do onboarding inicial em runtime.
As migrations 020 a 028 exigem evidencia recente de preflight/dry-run com zero linhas bloqueadas ou ambiguas para suas tabelas-alvo.
As migrations 030 a 038 removem o fallback RLS legado `organization_id IS NULL`.
```

## 4. RLS atual

Tabelas ja cobertas por RLS organization-aware:

- `expense_categories`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Padrao aplicado:

```txt
Leitura:
membership ativa por organization_id via public.is_organization_member(organization_id)

Escrita:
owner_id = auth.uid() e membership ativa na organization

Profiles:
auth_user_id = auth.uid() OU membership ativa por organization_id
```

Observacoes importantes:

- `organization_id NOT NULL` ja foi aplicado nas tabelas tenant-scoped listadas acima;
- nenhuma dessas migrations remove `owner_id`;
- `banks` preserva comportamento historico e nao depende de `family_members.is_active` na RLS;
- a migration `019` adiciona RPC transacional de onboarding, mas nao relaxa RLS;
- a limpeza manual das policies antigas `*_own`/`*_family` ja foi aplicada no Supabase vivo validado, mas ainda deve ser versionada em migration idempotente propria para manter a cadeia de migrations reproduzivel.

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

A cobertura Playwright/E2E principal esta documentada em `docs/e2e/PLAYWRIGHT_COVERAGE_ROADMAP.md`.

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
- essa cobertura nao significa billing, rotas por `orgSlug` ou remocao de `owner_id`.

## 8. Validacao operacional recente

### Evidencia operacional de 2026-05-28

No Supabase normal usado para validacao local, as policies RLS finais de remocao do fallback legado foram aplicadas para:

- `expense_categories`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Tambem foram removidas as policies antigas owner-centric que ainda permitiam leitura/escrita por `owner_id` sem membership ativa:

- policies `*_own` das tabelas financeiras;
- policies `profiles_*_family`;
- policies `feature_permissions_*_family`.

Apos esse alinhamento do ambiente vivo, o gate focado RLS confirmou:

```txt
npm run test -- __tests__/unit/runtime-env-policy-guards.test.ts \
  __tests__/integration/rls/family-members.rls.test.ts \
  __tests__/integration/rls/category-owner-scope.rls.test.ts \
  __tests__/integration/rls/profiles.rls.test.ts \
  __tests__/integration/rls/payable-bills.rls.test.ts \
  __tests__/integration/rls/user-feature-permissions.rls.test.ts \
  __tests__/integration/rls/banks.rls.test.ts \
  __tests__/integration/rls/receivable-incomes.rls.test.ts \
  __tests__/integration/rls/expenses.rls.test.ts

9 test files passed; 18 tests passed.
```

Em seguida, o gate local completo foi reportado como aprovado por Joao Matheus:

```txt
npm audit --audit-level=moderate
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

Observacoes do gate:

- `npm audit --audit-level=moderate`: 0 vulnerabilidades;
- `npm run lint`: 0 erros e 1 warning conhecido em `components/app/app-data-table.tsx` por `useReactTable` e `react-hooks/incompatible-library`;
- `npm run test:e2e`: 33 passed, 22 skipped no contrato local reportado.

## 9. O que ainda nao esta pronto

Ainda nao foi feito:

- migration idempotente para versionar a limpeza das policies antigas `*_own`/`*_family` removidas manualmente no Supabase vivo;
- RLS Live Gate separado em CI com ambiente Supabase dedicado e evidencia de execucao;
- rotas por `orgSlug`;
- billing/Stripe;
- remocao de `owner_id`;
- down migrations automatizadas.

## 10. Proximos passos recomendados

Ordem segura:

1. criar migration idempotente para remover policies antigas `*_own`/`*_family` da cadeia versionada;
2. manter CI comum verde com lint, typecheck, build e testes;
3. executar RLS Live Gate em CI dedicado depois de configurar secrets/vars;
4. criar E2E especifico para troca de organizacao ativa, se houver usuario multi-org dedicado;
5. planejar rotas por `orgSlug`;
6. billing apenas depois de isolamento/UX estarem maduros;
7. remocao de `owner_id` apenas em gate futuro apos schema/read-path final e rollback.

## 11. Regra de manutencao

Daqui para frente, o README deve ser atualizado de forma enxuta e apontar para este documento e para `docs/SAAS_OPERATIONAL_ROADMAP.md` quando o assunto for status SaaS/RLS.

Evitar duplicar longos blocos de plano no README.
