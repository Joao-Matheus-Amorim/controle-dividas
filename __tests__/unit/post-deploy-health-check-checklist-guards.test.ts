import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function section(source: string, heading: string, nextHeading: string) {
  const start = source.indexOf(heading);
  const end = source.indexOf(nextHeading, start + heading.length);

  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);

  return source.slice(start, end);
}

describe("post-deploy health check checklist guards", () => {
  const checklist = read("docs/audits/CODEBASE_SCAN_GAP_CHECKLIST_2026-06-01.md");
  const workflow = read(".github/workflows/post-deploy-smoke.yml");
  const spec = read("tests/e2e/post-deploy-protected-smoke-gated.spec.ts");
  const playwrightConfig = read("playwright.config.ts");
  const validation = read("docs/VALIDACAO_TECNICA.md");
  const e2eReadme = read("docs/e2e/README.md");
  const e2eRoadmap = read("docs/e2e/PLAYWRIGHT_COVERAGE_ROADMAP.md");
  const healthCheck = section(
    checklist,
    "### p1.1 - health check pos-deploy",
    "### p1.2 - rls live gate com evidencia real",
  );

  it("keeps P1.1 status tied to protected-route smoke evidence", () => {
    expect(healthCheck).toContain("status: gate manual criado; evidencia de execucao pos-deploy pendente");
    expect(healthCheck).toContain("deploy verde hoje prova build/migration/deploy");
    expect(healthCheck).toContain(".github/workflows/post-deploy-smoke.yml");
    expect(healthCheck).toContain("tests/e2e/post-deploy-protected-smoke-gated.spec.ts");
    expect(healthCheck).toContain("existe evidencia de smoke pos-deploy para o deploy atual");
  });

  it("does not inherit admin invitation pre-runtime status", () => {
    expect(healthCheck).not.toContain("contrato pre-runtime criado");
    expect(healthCheck).not.toContain("admin_invitation_bootstrap_contract.md");
    expect(healthCheck).not.toContain("admin_email");
    expect(healthCheck).not.toContain("convite/admin");
  });

  it("defines a manual workflow for real deployed URLs", () => {
    expect(workflow).toContain("name: post-deploy smoke");
    expect(workflow).toContain("workflow_dispatch");
    expect(workflow).toContain("deployment_url");
    expect(workflow).toContain("playwright_base_url");
    expect(workflow).toContain("playwright_skip_web_server");
    expect(workflow).toContain("run_post_deploy_smoke_e2e");
    expect(workflow).toContain("e2e_post_deploy_email");
    expect(workflow).toContain("e2e_post_deploy_password");
    expect(workflow).toContain("post-deploy-smoke-playwright-report");
  });

  it("keeps the Playwright smoke focused on critical protected routes", () => {
    expect(playwrightConfig).toContain("playwright_skip_web_server");
    expect(playwrightConfig).toContain("webserver: skipwebserver");
    expect(spec).toContain("post-deploy protected-route smoke e2e contract");
    expect(spec).toContain("/protected/gastos");
    expect(spec).toContain("/protected/contas-a-pagar");
    expect(spec).toContain("/protected/contas-a-receber");
    expect(spec).toContain("/protected/bancos");
    expect(spec).toContain("/protected/configuracoes");
    expect(spec).toContain("familyfinance");
    expect(spec).toContain("erro ao carregar");
    expect(spec).not.toContain("heading:");
  });

  it("documents the gate without claiming execution evidence", () => {
    expect(validation).toContain(".github/workflows/post-deploy-smoke.yml");
    expect(validation).toContain("e2e_post_deploy_email");
    expect(validation).toContain("playwright_skip_web_server=true");
    expect(validation).toContain("evidencia so existe apos execucao manual verde");
    expect(e2eReadme).toContain("post-deploy protected-route smoke");
    expect(e2eRoadmap).toContain("manual gate exists; evidence pending");
  });
});
