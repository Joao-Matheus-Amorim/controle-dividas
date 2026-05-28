import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("orgSlug routing contract", () => {
  const adr = read("docs/adr/0007-orgslug-routing-contract.md");
  const adrIndex = read("docs/adr/README.md");
  const roadmap = read("docs/SAAS_OPERATIONAL_ROADMAP.md");
  const architecture = read("docs/ARCHITECTURE.md");

  it("keeps the orgSlug routing ADR indexed", () => {
    expect(adrIndex).toContain("0007-orgslug-routing-contract.md");
    expect(adrIndex).toContain("/org/[orgslug]");
  });

  it("documents the explicit future route prefix and compatibility boundary", () => {
    expect(adr).toContain("# adr 0007");
    expect(adr).toContain("/org/[orgslug]");
    expect(adr).toContain("permanece como rota compativel");
    expect(adr).toContain("nao remove `/protected`");
    expect(adr).toContain("nao cria `app/org/[orgslug]`");
  });

  it("keeps authorization tied to the slug received from the route", () => {
    expect(adr).toContain("slug da url deve ser a fonte primaria");
    expect(adr).toContain("requireorganizationaccess(orgslug)");
    expect(adr).toContain("requireorganizationadmin(orgslug)");
    expect(adr).toContain("getcurrentorganization(orgslug)");
    expect(adr).toContain("slug valido sem membership ativa");
    expect(adr).toContain("slug inexistente");
  });

  it("keeps implementation sequenced before runtime route creation", () => {
    expect(adr).toContain("criar helpers centralizados");
    expect(adr).toContain("criar a primeira rota `/org/[orgslug]`");
    expect(adr).toContain("provar por e2e gated");
    expect(adr).toContain("migrar rotas de modulo em prs pequenos");
    expect(existsSync(join(process.cwd(), "app/org/[orgSlug]/page.tsx"))).toBe(false);
  });

  it("keeps roadmap and architecture aligned with the accepted contract", () => {
    expect(roadmap).toContain("gap-002 - rotas por `orgslug`");
    expect(roadmap).toContain("adr 0007");
    expect(roadmap).toContain("/org/[orgslug]");
    expect(architecture).toContain("adr 0007");
    expect(architecture).toContain("/org/[orgslug]");
    expect(architecture).toContain("permanece como rota compativel");
    expect(architecture).toContain("039_drop_legacy_owner_family_policies.sql");
  });
});
