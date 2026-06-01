import { readFileSync } from "node:fs";
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
});
