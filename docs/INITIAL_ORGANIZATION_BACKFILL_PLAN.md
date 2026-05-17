# FamilyFinance SaaS - Plano de Organizacao Inicial e Bootstrap

## 1. Objetivo

Este documento define como preparar a primeira organizacao do modelo SaaS multi-tenant sem usar UUID hardcoded inseguro e sem alterar ainda as tabelas financeiras existentes.

A etapa esta relacionada a issue #99 e vem depois da migration `006_organizations_memberships.sql`, que criou:

- `organizations`;
- `organization_memberships`;
- helpers RLS nao recursivos;
- policies basicas das novas tabelas.

## 2. Por que esta etapa existe

A primeira migration SaaS criou a estrutura, mas ainda nao criou nenhuma organizacao nem membership.

Isso foi intencional porque o primeiro membership e um caso especial de bootstrap:

- a policy de insert em `organization_memberships` exige admin existente;
- mas a primeira organizacao ainda nao tem admin;
- portanto, o primeiro owner precisa ser criado por fluxo controlado.

Essa etapa define como fazer isso com seguranca.

## 3. Escopo desta etapa

Dentro do escopo:

- definir slug da organizacao inicial;
- definir nome da organizacao inicial;
- identificar o `owner_auth_user_id` correto por ambiente;
- criar a organizacao inicial;
- criar membership `owner` inicial;
- validar que os helpers RLS funcionam;
- documentar rollback.

Fora do escopo:

- adicionar `organization_id` nas tabelas financeiras;
- fazer backfill de dados financeiros;
- alterar queries;
- alterar Server Actions;
- alterar rotas;
- alterar RLS das tabelas financeiras;
- remover `owner_id`;
- billing.

## 4. Decisoes necessarias

Antes de executar qualquer SQL em ambiente real, decidir:

1. Qual sera o slug da organizacao inicial?
2. Qual sera o nome exibido da organizacao inicial?
3. Qual usuario autenticado sera o owner?
4. Como encontrar esse usuario com seguranca no ambiente?
5. Esta etapa sera executada via SQL manual, script administrativo ou Server Action interna?
6. Sera aplicada em local, staging e producao?

## 5. Valores recomendados para ambiente atual

Sugestao para ambiente privado atual:

```txt
slug: amorim
name: Familia Amorim
role inicial: owner
plan: free
status: active
```

Esses valores podem mudar por ambiente.

Para ambiente de demo ou desenvolvimento, alternativas:

```txt
slug: familyfinance-demo
name: FamilyFinance Demo
```

## 6. Como identificar o owner_auth_user_id com seguranca

### Opcao A - Buscar via profiles

Se a tabela `profiles` ja possui o e-mail do Admin confiavel:

```sql
select auth_user_id, email, name, role, is_active
from public.profiles
where role = 'admin'
order by created_at asc;
```

Validar manualmente:

- o e-mail corresponde ao Admin esperado;
- `auth_user_id` nao e nulo;
- `is_active = true`;
- existe apenas um Admin principal esperado.

### Opcao B - Buscar por e-mail especifico em profiles

```sql
select auth_user_id, email, name, role, is_active
from public.profiles
where lower(email) = lower('<ADMIN_EMAIL>')
limit 1;
```

Usar apenas se o e-mail estiver correto no ambiente.

### Opcao C - Buscar em auth.users

Em Supabase SQL editor, dependendo das permissoes:

```sql
select id, email, created_at
from auth.users
where lower(email) = lower('<ADMIN_EMAIL>')
limit 1;
```

Essa opcao e sensivel e deve ser usada com cuidado.

## 7. SQL manual recomendado para bootstrap controlado

Este SQL deve ser executado apenas depois de substituir `<OWNER_AUTH_USER_ID>` por um UUID validado.

```sql
insert into public.organizations (
  slug,
  name,
  owner_auth_user_id,
  plan,
  status
)
values (
  'amorim',
  'Familia Amorim',
  '<OWNER_AUTH_USER_ID>'::uuid,
  'free',
  'active'
)
on conflict (slug) do update
set
  name = excluded.name,
  owner_auth_user_id = excluded.owner_auth_user_id,
  updated_at = now()
returning id, slug, name, owner_auth_user_id, plan, status;
```

Depois, criar membership owner:

```sql
insert into public.organization_memberships (
  organization_id,
  auth_user_id,
  role,
  is_active
)
select
  o.id,
  o.owner_auth_user_id,
  'owner',
  true
from public.organizations o
where o.slug = 'amorim'
on conflict (organization_id, auth_user_id) do update
set
  role = 'owner',
  is_active = true,
  updated_at = now()
returning id, organization_id, auth_user_id, role, is_active;
```

## 8. Alternativa via bloco DO

Opcao para evitar repetir valores:

```sql
do $$
declare
  target_owner uuid := '<OWNER_AUTH_USER_ID>'::uuid;
  target_org_id uuid;
begin
  insert into public.organizations (
    slug,
    name,
    owner_auth_user_id,
    plan,
    status
  )
  values (
    'amorim',
    'Familia Amorim',
    target_owner,
    'free',
    'active'
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    owner_auth_user_id = excluded.owner_auth_user_id,
    updated_at = now()
  returning id into target_org_id;

  insert into public.organization_memberships (
    organization_id,
    auth_user_id,
    role,
    is_active
  )
  values (
    target_org_id,
    target_owner,
    'owner',
    true
  )
  on conflict (organization_id, auth_user_id) do update
  set
    role = 'owner',
    is_active = true,
    updated_at = now();
end $$;
```

## 9. Validacoes obrigatorias depois do bootstrap

### Validar organization

```sql
select id, slug, name, owner_auth_user_id, plan, status, created_at, updated_at
from public.organizations
where slug = 'amorim';
```

### Validar membership owner

```sql
select m.id, m.organization_id, o.slug, m.auth_user_id, m.role, m.is_active
from public.organization_memberships m
join public.organizations o on o.id = m.organization_id
where o.slug = 'amorim';
```

Criterios:

- existe exatamente uma organizacao com slug esperado;
- existe membership para o owner esperado;
- role = `owner`;
- is_active = true.

### Validar helpers RLS

Executar autenticado como o usuario owner em ambiente apropriado:

```sql
select public.current_user_organization_ids();
select public.is_organization_member('<ORG_ID>'::uuid);
select public.is_organization_admin('<ORG_ID>'::uuid);
```

Resultados esperados:

- `current_user_organization_ids()` retorna a organizacao inicial;
- `is_organization_member` retorna true;
- `is_organization_admin` retorna true.

## 10. Validacoes negativas

Com um usuario sem membership:

```sql
select public.is_organization_member('<ORG_ID>'::uuid);
select public.is_organization_admin('<ORG_ID>'::uuid);
```

Resultados esperados:

- false;
- false.

Com membership inativa:

```sql
update public.organization_memberships
set is_active = false
where organization_id = '<ORG_ID>'::uuid
  and auth_user_id = '<USER_ID>'::uuid;
```

Depois validar que helpers retornam false. Reativar em seguida se for usuario real:

```sql
update public.organization_memberships
set is_active = true
where organization_id = '<ORG_ID>'::uuid
  and auth_user_id = '<USER_ID>'::uuid;
```

## 11. Rollback

Se a organizacao ainda nao foi associada a dados financeiros, rollback e simples:

```sql
delete from public.organization_memberships
where organization_id in (
  select id from public.organizations where slug = 'amorim'
);

delete from public.organizations
where slug = 'amorim';
```

Se dados financeiros ja tiverem `organization_id`, nao usar esse rollback sem antes remover/ajustar as referencias.

## 12. Riscos

| ID | Risco | Impacto | Mitigacao |
|---|---|---:|---|
| BOOT-001 | Usar owner_auth_user_id errado | Alto | Validar por e-mail/perfil antes de executar |
| BOOT-002 | Criar slug errado em producao | Medio | Conferir slug por ambiente |
| BOOT-003 | Sobrescrever owner sem querer | Alto | Revisar `on conflict do update` antes de executar |
| BOOT-004 | Criar membership duplicada | Baixo | Unique `(organization_id, auth_user_id)` |
| BOOT-005 | Desativar membership real em teste negativo | Alto | Testes negativos apenas em ambiente seguro |
| BOOT-006 | Executar rollback apos dados financeiros dependerem da organization | Alto | Rollback simples so antes de backfill financeiro |

## 13. Recomendacao

Para o ambiente atual, a opcao mais segura e:

1. identificar manualmente o Admin principal;
2. validar `auth_user_id`;
3. executar SQL controlado para criar organization e owner membership;
4. validar helpers RLS;
5. somente depois seguir para `organization_id` nullable nas tabelas financeiras.

## 14. Criterio de aceite

Esta etapa estara pronta quando:

- slug e nome da organizacao inicial estiverem definidos;
- owner_auth_user_id estiver validado;
- organization inicial existir;
- membership owner existir;
- helpers RLS retornarem true para owner;
- helpers RLS retornarem false para usuario sem membership;
- rollback estiver documentado;
- nenhuma tabela financeira tiver sido alterada.
