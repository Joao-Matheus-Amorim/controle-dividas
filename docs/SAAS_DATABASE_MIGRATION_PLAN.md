# FamilyFinance SaaS - Plano de Migration Multi-tenant

> Status DocDoc: Historico
> Superado por: migrations `001` a `043`, `docs/VALIDACAO_TECNICA.md` e
> `docs/DOCUMENTATION_STATUS.md`.
> Uso atual: contexto historico do plano de migration; nao usar para escolher
> novo numero de migration nem para afirmar estado atual do banco.

## 1. Objetivo

Este documento define o plano tecnico para transformar o modelo atual do FamilyFinance, hoje baseado em uma familia unica com `owner_id`, em uma base SaaS multi-tenant orientada por `organizations` e `organization_memberships`.

Este plano e documental. Ele nao executa SQL e nao altera o banco. O objetivo e reduzir risco antes da primeira migration real.

## 2. Contexto

O projeto ja possui uma base funcional com:

- Supabase Auth;
- PostgreSQL/Supabase Database;
- Row Level Security;
- migrations versionadas;
- tabelas financeiras;
- perfis familiares;
- permissoes por modulo;
- permissoes por funcionalidade;
- escopos de dados;
- Server Actions protegidas;
- testes automatizados.

A estrategia SaaS foi registrada em:

- `docs/SAAS_MULTI_TENANT_STRATEGY.md`;
- `docs/pm/07_SOLICITACAO_MUDANCA_SAAS_MULTI_TENANT.md`.

O alinhamento PMBOK foi realizado em:

- `docs/PRODUCT_VISION.md`;
- `docs/pm/02_ESCOPO.md`;
- `docs/pm/03_WBS_EAP.md`;
- `docs/pm/05_RISCOS_QUALIDADE_MUDANCAS.md`.

## 3. Estado atual do schema

As tabelas principais usam `owner_id` ligado a `auth.users(id)`.

Tabelas financeiras principais:

```txt
family_members
expense_categories
expenses
payable_bills
receivable_incomes
banks
```

Tabelas de perfil/permissao:

```txt
profiles
user_module_permissions
user_feature_permissions
```

Regra atual predominante:

```sql
auth.uid() = owner_id
```

Esse modelo e correto para o MVP familiar privado, mas nao e suficiente para SaaS multi-tenant.

## 4. Modelo-alvo

O modelo-alvo deve usar `organizations` como unidade principal de isolamento e propriedade dos dados.

```txt
auth.users
  -> organization_memberships
    -> organizations
      -> profiles
      -> family_members
      -> expense_categories
      -> expenses
      -> payable_bills
      -> receivable_incomes
      -> banks
      -> user_module_permissions
      -> user_feature_permissions
```

## 5. Principios da migration

A migration deve seguir estes principios:

1. **Nao destrutiva inicialmente**: nao remover `owner_id` na primeira fase.
2. **Compatibilidade temporaria**: `owner_id` e `organization_id` devem coexistir durante a transicao.
3. **Backfill controlado**: registros existentes devem receber uma organizacao inicial.
4. **RLS gradual**: nao trocar todas as policies antes de validar queries/actions.
5. **PRs pequenas**: cada etapa deve ser revisavel.
6. **Rollback planejado**: toda migration deve ter caminho de reversao ou mitigacao.
7. **Sem billing nesta fase**: Stripe e planos ficam para depois do isolamento.
8. **Sem rotas por slug nesta fase**: rotas vem depois de helpers server-side e filtros por organization.
9. **Sem policy RLS recursiva**: policies sobre `organization_memberships` nao devem consultar diretamente `organization_memberships` dentro do proprio `USING`, pois isso pode causar recursao RLS/infinite recursion `42P17`.

## 6. Nomenclatura aprovada/recomendada

Usar:

```txt
organizations
organization_memberships
organization_id
organization_slug
auth_user_id
profile_id
family_member_id
```

Evitar:

```txt
org_id
tenant_id
family_id como tenant
workspace_id misturado
```

`tenant` e conceito tecnico. A linguagem do produto e do banco deve favorecer `organization`.

## 7. Fases da migration

## Fase 0 - Preparacao documental

Status: em andamento.

Entregas:

- estrategia SaaS documentada;
- solicitacao formal PMBOK criada;
- escopo e riscos alinhados;
- plano SQL documentado;
- nenhuma alteracao em banco ainda.

Criterio de aceite:

- documentos revisados;
- decisao `organizations` aprovada;
- proxima migration definida.

---

## Fase 1 - Criar `organizations` e `organization_memberships`

Objetivo: introduzir as tabelas base do tenant sem alterar os dados financeiros existentes.

### Migration candidata

Arquivo sugerido:

```txt
supabase/migrations/006_organizations_memberships.sql
```

### SQL proposto - tabelas

```sql
create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_auth_user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  trial_ends_at timestamptz,
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organizations_status_check check (status in ('active', 'trialing', 'past_due', 'suspended', 'cancelled')),
  constraint organizations_plan_check check (plan in ('free', 'family_basic', 'family_plus', 'family_pro'))
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, auth_user_id),
  constraint organization_memberships_role_check check (role in ('owner', 'admin', 'adult', 'child', 'custom', 'member'))
);

create index if not exists organizations_owner_auth_user_id_idx
  on public.organizations(owner_auth_user_id);

create index if not exists organizations_slug_idx
  on public.organizations(slug);

create index if not exists organization_memberships_auth_user_id_idx
  on public.organization_memberships(auth_user_id);

create index if not exists organization_memberships_organization_id_idx
  on public.organization_memberships(organization_id);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
```

### SQL proposto - helpers RLS nao recursivos

Policies de `organization_memberships` nao devem consultar diretamente `organization_memberships` dentro da propria clausula `USING`, porque o PostgreSQL reaplica RLS sobre a tabela consultada e pode gerar recursao infinita `42P17`.

Para evitar isso, a migration deve usar funcoes auxiliares `SECURITY DEFINER`, sem SQL dinamico e com `search_path` fixo.

```sql
create or replace function public.current_user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.organization_id
  from public.organization_memberships m
  where m.auth_user_id = auth.uid()
    and m.is_active = true;
$$;

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.auth_user_id = auth.uid()
      and m.is_active = true
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.auth_user_id = auth.uid()
      and m.is_active = true
      and m.role in ('owner', 'admin')
  );
$$;

revoke all on function public.current_user_organization_ids() from public;
revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.is_organization_admin(uuid) from public;

grant execute on function public.current_user_organization_ids() to authenticated;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;
```

### Observacoes de seguranca dos helpers

- As funcoes devem ser criadas por role confiavel do banco.
- O `search_path` deve ser fixo para reduzir risco de hijacking.
- Nao usar SQL dinamico.
- Filtrar `is_active = true`.
- Nao expor mais informacao do que o necessario.
- Testar explicitamente que usuario sem membership nao recebe organizacoes.
- Testar que membership inativa nao concede acesso.

### RLS inicial proposto - sem recursao

```sql
create policy "organizations_select_member"
on public.organizations
for select
using (public.is_organization_member(id));

create policy "organizations_insert_owner"
on public.organizations
for insert
with check (owner_auth_user_id = auth.uid());

create policy "organizations_update_owner_or_admin"
on public.organizations
for update
using (public.is_organization_admin(id))
with check (public.is_organization_admin(id));

create policy "organization_memberships_select_member"
on public.organization_memberships
for select
using (public.is_organization_member(organization_id));

create policy "organization_memberships_insert_admin"
on public.organization_memberships
for insert
with check (public.is_organization_admin(organization_id));

create policy "organization_memberships_update_admin"
on public.organization_memberships
for update
using (public.is_organization_admin(organization_id))
with check (public.is_organization_admin(organization_id));

create policy "organization_memberships_delete_admin"
on public.organization_memberships
for delete
using (public.is_organization_admin(organization_id));
```

### Observacao importante sobre bootstrap do primeiro membership

A policy `organization_memberships_insert_admin` pressupoe que ja existe um admin/owner na organizacao. Para criar a primeira membership de owner, sera necessario um fluxo de bootstrap.

Opcoes:

1. Server Action usando service role server-side.
2. RPC segura `create_organization_with_owner`.
3. Migration/backfill manual para organizacao inicial.

Recomendacao inicial: usar service role server-side apenas em Server Action/rotina administrativa, nunca no client.

Para a organizacao inicial dos dados existentes, a opcao mais segura e migration/backfill controlado ou script administrativo com validacao manual.

### Validacoes da Fase 1

```sql
select count(*) from public.organizations;
select count(*) from public.organization_memberships;

select public.current_user_organization_ids();
select public.is_organization_member('<ORG_ID>'::uuid);
select public.is_organization_admin('<ORG_ID>'::uuid);
```

Criterios:

- tabelas existem;
- indices existem;
- RLS ativo;
- funcoes existem;
- grants foram aplicados apenas ao necessario;
- nenhuma policy de `organization_memberships` consulta diretamente `organization_memberships` dentro do proprio `USING`;
- nenhuma tabela financeira alterada;
- app atual continua funcionando.

Rollback:

```sql
drop policy if exists "organization_memberships_delete_admin" on public.organization_memberships;
drop policy if exists "organization_memberships_update_admin" on public.organization_memberships;
drop policy if exists "organization_memberships_insert_admin" on public.organization_memberships;
drop policy if exists "organization_memberships_select_member" on public.organization_memberships;
drop policy if exists "organizations_update_owner_or_admin" on public.organizations;
drop policy if exists "organizations_insert_owner" on public.organizations;
drop policy if exists "organizations_select_member" on public.organizations;

drop function if exists public.is_organization_admin(uuid);
drop function if exists public.is_organization_member(uuid);
drop function if exists public.current_user_organization_ids();

drop table if exists public.organization_memberships;
drop table if exists public.organizations;
```

Rollback so e seguro se nenhuma tabela financeira depender delas ainda.

---

## Fase 2 - Criar organizacao inicial para dados existentes

Objetivo: criar uma organizacao inicial que represente os dados atuais do MVP familiar.

### Decisoes pendentes

Antes da migration/backfill, definir:

- nome da organizacao inicial;
- slug inicial;
- owner_auth_user_id;
- se todos os dados atuais pertencem a uma unica organizacao;
- como lidar com ambientes dev/staging/prod.

### Slug sugerido

```txt
amorim
```

ou:

```txt
familyfinance-demo
```

Para producao real, o slug deve ser escolhido conscientemente.

### SQL conceitual

```sql
insert into public.organizations (slug, name, owner_auth_user_id, plan, status)
values ('amorim', 'Familia Amorim', '<AUTH_USER_ID>', 'free', 'active')
on conflict (slug) do nothing;

insert into public.organization_memberships (organization_id, auth_user_id, role, is_active)
select id, owner_auth_user_id, 'owner', true
from public.organizations
where slug = 'amorim'
on conflict (organization_id, auth_user_id) do nothing;
```

### Risco

O maior risco desta fase e usar o `auth_user_id` errado. Por isso, a migration real nao deve hardcodar um UUID sem validacao.

Opcoes mais seguras:

- usar variavel/manual no Supabase SQL editor;
- criar script admin controlado;
- buscar pelo e-mail admin se a tabela de profiles ja tiver dado confiavel.

### Validacoes

```sql
select id, slug, name, owner_auth_user_id, plan, status
from public.organizations;

select organization_id, auth_user_id, role, is_active
from public.organization_memberships;
```

Criterios:

- existe uma organizacao inicial;
- existe membership owner;
- owner_auth_user_id bate com o usuario esperado.

---

## Fase 3 - Adicionar `organization_id` nullable nas tabelas existentes

Objetivo: preparar as tabelas atuais para multi-tenancy sem quebrar o app.

### Tabelas impactadas

```txt
profiles
family_members
expense_categories
expenses
payable_bills
receivable_incomes
banks
user_module_permissions
user_feature_permissions
```

### SQL proposto

```sql
alter table public.profiles
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.family_members
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.expense_categories
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.expenses
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.payable_bills
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.receivable_incomes
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.banks
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.user_module_permissions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;

alter table public.user_feature_permissions
  add column if not exists organization_id uuid references public.organizations(id) on delete cascade;
```

### Indices propostos

```sql
create index if not exists profiles_organization_id_idx on public.profiles(organization_id);
create index if not exists family_members_organization_id_idx on public.family_members(organization_id);
create index if not exists expense_categories_organization_id_idx on public.expense_categories(organization_id);
create index if not exists expenses_organization_id_expense_date_idx on public.expenses(organization_id, expense_date desc);
create index if not exists payable_bills_organization_id_due_date_idx on public.payable_bills(organization_id, due_date asc);
create index if not exists receivable_incomes_organization_id_expected_date_idx on public.receivable_incomes(organization_id, expected_date asc);
create index if not exists banks_organization_id_idx on public.banks(organization_id);
create index if not exists user_module_permissions_organization_id_idx on public.user_module_permissions(organization_id);
create index if not exists user_feature_permissions_organization_id_idx on public.user_feature_permissions(organization_id);
```

### Por que nullable inicialmente

`organization_id` deve entrar nullable na primeira etapa para evitar quebrar registros existentes antes do backfill.

Depois do backfill e validacao, uma migration futura pode tornar `organization_id not null`.

---

## Fase 4 - Backfill de `organization_id`

Objetivo: preencher `organization_id` para dados existentes.

### SQL conceitual

```sql
with target_org as (
  select id
  from public.organizations
  where slug = 'amorim'
  limit 1
)
update public.profiles
set organization_id = (select id from target_org)
where organization_id is null;

with target_org as (
  select id
  from public.organizations
  where slug = 'amorim'
  limit 1
)
update public.family_members
set organization_id = (select id from target_org)
where organization_id is null;
```

Repetir para:

```txt
expense_categories
expenses
payable_bills
receivable_incomes
banks
user_module_permissions
user_feature_permissions
```

### Validacoes de contagem

Antes:

```sql
select 'expenses' as table_name, count(*) as total, count(organization_id) as with_org
from public.expenses;
```

Depois:

```sql
select 'expenses' as table_name, count(*) as total, count(organization_id) as with_org
from public.expenses;
```

Criterio:

```txt
total = with_org
```

para todas as tabelas impactadas.

### Query de auditoria geral

```sql
select 'profiles' table_name, count(*) total, count(organization_id) with_org from public.profiles
union all
select 'family_members', count(*), count(organization_id) from public.family_members
union all
select 'expense_categories', count(*), count(organization_id) from public.expense_categories
union all
select 'expenses', count(*), count(organization_id) from public.expenses
union all
select 'payable_bills', count(*), count(organization_id) from public.payable_bills
union all
select 'receivable_incomes', count(*), count(organization_id) from public.receivable_incomes
union all
select 'banks', count(*), count(organization_id) from public.banks
union all
select 'user_module_permissions', count(*), count(organization_id) from public.user_module_permissions
union all
select 'user_feature_permissions', count(*), count(organization_id) from public.user_feature_permissions;
```

---

## Fase 5 - Constraints e consistencia interna

Objetivo: impedir inconsistencias entre registros de organizacoes diferentes.

### Problema

Adicionar `organization_id` nao garante sozinho que `expense.family_member_id` pertence a mesma organizacao que `expense.organization_id`.

### Abordagens possiveis

1. Validar no server-side.
2. Criar constraints compostas.
3. Criar triggers de integridade.
4. Combinar server-side + constraints onde fizer sentido.

### Recomendacao inicial

Comecar com validacao server-side e testes. Depois adicionar constraints compostas cuidadosamente.

Exemplo futuro:

```sql
-- Exige unique composto para permitir FK composta.
alter table public.family_members
  add constraint family_members_id_organization_unique unique (id, organization_id);

alter table public.expenses
  add constraint expenses_family_member_same_org_fk
  foreign key (family_member_id, organization_id)
  references public.family_members(id, organization_id);
```

Esse tipo de constraint deve ser aplicado com cuidado e apenas apos backfill validado.

---

## Fase 6 - Adaptar aplicacao server-side

Objetivo: fazer o codigo reconhecer organizacao ativa.

### Helpers candidatos

Novo diretorio sugerido:

```txt
lib/organizations/
```

Arquivos candidatos:

```txt
lib/organizations/server.ts
lib/organizations/types.ts
lib/organizations/slug.ts
```

Funcoes candidatas:

```txt
getCurrentOrganization()
getCurrentMembership()
getCurrentProfileForOrganization()
requireOrganizationAccess()
requireOrganizationAdmin()
resolveOrganizationFromSlug()
resolveDefaultOrganizationForUser()
```

### Regras

- nunca confiar apenas em `orgSlug` vindo da URL;
- sempre validar membership server-side;
- Server Actions devem receber/derivar organizacao ativa;
- queries devem filtrar por `organization_id`;
- permissoes devem ser resolvidas dentro da organizacao.

---

## Fase 7 - Adaptar queries e actions

Objetivo: fazer dados financeiros respeitarem `organization_id`.

### Queries

Toda query financeira deve filtrar por:

```txt
organization_id = currentOrganization.id
```

Exemplo conceitual:

```ts
.eq("organization_id", organization.id)
```

### Actions

Toda Server Action deve validar:

1. usuario autenticado;
2. organizacao ativa;
3. membership ativa;
4. permissao no modulo;
5. acesso ao membro financeiro quando aplicavel;
6. entidade pertencente a mesma organizacao.

### Ordem sugerida por modulo

1. Dashboard leitura.
2. Pessoas/family_members.
3. Categorias.
4. Gastos.
5. Contas a pagar.
6. Contas a receber.
7. Bancos.
8. Relatorios.
9. Admin/permissoes.

---

## Fase 8 - RLS multi-tenant nas tabelas financeiras

Objetivo: trocar a base de isolamento de `owner_id` para membership em `organization_id`.

### Policy modelo para select

Quando a tabela protegida nao for `organization_memberships`, a policy pode usar helper nao recursivo:

```sql
create policy "expenses_select_organization_member"
on public.expenses
for select
using (public.is_organization_member(organization_id));
```

### Insert/update/delete

RLS deve garantir membership, mas permissao fina de create/edit/delete deve continuar na aplicacao server-side.

Exemplo:

```sql
create policy "expenses_insert_organization_member"
on public.expenses
for insert
with check (public.is_organization_member(organization_id));
```

### Cuidado

Nao remover policies antigas ate confirmar que:

- `organization_id` esta preenchido;
- queries ja usam organizacao;
- actions ja validam organizacao;
- testes cross-tenant passam.

---

## Fase 9 - Tornar `organization_id` obrigatorio

Objetivo: finalizar a transicao de dados para organization.

Pre-condicoes:

- todos os registros possuem `organization_id`;
- queries filtram por organization;
- actions validam organization;
- RLS por organization esta ativa;
- testes passaram.

SQL futuro:

```sql
alter table public.expenses
  alter column organization_id set not null;
```

Repetir para tabelas impactadas.

Nao fazer isso cedo demais.

---

## Fase 10 - Rotas por `orgSlug`

Objetivo: mover a experiencia SaaS para URLs com contexto de organizacao.

Estrutura futura:

```txt
app/
  (app)/
    [orgSlug]/
      dashboard/
      gastos/
      contas-a-pagar/
      contas-a-receber/
      bancos/
      relatorios/
      configuracoes/
      admin/
```

Pre-condicoes:

- `organizations.slug` existe;
- helper `resolveOrganizationFromSlug` existe;
- membership e validada server-side;
- dados ja filtram por organization.

---

## 8. Plano de rollback por fase

### Fase 1 rollback

Pode remover tabelas se nao houver dependencia:

```sql
drop policy if exists "organization_memberships_delete_admin" on public.organization_memberships;
drop policy if exists "organization_memberships_update_admin" on public.organization_memberships;
drop policy if exists "organization_memberships_insert_admin" on public.organization_memberships;
drop policy if exists "organization_memberships_select_member" on public.organization_memberships;
drop policy if exists "organizations_update_owner_or_admin" on public.organizations;
drop policy if exists "organizations_insert_owner" on public.organizations;
drop policy if exists "organizations_select_member" on public.organizations;

drop function if exists public.is_organization_admin(uuid);
drop function if exists public.is_organization_member(uuid);
drop function if exists public.current_user_organization_ids();

drop table if exists public.organization_memberships;
drop table if exists public.organizations;
```

### Fase 3 rollback

Remover colunas `organization_id` se nenhum codigo depender delas:

```sql
alter table public.expenses drop column if exists organization_id;
```

Repetir por tabela.

### Fase 4 rollback

Backfill e reversivel apenas se `organization_id` ainda for nullable:

```sql
update public.expenses set organization_id = null;
```

Nao recomendado apos app depender da coluna.

### Fase 8 rollback

Se RLS nova falhar:

- restaurar policies antigas baseadas em `owner_id`;
- desabilitar temporariamente paths que usam organization;
- revalidar acesso.

### Regra geral

Antes de migration real em producao:

- exportar backup;
- registrar contagens antes;
- aplicar migration em ambiente de teste;
- registrar contagens depois;
- validar app;
- so depois aplicar em producao.

## 9. Testes minimos obrigatorios

### Testes de banco/RLS

Criar cenario com:

```txt
organization A
organization B
user A
user B
admin A
admin B
```

Validar:

- user A nao le dados da organization B;
- admin A nao administra organization B;
- user B nao le dados da organization A;
- membership inativa bloqueia acesso;
- slug inexistente retorna erro/redirect;
- usuario sem organizacao ativa entra em fallback/onboarding;
- policy de `organization_memberships` nao gera `42P17`;
- helper `is_organization_member()` retorna falso para usuario sem membership;
- helper `is_organization_admin()` retorna falso para membro comum.

### Testes de aplicacao

- Dashboard filtra por organization.
- Gastos filtram por organization.
- Contas a pagar filtram por organization.
- Recebimentos filtram por organization.
- Bancos filtram por organization.
- Relatorios filtram por organization.
- Actions impedem editar entidade de outra organization.

### Testes de regressao

- MVP atual continua funcionando durante a transicao.
- Admin atual continua acessando dados esperados.
- Permissoes atuais continuam funcionando dentro da organization inicial.

## 10. Ordem recomendada de PRs

### PR A - Migration base organizations

- cria `organizations`;
- cria `organization_memberships`;
- cria indices;
- cria helpers RLS nao recursivos;
- cria RLS basica;
- nao altera tabelas financeiras.

### PR B - Backfill organization inicial

- cria organizacao inicial;
- cria membership owner;
- documenta validacao.

### PR C - Add organization_id nullable

- adiciona colunas;
- adiciona indices;
- nao altera queries ainda.

### PR D - Backfill organization_id

- popula colunas;
- adiciona auditoria de contagens.

### PR E - Organization server helpers

- adiciona helpers server-side;
- nao muda rotas ainda.

### PR F - Query migration por modulo

- migra um modulo por vez para organization.

### PR G - RLS multi-tenant

- troca policies com testes.

### PR H - Rotas por orgSlug

- introduz URL SaaS.

## 11. Decisoes pendentes antes da primeira migration real

1. Qual slug da organizacao inicial?
2. Qual auth user sera owner da organizacao inicial?
3. A primeira migration criara apenas tabelas ou tambem RLS?
4. Membership inicial sera criada por SQL, script ou Server Action?
5. `plan` e `stripe_customer_id` entram ja ou ficam para billing futuro?
6. O cadastro atual sera mantido ate onboarding SaaS?
7. O `ADMIN_EMAIL` continuara temporariamente?
8. Quais ambientes precisam ser migrados primeiro?
9. Como sera validado backup antes de migration real?
10. Qual modulo sera o primeiro a usar `organization_id` no codigo?
11. As funcoes RLS auxiliares serao mantidas em `public` ou em schema dedicado futuro?
12. Qual role sera dona das funcoes `SECURITY DEFINER` em producao?

## 12. Recomendacao final

A primeira migration real deve ser pequena e criar apenas:

```txt
organizations
organization_memberships
indices basicos
helpers RLS nao recursivos
RLS basica das novas tabelas
```

Nao deve:

- alterar tabelas financeiras;
- mudar rotas;
- mudar Server Actions;
- mexer em billing;
- remover `owner_id`;
- tornar `organization_id` obrigatorio;
- alterar policies antigas;
- criar policy recursiva em `organization_memberships`.

Essa abordagem reduz risco e permite validar a base SaaS antes de mexer no comportamento vivo do app.
