# FamilyFinance

FamilyFinance é um SaaS financeiro multi-tenant, mobile-first, seguro e permissionado, em evolução para produção massiva.

A origem familiar do projeto permanece apenas como contexto histórico e validação inicial de domínio. A direção vigente está definida no ADR 0001: o produto deve ser conduzido como uma plataforma SaaS capaz de atender múltiplas organizações, famílias, grupos financeiros ou workspaces, com isolamento de dados, permissões por organização e evolução incremental.

## Status executivo

| Área | Estado |
| --- | --- |
| Produto | SaaS financeiro multi-tenant em fase transicional endurecida |
| Stack | Next.js 16.2.6, React 19, TypeScript, Tailwind CSS e Supabase |
| Autenticação | Supabase Auth |
| Multi-tenant | `organizations`, `organization_memberships` e `organization_id` implementados |
| Onboarding | Organização inicial criada por RPC transacional autenticada |
| RLS | Organization-aware transicional nas tabelas financeiras principais, profiles e permissões |
| Permissões | Módulos, ações, escopos, feature permissions e runtime access-control por organização ativa |
| UX multi-org | Indicador de organização ativa implementado; selector e rotas por `orgSlug` ainda futuros |
| Design system | shadcn/ui por camadas via ADR; primitives `Alert`, `Skeleton` e `Separator` versionados |
| Testes | Unitários, integração MSW, guards arquiteturais e suites RLS gated opcionais |
| E2E | Playwright implementado com smoke de auth/rotas e contratos autenticados gated de onboarding |
| Deploy | Vercel com redeploy manual/controlado conforme fase atual |

## Fontes oficiais de decisão

ADRs:

- `docs/adr/README.md`
- `docs/adr/0001-saas-first-production-positioning.md`
- `docs/adr/0002-active-organization-ux-before-orgslug-routes.md`
- `docs/adr/0003-design-system-and-shadcn-adoption.md`

PMBOK/status:

- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`
- `docs/pm/08_RELATORIO_PROGRESSO_SAAS_MULTI_TENANT.md`
- `docs/SAAS_RLS_LIVE_STATUS.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`

## Regra principal da fase atual

```txt
Segurança acima de velocidade.
PR pequeno.
Issue antes do PR.
Sem mudança funcional escondida em PR documental.
Sem billing antes de isolamento, UX multi-org e permissões amadurecerem.
Sem rotas por orgSlug antes da UX de organização ativa estar clara.
Sem remover owner_id ou tornar organization_id NOT NULL antes de backfill, gates e rollback.
```

## Estado SaaS multi-tenant

Implementado:

- `organizations` e `organization_memberships`;
- `organization_id` nas tabelas principais;
- helpers server-side de organização ativa;
- queries/actions financeiras escopadas por organização ativa + fallback legado;
- RLS organization-aware transicional;
- runtime access-control por organização ativa;
- Admin/permissões com hardening de escopo por organização;
- indicador visual de organização ativa no layout protegido;
- onboarding inicial por `/onboarding/organizacao` com RPC transacional autenticada para criar organização, membership owner e profile inicial;
- Playwright E2E com foundation, smoke de auth/rotas e contratos autenticados gated para onboarding inicial, usuário com organização ativa e guard de onboarding.

Ainda transicional:

- `owner_id` ainda existe por compatibilidade;
- `organization_id` ainda é nullable;
- fallback legado `organization_id IS NULL + owner_id` ainda existe;
- rotas ainda usam `/protected`;
- selector/troca de organização ainda não foi implementado;
- billing ainda não foi implementado;
- cobertura E2E ainda não é completa para todos os módulos e perfis.

## Migrations SaaS/RLS relevantes

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

Observação operacional: a migration `019_initial_organization_onboarding_rpc.sql` precisa estar aplicada no Supabase do ambiente antes de depender do onboarding inicial em runtime.

## Testes RLS gated

As suites RLS reais ficam desligadas no fluxo comum. Para gates locais comuns, manter:

```powershell
$env:RUN_RLS_TESTS = "false"
```

Detalhes de ambiente e variáveis RLS ficam em `docs/SAAS_RLS_LIVE_STATUS.md` e `docs/rls/RLS_TEST_HARNESS.md`.

## Playwright E2E

A suíte Playwright roda pelo comando:

```bash
npm run test:e2e
```

Os fluxos autenticados são gated e não rodam por padrão. Use apenas usuários e projeto Supabase dedicados para E2E. Não usar produção nem usuário real.

Detalhes dos contratos e variáveis ficam em `docs/e2e/PLAYWRIGHT_ONBOARDING_TESTS.md`.

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

As variáveis de ambiente ficam documentadas em `.env.example`. Não versionar secrets reais.

## Scripts disponíveis

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

Públicas/Auth:

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

## Módulos funcionais atuais

- Dashboard contextual por organização/permissão;
- Pessoas;
- Gastos;
- Contas a pagar / Dívidas;
- Contas a receber;
- Bancos;
- Relatórios;
- Configurações;
- Admin;
- Usuários familiares/organizacionais;
- Permissões por módulo, ação, escopo e feature.

## Regra oficial de permissões

```txt
Role define o padrão inicial.
Admin define a permissão real.
Permissão sempre vence o role.
Tudo isso acontece dentro de uma organização.
```

Escopos:

```txt
own      -> usuário acessa apenas o próprio membro financeiro vinculado
selected -> usuário acessa apenas membros escolhidos pelo Admin
family   -> usuário acessa todos os membros autorizados dentro da organização
```

## Design system

O design system segue ADR 0003.

Princípios:

- shadcn/ui como kit base oficial;
- adoção controlada por camadas;
- primitives em `components/ui`;
- componentes internos em `components/app`;
- componentes por domínio em `components/<dominio>`;
- formulários/dialogs financeiros compartilhados em `components/finance`.

Primitives versionados atualmente:

```txt
Alert
Skeleton
Separator
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
├─ vercel.json
```
