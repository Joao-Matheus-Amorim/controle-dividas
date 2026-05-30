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
- `docs/audits/DASHBOARD_UI_CONTRACT.md`
- `docs/audits/FINANCE_LIST_UI_CONTRACT.md`
- `docs/audits/FINANCE_FORM_UI_CONTRACT.md`
- `docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md`
- `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md`
- `docs/audits/BILLING_SETTINGS_STATUS_CONTRACT.md`
- `docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md`
- `docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md`
- `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`
- `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`
- `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`
- `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`
- `supabase/migrations/040_audit_events_schema.sql`
- `supabase/migrations/041_audit_events_write_boundary.sql`
- `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md`
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
- Rotas `orgSlug` tem contrato Playwright gated cleanup-backed em `tests/e2e/orgslug-authenticated-gated.spec.ts`.
- O dashboard possui contrato de UI nao fragil em `docs/audits/DASHBOARD_UI_CONTRACT.md` e guard dedicado para preservar textos, secoes, permissao e rotas compartilhadas.
- As listas financeiras primarias possuem contrato de UI nao fragil em `docs/audits/FINANCE_LIST_UI_CONTRACT.md` e guard dedicado para preservar estrutura, estados vazios/filtros e acoes condicionadas por permissao.
- Os formularios financeiros primarios possuem contrato de UI nao fragil em `docs/audits/FINANCE_FORM_UI_CONTRACT.md` e guard dedicado para preservar `useActionState`, feedback, pending state, `AppFormSheet` e campos essenciais.
- A estrategia de snapshot visual seletivo esta documentada em `docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md`; nenhum snapshot visual amplo foi implementado neste passo.
- A fixture deterministica do dashboard summary acima da dobra esta documentada em `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md`, versionada em `__tests__/fixtures/dashboard-summary-visual-snapshot.ts` e coberta por screenshot gated em `tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts`.
- O status de billing em Configuracoes mostra o plano atual da organizacao usando `lib/billing/plans.ts` e expõe entrada de checkout controlada por `ENABLE_STRIPE_CHECKOUT`, documentado em `docs/audits/BILLING_SETTINGS_STATUS_CONTRACT.md`.
- O contrato de fluxo de assinatura esta documentado em `docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md`, cobrindo checkout, portal, webhook idempotente, secrets e rollback antes de runtime Stripe.
- A fronteira de configuracao Stripe esta implementada em `lib/billing/stripe-config.ts` e documentada em `docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md`.
- O runbook de conta Stripe de teste esta em `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md`.
- Checkout runtime esta implementado em `lib/billing/stripe-checkout.ts` e `app/protected/configuracoes/billing-actions.ts`, sem webhook, portal ou enforcement comercial.
- Evidencia real de checkout Stripe ainda esta pendente porque nao ha conta Stripe de teste/credenciais configuradas.
- O contrato de planejamento para GAP-015 esta documentado em `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`, com schema/read-side RLS de audit events em `supabase/migrations/040_audit_events_schema.sql`, write boundary de audit events em `supabase/migrations/041_audit_events_write_boundary.sql` via `record_audit_event`, billing checkout audit runtime e billing checkout rate limit runtime em `app/protected/configuracoes/billing-actions.ts`, admin permission audit runtime e admin permission rate limit runtime em `app/protected/admin/actions.ts` para `admin.permission.update` e `admin.feature_permission.update`, admin user audit runtime e admin user rate limit runtime em `app/protected/admin/actions.ts` para `admin.user.create`, `admin.user.update`, `admin.user.auth_link.sync`, `admin.user.delete` e `admin.user.status.update`, payable bill audit runtime e payable delete rate limit runtime em `app/protected/contas-a-pagar/actions.ts` para `finance.payable.status.update` e `finance.payable.delete`, receivable income audit runtime e receivable delete rate limit runtime em `app/protected/contas-a-receber/actions.ts` para `finance.receivable.status.update` e `finance.receivable.delete`, expense audit runtime e expense delete rate limit runtime em `app/protected/gastos/actions.ts` para `finance.expense.delete`, category delete audit runtime e category delete rate limit runtime em `app/protected/configuracoes/actions.ts` para `finance.category.delete`, bank audit runtime e bank delete rate limit runtime em `app/protected/bancos/actions.ts` para `finance.bank.balance.update` e `finance.bank.delete`, plano de rate limiting em `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md` e plano de data retention em `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`; remaining broader rate limiting e data retention ainda nao tem runtime implementado.
- RLS Live Gate existe em `.github/workflows/rls-live-gate.yml` e ja gera GitHub Step Summary + artifact `rls-live-gate-evidence-*`, mas ainda precisa de vars/secrets e execucao dedicada para virar evidencia verde de CI.

## 3. Estado de fechamento e gaps reais antes de declarar 100% coerente

### FECHADO-001 - Limpeza de policies antigas versionada

O Supabase vivo validado ja teve as policies antigas owner-centric removidas manualmente:

- `*_own` das tabelas financeiras;
- `profiles_*_family`;
- `feature_permissions_*_family`.

Agora a cadeia de migrations possui a migration idempotente `039_drop_legacy_owner_family_policies.sql` para reproduzir essa limpeza em qualquer ambiente que tenha aplicado migrations antigas.

Resultado atual:

- migration `039_drop_legacy_owner_family_policies.sql` com `drop policy if exists`;
- teste/guard conferindo que o arquivo versiona a limpeza;
- Supabase vivo validado recebeu a limpeza manual e o RLS gated focado passou depois do alinhamento;
- ambientes que nao receberam a limpeza manual ainda precisam aplicar a migration `039`.

### GAP-001 - RLS Live Gate com evidencia de CI

O workflow existe e ja possui plumbing de evidencia auditavel. O estado ainda pendente e a execucao real no GitHub Actions com ambiente Supabase dedicado.

Resultado esperado:

- configurar `RLS_TEST_SUPABASE_URL` como repository variable;
- configurar `RLS_TEST_SUPABASE_ANON_KEY`, `RLS_TEST_SUPABASE_SERVICE_ROLE_KEY`, `RLS_TEST_USER_A_*`, `RLS_TEST_USER_B_*` como secrets;
- rodar `RLS Live Gate` via `workflow_dispatch`;
- confirmar o GitHub Step Summary e o artifact `rls-live-gate-evidence-*`;
- registrar evidencia no status vivo somente depois de uma execucao real verde.

### FECHADO-002 - Contrato E2E de troca de organizacao ativa

A troca de organizacao ativa existe no app e agora possui contrato E2E gated cleanup-backed versionado.

Resultado atual:

- `RUN_MULTI_ORG_SWITCH_E2E=true`;
- usuario dedicado em `E2E_MULTI_ORG_EMAIL`/`E2E_MULTI_ORG_PASSWORD`;
- criacao de duas organizations temporarias com prefixo `e2e-multi-org-switch-`;
- troca pelo selector real;
- reload para confirmar persistencia;
- cleanup por slug prefixado.

### FECHADO-003 - Rotas por `orgSlug`

As rotas organization-aware foram implementadas no App Router sem remover a compatibilidade `/protected`.

O contrato de roteamento foi definido no ADR 0007:

```txt
/org/[orgSlug]
```

`/protected` permanece como compatibilidade transicional ate a migracao ser concluida.

Resultado atual:

- helpers centralizados de path para `/org/[orgSlug]`;
- wrappers `app/org/[orgSlug]` e `/protected` para dashboard e modulos protegidos;
- implementacoes compartilhadas em `features/protected-pages`;
- validacao server-side de acesso ao slug recebido na URL;
- links internos preservam o slug quando a navegacao esta em `/org/[orgSlug]`;
- `revalidateOrganizationPaths` revalida `/protected` e o caminho equivalente `/org/[orgSlug]`;
- E2E gated `RUN_ORGSLUG_E2E=true` cobre slug permitido, slug sem membership e compatibilidade `/protected`;
- `/protected` segue compativel para auth, onboarding e bookmarks legados.

### GAP-003 - Billing

`organizations` possui campos como `plan` e `stripe_customer_id`. Checkout runtime esta implementado; evidencia real com Stripe de teste, subscription sync, portal, webhook e enforcement comercial ainda nao.

Contrato local de planos:

- `lib/billing/plans.ts`;
- ADR 0008;
- alinhado com a constraint de `organizations.plan` da migration `006`.
- status e entrada de checkout em Configuracoes documentados em `docs/audits/BILLING_SETTINGS_STATUS_CONTRACT.md`.
- contrato de fluxo de assinatura documentado em `docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md`.
- fronteira de configuracao Stripe documentada em `docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md` e implementada em `lib/billing/stripe-config.ts`.
- runbook de conta Stripe de teste documentado em `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md`.

Resultado esperado:

- registrar evidencia externa pendente ou decidir deferimento explicito;
- criar/configurar conta Stripe de teste e credenciais;
- validar checkout runtime com ambiente Stripe de teste antes de qualquer webhook/portal;
- implementar webhook, portal e assinatura em PRs separados.

### GAP-011 - Contratos de UI financeira

O primeiro contrato de UI critica foi registrado para o dashboard.

Resultado atual:

- `docs/audits/DASHBOARD_UI_CONTRACT.md`;
- `docs/audits/FINANCE_LIST_UI_CONTRACT.md`;
- `docs/audits/FINANCE_FORM_UI_CONTRACT.md`;
- `docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md`;
- `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md`;
- guard dedicado para `features/protected-pages/dashboard-page.tsx`;
- guard dedicado para `components/dashboard/**`;
- guard dedicado para listas primarias em `components/expenses`, `components/payables`, `components/receivables`, `components/banks` e `components/people`;
- guard dedicado para formularios primarios em `components/finance`;
- preservacao explicita do heading `Visão do mês`;
- garantia documental de que nao ha snapshot amplo nem redesign nestes passos;
- estrategia definida para escolher apenas uma superficie deterministica no primeiro snapshot visual.
- fixture deterministica definida para `dashboard summary acima da dobra`;
- viewport inicial unico `390x844`;
- regra de atualizacao e rollback registrada;
- screenshot gated definido por `RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true`.

Resultado esperado:

- validar o primeiro screenshot gated usando a fixture deterministica do dashboard summary acima da dobra.

### GAP-015 - Controles de operacoes sensiveis

O contrato de planejamento esta registrado em `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.

Resultado atual:

- escopo documentado para rate limiting, sensitive-action audit logging e data retention policy;
- plano de schema/redaction para audit events documentado em `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`;
- schema/read-side RLS de audit events versionado em `supabase/migrations/040_audit_events_schema.sql`;
- write boundary de audit events versionado em `supabase/migrations/041_audit_events_write_boundary.sql` via `record_audit_event`;
- billing checkout audit runtime versionado em `app/protected/configuracoes/billing-actions.ts`, sem webhook, portal ou retention;
- billing checkout rate limit runtime versionado em `app/protected/configuracoes/billing-actions.ts` para `billing.checkout.start` via `lib/security/sensitive-rate-limit.ts`, com storage em memoria de processo, limpeza de buckets expirados e rollback por `DISABLE_SENSITIVE_RATE_LIMITS=true`;
- admin permission audit runtime e admin permission rate limit runtime versionados em `app/protected/admin/actions.ts` para `admin.permission.update` e `admin.feature_permission.update` via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- admin user audit runtime e admin user rate limit runtime versionados em `app/protected/admin/actions.ts` para create, update, auth link sync, activate/deactivate e delete via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- payable bill audit runtime e payable delete rate limit runtime versionados em `app/protected/contas-a-pagar/actions.ts` para `finance.payable.status.update` e `finance.payable.delete` via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- receivable income audit runtime e receivable delete rate limit runtime versionados em `app/protected/contas-a-receber/actions.ts` para `finance.receivable.status.update` e `finance.receivable.delete` via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- expense audit runtime e expense delete rate limit runtime versionados em `app/protected/gastos/actions.ts` para `finance.expense.delete` via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- category delete audit runtime e category delete rate limit runtime versionados em `app/protected/configuracoes/actions.ts` para `finance.category.delete` via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- bank audit runtime e bank delete rate limit runtime versionados em `app/protected/bancos/actions.ts` para `finance.bank.balance.update` e `finance.bank.delete` via `record_audit_event` e `lib/security/sensitive-rate-limit.ts`;
- plano de rate limiting documentado em `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`;
- plano de data retention documentado em `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`;
- inventario inicial de operacoes sensiveis documentado;
- limites explicitos: sem remaining broader rate limit runtime, data retention runtime, UI, billing ou E2E neste passo;
- sequenciamento definido para issues/PRs dedicados antes de qualquer implementacao.

Resultado esperado:

- criar issues separadas para rate limits, audit events e retention policy;
- implementar runtime logging de audit events por uma familia de operacoes por vez, mantendo billing checkout, admin permission e admin user como as primeiras familias cobertas;
- transformar o plano de rate limiting em runtime server-side por uma fronteira por vez;
- implementar audit logging restante por uma familia de operacoes sensiveis por vez;
- transformar o plano de data retention em politica por data class antes de qualquer automacao destrutiva.

### GAP-005 - Remocao futura de `owner_id`

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

2. **Confirmar E2E multi-org switch em ambiente dedicado quando necessario**
   - Configurar usuario dedicado.
   - Rodar `RUN_MULTI_ORG_SWITCH_E2E=true`.
   - Registrar evidencia depois de uma execucao real verde.

3. **Confirmar E2E dedicado de `orgSlug` em ambiente dedicado quando necessario**
   - Configurar usuario dedicado em `E2E_ORGSLUG_EMAIL`/`E2E_ORGSLUG_PASSWORD`.
   - Rodar `RUN_ORGSLUG_E2E=true`.
   - Registrar evidencia depois de uma execucao real verde.

4. **Billing design**
   - Usar `docs/audits/BILLING_SETTINGS_STATUS_CONTRACT.md`.
   - Usar `docs/audits/BILLING_SUBSCRIPTION_FLOW_CONTRACT.md`.
   - Usar `docs/audits/BILLING_STRIPE_CONFIGURATION_BOUNDARY.md`.
   - Usar `docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md`.
   - Criar/configurar conta Stripe de teste e credenciais.
   - Validar checkout runtime com Stripe de teste.
   - Implementar webhook e portal em PRs proprios.
   - Planejar Stripe sem misturar com RLS/rotas.

5. **Primeiro snapshot visual seletivo**
   - Usar `docs/audits/DASHBOARD_SUMMARY_VISUAL_FIXTURE.md`.
   - Usar `__tests__/fixtures/dashboard-summary-visual-snapshot.ts`.
   - Rodar `tests/e2e/dashboard-summary-visual-snapshot-gated.spec.ts` com `RUN_DASHBOARD_SUMMARY_VISUAL_SNAPSHOT=true`.
   - Evitar snapshot amplo sem contrato visual claro.

6. **Sensitive operation controls**
   - Usar `docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md`.
   - Usar `docs/audits/SENSITIVE_ACTION_AUDIT_EVENT_SCHEMA_PLAN.md`.
   - Usar `docs/audits/SENSITIVE_OPERATION_RATE_LIMIT_PLAN.md`.
   - Usar `docs/audits/SENSITIVE_DATA_RETENTION_PLAN.md`.
   - Criar issues separadas para rate limiting, sensitive-action audit logging e data retention.
   - Nao implementar runtime, schema, RLS, billing ou UI sem PR dedicado, validacao e rollback.

7. **Owner_id retirement plan**
   - Apenas depois dos passos anteriores.

## 5. Nao fazer agora

- Nao remover `owner_id` no mesmo PR da limpeza de policies.
- Nao misturar billing com `orgSlug`.
- Nao rodar RLS Live Gate contra producao real.
- Nao criar tests data-changing sem cleanup.
- Nao declarar GAP-015 como implementado apenas por contrato documental.
- Nao tratar documentos PMBOK historicos como fonte mais atual que `README.md`, `docs/SAAS_RLS_LIVE_STATUS.md`, este roadmap e `docs/audits/CURRENT_RLS_POLICIES_INVENTORY.md`.
