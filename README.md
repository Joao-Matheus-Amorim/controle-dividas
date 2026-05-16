# FamilyFinance

FamilyFinance e uma aplicacao financeira familiar, mobile-first e permissionada, construida para uso privado de uma familia especifica. O objetivo e centralizar gastos, contas, dividas, recebimentos, bancos, relatorios e administracao de usuarios em uma experiencia simples, segura e com aparencia de app nativo.

Este projeto esta em fase de MVP Web/PWA. Ele nao e tratado como SaaS publico nesta etapa. A prioridade atual e entregar uma solucao privada, estavel, auditavel e facil de usar no dia a dia.

## Status do projeto

| Area | Status |
| --- | --- |
| Produto | MVP Web/PWA funcional |
| Stack | Next.js, React, TypeScript, Tailwind e Supabase |
| Autenticacao | Implementada com Supabase Auth |
| Permissoes | Implementadas por modulo, acao e escopo |
| Dashboard | Implementado e refinado para contas/dividas |
| Contas a pagar / Dividas | Implementado com conta avulsa e conta fixa |
| Testes | Unitarios e integracao com Vitest/MSW |
| CI | GitHub Actions com Quality Gate obrigatorio |
| Branch main | Protegida por ruleset |
| Deploy automatico | Desativado durante desenvolvimento |

## Decisoes atuais de produto

### Escopo

FamilyFinance deve continuar sendo tratado como uma solucao personalizada para uma familia especifica.

```txt
Supabase = infraestrutura tecnica
Danyel = Admin familiar pela web
Familia = usuarios do app/PWA
Permissoes = controle real de acesso
```

### Dividas no MVP

No MVP, **Contas a pagar** e o nucleo operacional de **Dividas**.

Nao existe modulo separado de dividas nesta fase. A decisao atual e reaproveitar o modulo de contas a pagar, que ja possui cadastro, vencimento, responsavel, status, permissao por membro, dashboard, filtros e proximos vencimentos.

O modulo trabalha com dois tipos:

| Tipo | Uso | Recorrencia |
| --- | --- | --- |
| `avulsa` | Conta/divida pontual, boleto eventual ou pagamento sem repeticao | Sem recorrencia obrigatoria |
| `fixa` | Conta recorrente como aluguel, internet, escola, assinatura ou financiamento | Inicialmente mensal |

A recorrencia personalizada fica preparada para uma fase futura.

## Funcionalidades implementadas

### Autenticacao e acesso

- Login.
- Cadastro.
- Validacao de email autorizado pelo Admin familiar.
- Confirmacao de acesso.
- Recuperacao e atualizacao de senha.
- Logout.
- Protecao global de rotas privadas por `proxy.ts`.
- Vinculo entre `auth.users` e `profiles` familiares.
- Criacao automatica do Admin principal via `ADMIN_EMAIL`.

### Permissoes

O app possui controle por:

- modulo;
- acao;
- escopo de dados;
- pessoas liberadas;
- perfil ativo/inativo;
- permissoes futuras por funcionalidade fina.

Acoes controlaveis:

```txt
can_view   -> Ver
can_create -> Criar
can_edit   -> Editar
can_delete -> Excluir
```

Escopos:

```txt
own      -> usuario acessa apenas o proprio membro financeiro vinculado
selected -> usuario acessa apenas membros escolhidos pelo Admin
family   -> usuario acessa todos os membros ativos da familia
```

### Modulos atuais

| Modulo | Estado atual |
| --- | --- |
| Dashboard | Implementado e contextual por permissoes |
| Pessoas | Criacao, edicao basica e ativacao/desativacao |
| Gastos | Criacao e exclusao; edicao completa pendente |
| Contas a pagar / Dividas | Criacao, tipo fixa/avulsa, status, filtros, exclusao e dashboard |
| Contas a receber | Criacao, status e exclusao; edicao completa pendente |
| Bancos | Criacao, saldo e exclusao; edicao completa pendente |
| Relatorios | Consolidado; filtros avancados/exportacao/graficos pendentes |
| Configuracoes | Categorias e limites; edicao completa pendente |
| Admin | Usuarios familiares e permissoes por modulo/acao/escopo |

## Stack tecnica

### Frontend e runtime

- Next.js `16.2.3`.
- React `19.0.0`.
- React DOM `19.0.0`.
- TypeScript `5.9.3`.
- App Router.
- Server Components.
- Server Actions.

### UI

- Tailwind CSS `3.4.19`.
- Radix UI.
- lucide-react.
- Componentes estilo shadcn em `components/ui`.
- Componentes internos em `components/app`.
- Componentes financeiros em `components/finance`.
- Design mobile-first, tema escuro e layout PWA.

### Backend/BaaS

- Supabase Auth.
- Supabase Database.
- Supabase Row Level Security.
- `@supabase/ssr`.
- `@supabase/supabase-js`.
- Service role apenas em codigo server-side.

### Testes e qualidade

- Vitest.
- Testing Library.
- jsdom.
- MSW.
- GitHub Actions.
- Quality Gate com install, audit, lint, build e tests.

## Como rodar localmente

Instale as dependencias:

```bash
npm install
```

Crie o arquivo local de ambiente:

```bash
cp .env.example .env.local
```

Configure as variaveis obrigatorias:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_or_secret_key
ADMIN_EMAIL=admin@example.com
```

Observacoes importantes:

- `NEXT_PUBLIC_SUPABASE_URL` e obrigatoria.
- O projeto aceita `NEXT_PUBLIC_SUPABASE_ANON_KEY` ou `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` e obrigatoria para operacoes administrativas server-side.
- Nunca prefixe `SUPABASE_SERVICE_ROLE_KEY` com `NEXT_PUBLIC_`.
- `ADMIN_EMAIL` define o primeiro Admin familiar autorizado.

Rode o app:

```bash
npm run dev
```

Abra:

```txt
http://localhost:3000
```

## Scripts disponiveis

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run test:run
npm run test:watch
```

Fluxo recomendado antes de Pull Request:

```bash
npm run lint
npm run build
npm run test
```

## Migrations Supabase

Execute as migrations em ordem no Supabase SQL Editor ou pelo fluxo de migrations adotado pelo projeto:

```txt
supabase/migrations/001_family_finance_schema.sql
supabase/migrations/002_dedupe_and_seed_constraints.sql
supabase/migrations/003_admin_profiles_permissions.sql
supabase/migrations/004_permission_scope_and_features.sql
supabase/migrations/005_payable_bill_types.sql
```

Regra operacional:

```txt
Se uma PR adicionar novo arquivo em supabase/migrations,
aplique a migration no Supabase antes de validar o app local/remoto.
```

### Migration 005

A migration `005_payable_bill_types.sql` adiciona o campo:

```sql
bill_type text not null default 'avulsa'
```

Valores validos:

```txt
avulsa
fixa
```

Ela tambem preserva dados antigos:

- contas com `recurrence` preenchida passam a ser tratadas como `fixa`;
- contas sem `recurrence` continuam como `avulsa`.

## Modelo de dados principal

### `family_members`

Representa pessoas financeiras da familia.

Campos principais:

```txt
id, owner_id, name, role, monthly_limit, currency, is_active, created_at, updated_at
```

### `expense_categories`

Categorias de gastos.

```txt
id, owner_id, name, description, is_default, created_at, updated_at
```

### `expenses`

Lancamentos de gastos.

```txt
id, owner_id, family_member_id, category_id, expense_date, description,
purchase_location, amount, payment_method, bank_or_card, notes
```

### `payable_bills`

Contas a pagar e dividas do MVP.

```txt
id, owner_id, name, category, amount, due_date, responsible_member_id,
status, bill_type, bank_used, recurrence, notes
```

Status validos:

```txt
pago
pendente
atrasado
```

Tipos validos:

```txt
avulsa
fixa
```

### `receivable_incomes`

Contas a receber, rendas e entradas previstas/recebidas.

```txt
id, owner_id, receiver_member_id, source, income_type, amount,
expected_date, status, receiving_bank, notes
```

### `banks`

Contas bancarias e saldos por membro financeiro.

```txt
id, owner_id, family_member_id, bank_name, account_type,
current_balance, currency, notes
```

### `profiles`

Perfis de acesso ao sistema.

```txt
id, owner_id, auth_user_id, linked_family_member_id, name, email, role, is_active
```

### `user_module_permissions`

Permissoes por perfil, modulo, acao e escopo.

```txt
profile_id, module, can_view, can_create, can_edit, can_delete,
scope, allowed_member_ids, granted_by
```

### `user_feature_permissions`

Permissoes por funcionalidade especifica.

```txt
profile_id, feature_key, is_enabled, granted_by
```

## Rotas principais

### Publicas/Auth

```txt
/
/auth/login
/auth/sign-up
/auth/sign-up-success
/auth/forgot-password
/auth/update-password
/auth/error
/auth/confirm
```

### Protegidas

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

## Estrutura de pastas

```txt
controle-dividas/
├─ app/
│  ├─ auth/
│  ├─ protected/
│  ├─ globals.css
│  ├─ layout.tsx
│  ├─ manifest.ts
│  └─ page.tsx
├─ components/
│  ├─ app/
│  ├─ finance/
│  ├─ tutorial/
│  ├─ ui/
│  └─ *.tsx
├─ lib/
│  ├─ finance/
│  ├─ supabase/
│  └─ utils.ts
├─ supabase/
│  └─ migrations/
├─ __tests__/
│  ├─ fixtures/
│  ├─ integration/
│  └─ unit/
├─ docs/
│  └─ pm/
├─ public/
├─ proxy.ts
├─ package.json
├─ tailwind.config.ts
├─ vitest.config.ts
├─ vercel.json
└─ README.md
```

## Arquivos importantes

### Aplicacao

```txt
app/protected/layout.tsx
app/protected/page.tsx
app/protected/loading.tsx
app/protected/error.tsx
app/protected/admin/actions.ts
app/protected/admin/page.tsx
app/protected/admin/usuarios/page.tsx
app/protected/admin/permissoes/page.tsx
```

### Financeiro

```txt
lib/finance/server.ts
lib/finance/banks-server.ts
lib/finance/reports-server.ts
lib/finance/admin-server.ts
lib/finance/access-control.ts
lib/finance/permissions.ts
lib/finance/profile-linking.ts
lib/finance/calculations.ts
```

### Supabase

```txt
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/admin.ts
lib/supabase/proxy.ts
proxy.ts
```

### Componentes reutilizaveis

```txt
components/app/app-card.tsx
components/app/app-data-table.tsx
components/app/app-empty-state.tsx
components/app/app-form-dialog.tsx
components/app/app-hero-card.tsx
components/app/app-page-header.tsx
components/app/app-skeleton.tsx
components/app/app-stat-card.tsx
```

### Componentes financeiros

```txt
components/finance/bank-account-form.tsx
components/finance/category-summary.tsx
components/finance/expense-category-form.tsx
components/finance/expense-form.tsx
components/finance/family-member-form.tsx
components/finance/family-user-form.tsx
components/finance/module-placeholder.tsx
components/finance/payable-bill-form.tsx
components/finance/payable-bill-form-dialog.tsx
components/finance/permissions-form.tsx
components/finance/person-balance-card.tsx
components/finance/receivable-income-form.tsx
components/finance/stat-card.tsx
components/finance/upcoming-bills.tsx
```

## Testes

Configuracao:

```txt
vitest.config.ts
vitest.setup.ts
```

### Testes unitarios

```txt
__tests__/unit/access-control.test.ts
__tests__/unit/calculations.test.ts
__tests__/unit/mock-data.test.ts
__tests__/unit/payable-bill-actions.test.ts
```

Cobrem:

- calculos financeiros;
- formatacao de moeda;
- limite restante;
- percentual usado;
- RBAC/permissoes;
- escopos `own`, `selected` e `family`;
- admin bypass;
- perfil inativo;
- permissoes por funcionalidade;
- validacoes de contas/dividas;
- criacao de conta avulsa;
- criacao de conta fixa mensal;
- erro de permissao em conta/divida.

### Testes de integracao

```txt
__tests__/integration/dashboard-queries.test.ts
__tests__/integration/permissions-flow.test.ts
```

Cobrem:

- queries do Dashboard;
- falha controlada de query;
- visibilidade por escopo;
- usuario comum vendo apenas o proprio membro;
- usuario com escopo selecionado vendo membros liberados;
- Admin vendo todos os dados permitidos.

## Estados de UI

O projeto possui padrao documentado para:

- loading;
- empty state;
- error state;
- success/error em formularios;
- lacunas futuras de actions silenciosas.

Arquivos principais:

```txt
app/protected/loading.tsx
app/protected/error.tsx
components/app/app-skeleton.tsx
components/app/app-empty-state.tsx
docs/UI_STATES.md
```

## PWA e mobile

O projeto possui `app/manifest.ts` e pode ser usado como PWA.

Configuracoes principais:

- `display: standalone`;
- `start_url: /protected`;
- orientacao portrait;
- tema escuro;
- categoria finance/productivity.

Uso recomendado:

1. abrir o app web no celular;
2. adicionar a tela inicial;
3. usar como PWA;
4. validar fluxo real antes de app nativo.

App nativo com React Native/Expo esta planejado para fase futura, mas ainda nao existe neste repositorio.

## Deploy

O deploy automatico esta desativado em `vercel.json` durante a fase de desenvolvimento.

Fluxo recomendado para deploy manual:

```bash
npm run lint
npm run build
npm run test
npx vercel --prod
```

Reative deploy automatico apenas quando o app estiver estavel o suficiente.

## Workflow profissional

A `main` e protegida por ruleset.

Fluxo oficial:

```txt
branch nova
  -> commit pequeno
  -> push
  -> Pull Request
  -> Quality Gate verde
  -> merge
```

Padrao de branches:

```txt
feature/nome-da-feature
fix/nome-do-ajuste
chore/nome-da-manutencao
docs/nome-da-documentacao
test/nome-do-teste
```

Commits recomendados:

```txt
Add ...
Fix ...
Update ...
Remove ...
Refactor ...
Document ...
Test ...
```

## Documentacao complementar

```txt
docs/LIVE_MVP_AUDIT.md
docs/AUTH_FLOW_AUDIT.md
docs/PAYABLE_BILLS_AS_DEBTS.md
docs/DASHBOARD_DEBT_SUMMARY.md
docs/UI_STATES.md
docs/LIVE_FLOW_TESTS.md
docs/PRODUCT_VISION.md
docs/ARCHITECTURE.md
docs/TESTING_STRATEGY.md
docs/PERMISSION_AND_DASHBOARD_STRATEGY.md
docs/MOBILE_STRATEGY.md
docs/MOBILE_FIRST_UX.md
docs/FREE_APP_DISTRIBUTION.md
docs/ACCESS_CHANNELS.md
docs/COST_ESTIMATE.md
docs/ADMIN_PERMISSIONS.md
docs/VALIDACAO_TECNICA.md
docs/branch-protection.md
docs/pm/01_TERMO_DE_ABERTURA.md
docs/pm/02_ESCOPO.md
docs/pm/03_WBS_EAP.md
docs/pm/04_REQUISITOS.md
docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md
docs/pm/06_ACEITE_ROADMAP.md
```

## Roadmap recomendado

### Curto prazo

- Atualizar CI para Node 24 quando apropriado.
- Padronizar UX de recuperacao/atualizacao de senha.
- Melhorar feedback de actions silenciosas.
- Finalizar edicao completa de contas a pagar/dividas.
- Finalizar edicao completa de gastos, bancos e contas a receber.

### Medio prazo

- Periodo dinamico no Dashboard.
- Periodo dinamico em Relatorios.
- Filtros avancados por pessoa, categoria, status e periodo.
- Exportacao de relatorios.
- Graficos financeiros.
- UI completa para `user_feature_permissions`.

### Futuro

- Metas.
- Investimentos.
- Acoes e cotacoes.
- Alertas financeiros.
- Projecoes avancadas.
- Convites por e-mail.
- App nativo com React Native + Expo.

## Seguranca

Regras obrigatorias:

- Nunca commitar `.env.local`.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no browser.
- Nunca transformar `SUPABASE_SERVICE_ROLE_KEY` em `NEXT_PUBLIC_*`.
- Toda action que altera dados financeiros deve validar permissao.
- Toda consulta financeira deve respeitar `owner_id` e escopo de membros acessiveis.
- Admin pode tudo apenas dentro da propria familia.
- Usuario inativo nao deve acessar dados.
- Email nao autorizado nao deve criar acesso familiar.
- Profile ja vinculado nao deve ser reassociado a outro Auth user sem decisao administrativa.

## Regra de ouro

```txt
Supabase guarda e protege os dados.
Danyel administra pela web.
A familia usa o app/PWA.
Cada usuario ve apenas o que foi liberado.
O Admin pode liberar tudo dentro da familia.
O app deve ser simples, bonito, fluido, seguro, permissionado e mobile-first.
```
