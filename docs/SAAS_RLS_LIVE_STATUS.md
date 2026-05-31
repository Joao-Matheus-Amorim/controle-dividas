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
- rotas por `orgSlug` existem em `/org/[orgSlug]` com `/protected` mantido como compatibilidade pelo ADR 0007;
- `/protected` e `/org/[orgSlug]` usam implementacoes compartilhadas em `features/protected-pages`;
- Server Actions revalidam caminhos por helper central que cobre `/protected` e `/org/[orgSlug]`;
- E2E gated `tests/e2e/orgslug-authenticated-gated.spec.ts` versiona slug permitido, slug sem membership e compatibilidade `/protected`;
- contrato local de planos existe em `lib/billing/plans.ts`, alinhado ao schema, com status em Configuracoes e entrada de checkout runtime;
- fronteira de configuracao Stripe existe em `lib/billing/stripe-config.ts` com `ENABLE_STRIPE_CHECKOUT` e fail-fast de env vars em runtime de producao;
- checkout runtime usa Stripe Checkout Session para owner/admin da organizacao resolvida no servidor;
- evidencia real de checkout Stripe ainda esta pendente porque nao ha conta Stripe de teste/credenciais configuradas;
- webhook, portal, assinatura sincronizada e enforcement comercial ainda nao foram implementados.
- GAP-015 possui contrato de planejamento em `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`, plano de schema/redaction em `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`, schema/read-side RLS de audit events em `supabase/migrations/040_audit_events_schema.sql`, write boundary de audit events em `supabase/migrations/041_audit_events_write_boundary.sql` via `record_audit_event`, billing checkout audit runtime e billing checkout rate limit runtime em `app/protected/configuracoes/billing-actions.ts` para `billing.checkout.start` sem webhook, portal ou retention, com rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true`, admin permission audit runtime e admin permission rate limit runtime em `app/protected/admin/actions.ts` para `admin.permission.update` e `admin.feature_permission.update`, admin user audit runtime e admin user rate limit runtime em `app/protected/admin/actions.ts` para `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete` e `admin.user.status.update`, payable bill audit runtime, payable delete rate limit runtime, payable status rate limit runtime, payable write audit runtime e payable write rate limit runtime em `app/protected/contas-a-pagar/actions.ts` para `finance.payable.status.update`, `finance.payable.delete`, `finance.payable.create` e `finance.payable.update`, receivable income audit runtime, receivable delete rate limit runtime, receivable status rate limit runtime, receivable write audit runtime e receivable write rate limit runtime em `app/protected/contas-a-receber/actions.ts` para `finance.receivable.status.update`, `finance.receivable.delete`, `finance.receivable.create` e `finance.receivable.update`, expense audit runtime, expense delete rate limit runtime, expense write audit runtime e expense write rate limit runtime em `app/protected/gastos/actions.ts` para `finance.expense.delete`, `finance.expense.create` e `finance.expense.update`, category delete audit runtime e category delete rate limit runtime em `app/protected/configuracoes/actions.ts` para `finance.category.delete`, category write audit runtime e category write rate limit runtime em `app/protected/configuracoes/actions.ts` para `finance.category.create` e `finance.category.update`, bank audit runtime, bank delete rate limit runtime, bank balance rate limit runtime, bank write audit runtime e bank write rate limit runtime em `app/protected/bancos/actions.ts` para `finance.bank.balance.update`, `finance.bank.delete`, `finance.bank.create` e `finance.bank.update`, member limit audit runtime e member limit rate limit runtime em `lib/finance/member-limit-controls.ts`, `app/protected/configuracoes/actions.ts` e `app/protected/pessoas/actions.ts` para `finance.member.limit.update`, member status audit runtime e member status rate limit runtime em `lib/finance/member-status-controls.ts` e `app/protected/pessoas/actions.ts` para `finance.member.status.update`, member write audit runtime e member write rate limit runtime em `lib/finance/member-write-controls.ts` e `app/protected/pessoas/actions.ts` para `finance.member.create` e `finance.member.update`, plano de rate limiting em `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md` e plano de data retention em `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`, com audit event retention preflight e cleanup runtime em `app/protected/configuracoes/audit-retention-actions.ts` e `supabase/migrations/042_audit_events_retention_cleanup.sql` para contagem e limpeza confirmada owner/admin de `audit_events` da organizacao ativa acima de 365 dias, mas remaining broader rate limiting e data retention cleanup runtime controls ainda nao foram implementados.
- Login rate limit runtime existe em `app/auth/login/actions.ts` para `auth.login.password`, com actor por email normalizado, escopo `public-auth`, buckets compartilhados para email ausente/invalido, rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true` e sem audit runtime porque o write boundary de audit events exige usuario autenticado e membership.
- Signup authorized email rate limit runtime existe em `app/auth/sign-up/actions.ts` para `auth.signup.authorized_email.check`, com actor por email normalizado, escopo `public-auth`, rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true` e sem audit runtime porque o write boundary de audit events exige usuario autenticado e membership.
- Signup submit rate limit runtime existe em `app/auth/sign-up/actions.ts` para `auth.signup.submit`, com actor por email normalizado, escopo `public-auth`, buckets compartilhados para email ausente/invalido, lookup server-side de perfil autorizado antes do Supabase signup, rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true` e sem audit runtime porque o write boundary de audit events exige usuario autenticado e membership.
- Auth confirm rate limit runtime existe em `app/auth/confirm/route.ts` para `auth.confirm.verify`, com actor por cliente publico, target por tipo OTP, escopo `public-auth`, rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true` e sem audit runtime porque o write boundary de audit events exige usuario autenticado e membership.
- Password reset rate limit runtime existe em `app/auth/forgot-password/actions.ts` para `auth.password_reset.request`, com actor por email normalizado, escopo `public-auth`, rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true` e sem audit runtime porque o write boundary de audit events exige usuario autenticado e membership.
- Password update rate limit runtime existe em `app/auth/update-password/actions.ts` para `auth.password_update.submit`, com actor pelo auth user id atual, bucket compartilhado `missing-session`, escopo `public-auth`, rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true` e sem audit runtime porque o write boundary de audit events exige usuario autenticado e membership.

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
039_drop_legacy_owner_family_policies.sql
040_audit_events_schema.sql
041_audit_events_write_boundary.sql
042_audit_events_retention_cleanup.sql
```

Observacoes operacionais:

```txt
A migration 019 precisa estar aplicada no Supabase de cada ambiente antes de depender do onboarding inicial em runtime.
As migrations 020 a 028 exigem evidencia recente de preflight/dry-run com zero linhas bloqueadas ou ambiguas para suas tabelas-alvo.
As migrations 030 a 038 removem o fallback RLS legado `organization_id IS NULL`.
A migration 039 remove policies historicas owner/family que podiam existir em ambientes que aplicaram migrations antigas.
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
- a migration `039_drop_legacy_owner_family_policies.sql` versiona a limpeza idempotente das policies antigas `*_own`/`*_family` ja aplicada no Supabase vivo validado.

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
- active organization switch gated cleanup-backed;
- protected app shell e rotas protegidas principais gated;
- rotas admin gated;
- limited-user hidden navigation e direct route denial gated;
- data-changing flows gated com cleanup-backed coverage para create, update e remaining record lifecycle.

Observacoes importantes:

- fluxos autenticados e data-changing continuam skipped-by-default;
- fluxos data-changing dependem de flags explicitas e cleanup documentado;
- essa cobertura nao significa billing ou remocao de `owner_id`.

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

- execucao verde do RLS Live Gate no GitHub Actions com ambiente Supabase dedicado e artifact `rls-live-gate-evidence-*`;
- Execucao real dedicada do E2E `RUN_ORGSLUG_E2E=true` para registrar evidencia verde de `/org/[orgSlug]`;
- conta Stripe de teste/credenciais e evidencia real de checkout;
- webhook/portal Stripe, assinatura sincronizada e enforcement comercial;
- remaining broader rate limiting e data retention cleanup runtime controls;
- remocao de `owner_id`;
- down migrations automatizadas.

## 10. Proximos passos recomendados

Ordem segura:

1. manter CI comum verde com lint, typecheck, build e testes;
2. executar RLS Live Gate em CI dedicado depois de configurar secrets/vars;
   - o workflow ja publica GitHub Step Summary e artifact `rls-live-gate-evidence-*`;
   - registrar evidencia neste status somente depois de uma execucao real verde;
3. executar E2E especifico para troca de organizacao ativa com usuario multi-org dedicado;
4. rodar E2E dedicado para rotas por `orgSlug` seguindo ADR 0007 quando o ambiente dedicado estiver configurado;
5. billing apenas depois de isolamento/UX estarem maduros;
6. planejar GAP-015 por issues separadas antes de runtime de rate limiting ou retention;
7. remocao de `owner_id` apenas em gate futuro apos schema/read-path final e rollback.

## 11. Regra de manutencao

Daqui para frente, o README deve ser atualizado de forma enxuta e apontar para este documento e para `docs/SAAS_OPERATIONAL_ROADMAP.md` quando o assunto for status SaaS/RLS.

Evitar duplicar longos blocos de plano no README.
