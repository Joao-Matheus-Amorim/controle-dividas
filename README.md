# FamilyFinance

FamilyFinance e um SaaS financeiro multi-tenant, mobile-first, seguro e permissionado, em evolucao para producao massiva.

A origem familiar do projeto permanece apenas como contexto historico e validacao inicial de dominio. A direcao vigente esta definida no ADR 0001: o produto deve ser conduzido como uma plataforma SaaS capaz de atender multiplas organizacoes, familias, grupos financeiros ou workspaces, com isolamento de dados, permissoes por organizacao e evolucao incremental.

## Status executivo

| Area | Estado |
| --- | --- |
| Produto | SaaS financeiro multi-tenant em fase transicional endurecida |
| Stack | Next.js 16.2.6, React 19, TypeScript, Tailwind CSS e Supabase |
| Autenticacao | Supabase Auth |
| Multi-tenant | `organizations`, `organization_memberships` e `organization_id` implementados; tabelas tenant-scoped principais com `organization_id NOT NULL` nas migrations `020` a `028` |
| Onboarding | Organizacao inicial criada por RPC transacional autenticada |
| RLS | Organization-aware por membership nas tabelas financeiras principais, `profiles` e permissoes; fallback `organization_id IS NULL` removido nas migrations `030` a `038` |
| Permissoes | Modulos, acoes, escopos, feature permissions e runtime access-control por organizacao ativa |
| UX multi-org | Indicador e troca de organizacao ativa implementados; rotas por `orgSlug` ainda futuras |
| Design system | shadcn/ui por camadas via ADR; primitives `Alert`, `Skeleton` e `Separator` versionados |
| Testes | Unitarios, integracao MSW, guards arquiteturais e suites RLS gated opcionais |
| E2E | Playwright implementado com smoke de auth/rotas e contratos autenticados gated de onboarding, organizacao ativa e rotas protegidas |
| Deploy | Vercel com redeploy manual/controlado conforme fase atual |

## Fontes oficiais de decisao

ADRs:

- `docs/adr/README.md`
- `docs/adr/0001-saas-first-production-positioning.md`
- `docs/adr/0002-active-organization-ux-before-orgslug-routes.md`
- `docs/adr/0003-design-system-and-shadcn-adoption.md`
- `docs/adr/0006-current-saas-transition-architecture.md`

Status/roadmap vivos:

- `docs/SAAS_RLS_LIVE_STATUS.md`
- `docs/SAAS_OPERATIONAL_ROADMAP.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`

Documentos PMBOK e runbooks historicos permanecem como trilha de decisao. Quando houver divergencia, os documentos vivos acima prevalecem para decisao operacional atual.

## Regra principal da fase atual

```txt
Seguranca acima de velocidade.
PR pequeno.
Issue antes do PR.
Sem mudanca funcional escondida em PR documental.
Sem billing antes de isolamento, UX multi-org e permissoes amadurecerem.
Sem rotas por orgSlug antes da UX de organizacao ativa estar clara.
Sem remover owner_id antes de preflight, dry-run, gates e rollback.
```

## Estado SaaS multi-tenant

Implementado:

- `organizations` e `organization_memberships`;
- `organization_id` nas tabelas principais;
- helpers server-side de organizacao ativa;
- queries/actions financeiras escopadas por organizacao ativa;
- RLS organization-aware por membership sem fallback legado `organization_id IS NULL`;
- runtime access-control por organizacao ativa;
- Admin/permissoes com hardening de escopo por organizacao;
- indicador visual e troca explicita de organizacao ativa no layout protegido;
- onboarding inicial por `/onboarding/organizacao` com RPC transacional autenticada para criar organizacao, membership owner e profile inicial;
- hardening `organization_id NOT NULL` aplicado de forma incremental em `expense_categories`, `family_members`, `expenses`, `payable_bills`, `receivable_incomes`, `banks`, `user_module_permissions`, `user_feature_permissions` e `profiles`;
- Playwright E2E com foundation, smoke de auth/rotas e contratos autenticados gated para onboarding inicial, usuario com organizacao ativa e guard de onboarding.

Ainda transicional:

- `owner_id` ainda existe por compatibilidade e para write ownership;
- a migration history ainda deve versionar, em PR proprio, a limpeza idempotente das policies antigas `*_own`/`*_family` que foram removidas no Supabase vivo durante a validacao;
- rotas ainda usam `/protected`;
- rotas por `orgSlug` ainda nao foram implementadas;
- billing ainda nao foi implementado;
- cobertura E2E ainda nao e completa para todos os modulos e perfis.

## Migrations SaaS/RLS/hardening relevantes

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

Observacao operacional: a migration `019_initial_organization_onboarding_rpc.sql` precisa estar aplicada no Supabase de cada ambiente antes de depender do onboarding inicial em runtime. As migrations `020` a `028` exigem evidencia recente de preflight/dry-run com zero linhas bloqueadas ou ambiguas para suas tabelas-alvo. As migrations `030` a `038` removem o fallback RLS legado `organization_id IS NULL`.

## Testes RLS gated

As suites RLS reais ficam desligadas no fluxo comum. Para gates locais comuns, manter:

```powershell
$env:RUN_RLS_TESTS = "false"
```

Para validar RLS real em Supabase dedicado, configurar:

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

Detalhes de ambiente e variaveis RLS ficam em `docs/SAAS_RLS_LIVE_STATUS.md` e `docs/rls/RLS_TEST_HARNESS.md`.

## Playwright E2E

A suite Playwright roda pelo comando:

```bash
npm run test:e2e
```

Os fluxos autenticados e data-changing sao gated e nao rodam por padrao. Use apenas usuarios e projeto Supabase dedicados para E2E. Nao usar producao nem usuario real.

Detalhes dos contratos e variaveis ficam em `docs/e2e/PLAYWRIGHT_ONBOARDING_TESTS.md` e `docs/e2e/PLAYWRIGHT_COVERAGE_ROADMAP.md`.

## Como rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra:

```txt
http://localhost:3000
```

As variaveis de ambiente ficam documentadas em `.env.example`. Nao versionar secrets reais.

## Scripts disponiveis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:run
npm run test:watch
npm run test:e2e
```

Gate recomendado antes de qualquer PR:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

## Rotas principais

Publicas/Auth:

```txt
/
/auth/login
/auth/sign-up
/auth/sign-up-success
/auth/forgot-password
/auth/update-password
/auth/error
/auth/confirm
/onboarding/organizacao
```

Protegidas:

```txt
/protected
/protected/pessoas
/protected/gastos
/protected/contas-a-pagar
/protected/contas-a-receber
/protected/bancos
/protected/relatorios
/protected/configuracoes
/protected/admin
/protected/admin/usuarios
/protected/admin/permissoes
```

## Modulos funcionais atuais

- Dashboard contextual por organizacao/permissao;
- Pessoas;
- Gastos;
- Contas a pagar / Dividas;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- Admin;
- Usuarios familiares/organizacionais;
- Permissoes por modulo, acao, escopo e feature.

## Regra oficial de permissoes

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
Tudo isso acontece dentro de uma organizacao.
```

Escopos:

```txt
own      -> usuario acessa apenas o proprio membro financeiro vinculado
selected -> usuario acessa apenas membros escolhidos pelo Admin
family   -> usuario acessa todos os membros autorizados dentro da organizacao
```

## Estrutura de pastas

```txt
controle-dividas/
├─ app/
├─ components/
├─ lib/
├─ supabase/migrations/
├─ __tests__/
├─ docs/
│  ├─ adr/
│  ├─ audits/
│  ├─ e2e/
│  ├─ pm/
│  ├─ rls/
│  └─ roadmaps/
├─ public/
├─ proxy.ts
├─ package.json
├─ playwright.config.ts
├─ tailwind.config.ts
├─ vitest.config.ts
└─ vercel.json
```
