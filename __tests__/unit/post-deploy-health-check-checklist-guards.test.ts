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
  const healthCheck = section(
    checklist,
    "### p1.1 - health check pos-deploy",
    "### p1.2 - rls live gate com evidencia real",
  );

  it("keeps P1.1 status tied to protected-route smoke evidence", () => {
    expect(healthCheck).toContain("status: aberto; sem evidencia de smoke pos-deploy registrada");
    expect(healthCheck).toContain("deploy verde hoje prova build/migration/deploy");
    expect(healthCheck).toContain("criar gate manual ou pos-deploy para smoke de rotas criticas");
    expect(healthCheck).toContain("existe evidencia de smoke pos-deploy para o deploy atual");
  });

  it("does not inherit admin invitation pre-runtime status", () => {
    expect(healthCheck).not.toContain("contrato pre-runtime criado");
    expect(healthCheck).not.toContain("admin_invitation_bootstrap_contract.md");
    expect(healthCheck).not.toContain("admin_email");
    expect(healthCheck).not.toContain("convite/admin");
  });
});
