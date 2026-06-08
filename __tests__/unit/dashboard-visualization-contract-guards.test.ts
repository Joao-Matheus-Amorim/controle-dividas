import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("dashboard visualization contract guards", () => {
  const contract = read("docs/audits/DASHBOARD_VISUALIZATION_CONTRACT.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const auditsReadme = read("docs/audits/README.md");
  const docStatus = read("docs/DOCUMENTATION_STATUS.md");
  const packageJson = read("package.json");

  it("defines GAP-018 without implementing chart runtime", () => {
    expect(contract).toContain("gap-018");
    expect(contract).toContain("sem implementar runtime novo");
    expect(contract).toContain("nao adiciona dependencia");
    expect(contract).toContain("nao altera ui");
    expect(contract).toContain("nao cria graficos");
    expect(contract).toContain("nao declara gap-018 runtime como implementado");
  });

  it("defines the first dashboard insight surfaces and data rules", () => {
    expect(contract).toContain("tendencia mensal de gastos");
    expect(contract).toContain("composicao de dividas abertas");
    expect(contract).toContain("fluxo previsto do mes");
    expect(contract).toContain("uso de limite por categoria");
    expect(contract).toContain("fonte de dados server-side");
    expect(contract).toContain("regra de permissao");
    expect(contract).toContain("fallback textual");
    expect(contract).toContain("mobile-first");
  });

  it("blocks charting libraries until product and technical acceptance exists", () => {
    expect(contract).toContain("nao adicionar biblioteca de charting");
    expect(contract).toContain("impacto de bundle");
    expect(contract).toContain("rollback sem perda de dados");
    expect(packageJson).not.toContain("recharts");
    expect(packageJson).not.toContain("chart.js");
    expect(packageJson).not.toContain("d3");
    expect(packageJson).not.toContain("victory");
  });

  it("keeps planning and DocDoc indexes aligned", () => {
    for (const source of [gapRegister, roadmap, auditsReadme, docStatus]) {
      expect(source).toContain("dashboard_visualization_contract.md");
      expect(source).toContain("gap-018");
    }

    expect(gapRegister).toContain("dashboard visualization contract exists");
    expect(gapRegister).toContain("no chart runtime, ui change, schema, rls, billing, or dependency change is implemented");
    expect(roadmap).toContain("dashboard visualization adoption");
    expect(auditsReadme).toContain("contrato vigente do gap-018");
    expect(docStatus).toContain("nao implementa runtime nem adiciona dependencia");
  });
});
