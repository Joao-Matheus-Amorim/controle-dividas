import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("documentation update rule guards", () => {
  const readme = read("README.md");
  const docsReadme = read("docs/README.md");
  const gapRegister = read("docs/SAAS_GAP_REGISTER.md");
  const architecture = read("docs/ARCHITECTURE.md");

  it("requires living documentation updates for gaps, blocks, and features", () => {
    for (const source of [readme, docsReadme, gapRegister, architecture]) {
      expect(source).toContain("gap");
      expect(source).toContain("bloco");
      expect(source).toContain("funcionalidade");
      expect(source).toContain("documentacao viva");
    }
  });

  it("requires decision records before route or architecture changes reach runtime", () => {
    for (const source of [readme, docsReadme, gapRegister, architecture]) {
      expect(source).toContain("decisao");
      expect(source).toContain("mudanca de rota");
      expect(source).toContain("adr");
      expect(source).toContain("runtime");
    }
  });
});
