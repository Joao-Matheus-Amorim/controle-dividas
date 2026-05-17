# Current RLS Policies Inventory

Issue: #151

## 1. Objetivo

Este documento inventaria o estado atual das policies RLS relevantes para a fase SaaS multi-tenant do FamilyFinance.

Ele e um documento de auditoria e planejamento.

Esta PR nao altera:

- migrations;
- policies;
- helpers SQL;
- codigo de producao;
- testes;
- rotas;
- billing.

## 2. Fontes revisadas

Arquivos revisados:

- `supabase/migrations/001_family_finance_schema.sql`
- `supabase/migrations/003_admin_profiles_permissions.sql`
- `supabase/migrations/004_permission_scope_and_features.sql`
- `supabase/migrations/006_organizations_memberships.sql`
- `supabase/migrations/007_add_organization_id_columns.sql`

Busca base:

```txt
create policy
```

## 3. Resumo executivo

O estado atual ainda e majoritariamente owner-centric nas tabelas financeiras e de permissoes antigas.

Resumo:

- tabelas financeiras da migration `001` usam policies `auth.uid() = owner_id`;
- `profiles` e `user_module_permissions` da migration `003` usam `owner_id` e/ou `auth_user_id`;
- `user_feature_permissions` da migration `004` usa `owner_id`;
- `organizations` e `organization_memberships` da migration `006` ja usam helpers por membership;
- migration `007` adicionou `organization_id`, mas nao alterou RLS.

Isso confirma que a proxima fase de RLS financeira precisa ser planejada em migrations futuras pequenas.

## 4. Migration 001 - tabelas financeiras iniciais

Arquivo:

```txt
supabase/migrations/001_family_finance_schema.sql
```

A migration habilita RLS para:

- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Todas as policies usam o padrao owner-centric:

```sql
auth.uid() = owner_id
```

### 4.1 `family_members`

Policies atuais:

- `family_members_select_own`
- `family_members_insert_own`
- `family_members_update_own`
- `family_members_delete_own`

Regra atual:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao considera membership;
- nao diferencia roles de organization.

### 4.2 `expense_categories`

Policies atuais:

- `expense_categories_select_own`
- `expense_categories_insert_own`
- `expense_categories_update_own`
- `expense_categories_delete_own`

Regra atual:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna para SaaS:

- nao considera `organization_id`;
- categorias default/legadas exigem regra futura clara.

### 4.3 `expenses`

Policies atuais:

- `expenses_select_own`
- `expenses_insert_own`
- `expenses_update_own`
- `expenses_delete_own`

Regra atual:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao valida membership;
- nao valida via RLS se `family_member_id` ou `category_id` pertencem a mesma organization.

Observacao: a aplicacao ja possui testes e validacoes server-side para `family_member_id` e `category_id`, mas isso ainda nao substitui RLS multi-tenant.

### 4.4 `payable_bills`

Policies atuais:

- `payable_bills_select_own`
- `payable_bills_insert_own`
- `payable_bills_update_own`
- `payable_bills_delete_own`

Regra atual:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao valida via RLS se `responsible_member_id` pertence a mesma organization.

### 4.5 `receivable_incomes`

Policies atuais:

- `receivable_incomes_select_own`
- `receivable_incomes_insert_own`
- `receivable_incomes_update_own`
- `receivable_incomes_delete_own`

Regra atual:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao valida via RLS se `receiver_member_id` pertence a mesma organization.

### 4.6 `banks`

Policies atuais:

- `banks_select_own`
- `banks_insert_own`
- `banks_update_own`
- `banks_delete_own`

Regra atual:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao valida via RLS se `family_member_id` pertence a mesma organization;
- precisa preservar a regra historica de nao ocultar bancos por membro inativo.

## 5. Migration 003 - profiles e permissoes por modulo

Arquivo:

```txt
supabase/migrations/003_admin_profiles_permissions.sql
```

A migration habilita RLS para:

- `profiles`;
- `user_module_permissions`.

### 5.1 `profiles`

Policies atuais:

- `profiles_select_family`
- `profiles_insert_family`
- `profiles_update_family`
- `profiles_delete_family`

Regras atuais:

```txt
select: owner_id = auth.uid() OR auth_user_id = auth.uid()
insert: owner_id = auth.uid() OR auth_user_id = auth.uid()
update: owner_id = auth.uid() OR auth_user_id = auth.uid()
delete: owner_id = auth.uid()
```

Lacuna para SaaS:

- ainda e owner/profile centric;
- nao considera `organization_id`;
- nao considera `organization_memberships`;
- precisa de desenho especifico para admin/owner multi-org.

### 5.2 `user_module_permissions`

Policies atuais:

- `permissions_select_family`
- `permissions_insert_family`
- `permissions_update_family`
- `permissions_delete_family`

Regra atual:

```txt
select/insert/update/delete por owner_id = auth.uid()
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao considera admin/owner da organization;
- permissoes afetam visibilidade e precisam de cuidado antes de multi-org pleno.

## 6. Migration 004 - feature permissions

Arquivo:

```txt
supabase/migrations/004_permission_scope_and_features.sql
```

A migration habilita RLS para:

- `user_feature_permissions`.

### 6.1 `user_feature_permissions`

Policies atuais:

- `feature_permissions_select_family`
- `feature_permissions_insert_family`
- `feature_permissions_update_family`
- `feature_permissions_delete_family`

Regra atual:

```txt
select/insert/update/delete por owner_id = auth.uid()
```

Lacuna para SaaS:

- nao considera `organization_id`;
- nao considera membership;
- precisa acompanhar o redesign de permissoes multi-org.

## 7. Migration 006 - organizations e memberships

Arquivo:

```txt
supabase/migrations/006_organizations_memberships.sql
```

A migration habilita RLS para:

- `organizations`;
- `organization_memberships`.

### 7.1 Helpers existentes

Helpers atuais:

- `public.current_user_organization_ids()`
- `public.is_organization_member(target_organization_id uuid)`
- `public.is_organization_admin(target_organization_id uuid)`

Caracteristicas:

- `language sql`;
- `stable`;
- `security definer`;
- `set search_path = public`;
- executaveis por `authenticated`;
- criados para evitar recursion em RLS.

### 7.2 `organizations`

Policies atuais:

- `organizations_select_member`
- `organizations_insert_owner`
- `organizations_update_owner_or_admin`
- `organizations_delete_owner`

Regras atuais:

```txt
select: public.is_organization_member(id)
insert: owner_auth_user_id = auth.uid()
update: public.is_organization_admin(id)
delete: membership owner ativa
```

Observacao:

- `organizations_delete_owner` consulta `organization_memberships`, mas esta policy esta em `organizations`, nao em `organization_memberships`.

### 7.3 `organization_memberships`

Policies atuais:

- `organization_memberships_select_member`
- `organization_memberships_insert_admin`
- `organization_memberships_update_admin`
- `organization_memberships_delete_admin`

Regras atuais:

```txt
select: public.is_organization_member(organization_id)
insert/update/delete: public.is_organization_admin(organization_id)
```

Ponto critico:

- nao trocar essas policies por consultas diretas recursivas na propria tabela;
- manter helpers `SECURITY DEFINER` com `search_path` fixo.

## 8. Migration 007 - organization_id nullable

Arquivo:

```txt
supabase/migrations/007_add_organization_id_columns.sql
```

A migration adicionou `organization_id` nullable e indices nas tabelas existentes, mas explicitamente nao alterou policies.

Tabelas afetadas:

- `profiles`;
- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `user_module_permissions`;
- `user_feature_permissions`.

Implicacao:

- schema ja permite escopo por organization;
- RLS ainda nao usa esse escopo nas tabelas financeiras antigas;
- application layer ja foi migrada parcialmente, mas banco ainda precisa de hardening futuro.

## 9. Tabelas sem RLS financeira multi-tenant hoje

As seguintes tabelas ainda nao possuem RLS multi-tenant por membership:

- `profiles`;
- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `user_module_permissions`;
- `user_feature_permissions`.

Todas precisam de planejamento antes de migration.

## 10. Riscos identificados

### 10.1 Dependencia de `owner_id`

As policies atuais protegem por `owner_id`, nao por `organization_id`.

Isso e aceitavel apenas na fase transicional, mas nao e isolamento SaaS final.

### 10.2 Legado `organization_id IS NULL`

A primeira RLS multi-tenant precisa decidir se permite legado temporariamente.

Se permitir, o fallback deve ser restrito por `owner_id` ou regra equivalente segura.

### 10.3 Recursao em memberships

Ja houve cuidado na migration 006 para evitar recursao.

Qualquer mudanca em `organization_memberships` deve manter helpers nao recursivos.

### 10.4 Service role pode mascarar problemas

Testes de RLS nao podem depender apenas de service role/admin client.

Precisam simular usuario autenticado comum.

### 10.5 Permissoes ainda sao owner-centric

`user_module_permissions` e `user_feature_permissions` continuam baseadas em `owner_id`.

Antes de multi-org pleno, permissoes precisam de plano proprio.

## 11. Recomendacao de proximo passo

Antes da primeira migration de RLS financeira:

1. concluir desenho dos helpers RLS (#152);
2. concluir estrategia de legado `organization_id IS NULL` (#153);
3. concluir rollout/rollback (#154);
4. concluir matriz de testes RLS (#155);
5. so entao abrir primeira PR de migration RLS pequena.

## 12. Fora de escopo deste inventario

Este inventario nao altera:

- RLS;
- migrations;
- helpers SQL;
- codigo de producao;
- testes;
- rotas;
- billing;
- `owner_id`;
- `organization_id NOT NULL`.
