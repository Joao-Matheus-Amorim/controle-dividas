# SaaS Operational Roadmap

Atualizado em: 2026-05-28

## 1. Objetivo

Este documento consolida o estado real do codigo, migrations, testes e documentacao viva para orientar as proximas decisoes sem precisar revarrer o repositorio a cada frente.

Fontes cruzadas nesta revisao:

- `app/**`
- `components/**`
- `lib/**`
- `supabase/migrations/**`
- `tests/e2e/**`
- `__tests__/**`
- `docs/SAAS_RLS_LIVE_STATUS.md`
- `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`
- `docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md`
- `docs/rls/RLS_LIVE_GATE.md`
- `.github/workflows/rls-live-gate.yml`

## 2. Estado real confirmado

### Multi-tenant e organizacao ativa

- `organizations` e `organization_memberships` existem.
- `lib/organizations/server.ts` resolve contexto de organizacao ativa.
- `app/protected/layout.tsx` carrega `getCurrentOrganization()` e `getUserOrganizations()`.
- `components/app/active-organization-indicator.tsx` exibe organizacao ativa e permite troca quando ha mais de uma.
- `app/protected/organization-switcher-actions.ts` persiste a troca de organizacao ativa.

### Schema tenant-scoped

`organization_id NOT NULL` ja esta versionado para:

- `expense_categories` (`020`);
- `family_members` (`021`);
- `expenses` (`022`);
- `payable_bills` (`023`);
- `receivable_incomes` (`024`);
- `banks` (`025`);
- `user_module_permissions` (`026`);
- `user_feature_permissions` (`027`);
- `profiles` (`028`).

### RLS

Fallback RLS legado `organization_id IS NULL` ja foi removido pelas migrations:

- `030_expense_categories_rls_remove_legacy_fallback.sql`;
- `031_family_members_rls_remove_legacy_fallback.sql`;
- `032_expenses_rls_remove_legacy_fallback.sql`;
- `033_payable_bills_rls_remove_legacy_fallback.sql`;
- `034_receivable_incomes_rls_remove_legacy_fallback.sql`;
- `035_banks_rls_remove_legacy_fallback.sql`;
- `036_profiles_rls_remove_legacy_fallback.sql`;
- `037_user_module_permissions_rls_remove_legacy_fallback.sql`;
- `038_user_feature_permissions_rls_remove_legacy_fallback.sql`.

A limpeza final de policies antigas owner/family foi versionada em:

- `039_drop_legacy_owner_family_policies.sql`.

### Runtime

- As superficies principais de runtime usam organizacao ativa.
- Os guards atuais bloqueiam retorno para `organizationOrLegacyFilter` e `organization_id.is.null` nas queries/actions principais.
- `owner_id` ainda existe e ainda participa de write ownership.

### E2E e gates

- Playwright tem smoke publico/auth.
- Onboarding autenticado gated cria organizacao inicial e entra no app protegido.
- Rotas protegidas autenticadas principais existem como contratos gated.
- Data-changing E2E existe como gated skipped-by-default.
- Troca de organizacao ativa tem contrato Playwright gated cleanup-backed em `tests/e2e/multi-org-switch-authenticated-gated.spec.ts`.
- RLS Live Gate existe em `.github/workflows/rls-live-gate.yml` e ja gera GitHub Step Summary + artifact `rls-live-gate-evidence-*`, mas ainda precisa de vars/secrets e execucao dedicada para virar evidencia verde de CI.

## 3. Gap real antes de declarar 100% coerente

### GAP-001 - Limpeza de policies antigas versionada

O Supabase vivo validado ja teve as policies antigas owner-centric removidas manualmente:

- `*_own` das tabelas financeiras;
- `profiles_*_family`;
- `feature_permissions_*_family`.

Agora a cadeia de migrations possui a migration idempotente `039_drop_legacy_owner_family_policies.sql` para reproduzir essa limpeza em qualquer ambiente que tenha aplicado migrations antigas.

Resultado esperado:

- migration `039_drop_legacy_owner_family_policies.sql` com `drop policy if exists`;
- teste/guard conferindo que o arquivo versiona a limpeza;
- RLS gated focado passando depois da migration aplicada no ambiente alvo.

### GAP-002 - RLS Live Gate com evidencia de CI

O workflow existe e ja possui plumbing de evidencia auditavel. O estado ainda pendente e a execucao real no GitHub Actions com ambiente Supabase dedicado.

Resultado esperado:

- configurar `RLS_TEST_SUPABASE_URL` como repository variable;
- configurar `RLS_TEST_SUPABASE_ANON_KEY`, `RLS_TEST_SUPABASE_SERVICE_ROLE_KEY`, `RLS_TEST_USER_A_*`, `RLS_TEST_USER_B_*` como secrets;
- rodar `RLS Live Gate` via `workflow_dispatch`;
- confirmar o GitHub Step Summary e o artifact `rls-live-gate-evidence-*`;
- registrar evidencia no status vivo somente depois de uma execucao real verde.

### GAP-003 - Contrato E2E de troca de organizacao ativa

A troca de organizacao ativa existe no app e agora possui contrato E2E gated cleanup-backed versionado.

Resultado atual:

- `RUN_MULTI_ORG_SWITCH_E2E=true`;
- usuario dedicado em `E2E_MULTI_ORG_EMAIL`/`E2E_MULTI_ORG_PASSWORD`;
- criacao de duas organizations temporarias com prefixo `e2e-multi-org-switch-`;
- troca pelo selector real;
- reload para confirmar persistencia;
- cleanup por slug prefixado.

### GAP-004 - Rotas por `orgSlug`

As rotas atuais ainda usam `/protected`. Helpers ja aceitam `orgSlug` opcional, mas nao ha estrutura de rota organization-aware no App Router.

O contrato de roteamento foi definido no ADR 0007:

```txt
/org/[orgSlug]
```

`/protected` permanece como compatibilidade transicional ate a migracao ser concluida.

Resultado esperado:

- helpers centralizados de path para `/org/[orgSlug]`;
- primeira rota `/org/[orgSlug]` para dashboard sem remover `/protected`;
- validacao server-side de acesso ao slug recebido na URL;
- redirects/fallbacks definidos sem quebrar `/protected`;
- cobertura E2E de slug valido, slug sem acesso e compatibilidade `/protected`.

### GAP-005 - Billing

`organizations` possui campos como `plan` e `stripe_customer_id`, mas nao ha implementacao Stripe/checkout/subscription.

Resultado esperado:

- decidir modelo de plano por organization;
- criar integration plan;
- implementar billing somente depois de RLS Live Gate, orgSlug e UX multi-org estarem estaveis.

### GAP-006 - Remocao futura de `owner_id`

`owner_id` ainda e parte do contrato atual. Remover agora seria prematuro.

Resultado esperado:

- inventario de uso de `owner_id`;
- preflight de dependencias;
- plano de rollback;
- migration e runtime em PRs separados.

## 4. Ordem recomendada dos proximos PRs

1. **RLS Live Gate evidence**
   - Configurar ambiente GitHub dedicado.
   - Rodar workflow manual.
   - Validar GitHub Step Summary e artifact `rls-live-gate-evidence-*`.
   - Documentar resultado somente depois de uma execucao real verde.

2. **Executar E2E multi-org switch em ambiente dedicado**
   - Configurar usuario dedicado.
   - Rodar `RUN_MULTI_ORG_SWITCH_E2E=true`.
   - Registrar evidencia depois de uma execucao real verde.

3. **Plano e PR base de `orgSlug`**
   - ADR 0007 define `/org/[orgSlug]` e compatibilidade `/protected`.
   - Proximo PR deve criar helpers centralizados de path e primeira rota dashboard.
   - Implementar sem billing.

4. **Billing design**
   - Definir plano por organization.
   - Planejar Stripe sem misturar com RLS/rotas.

5. **Owner_id retirement plan**
   - Apenas depois dos passos anteriores.

## 5. Nao fazer agora

- Nao remover `owner_id` no mesmo PR da limpeza de policies.
- Nao misturar billing com `orgSlug`.
- Nao rodar RLS Live Gate contra producao real.
- Nao criar tests data-changing sem cleanup.
- Nao tratar documentos PMBOK historicos como fonte mais atual que `README.md`, `docs/SAAS_RLS_LIVE_STATUS.md`, este roadmap e `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`.
