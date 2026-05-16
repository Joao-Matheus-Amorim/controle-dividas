# FamilyFinance

FamilyFinance e uma aplicacao financeira familiar personalizada, mobile-first, segura e permissionada, construida para uso privado de uma familia especifica. O objetivo e centralizar gastos, contas, dividas, recebimentos, bancos, relatorios, configuracoes e administracao de usuarios em uma experiencia simples, bonita, fluida e com aparencia de app nativo.

Este projeto esta em fase de **MVP Web/PWA funcional**. Ele nao deve ser tratado como SaaS publico nesta etapa. A prioridade atual e entregar uma solucao privada, estavel, auditavel e facil de usar no dia a dia.

## Status executivo

| Area | Estado |
| --- | --- |
| Produto | MVP Web/PWA funcional |
| Stack | Next.js, React, TypeScript, Tailwind CSS e Supabase |
| Autenticacao | Implementada com Supabase Auth |
| Rotas privadas | Protegidas por `proxy.ts` |
| Permissoes | Implementadas por modulo, acao e escopo |
| Dashboard | Implementado e refinado para contas/dividas |
| Contas a pagar / Dividas | Implementado com conta avulsa e conta fixa |
| Testes | Unitarios e integracao com Vitest/MSW |
| CI | GitHub Actions com Quality Gate obrigatorio |
| `main` | Protegida por ruleset |
| Deploy automatico | Desativado durante desenvolvimento |

## Regra principal desta fase

```txt
Nao reconstruir o que ja existe.
Auditar o projeto vivo.
Documentar decisoes reais.
Ajustar UX e nomenclatura.
Atacar apenas lacunas reais.
Manter README e docs sincronizados com o estado atual.
```

## Resumo executivo

O FamilyFinance ja esta em fase de MVP Web/PWA funcional, com:

- autenticacao via Supabase Auth;
- protecao global de sessao via `proxy.ts`;
- criacao e validacao de usuarios familiares autorizados pelo Admin;
- vinculo entre `auth.users` e `profiles` familiares;
- Dashboard financeiro contextual;
- modulo de Pessoas;
- modulo de Gastos;
- modulo de Contas a pagar, usado tambem como Dividas no MVP;
- contas avulsas e contas fixas mensais;
- modulo de Contas a receber;
- modulo de Bancos;
- modulo de Relatorios;
- modulo de Configuracoes;
- modulo Admin familiar;
- usuarios familiares;
- permissoes por modulo;
- permissoes por acao: ver, criar, editar e excluir;
- escopo de dados por permissao: proprio, selecionados ou familia inteira;
- permissoes futuras por funcionalidade especifica;
- migrations Supabase organizadas;
- testes unitarios;
- testes de integracao com MSW;
- estados padronizados de loading e erro em rotas protegidas;
- estrutura PWA com manifest;
- documentacao de produto, escopo, arquitetura, testes, mobile, acesso, custos, permissoes, UX e roadmap.

## Decisoes atuais de produto

### Escopo

FamilyFinance deve continuar sendo tratado como uma solucao personalizada para uma familia especifica.

```txt
Supabase = infraestrutura tecnica
Danyel = Admin familiar pela web
Familia = usuarios do app/PWA
Permissoes = controle real de acesso
```

O Admin pode liberar ou bloquear:

- modulos inteiros;
- acoes especificas;
- funcionalidades especificas;
- dados de uma pessoa;
- dados de pessoas selecionadas;
- dados da familia inteira;
- atalhos administrativos;
- acesso a relatorios, bancos, rendas, investimentos e modulos futuros.

### Dividas no MVP

No MVP, **Contas a pagar** e o nucleo operacional de **Dividas**.

Nao existe modulo separado de dividas nesta fase. A decisao atual e reaproveitar o modulo de contas a pagar, que ja possui cadastro, vencimento, responsavel, status, permissao por membro, dashboard, filtros e proximos vencimentos.

O modulo trabalha com dois tipos:

| Tipo | Uso | Recorrencia |
| --- | --- | --- |
| `avulsa` | Conta/divida pontual, boleto eventual, compra especifica ou pagamento sem repeticao | Sem recorrencia obrigatoria |
| `fixa` | Conta recorrente como aluguel, internet, escola, assinatura ou financiamento | Inicialmente mensal |

A recorrencia personalizada fica preparada para uma fase futura.

## Estado atual real do projeto

### Implementado

- Next.js App Router.
- React 19.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase Database.
- Supabase SSR.
- Supabase service role para operacoes administrativas server-side.
- Proxy global de sessao.
- Auth pages: login, cadastro, confirmacao, recuperacao de senha, atualizacao de senha e erro.
- Validacao de e-mail familiar antes do cadastro.
- Vinculo automatico entre usuario autenticado e perfil familiar autorizado.
- Criacao automatica do Admin principal com base em `ADMIN_EMAIL`.
- Dashboard protegido e contextual.
- Dashboard refinado para contas/dividas, fixas, avulsas, pendentes e atrasadas.
- Menu desktop dinamico por permissao.
- Menu mobile dinamico por permissao.
- Admin familiar.
- Gerenciamento de usuarios familiares.
- Gerenciamento de permissoes por modulo, acao, escopo e pessoas liberadas.
- Pessoas financeiras da familia.
- Gastos.
- Contas a pagar / Dividas.
- Contas a receber.
- Bancos.
- Relatorios consolidados.
- Configuracoes de categorias e limites.
- Migrations de schema financeiro.
- Migrations de deduplicacao de seed.
- Migrations de profiles e permissoes.
- Migrations de escopo e permissoes por funcionalidade.
- Migration de tipo de conta/divida (`bill_type`).
- Testes de calculos financeiros.
- Testes de RBAC/permissoes.
- Testes de integracao de Dashboard com MSW.
- Testes de integracao de fluxo de permissoes.
- Testes de actions de contas/dividas.
- Loading padronizado para rotas protegidas.
- Error boundary amigavel para rotas protegidas.
- PWA manifest.
- Vercel configurada com deploy automatico desativado.
- CI com Quality Gate obrigatorio.
- Branch `main` protegida.

### Parcialmente implementado

- Edicao completa de Gastos: existe criacao e exclusao, mas a edicao completa ainda deve ser finalizada.
- Edicao completa de Contas a pagar / Dividas: existe criacao, tipo fixa/avulsa, alteracao de status, filtros e exclusao, mas a edicao completa ainda deve ser finalizada.
- Edicao completa de Contas a receber: existe criacao, alteracao de status e exclusao, mas a edicao completa ainda deve ser finalizada.
- Edicao completa de Bancos: existe criacao, alteracao de saldo e exclusao, mas a edicao completa ainda deve ser finalizada.
- Categorias: existe criacao e exclusao, mas edicao completa ainda deve ser finalizada.
- `user_feature_permissions`: a tabela, tipos e testes existem, mas a UI completa para gerenciar funcionalidades finas ainda precisa evoluir.
- Relatorios: ja existem consultas e tela consolidada, mas exportacao, filtros avancados e graficos ainda precisam evoluir.
- Dashboard: ja respeita permissoes e escopos, mas o periodo exibido ainda deve virar dinamico.
- Actions de update/delete: algumas ainda falham silenciosamente e devem ganhar feedback visual futuro.

### Planejado

- Recorrencia personalizada de contas fixas.
- Edicao completa de contas/dividas.
- Metas.
- Investimentos.
- Acoes.
- Cotacoes.
- Graficos financeiros avancados.
- Alertas financeiros.
- Projecoes avancadas.
- Convites por e-mail.
- Exportacao de relatorios.
- Feature flags reais por modulo.
- App nativo com React Native + Expo em fase futura.

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
- tailwindcss-animate.
- Radix UI.
- lucide-react.
- Componentes estilo shadcn em `components/ui`.
- Componentes internos em `components/app`.
- Componentes financeiros em `components/finance`.
- Design mobile-first.
- Tema escuro.
- Layout PWA.
- Cards arredondados.
- Botoes grandes.
- Navegacao inferior no mobile.
- Navegacao superior no desktop.
- Formularios em dialog/modal quando fizer sentido.

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

### Deploy

- Vercel.
- Deploy automatico desativado durante a fase de desenvolvimento.

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

## Variaveis de ambiente

As variaveis ficam documentadas em `.env.example`.

### Obrigatorias hoje

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=
```

### Opcionais ou planejadas

```env
APP_ENV=
NEXT_PUBLIC_APP_URL=
VERCEL_URL=
EMAIL_PROVIDER=
RESEND_API_KEY=
EMAIL_FROM=
MARKET_DATA_PROVIDER=
BRAPI_API_KEY=
ALPHA_VANTAGE_API_KEY=
TWELVE_DATA_API_KEY=
FINNHUB_API_KEY=
EXCHANGE_RATE_API_KEY=
ENABLE_FIXED_EXPENSES_MODULE=
ENABLE_INVESTMENTS_MODULE=
ENABLE_STOCKS_MODULE=
ENABLE_REPORT_EXPORTS=
ENABLE_EMAIL_INVITES=
NEXT_PUBLIC_ENABLE_PWA=
NEXT_PUBLIC_ENABLE_INVESTMENTS_MODULE=
NEXT_PUBLIC_ENABLE_STOCKS_MODULE=
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_ACCESS_TOKEN=
```

Essas variaveis opcionais preparam o projeto para convites por e-mail, investimentos, acoes, cotacoes, cambio, feature flags e futuro app Expo.

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

### 001 - Schema financeiro inicial

Cria:

- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Tambem cria indices, ativa Row Level Security e adiciona policies basicas por `owner_id = auth.uid()`.

### 002 - Dedupe e seguranca do seed

Corrige duplicidades criadas por seed automatico e adiciona indices unicos para:

- `family_members(owner_id, lower(trim(name)))`;
- `expense_categories(owner_id, lower(trim(name)))`.

### 003 - Admin, profiles e permissoes

Cria:

- `profiles`;
- `user_module_permissions`.

Esse arquivo introduz o modelo de Admin familiar e permissoes por modulo e acao.

### 004 - Escopo e funcionalidades

Atualiza roles e adiciona:

- `scope` em `user_module_permissions`;
- `allowed_member_ids` em `user_module_permissions`;
- `user_feature_permissions`.

Escopos validos:

```txt
own
selected
family
```

Roles validos:

```txt
admin
adult
child
custom
user
```

### 005 - Tipos de contas/dividas

Adiciona em `payable_bills`:

```sql
bill_type text not null default 'avulsa'
```

Valores validos:

```txt
avulsa
fixa
```

Preserva dados antigos:

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

Tipos validos:

```txt
fixa
variavel
```

Status validos:

```txt
previsto
recebido
atrasado
```

### `banks`

Contas bancarias e saldos por membro financeiro.

```txt
id, owner_id, family_member_id, bank_name, account_type,
current_balance, currency, notes
```

### `profiles`

Perfis de acesso ao sistema, vinculados ou nao a usuarios do Supabase Auth.

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

## Arquitetura de autenticacao

O fluxo de autenticacao e intencionalmente restrito.

```txt
Admin cria um perfil familiar com e-mail autorizado
        ↓
Usuario tenta criar conta com esse e-mail
        ↓
Sistema verifica se o e-mail existe em profiles
        ↓
Supabase envia/valida confirmacao
        ↓
app/auth/confirm/route.ts valida o token
        ↓
Sistema vincula auth.users ao profile familiar
        ↓
Usuario entra no app e ve somente o que foi liberado
```

Arquivos principais:

- `app/auth/login/page.tsx`;
- `app/auth/sign-up/page.tsx`;
- `app/auth/sign-up/actions.ts`;
- `app/auth/confirm/route.ts`;
- `app/auth/forgot-password/page.tsx`;
- `app/auth/update-password/page.tsx`;
- `app/auth/error/page.tsx`;
- `components/login-form.tsx`;
- `components/sign-up-form.tsx`;
- `components/forgot-password-form.tsx`;
- `components/update-password-form.tsx`;
- `lib/finance/profile-linking.ts`;
- `lib/finance/access-control.ts`;
- `proxy.ts`;
- `lib/supabase/proxy.ts`.

## Protecao global de rotas

O projeto usa `proxy.ts` na raiz.

```ts
import { updateSession } from "@/lib/supabase/proxy";
import { type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}
```

O `updateSession`:

- ignora assets publicos;
- ignora rotas de auth;
- cria Supabase server client por request;
- sincroniza cookies;
- chama `supabase.auth.getClaims()`;
- redireciona usuario sem sessao para `/auth/login`.

## Regra oficial de permissoes

```txt
Role define o padrao inicial.
Admin define a permissao real.
Permissao sempre vence o role.
```

Na pratica:

- `role` ajuda a criar presets iniciais;
- `user_module_permissions` define o que o usuario realmente pode fazer;
- Admin sempre pode tudo dentro da familia;
- perfil inativo nao acessa nada;
- usuario comum depende de permissao por modulo, acao e escopo.

## Modulos controlaveis

Os modulos ficam em `lib/finance/permissions.ts`.

```txt
DASHBOARD
PESSOAS
GASTOS
CONTAS_FIXAS
CONTAS_A_PAGAR
CONTAS_A_RECEBER
BANCOS
RENDAS
RELATORIOS
INVESTIMENTOS
ACOES
CONFIGURACOES
ADMIN
DIVIDAS
METAS
```

Nem todos os modulos ja possuem tela completa. Alguns existem como planejamento controlavel por permissao.

## Acoes controlaveis

```txt
can_view   -> Ver
can_create -> Criar
can_edit   -> Editar
can_delete -> Excluir
```

## Escopos de dados

```txt
own      -> usuario acessa apenas o proprio membro financeiro vinculado
selected -> usuario acessa apenas membros escolhidos pelo Admin
family   -> usuario acessa todos os membros ativos da familia
```

Todas as consultas financeiras principais usam helpers de permissao para filtrar dados por membro.

## Funcionalidades finas planejadas

`FEATURE_PERMISSIONS` ja esta modelado no codigo e no banco.

Chaves atuais:

```txt
view_own_dashboard
view_family_dashboard
view_own_limit
view_others_limit
create_own_expense
create_expense_for_others
view_banks
view_reports
view_investments
view_stock_charts
view_admin_shortcut
manage_users
manage_permissions
manage_limits
manage_categories
manage_fixed_expenses
```

A tabela e os testes existem. A interface completa para gerenciar essas permissoes finas ainda deve evoluir.

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

## Modulos funcionais atuais

### Dashboard

Arquivo principal:

```txt
app/protected/page.tsx
```

Carrega dados de:

- gastos;
- contas a pagar / dividas;
- contas a receber;
- bancos;
- membros financeiros;
- categorias;
- permissoes visiveis.

Mostra:

- visao do mes;
- limite disponivel;
- gastos;
- contas e dividas em aberto;
- saldo em bancos;
- valores a receber;
- acoes rapidas;
- uso do limite;
- resumo de contas fixas e avulsas;
- contas pendentes e atrasadas;
- gastos por pessoa;
- proximos vencimentos;
- categorias;
- bancos;
- rendas.

Pendente:

- trocar periodo fixo por periodo dinamico.

### Pessoas

Arquivos:

```txt
app/protected/pessoas/page.tsx
app/protected/pessoas/actions.ts
components/finance/family-member-form.tsx
components/finance/family-member-form-dialog.tsx
components/finance/person-balance-card.tsx
```

Acoes:

- criar membro financeiro;
- editar nome, papel e limite;
- ativar/desativar membro.

### Gastos

Arquivos:

```txt
app/protected/gastos/page.tsx
app/protected/gastos/actions.ts
components/finance/expense-form.tsx
components/finance/expense-form-dialog.tsx
components/finance/category-summary.tsx
```

Acoes:

- criar gasto;
- excluir gasto;
- validar permissao de criacao por membro;
- validar permissao de exclusao por membro.

Pendente:

- edicao completa de gasto.

### Contas a pagar / Dividas

Arquivos:

```txt
app/protected/contas-a-pagar/page.tsx
app/protected/contas-a-pagar/actions.ts
components/finance/payable-bill-form.tsx
components/finance/payable-bill-form-dialog.tsx
components/finance/upcoming-bills.tsx
```

Acoes:

- criar conta/divida;
- escolher tipo `avulsa` ou `fixa`;
- criar conta fixa com recorrencia mensal inicial;
- alterar status;
- excluir conta;
- validar permissao por responsavel;
- filtrar por status;
- filtrar por tipo;
- exibir badges de fixa/avulsa;
- exibir totais no Dashboard.

Pendente:

- edicao completa de conta/divida;
- recorrencia personalizada completa;
- feedback visual mais forte em update/delete.

### Contas a receber

Arquivos:

```txt
app/protected/contas-a-receber/page.tsx
app/protected/contas-a-receber/actions.ts
components/finance/receivable-income-form.tsx
components/finance/receivable-income-form-dialog.tsx
```

Acoes:

- criar entrada/recebimento;
- alterar status;
- excluir entrada;
- validar permissao por recebedor.

Pendente:

- edicao completa de recebimento.

### Bancos

Arquivos:

```txt
app/protected/bancos/page.tsx
app/protected/bancos/actions.ts
lib/finance/banks-server.ts
components/finance/bank-account-form.tsx
components/finance/bank-account-form-dialog.tsx
```

Acoes:

- criar conta bancaria;
- atualizar saldo;
- excluir conta bancaria;
- validar permissao por membro vinculado.

Pendente:

- edicao completa de conta bancaria.

### Relatorios

Arquivos:

```txt
app/protected/relatorios/page.tsx
lib/finance/reports-server.ts
```

Agrega:

- limite mensal total;
- gastos totais;
- contas pendentes;
- rendas recebidas;
- rendas previstas;
- saldo total em bancos;
- saldo final projetado;
- gastos por pessoa;
- gastos por categoria;
- contas pendentes;
- rendas recebidas;
- rendas previstas;
- contas bancarias;
- contadores gerais.

Pendente:

- filtros avancados;
- exportacao;
- graficos;
- comparativo por periodo.

### Configuracoes

Arquivos:

```txt
app/protected/configuracoes/page.tsx
app/protected/configuracoes/actions.ts
components/finance/expense-category-form.tsx
```

Acoes:

- criar categoria de gasto;
- excluir categoria de gasto;
- atualizar limite mensal de membro.

Pendente:

- editar categoria;
- configuracoes gerais da familia;
- configuracao de moeda;
- configuracao de periodo.

### Admin

Arquivos:

```txt
app/protected/admin/page.tsx
app/protected/admin/actions.ts
app/protected/admin/usuarios/page.tsx
app/protected/admin/permissoes/page.tsx
components/finance/family-user-form.tsx
components/finance/family-user-form-dialog.tsx
components/finance/permissions-form.tsx
lib/finance/admin-server.ts
```

Acoes:

- garantir perfil Admin;
- criar usuario familiar;
- editar usuario familiar;
- sincronizar usuario familiar com Supabase Auth;
- excluir usuario familiar;
- ativar/desativar usuario familiar;
- salvar permissoes por modulo;
- configurar acoes;
- configurar escopo;
- configurar membros liberados quando escopo for `selected`.

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
│
├─ components/
│  ├─ app/
│  ├─ finance/
│  ├─ tutorial/
│  ├─ ui/
│  └─ *.tsx
│
├─ lib/
│  ├─ finance/
│  ├─ supabase/
│  └─ utils.ts
│
├─ supabase/
│  └─ migrations/
│
├─ __tests__/
│  ├─ fixtures/
│  ├─ integration/
│  └─ unit/
│
├─ docs/
│  └─ pm/
│
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

## Dados mockados e dados reais

O projeto possui duas camadas historicas:

### Dados reais

Usados nas telas protegidas e consultas principais:

- `lib/finance/server.ts`;
- `lib/finance/banks-server.ts`;
- `lib/finance/reports-server.ts`;
- `lib/finance/admin-server.ts`;
- Supabase Database.

### Dados mockados/testes

Usados em testes e algumas funcoes legadas de calculo:

- `__tests__/fixtures/mock-data.ts`;
- `__tests__/fixtures/msw-finance-data.ts`;
- `__tests__/fixtures/msw-handlers.ts`;
- `lib/finance/calculations.ts`.

Atencao tecnica: `lib/finance/calculations.ts` ainda importa fixtures em algumas funcoes. As funcoes puras como `formatCurrency`, `compactCurrency`, `calculateRemainingLimit` e `calculateUsedPercent` sao uteis em producao, mas os calculos agregados baseados em fixtures devem ser separados futuramente para evitar confusao entre mock e dado real.

## Moeda e localizacao

O projeto esta atualmente coerente com uma familia em contexto europeu/lusofono:

- moeda padrao: `EUR`;
- formatter: `pt-PT`;
- exemplos de bancos: Revolut, Wise, Millennium e Caixa;
- membros mockados: Danyel, Pai, Mae, Gabryel e Caleb.

Se o uso mudar para Brasil, revisar:

- `EUR` para `BRL`;
- `pt-PT` para `pt-BR`;
- nomes de bancos;
- dados iniciais;
- textos e regras financeiras locais.

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

### Fixtures

```txt
__tests__/fixtures/mock-data.ts
__tests__/fixtures/msw-finance-data.ts
__tests__/fixtures/msw-handlers.ts
```

A estrategia completa de testes esta em:

```txt
docs/TESTING_STRATEGY.md
```

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

- nome: FamilyFinance;
- `display: standalone`;
- `start_url: /protected`;
- orientacao portrait;
- tema escuro;
- categoria finance/productivity;
- icone em `public/icon.svg`.

Uso recomendado:

1. abrir o app web no celular;
2. adicionar a tela inicial;
3. usar como PWA;
4. validar fluxo real antes de app nativo.

## Mobile nativo planejado

Ainda nao existe app React Native neste repositorio.

Planejado para fase futura:

- React Native;
- Expo;
- Expo Router;
- Supabase JS;
- Expo Go para testes gratuitos;
- EAS Build quando necessario;
- Android;
- iOS.

Variaveis ja previstas em `.env.example`:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_ACCESS_TOKEN=
```

## Design e UX

Diretrizes atuais:

- mobile-first;
- aparencia de app nativo;
- tema escuro;
- cards arredondados;
- botoes grandes;
- visual limpo;
- sem rolagem horizontal;
- navegacao inferior no mobile;
- navegacao superior no desktop;
- formularios em dialog/modal quando fizer sentido;
- feedback visual claro para saldo, alerta, sucesso, perigo, loading e erro.

Cores principais definidas em `app/globals.css`:

```txt
--app-bg: #080810
--app-bg-soft: #10101a
--app-primary: #8b72f8
--app-primary-soft: #b09cff
--app-success: #1de9b2
--app-warning: #f7b84b
--app-danger: #f0506e
--app-info: #5caaff
```

## Deploy Vercel

O deploy automatico esta propositalmente desativado.

Arquivo:

```txt
vercel.json
```

Motivo:

- fase de mudancas frequentes;
- evitar consumo desnecessario de builds na conta gratuita;
- evitar deploys quebrados em momentos de refatoracao.

Fluxo recomendado para deploy manual:

```bash
npm run lint
npm run build
npm run test
npx vercel --prod
```

Somente reativar deploy automatico quando o app estiver estavel.

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
- Separar funcoes puras de `lib/finance/calculations.ts` das funcoes baseadas em fixtures.
- Mover calculos mockados para area de testes ou arquivo claramente marcado como mock.

### Medio prazo

- Periodo dinamico no Dashboard.
- Periodo dinamico em Relatorios.
- Filtros avancados por pessoa, categoria, status e periodo.
- Exportacao de relatorios.
- Graficos financeiros.
- UI completa para `user_feature_permissions`.
- Confirmacoes visuais para exclusao.

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
