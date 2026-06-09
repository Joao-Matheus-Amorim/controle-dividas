import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("owner_id retirement inventory guards", () => {
  const inventory = read("docs/audits/OWNER_ID_RETIREMENT_INVENTORY_2026-06-01.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");
  const pmbokPlan = read("docs/audits/PMBOK_GAP_DEBT_CONTROL_PLAN_2026-06-01.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");

  it("keeps G-005 open controlled instead of claiming owner_id can be removed", () => {
    expect(inventory).toContain("g-005 permanece aberto controlado");
    expect(inventory).toContain("owner_id removivel agora");
    expect(inventory).toContain("uso proibido como conclusao");
    expect(inventory).toContain("ele nao remove `owner_id`");
    expect(inventory).toContain("rls live gate verde");
  });

  it("keeps the retirement plan sequenced by gates and domains", () => {
    expect(inventory).toContain("preflight read-only");
    expect(inventory).toContain("migration nova, nunca reescrita de migration antiga");
    expect(inventory).toContain("dominio piloto");
    expect(inventory).toContain("admin/access-control");
    expect(inventory).toContain("read/write path admin e access-control ja versionados organization-first");
    expect(inventory).toContain("schema final");
  });

  it("registers the current inventory in DocDoc and PMBOK sources", () => {
    expect(inventory).toContain("status docdoc: atual");
    expect(inventory).toContain("proximo consumidor de `owner_id` em pr dedicado");
    expect(auditsReadme).toContain("owner_id_retirement_inventory_2026-06-01.md");
    expect(statusMap).toContain("owner_id_retirement_inventory_2026-06-01.md");
    expect(pmbokPlan).toContain("g-005");
    expect(gapRegister).toContain("`owner_id` remains part of the transitional model");
  });
});
