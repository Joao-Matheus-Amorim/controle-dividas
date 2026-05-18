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
- `supabase/migrations/015_profiles_organization_rls.sql`
- `supabase/migrations/016_user_module_permissions_organization_rls.sql`
- `supabase/migrations/017_user_feature_permissions_organization_rls.sql`

Busca base:

```txt
create policy
```

## 3. Resumo executivo

O estado historico inicial era owner-centric nas tabelas financeiras e de permissoes antigas. Desde as migrations SaaS/RLS recentes, as tabelas financeiras principais, `profiles`, `user_module_permissions` e `user_feature_permissions` passaram para RLS organization-aware transicional.

Resumo:

- tabelas financeiras da migration `001` usam policies `auth.uid() = owner_id`;
- `profiles` e `user_module_permissions` nasceram owner-centric na migration `003`, mas foram migradas para policies organization-aware nas migrations `015` e `016`;
- `user_feature_permissions` nasceu owner-centric na migration `004`, mas foi migrada para policy organization-aware na migration `017`;
- `organizations` e `organization_memberships` da migration `006` ja usam helpers por membership;
- migration `007` adicionou `organization_id`, mas nao alterou RLS.

Isso confirma que a fase RLS atual avancou em migrations pequenas e que os proximos gates devem focar em admin/permissoes multi-org, UX de organization ativa e hardening final de schema.

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

Historicamente, todas as policies usavam o padrao owner-centric:

```sql
auth.uid() = owner_id
```

### 4.1 `family_members`

Policies historicas da migration `001`:

- `family_members_select_own`
- `family_members_insert_own`
- `family_members_update_own`
- `family_members_delete_own`

Regra historica:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna historica fechada pela migration `010`:

- leitura considera membership por `organization_id`;
- legado `organization_id IS NULL` continua restrito por `owner_id`;
- escrita continua restrita ao owner durante a transicao.

### 4.2 `expense_categories`

Policies historicas da migration `001`:

- `expense_categories_select_own`
- `expense_categories_insert_own`
- `expense_categories_update_own`
- `expense_categories_delete_own`

Regra historica:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna historica fechada pelas migrations `008` e `009`:

- leitura considera membership por `organization_id`;
- legado `organization_id IS NULL` continua restrito por `owner_id`;
- escrita preserva owner durante a transicao.

### 4.3 `expenses`

Policies historicas da migration `001`:

- `expenses_select_own`
- `expenses_insert_own`
- `expenses_update_own`
- `expenses_delete_own`

Regra historica:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna historica fechada pela migration `011`:

- leitura considera membership por `organization_id`;
- legado `organization_id IS NULL` continua restrito por `owner_id`;
- escrita continua restrita ao owner durante a transicao.

Observacao: a aplicacao tambem possui testes e validacoes server-side para `family_member_id` e `category_id`. A RLS transicional protege o escopo da linha; o hardening final ainda pode evoluir checks relacionais mais estritos.

### 4.4 `payable_bills`

Policies historicas da migration `001`:

- `payable_bills_select_own`
- `payable_bills_insert_own`
- `payable_bills_update_own`
- `payable_bills_delete_own`

Regra historica:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna historica fechada pela migration `012`:

- leitura considera membership por `organization_id`;
- legado `organization_id IS NULL` continua restrito por `owner_id`;
- escrita continua restrita ao owner durante a transicao.

### 4.5 `receivable_incomes`

Policies historicas da migration `001`:

- `receivable_incomes_select_own`
- `receivable_incomes_insert_own`
- `receivable_incomes_update_own`
- `receivable_incomes_delete_own`

Regra historica:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna historica fechada pela migration `013`:

- leitura considera membership por `organization_id`;
- legado `organization_id IS NULL` continua restrito por `owner_id`;
- escrita continua restrita ao owner durante a transicao.

### 4.6 `banks`

Policies historicas da migration `001`:

- `banks_select_own`
- `banks_insert_own`
- `banks_update_own`
- `banks_delete_own`

Regra historica:

```txt
select/insert/update/delete por auth.uid() = owner_id
```

Lacuna historica fechada pela migration `014`:

- leitura considera membership por `organization_id`;
- legado `organization_id IS NULL` continua restrito por `owner_id`;
- regra historica de nao ocultar bancos por membro inativo foi preservada.

## 5. Migration 003 - profiles e permissoes por modulo

Arquivo:

```txt
supabase/migrations/003_admin_profiles_permissions.sql
```

A migration habilita RLS para:

- `profiles`;
- `user_module_permissions`.

### 5.1 `profiles`

Policies historicas da migration `003`:

- `profiles_select_family`
- `profiles_insert_family`
- `profiles_update_family`
- `profiles_delete_family`

Regras historicas:

```txt
select: owner_id = auth.uid() OR auth_user_id = auth.uid()
insert: owner_id = auth.uid() OR auth_user_id = auth.uid()
update: owner_id = auth.uid() OR auth_user_id = auth.uid()
delete: owner_id = auth.uid()
```

Lacuna historica fechada pela migration `015`:

- leitura considera membership por `organization_id`, acesso direto do proprio `auth_user_id` e fallback legado por `owner_id`;
- escrita continua restrita ao owner durante a transicao;
- admin/owner multi-org ainda precisa de hardening na application layer.

### 5.2 `user_module_permissions`

Policies historicas da migration `003`:

- `permissions_select_family`
- `permissions_insert_family`
- `permissions_update_family`
- `permissions_delete_family`

Regra historica:

```txt
select/insert/update/delete por owner_id = auth.uid()
```

Lacuna historica fechada pela migration `016`:

- a leitura agora considera membership por `organization_id`;
- linhas legadas `organization_id IS NULL` continuam restritas por `owner_id`;
- escrita continua restrita ao owner durante a transicao.

## 6. Migration 004 - feature permissions

Arquivo:

```txt
supabase/migrations/004_permission_scope_and_features.sql
```

A migration habilita RLS para:

- `user_feature_permissions`.

### 6.1 `user_feature_permissions`

Policies historicas da migration `004`:

- `feature_permissions_select_family`
- `feature_permissions_insert_family`
- `feature_permissions_update_family`
- `feature_permissions_delete_family`

Regra historica:

```txt
select/insert/update/delete por owner_id = auth.uid()
```

Lacuna historica fechada pela migration `017`:

- a leitura agora considera membership por `organization_id`;
- linhas legadas `organization_id IS NULL` continuam restritas por `owner_id`;
- escrita continua restrita ao owner durante a transicao.

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

Implicacao historica:

- schema ja permite escopo por organization;
- RLS passou a usar esse escopo nas migrations `008` a `017`;
- application layer ja foi migrada parcialmente, mas admin/permissoes ainda precisam de hardening futuro.

## 9. Tabelas ainda em fase transicional

As seguintes tabelas ja possuem RLS organization-aware transicional, mas ainda dependem de `owner_id`, `organization_id` nullable e fallback legado:

- `profiles`;
- `family_members`;
- `expense_categories`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`;
- `user_module_permissions`;
- `user_feature_permissions`.

Isso ainda nao e o modelo SaaS final. O proximo hardening deve remover gradualmente fallback legado apenas depois de backfill completo, testes gated e plano de rollback.

## 10. Riscos identificados

### 10.1 Dependencia transicional de `owner_id`

As policies atuais ainda preservam `owner_id` para escrita e fallback legado.

Isso e aceitavel apenas na fase transicional, mas nao e isolamento SaaS final.

### 10.2 Legado `organization_id IS NULL`

As migrations RLS transicionais permitem legado temporariamente.

O fallback permanece restrito por `owner_id`.

### 10.3 Recursao em memberships

Ja houve cuidado na migration 006 para evitar recursao.

Qualquer mudanca em `organization_memberships` deve manter helpers nao recursivos.

### 10.4 Service role pode mascarar problemas

Testes de RLS nao podem depender apenas de service role/admin client.

Precisam simular usuario autenticado comum.

### 10.5 Permissoes ainda dependem de hardening no Admin

`user_module_permissions` e `user_feature_permissions` ja usam policies organization-aware transicionais.

Antes de multi-org pleno, o Admin e os fluxos de escrita de permissoes ainda precisam gravar e filtrar `organization_id` de forma consistente na application layer.

## 11. Recomendacao de proximo passo

Depois das migrations RLS transicionais:

1. manter guardas unitarios para cada migration RLS recente;
2. manter testes gated simulando usuario autenticado comum;
3. auditar Admin/permissoes para gravar e filtrar `organization_id`;
4. planejar UX de organization ativa;
5. endurecer `organization_id NOT NULL` apenas depois de backfill completo e rollback definido.

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
