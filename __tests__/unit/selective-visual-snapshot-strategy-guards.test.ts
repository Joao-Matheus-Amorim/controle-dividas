import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("selective visual snapshot strategy", () => {
  const strategy = read("docs/audits/SELECTIVE_VISUAL_SNAPSHOT_STRATEGY.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const visualTokens = read("docs/design/VISUAL_TOKENS_AND_COMPONENT_CONVENTIONS.md");

  it("defines selective snapshots without allowing broad visual snapshots", () => {
    expect(strategy).toContain("gap-011");
    expect(strategy).toContain("snapshots visuais devem ser seletivos, pequenos e deterministas");
    expect(strategy).toContain("nao deve adicionar snapshot amplo");
    expect(strategy).toContain("nao:");
    expect(strategy).toContain("adiciona playwright screenshot");
    expect(strategy).toContain("adiciona dependencia visual");
    expect(strategy).toContain("redesenha telas");
  });

  it("keeps first snapshot candidates tied to already documented UI contracts", () => {
    expect(strategy).toContain("dashboard summary acima da dobra");
    expect(strategy).toContain("uma lista financeira primaria");
    expect(strategy).toContain("um formulario financeiro primario");
    expect(strategy).toContain("um estado vazio financeiro");
    expect(strategy).toContain("appactionfeedback");
    expect(strategy).toContain("docs/audits/dashboard_ui_contract.md");
    expect(strategy).toContain("docs/audits/finance_list_ui_contract.md");
    expect(strategy).toContain("docs/audits/finance_form_ui_contract.md");
  });

  it("requires deterministic fixture and update rules before the first snapshot", () => {
    expect(strategy).toContain("superficie unica");
    expect(strategy).toContain("viewport unico inicial");
    expect(strategy).toContain("fixture deterministica");
    expect(strategy).toContain("criterio de atualizacao");
    expect(strategy).toContain("comando local esperado");
    expect(strategy).toContain("evitar dados reais ou secretos");
    expect(strategy).toContain("rollback simples");
  });

  it("keeps roadmap and gap register aligned with snapshot strategy as the next UI gate", () => {
    expect(roadmap).toContain("docs/audits/selective_visual_snapshot_strategy.md");
    expect(roadmap).toContain("estrategia de snapshot visual seletivo");
    expect(roadmap).toContain("dashboard summary acima da dobra");
    expect(roadmap).toContain("proxima superficie visual seletiva");

    expect(gapRegister).toContain("selective visual snapshot strategy, dashboard summary deterministic fixture, gated dashboard summary screenshot, and the first versioned dashboard summary snapshot evidence are covered");
    expect(gapRegister).toContain("use the versioned dashboard summary baseline");
  });

  it("keeps visual token docs pointing to the strategy instead of broad redesign", () => {
    expect(visualTokens).toContain("selective_visual_snapshot_strategy.md");
    expect(visualTokens).toContain("snapshots visuais seletivos");
    expect(visualTokens).toContain("nao substituem contratos de ui");
  });
});
