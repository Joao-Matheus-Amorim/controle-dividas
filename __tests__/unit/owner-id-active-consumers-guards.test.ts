import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

describe("owner_id active consumers inventory guards", () => {
  const inventory = read("docs/audits/OWNER_ID_ACTIVE_CONSUMERS_2026-06-01.md");
  const retirement = read("docs/audits/OWNER_ID_RETIREMENT_INVENTORY_2026-06-01.md");
  const auditsReadme = read("docs/audits/README.md");
  const statusMap = read("docs/DOCUMENTATION_STATUS.md");

  it("records Admin as the active owner-based runtime exception", () => {
    expect(inventory).toContain("admin usa `lib/finance/admin-server.ts`");
    expect(inventory).toContain("consumidor owner-based ativo");
    expect(inventory).toContain("admin/access-control owner_id retirement contract");
    expect(inventory).toContain("nao remove `owner_id`");
  });

  it("keeps migrated protected finance pages away from legacy owner-only helpers", () => {
    const protectedPagesDir = join(process.cwd(), "features/protected-pages");
    const files = readdirSync(protectedPagesDir).filter((file) => file.endsWith(".tsx"));

    for (const file of files) {
      const source = read(`features/protected-pages/${file}`);
      expect(source).not.toContain("@/lib/finance/server");
      expect(source).not.toContain("@/lib/finance/banks-server");
      expect(source).not.toContain("@/lib/finance/reports-server");
    }
  });

  it("keeps admin pages limited to the documented admin-server exception", () => {
    const protectedPagesDir = join(process.cwd(), "features/protected-pages");
    const adminFiles = readdirSync(protectedPagesDir)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => file.startsWith("admin"));

    expect(adminFiles.length).toBeGreaterThan(0);

    for (const file of adminFiles) {
      const source = read(`features/protected-pages/${file}`);
      expect(source).toContain("@/lib/finance/admin-server");
      expect(source).not.toContain("@/lib/finance/server");
      expect(source).not.toContain("@/lib/finance/banks-server");
      expect(source).not.toContain("@/lib/finance/reports-server");
    }
  });

  it("registers the active-consumer inventory in live DocDoc indexes", () => {
    expect(inventory).toContain("status docdoc: atual");
    expect(retirement).toContain("owner_id_active_consumers_2026-06-01.md");
    expect(auditsReadme).toContain("owner_id_active_consumers_2026-06-01.md");
    expect(statusMap).toContain("owner_id_active_consumers_2026-06-01.md");
  });
});
