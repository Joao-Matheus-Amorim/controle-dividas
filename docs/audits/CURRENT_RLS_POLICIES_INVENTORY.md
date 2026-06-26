# Current RLS Policies Inventory

Issue: #548

## 1. Objetivo

Este documento inventaria o estado atual das policies RLS relevantes para a fase SaaS multi-tenant do FamilyFinance.

Ele e um documento de auditoria e planejamento. O estado operacional vivo fica em `docs/VALIDACAO_TECNICA.md`, o contexto historico de evidencias RLS fica em `docs/SAAS_RLS_LIVE_STATUS.md`, e a ordem de proximos passos fica em `docs/SAAS_OPERATIONAL_ROADMAP.md`.

## 2. Fontes revisadas

Arquivos revisados:

- `supabase/migrations/001_family_finance_schema.sql`
- `supabase/migrations/003_admin_profiles_permissions.sql`
- `supabase/migrations/004_permission_scope_and_features.sql`
- `supabase/migrations/006_organizations_memberships.sql`
- `supabase/migrations/007_add_organization_id_columns.sql`
- `supabase/migrations/008_expense_categories_organization_rls.sql`
- `supabase/migrations/009_expense_categories_owner_write_rls.sql`
- `supabase/migrations/010_family_members_organization_rls.sql`
- `supabase/migrations/011_expenses_organization_rls.sql`
- `supabase/migrations/012_payable_bills_organization_rls.sql`
- `supabase/migrations/013_receivable_incomes_organization_rls.sql`
- `supabase/migrations/014_banks_organization_rls.sql`
- `supabase/migrations/015_profiles_organization_rls.sql`
- `supabase/migrations/016_user_module_permissions_organization_rls.sql`
- `supabase/migrations/017_user_feature_permissions_organization_rls.sql`
- `supabase/migrations/020_expense_categories_organization_scope_hardening.sql`
- `supabase/migrations/021_family_members_organization_scope_hardening.sql`
- `supabase/migrations/022_expenses_organization_scope_hardening.sql`
- `supabase/migrations/023_payable_bills_organization_scope_hardening.sql`
- `supabase/migrations/024_receivable_incomes_organization_scope_hardening.sql`
- `supabase/migrations/025_banks_organization_scope_hardening.sql`
- `supabase/migrations/026_user_module_permissions_organization_scope_hardening.sql`
- `supabase/migrations/027_user_feature_permissions_organization_scope_hardening.sql`
- `supabase/migrations/028_profiles_organization_scope_hardening.sql`
- `supabase/migrations/030_expense_categories_rls_remove_legacy_fallback.sql`
- `supabase/migrations/031_family_members_rls_remove_legacy_fallback.sql`
- `supabase/migrations/032_expenses_rls_remove_legacy_fallback.sql`
- `supabase/migrations/033_payable_bills_rls_remove_legacy_fallback.sql`
- `supabase/migrations/034_receivable_incomes_rls_remove_legacy_fallback.sql`
- `supabase/migrations/035_banks_rls_remove_legacy_fallback.sql`
- `supabase/migrations/036_profiles_rls_remove_legacy_fallback.sql`
- `supabase/migrations/037_user_module_permissions_rls_remove_legacy_fallback.sql`
- `supabase/migrations/038_user_feature_permissions_rls_remove_legacy_fallback.sql`
- `supabase/migrations/039_drop_legacy_owner_family_policies.sql`
- `supabase/migrations/051_banks_organization_write_rls.sql`
- `supabase/migrations/052_expenses_organization_write_rls.sql`
- `supabase/migrations/053_payable_bills_organization_write_rls.sql`
- `supabase/migrations/054_receivable_incomes_organization_write_rls.sql`

Busca base:

```txt
create policy
drop policy
alter table public.<table> enable row level security
organization_id IS NULL
auth.uid() = owner_id
```

## 3. Resumo executivo

O estado historico inicial era owner-centric nas tabelas financeiras e de permissoes antigas. A cadeia atual evoluiu para:

- `organizations` e `organization_memberships` com RLS baseado em membership/admin via helpers `SECURITY DEFINER` da migration `006`;
- tabelas tenant-scoped principais com `organization_id NOT NULL` nas migrations `020` a `028`;
- fallback RLS legado `organization_id IS NULL` removido nas migrations `030` a `038`;
- runtime/app usando organizacao ativa, sem `organizationOrLegacyFilter` nas superficies principais;
- `owner_id` ainda presente para compatibilidade e write ownership.

Classificacao atual:

| Tabela | Status | Observacao |
| --- | --- | --- |
| `organizations` | covered | RLS por membership/admin/owner na migration `006`. |
| `organization_memberships` | covered | RLS por helpers nao recursivos na migration `006`. |
| `profiles` | hardened/transitional-owner | `organization_id NOT NULL`; leitura permite proprio `auth_user_id` ou membership; writes ainda preservam `owner_id`. |
| `family_members` | hardened | `organization_id NOT NULL`; select por membership; writes por owner/admin da organizacao e constraint de `owner_id` legado igual ao owner da organizacao alvo. |
| `expenses` | hardened | `organization_id NOT NULL`; select por membership; writes por permissao `GASTOS` por membro/acao com constraint de `owner_id` legado igual ao owner da organizacao alvo. |
| `expense_categories` | hardened | `organization_id NOT NULL`; select por membership; writes por owner/admin da organizacao. |
| `banks` | hardened | `organization_id NOT NULL`; select por membership; writes por permissao `BANCOS` por membro/acao com constraint de `owner_id` legado igual ao owner da organizacao alvo; nao depende de membro ativo por preservar historico. |
| `payable_bills` | hardened | `organization_id NOT NULL`; select por membership; writes por permissao `CONTAS_A_PAGAR` por membro/acao com constraint de `owner_id` legado igual ao owner da organizacao alvo. |
| `receivable_incomes` | hardened | `organization_id NOT NULL`; select por membership; writes por permissao `CONTAS_A_RECEBER` por membro/acao com constraint de `owner_id` legado igual ao owner da organizacao alvo. |
| `user_module_permissions` | hardened | `organization_id NOT NULL`; select por membership; writes por owner + membership. |
| `user_feature_permissions` | hardened | `organization_id NOT NULL`; select por membership; writes por owner + membership. |

## 4. Policies por grupo

### 4.1 Organizations e memberships

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

### 4.2 Tabelas financeiras

Tabelas:

- `expense_categories`;
- `family_members`;
- `expenses`;
- `payable_bills`;
- `receivable_incomes`;
- `banks`.

Modelo atual:

```txt
select: public.is_organization_member(organization_id)
insert/update/delete: `expenses` usa permissao `GASTOS`; `banks` usa permissao `BANCOS`; `payable_bills` usa permissao `CONTAS_A_PAGAR`; `receivable_incomes` usa permissao `CONTAS_A_RECEBER`; `expense_categories` e `family_members` usam owner/admin da organizacao; demais tabelas ainda transicionais usam owner + membership
```

O fallback `organization_id IS NULL` foi removido pelas migrations `030` a `035`.

### 4.3 Profiles

Modelo atual:

```txt
select: auth_user_id = auth.uid() OR public.is_organization_member(organization_id)
insert/update/delete: owner_id = auth.uid() AND public.is_organization_member(organization_id)
```

`profiles.organization_id` foi endurecido pela migration `028`, e o fallback RLS legado foi removido pela migration `036`.

### 4.4 Permissions

Tabelas:

- `user_module_permissions`;
- `user_feature_permissions`.

Modelo atual:

```txt
select: public.is_organization_member(organization_id)
insert/update/delete: owner_id = auth.uid() AND public.is_organization_member(organization_id)
```

`organization_id NOT NULL` foi aplicado nas migrations `026` e `027`, e o fallback RLS legado foi removido nas migrations `037` e `038`.

## 5. Gap operacional fechado na cadeia de migrations

Durante a validacao no Supabase vivo, as migrations `030` a `038` removeram as policies `*_organization_or_legacy`, mas ainda existiam policies historicas antigas que permitiam acesso por `owner_id` sem membership ativa:

- `*_select_own`, `*_insert_own`, `*_update_own`, `*_delete_own` nas tabelas financeiras;
- `profiles_*_family`;
- `feature_permissions_*_family`.

Essas policies foram removidas manualmente no Supabase vivo validado e o gate RLS focado passou.

Para a migration history ficar 100% reproduzivel, a migration `039_drop_legacy_owner_family_policies.sql` versiona essa limpeza de policies antigas `*_own`/`*_family` com `drop policy if exists`.

## 6. Riscos atuais

### 6.1 `owner_id` ainda e transicional

`owner_id` continua existindo e participa dos writes. Isso nao e o modelo SaaS final, mas ainda e parte do contrato atual.

### 6.2 Reproducibilidade de migrations

Ambientes que tenham aplicado migrations antigas precisam receber a migration `039_drop_legacy_owner_family_policies.sql` para garantir que policies owner-centric historicas tambem sejam removidas.

### 6.3 Service role pode mascarar problemas

Testes de RLS nao podem depender apenas de service role/admin client. Precisam simular usuario autenticado comum.

### 6.4 Recursao em memberships

Qualquer mudanca em `organization_memberships` deve preservar helpers nao recursivos.

## 7. Recomendacao de proximo passo

1. Aplicar a migration `039_drop_legacy_owner_family_policies.sql` em todo ambiente que ainda nao recebeu a limpeza manual equivalente.
2. Se voltar a existir ambiente isolado para isso, recriar um gate equivalente antes de depender de evidencia nova de RLS em ambiente dedicado.
3. Implementar rotas por `orgSlug` seguindo ADR 0007, com `/protected` como compatibilidade.
4. Billing apenas depois de isolamento e UX multi-org estarem maduros.
5. Remover `owner_id` apenas em gate futuro com preflight, rollback e evidencia.

## 8. Fora de escopo deste inventario

Este inventario nao altera:

- RLS;
- migrations;
- helpers SQL;
- codigo de producao;
- rotas;
- billing;
- `owner_id`.
