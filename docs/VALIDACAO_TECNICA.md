# Validacao Tecnica - FamilyFinance

Este documento registra a validacao tecnica viva do FamilyFinance no estado atual do codigo.

Ele deve ser usado como checklist operacional para validar ambiente, banco, autenticacao, permissoes, modulos financeiros, testes e deploy.

## Estado atual validado por inspecao do codigo

O projeto esta em fase de MVP Web/PWA funcional avancado.

Ja existem no codigo:

- Next.js App Router;
- React 19;
- TypeScript;
- Tailwind CSS;
- Supabase Auth;
- Supabase Database;
- Supabase SSR;
- Supabase service role server-side;
- protecao global de sessao via `proxy.ts`;
- rotas publicas de autenticacao;
- rotas protegidas compativeis em `/protected`;
- rotas organization-aware em `/org/[orgSlug]`;
- Admin familiar;
- usuarios familiares;
- vinculo entre `auth.users` e `profiles`;
- permissoes por modulo;
- permissoes por acao;
- escopo `own`, `selected` e `family`;
- `allowed_member_ids` por permissao;
- `user_feature_permissions` no banco e nos tipos;
- Dashboard contextual por permissao;
- menu desktop/mobile dinamico por permissao;
- Pessoas;
- Gastos;
- Contas a pagar;
- Contas a receber;
- Bancos;
- Relatorios;
- Configuracoes;
- migrations Supabase organizadas;
- testes unitarios;
- testes de integracao com MSW;
- PWA manifest;
- deploy de producao automatizado apos CI verde na `main`, com fallback manual via `.github/workflows/deploy.yml`, aplicando backend Supabase e frontend Vercel.
- CI com `npm audit --audit-level=moderate`, Vitest `4.1.8`, lint, typecheck, testes e build.
- Dependabot semanal para npm e GitHub Actions, com `open-pull-requests-limit` baixo para evitar excesso de PRs automaticas e com major updates ignorados para entrarem apenas em PR dedicado.
- CodeQL para analise estatica de JavaScript/TypeScript em PR, push na `main`, agenda semanal e disparo manual.
- PRs do Dependabot usam placeholders nao-secretos de Supabase apenas para validacao de dependencia na CI; secrets reais continuam obrigatorias para PRs humanos, push na `main` e deploy.

## Arquivos tecnicos centrais

### Autenticacao e sessao

```txt
proxy.ts
lib/supabase/proxy.ts
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/admin.ts
app/auth/confirm/route.ts
app/auth/sign-up/actions.ts
components/login-form.tsx
components/sign-up-form.tsx
components/forgot-password-form.tsx
components/update-password-form.tsx
```

### Permissoes e perfis

```txt
lib/finance/access-control.ts
lib/finance/admin-server.ts
lib/finance/permissions.ts
lib/finance/profile-linking.ts
app/protected/admin/actions.ts
components/finance/permissions-form.tsx
```

### Dados financeiros

```txt
lib/finance/server.ts
lib/finance/banks-server.ts
lib/finance/reports-server.ts
lib/finance/calculations.ts
```

### Modulos protegidos

```txt
app/protected/page.tsx
app/protected/layout.tsx
app/protected/pessoas/page.tsx
app/protected/gastos/page.tsx
app/protected/contas-a-pagar/page.tsx
app/protected/contas-a-receber/page.tsx
app/protected/bancos/page.tsx
app/protected/relatorios/page.tsx
app/protected/configuracoes/page.tsx
app/protected/admin/page.tsx
app/protected/admin/usuarios/page.tsx
app/protected/admin/permissoes/page.tsx
app/org/[orgSlug]/page.tsx
app/org/[orgSlug]/gastos/page.tsx
features/protected-pages/
```

## Variaveis de ambiente obrigatorias

Crie `.env.local` a partir de `.env.example`.

Obrigatorias para o funcionamento atual:

```env
NEXT_PUBLIC_SUPABASE_URL=URL_DO_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=CHAVE_ANON_PUBLICA_DO_SUPABASE
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=CHAVE_PUBLICA_DO_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=CHAVE_SERVICE_ROLE_DO_SUPABASE
ADMIN_EMAIL=EMAIL_DO_ADMIN_FAMILIAR
```

Regras:

- `NEXT_PUBLIC_SUPABASE_URL` e obrigatoria.
- O projeto aceita `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` e obrigatoria para operacoes administrativas server-side.
- Nunca usar `NEXT_PUBLIC_` na service role.
- `ADMIN_EMAIL` e o e-mail que cria/garante o Admin familiar inicial.

Secrets obrigatorios para deploy automatizado no GitHub Actions:

```env
SUPABASE_DB_URL=POSTGRES_DSN_DO_SUPABASE_PARA_MIGRATIONS
VERCEL_TOKEN=TOKEN_DA_VERCEL
VERCEL_ORG_ID=ID_DA_ORGANIZACAO_VERCEL
VERCEL_PROJECT_ID=ID_DO_PROJETO_VERCEL
```

Regras de deploy:

- `SUPABASE_DB_URL` e secret de CI/CD para `supabase db push`; nao e env runtime do app.
- `VERCEL_ORG_ID` e `VERCEL_PROJECT_ID` evitam prompt/link interativo da Vercel no runner.
- O job aplica migrations Supabase antes do deploy frontend Vercel.
- Dependabot e CodeQL nao executam deploy e nao dependem de secrets de Supabase ou Vercel.

## Migrations obrigatorias

O historico versionado atual vai de `001` ate `043`. Em operacao normal, o deploy automatizado aplica esta cadeia com `supabase db push` usando `SUPABASE_DB_URL`.

Se for necessario aplicar manualmente, execute no Supabase SQL Editor nesta ordem, sem pular arquivos:

```txt
supabase/migrations/001_family_finance_schema.sql
supabase/migrations/002_dedupe_and_seed_constraints.sql
supabase/migrations/003_admin_profiles_permissions.sql
supabase/migrations/004_permission_scope_and_features.sql
supabase/migrations/005_payable_bill_types.sql
supabase/migrations/006_organizations_memberships.sql
supabase/migrations/007_add_organization_id_columns.sql
supabase/migrations/008_expense_categories_organization_rls.sql
supabase/migrations/009_expense_categories_owner_write_rls.sql
supabase/migrations/010_family_members_organization_rls.sql
supabase/migrations/011_expenses_organization_rls.sql
supabase/migrations/012_payable_bills_organization_rls.sql
supabase/migrations/013_receivable_incomes_organization_rls.sql
supabase/migrations/014_banks_organization_rls.sql
supabase/migrations/015_profiles_organization_rls.sql
supabase/migrations/016_user_module_permissions_organization_rls.sql
supabase/migrations/017_user_feature_permissions_organization_rls.sql
supabase/migrations/018_one_active_membership_per_user.sql
supabase/migrations/019_initial_organization_onboarding_rpc.sql
supabase/migrations/020_expense_categories_organization_scope_hardening.sql
supabase/migrations/021_family_members_organization_scope_hardening.sql
supabase/migrations/022_expenses_organization_scope_hardening.sql
supabase/migrations/023_payable_bills_organization_scope_hardening.sql
supabase/migrations/024_receivable_incomes_organization_scope_hardening.sql
supabase/migrations/025_banks_organization_scope_hardening.sql
supabase/migrations/026_user_module_permissions_organization_scope_hardening.sql
supabase/migrations/027_user_feature_permissions_organization_scope_hardening.sql
supabase/migrations/028_profiles_organization_scope_hardening.sql
supabase/migrations/029_drop_one_active_membership_per_user_limit.sql
supabase/migrations/030_expense_categories_rls_remove_legacy_fallback.sql
supabase/migrations/031_family_members_rls_remove_legacy_fallback.sql
supabase/migrations/032_expenses_rls_remove_legacy_fallback.sql
supabase/migrations/033_payable_bills_rls_remove_legacy_fallback.sql
supabase/migrations/034_receivable_incomes_rls_remove_legacy_fallback.sql
supabase/migrations/035_banks_rls_remove_legacy_fallback.sql
supabase/migrations/036_profiles_rls_remove_legacy_fallback.sql
supabase/migrations/037_user_module_permissions_rls_remove_legacy_fallback.sql
supabase/migrations/038_user_feature_permissions_rls_remove_legacy_fallback.sql
supabase/migrations/039_drop_legacy_owner_family_policies.sql
supabase/migrations/040_audit_events_schema.sql
supabase/migrations/041_audit_events_write_boundary.sql
supabase/migrations/042_audit_events_retention_cleanup.sql
supabase/migrations/043_restore_finance_relationships_and_rls_cleanup.sql
```

### Validacao esperada apos migrations

O banco deve possuir:

```txt
family_members
expense_categories
expenses
payable_bills
receivable_incomes
banks
profiles
user_module_permissions
user_feature_permissions
```

Tambem deve possuir:

- RLS habilitado nas tabelas principais;
- policies organization-aware por membership ativa;
- policies antigas owner/family removidas pela migration `039`;
- audit events criados pelas migrations `040` a `042`;
- FKs financeiras restauradas e validadas pela migration `043`;
- constraints contra duplicacao de membros/categorias seedadas;
- coluna `scope` em `user_module_permissions`;
- coluna `allowed_member_ids` em `user_module_permissions`;
- roles aceitos em `profiles`: `admin`, `adult`, `child`, `custom`, `user`.

As FKs restauradas pela migration `043` devem existir com `convalidated = true`.

Consulta de validacao:

```sql
select
  conrelid::regclass::text as table_name,
  conname,
  convalidated
from pg_constraint
where conname in (
  'expenses_family_member_id_fkey',
  'expenses_category_id_fkey',
  'payable_bills_responsible_member_id_fkey',
  'receivable_incomes_receiver_member_id_fkey',
  'banks_family_member_id_fkey'
)
order by table_name, conname;
```

Resultado esperado: cinco linhas, todas com `convalidated = true`.

Se a migration `043` falhar em um ambiente com dados historicos orfaos, use `docs/sql/finance-relationships-orphan-preflight.sql` para diagnosticar antes de cleanup/retry. Nao trate `convalidated = false` como estado saudavel apos a `043`.

## Comandos de validacao local

Execute na raiz do projeto:

```bash
npm ci
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run build
npm run test:run
npm run dev
```

O minimo para considerar uma alteracao validada:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run build
npm run test:run
```

## Checklist de validacao tecnica

### 1. Ambiente

- [ ] `.env.local` existe.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurada.
- [ ] chave publica Supabase configurada.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configurada apenas no servidor.
- [ ] `ADMIN_EMAIL` configurado.
- [ ] `.env.local` nao esta commitado.

### 2. Banco

- [ ] Migration 001 executada.
- [ ] Migration 002 executada.
- [ ] Migration 003 executada.
- [ ] Migration 004 executada.
- [ ] Migrations 005 a 043 executadas ou aplicadas por deploy automatizado.
- [ ] Tabelas financeiras existem.
- [ ] Tabelas de permissao existem.
- [ ] RLS esta ativo.
- [ ] FKs financeiras da migration 043 existem e estao com `convalidated = true`.
- [ ] Seed nao duplica membros/categorias.

### 3. Autenticacao

- [ ] `/auth/login` abre.
- [ ] `/auth/sign-up` abre.
- [ ] Cadastro valida e-mail autorizado pelo Admin.
- [ ] `/auth/confirm` valida token Supabase.
- [ ] `linkAuthUserToFamilyProfile` vincula `auth_user_id` ao profile.
- [ ] Usuario sem sessao e redirecionado para `/auth/login` ao acessar `/protected`.
- [ ] Usuario sem sessao e redirecionado para `/auth/login` ao acessar `/org/[orgSlug]`.
- [ ] Usuario com e-mail nao autorizado nao acessa o app.
- [ ] Usuario inativo e bloqueado.

### 4. Admin familiar

- [ ] Primeiro Admin e criado/garantido pelo `ADMIN_EMAIL`.
- [ ] Admin acessa `/protected/admin`.
- [ ] Admin acessa `/protected/admin/usuarios`.
- [ ] Admin acessa `/protected/admin/permissoes`.
- [ ] Admin cria usuario familiar.
- [ ] Admin vincula usuario familiar a membro financeiro.
- [ ] Admin ativa/desativa usuario familiar.
- [ ] Admin sincroniza usuario com Supabase Auth pelo e-mail.
- [ ] Admin salva permissoes por modulo.
- [ ] Admin salva permissoes por acao.
- [ ] Admin salva escopo `own`, `selected` ou `family`.
- [ ] Admin salva membros liberados no escopo `selected`.

### 5. Permissoes

- [ ] Menu desktop mostra apenas modulos com `can_view`.
- [ ] Menu mobile mostra apenas modulos com `can_view`.
- [ ] Usuario `own` ve apenas o proprio membro financeiro.
- [ ] Usuario `selected` ve apenas membros liberados.
- [ ] Usuario `family` ve a familia inteira.
- [ ] Admin ve todos os membros ativos.
- [ ] Botao criar respeita `can_create`.
- [ ] Edicao/status respeita `can_edit`.
- [ ] Exclusao respeita `can_delete`.
- [ ] Server Actions validam permissao antes de mutar dados.

### 6. Dashboard

- [ ] `/protected` abre com usuario autenticado.
- [ ] `/org/[orgSlug]` abre com usuario autenticado e membership ativa.
- [ ] `/org/[orgSlug]` sem membership nao mostra dados da organizacao.
- [ ] Dashboard mostra apenas blocos permitidos.
- [ ] Dashboard calcula gastos do escopo permitido.
- [ ] Dashboard calcula contas a pagar do escopo permitido.
- [ ] Dashboard calcula contas a receber do escopo permitido.
- [ ] Dashboard calcula bancos do escopo permitido.
- [ ] Admin ve visao consolidada.
- [ ] Usuario comum ve visao limitada.

Pendente conhecido:

- periodo exibido ainda deve virar dinamico.

### 7. Pessoas

- [ ] Criar membro financeiro.
- [ ] Editar nome, papel e limite.
- [ ] Ativar/desativar membro.
- [ ] Limites aparecem no Dashboard e Relatorios.

### 8. Gastos

- [ ] Criar gasto.
- [ ] Excluir gasto.
- [ ] Gasto reduz limite disponivel.
- [ ] Gasto aparece por pessoa.
- [ ] Gasto aparece por categoria.
- [ ] Permissao por membro e respeitada.

Pendente conhecido:

- edicao completa de gasto.

### 9. Contas a pagar

- [ ] Criar conta a pagar.
- [ ] Alterar status.
- [ ] Excluir conta.
- [ ] Conta vencida aparece como atrasada.
- [ ] Conta aparece no Dashboard.
- [ ] Conta aparece nos Relatorios.
- [ ] Permissao por responsavel e respeitada.

Pendente conhecido:

- edicao completa de conta a pagar.

### 10. Contas a receber

- [ ] Criar conta a receber/renda.
- [ ] Alterar status.
- [ ] Excluir recebimento.
- [ ] Recebimento vencido aparece como atrasado.
- [ ] Recebimento recebido aparece em Relatorios.
- [ ] Permissao por recebedor e respeitada.

Pendente conhecido:

- edicao completa de conta a receber.

### 11. Bancos

- [ ] Criar conta bancaria.
- [ ] Atualizar saldo.
- [ ] Excluir banco.
- [ ] Saldo aparece no Dashboard.
- [ ] Saldo aparece em Relatorios.
- [ ] Permissao por membro vinculado e respeitada.

Pendente conhecido:

- edicao completa de conta bancaria.

### 12. Configuracoes

- [ ] Criar categoria.
- [ ] Excluir categoria.
- [ ] Atualizar limite mensal.

Pendentes conhecidos:

- editar categoria;
- configuracao de moeda;
- configuracao de periodo;
- configuracoes gerais da familia.

### 13. Relatorios

- [ ] `/protected/relatorios` abre.
- [ ] Relatorio consolida gastos.
- [ ] Relatorio consolida contas pendentes.
- [ ] Relatorio consolida rendas recebidas.
- [ ] Relatorio consolida bancos.
- [ ] Relatorio mostra gastos por pessoa.
- [ ] Relatorio mostra gastos por categoria.

Pendentes conhecidos:

- filtros avancados;
- exportacao;
- graficos;
- comparativo por periodo.

## Testes automatizados existentes

### Unitarios

Os testes unitarios ficam em `__tests__/unit/*.test.ts` e `__tests__/ui-primitive-usage-guards.test.ts`.

Cobrem:

- calculos financeiros;
- formatacao de moeda;
- RBAC;
- escopo `own`;
- escopo `selected`;
- escopo `family`;
- permissoes por acao;
- Admin bypass;
- perfil inativo;
- feature permissions.
- guards de documentacao, migrations, RLS, auditoria, rate limit e contratos de UI.

### Integracao

Os testes de integracao ficam em `__tests__/integration/*.test.ts` e `__tests__/integration/rls/*.rls.test.ts`.

Cobrem:

- queries simuladas do Dashboard;
- falha controlada de query;
- fluxo de permissoes por escopo;
- usuario comum vendo apenas dados proprios;
- usuario selected vendo membros liberados;
- Admin vendo todos os gastos.
- suites RLS gated quando `RUN_RLS_TESTS=true` e variaveis de banco de teste estao configuradas.

## Debitos tecnicos conhecidos

- `lib/finance/calculations.ts` ainda mistura funcoes puras com calculos baseados em fixtures.
- Alguns documentos estrategicos ainda podem listar como planejado recursos que ja estao implementados.
- Alguns documentos historicos ainda podem citar `/protected` como unica rota protegida; a fonte viva atual e ADR 0007 + `docs/SAAS_OPERATIONAL_ROADMAP.md`.
- Evidencia live de RLS ainda depende de gate manual.
- Evidencia real Stripe checkout/portal ainda depende de conta e credenciais Stripe de teste.
- Edicoes completas de algumas entidades ainda faltam.
- `user_feature_permissions` existe, mas UI completa ainda precisa evoluir.
- Periodo do Dashboard/Relatorios ainda precisa virar dinamico.
- `owner_id` ainda existe como compatibilidade/write ownership; a autorizacao tenant-scoped atual depende de `organization_id` e membership.

## Definition of Done tecnica

Uma entrega tecnica so deve ser considerada pronta quando:

- codigo implementado;
- permissao validada no servidor;
- dados filtrados por `organization_id`, membership, `owner_id` de write ownership e escopo;
- lint aprovado;
- build aprovado;
- testes aprovados;
- fluxo manual validado;
- documentacao atualizada;
- sem exposicao de secrets no client.

## Proxima validacao recomendada

1. Rodar `npm run lint`.
2. Rodar `npm run build`.
3. Rodar `npm run test:run`.
4. Testar login Admin.
5. Criar usuario familiar.
6. Configurar permissoes `own`, `selected` e `family`.
7. Logar como usuario familiar.
8. Confirmar menus e dados filtrados.
9. Testar criacao/exclusao com permissao permitida.
10. Testar bloqueio com permissao negada.
