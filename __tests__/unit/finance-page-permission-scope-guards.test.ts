import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const financePages = [
  "features/protected-pages/gastos-page.tsx",
  "features/protected-pages/contas-a-pagar-page.tsx",
  "features/protected-pages/contas-a-receber-page.tsx",
  "features/protected-pages/bancos-page.tsx",
];

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("finance page permission scope guards", () => {
  it.each(financePages)("uses the active organization profile instead of the global profile in %s", (path) => {
    const source = read(path);

    expect(source).toContain("getCurrentOrganizationProfile");
    expect(source).toContain("organizationContext.membership.role");
    expect(source).not.toContain("getCurrentProfile");
    expect(source).not.toContain("profile.role === \"admin\"");
  });
});
