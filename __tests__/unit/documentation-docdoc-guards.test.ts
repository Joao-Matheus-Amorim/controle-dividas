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
});
