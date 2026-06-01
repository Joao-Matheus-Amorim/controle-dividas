# Organization Membership RLS Helpers Design

Issue: #152

> Status DocDoc: Atual como contexto de helpers
> Uso atual: contexto dos helpers de membership usados por policies RLS.
> Observacao: confirmar definicao real nas migrations e no banco alvo antes de
> alterar policies ou criar helpers novos.

## 1. Objetivo

Este documento detalha o desenho dos helpers SQL de membership que devem sustentar futuras policies RLS financeiras multi-tenant.

Ele complementa:

- `docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`

Esta PR nao cria helpers, nao altera migrations e nao altera policies.

## 2. Estado atual dos helpers

A migration `006_organizations_memberships.sql` ja criou tres helpers:

```txt
public.current_user_organization_ids()
public.is_organization_member(target_organization_id uuid)
public.is_organization_admin(target_organization_id uuid)
```

Caracteristicas atuais:

- `language sql`;
- `stable`;
- `security definer`;
- `set search_path = public`;
- fazem leitura em `public.organization_memberships`;
- consideram `auth.uid()`;
- filtram `is_active = true`;
- evitam policies recursivas em `organization_memberships`.

## 3. Principio de design

A primeira fase de RLS financeira deve preferir **reusar helpers existentes** antes de criar novos.

Motivos:

- menos superficie de seguranca;
- menos risco de erro em migration;
- helpers ja foram validados contra recursao;
- policies financeiras podem usar `organization_id` diretamente com `public.is_organization_member(organization_id)`;
- admins podem ser tratados com `public.is_organization_admin(organization_id)`.

Criar helper novo apenas se houver necessidade clara que os helpers atuais nao cubram.

## 4. Uso recomendado dos helpers existentes

### 4.1 Leitura basica por membership

Para tabelas financeiras com `organization_id` preenchido:

```sql
using (public.is_organization_member(organization_id))
```

Candidatas:

- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

### 4.2 Escrita administrativa

Para updates administrativos, usar `USING` e `WITH CHECK`:

```sql
using (public.is_organization_admin(organization_id))
with check (public.is_organization_admin(organization_id))
```

Para deletes administrativos, usar somente `USING`:

```sql
using (public.is_organization_admin(organization_id))
```

Importante: `WITH CHECK` nao se aplica a policies `FOR DELETE` em PostgreSQL. Nao copiar exemplos de update diretamente para delete.

Candidatas:

- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`;
- configuracoes de categorias, dependendo da regra de produto.

### 4.3 Inserts em tabelas financeiras

Para inserts simples:

```sql
with check (public.is_organization_member(organization_id))
```

Ou, se o fluxo exigir admin:

```sql
with check (public.is_organization_admin(organization_id))
```

A regra exata deve ser definida por tabela no momento da migration.

## 5. Tratamento de legado nos helpers

Os helpers atuais nao tratam `organization_id IS NULL`.

Isso e correto: helpers de membership recebem uma organization explicita.

A compatibilidade legada deve ser tratada nas policies temporarias, nao dentro de `public.is_organization_member(uuid)`.

Exemplo conceitual de policy temporaria:

```sql
using (
  public.is_organization_member(organization_id)
  or (
    organization_id is null
    and owner_id = auth.uid()
  )
)
```

Observacao: o fallback acima e apenas conceitual. A regra final deve ser validada na issue #153 antes de qualquer migration.

## 6. Recursao e `organization_memberships`

### 6.1 Risco

Policies em `organization_memberships` que consultam diretamente `organization_memberships` podem causar recursao.

Esse risco ja foi observado e tratado anteriormente com helpers `SECURITY DEFINER`.

### 6.2 Regra obrigatoria

Nao criar policy em `organization_memberships` assim:

```sql
using (
  exists (
    select 1
    from public.organization_memberships m
    where ...
  )
)
```

Em policies da propria tabela `organization_memberships`, usar helpers ja existentes:

```sql
using (public.is_organization_member(organization_id))
```

ou:

```sql
using (public.is_organization_admin(organization_id))
```

### 6.3 Helpers novos e recursao

Se um helper novo consultar `organization_memberships`, ele deve:

- ser `security definer`;
- usar `set search_path = public`;
- ser testado contra recursao;
- ser revisado antes de uso em policies da propria tabela.

## 7. `search_path` e seguranca

Todo helper RLS novo deve usar `search_path` fixo:

```sql
set search_path = public
```

Motivo:

- reduz risco de shadowing de objetos;
- evita resolucao inesperada de schemas;
- deixa a execucao previsivel em `SECURITY DEFINER`.

Padrao recomendado:

```sql
create or replace function public.helper_name(...)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  ...
$$;
```

Permissoes recomendadas:

```sql
revoke all on function public.helper_name(...) from public;
grant execute on function public.helper_name(...) to authenticated;
```

A concessao a `anon` deve ser evitada salvo justificativa explicita.

## 8. Possiveis helpers futuros

Nao criar agora.

Apenas considerar se as policies ficarem repetitivas ou se houver regra comum clara.

### 8.1 `public.can_read_organization_finance(uuid)`

Possivel objetivo:

```txt
Centralizar regra de leitura financeira por membership ativa.
```

Possivel implementacao conceitual:

```sql
returns boolean as public.is_organization_member(target_organization_id)
```

Risco:

- pode virar wrapper redundante sem ganho real;
- pode esconder detalhes importantes da policy.

Recomendacao atual:

- nao criar na primeira migration;
- preferir `public.is_organization_member(organization_id)` diretamente.

### 8.2 `public.can_admin_organization_finance(uuid)`

Possivel objetivo:

```txt
Centralizar regra administrativa financeira por owner/admin.
```

Possivel implementacao conceitual:

```sql
returns boolean as public.is_organization_admin(target_organization_id)
```

Recomendacao atual:

- nao criar agora;
- usar `public.is_organization_admin(organization_id)` diretamente ate surgir necessidade clara.

### 8.3 Helper para legado

Evitar helper generico para legado no primeiro momento.

Motivo:

- fallback legado pode variar por tabela;
- algumas tabelas podem exigir `owner_id`, outras podem exigir relacao por perfil;
- encapsular cedo demais pode criar falsa sensacao de seguranca.

A estrategia legada pertence a #153.

## 9. Guidelines por tabela

### 9.1 Tabelas financeiras principais

Candidatas a usar `is_organization_member` diretamente:

- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Policy conceitual de leitura:

```sql
using (public.is_organization_member(organization_id))
```

Policy conceitual de insert:

```sql
with check (public.is_organization_member(organization_id))
```

Updates/deletes podem iniciar com membership ou exigir admin, conforme decisao de produto e permissao de aplicacao.

### 9.2 Tabelas base

Candidatas:

- `family_members`;
- `expense_categories`.

Cuidado:

- sao usadas por outras tabelas;
- precisam de rollout antes ou junto das tabelas dependentes;
- categorias default e membros inativos precisam de regra documentada.

### 9.3 Tabelas de permissao

Candidatas:

- `profiles`;
- `user_module_permissions`;
- `user_feature_permissions`.

Cuidado:

- ainda sao fortemente owner-centric;
- podem precisar de helpers ou policies administrativas mais restritas;
- nao devem ser migradas junto com tabelas financeiras de alto volume sem plano dedicado.

## 10. Recomendacao final

Para a primeira migration de RLS financeira:

1. Reusar `public.is_organization_member(uuid)` e `public.is_organization_admin(uuid)`.
2. Nao criar wrappers novos sem necessidade real.
3. Manter fallback legado fora dos helpers de membership.
4. Documentar rollback antes de qualquer policy nova.
5. Testar usuario autenticado comum, nao apenas service role.
6. Evitar qualquer alteracao recursiva em `organization_memberships`.
7. Separar exemplos de UPDATE e DELETE, porque DELETE nao aceita `WITH CHECK`.

## 11. Fora de escopo

Este documento nao implementa:

- migration;
- helper novo;
- policy nova;
- alteracao em RLS atual;
- alteracao em codigo de producao;
- alteracao em testes;
- rotas;
- billing;
- `organization_id NOT NULL`;
- remocao de `owner_id`.
