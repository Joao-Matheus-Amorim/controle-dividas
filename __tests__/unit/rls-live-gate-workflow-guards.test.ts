import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("RLS Live Gate archival", () => {
  const defaultCi = read(".github/workflows/ci.yml");
  const docs = read("docs/rls/RLS_LIVE_GATE.md");
  const docsIndex = read("docs/rls/README.md");
  const liveStatus = read("docs/SAAS_RLS_LIVE_STATUS.md");

  it("keeps the old gate out of the active workflow set", () => {
    expect(defaultCi).toContain("name: ci");
    expect(defaultCi).not.toContain("run_rls_tests: \"true\"");
    expect(defaultCi).not.toContain("rls_test_supabase_url");
    expect(existsSync(join(process.cwd(), ".github/workflows/rls-live-gate.yml"))).toBe(false);
  });

  it("marks the old gate as historical in the docs", () => {
    expect(docs).toContain("status docdoc: historico");
    expect(docs).toContain("arquivados em 2026-06-26");
    expect(docsIndex).toContain("| `rls_live_gate.md` | historico |");
    expect(liveStatus).toContain("foram removidos em 2026-06-26");
  });
});
