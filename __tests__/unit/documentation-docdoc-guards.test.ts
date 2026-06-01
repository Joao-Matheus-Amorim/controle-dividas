import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8").toLowerCase();
}

describe("Operacao DocDoc documentation guards", () => {
  const docsReadme = read("docs/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const skill = read(".agents/skills/operacao-docdoc/SKILL.md");
  const validation = read("docs/VALIDACAO_TECNICA.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const implementationStatus = read("docs/SAAS_IMPLEMENTATION_STATUS.md");
  const mobileStrategy = read("docs/MOBILE_STRATEGY.md");
  const mobileUx = read("docs/MOBILE_FIRST_UX.md");
  const accessChannels = read("docs/ACCESS_CHANNELS.md");
  const authFlowAudit = read("docs/AUTH_FLOW_AUDIT.md");
  const financialRlsPlan = read("docs/FINANCIAL_RLS_MULTI_TENANT_PLAN.md");
  const initialOrganizationBackfillPlan = read("docs/INITIAL_ORGANIZATION_BACKFILL_PLAN.md");
  const liveMvpAudit = read("docs/LIVE_MVP_AUDIT.md");
  const saasDatabaseMigrationPlan = read("docs/SAAS_DATABASE_MIGRATION_PLAN.md");
  const saasMultiTenantStrategy = read("docs/SAAS_MULTI_TENANT_STRATEGY.md");
  const saasRlsLiveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");
  const testingStrategy = read("docs/TESTING_STRATEGY.md");
  const auditsReadme = read("docs/audits/README.md");
  const sensitiveControls = read("docs/audits/SENSITIVE_OPERATION_CONTROLS_CONTRACT.md");
  const billingWebhook = read("docs/audits/BILLING_WEBHOOK_RUNTIME_CONTRACT.md");
  const dashboardUiContract = read("docs/audits/DASHBOARD_UI_CONTRACT.md");
  const organizationScopeHardening = read("docs/audits/ORGANIZATION_SCOPE_HARDENING_PLAN.md");
  const fallbackRemovalReadiness = read("docs/audits/LEGACY_ORGANIZATION_FALLBACK_REMOVAL_READINESS.md");
  const runbooksReadme = read("docs/runbooks/README.md");
  const stripeRunbook = read("docs/runbooks/BILLING_STRIPE_TEST_ACCOUNT_RUNBOOK.md");
  const legacyBackfillRunbook = read("docs/runbooks/LEGACY_ORGANIZATION_BACKFILL_RUNBOOK.md");
  const runbookFiles = readdirSync(join(process.cwd(), "docs/runbooks"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const pmReadme = read("docs/pm/README.md");
  const pmFiles = readdirSync(join(process.cwd(), "docs/pm"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const e2eReadme = read("docs/e2e/README.md");
  const e2eFiles = readdirSync(join(process.cwd(), "docs/e2e"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const rlsReadme = read("docs/rls/README.md");
  const rlsLiveGate = read("docs/rls/RLS_LIVE_GATE.md");
  const rlsFiles = readdirSync(join(process.cwd(), "docs/rls"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const roadmapsReadme = read("docs/roadmaps/README.md");
  const onboardingRoadmap = read("docs/roadmaps/INITIAL_ORGANIZATION_ONBOARDING_FLOW.md");
  const roadmapFiles = readdirSync(join(process.cwd(), "docs/roadmaps"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const designReadme = read("docs/design/README.md");
  const redesignSpec = read("docs/design/redesign-2026-ink-copper-ivory.md");
  const visualTokensBaseline = read("docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md");
  const designFiles = readdirSync(join(process.cwd(), "docs/design"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const sqlReadme = read("docs/sql/README.md");
  const sqlFiles = readdirSync(join(process.cwd(), "docs/sql"))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const adrReadme = read("docs/adr/README.md");
  const adrDocdocStatus = read("docs/adr/DOCDOC_STATUS.md");
  const mobileChannelAdr = read("docs/adr/0009-mobile-channel-boundary.md");
  const adrFiles = readdirSync(join(process.cwd(), "docs/adr"))
    .filter((file) => file.endsWith(".md"))
    .sort();
  const rootDocFiles = readdirSync(join(process.cwd(), "docs"))
    .filter((file) => file.endsWith(".md"))
    .sort();

  it("keeps a documentation entrypoint and status map", () => {
    expect(docsReadme).toContain("status docdoc: atual");
    expect(docsReadme).toContain("docs/validacao_tecnica.md");
    expect(docsReadme).toContain("docs/documentation_status.md");
    expect(docsReadme).toContain("documentos antigos nao devem ser apagados");

    expect(statusMap).toContain("operacao docdoc");
    expect(statusMap).toContain("hierarquia de verdade");
    expect(statusMap).toContain("docs/validacao_tecnica.md");
    expect(statusMap).toContain("docs/saas_gap_register.md");
    expect(statusMap).toContain("docs/audits/codebase_scan_gap_checklist_2026-06-01.md");
  });

  it("keeps every root markdown doc listed in the DocDoc status map", () => {
    expect(rootDocFiles.length).toBeGreaterThan(30);
    expect(statusMap).toContain("root docs docdoc");

    for (const file of rootDocFiles) {
      expect(statusMap).toContain(`docs/${file}`.toLowerCase());
    }
  });

  it("stores Operacao DocDoc as a reusable project skill", () => {
    expect(skill).toContain("name: operacao-docdoc");
    expect(skill).toContain("reconcile familyfinance project documentation after merges");
    expect(skill).toContain("prefer status labels over deletion");
    expect(skill).toContain("no migrations or rls changes");
    expect(skill).toContain("run only focused validation");
  });

  it("marks the central documentation sources with DocDoc status", () => {
    expect(validation).toContain("status docdoc: atual");
    expect(gapRegister).toContain("status docdoc: atual");
    expect(roadmap).toContain("status docdoc: parcialmente superado");
    expect(implementationStatus).toContain("status docdoc: parcialmente superado");
  });

  it("keeps mobile docs as strategy and UX direction, not implementation evidence", () => {
    expect(mobileStrategy).toContain("status docdoc: atual como estrategia de canal");
    expect(mobileStrategy).toContain("nao e evidencia de que o app nativo android/ios ja exista");
    expect(mobileUx).toContain("status docdoc: atual como diretriz ux");
    expect(mobileUx).toContain("nao substitui os contratos de design system");
    expect(mobileChannelAdr).toContain("a web next.js atual permanece como canal operacional");
    expect(mobileChannelAdr).toContain("app nativo android/ios e um canal futuro");
    expect(mobileChannelAdr).toContain("nao e evidencia de implementacao atual");
  });

  it("marks high-risk root docs before they are reused as current truth", () => {
    expect(accessChannels).toContain("status docdoc: parcialmente superado/estrategia");
    expect(accessChannels).toContain("0009-mobile-channel-boundary.md");
    expect(accessChannels).toContain("nao usar como evidencia de");

    expect(authFlowAudit).toContain("status docdoc: parcialmente superado/historico");
    expect(authFlowAudit).toContain("estado vivo isolado");

    expect(financialRlsPlan).toContain("status docdoc: parcialmente superado/historico");
    expect(financialRlsPlan).toContain("migrations `030` a `043`");
    expect(financialRlsPlan).toContain("nao usar como ordem operacional atual");

    expect(initialOrganizationBackfillPlan).toContain("status docdoc: parcialmente superado/historico");
    expect(initialOrganizationBackfillPlan).toContain("nao executar como plano operacional");

    expect(liveMvpAudit).toContain("status docdoc: parcialmente superado/historico");
    expect(liveMvpAudit).toContain("nao usar como contrato atual");

    expect(saasDatabaseMigrationPlan).toContain("status docdoc: historico");
    expect(saasDatabaseMigrationPlan).toContain("migrations `001` a `043`");
    expect(saasDatabaseMigrationPlan).toContain("nao usar para escolher novo numero de migration");

    expect(saasMultiTenantStrategy).toContain("status docdoc: historico/estrategia");
    expect(saasMultiTenantStrategy).toContain("nao usar como evidencia de implementacao");

    expect(saasRlsLiveStatus).toContain("status docdoc: parcialmente superado");
    expect(saasRlsLiveStatus).toContain("nao usar isoladamente para afirmar estado");

    expect(testingStrategy).toContain("status docdoc: parcialmente superado/estrategia");
    expect(testingStrategy).toContain("nao usar como lista atual completa");
  });

  it("keeps an audits documentation entrypoint and status map", () => {
    expect(auditsReadme).toContain("status docdoc: atual");
    expect(auditsReadme).toContain("contratos atuais");
    expect(auditsReadme).toContain("readiness parcialmente superados");
    expect(auditsReadme).toContain("sensitive_operation_controls_contract.md");
    expect(auditsReadme).toContain("billing_webhook_runtime_contract.md");

    expect(statusMap).toContain("docs/audits/readme.md");
    expect(statusMap).toContain("docs/audits/sensitive_operation_controls_contract.md");
    expect(statusMap).toContain("docs/audits/billing_webhook_runtime_contract.md");
    expect(statusMap).toContain("docs/audits/organization_scope_hardening_plan.md");
  });

  it("marks high-risk audit docs with DocDoc status before reuse", () => {
    expect(sensitiveControls).toContain("status docdoc: atual");
    expect(sensitiveControls).toContain("contrato vigente para gap-015");
    expect(billingWebhook).toContain("status docdoc: atual como contrato pre-runtime");
    expect(billingWebhook).toContain("nao e evidencia de webhook implementado");
    expect(dashboardUiContract).toContain("status docdoc: atual");
    expect(organizationScopeHardening).toContain("status docdoc: parcialmente superado");
    expect(fallbackRemovalReadiness).toContain("status docdoc: parcialmente superado");
  });

  it("keeps a runbooks documentation entrypoint and execution warning", () => {
    expect(runbooksReadme).toContain("status docdoc: atual");
    expect(runbooksReadme).toContain("runbook operacional atual");
    expect(runbooksReadme).toContain("runbooks parcialmente superados");
    expect(runbooksReadme).toContain("nao e autorizacao automatica para aplicar sql");

    expect(statusMap).toContain("docs/runbooks/readme.md");
    expect(statusMap).toContain("docs/runbooks/billing_stripe_test_account_runbook.md");
    expect(statusMap).toContain("docs/runbooks/legacy_organization_backfill_runbook.md");
  });

  it("marks high-risk runbooks with DocDoc status before operation", () => {
    expect(stripeRunbook).toContain("status docdoc: atual");
    expect(stripeRunbook).toContain("capturar evidencia real de checkout e portal");
    expect(legacyBackfillRunbook).toContain("status docdoc: parcialmente superado");
    expect(legacyBackfillRunbook).toContain("nao usar a secao \"current phase\" como estado atual");
  });

  it("marks every runbook with explicit DocDoc status", () => {
    expect(runbookFiles.length).toBeGreaterThan(10);

    for (const file of runbookFiles) {
      const source = read(`docs/runbooks/${file}`);
      expect(source).toContain("status docdoc:");

      if (file.includes("_ORG_SCOPE_HARDENING") || file.includes("_RLS_FALLBACK_REMOVAL")) {
        expect(source).toContain("parcialmente superado/historico");
      }
    }

    expect(runbooksReadme).toContain("todos os runbooks neste diretorio possuem nota");
    expect(statusMap).toContain("marcar todos os runbooks com nota `status docdoc`");
  });

  it("keeps PM documentation historical instead of technical-current", () => {
    expect(pmReadme).toContain("status docdoc: atual");
    expect(pmReadme).toContain("nao substituem");
    expect(pmReadme).toContain("documentos pm podem orientar produto");

    expect(statusMap).toContain("docs/pm/readme.md");
    expect(statusMap).toContain("docs/pm/08_relatorio_progresso_saas_multi_tenant.md");
    expect(statusMap).toContain("revisar `docs/pm/*` como historico de gestao");
  });

  it("marks every PM document with explicit DocDoc status", () => {
    expect(pmFiles.length).toBeGreaterThan(5);

    for (const file of pmFiles) {
      const source = read(`docs/pm/${file}`);
      expect(source).toContain("status docdoc:");

      if (file !== "README.md") {
        expect(source).toMatch(/historico\/pm|parcialmente superado/);
      }
    }
  });

  it("keeps E2E docs as gated contracts instead of execution evidence", () => {
    expect(e2eReadme).toContain("status docdoc: atual");
    expect(e2eReadme).toContain("nao substituem");
    expect(e2eReadme).toContain("resultados de ci ou execucoes gated");
    expect(e2eReadme).toContain("teste data-changing sem cleanup e flag explicita");

    expect(statusMap).toContain("docs/e2e/readme.md");
    expect(statusMap).toContain("docs/e2e/playwright_coverage_roadmap.md");
    expect(statusMap).toContain("docs/e2e/data_changing_cleanup_strategy.md");
  });

  it("marks every E2E document with explicit DocDoc status", () => {
    expect(e2eFiles.length).toBeGreaterThan(3);

    for (const file of e2eFiles) {
      const source = read(`docs/e2e/${file}`);
      expect(source).toContain("status docdoc:");
    }
  });

  it("keeps RLS docs separated from live evidence", () => {
    expect(rlsReadme).toContain("status docdoc: atual");
    expect(rlsReadme).toContain("nao use documentos rls para afirmar que isolamento esta provado");
    expect(rlsReadme).toContain("rls live gate");
    expect(rlsLiveGate).toContain("status docdoc: atual como runbook/gate operacional");
    expect(rlsLiveGate).toContain("registrar evidencia apenas apos run");

    expect(statusMap).toContain("docs/rls/readme.md");
    expect(statusMap).toContain("docs/rls/rls_live_gate.md");
    expect(statusMap).toContain("docs/rls/legacy_organization_id_handling.md");
  });

  it("marks every RLS document with explicit DocDoc status", () => {
    expect(rlsFiles.length).toBeGreaterThan(5);

    for (const file of rlsFiles) {
      const source = read(`docs/rls/${file}`);
      expect(source).toContain("status docdoc:");

      if (
        file === "LEGACY_ORGANIZATION_ID_HANDLING.md" ||
        file === "RLS_FINANCE_TEST_PLAN.md" ||
        file === "RLS_ROLLOUT_AND_ROLLBACK.md" ||
        file === "RLS_TEST_HARNESS.md"
      ) {
        expect(source).toContain("parcialmente superado");
      }
    }
  });

  it("keeps roadmap docs as sequencing context instead of implementation evidence", () => {
    expect(roadmapsReadme).toContain("status docdoc: atual");
    expect(roadmapsReadme).toContain("roadmaps orientam sequenciamento");
    expect(roadmapsReadme).toContain("nao sao evidencia de implementacao");

    expect(statusMap).toContain("docs/roadmaps/readme.md");
    expect(statusMap).toContain("docs/roadmaps/initial_organization_onboarding_flow.md");
    expect(statusMap).toContain("docs/roadmaps/legacy_finance_helper_retirement.md");
    expect(onboardingRoadmap).toContain("status docdoc: parcialmente superado/historico");
    expect(onboardingRoadmap).toContain("029_drop_one_active_membership_per_user_limit.sql");
    expect(onboardingRoadmap).toContain("components/app/active-organization-indicator.tsx");
    expect(onboardingRoadmap).toContain("nao usar este roadmap como contrato atual");
  });

  it("marks every roadmap document with explicit DocDoc status", () => {
    expect(roadmapFiles.length).toBeGreaterThan(2);

    for (const file of roadmapFiles) {
      const source = read(`docs/roadmaps/${file}`);
      expect(source).toContain("status docdoc:");
    }
  });

  it("keeps design docs as visual direction instead of implementation evidence", () => {
    expect(designReadme).toContain("status docdoc: atual");
    expect(designReadme).toContain("nao sao evidencia de implementacao");
    expect(designReadme).toContain("nao remigrar um");
    expect(designReadme).toContain("componente ja convertido");

    expect(statusMap).toContain("docs/design/readme.md");
    expect(statusMap).toContain("docs/design/redesign-2026-ink-copper-ivory.md");
    expect(statusMap).toContain("docs/design/visual_tokens_and_component_conventions.md");
  });

  it("separates current design direction from stale visual baselines", () => {
    expect(redesignSpec).toContain("status docdoc: atual como direcao visual em andamento");
    expect(redesignSpec).toContain("nao e evidencia de implementacao");
    expect(redesignSpec).toContain("nao remigrar o dashboard hero");
    expect(redesignSpec).toContain("components/dashboard/dashboard-hero-summary.tsx");

    expect(visualTokensBaseline).toContain("status docdoc: parcialmente superado/historico");
    expect(visualTokensBaseline).toContain("nao usar este documento como fonte atual de cores");
    expect(visualTokensBaseline).toContain("app/globals.css");
  });

  it("marks every design document with explicit DocDoc status", () => {
    expect(designFiles.length).toBeGreaterThan(2);

    for (const file of designFiles) {
      const source = read(`docs/design/${file}`);
      expect(source).toContain("status docdoc:");
    }
  });

  it("keeps SQL docs as operational tools instead of execution approval", () => {
    expect(sqlReadme).toContain("status docdoc: atual");
    expect(sqlReadme).toContain("nao e autorizacao para executar sql");
    expect(sqlReadme).toContain("confirme o ambiente alvo");
    expect(sqlReadme).toContain("supabase/migrations");

    expect(statusMap).toContain("docs/sql/readme.md");
    expect(statusMap).toContain("docs/sql/*-null-preflight.sql");
    expect(statusMap).toContain("docs/sql/*-dry-run.sql");
    expect(statusMap).toContain("docs/sql/finance-relationships-orphan-preflight.sql");
  });

  it("keeps every docs/sql file listed in the SQL DocDoc index", () => {
    expect(sqlFiles.length).toBeGreaterThan(10);

    for (const file of sqlFiles) {
      expect(sqlReadme).toContain(file.toLowerCase());
    }
  });

  it("keeps ADR docs as historical decisions instead of rewritten current truth", () => {
    expect(adrReadme).toContain("status docdoc: atual");
    expect(adrReadme).toContain("docs/adr/docdoc_status.md");
    expect(adrReadme).toContain("0009-mobile-channel-boundary.md");
    expect(adrDocdocStatus).toContain("adrs aceitos registram decisoes no tempo");
    expect(adrDocdocStatus).toContain("proximos adrs devem usar");
    expect(adrDocdocStatus).toContain("0010");
    expect(adrDocdocStatus).toContain("0009-mobile-channel-boundary.md");

    expect(statusMap).toContain("docs/adr/readme.md");
    expect(statusMap).toContain("docs/adr/docdoc_status.md");
    expect(statusMap).toContain("docs/adr/0009-mobile-channel-boundary.md");
    expect(statusMap).toContain("historico decisorio com indice atual");
    expect(statusMap).toContain("nao reescrever decisao aceita");
  });

  it("keeps every ADR markdown file listed in the ADR DocDoc index", () => {
    expect(adrFiles.length).toBeGreaterThan(9);

    for (const file of adrFiles) {
      expect(adrDocdocStatus).toContain(file.toLowerCase());
    }
  });
});
