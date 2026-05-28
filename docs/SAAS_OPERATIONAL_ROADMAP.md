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

### Runtime

- As superficies principais de runtime usam organizacao ativa.
- Os guards atuais bloqueiam retorno para `organizationOrLegacyFilter` e `organization_id.is.null` nas queries/actions principais.
- `owner_id` ainda existe e ainda participa de write ownership.

### E2E e gates

- Playwright tem smoke publico/auth.
- Onboarding autenticado gated cria organizacao inicial e entra no app protegido.
- Rotas protegidas autenticadas principais existem como contratos gated.
- Data-changing E2E existe como gated skipped-by-default.
- RLS Live Gate existe em `.github/workflows/rls-live-gate.yml`, mas precisa de vars/secrets e execucao dedicada para virar evidencia de CI.

## 3. Gap real antes de declarar 100% coerente

### GAP-001 - Versionar limpeza de policies antigas

O Supabase vivo validado ja teve as policies antigas owner-centric removidas manualmente:

- `*_own` das tabelas financeiras;
- `profiles_*_family`;
- `feature_permissions_*_family`.

Mas a cadeia de migrations ainda precisa de uma migration idempotente propria para reproduzir essa limpeza em qualquer ambiente que tenha aplicado migrations antigas.

Resultado esperado:

- migration `039_*` com `drop policy if exists`;
- teste/guard conferindo que o arquivo versiona a limpeza;
- RLS gated focado passando depois da migration aplicada no ambiente alvo.

### GAP-002 - RLS Live Gate com evidencia de CI

O workflow existe, mas o estado atual confirmado e local/manual.

Resultado esperado:

- configurar `RLS_TEST_SUPABASE_URL` como repository variable;
- configurar `RLS_TEST_SUPABASE_ANON_KEY`, `RLS_TEST_SUPABASE_SERVICE_ROLE_KEY`, `RLS_TEST_USER_A_*`, `RLS_TEST_USER_B_*` como secrets;
- rodar `RLS Live Gate` via `workflow_dispatch`;
- registrar evidencia no status vivo.

### GAP-003 - Contrato E2E de troca de organizacao ativa

A troca de organizacao ativa existe no app, mas ainda precisa de prova E2E dedicada com usuario multi-org real/dedicado.

Resultado esperado:

- fixture de usuario com duas organizations ativas;
- teste gated que alterna organizacao e confirma dados/contexto da tela protegida;
- cleanup documentado se o teste criar dados.

### GAP-004 - Rotas por `orgSlug`

As rotas atuais ainda usam `/protected`. Helpers ja aceitam `orgSlug` opcional, mas nao ha estrutura de rota `[orgSlug]` no App Router.

Resultado esperado:

- ADR ou plano de roteamento;
- redirect/fallback definidos;
- validacao server-side de acesso ao slug;
- cobertura E2E de slug valido, slug sem acesso e troca de contexto.

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

1. **Migration 039 - cleanup de policies antigas**
   - Versionar `drop policy if exists` para `*_own`, `profiles_*_family` e `feature_permissions_*_family`.
   - Validar com RLS gated focado.

2. **RLS Live Gate evidence**
   - Configurar ambiente GitHub dedicado.
   - Rodar workflow manual.
   - Documentar resultado.

3. **E2E multi-org switch**
   - Criar usuario/fixture dedicada.
   - Testar troca de organizacao ativa.

4. **Plano e PR base de `orgSlug`**
   - Planejar rota, autorizacao, redirects e compatibilidade.
   - Implementar sem billing.

5. **Billing design**
   - Definir plano por organization.
   - Planejar Stripe sem misturar com RLS/rotas.

6. **Owner_id retirement plan**
   - Apenas depois dos passos anteriores.

## 5. Nao fazer agora

- Nao remover `owner_id` no mesmo PR da limpeza de policies.
- Nao misturar billing com `orgSlug`.
- Nao rodar RLS Live Gate contra producao real.
- Nao criar tests data-changing sem cleanup.
- Nao tratar documentos PMBOK historicos como fonte mais atual que `README.md`, `docs/SAAS_RLS_LIVE_STATUS.md`, este roadmap e `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`.
