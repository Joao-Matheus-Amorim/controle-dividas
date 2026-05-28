# Financial RLS Gate 4 Readiness

## 1. Objetivo

Este documento registra a reconciliacao do Gate 4 de RLS financeira multi-tenant.

O Gate 4 deixou de ser um gate pendente de primeira migration. O estado atual ja inclui hardening `organization_id NOT NULL` e remocao do fallback RLS legado nas tabelas tenant-scoped principais.

Este documento permanece como auditoria historica e deve apontar para o estado vivo em:

- `docs/SAAS_RLS_LIVE_STATUS.md`
- `docs/SAAS_OPERATIONAL_ROADMAP.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`

## 2. Estado reconciliado

As pre-condicoes abaixo ja estao registradas na `main`:

- Gate 1 concluiu a auditoria de queries/actions `owner_id` only.
- Gate 2 concluiu os testes cross-tenant dos vinculos financeiros criticos.
- Gate 3 concluiu a guarda de `organization_id` em novos registros financeiros.
- Gate 5 concluiu a UX de organizacao ativa com indicador, cookie e troca explicita.
- O limite transicional de uma membership ativa por usuario foi removido pela migration `029_drop_one_active_membership_per_user_limit.sql`.
- O inventario atual de policies RLS esta versionado em `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`.

## 3. Hardening ja concluido

`organization_id NOT NULL` ja foi aplicado para:

- `expense_categories` (`020`);
- `family_members` (`021`);
- `expenses` (`022`);
- `payable_bills` (`023`);
- `receivable_incomes` (`024`);
- `banks` (`025`);
- `user_module_permissions` (`026`);
- `user_feature_permissions` (`027`);
- `profiles` (`028_profiles_organization_scope_hardening.sql`).

## 4. Fallback RLS legado removido

As migrations seguintes removem o fallback RLS legado `organization_id IS NULL`:

- `030_expense_categories_rls_remove_legacy_fallback.sql`;
- `031_family_members_rls_remove_legacy_fallback.sql`;
- `032_expenses_rls_remove_legacy_fallback.sql`;
- `033_payable_bills_rls_remove_legacy_fallback.sql`;
- `034_receivable_incomes_rls_remove_legacy_fallback.sql`;
- `035_banks_rls_remove_legacy_fallback.sql`;
- `036_profiles_rls_remove_legacy_fallback.sql`;
- `037_user_module_permissions_rls_remove_legacy_fallback.sql`;
- `038_user_feature_permissions_rls_remove_legacy_fallback.sql`.

## 5. Gap atual do Gate 4

A validacao viva mostrou que tambem havia policies historicas owner-centric ainda presentes em ambiente aplicado:

- policies `*_own` nas tabelas financeiras;
- policies `profiles_*_family`;
- policies `feature_permissions_*_family`.

Essas policies foram removidas manualmente no Supabase vivo validado. A migration `039_drop_legacy_owner_family_policies.sql` versiona essa limpeza em SQL idempotente para manter ambientes reproduziveis.

## 6. Fora de escopo agora

O proximo PR de limpeza nao deve incluir:

- rotas por `orgSlug`;
- billing;
- alteracao visual;
- remocao de `owner_id`;
- refactor amplo de Server Actions;
- E2E data-changing novo sem cleanup.

## 7. Criterio de pronto atual

O estado RLS fica operacionalmente coerente quando:

- a migration idempotente de limpeza `039_drop_legacy_owner_family_policies.sql` estiver aplicada no ambiente alvo;
- o RLS gated focado passar contra Supabase dedicado;
- o RLS Live Gate tiver evidencia de CI quando vars/secrets estiverem configurados.
